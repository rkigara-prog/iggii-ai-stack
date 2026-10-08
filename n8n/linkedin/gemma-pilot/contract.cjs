'use strict';
const crypto=require('node:crypto');
const policy=require('../evidence/policy.cjs');
const fs=require('node:fs');
const config=require('./runtime.json');
const prompt=fs.readFileSync(__dirname+'/writer-prompt.txt','utf8');
const must=(v,m)=>{if(!v)throw Error(m);};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const clean=s=>String(s).normalize('NFC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
const keys=(x,allowed)=>must(x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>allowed.includes(k)),'Unexpected packet fields');
const str=x=>typeof x==='string'&&x.trim().length>0;
function validate(packet){
 keys(packet,['requestId','classification','brief','claims','sources','sourceAssessments','approval']);
 must(/^[a-zA-Z0-9_-]{1,64}$/.test(packet.requestId),'Invalid request ID');
 must(packet.classification==='approved_public_content','Only human-approved public content');
 keys(packet.brief,['audience','angle','contentKind']);
 must(str(packet.brief.audience)&&str(packet.brief.angle)&&['current_news','evergreen','historical'].includes(packet.brief.contentKind),'Invalid public editorial brief');
 must(Array.isArray(packet.claims)&&packet.claims.length>0&&packet.claims.length<=3,'One to three approved claims required');
 must(Array.isArray(packet.sources)&&packet.sources.length>0&&Array.isArray(packet.sourceAssessments),'Missing evidence');
 const ids=new Set();
 for(const s of packet.sources){
  keys(s,['id','requestedUrl','finalUrl','canonicalUrl','publisher','publicationDate','retrievedAt','retrievalStatus','passages']);
  must(str(s.id)&&!ids.has(s.id),'Duplicate/missing source');ids.add(s.id);
  must(str(s.publisher)&&str(s.retrievedAt)&&Number.isFinite(Date.parse(s.retrievedAt)),'Missing retrieval metadata');
  must(s.publicationDate===null||str(s.publicationDate),'Publication date must be retained or explicitly null');
  for(const key of ['requestedUrl','finalUrl','canonicalUrl']){const u=new URL(s[key]);must(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password,'Invalid public source URL');}
  must(s.retrievalStatus==='retrieved'&&Array.isArray(s.passages)&&s.passages.length>0,'Unavailable source text');
  const pids=new Set();for(const p of s.passages){keys(p,['id','text']);must(str(p.id)&&str(p.text)&&!pids.has(p.id),'Invalid passage');pids.add(p.id);}
 }
 must(new Set(packet.sourceAssessments.map(a=>a.sourceId)).size===packet.sourceAssessments.length,'Ambiguous source judgments');
 for(const a of packet.sourceAssessments){
  keys(a,['sourceId','role','originMethod','originId','reason','basis']);
  keys(a.basis,['sourceId','passageId','quote']);
 }
 const claimIds=new Set();
 for(const c of packet.claims){
  keys(c,['id','text','form','attribution','factType','exception','citations','judgment']);
  must(str(c.id)&&!claimIds.has(c.id),'Duplicate/missing claim ID');claimIds.add(c.id);
  must(Array.isArray(c.citations),'Missing citations');
  keys(c.judgment,['support','reason',...policy.dimensions]);
  if(c.attribution)keys(c.attribution,['publisher','sourceId']);
  for(const ref of c.citations)keys(ref,['sourceId','passageId','quote']);
  const check=policy.claimGate(c,packet.sources,packet.sourceAssessments);
  must(check.passed,'Evidence gate: '+check.reasons.join(','));
 }
 const {approval,...content}=packet;
 keys(approval,['status','by','at','bundleSha256','authorizationType','evidenceSelectionBy','blindReviewCompleted','publicationApproved']);
 const human=approval.status==='approved_for_drafting'&&['Robert','Leigh'].includes(approval.by);
 const pilot=approval.status==='authorized_pilot_drafting'&&approval.by==='user'&&approval.authorizationType==='bounded_manual_pilot'&&approval.evidenceSelectionBy==='Codex'&&approval.blindReviewCompleted===false&&approval.publicationApproved===false;
 must((human||pilot)&&Number.isFinite(Date.parse(approval.at)),'Explicit drafting approval or bounded pilot authorization required');
 must(approval.bundleSha256===digest(content),'Approval does not match this complete evidence/brief packet');
 must(Buffer.byteLength(JSON.stringify(packet))<=config.maxPacketBytes,'Packet too large; defer without shortening evidence');
 return packet;
}
function request(packet){
 validate(packet);
 // No private paths, transcript themes, approval identities or arbitrary endpoint/model fields.
 const {brief,claims,sources,sourceAssessments}=packet;
 return {model:config.modelAlias,stream:false,temperature:0.8,top_p:0.95,seed:714919,max_tokens:config.maxOutputTokens,chat_template_kwargs:{enable_thinking:false},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify({brief,approvedClaims:claims,sources,sourceAssessments})}]};
}
function result(packet,record){
 validate(packet);must(record.packetSha256===digest(packet),'Response/request mismatch');
 must(record.status==='response','Pilot did not produce a response: '+record.status);
 const choice=record.reply?.choices?.[0];must(choice?.finish_reason==='stop','Incomplete draft; no retry/fallback');
 const raw=choice.message?.content;must(typeof raw==='string','Missing draft object');
 let body=raw.trim(),adapter='strict_json';
 const fence=body.match(/^```(?:json)?\s*\n([\s\S]*?)```$/);if(fence){body=fence[1];adapter='whole_message_json_fence';}
 const output=JSON.parse(body);must(Object.keys(output).sort().join(',')==='claims,draft,recommendations','Unexpected output schema');
 must(str(output.draft)&&Array.isArray(output.claims)&&output.claims.length>0&&Array.isArray(output.recommendations)&&output.recommendations.every(str),'Malformed writing output');
 for(const c of output.claims){
  must(Object.keys(c).sort().join(',')==='approvedClaimId,passageId,quote,sourceId,text'&&Object.values(c).every(str),'Malformed writer claim');
  const approved=packet.claims.find(a=>a.id===c.approvedClaimId);
  must(approved?.citations.some(r=>r.sourceId===c.sourceId&&r.passageId===c.passageId&&clean(r.quote)===clean(c.quote))&&policy.exactCitation(c,packet.sources),'Writer changed an approved citation binding');
 }
 const urls=output.draft.match(/https?:\/\/[^\s<>\])]+/g)||[];
 must(urls.every(u=>packet.sources.some(s=>s.canonicalUrl===u.replace(/[.,;]$/,''))),'Unapproved URL in prose');
 const cited=new Set(output.claims.map(c=>c.sourceId));
 must([...cited].every(id=>output.draft.includes(packet.sources.find(s=>s.id===id).canonicalUrl)),'Required attribution URL missing from draft');
 const fullProseReview=policy.reviewProse(output.draft,packet.claims);
 return {label:'PILOT DRAFT — NOT APPROVED FOR PUBLICATION',requestId:packet.requestId,packetSha256:digest(packet),model:config.upstream,artifactSha256:config.sha256,adapter,draft:output.draft,writerClaims:output.claims,recommendations:output.recommendations,approvedClaims:packet.claims,sources:packet.sources,sourceAssessments:packet.sourceAssessments,claimsApproval:packet.approval,fullProseReview,humanApprovalRequired:true,publicationApproval:null,automaticPublishingAllowed:false,semanticVerification:'No new semantic proof; all prose and source judgments require human review'};
}
module.exports={validate,request,result,digest};
if(require.main===module){
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 const output=process.argv[2]==='result'?result(input.packet,input.record):process.argv[2]==='digest'?digest(input):request(input);
 process.stdout.write(JSON.stringify(output));
}
