"""Add success-only archival to a planner definition; preserve existing settings/clocks."""
import copy
import json
import sys
from pathlib import Path

def connect(workflow):
    workflow = copy.deepcopy(workflow)
    writer = next(n for n in workflow['nodes'] if n['name'] == 'Write Editorial Plan Files')
    root = writer['parameters']['fileName'].split('/{{')[0].lstrip('=')
    name = 'Archive Completed Cycle'
    command = ('={{ "IAS_PRIVACY_ROOT=' + root + ' node ' + root + '/archive-artifact.cjs complete " + '
               'JSON.stringify({proof: JSON.parse($("Require Current Candidate Artifact").first().json.stdout), '
               'planFile: $("Prepare Editorial Plan Files").all().find(i => i.json.fileName.endsWith(".json")).json.fileName}).base64Encode() }}')
    node = {'parameters': {'command': command}, 'id': 'ias-archive-completed-cycle', 'name': name,
            'type': 'n8n-nodes-base.executeCommand', 'typeVersion': 1,
            'position': [writer['position'][0] + 240, writer['position'][1]], 'executeOnce': True}
    old = next((n for n in workflow['nodes'] if n['name'] == name), None)
    if old:
        assert old == node
    else:
        assert not workflow['connections'].get(writer['name'])
        workflow['nodes'].append(node)
    workflow['connections'][writer['name']] = {'main': [[{'node': name, 'type': 'main', 'index': 0}]]}
    return workflow

if __name__ == '__main__':
    source, target = map(Path, sys.argv[1:])
    value = json.loads(source.read_text())
    result = [connect(w) for w in value] if isinstance(value, list) else connect(value)
    target.write_text(json.dumps(result, indent=2) + '\n')
