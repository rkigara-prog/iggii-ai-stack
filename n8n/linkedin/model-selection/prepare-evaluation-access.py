"""One-time interactive sudo helper: read-only inventory and temporary Intel render ACLs.

No Docker socket grant, group edits, sudoers edits, service changes, or model execution.
Run without arguments first to inspect the proposed scope. --grant-hours requires sudo.
"""
import argparse
import ctypes
import grp
import json
import os
from pathlib import Path
import pwd
import subprocess
import sys
from datetime import datetime, timezone

ACCOUNT = 'rigarashi'
DEVICES = ['/dev/dri/renderD128', '/dev/dri/renderD129']
BASE = Path('/var/lib/linkedin-model-eval-access')
OUTPUT = Path('/home/rigarashi/.local/share/linkedin-model-selection-20261007/access-inventory.private.json')
ACL_ACCESS = 0x8000
lib = ctypes.CDLL('libacl.so.1', use_errno=True)
lib.acl_get_file.argtypes = [ctypes.c_char_p, ctypes.c_int]
lib.acl_get_file.restype = ctypes.c_void_p
lib.acl_to_text.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
lib.acl_to_text.restype = ctypes.c_void_p
lib.acl_from_text.argtypes = [ctypes.c_char_p]
lib.acl_from_text.restype = ctypes.c_void_p
lib.acl_set_file.argtypes = [ctypes.c_char_p, ctypes.c_int, ctypes.c_void_p]
lib.acl_free.argtypes = [ctypes.c_void_p]

def get_acl(path):
    acl = lib.acl_get_file(path.encode(), ACL_ACCESS)
    if not acl:
        raise OSError(ctypes.get_errno(), path)
    text = lib.acl_to_text(acl, None)
    try:
        return ctypes.string_at(text).decode()
    finally:
        lib.acl_free(text)
        lib.acl_free(acl)

def set_acl(path, text):
    acl = lib.acl_from_text(text.encode())
    if not acl:
        raise OSError(ctypes.get_errno(), 'ACL parse')
    try:
        if lib.acl_set_file(path.encode(), ACL_ACCESS, acl) != 0:
            raise OSError(ctypes.get_errno(), path)
    finally:
        lib.acl_free(acl)

def capture(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=45)
    return {'returncode': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--grant-hours', type=int, choices=range(1, 13))
    args = parser.parse_args()
    user = pwd.getpwnam(ACCOUNT)
    records = []
    for device in DEVICES:
        vendor = (Path('/sys/class/drm') / Path(device).name / 'device/vendor').read_text().strip()
        if vendor != '0x8086':
            raise RuntimeError('Expected Intel render device: ' + device)
        acl = get_acl(device)
        if sorted(acl.strip().splitlines()) != ['group::rw-', 'other::---', 'user::rw-']:
            raise RuntimeError('Existing nontrivial ACL needs individual review: ' + device)
        records.append({'path': device, 'rdev': os.stat(device).st_rdev, 'original': acl,
                        'granted': f'user::rw-\nuser:{user.pw_uid}:rw-\ngroup::rw-\nmask::rw-\nother::---\n'})
    print(json.dumps({'account': ACCOUNT, 'devices': DEVICES, 'changes': 'temporary named-user render ACLs only',
                      'socketAccess': 'unchanged', 'groups': 'unchanged', 'sudoers': 'unchanged',
                      'expiresHours': args.grant_hours}, indent=2))
    if not args.grant_hours:
        return
    if os.geteuid() != 0 or os.environ.get('SUDO_USER') != ACCOUNT:
        raise RuntimeError('Run interactively with sudo as rigarashi; no password is read by this helper')
    BASE.mkdir(mode=0o700, parents=True, exist_ok=True)
    if BASE.is_symlink() or BASE.stat().st_uid != 0 or BASE.stat().st_mode & 0o077:
        raise RuntimeError('Unsafe lease directory')
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    lease = BASE / stamp
    lease.mkdir(mode=0o700)
    (lease / 'acls.json').write_text(json.dumps(records))
    os.chmod(lease / 'acls.json', 0o600)
    # Root-owned restore code contains only this reviewed ACL library and fixed records.
    code = Path(__file__).read_text().split('def capture(args):')[0]
    code += '\nrecords=json.loads((Path(__file__).parent/"acls.json").read_text())\n'
    code += 'for record in records:\n'
    code += '    if record["path"] not in DEVICES: raise RuntimeError("Unexpected device")\n'
    code += '    if os.stat(record["path"]).st_rdev != record["rdev"]: raise RuntimeError("Device identity changed")\n'
    code += '    set_acl(record["path"],record["original"])\n'
    (lease / 'restore.py').write_text(code)
    os.chmod(lease / 'restore.py', 0o600)
    # Establish automatic rollback before granting anything.
    subprocess.run(['/usr/bin/systemd-run', '--unit=linkedin-eval-access-'+stamp.lower(),
                    '--on-active='+str(args.grant_hours)+'h', '/usr/bin/python3', str(lease/'restore.py')], check=True)
    try:
        inventory = {'capturedAt': datetime.now(timezone.utc).isoformat(), 'grantHours': args.grant_hours,
                     'rollbackCommand': 'sudo /usr/bin/python3 '+str(lease/'restore.py'), 'devices': DEVICES}
        inspected = capture(['/usr/bin/docker', 'inspect', 'localai-home-chat', 'localai-comfyui'])
        if inspected['returncode']:
            raise RuntimeError('Read-only Docker inventory failed: '+inspected['stderr'])
        inventory['containers'] = [
            {'name': c['Name'], 'imageId': c['Image'], 'image': c['Config']['Image'],
             'startedAt': c['State']['StartedAt'], 'status': c['State']['Status'],
             'command': c['Config']['Cmd'], 'devices': c['HostConfig']['Devices']}
            for c in json.loads(inspected['stdout'])]
        inventory['runtimeVersions'] = capture(['/usr/bin/docker', 'exec', 'localai-home-chat',
            '/opt/venv/bin/python3', '-c',
            'import importlib.metadata as m,json;print(json.dumps({k:m.version(k) for k in ["vllm","torch","transformers"]}))'])
        inventory['gpuDiscovery'] = capture(['/usr/bin/xpu-smi', 'discovery', '-j'])
        inventory['gpuStats'] = [capture(['/usr/bin/xpu-smi', 'stats', '-d', str(i), '-j']) for i in [0, 1]]
        for record in records:
            set_acl(record['path'], record['granted'])
        fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'w') as f:
            json.dump(inventory, f, indent=2)
        os.chown(OUTPUT, user.pw_uid, user.pw_gid)
    except Exception:
        for record in records:
            set_acl(record['path'], record['original'])
        raise
    print('Ready. Existing Codex session can use the Intel render devices immediately.')
    print('Private read-only inventory: '+str(OUTPUT))
    print('Early rollback: sudo /usr/bin/python3 '+str(lease/'restore.py'))

if __name__ == '__main__':
    main()
