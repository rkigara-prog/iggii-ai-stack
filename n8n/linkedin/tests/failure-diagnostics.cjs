const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {updateFailure}=require('../build-explicit-failure.cjs'),{addDiagnostics,codeFor}=require('../build-failure-diagnostics.cjs'),s=require('../stage-result.cjs'),catalog=require('../failure-node-codes.json');
for(const file of ['sanitization','enrichment','editorial-planner']){
 const original=updateFailure(JSON.parse(fs.readFileSync(path.join(__dirname,'..',file+'.json'))));
 const {workflow:w,catalog:actual}=addDiagnostics(structuredClone(original));
 for(const [name,c] of Object.entries(original.connections))for(const [i,edges] of (c.main||[]).entries())for(const [j,edge] of edges.entries()){
  const after=w.connections[name].main[i][j];
  if(edge.node!=='Record Explicit Stage Failure'){assert.deepEqual(after,edge);continue;}
  const code=codeFor(name);assert.equal(actual[code],name);assert.equal(catalog[code],name);
  const n=w.nodes.find(n=>n.name===after.node);assert(!n.onError);assert(!n.parameters.command.includes('$json'));assert(n.parameters.command.includes('nodeCode:'+JSON.stringify(code)));
  assert.deepEqual(w.connections[n.name],original.connections['Record Explicit Stage Failure']);
 }
 assert.deepEqual(w.settings,original.settings);assert.deepEqual(addDiagnostics(structuredClone(w)),{workflow:w,catalog:actual});
 for(const change of [n=>n.continueOnFail=true,n=>n.parameters.command+=' unsafe',n=>n.type='unexpected']){const broken=structuredClone(w);change(broken.nodes.find(n=>n.name.startsWith('Record Failure Code: ')));assert.throws(()=>addDiagnostics(broken),/Invalid diagnostic sink/);}
 const decorated=structuredClone(w);assert.throws(()=>updateFailure(decorated),/undecorated source/);assert.deepEqual(decorated,w);
}
const root=fs.mkdtempSync(path.join(os.tmpdir(),'diagnostic-')),runId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',nodeCode=codeFor('Parse Consolidated Themes');
s.record({begin:true,runId,executionId:'101',stage:'privacy',state:'running',reasonCode:'started'},root);
const old=fs.readFileSync(path.join(root,'run-status.json'),'utf8');
assert.throws(()=>s.fail({executionId:'101',reasonCode:'stage_failed',nodeCode:'PRIVATE raw error'},root));assert.equal(fs.readFileSync(path.join(root,'run-status.json'),'utf8'),old);
const failed=s.fail({executionId:'101',reasonCode:'stage_failed',nodeCode,error:'PRIVATE raw error',url:'PRIVATE'},root);assert.equal(failed.nodeCode,nodeCode);assert(!JSON.stringify(failed).includes('PRIVATE'));
assert.deepEqual(s.fail({executionId:'101',reasonCode:'stage_failed',nodeCode:codeFor('Read Theme Lists')},root),failed);
const alerts=fs.readdirSync(path.join(root,'alerts'));assert.equal(alerts.length,1);const alert=JSON.parse(fs.readFileSync(path.join(root,'alerts',alerts[0])));assert.equal(alert.nodeCode,nodeCode);assert(!JSON.stringify(alert).includes('PRIVATE'));
console.log('PASS static attribution of every error edge, unchanged normal graph/settings, allowlisted codes, raw-field stripping, first terminal attribution and one alert');


