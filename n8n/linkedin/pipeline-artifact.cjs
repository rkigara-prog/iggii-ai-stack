// Success-only orchestration metadata. No source/content text is returned.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {readable}=require('./content-access.cjs');
const {validate}=require('./privacy-artifact.cjs');
const root=process.env.IAS_PRIVACY_ROOT||'/data/output/ias-linkedin-acceptance';
const marker=path.join(root,'candidate-status.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function requireThat(ok){if(!ok)throw Error('Pipeline handoff blocked');}
function samePrivacy(expected){
 const actual=validate(expected?.runId);
 if(expected)requireThat(actual.sha256===expected.sha256&&actual.fileName===expected.fileName);
 return actual;
}
function file(name,pattern){requireThat(typeof name==='string'&&pattern.test(name));const p=path.join(root,name);return {p,bytes:fs.readFileSync(p)};}
function candidate(proof){
 const privacy=samePrivacy(proof.privacy);
 const c=file(proof.candidate.fileName,/^content-candidates-model-eval-\d{4}-\d{2}-\d{2}\.json$/);
 const b=file(proof.brief.fileName,/^content-brief-model-eval-\d{4}-\d{2}-\d{2}\.md$/);
 requireThat(hash(c.bytes)===proof.candidate.sha256&&hash(b.bytes)===proof.brief.sha256);
 const data=JSON.parse(c.bytes),approval=JSON.parse(fs.readFileSync(path.join(root,'privacy-status.json')));
 requireThat(data.sourceThemeFile===privacy.fileName&&data.status==='ready'&&Array.isArray(data.themeAligned)&&Array.isArray(data.emerging)&&data.themeAligned.length+data.emerging.length>0);
 const created=Date.parse(data.generatedAt);
 requireThat(Number.isFinite(created)&&created>=Date.parse(approval.approvedAt)&&created<=Date.now());
 return {...proof,privacy};
}
function main(){
 const [action,encoded]=process.argv.slice(2);
 requireThat(typeof encoded==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(encoded));
 const input=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 requireThat(input&&typeof input==='object'&&!Array.isArray(input));
 if(action==='theme'){
  requireThat(Object.keys(input).length===0||(Object.keys(input).length===1&&input.privacy));
  console.log(JSON.stringify(samePrivacy(input.privacy)));
 }else if(action==='record'){
  requireThat(input.privacy&&input.candidateFile&&input.briefFile);
  const privacy=samePrivacy(input.privacy);
  const c=file(input.candidateFile,/^content-candidates-model-eval-\d{4}-\d{2}-\d{2}\.json$/),b=file(input.briefFile,/^content-brief-model-eval-\d{4}-\d{2}-\d{2}\.md$/);
  const proof=candidate({privacy,candidate:{fileName:input.candidateFile,sha256:hash(c.bytes)},brief:{fileName:input.briefFile,sha256:hash(b.bytes)}});
  readable(c.p);readable(b.p);
  const tmp=marker+'.'+crypto.randomUUID();fs.writeFileSync(tmp,JSON.stringify(proof),{mode:0o640,flag:'wx'});readable(tmp);fs.renameSync(tmp,marker);
  console.log(JSON.stringify(proof));
 }else if(action==='verify-candidate'){
  const proof=candidate(JSON.parse(fs.readFileSync(marker)));
  if(Object.keys(input).length)requireThat(JSON.stringify(input)===JSON.stringify(proof));
  console.log(JSON.stringify(proof));
 }else throw Error('Pipeline handoff blocked');
}
if(require.main===module){try{main();}catch{console.error('Pipeline handoff blocked');process.exitCode=1;}}

module.exports={candidate};
