// Only the root Compose stack and its mounted LiteLLM configuration are runtime inputs.
// CI/workflow edits still run checks, but do not reconcile the shared service by themselves.
const fs=require('node:fs'),{execFileSync}=require('node:child_process');
function requiresDeploy(paths){return paths.some(p=>p==='docker-compose.yml'||p.startsWith('litellm/'));}
function changedPaths(event,exec=execFileSync){
 const valid=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s)&&!/^0+$/.test(s);
 if(!valid(event.before)||!valid(event.after)||event.deleted)throw Error('Cannot establish runtime change range');
 // No rename detection: a move away from a runtime path must count as a deletion.
 return exec('git',['diff','--no-renames','--name-only','-z',event.before,event.after,'--'],{encoding:'utf8'}).split('\0').filter(Boolean);
}
if(require.main===module){try{
 const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 const deploy=requiresDeploy(changedPaths(event));
 fs.appendFileSync(process.env.GITHUB_OUTPUT,`deploy=${deploy}\n`);
 console.log(deploy?'Runtime inputs changed; deployment eligible.':'No runtime input changes; deployment skipped.');
}catch{console.error('Runtime change classification failed; deployment blocked.');process.exitCode=1;}}
module.exports={requiresDeploy,changedPaths};
