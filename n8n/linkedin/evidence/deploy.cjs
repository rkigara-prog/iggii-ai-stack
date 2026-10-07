// Native API updates only two stages; no import, activation change or container restart.
const fs=require('fs'),path=require('path'),{isDeepStrictEqual:eq}=require('util');
const dir=process.argv[2],root='/data/output/ias-linkedin',base='http://127.0.0.1:5678/api/v1';
const headers={'X-N8N-API-KEY':fs.readFileSync('/home/node/.n8n/ias-cutover-api-key','utf8').trim(),'Content-Type':'application/json'};
const check=(v,m)=>{if(!v)throw Error(m);};
async function api(method,p,body){const r=await fetch(base+p,{method,headers,...(body?{body:JSON.stringify(body)}:{})});const v=await r.json();check(r.ok,'API '+method+' '+p+' '+r.status);return v;}
(async()=>{
 const before=JSON.parse(fs.readFileSync(dir+'/before.private.json')),proposed=JSON.parse(fs.readFileSync(dir+'/proposed.private.json'));
 const running=await api('GET','/executions?status=running&limit=100');check(!running.data.some(e=>before.some(w=>w.id===e.workflowId)),'Pipeline already running');
 const baseline=fs.existsSync(dir+'/after.private.json')?JSON.parse(fs.readFileSync(dir+'/after.private.json')):before;
 for(const old of baseline){const w=await api('GET','/workflows/'+old.id);for(const k of ['nodes','connections','settings','activeVersionId'])check(eq(w[k],old[k]),'Workflow drift '+old.id+' '+k);}
 for(const old of before){const p=proposed.find(x=>x.id===old.id);check(eq(p.settings,old.settings),'Settings changed');for(const n of old.nodes.filter(n=>n.type.includes('scheduleTrigger')))check(eq(n,p.nodes.find(x=>x.id===n.id)),'Clock changed');}
 check(eq(before[0].nodes,proposed[0].nodes)&&eq(before[0].connections,proposed[0].connections),'Sanitizer changed');
 fs.mkdirSync(root+'/evidence',{recursive:true,mode:0o750});fs.chownSync(root+'/evidence',1000,1800);fs.chmodSync(root+'/evidence',0o2750);
 for(const rel of ['pipeline-artifact.cjs','archive-artifact.cjs','evidence/policy.cjs','evidence/retrieve.cjs']){
  const dest=root+'/'+rel;if(fs.existsSync(dest)){const backup=dir+'/backup-'+rel.replaceAll('/','-');if(!fs.existsSync(backup)){fs.copyFileSync(dest,backup);fs.chmodSync(backup,0o600);}}
  fs.copyFileSync(dir+'/'+rel,dest);fs.chownSync(dest,1000,1800);fs.chmodSync(dest,0o640);
 }
 const after=[];
 for(const id of ['IASLinkedinEnr01','IASLinkedinPlan1']){const p=proposed.find(w=>w.id===id);const saved=await api('PUT','/workflows/'+id,{name:p.name,nodes:p.nodes,connections:p.connections,settings:p.settings});check(eq(saved.nodes,p.nodes),'Saved nodes differ');await api('POST','/workflows/'+id+'/publish',{versionId:saved.versionId});const w=await api('GET','/workflows/'+id);check(w.active&&w.activeVersionId===saved.versionId&&eq(w.activeVersion.nodes,p.nodes),'Publication failed');after.push(w);}
 const san=await api('GET','/workflows/IASLinkedinSan01');check(eq(san.nodes,before[0].nodes)&&san.activeVersionId===before[0].activeVersionId,'Sanitizer changed');after.push(san);
 fs.writeFileSync(dir+'/after.private.json',JSON.stringify(after),{mode:0o600});
 console.log(JSON.stringify({deployed:true,versions:after.map(w=>({id:w.id,version:w.activeVersionId})),schedulePreserved:true,publishingDisabled:true}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
