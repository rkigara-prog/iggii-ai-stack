"""Disabled-by-default, one-request Gemma pilot worker. No production fallback."""
import argparse
import base64
import ctypes
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request

HERE = Path(__file__).resolve().parent
CONFIG = json.loads((HERE / 'runtime.json').read_text())
EVALUATION = Path('/home/rigarashi/.local/share/linkedin-model-selection-20261007')
STATE = Path('/home/rigarashi/.local/share/linkedin-gemma-pilot')
PARENT_PID = os.getpid()
LIBC = ctypes.CDLL(None, use_errno=True)
sys.path.insert(0, str(HERE.parent / 'model-selection'))
from run import snapshot, prior_namespace, save


def parent_death_guard():
    # Linux: a dead/crashed SSH worker must not leave an orphan GPU allocation.
    # Called before the monitor thread exists; retained across exec into llama-server.
    if LIBC.prctl(1, signal.SIGKILL, 0, 0, 0) != 0 or os.getppid() != PARENT_PID:
        os._exit(125)


def interrupted(signum, frame):
    raise RuntimeError('Pilot worker interrupted; unload owned server')


def activation(now=None):
    path = STATE / 'activation.json'
    if not path.is_file() or path.is_symlink():
        raise RuntimeError('Pilot is disabled; review decision and bounded access required')
    st = path.stat()
    if st.st_uid != os.getuid() or st.st_mode & 0o077:
        raise RuntimeError('Activation file must be owned by this user and private')
    value = json.loads(path.read_text())
    if value.get('enabled') is not True or not isinstance(value.get('expiresAt'), str):
        raise RuntimeError('Pilot is disabled; explicit bounded activation required')
    current = time.time() if now is None else now
    expiry = datetime.fromisoformat(value['expiresAt']).timestamp()
    if (value.get('enabled') is not True or value.get('approvedBy') not in ['Robert', 'Leigh']
            or value.get('artifactSha256') != CONFIG['sha256'] or not current + 60 < expiry <= current + 7200):
        raise RuntimeError('Pilot disabled, expired, or missing bounded activation decision')
    return expiry - 60


def contract(mode, value):
    node = json.loads((HERE / 'node-runtime.json').read_text())['binary']
    result = subprocess.run([node, str(HERE / 'contract.cjs'), mode],
                            input=json.dumps(value), text=True, capture_output=True, timeout=20)
    if result.returncode:
        raise RuntimeError('Evidence/approval/output contract failed; inspect local packet')
    return json.loads(result.stdout)


def resource_guard(sample, baseline=None):
    rows = {r['device']: r for r in sample['gpu']}
    used = [rows[i]['XPUM_STATS_MEMORY_USED'] for i in [0, 1]]
    available = int(next(v.split()[1] for v in Path('/proc/meminfo').read_text().splitlines()
                         if v.startswith('MemAvailable:'))) / 1024**2
    free = CONFIG['gpu0TotalMiB'] - used[0]
    if baseline is None:
        if (free < CONFIG['maxAdditionalGpu0MiB'] + CONFIG['minimumFreeGpu0MiB']
                or available < CONFIG['minimumBeforeLoadRamGiB']):
            raise RuntimeError('Insufficient headroom before loading; do not evict production')
    elif (used[0] - baseline[0] > CONFIG['maxAdditionalGpu0MiB']
          or used[1] - baseline[1] > CONFIG['maxGpu1GrowthMiB']
          or free < CONFIG['minimumFreeGpu0MiB']
          or available < CONFIG['minimumAvailableRamGiB']):
        raise RuntimeError('Resource guard: stop only pilot')
    return used


def idle():
    return prior_namespace['idle']('http://192.168.113.32:8000', 'http://192.168.113.32:8188')[0]


def http(path, body=None, timeout=10):
    req = urllib.request.Request('http://127.0.0.1:8017' + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def command():
    return [str(EVALUATION / 'llama-build/bin/llama-server'), '--model',
            str(EVALUATION / 'models' / CONFIG['artifact']), '--alias', CONFIG['modelAlias'],
            '--host', '127.0.0.1', '--port', '8017', '--ctx-size', str(CONFIG['context']),
            '--parallel', '1', '--threads', '4', '--threads-batch', '4', '--batch-size', '256',
            '--ubatch-size', '128', '--n-gpu-layers', '24', '--split-mode', 'none', '--main-gpu', '0',
            '--fit', 'off', '--no-context-shift', '--jinja', '--reasoning-format', 'deepseek', '--no-webui']


def run(packet):
    deadline = min(activation(), time.time() + CONFIG['jobWallSeconds'])
    body = contract('request', packet)
    packet_hash = contract('digest', packet)
    STATE.mkdir(mode=0o700, exist_ok=True)
    if STATE.is_symlink() or STATE.stat().st_mode & 0o077:
        raise RuntimeError('Unsafe private pilot directory')
    with (STATE / 'worker.lock').open('a') as lock, (EVALUATION / 'frozen/comparison.lock').open('a') as comparison:
        for f in [lock, comparison]:
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        dest = STATE / (packet['requestId'] + '.json')
        if dest.exists():
            saved = json.loads(dest.read_text())
            if saved['packetSha256'] != packet_hash:
                raise RuntimeError('Request ID already used for different evidence')
            return saved  # Errors/incomplete answers also remain immutable. Never silently retry.
        started = time.time()
        record = {'requestId': packet['requestId'], 'packetSha256': packet_hash,
                  'status': 'reserved', 'model': CONFIG['modelAlias'], 'artifactSha256': CONFIG['sha256'],
                  'startedAt': datetime.now(timezone.utc).isoformat(), 'inferenceAttempted': False}
        save(dest, record)
        save(STATE / (packet['requestId'] + '.packet.json'), packet)
        proc = None
        monitor = None
        stop = threading.Event()
        reasons = []
        log = None

        def terminate():
            if proc and proc.poll() is None:
                try:
                    os.killpg(proc.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass

        def guard():
            while not stop.is_set():
                try:
                    activation()
                    if time.time() >= deadline:
                        raise RuntimeError('Pilot/access deadline')
                    if not os.access('/dev/dri/renderD128', os.R_OK | os.W_OK):
                        raise RuntimeError('Temporary device access unavailable')
                    resource_guard(snapshot(proc.pid), baseline)
                    if not idle():
                        raise RuntimeError('Yield to household/OMC/image work')
                except Exception as error:
                    reasons.append(str(error))
                    terminate()
                    return
                stop.wait(CONFIG['pollSeconds'])

        try:
            while not idle():
                activation()
                if time.time() - started >= CONFIG['queueWaitSeconds'] or time.time() >= deadline:
                    raise RuntimeError('Queue wait expired without inference')
                time.sleep(CONFIG['pollSeconds'])
            if not os.access('/dev/dri/renderD128', os.R_OK | os.W_OK):
                raise RuntimeError('Temporary device access required; no self-grant')
            baseline = resource_guard(snapshot(None))
            weights = EVALUATION / 'models' / CONFIG['artifact']
            if weights.stat().st_size != CONFIG['bytes']:
                raise RuntimeError('Wrong Gemma artifact size')
            with weights.open('rb') as f:
                if hashlib.file_digest(f, 'sha256').hexdigest() != CONFIG['sha256']:
                    raise RuntimeError('Wrong Gemma artifact digest')
            with socket.socket() as probe:
                if probe.connect_ex(('127.0.0.1', 8017)) == 0:
                    raise RuntimeError('Port already occupied; never attach to an unknown server')
            activation()
            if not idle():
                raise RuntimeError('Household activity before load; defer')
            log = (STATE / (packet['requestId'] + '.server.log')).open('x')
            os.chmod(log.name, 0o600)
            proc = subprocess.Popen(
                ['/bin/bash', '-c', 'source /opt/intel/oneapi/setvars.sh >/dev/null 2>&1; exec "$@"',
                 'pilot', 'nice', '-n', '10'] + command(),
                env=dict(os.environ, ONEAPI_DEVICE_SELECTOR='level_zero:0'),
                stdout=log, stderr=subprocess.STDOUT, start_new_session=True,
                preexec_fn=parent_death_guard)
            monitor = threading.Thread(target=guard, daemon=True)
            monitor.start()
            ready_until = min(deadline, time.time() + 600)
            while time.time() < ready_until:
                if proc.poll() is not None or reasons:
                    raise RuntimeError('Pilot server stopped before readiness')
                try:
                    if http('/health').get('status') == 'ok':
                        break
                except (OSError, ValueError):
                    pass
                time.sleep(2)
            else:
                raise RuntimeError('Server readiness timeout')
            # Template/tokenizer endpoints perform no generation. Never trim evidence to fit.
            prompt = http('/apply-template', body)['prompt']
            tokens = http('/tokenize', {'content': prompt, 'add_special': True, 'parse_special': True})['tokens']
            record['promptTokensBeforeGeneration'] = len(tokens)
            if len(tokens) + CONFIG['maxOutputTokens'] + CONFIG['contextSafetyTokens'] > CONFIG['context']:
                raise RuntimeError('Evidence exceeds context; defer without shortening')
            activation()
            if reasons or not idle():
                raise RuntimeError('Household work takes priority before generation')
            record['inferenceAttempted'] = True
            save(dest, record)
            record['reply'] = http('/v1/chat/completions', body, CONFIG['transportTimeoutSeconds'])
            record['status'] = 'response'
            # Always review the whole prose; the worker cannot publish or approve it.
            record['review'] = contract('result', {'packet': packet, 'record': record})
        except Exception as error:
            record.update(status='blocked', errorType=type(error).__name__, reason=str(error), guardReasons=reasons)
        finally:
            stop.set()
            terminate()
            if proc:
                try:
                    proc.wait(timeout=20)
                except subprocess.TimeoutExpired:
                    os.killpg(proc.pid, signal.SIGKILL)
                    proc.wait()
            if monitor:
                monitor.join(timeout=50)
            if log:
                log.close()
            record.update(elapsedSeconds=round(time.time()-started, 3), serverStopped=proc is None or proc.poll() is not None)
            save(dest, record)
        return record


def main():
    os.umask(0o077)
    signal.signal(signal.SIGHUP, signal.SIG_IGN)  # SSH loss does not remove our deadline monitor.
    signal.signal(signal.SIGTERM, interrupted)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ssh', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--disable', action='store_true')
    args = parser.parse_args()
    if args.ssh and os.environ.get('SSH_ORIGINAL_COMMAND') != 'linkedin-gemma-pilot':
        raise RuntimeError('Only the forced pilot command is permitted')
    if args.disable:
        path = STATE / 'activation.json'
        if path.exists():
            value = json.loads(path.read_text()); value['enabled'] = False; save(path, value)
        print('{"pilotDisabled":true,"productionChanges":false}')
        return
    if not args.check_only:
        activation()  # Fail closed before accepting input/loading weights/network activity.
    raw = sys.stdin.buffer.read(CONFIG['maxPacketBytes'] * 2 + 1)
    if len(raw) > CONFIG['maxPacketBytes'] * 2:
        raise RuntimeError('Oversize transport packet')
    packet = json.loads(base64.b64decode(raw, validate=True) if args.ssh else raw)
    if args.check_only:
        contract('request', packet)
        print('{"contractPassed":true,"modelCalls":0,"modelLoaded":false}')
    else:
        print(json.dumps(run(packet)))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'status': 'blocked', 'errorType': type(error).__name__, 'reason': str(error)}))
        sys.exit(1)
