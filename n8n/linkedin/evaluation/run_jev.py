"""Optional authorized Jev calls: approved public subset only, bounded spending."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import stat
import time
import urllib.request

from decision_models import adapt, questions
from run import digest, save


def public_subset(packet):
    # Exclude even synthetic privacy/injection packets. Do not strip and silently
    # alter a packet: compared models must receive identical frozen packet data.
    return 'private_context' not in packet and all(
        not any(term in s['page_passages'] for term in ['private_context', 'PRIVATE CANARY'])
        for s in packet['sources'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--private-root', type=Path, required=True)
    ap.add_argument('--authorized-max-dollars', type=float, required=True)
    args = ap.parse_args()
    root = args.private_root.resolve()
    repo = Path(__file__).resolve().parents[3]
    if root == repo or repo in root.parents:
        raise ValueError('Evidence and credentials must stay outside Git')
    if args.authorized_max_dollars <= 0:
        raise ValueError('Positive explicit account budget required')
    key_file = root / 'jev-api-key'
    if stat.S_IMODE(key_file.stat().st_mode) != 0o600 or key_file.stat().st_uid != os.getuid():
        raise ValueError('API key must be an owned mode-600 file')
    key = key_file.read_text().strip()
    frozen = json.loads((root / 'packets.private.json').read_text())
    seal = json.loads((root / 'freeze.private.json').read_text())
    assert digest(frozen) == seal['packet_sha256']
    # Pricing checked from official model record, Oct 7 2026. The provider bills
    # input only. Bound conservatively by UTF-8 bytes (not a tokenizer estimate).
    rate_per_token = .042 / 1_000_000
    spent_bound = 0
    for packet in frozen:
        if not public_subset(packet):
            continue
        target = root / 'responses' / f'assessment-jev-{packet["id"]}.json'
        if target.exists():
            old = json.loads(target.read_text())
            spent_bound += old['cost_upper_bound_dollars']
            continue
        qs = questions(packet)
        body = {'model': 'jev-1.13.0', 'state': packet, 'questions': qs}
        raw = json.dumps(body, ensure_ascii=False).encode()
        upper = (len(raw) + 4096) * rate_per_token  # extra reserve for provider framing
        if spent_bound + upper > args.authorized_max_dollars:
            raise RuntimeError('Authorized spending bound reached; no further calls made')
        record = {'phase': 'assessment', 'arm': 'jev', 'case_id': packet['id'],
                  'packet_sha256': digest(packet), 'questions_sha256': digest(qs),
                  'cost_upper_bound_dollars': upper,
                  'startedAt': datetime.now(timezone.utc).isoformat()}
        req = urllib.request.Request('https://api.typesafe.ai/v1/systemone', data=raw,
                                     headers={'Authorization': 'Bearer ' + key,
                                              'Content-Type': 'application/json'})
        start = time.monotonic()
        # No automatic retries: a transport failure might still have been billed.
        spent_bound += upper
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                reply = json.load(response)
            record.update(typed_reply=reply, parsed=adapt(packet, reply), complete=True,
                          latency_seconds=round(time.monotonic() - start, 3))
            if reply['model'] != 'jev-1.13.0':
                raise ValueError('Unpinned model response')
        except Exception as exc:
            record.update(error_category=type(exc).__name__, complete=False)
            save(target, record)
            raise RuntimeError('Jev call failed; credential/transport details remain private') from None
        save(target, record)
        print(packet['id'], 'complete', record['latency_seconds'], flush=True)


if __name__ == '__main__':
    main()
