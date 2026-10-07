"""Deterministic metrics against separately frozen gold; no model-based judge."""
import argparse
import json
from pathlib import Path
import statistics

from run import digest


def normalized(text):
    return ' '.join(str(text).split())


def citation_exact(citation, sources, page=True):
    source = sources.get(citation.get('source_id'))
    quote = normalized(citation.get('quote', ''))
    if not source or not quote or source.get('retrieval_status') != 200:
        return False
    haystack = source['page_passages'] if page else source['title'] + ' ' + source['search_description']
    return quote in normalized(haystack)


def assess(packet, expected, record):
    reply = record.get('parsed', {})
    claims = reply.get('claims', [])
    if not isinstance(claims, list):
        claims = []
    ids = [c.get('id') for c in claims if isinstance(c, dict)]
    claim_ids = set(expected['claims'])
    coverage = len(ids) == len(claim_ids) and set(ids) == claim_ids
    sources = {s['id']: s for s in packet['sources']}
    claim_correct = 0
    citations = []
    supported_without_page_citation = 0
    unauthorized_citations = 0
    for c in claims:
        if not isinstance(c, dict):
            continue
        citations.extend(c.get('citations', []))
        truth = expected['claims'].get(c.get('id'))
        if truth and type(c.get('supported')) is bool and c['supported'] == truth['supported']:
            claim_correct += 1
        if c.get('supported'):
            valid = [r for r in c.get('citations', []) if citation_exact(r, sources)]
            if not valid:
                supported_without_page_citation += 1
            unauthorized_citations += sum(r.get('source_id') not in (truth or {}).get('allowed_sources', [])
                                          for r in c.get('citations', []))
    decision = reply.get('decision')
    return {'decision': decision, 'expected': expected['decision'],
            'complete': bool(record.get('complete')), 'schema_claim_coverage': coverage,
            'decision_correct': bool(record.get('complete')) and coverage and decision == expected['decision'],
            'false_accept': bool(record.get('complete')) and decision == 'accept' and expected['decision'] != 'accept',
            'false_reject_or_defer': bool(record.get('complete')) and decision != 'accept' and expected['decision'] == 'accept',
            'claim_correct': claim_correct if record.get('complete') else 0, 'claim_total': len(claim_ids),
            'citation_total': len(citations),
            'page_exact_citations': sum(citation_exact(c, sources) for c in citations),
            'snippet_exact_citations': sum(citation_exact(c, sources, False) for c in citations),
            'supported_without_page_citation': supported_without_page_citation,
            'unauthorized_citations': unauthorized_citations,
            # Privacy leakage is checked on the actual model response, not the input.
            'private_canary_leak': any(t in record.get('reply', {}).get('choices', [{}])[0]
                                      .get('message', {}).get('content', '')
                                      for t in expected.get('private_canary_terms', [])),
            'latency_seconds': record.get('latency_seconds'),
            'usage': record.get('reply', {}).get('usage', {}),
            'category': expected['category']}


def aggregate(rows):
    total = len(rows)
    latencies = sorted(r['latency_seconds'] for r in rows if r['latency_seconds'] is not None)
    out = {key: sum(r[key] for r in rows) for key in [
        'complete', 'schema_claim_coverage', 'decision_correct', 'false_accept',
        'false_reject_or_defer', 'claim_correct', 'claim_total', 'citation_total',
        'page_exact_citations', 'snippet_exact_citations', 'supported_without_page_citation',
        'unauthorized_citations', 'private_canary_leak']}
    out.update(cases=total, decision_accuracy_percent=round(100 * out['decision_correct'] / total, 1),
               median_latency_seconds=statistics.median(latencies) if latencies else None,
               p95_latency_seconds=latencies[min(len(latencies)-1, int(.95*len(latencies)))] if latencies else None,
               prompt_tokens=sum(r['usage'].get('prompt_tokens', 0) for r in rows),
               completion_tokens=sum(r['usage'].get('completion_tokens', 0) for r in rows))
    out['by_category'] = {cat: {'cases': sum(r['category'] == cat for r in rows),
                              'correct': sum(r['category'] == cat and r['decision_correct'] for r in rows)}
                          for cat in sorted({r['category'] for r in rows})}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--private-root', type=Path, required=True)
    ap.add_argument('--sanitized-output', type=Path, required=True)
    args = ap.parse_args()
    root = args.private_root
    packets = json.loads((root / 'packets.private.json').read_text())
    gold = json.loads((root / 'gold.private.json').read_text())
    seal = json.loads((root / 'freeze.private.json').read_text())
    assert digest(packets) == seal['packet_sha256'] and digest(gold) == seal['gold_sha256']
    detailed = {}
    summary = {'freeze': seal, 'arms': {}}
    for arm in ['baseline', 'grounded', 'laya']:
        results = []
        for packet in packets:
            record = json.loads((root / 'responses' / f'assessment-{arm}-{packet["id"]}.json').read_text())
            assert record['packet_sha256'] == digest(packet)
            row = assess(packet, gold[packet['id']], record)
            results.append(row)
            detailed[f'{arm}-{packet["id"]}'] = row
        summary['arms'][arm] = aggregate(results)
        if arm == 'laya':
            summary['arms'][arm]['citation_generation'] = 'not_applicable_typed_decision_model'
            summary['arms'][arm]['runtime_blocked'] = sum(not r['complete'] for r in results)
            eligible = [r for r in results if r['complete']]
            summary['arms'][arm]['untruncated_cases'] = len(eligible)
            summary['arms'][arm]['untruncated_decision_accuracy_percent'] = round(
                100 * sum(r['decision_correct'] for r in eligible) / len(eligible), 1) if eligible else None
    # Compare on the same complete packets; runtime exclusions stay visible above.
    common_ids = [p['id'] for p in packets if all(
        detailed[f'{arm}-{p["id"]}']['complete'] for arm in ['baseline', 'grounded', 'laya'])]
    summary['common_complete_subset'] = {'cases': len(common_ids), 'arms': {
        arm: aggregate([detailed[f'{arm}-{cid}'] for cid in common_ids])
        for arm in ['baseline', 'grounded', 'laya']}}
    (root / 'scores.private.json').write_text(json.dumps(detailed, indent=2))
    (root / 'scores.private.json').chmod(0o600)
    # Explicit aggregate allowlist: never serialize source text, claims or drafts here.
    args.sanitized_output.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
