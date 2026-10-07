"""Bind dedicated credential IDs to sanitized copies outside the repository."""
import argparse
import json
from pathlib import Path

STAGES = [('sanitization', 'IASLinkedinSan01'), ('enrichment', 'IASLinkedinEnr01'),
          ('editorial-planner', 'IASLinkedinPlan1')]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
parser.add_argument('--litellm-id', required=True)
parser.add_argument('--brave-id', required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
for stage, workflow_id in STAGES:
    workflow = json.loads((Path(__file__).parent / (stage + '.json')).read_text())
    workflow['id'] = workflow_id
    for node in workflow['nodes']:
        url = node['parameters'].get('url', '')
        credential_id = args.litellm_id if url.endswith('/v1/chat/completions') else args.brave_id if 'api.search.brave.com/' in url else None
        if credential_id:
            node['credentials'] = {'httpHeaderAuth': {'id': credential_id,
                'name': 'IAS LinkedIn LiteLLM' if credential_id == args.litellm_id else 'IAS LinkedIn Brave'}}
    path = args.output / (stage + '.json')
    path.write_text(json.dumps([workflow], indent=2) + '\n')
    path.chmod(0o600)
