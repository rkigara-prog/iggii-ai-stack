"""Prepare real-input profiles, keeping all workflows inactive and unscheduled.

This writes reviewable definitions only. It does not import or activate anything.
Bind dedicated credentials with bind.py after explicit cutover approval.
"""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
root = '/data/output/ias-linkedin'
for stage in ['sanitization', 'enrichment', 'editorial-planner']:
    original = (Path(__file__).parent / (stage + '.json')).read_text()
    workflow = json.loads(original.replace('/data/output/ias-linkedin-acceptance', root))
    workflow['active'] = False
    for node in workflow['nodes']:
        if node['name'] == 'List Transcripts Modified in Last 10 Days':
            node['parameters']['command'] = 'IAS_TRANSCRIPTS_ROOT=/data/transcripts node ' + root + '/select-transcripts.cjs'
        if node['type'].endswith('executeCommand') and 'privacy-artifact.cjs' in node['parameters']['command']:
            node['parameters']['command'] = node['parameters']['command'].replace('node ' + root + '/privacy-artifact.cjs', 'IAS_PRIVACY_ROOT=' + root + ' node ' + root + '/privacy-artifact.cjs')
        if node['type'].endswith('scheduleTrigger'):
            assert node.get('disabled') is True
            assert node['name'] not in workflow['connections']
        assert 'credentials' not in node
    destination = args.output / (stage + '.json')
    destination.write_text(json.dumps(workflow, indent=2) + '\n')
