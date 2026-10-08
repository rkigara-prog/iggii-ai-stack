"""Summarize saved pilot checkpoints; no network, inference, or evidence export."""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re


def summarize(state):
    rows = []
    for name in ['identity', 'infrastructure']:
        path = state / f'20261008-{name}-reference.json'
        record = json.loads(path.read_text())
        reply, review = record['reply'], record['review']
        samples = record['resourceSamples']
        peaks = [max(next(r['XPUM_STATS_MEMORY_USED'] for r in s['gpu']
                          if r['device'] == i) for s in samples) for i in [0, 1]]
        assert record['artifactSha256'] == json.loads(
            (Path(__file__).parent / 'runtime.json').read_text())['sha256']
        assert review['humanApprovalRequired'] and review['publicationApproval'] is None
        assert review['automaticPublishingAllowed'] is False
        rows.append({
            'requestId': record['requestId'], 'checkpointSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'packetSha256': record['packetSha256'], 'status': record['status'],
            'finishReason': reply['choices'][0]['finish_reason'], 'adapter': review['adapter'],
            'elapsedSecondsIncludingLoadAndUnload': record['elapsedSeconds'],
            'tokens': reply['usage'], 'nativeTimings': reply['timings'],
            'wordCountExcludingUrls': len(re.findall(r"\b[\w]+(?:['’-][\w]+)*\b",
                                                   re.sub(r'https?://\S+', '', review['draft']))),
            'evidenceBoundInputClaims': len(review['approvedClaims']),
            'writerListedClaims': len(review['writerClaims']),
            'wholeProseReviewFlags': len(review['fullProseReview']['assertions']),
            'independentSemanticVerification': False, 'publicationApproval': None,
            'resourceSampleCount': len(samples), 'baselineGpuMiB': record['baselineGpuMiB'],
            'peakGpuMiB': peaks,
            'peakAdditionalGpuGiB': [(peaks[i] - record['baselineGpuMiB'][i]) / 1024 for i in [0, 1]],
            'peakProcessRssGiB': max(s['rssKiB'] for s in samples) / 1024**2,
            'peakGpuPowerWatts': [max(next(r['XPUM_STATS_POWER'] for r in s['gpu']
                                          if r['device'] == i) for s in samples) for i in [0, 1]],
            'guardReasons': record['guardReasons'], 'serverStopped': record['serverStopped'],
        })
    text = (state / 'execution.private.log').read_text()
    execution = None
    for index, char in enumerate(text):
        if char != '{':
            continue
        try:
            value = json.loads(text[index:])
        except ValueError:
            continue
        if isinstance(value, dict) and value.get('mode') == 'cli':
            execution = value
            break
    assert execution and execution['finished'] and execution['status'] == 'success'
    elapsed = (datetime.fromisoformat(execution['stoppedAt'])
               - datetime.fromisoformat(execution['startedAt'])).total_seconds()
    live = json.loads((state / 'live-verification.private.json').read_text())
    return {
        'cycleId': '20261008-authorized-gemma-pilot', 'authorizationRecord': 'pilot-authorization.json',
        'cycleStartedAt': execution['startedAt'], 'cycleFinishedAt': execution['stoppedAt'],
        'n8nExecutionSeconds': elapsed, 'n8nExecutionStatus': execution['status'],
        'eligibleRetainedTopics': 2, 'deferredRetainedTopicsNotDrafted': 5,
        'maximumAuthorizedDrafts': 3, 'modelCalls': 2, 'completeResponses': 2,
        'outputBudgetExhaustions': 0, 'transportTimeouts': 0, 'runtimeErrorsDuringCycle': 0,
        'preInferenceCliStartupFailures': 1,
        'startupFix': 'Separate CLI task-runner broker port 5681; production broker unchanged',
        'benchmarkReruns': 0, 'productionModelChanges': 0, 'productionServiceStops': 0,
        'blindReviewCompleted': False, 'humanEditingMinutes': None,
        'humanPublicationApprovals': 0, 'automaticPublishingAllowed': False,
        'recurringExecutionEnabled': False, 'samples': rows, 'sharedReviewVerification': live,
        'limits': [
            'Two historical topics; not a new model comparison or current-news qualification.',
            'Exact bindings and schema checks do not establish semantic correctness of full prose.',
            'RSS excludes GPU allocations; sampled peaks can miss short spikes. Host available RAM was guarded but not persisted per sample.',
            'Household priority was polled, not a measured concurrency or latency guarantee.',
            'Content judgments are Codex judgments; actual human editing effort remains unmeasured.',
        ],
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.write_text(json.dumps(summarize(args.state), indent=2) + '\n')
