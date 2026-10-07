"""Create inactive local-inference copies from credential-free deployed exports.

Usage: python3 migrate.py SOURCE.json OUTPUT_DIR
SOURCE is an array in extraction/enrichment/planner order. Credentials are
omitted from committed exports and bound separately during deployment.
"""
import copy
import json
import re
from pathlib import Path
import sys

ISOLATED = '/data/output/ias-linkedin-acceptance'
STAGES = ['sanitization', 'enrichment', 'editorial-planner']
NAMES = ['IAS_Transcript Sanitization - home-chat - inactive',
         'IAS_Content Enrichment - home-chat - inactive',
         'IAS_LinkedIn Editorial Planner - home-chat - inactive']


def migrate(source):
    workflow = copy.deepcopy(source)
    for key in ['id', 'versionId', 'activeVersionId', 'createdAt', 'updatedAt',
                'pinData', 'staticData', 'meta', 'shared', 'tags', 'triggerCount']:
        workflow.pop(key, None)
    workflow['active'] = False
    workflow['settings'] = {**workflow.get('settings', {}), 'executionOrder': 'v1', 'saveDataSuccessExecution': 'none',
                            'saveDataErrorExecution': 'none', 'saveManualExecutions': False}
    for node in workflow['nodes']:
        node.pop('credentials', None)
        node.pop('webhookId', None)
        params = node['parameters']
        if node['type'].endswith('scheduleTrigger'):
            node['disabled'] = True
            workflow['connections'].pop(node['name'], None)
        if params.get('url', '').endswith('/api/chat'):
            original = params['jsonBody'].strip()[3:-2].strip()
            # Prompts/input expressions are the last messages field in every
            # deployed request. Keep them verbatim; n8n's expression compiler
            # rejects the statement-based IIFE used by some JS environments.
            messages = original[original.index('messages:'):]
            response_format = {'type': 'json_object'}
            match = re.search(r'format:\s*(\{)', original)
            if match:
                start = match.start(1)
                depth = 0
                for end in range(start, len(original)):
                    depth += (original[end] == '{') - (original[end] == '}')
                    if depth == 0:
                        schema_text = original[start:end + 1]
                        schema_text = re.sub(r'(\b\w+)\s*:', r'"\1":', schema_text)
                        schema = json.loads(schema_text)
                        break
                response_format = {'type': 'json_schema', 'json_schema': {
                    'name': 'pipeline_output', 'strict': True, 'schema': schema}}
            params['jsonBody'] = ('={{ JSON.stringify({model: "home-chat", stream: false, '
                'temperature: 0, response_format: ' + json.dumps(response_format, indent=2) + ', '
                + messages + ' }}')
            params['url'] = 'http://192.168.113.18:4000/v1/chat/completions'
            params['authentication'] = 'genericCredentialType'
            params['genericAuthType'] = 'httpHeaderAuth'
        for key, value in list(params.items()):
            if isinstance(value, str):
                # Applies to all parsers, including cross-node first-pass results.
                value = value.replace('.message?.content', '.choices?.[0]?.message?.content')
                value = value.replace('/data/output/', ISOLATED + '/')
                value = value.replace('Ollama did not return', 'Local inference did not return')
                value = value.replace('returned by Ollama', 'returned by local inference')
                params[key] = value
        if node['type'].endswith('executeCommand'):
            params['command'] = 'node ' + ISOLATED + '/select-transcripts.cjs'
        if node['type'].endswith('stickyNote'):
            params['content'] = ('## Inactive local migration\n'
                'Separate copy; schedule disabled and disconnected. All model stages use '
                'LiteLLM home-chat with separate extraction, privacy, evidence-ranking and '
                'editorial calls. All file inputs/outputs use the isolated acceptance directory. '
                'Bind dedicated IAS credentials; never activate without explicit approval. '
                'No drafting, image generation, messaging or publishing.\n\n' + params.get('content', ''))
    return workflow


def main():
    source = json.loads(Path(sys.argv[1]).read_text())
    output = Path(sys.argv[2]); output.mkdir(parents=True, exist_ok=True)
    for index, stage in enumerate(STAGES):
        workflow = migrate(source[index])
        workflow['name'] = NAMES[index]
        (output / (stage + '.json')).write_text(json.dumps(workflow, indent=2) + '\n')


if __name__ == '__main__':
    main()
