// Private local metadata/outbox only. Never store model text, URLs, errors or destinations.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const stages=new Set(['privacy','research','planning','archive']);
const states=new Set(['running','failed','stalled','completed_no_research','completed_all_deferred','content_ready']);
const codes=new Set(['started','stage_started','model_timeout','model_response_invalid','privacy_blocked','evidence_fetch_failed','evidence_binding_failed','stage_failed','archive_failed','all_excluded','all_deferred','accepted_topics','deadline_exceeded']);
const terminal=s=>s!=='running';
function result(input,previous,now=new Date().toISOString()){
 if(!input||!/^[a-f0-9-]{36}$/.test(input.runId)||!stages.has(input.stage)||!states.has(input.state)||!codes.has(input.reasonCode))throw Error('Invalid stage metadata');
 if(previous&&input.runId!==previous.runId&&!input.begin)throw Error('Superseded run');
 if(input.expectedExecutionId&&input.expectedExecutionId!==previous?.executionId)throw Error('Superseded execution');
 if(input.expectedStatus&&JSON.stringify(input.expectedStatus)!==JSON.stringify(previous))throw Error('Status changed');
 if(input.executionId!==undefined&&!/^\d{1,20}$/.test(input.executionId))throw Error('Invalid execution ID');
 if(input.begin&&(input.stage!=='privacy'||input.state!=='running'||input.reasonCode!=='started'))throw Error('Invalid begin');
 if(!previous&&!input.begin)throw Error('Missing run');
 if(previous?.runId===input.runId&&terminal(previous.state)){
  if(previous.state===input.state&&previous.stage===input.stage&&previous.reasonCode===input.reasonCode&&JSON.stringify(previous.counts)===JSON.stringify(input.counts||{}))return previous;
  throw Error('Run already terminal');
 }
 const counts={};for(const k of ['selected','deferred','retrieved','unavailable'])if(input.counts?.[k]!==undefined){if(!Number.isInteger(input.counts[k])||input.counts[k]<0||input.counts[k]>100000)throw Error('Invalid count');counts[k]=input.counts[k];}
 return {version:1,runId:input.runId,executionId:input.executionId||previous?.executionId,stage:input.stage,state:input.state,reasonCode:input.reasonCode,startedAt:input.begin?now:previous.startedAt,updatedAt:now,counts,automaticPublishingAllowed:false};
}
function inspect(previous,now=Date.now(),maxAgeMs=90*60*1000){if(previous?.state==='running'&&now-Date.parse(previous.updatedAt)>maxAgeMs)return {...previous,state:'stalled',reasonCode:'deadline_exceeded'};return previous;}
function alertPayload(row){if(!row||!terminal(row.state)||row.state==='content_ready')return null;return {eventId:crypto.createHash('sha256').update(row.runId+'|'+row.state+'|'+row.stage).digest('hex'),runId:row.runId,stage:row.stage,state:row.state,reasonCode:row.reasonCode,counts:row.counts,delivery:'local_only',automaticPublishingAllowed:false};}
function withLock(root,operation){
 if(!root)throw Error('Root required');const file=path.join(root,'run-status.json'),lock=path.join(root,'.run-status.lock');
 const fd=fs.openSync(lock,'wx',0o600);try{
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
 const write=(target,value)=>{const tmp=target+'.'+crypto.randomUUID();try{fs.writeFileSync(tmp,JSON.stringify(value),{mode:0o600,flag:'wx'});fs.renameSync(tmp,target);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}};
 const record=input=>{const row=result(input,read());const alert=alertPayload(row);
 // Persist the deterministic outbox first. If this fails, status stays retryable.
 // Consumers must confirm eventId matches the terminal run-status before delivery.
 if(alert){const out=path.join(root,'alerts');fs.mkdirSync(out,{recursive:true,mode:0o700});write(path.join(out,alert.eventId+'.json'),alert);}
 write(file,row);return row;};
 return operation({read,record});
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
function record(input,root=process.env.IAS_PRIVACY_ROOT){return withLock(root,tx=>tx.record(input));}
function inspectStored(root=process.env.IAS_PRIVACY_ROOT,now=Date.now()){return withLock(root,tx=>{const old=tx.read(),row=inspect(old,now);return row!==old?tx.record({...row,expectedStatus:old}):row;});}
if(require.main===module){try{
 const [action,encoded]=process.argv.slice(2);
 const current=()=>JSON.parse(fs.readFileSync(path.join(process.env.IAS_PRIVACY_ROOT,'run-status.json')));
 if(action==='inspect'){
  const row=inspectStored();
  console.log(JSON.stringify({status:row,alert:alertPayload(row)}));
 }else if(action==='record')console.log(JSON.stringify(record(JSON.parse(Buffer.from(encoded,'base64')))));
 else if(action==='fail'){
  const input=JSON.parse(Buffer.from(encoded,'base64')),old=current();
  if(!/^\d{1,20}$/.test(input.executionId)||input.executionId!==old.executionId)throw Error('Unmatched execution');
  console.log(JSON.stringify(record({runId:old.runId,expectedExecutionId:input.executionId,expectedStatus:old,stage:old.stage,state:'failed',reasonCode:old.stage==='archive'?'archive_failed':input.reasonCode})));
 }else throw Error('Invalid action');
}catch{console.error('Stage metadata operation failed');process.exitCode=1;}}
module.exports={result,inspect,inspectStored,alertPayload,record,withLock};
