"""Clarify saved scoring denominators; no inference, rescoring or evidence export."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source = args.root / 'deterministic-details.json'
    details = json.loads(source.read_text())
    output = {
        'modelCalls': 0, 'rescoring': False, 'originalResultsModified': False,
        'goldAuthority': 'Codex regression judgments; not independent human labels',
        'savedDetailsSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'definitions': {
            'complete': 'Legacy score field: full schema, not semantic completion',
            'correctBlock': 'Completed reject/reject or defer/defer agreement',
            'unsafeAccept': 'Completed accept when gold is reject or defer',
            'incomplete': 'No completed semantic decision; never a correct block',
            'writingMeans': 'All four complete drafts per arm, including schema failures',
            'decisionAccuracyPercent': 'Legacy schema AND gold agreement / 36 composite'
        },
        'arms': {}
    }
    for arm in ['home-chat', 'qwen3.8-27b', 'gemma4-31b']:
        rows = [v for k, v in details.items() if k.startswith(arm + '/assessment/')]
        assert len(rows) == 36
        groups = {k: [] for k in ['correctAccept', 'correctBlock', 'unsafeAccept',
                                 'rejectDeferError', 'incorrectBlock', 'incomplete']}
        confusion = Counter()
        for row in rows:
            gold = row['expected']
            decision = row['decision'] if row['decisionAvailable'] else 'incomplete'
            confusion[gold + ' -> ' + decision] += 1
            if decision == 'incomplete':
                assert row['finish'] == 'length'
                category = 'incomplete'
            elif gold == decision:
                category = 'correctAccept' if gold == 'accept' else 'correctBlock'
            elif decision == 'accept':
                category = 'unsafeAccept'
            elif gold == 'accept':
                category = 'incorrectBlock'
            else:
                category = 'rejectDeferError'
            groups[category].append(row['id'])
        writing = [v for k, v in details.items() if k.startswith(arm + '/writing/')]
        assert len(writing) == 4 and all(r['finish'] == 'stop' for r in writing)
        output['arms'][arm] = {
            'assessmentDenominator': len(rows),
            'semanticDecisionCount': sum(r['decisionAvailable'] for r in rows),
            'fullSchemaCount': sum(r['complete'] for r in rows),
            'semanticGoldAgreementCount': sum(r['decisionGoldAgreement'] for r in rows),
            'schemaAndGoldAgreementCount': sum(r['correct'] for r in rows),
            'mutuallyExclusiveCounts': {k: len(v) for k, v in groups.items()},
            'caseIdsByOutcome': groups,
            'confusion': dict(sorted(confusion.items())),
            'eligibleAcceptsPassingMechanics': [r['id'] for r in rows if r['expected'] == 'accept' and r['decision'] == 'accept' and r['bindingGatePass']],
            'unsafeAcceptsPassingMechanics': [r['id'] for r in rows if r['id'] in groups['unsafeAccept'] and r['bindingGatePass']],
            'writingMeanDenominator': len(writing),
            'writingSchemaCount': sum(r['complete'] for r in writing),
            'writingIncomplete': 0,
            'writingExcludedFromMeans': 0,
        }
        assert sum(output['arms'][arm]['mutuallyExclusiveCounts'].values()) == 36
    args.output.write_text(json.dumps(output, indent=2) + '\n')


if __name__ == '__main__':
    main()
