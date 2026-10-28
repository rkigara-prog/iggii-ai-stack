const fs = require('node:fs');
const assert = require('node:assert/strict');
const workflow = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, 'sanitization.json'), 'utf8'));
const requestNode = workflow.nodes.find(n => n.name === 'Sanitize via qwen3.5 (Per Meeting)');
const expression = requestNode.parameters.jsonBody;
const request = JSON.parse(Function('$json', 'return (' + expression.slice(3, -2) + ')')({text:'Synthetic educational input'}));
assert.equal(request.response_format.json_schema.schema.properties.themes.items.maxLength, 220);
const validatorNode = workflow.nodes.find(n => n.name === 'Aggregate Anonymous Candidate Themes');
const validator = Function(validatorNode.parameters.jsCode.split('const decoded =')[0] + '\nreturn extraction;')();
const reply = themes => ({choices:[{finish_reason:'stop',message:{content:JSON.stringify({themes})}}]});
assert.deepEqual(validator(reply(['x'.repeat(220)])), ['x'.repeat(220)]);
assert.throws(() => validator(reply(['x'.repeat(221)])), /Extraction schema invalid/);
assert.throws(() => validator(reply(['same','same'])), /Extraction schema invalid/);
assert.throws(() => validator(reply([''])), /Extraction schema invalid/);
assert.deepEqual(validator(reply([])), []);
console.log('PASS: request limit matches unchanged validator; 220 accepted, 221/duplicate/empty string rejected, empty array accepted.');

