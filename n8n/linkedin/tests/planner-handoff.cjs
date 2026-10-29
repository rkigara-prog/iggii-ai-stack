const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
const {updatePlannerHandoff,assertOnlyPlannerHandoff}=require('../build-planner-handoff.cjs');
const src=process.env.PLANNER_FIXTURE_SOURCE||path.join(__dirname,'..');
const stages=require(path.join(src,'stage-result.cjs'));
const sourceGraph=JSON.parse(fs.readFileSync(path.join(src,'editorial-planner.json')));
const base=structuredClone(sourceGraph),legacyNode=base.nodes.find(n=>n.name==='Check Handoff Before Writing Plan');
assert(legacyNode);
const fixedSuffix=' + " " + $execution.id }}';
const legacySuffix='JSON.stringify(JSON.parse($("Require Current Candidate Artifact").first().json.stdout)).base64Encode() }}';
if(legacyNode.parameters.command.endsWith(fixedSuffix))legacyNode.parameters.command=legacyNode.parameters.command.slice(0,-fixedSuffix.length)+' }}';
assert(legacyNode.parameters.command.endsWith(legacySuffix),'Unexpected source recheck command');
const updated=updatePlannerHandoff(base),name='Check Handoff Before Writing Plan';
const generate=require('../build-reliability.cjs').update;const generated=generate(structuredClone(base));assert.deepEqual(generate(structuredClone(updated)),generated);assert.deepEqual(generate(structuredClone(generated)),generated);assertOnlyPlannerHandoff(base,updated);
const beforeNode=base.nodes.find(n=>n.name===name),afterNode=updated.nodes.find(n=>n.name===name);
const callSites=generated.nodes.filter(n=>n.parameters?.command?.includes('pipeline-artifact.cjs verify-candidate '));assert.equal(callSites.length,2);for(const n of callSites)assert(n.parameters.command.endsWith(' + " " + $execution.id }}'));
assert.equal(afterNode.parameters.command,beforeNode.parameters.command.slice(0,-3)+' + " " + $execution.id }}');
const restored=structuredClone(updated);restored.nodes.find(n=>n.name===name).parameters.command=beforeNode.parameters.command;assert.deepEqual(restored,base);
assert.throws(()=>updatePlannerHandoff(updated),/Unreviewed/);
for(const bad of [w=>w.nodes.find(n=>n.name===name).executeOnce=false,w=>w.nodes.find(n=>n.name===name).parameters.command+=' unexpected']){const w=structuredClone(base);bad(w);assert.throws(()=>updatePlannerHandoff(w),/Unreviewed/);}
const isolated=structuredClone(base);isolated.nodes.find(n=>n.name===name).parameters.command=beforeNode.parameters.command.replaceAll('/data/output/ias-linkedin-acceptance','/synthetic/test-only');assert.throws(()=>updatePlannerHandoff(isolated),/Unreviewed/);
for(const mutate of [w=>w.settings={...w.settings,saveManualExecutions:true},w=>w.nodes[0].disabled=!w.nodes[0].disabled,w=>w.nodes.find(n=>n.name===name).parameters.command+=' ',w=>w.connections={}]){const bad=structuredClone(updated);mutate(bad);assert.throws(()=>assertOnlyPlannerHandoff(base,bad));}
const prod=structuredClone(base);prod.nodes.find(n=>n.name===name).parameters.command=beforeNode.parameters.command.replaceAll('/data/output/ias-linkedin-acceptance','/data/output/ias-linkedin');assertOnlyPlannerHandoff(prod,updatePlannerHandoff(prod,'/data/output/ias-linkedin'),'/data/output/ias-linkedin');
const parent=process.argv[2];assert(parent,'Provide a local fixture parent');fs.mkdirSync(parent,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const accepted of [false,true]){
 const root=fs.mkdtempSync(path.join(parent,'handoff-')),runId=crypto.randomUUID();
 const read=()=>JSON.parse(fs.readFileSync(path.join(root,'run-status.json')));
 stages.record({begin:true,runId,executionId:'19809',stage:'privacy',state:'running',reasonCode:'started'},root);
 stages.record({runId,stage:'research',state:'running',reasonCode:'stage_started'},root);stages.handoff(runId,'19811','research',root);
 stages.record({runId,stage:'planning',state:'running',reasonCode:'stage_started'},root);stages.handoff(runId,'19812','planning',root);
 const themeName='theme-list-model-eval-qwen35-2026-10-29.txt',candidateName='content-candidates-model-eval-2026-10-29.json',briefName='content-brief-model-eval-2026-10-29.md';
 const theme='- Public technology research\n',brief='# Synthetic evidence brief\n';
 const approval={state:'approved',runId,fileName:themeName,themeCount:1,policyVersion:require(path.join(src,'privacy-policy.cjs')).policyVersion,sha256:sha(theme),approvedAt:new Date(Date.now()-1000).toISOString()};
 const data=JSON.stringify({sourceThemeFile:themeName,status:accepted?'ready':'watchlist_only',evidencePolicyVersion:'1.0',themeAligned:accepted?[{topic:'Synthetic topic'}]:[],emerging:[],watchlist:accepted?[]:[{topic:'Synthetic deferred topic'}],generatedAt:new Date().toISOString()});
 const proof={privacy:{runId,fileName:themeName,sha256:sha(theme),themeCount:1,policyVersion:approval.policyVersion},candidate:{fileName:candidateName,sha256:sha(data)},brief:{fileName:briefName,sha256:sha(brief)}};
 for(const [n,v]of [[themeName,theme],[briefName,brief],[candidateName,data],['privacy-status.json',JSON.stringify(approval)],['candidate-status.json',JSON.stringify(proof)]])fs.writeFileSync(path.join(root,n),v);
 const command=id=>{const expression=(id===undefined?beforeNode:afterNode).parameters.command.slice(3,-2);const old=String.prototype.base64Encode;String.prototype.base64Encode=function(){return Buffer.from(this.toString()).toString('base64');};try{return new Function('$','$execution','return '+expression)(()=>({first:()=>({json:{stdout:JSON.stringify(proof)}})}),{id});}finally{if(old)String.prototype.base64Encode=old;else delete String.prototype.base64Encode;}};
 const invoke=(id,p=proof)=>{const args=[path.join(src,'pipeline-artifact.cjs'),'verify-candidate',Buffer.from(JSON.stringify(p)).toString('base64')];if(id!==undefined)args.push(id);return cp.spawnSync(process.execPath,args,{env:{...process.env,IAS_PRIVACY_ROOT:root},encoding:'utf8'});};
 const unchanged=read(),marker=fs.readFileSync(path.join(root,'candidate-status.json'),'utf8');
 assert.throws(()=>stages.handoff(runId,undefined,'planning',root),/Invalid handoff/);assert.deepEqual(read(),unchanged);
 assert(command(undefined).endsWith(Buffer.from(JSON.stringify(proof)).toString('base64')));assert(command('19812').endsWith(' 19812'));
 assert.equal(invoke(undefined).status,1);assert.deepEqual(read(),unchanged);
 for(let i=0;i<2;i++){const result=invoke('19812');assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),proof);assert.deepEqual(read(),unchanged);}
 for(const id of ['19809','19811','999','not-an-execution','undefined','']){assert.equal(invoke(id).status,1,id);assert.deepEqual(read(),unchanged);}
 assert.equal(invoke('19812',{...proof,privacy:{...proof.privacy,runId:crypto.randomUUID()}}).status,1);
 fs.writeFileSync(path.join(root,briefName),'tampered synthetic brief');assert.equal(invoke('19812').status,1);fs.writeFileSync(path.join(root,briefName),brief);
 fs.writeFileSync(path.join(root,'privacy-status.json'),JSON.stringify({...approval,approvedAt:new Date(Date.now()-25*3600000).toISOString()}));assert.equal(invoke('19812').status,1);fs.writeFileSync(path.join(root,'privacy-status.json'),JSON.stringify(approval));
 assert.deepEqual(read(),unchanged);assert.equal(fs.readFileSync(path.join(root,'candidate-status.json'),'utf8'),marker);assert(!fs.existsSync(path.join(root,'.run-status.lock')));
 stages.fail({executionId:'19812',reasonCode:'stage_failed'},root);assert.equal(invoke('19812').status,1);assert(!fs.existsSync(path.join(root,'.run-status.lock')));
 console.log('PASS '+(accepted?'selected':'all-deferred')+': missing argument fails; explicit same-owner repeated calls preserve status; ancestor/unrelated-at-lineage-limit/malformed/stale/tampered/terminal calls fail closed.');
}
{
 const root=fs.mkdtempSync(path.join(parent,'transfer-contract-')),runId=crypto.randomUUID();
 stages.record({begin:true,runId,executionId:'101',stage:'privacy',state:'running',reasonCode:'started'},root);
 stages.record({runId,stage:'planning',state:'running',reasonCode:'stage_started'},root);
 assert.equal(stages.handoff(runId,'999','planning',root).executionId,'999');
 console.log('PASS compatibility limit: a new ID is permitted by the existing transfer contract when lineage capacity remains; no general unrelated-ID rejection claimed.');
}
console.log('PASS exact expression evaluation, single-command-only graph change, root preservation, and unrecognized graph rejection.');
