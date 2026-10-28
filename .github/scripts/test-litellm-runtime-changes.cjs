const assert=require('node:assert/strict');const {requiresDeploy,changedPaths}=require('./litellm-runtime-changes.cjs');
for(const paths of [['n8n/linkedin/stage-result.cjs'],['README.md'],['.github/workflows/deploy.yml'],['.github/scripts/litellm-runtime-changes.cjs'],['ops/caddy/Dockerfile'],[]])assert.equal(requiresDeploy(paths),false);
for(const paths of [['docker-compose.yml'],['litellm/config.yaml'],['n8n/linkedin/stage-result.cjs','litellm/config.yaml']])assert.equal(requiresDeploy(paths),true);
const event={before:'a'.repeat(40),after:'b'.repeat(40)};
const files=changedPaths(event,(exe,args)=>{assert.equal(exe,'git');assert.deepEqual(args,['diff','--no-renames','--name-only','-z',event.before,event.after,'--']);return 'litellm/deleted.yaml\0docs/moved.yaml\0';});assert(requiresDeploy(files));
for(const e of [{...event,before:'0'.repeat(40)},{...event,after:'--bad'},{...event,deleted:true},{}])assert.throws(()=>changedPaths(e));
assert.throws(()=>changedPaths(event,()=>{throw Error('Missing base');}));
console.log('PASS runtime deployment matrix, mixed changes, removed/renamed runtime paths, and fail-closed range handling');
