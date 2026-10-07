// Focused fail-closed checks; synthetic fixtures only, no inference/web requests.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert/strict');
const {execFileSync, spawnSync} = require('child_process');
const {validateReview, extraction} = require('./privacy-policy.cjs');
const reply = value => ({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
const input = {candidates:['testing security controls before broad deployment'],sourceSegments:[{id:0,text:'A test group exposes disruptive control effects before broad deployment.'}]};
const flags=Object.fromEntries(['identifier','private_engagement_fact','personal_personnel','finance_date','incident_operations','unsupported_topic','overspecific_combination'].map(k=>[k,false]));
const decision = {candidateIndex:0,verdict:'retain',educational:true,riskFlags:flags,evidenceSegmentIds:[0]};
assert.equal(validateReview(reply({decisions:[decision]}),input).retained.length,1);
let rejected = 0;
function blocked(action) {assert.throws(action);rejected++;}
blocked(()=>validateReview(reply({decisions:[]}),input));
blocked(()=>validateReview(reply({decisions:[decision,decision]}),input));
blocked(()=>validateReview(reply({decisions:[{...decision,evidenceSegmentIds:[99]}]}),input));
blocked(()=>validateReview(reply({decisions:[{...decision,verdict:'ambiguous'}]}),input));
blocked(()=>validateReview(reply({decisions:[{...decision,educational:false}]}),input));
blocked(()=>validateReview(reply({decisions:[{...decision,riskFlags:{...flags,private_engagement_fact:true}}]}),input));
for(const theme of ['SOC 2 evidence collection','talent acquisition and staffing','pricing and budget alignment','client engagement status','security lessons on 2026-10-07','email contact alice@example.test'])
 blocked(()=>validateReview(reply({decisions:[decision]}),{...input,candidates:[theme]}));
blocked(()=>extraction({choices:[{finish_reason:'length',message:{content:'{"themes":[]}'}}]}));
blocked(()=>extraction(reply({themes:['valid educational theme'],extra:true})));
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ias-privacy-gate-'));
try {
 const script=path.join(__dirname,'privacy-artifact.cjs'),env={...process.env,IAS_PRIVACY_ROOT:root};
 const run=(...args)=>JSON.parse(execFileSync(process.execPath,[script,...args],{env,encoding:'utf8'}));
 const deny=(...args)=>{assert.notEqual(spawnSync(process.execPath,[script,...args],{env,encoding:'utf8'}).status,0);rejected++;};
 deny('verify');
 const {runId}=run('begin');deny('verify');
 const file='theme-list-model-eval-qwen35-2026-10-07.txt';
 fs.writeFileSync(path.join(root,file),'- testing security controls before broad deployment\n');
 run('approve',runId,file);assert.equal(run('verify',runId).themeCount,1);
 fs.appendFileSync(path.join(root,file),'- talent acquisition and staffing\n');deny('verify',runId);
 fs.writeFileSync(path.join(root,file),'- testing security controls before broad deployment\n');
 run('begin');deny('verify',runId);deny('approve',runId,file);
} finally {fs.rmSync(root,{recursive:true,force:true});}
const w=JSON.parse(fs.readFileSync(path.join(__dirname,'enrichment.json')));
for(const node of w.nodes.filter(n=>String(n.parameters.url||'').includes('api.search.brave.com'))){
 const restore='Restore Queries Before '+node.name,guard='Check Privacy Before '+node.name;
 assert(w.connections[guard].main[0].some(x=>x.node===restore));
 assert(w.connections[restore].main[0].some(x=>x.node===node.name));
 const incoming=Object.entries(w.connections).filter(([,c])=>c.main?.some(branch=>branch.some(x=>x.node===node.name)));
 assert.deepEqual(incoming.map(([name])=>name),[restore]);
}
console.log(JSON.stringify({publicSafeControlPassed:true,negativePrivacyAndArtifactCasesBlocked:rejected,allFourBraveBranchesGuarded:true}));
// Exercise the actual embedded query validator and dynamic request expression.
const asyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const safeQuery={json:{theme:'testing security controls before broad deployment',searchQuery:'security controls isolated testing deployment safety',rationale:'educational control validation methods'}};
const source={json:{rawThemes:[safeQuery.json.theme],privacyProof:{runId:'fixture'}}};
const lookup=name=>({all:()=>name==='Parse Consolidated Themes'?[safeQuery]:[source],first:()=>source});
const requestNode=w.nodes.find(n=>n.name==='Validate Research Query Privacy');
const body=JSON.parse(new Function('$json','$','return '+requestNode.parameters.jsonBody.slice(3,-2))({},lookup));
assert.equal(body.response_format.json_schema.schema.properties.decisions.minItems,1);
assert.equal(body.response_format.json_schema.schema.properties.decisions.maxItems,1);
const validator=w.nodes.find(n=>n.name==='Reject Unsafe Research Queries').parameters.jsCode;
(async()=>{
 const consolidation=w.nodes.find(n=>n.name==='Parse Consolidated Themes').parameters.jsCode;
 const parse=new asyncFunction('$json','$',consolidation);
 assert.equal((await parse(reply({themes:[safeQuery.json]}),lookup)).length,1);
 await assert.rejects(parse(reply({themes:[{...safeQuery.json,searchQuery:'security controls isolated testing deployment safety general cloud systems technical practices and staffing'}]}),lookup));
 const fn=new asyncFunction('$input','$',validator);
 assert.equal((await fn({first:()=>({json:reply({decisions:[decision]})})},lookup)).length,1);
 await assert.rejects(fn({first:()=>({json:reply({decisions:[{...decision,verdict:'ambiguous'}]})})},lookup));
 await assert.rejects(fn({first:()=>({json:reply({decisions:[{...decision,verdict:'reject',educational:false,riskFlags:{...flags,private_engagement_fact:true}}]})})},lookup));
 console.log(JSON.stringify({embeddedQueryPrivacyValidatorPassed:true,ambiguousAndRejectedQueriesBlocked:true,dynamicReviewSchemaCountPassed:true,unsafeUntruncatedQueryBlocked:true}));
})().catch(()=>{console.error('Embedded query privacy check failed');process.exitCode=1;});
