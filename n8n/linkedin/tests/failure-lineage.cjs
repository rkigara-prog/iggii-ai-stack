const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const s=require('../stage-result.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ias-lineage-'));
let id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const read=()=>JSON.parse(fs.readFileSync(path.join(root,'run-status.json')));
const begin=(runId=id,executionId='101')=>s.record({begin:true,runId,executionId,stage:'privacy',state:'running',reasonCode:'started'},root);
const stage=stage=>s.record({runId:id,stage,state:'running',reasonCode:'stage_started'},root);
const fail=executionId=>s.fail({executionId,reasonCode:'stage_failed'},root);
begin();stage('research');s.handoff(id,'19716','research',root);
assert.deepEqual(read().ancestorExecutionIds,['101']);
assert.throws(()=>fail('101'));assert.throws(()=>s.handoff(id,'101','research',root));
assert.deepEqual(s.handoff(id,'19716','research',root),read());
const terminal=fail('19716');assert.deepEqual(fail('101'),terminal);assert.deepEqual(fail('19716'),terminal);
assert.throws(()=>fail('999'));assert.equal(fs.readdirSync(path.join(root,'alerts')).length,1);
assert(!fs.existsSync(path.join(root,'.run-status.lock')));
// Real CLI duplicate parent event, matching the observed nested failure pattern.
const cli=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../stage-result.cjs'),'fail',Buffer.from(JSON.stringify({executionId:'101',reasonCode:'stage_failed'})).toString('base64')],{env:{...process.env,IAS_PRIVACY_ROOT:root},encoding:'utf8'});
assert.equal(cli.status,0,cli.stderr);assert.deepEqual(read(),terminal);
const newer='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';begin(newer,'201');assert.throws(()=>fail('101'));assert.throws(()=>s.handoff(id,'19716','research',root));assert.equal(read().runId,newer);
id='cccccccc-cccc-cccc-cccc-cccccccccccc';
// Three-level lineage preserves actual failing owner and one alert for that run.
begin();stage('research');s.handoff(id,'102','research',root);stage('planning');s.handoff(id,'103','planning',root);
const plannerFailure=fail('103');assert.deepEqual(fail('102'),plannerFailure);assert.deepEqual(fail('101'),plannerFailure);
assert.equal(read().executionId,'103');assert.deepEqual(read().ancestorExecutionIds,['101','102']);
id='dddddddd-dddd-dddd-dddd-dddddddddddd';
// Success cannot be rewritten by ancestors or the current execution.
begin();stage('research');s.handoff(id,'102','research',root);
s.record({runId:id,stage:'archive',state:'content_ready',reasonCode:'accepted_topics',counts:{selected:1}},root);
assert.throws(()=>fail('101'));assert.throws(()=>fail('102'));assert.equal(read().state,'content_ready');
assert(!fs.existsSync(path.join(root,'.run-status.lock')));
console.log('PASS nested lineage, duplicate CLI, out-of-order, superseded run, terminal ownership, lock release, alert deduplication');

// Installed helper entry rejects a bad artifact before changing execution ownership.
id='eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';begin();stage('research');
const crypto=require('crypto'),fileName='theme-list-model-eval-qwen35-2026-10-29.txt',bytes='- Public technology research\n';
const proof={state:'approved',runId:id,fileName,themeCount:1,policyVersion:require('../privacy-policy.cjs').policyVersion,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),approvedAt:new Date().toISOString()};
fs.writeFileSync(path.join(root,fileName),bytes);fs.writeFileSync(path.join(root,'privacy-status.json'),JSON.stringify(proof));
const callTheme=input=>cp.spawnSync(process.execPath,[path.resolve(__dirname,'../pipeline-artifact.cjs'),'theme',Buffer.from(JSON.stringify(input)).toString('base64'),'102'],{env:{...process.env,IAS_PRIVACY_ROOT:root},encoding:'utf8'});
const before=read();assert.equal(callTheme({privacy:{...proof,sha256:'0'.repeat(64)}}).status,1);assert.deepEqual(read(),before);
assert.equal(callTheme({}).status,0);assert.equal(read().executionId,'102');assert.deepEqual(read().ancestorExecutionIds,['101']);
s.record({runId:id,stage:'research',state:'stalled',reasonCode:'deadline_exceeded'},root);assert.throws(()=>fail('101'));assert.equal(read().state,'stalled');
assert(!fs.existsSync(path.join(root,'.run-status.lock')));
console.log('PASS actual artifact helper proof rejection, successful handoff, stalled descendant rejection');
// Direct planner-entry CLI: real synthetic candidate/brief files and proof marker.
id='ffffffff-ffff-ffff-ffff-ffffffffffff';begin();stage('research');s.handoff(id,'102','research',root);stage('planning');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const approval={...proof,runId:id,approvedAt:new Date().toISOString()};
fs.writeFileSync(path.join(root,'privacy-status.json'),JSON.stringify(approval));
const candidateName='content-candidates-model-eval-2026-10-29.json',briefName='content-brief-model-eval-2026-10-29.md';
const candidateBytes=JSON.stringify({sourceThemeFile:fileName,status:'ready',themeAligned:[{topic:'Public technology'}],emerging:[],generatedAt:new Date().toISOString()});
const briefBytes='# Synthetic public research\n';
fs.writeFileSync(path.join(root,candidateName),candidateBytes);fs.writeFileSync(path.join(root,briefName),briefBytes);
const plannerProof={privacy:{runId:id,fileName,sha256:sha(bytes),themeCount:1,policyVersion:approval.policyVersion},candidate:{fileName:candidateName,sha256:sha(candidateBytes)},brief:{fileName:briefName,sha256:sha(briefBytes)}};
const marker=path.join(root,'candidate-status.json');fs.writeFileSync(marker,JSON.stringify(plannerProof));
const callPlanner=(input,executionId='103')=>cp.spawnSync(process.execPath,[path.resolve(__dirname,'../pipeline-artifact.cjs'),'verify-candidate',Buffer.from(JSON.stringify(input)).toString('base64'),executionId],{env:{...process.env,IAS_PRIVACY_ROOT:root},encoding:'utf8'});
const rejectPlanner=(input,executionId='103')=>{const old=read(),out=callPlanner(input,executionId);assert.equal(out.status,1,out.stdout);assert.deepEqual(read(),old);assert(!fs.existsSync(path.join(root,'.run-status.lock')));};
rejectPlanner({...plannerProof,candidate:{...plannerProof.candidate,sha256:'0'.repeat(64)}});
fs.writeFileSync(path.join(root,briefName),'tampered synthetic brief');rejectPlanner({});fs.writeFileSync(path.join(root,briefName),briefBytes);
fs.writeFileSync(marker,JSON.stringify({...plannerProof,privacy:{...plannerProof.privacy,runId:newer}}));rejectPlanner({});fs.writeFileSync(marker,JSON.stringify(plannerProof));
fs.writeFileSync(path.join(root,'privacy-status.json'),JSON.stringify({...approval,approvedAt:new Date(Date.now()-25*3600*1000).toISOString()}));rejectPlanner({});fs.writeFileSync(path.join(root,'privacy-status.json'),JSON.stringify(approval));
rejectPlanner(plannerProof,'101'); // Existing ancestor cannot re-enter as the planner.
rejectPlanner(plannerProof,'not-an-execution');
const validPlanner=callPlanner(plannerProof);assert.equal(validPlanner.status,0,validPlanner.stderr);assert.deepEqual(JSON.parse(validPlanner.stdout),plannerProof);
assert.equal(read().executionId,'103');assert.deepEqual(read().ancestorExecutionIds,['101','102']);
const owned=read();assert.equal(callPlanner(plannerProof).status,0);assert.deepEqual(read(),owned);
const failedPlanner=fail('103');assert.deepEqual(fail('102'),failedPlanner);assert.deepEqual(fail('101'),failedPlanner);
begin('11111111-1111-1111-1111-111111111111','201');rejectPlanner(plannerProof); // Valid old artifacts cannot claim a new run.
console.log('PASS planner CLI valid/duplicate handoff, supplied-proof mismatch, modified bytes, stale run/approval, ancestor re-entry, malformed identity, superseded status');
