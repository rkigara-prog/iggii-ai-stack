"""Summarize saved execution records without model calls or exposing private paths."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re


def utc(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = args.root
    controller = json.loads((root / 'resume-status.private.json').read_text())
    assert controller['status'] == 'completed', 'Comparison is not finished'
    records = {}
    paths = list(root.glob('*-runtime.private.json'))
    paths += list((root / 'runtime-history').rglob('*-runtime.private.json'))
    for path in paths:
        record = json.loads(path.read_text())
        key = (record['arm'], record['startedAt'])
        if key not in records or len(record.get('resourceSamples', [])) > len(records[key][1].get('resourceSamples', [])):
            records[key] = (path, record)
    result = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'modelCalls': 0,
        'networkCalls': 0,
        'controllerStartedAt': controller['startedAt'],
        'controllerFinishedAt': controller['phases'][-1]['finishedAt'],
        'measurementLimits': [
            'GPU memory/power samples include existing production allocations.',
            'Incremental GPU memory is relative to each native load baseline.',
            'RSS is resident memory, not the complete mapped model size.',
            'No controlled household latency, full-GPU or higher-thread comparison.',
            'Native process wall time includes reload, queue, generation and sampling.',
            'Output-token budget truncation differs from source/context truncation.'
        ],
        'nativeRuns': [],
        'arms': {},
        'cpuObservations': [],
        'recordedHouseholdWaitMessagesInResumeLogs': sum(
            p.read_text().count('"waitingForHousehold": true')
            for p in root.glob('*-resume.private.log'))
    }
    for name in ['cpu-observation.private.json', 'gemma-cpu-observation.private.json']:
        observation = json.loads((root / name).read_text())
        fields = observation['ps'].split()
        pressure = re.search(r'some avg10=([\d.]+) avg60=([\d.]+) avg300=([\d.]+)', observation['cpuPressure'])
        result['cpuObservations'].append({
            'sampledAt': utc(observation['sampledAt']), 'phase': observation['phase'],
            'processElapsed': fields[1], 'processCpuPercent': float(fields[2]),
            'nice': int(fields[4]), 'rssKiB': int(fields[5]),
            'hostCpuPressureSomeAvg10_60_300': [float(v) for v in pressure.groups()] if pressure else None,
            'controlledContentionMeasurement': False
        })
    for (arm, _), (path, record) in sorted(records.items()):
        assert 'finishedAt' in record, 'Native run is still active'
        samples = record.get('resourceSamples', [])
        baseline = {g['device']: g['XPUM_STATS_MEMORY_USED'] for g in record['baseline']['gpu']}
        increments = {i: [g['XPUM_STATS_MEMORY_USED'] - baseline[i]
                          for sample in samples for g in sample.get('gpu', [])
                          if g['device'] == i and 'XPUM_STATS_MEMORY_USED' in g]
                      for i in [0, 1]}
        rss = [s['rssKiB'] for s in samples if 'rssKiB' in s]
        log_path = path.with_name(arm + '-server.private.log')
        log = log_path.read_text() if log_path.exists() else ''
        truncations = [int(v) for v in re.findall(r'truncated = (\d+)', log)]
        run = {
            'arm': arm, 'phase': record.get('phase', 'initial checkpoint'),
            'status': record['status'], 'startedAt': utc(record['startedAt']),
            'finishedAt': utc(record['finishedAt']),
            'processWallSeconds': round(record['finishedAt'] - record['startedAt'], 3),
            'loadToReadySeconds': round(record['readyAt'] - record['startedAt'], 3),
            'resourceSampleCount': len(samples),
            'peakIncrementalGpuMiB': {str(i): round(max(v), 3) if v else None for i, v in increments.items()},
            'peakRssKiB': max(rss) if rss else None,
            'nativeReleaseRecords': len(truncations),
            'nativeContextTruncatedRecords': sum(v != 0 for v in truncations),
            'checkpointStopExit15': record.get('error') == 'Evaluation stopped with checkpoint; exit -15'
        }
        result['nativeRuns'].append(run)
    for arm in ['home-chat', 'qwen3.8-27b', 'gemma4-31b']:
        calls = [json.loads(p.read_text()) for p in (root / 'frozen/responses' / arm).glob('*.json')]
        assert len(calls) == 43 and all(c['status'] == 'response' for c in calls)
        native = [c['reply']['timings'] for c in calls if c['reply'].get('timings')]
        result['arms'][arm] = {
            'savedCalls': len(calls),
            'totalCallSeconds': round(sum(c['latencySeconds'] for c in calls), 3),
            'outputTokens': sum(c['reply']['usage']['completion_tokens'] for c in calls),
            'nativePromptSeconds': round(sum(t['prompt_ms'] for t in native) / 1000, 3) if native else None,
            'nativeGenerationSeconds': round(sum(t['predicted_ms'] for t in native) / 1000, 3) if native else None,
            'nativeDecodeWeightedTokensPerSecond': round(sum(t['predicted_n'] for t in native) / (sum(t['predicted_ms'] for t in native) / 1000), 3) if native else None
        }
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'arms': result['arms'], 'nativeRuns': len(result['nativeRuns'])}))


if __name__ == '__main__':
    main()
