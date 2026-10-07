"""Build public/synthetic blind review copies outside Git, with a separate key."""
import argparse
import csv
import json
from pathlib import Path
import random


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--private-root', type=Path, required=True)
    ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args()
    repo = Path(__file__).resolve().parents[3]
    if args.output.resolve() == repo or repo in args.output.resolve().parents:
        raise ValueError('Drafts and evidence cannot enter Git')
    root, out = args.private_root, args.output
    out.mkdir(mode=0o700, parents=True, exist_ok=True)
    packets = {p['id']: p for p in json.loads((root / 'packets.private.json').read_text())}
    gold = json.loads((root / 'gold.private.json').read_text())
    edits = json.loads((root / 'writing-review.private.json').read_text())
    rng = random.Random(1072026)
    samples, key, ids = [], [], []
    evidence_sources = {}
    for number, cid in enumerate(['R01', 'S11', 'S21'], 1):
        packet = packets[cid]
        if 'private_context' in packet:
            raise ValueError('Privacy packet cannot be shared')
        arms = ['baseline', 'grounded']
        rng.shuffle(arms)
        samples.append(f'## Draft pair {number}\n\n**EVALUATION OUTPUTS — DO NOT PUBLISH.** '
                       + ('Public retained-source scenario.' if cid.startswith('R') else 'Synthetic hypothetical scenario, not an actual event.'))
        for label, arm in zip(['A', 'B'], arms):
            bid = f'D{number}{label}'
            ids.append(bid)
            record = json.loads((root / 'responses' / f'writing-{arm}-{cid}.json').read_text())
            if not record.get('complete'):
                raise ValueError('Incomplete draft cannot be presented as complete')
            draft = record['parsed']['draft']
            samples.append(f'### {bid}\n\n{draft}')
            key.append(f'## {bid}: home-chat / {arm} writing instructions\n\nCase {cid}. '
                       'The draft is deliberately unedited. Provisional Codex judgments (not measured human effort):\n\n'
                       + '\n'.join('- ' + e for e in edits[f'{arm}-{cid}']['required_edits']))
        for source in packet['sources']:
            evidence_sources[source['id']] = source
    samples.append('## Evidence-assessment comparison\n\nThe following anonymous decisions '
                   'use identical packets. Score claim support separately from whether the topic qualifies.')
    for number, cid in enumerate(['S12', 'S43', 'S21'], 1):
        packet = packets[cid]
        samples.append(f'### Assessment pair {number}\n\nSynthetic hypothetical candidate: '
                       + packet['claims'][0]['text'])
        arms = ['baseline', 'laya']
        rng.shuffle(arms)
        for label, arm in zip(['A', 'B'], arms):
            bid = f'E{number}{label}'
            ids.append(bid)
            r = json.loads((root / 'responses' / f'assessment-{arm}-{cid}.json').read_text())
            if not r.get('complete'):
                raise ValueError('Runtime-blocked assessment cannot be compared blindly')
            decision = r['parsed']['decision']
            supported = r['parsed']['claims'][0]['supported']
            samples.append(f'**{bid}:** decision `{decision}`; claim supported `{str(supported).lower()}`.')
            key.append(f'## {bid}: {"home-chat baseline" if arm == "baseline" else "Laya CPU typed-decisions"}\n\n'
                       f'Case {cid}; expected decision `{gold[cid]["decision"]}`. {gold[cid]["reason"]}')
        for source in packet['sources']:
            evidence_sources[source['id']] = source
    (out / 'Blind-Review.md').write_text('# Blind content-quality comparison\n\n' + '\n\n'.join(samples) + '\n')
    (out / 'Answer-Key.md').write_text('# Answer key — open after independent scoring\n\n'
                                     + '\n\n'.join(key) + '\n')
    # Keep publication extracts compact. Full raw pages and exact packet passages
    # remain in the private run root. Excerpts are independently selected before export.
    excerpts = json.loads((root / 'review-excerpts.private.json').read_text())
    lines = ['# Source evidence and claim map', '',
             'Public/synthetic evidence only. No model identities are shown here. '
             'Read this alongside the blind samples; open Answer-Key.md afterwards.']
    for sid, source in evidence_sources.items():
        lines += ['', '## ' + sid, '', 'URL: ' + source['url'],
                  'Publisher: ' + str(source['publisher']),
                  'Publication: ' + str(source['published_at']),
                  'Retrieved: ' + source['retrieved_at'],
                  'Evidence origin: ' + source['evidence_origin'], '',
                  'Stipulated synthetic evidence.' if source['synthetic'] else 'Retained public page excerpts.']
        for passage in excerpts.get(sid, [source['page_passages']] if source['synthetic'] else []):
            if ' '.join(passage.split()) not in ' '.join(source['page_passages'].split()):
                raise ValueError('Review excerpt is not in frozen page text')
            lines += ['', '> ' + passage.replace('\n', '\n> ')]
    for cid in ['R01', 'S11', 'S21', 'S12', 'S43']:
        packet = packets[cid]
        lines += ['', '## Claim map: ' + cid, '', packet['claims'][0]['text'], '',
                  'Supplied source IDs: ' + ', '.join(s['id'] for s in packet['sources'])]
    (out / 'Evidence.md').write_text('\n'.join(lines) + '\n')
    with (out / 'Score-Sheet.csv').open('w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['reviewer', 'sample_id', 'factual_support_0_5', 'citation_authority_0_5',
                         'independent_corroboration_0_5', 'qualifiers_0_5', 'editorial_usefulness_0_5',
                         'style_0_5', 'revision_minutes', 'changed_sentences', 'accept_reject_defer', 'notes'])
        for bid in ids:
            writer.writerow(['', bid] + [''] * 10)
    (out / 'README.md').write_text('''# LinkedIn blind review

These are EVALUATION OUTPUTS, not approved drafts. Synthetic events must never be published.

Robert and Leigh: each copy Score-Sheet.csv to a file named for yourselves. Read
[Blind-Review.html](Blind-Review.html) alongside [Evidence.html](Evidence.html),
without opening [Answer-Key.html](Answer-Key.html).
Score independently from 0 (unusable) to 5 (ready for human approval). For each draft,
make the minimum edits needed to remove unsupported claims, fix citations and produce
useful prose. Save edits in Robert-Edits.md or Leigh-Edits.md here. Record actual editing
minutes and changed sentences; a declined draft may be marked rewrite-required.

There are three writing pairs and three short evidence-assessment pairs. Assessments
should reject false claims and defer when independent evidence is insufficient.
After scoring, open Answer-Key.md for model/instruction identities, expected decisions
and provisional Codex correction judgments. Discuss disagreements against Evidence.md.

These review files are human records. The active n8n pipeline does not consume them.
No publication, automation approval or model deployment occurs from these files.
''')
    # Offline HTML: no remote assets/scripts and no hidden model metadata.
    import markdown
    for name in ['Blind-Review', 'README', 'Evidence', 'Answer-Key']:
        body = markdown.markdown((out / (name + '.md')).read_text(), extensions=['tables'])
        page = ('<!doctype html><html lang="en"><meta charset="utf-8"><title>LinkedIn evaluation review</title>'
                '<style>body{font:18px/1.55 system-ui;max-width:1000px;margin:40px auto;padding:20px}'
                'h2{border-top:2px solid #555;padding-top:24px}h3{color:#234}code{font-size:.9em}'
                '@media print{h2{break-before:page}}</style><body>' + body + '</body></html>')
        (out / (name + '.html')).write_text(page)
    for f in out.iterdir():
        f.chmod(0o600)
    print('Blind samples, separate answer key and evidence map generated outside Git')


if __name__ == '__main__':
    main()
