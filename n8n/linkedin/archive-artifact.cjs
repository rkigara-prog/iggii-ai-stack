// Completed content cycles only. Source transcripts and arbitrary files are never scanned.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {readable}=require('./content-access.cjs');
const root=process.env.IAS_PRIVACY_ROOT||'/data/output/ias-linkedin-acceptance';
const archiveRoot=process.env.IAS_ARCHIVE_ROOT||path.join(path.dirname(root),'Archive',path.basename(root));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const patterns={theme:/^theme-list-model-eval-qwen35-\d{4}-\d{2}-\d{2}\.txt$/,candidate:/^content-candidates-model-eval-\d{4}-\d{2}-\d{2}\.json$/,brief:/^content-brief-model-eval-\d{4}-\d{2}-\d{2}\.md$/,plan:/^linkedin-editorial-plan-model-eval-\d{4}-\d{2}-\d{2}\.json$/};
function read(name,pattern){
 check(typeof name==='string'&&pattern.test(name),'Invalid artifact name');
 const p=path.join(root,name);check(fs.lstatSync(p).isFile(),'Artifact must be a regular file');
 return {name,bytes:fs.readFileSync(p)};
}
function atomic(p,bytes){const tmp=p+'.'+crypto.randomUUID();fs.writeFileSync(tmp,bytes,{mode:0o640,flag:'wx'});readable(tmp);fs.renameSync(tmp,p);}
function snapshot(input,bootstrap=false){
 check(input&&typeof input==='object','Missing completion proof');
 if(!bootstrap) {
  const {candidate}=require('./pipeline-artifact.cjs');
  check(JSON.stringify(candidate(JSON.parse(fs.readFileSync(path.join(root,'candidate-status.json')))))===JSON.stringify(input.proof),'Candidate proof changed');
 }
 const candidateName=bootstrap?input.candidateFile:input.proof.candidate.fileName;
 const c=read(candidateName,patterns.candidate),data=JSON.parse(c.bytes);
 const t=read(data.sourceThemeFile,patterns.theme);
 const b=read(candidateName.replace('content-candidates-','content-brief-').replace('.json','.md'),patterns.brief);
 const p=read(input.planFile,patterns.plan),plan=JSON.parse(p.bytes);
 const md=read(input.planFile.replace('.json','.md'),/^linkedin-editorial-plan-model-eval-\d{4}-\d{2}-\d{2}\.md$/);
 check((data.status==='ready'||(data.status==='watchlist_only'&&data.evidencePolicyVersion==='1.0'))&&plan.sourceCandidateFile===c.name&&plan.sourceThemeFile===t.name,'Cycle lineage mismatch');
 check(['ready','partial','insufficient_verified_topics'].includes(plan.status),'Incomplete plan');
 check(plan.policySummary?.automaticPublishingAllowed===false,'Publishing guard missing');
 check(Number.isFinite(Date.parse(plan.generatedAt))&&Date.parse(plan.generatedAt)>=Date.parse(data.generatedAt),'Plan predates candidate');
 const files=[t,b,c,md,p],entries=files.map(f=>({fileName:f.name,sha256:hash(f.bytes),bytes:f.bytes.length}));
 const cycleHash=hash(Buffer.from(JSON.stringify(entries)));
 const cycle=plan.generatedAt.slice(0,10)+'-'+cycleHash;
 // Refuse a symlink archive root; never follow links to overwrite unrelated files.
 check(fs.lstatSync(archiveRoot).isDirectory(),'Archive root must already exist');
 const dest=path.join(archiveRoot,cycle);
 if(fs.existsSync(dest)) {
  check(fs.lstatSync(dest).isDirectory(),'Archive collision');
  for(const f of files)check(fs.lstatSync(path.join(dest,f.name)).isFile()&&hash(fs.readFileSync(path.join(dest,f.name)))===hash(f.bytes),'Archive collision');
  check(fs.lstatSync(path.join(dest,'manifest.json')).isFile(),'Manifest collision');
  const existing=JSON.parse(fs.readFileSync(path.join(dest,'manifest.json')));
  check(existing.cycleHash===cycleHash&&JSON.stringify(existing.files)===JSON.stringify(entries),'Manifest collision');
 } else {
  const staging=path.join(archiveRoot,'.pending-'+crypto.randomUUID());fs.mkdirSync(staging,{mode:0o750});readable(staging,true);
  // A failed copy leaves a private pending directory for recovery, never removes sources.
  for(const f of files){fs.writeFileSync(path.join(staging,f.name),f.bytes,{mode:0o640,flag:'wx'});readable(path.join(staging,f.name));check(hash(fs.readFileSync(path.join(staging,f.name)))===hash(f.bytes),'Archive copy mismatch');}
  fs.writeFileSync(path.join(staging,'manifest.json'),JSON.stringify({version:1,cycleHash,completedAt:plan.generatedAt,archivedAt:new Date().toISOString(),bootstrap,files:entries},null,2)+'\n',{mode:0o640,flag:'wx'});
  readable(path.join(staging,'manifest.json'));fs.renameSync(staging,dest);
 }
 readable(dest,true);for(const f of files)readable(path.join(dest,f.name));readable(path.join(dest,'manifest.json'));
 for(const f of files){check(hash(fs.readFileSync(path.join(root,f.name)))===hash(f.bytes),'Source changed during archive');readable(path.join(root,f.name));}
 const relative=path.relative(root,dest).split(path.sep).join('/');
 atomic(path.join(root,'current-status.json'),JSON.stringify({version:1,completedAt:plan.generatedAt,archive:relative,cycleHash,files:entries},null,2)+'\n');
 atomic(path.join(root,'CURRENT.md'),`# Latest completed LinkedIn cycle\n\nCompleted: ${plan.generatedAt}. Plan status: ${plan.status}.\n\nRead the preserved files below. They stay available during the next run.\n\n`+files.map(f=>`- [${f.name}](${relative}/${f.name})`).join('\n')+'\n\nThe matching working outputs are in this folder. They may change during a run; use these preserved links for review.\n\nRecord edits and approvals in Reviews. Read START-HERE.md for instructions. LinkedIn posting is disabled.\n');
 return {archived:true,cycleHash,fileCount:files.length,sourceFilesPreserved:true};
}
function main(){const [action,encoded]=process.argv.slice(2);check(['complete','snapshot-existing'].includes(action),'Unknown action');check(encoded&&/^[A-Za-z0-9+/]+={0,2}$/.test(encoded),'Invalid input');console.log(JSON.stringify(snapshot(JSON.parse(Buffer.from(encoded,'base64')),action==='snapshot-existing')));}
if(require.main===module){try{main();}catch(e){console.error('Archive blocked: '+e.message);process.exitCode=1;}}
module.exports={snapshot};
