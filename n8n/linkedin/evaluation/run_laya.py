"""Pinned CPU-only Laya comparison. Explicitly record truncation as a runtime defect."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import resource
import time

from decision_models import adapt, questions
from run import digest, save

REVISION = 'e929ae5cf69bc34259cd2f95c9e91145b818b1f0'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--private-root', type=Path, required=True)
    ap.add_argument('--phase', choices=['assessment', 'ranking'], default='assessment')
    args = ap.parse_args()
    root = args.private_root
    repo = Path(__file__).resolve().parents[3]
    if root.resolve() == repo or repo in root.resolve().parents:
        raise ValueError('Private evidence must be outside Git')
    os.environ['CUDA_VISIBLE_DEVICES'] = ''
    os.environ['OMP_NUM_THREADS'] = '2'
    os.environ['MKL_NUM_THREADS'] = '2'
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.nice(10)
    import torch
    import laya
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    started = time.monotonic()
    model = laya.load(str(root / 'laya-model'), device='cpu', backend='eager')
    load_seconds = time.monotonic() - started
    packets = json.loads((root / 'packets.private.json').read_text())
    seal = json.loads((root / 'freeze.private.json').read_text())
    assert digest(packets) == seal['packet_sha256']
    if args.phase == 'ranking':
        gold = json.loads((root / 'gold.private.json').read_text())
        packets = [p for p in packets if gold[p['id']]['decision'] == 'accept']
    for packet in packets:
        target = root / 'responses' / f'{args.phase}-laya-{packet["id"]}.json'
        if target.exists():
            continue
        qs = questions(packet)
        if args.phase == 'ranking':
            qs = {'editorial_priority': qs['editorial_priority']}
        record = {'model': 'convaiinnovations/laya-typed-decisions', 'revision': REVISION,
                  'phase': args.phase, 'arm': 'laya', 'case_id': packet['id'],
                  'packet_sha256': digest(packet), 'questions_sha256': digest(qs),
                  'device': 'cpu', 'threads': 2, 'load_seconds': load_seconds,
                  'laya_version': laya.__version__, 'torch_version': torch.__version__}
        begin = time.monotonic()
        try:
            reply = model.predict(packet, qs)
            parsed = adapt(packet, reply) if args.phase == 'assessment' else {
                'editorial_score': reply['answers']['editorial_priority']['score'] * 25}
            record.update(typed_reply=reply, parsed=parsed,
                          latency_seconds=round(time.monotonic() - begin, 3), complete=True)
            if reply.get('usage', {}).get('truncated'):
                record.update(complete=False, runtime_defect='context_truncation')
        except Exception as exc:
            record.update(error_category=type(exc).__name__, complete=False)
        record['peak_rss_kib'] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        save(target, record)
        print(packet['id'], 'complete' if record['complete'] else 'runtime blocked', flush=True)
        time.sleep(.1)


if __name__ == '__main__':
    main()
