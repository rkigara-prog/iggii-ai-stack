"""Serial local-only evaluation queue. Evidence, gold and responses never enter Git."""
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import ipaddress
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

from prompts import ASSESSMENT, RANKING, WRITING


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False))
    path.chmod(0o600)


def get_json(url, headers=None):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=10) as r:
        return json.load(r)


def idle(base, comfy):
    with urllib.request.urlopen(base + '/metrics', timeout=10) as r:
        metrics = r.read().decode()
    for name in ('num_requests_running', 'num_requests_waiting'):
        values = re.findall(r'^vllm:' + name + r'\{[^\n]*\}\s+(\S+)', metrics, re.M)
        if not values or any(float(v) != 0 for v in values):
            return False, metrics
    q = get_json(comfy + '/queue')
    return not q['queue_running'] and not q['queue_pending'], metrics


def call(base, auth, model, prompt, packet, max_tokens):
    body = dict(model=model, temperature=0, seed=7107, stream=False,
                max_tokens=max_tokens, response_format={'type': 'json_object'},
                chat_template_kwargs={'enable_thinking': False},
                messages=[{'role': 'system', 'content': prompt},
                          {'role': 'user', 'content': json.dumps(packet, ensure_ascii=False)}])
    req = urllib.request.Request(base + '/v1/chat/completions', data=json.dumps(body).encode(),
                                 headers={'Authorization': 'Bearer ' + auth,
                                          'Content-Type': 'application/json'})
    started = time.monotonic()
    with urllib.request.urlopen(req, timeout=180) as r:
        reply = json.load(r)
    return reply, round(time.monotonic() - started, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--private-root', type=Path, required=True)
    ap.add_argument('--base', default='http://192.168.113.32:8000')
    ap.add_argument('--comfy', default='http://192.168.113.32:8188')
    ap.add_argument('--model', default='home-chat')
    ap.add_argument('--phase', choices=['assessment', 'ranking', 'writing'], required=True)
    ap.add_argument('--ranking-order', choices=['original', 'reversed'], default='original')
    args = ap.parse_args()
    # Intentionally prohibit an external host, even for a public packet.
    for url in [args.base, args.comfy]:
        host = urllib.parse.urlsplit(url).hostname
        if not host or not ipaddress.ip_address(host).is_private:
            raise ValueError('Only literal private LAN endpoints are permitted')
    root = args.private_root.resolve()
    repo = Path(__file__).resolve().parents[3]
    if root == repo or repo in root.parents:
        raise ValueError('Evidence must stay outside the Git checkout')
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    lock = (root / 'evaluation.lock').open('w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    frozen = json.loads((root / 'packets.private.json').read_text())
    seal = json.loads((root / 'freeze.private.json').read_text())
    if digest(frozen) != seal['packet_sha256']:
        raise ValueError('Frozen evidence changed')
    auth = json.loads((root / 'auth.private.json').read_text())['HOME_CHAT_API_KEY']
    models = get_json(args.base + '/v1/models', {'Authorization': 'Bearer ' + auth})
    if args.model not in {m['id'] for m in models['data']}:
        raise ValueError('Model not in live inventory')
    out = root / 'responses'
    out.mkdir(mode=0o700, exist_ok=True)
    if args.phase == 'assessment':
        tasks = [(arm, c['id'], ASSESSMENT[arm], c, 650)
                 for c in frozen for arm in ['baseline', 'grounded']]
    elif args.phase == 'ranking':
        gold = json.loads((root / 'gold.private.json').read_text())
        eligible = [c for c in frozen if gold[c['id']]['decision'] == 'accept']
        if args.ranking_order == 'reversed':
            eligible.reverse()
        # Identical order and packets across arms, ranking isolated from assessment.
        label = 'portfolio' if args.ranking_order == 'original' else 'portfolio-reversed'
        tasks = [(arm, label, RANKING + ("Use source titles and descriptions for evidence."
                  if arm == 'baseline' else "Read page passages as authority; preserve scoped decisions."),
                  eligible, 900) for arm in ['baseline', 'grounded']]
    else:
        ids = json.loads((root / 'writing-selection.private.json').read_text())
        tasks = [(arm, c['id'], WRITING[arm], c, 1100)
                 for c in frozen if c['id'] in ids for arm in ['baseline', 'grounded']]
    for arm, cid, prompt, packet, limit in tasks:
        name = f'{args.phase}-{arm}-{cid}'
        target = out / (name + '.json')
        if target.exists():
            continue
        wait_start = time.monotonic()
        while True:
            ready, metrics = idle(args.base, args.comfy)
            if ready:
                break
            print('Queue paused: household inference or image work active', flush=True)
            time.sleep(15)
        record = {'phase': args.phase, 'arm': arm, 'case_id': cid, 'model': args.model,
                  'packet_sha256': digest(packet), 'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest(),
                  'startedAt': datetime.now(timezone.utc).isoformat(),
                  'queue_wait_seconds': round(time.monotonic() - wait_start, 3),
                  'pre_metrics': metrics}
        # No automatic response repair or silent transport retries.
        try:
            reply, latency = call(args.base, auth, args.model, prompt, packet, limit)
            record.update(reply=reply, latency_seconds=latency)
            choice = reply['choices'][0]
            record['parsed'] = json.loads(choice['message']['content'])
            parsed = record['parsed']
            if args.phase == 'ranking':
                ids = parsed.get('ranked_ids', [])
                if not isinstance(ids, list) or len(ids) != len(packet) or set(ids) != {p['id'] for p in packet}:
                    raise ValueError('Ranking schema/coverage invalid')
            elif args.phase == 'writing':
                if not isinstance(parsed.get('draft'), str) or not parsed['draft'].strip() or not isinstance(parsed.get('claims'), list):
                    raise ValueError('Writing schema invalid')
            elif parsed.get('decision') not in ['accept', 'reject', 'defer'] or not isinstance(parsed.get('claims'), list):
                raise ValueError('Assessment schema invalid')
            record['complete'] = choice['finish_reason'] == 'stop'
        except Exception as exc:
            record['error_category'] = type(exc).__name__
        save(target, record)
        print(name, 'complete' if record.get('complete') else 'failed',
              record.get('latency_seconds', ''), flush=True)
        time.sleep(3)  # Offer other services the next scheduling opportunity.


if __name__ == '__main__':
    main()
