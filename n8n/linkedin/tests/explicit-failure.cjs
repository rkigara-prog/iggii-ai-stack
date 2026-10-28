const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process'),os=require('os');
const D=path.resolve(__dirname,'..'),{updateFailure}=require(D+'/build-explicit-failure.cjs'),{risks}=require(D+'/privacy-decision-schema.cjs');
const drafts={};
for(const k of ['sanitizer','enrichment','planner']){
 const original=JSON.parse(fs.readFileSync(D+'/'+({sanitizer:'sanitization',enrichment:'enrichment',planner:'editorial-planner'}[k])+'.json'));const w=updateFailure(structuredClone(original));drafts[k]=w;
 assert.deepEqual(updateFailure(structuredClone(w)),w);assert.deepEqual(w.settings,original.settings);
 for(const n of original.nodes.filter(n=>!n.type.endsWith('.if'))){const now=w.nodes.find(x=>x.name===n.name);assert.equal(now.disabled,n.disabled);assert.deepEqual(now.credentials,n.credentials);const outputs=n.type.endsWith('.if')?2:1;const old=original.connections[n.name]?.main||[];if(now.onError){for(let i=0;i<old.length;i++){const edge=w.connections[n.name].main[i];if(old[i].length){const guard=w.nodes.find(x=>x.name===edge[0].node);assert(guard.name.startsWith('Require Complete Node Success: '));assert.deepEqual(w.connections[guard.name].main[0],old[i]);const fn=Function('$','$input',guard.parameters.jsCode);assert.throws(()=>fn(()=>({all:()=>[{json:{error:'PRIVATE'}}]}),{all:()=>[{json:{safe:true}}]}),/partial failure/);assert.deepEqual(fn(()=>({all:()=>[]}),{all:()=>[{json:{safe:true}}]}),[{json:{safe:true}}]);}else assert.deepEqual(edge,[]);}assert.equal(w.connections[n.name].main[outputs][0].node,'Record Explicit Stage Failure');}}

}
const e=drafts.sanitizer.nodes.find(n=>n.name==='Privacy Adjudication and Deduplication via gpt-oss').parameters.jsonBody;
const request=JSON.parse(Function('$json','return ('+e.slice(3,-3)+')')({candidates:[1],sourceSegments:[1,2,3]}));
const schema=request.response_format.json_schema.schema;
const branches=schema.properties.decisions.items.anyOf;assert.equal(branches.length,9);
assert.deepEqual(branches.map(b=>b.properties.verdict.enum[0]),['retain',...risks.map(()=>'reject'),'ambiguous']);
assert.deepEqual(branches[0].properties.educational.enum,[true]);
for(const risk of risks)assert.deepEqual(branches[0].properties.riskFlags.properties[risk].enum,[false]);
for(const [i,risk] of risks.entries())assert.deepEqual(branches[i+1].properties.riskFlags.properties[risk].enum,[true]);
assert(!JSON.stringify(schema).includes('uniqueItems'));
const cases=[];for(const verdict of ['retain','reject','ambiguous'])for(const educational of [false,true])for(let mask=0;mask<128;mask++){
 const flags=Object.fromEntries(risks.map((k,i)=>[k,!!(mask&(1<<i))]));const row={candidateIndex:0,verdict,educational,riskFlags:flags,evidenceSegmentIds:[0]};cases.push({expected:verdict==='ambiguous'||(verdict==='retain'?educational&&mask===0:mask!==0),value:{decisions:[row]}});
}

const validatorCode=drafts.sanitizer.nodes.find(n=>n.name==='Build Final Public-Safe Theme List').parameters.jsCode;
assert(validatorCode.includes(JSON.parse(fs.readFileSync(D+'/sanitization.json')).nodes.find(n=>n.name==='Build Final Public-Safe Theme List').parameters.jsCode));
const validate=Function(validatorCode.replace('const routingItems=(()=>{','').split('const inputs =')[0]+'return validateReview;')();
for(const c of cases){const reply={choices:[{finish_reason:'stop',message:{content:JSON.stringify(c.value)}}]};const input={candidates:['Input validation rejects malformed inputs'],sourceSegments:[{id:0,text:'Synthetic source'}]};if(c.expected&&c.value.decisions[0].verdict!=='ambiguous')validate(reply,input);else assert.throws(()=>validate(reply,input));}
// Real helper subprocesses, actual filesystem faults, same-run/stale guards.
const root=fs.mkdtempSync(path.join(process.env.IAS_TEST_ROOT||os.tmpdir(),'manual-failure-'));const stage=require(D+'/stage-result.cjs');const id='00000000-0000-4000-8000-000000000001';
stage.record({begin:true,runId:id,executionId:'101',stage:'privacy',state:'running',reasonCode:'started'},root);
const fail=(executionId='101')=>cp.spawnSync(process.execPath,[D+'/stage-result.cjs','fail',Buffer.from(JSON.stringify({executionId,reasonCode:'stage_failed'})).toString('base64')],{env:{...process.env,IAS_PRIVACY_ROOT:root},encoding:'utf8'});
fs.writeFileSync(path.join(root,'alerts'),'fault');assert.notEqual(fail().status,0);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'run-status.json'))).state,'running');fs.unlinkSync(path.join(root,'alerts'));
assert.equal(fail().status,0);assert.equal(fail().status,0);assert.equal(fs.readdirSync(path.join(root,'alerts')).length,1);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'run-status.json'))).state,'failed');
stage.record({begin:true,runId:'00000000-0000-4000-8000-000000000002',executionId:'102',stage:'privacy',state:'running',reasonCode:'started'},root);assert.notEqual(fail().status,0);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'run-status.json'))).executionId,'102');
fs.writeFileSync(path.join(root,'.run-status.lock'),'fault');assert.notEqual(fail('102').status,0);assert.equal(JSON.parse(fs.readFileSync(path.join(root,'run-status.json'))).state,'running');fs.unlinkSync(path.join(root,'.run-status.lock'));
assert.equal(fail('102').status,0);console.log('PASS graph/normal edges/settings/idempotency; actual CLI fault-retry, duplicate, stale and lock guards. '+cases.length+' validator cases plus generated schema branch assertions.');




