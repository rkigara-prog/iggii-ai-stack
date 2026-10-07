// Synthetic fixtures only. Never use this helper in production workflow definitions.
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=process.env.IAS_PRIVACY_ROOT;
if(!root||!root.includes('/ias-orchestration/fixtures'))throw Error('Fixture root required');
const [action,mode]=process.argv.slice(2),file='theme-list-model-eval-qwen35-2026-10-06.txt';
const run=(...args)=>JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'privacy-artifact.cjs'),...args],{env:process.env,encoding:'utf8'}));
const event=name=>fs.appendFileSync(path.join(root,'events.jsonl'),JSON.stringify({event:name})+'\n',{mode:0o600});
const current=()=>JSON.parse(fs.readFileSync(path.join(root,'mode.json'))).mode;
if(action==='begin'){
 fs.mkdirSync(root,{recursive:true,mode:0o700});for(const n of fs.readdirSync(root))fs.unlinkSync(path.join(root,n));
 fs.writeFileSync(path.join(root,'mode.json'),JSON.stringify({mode}),{mode:0o600});
 fs.writeFileSync(path.join(root,file),mode==='privacy-fail'?'- staffing\n':'- testing security controls before broad deployment\n',{mode:0o600});
 console.log(JSON.stringify(run('begin')));
}else if(action==='research'){
 event('enrichment');if(current()==='enrichment-fail')throw Error('Synthetic enrichment failure');
 console.log(JSON.stringify({ok:true}));
}else if(action==='handoff'){
 if(current()==='stale-candidate'){const p=JSON.parse(fs.readFileSync(path.join(root,'candidate-status.json')));fs.appendFileSync(path.join(root,p.candidate.fileName),' ');}
 console.log(fs.readFileSync(path.join(root,'candidate-status.json'),'utf8'));
}else if(action==='planner'){
 event('planner');if(current()==='planner-fail')throw Error('Synthetic planner failure');console.log(JSON.stringify({ok:true}));
}else if(action==='complete'){event('complete');console.log(JSON.stringify({complete:true}));}
else throw Error('Unknown fixture action');
