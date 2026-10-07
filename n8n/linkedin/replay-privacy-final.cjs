// Replay only the failed privacy handoff from private cached execution responses.
// This never calls a model, writes production artifacts or approves a privacy marker.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const {execution, outputs} = require('./audit-acceptance.cjs');
const {validateReview} = require('./privacy-policy.cjs');
const root = process.argv[2], logDir = process.argv[3], workflowFile = process.argv[4];
assert(root && logDir && workflowFile, 'Supply private output/log directories and workflow definition');
const original = execution('sanitization');
assert.equal(original.lastNodeExecuted, 'Build Final Public-Safe Theme List');
const inputs = outputs(original, 'Aggregate Anonymous Candidate Themes');
const responses = outputs(original, 'Privacy Adjudication and Deduplication via gpt-oss');
const fixed = JSON.parse(fs.readFileSync(path.join(logDir, 'repaired-flat-responses.private.json')));
assert.equal(inputs.length, responses.length);
const failed = [];
for (let i = 0; i < inputs.length; i++) {
  try { validateReview(responses[i].json, inputs[i].json); }
  catch { failed.push(i); }
}
assert.deepEqual(fixed.map(r => r.batch).sort((a,b) => a-b), failed);
const corrected = responses.map((r,i) => ({json:fixed.find(f=>f.batch===i)?.response || r.json}));
const workflow = JSON.parse(fs.readFileSync(workflowFile));
assert.equal(workflow.active, false);
const code = workflow.nodes.find(n=>n.name==='Build Final Public-Safe Theme List').parameters.jsCode;
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const lookup = name => ({all:()=>outputs(original,name)});
(async()=>{
  const result = await new AsyncFunction('$input','$',code)({all:()=>corrected},lookup);
  assert.equal(result.length,1);
  assert.equal(result[0].json.privacyValidation.passed,true);
  assert(result[0].json.themeCount>0 && result[0].json.themeCount<=20);
  fs.mkdirSync(root,{recursive:true,mode:0o700});
  fs.writeFileSync(path.join(root,'replayed-final.private.json'),JSON.stringify(result),{mode:0o600});
  console.log(JSON.stringify({finalBuilderPassed:true,recheckedBatches:fixed.length,
    cachedPassedBatches:inputs.length-fixed.length,finalThemes:result[0].json.themeCount,
    reviewed:result[0].json.privacyValidation.reviewed,rejected:result[0].json.privacyValidation.rejected,
    productionApprovalUnchanged:true}));
})().catch(()=>{console.error('Privacy final handoff replay failed; private evidence retained');process.exitCode=1;});
