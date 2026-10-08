// Export only the public drafting contract, never transcript/theme/cache metadata.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {digest}=require('./contract.cjs');
const policy=require('../evidence/policy.cjs');
const pick=(x,names)=>Object.fromEntries(names.filter(k=>x[k]!==undefined).map(k=>[k,x[k]]));
function prepare(artifact,candidateId,brief,requestId){
 const candidate=[...(artifact.themeAligned||[]),...(artifact.emerging||[])].find(c=>c.evidenceBundleId===candidateId);
 if(artifact.evidencePolicyVersion!=='1.0'||candidate?.verificationStatus!=='evidence_bound'||candidate.validation?.pageEvidencePassed!==true)throw Error('Choose an evidence-bound candidate, not a deferred/watchlist item');
 const sources=candidate.sources.map(s=>({...pick(s,['id','requestedUrl','finalUrl','canonicalUrl','publisher','retrievedAt','retrievalStatus']),publicationDate:s.publicationDate??null,passages:s.passages.map(p=>pick(p,['id','text']))}));
 const sourceAssessments=artifact.sourceAssessments.filter(a=>sources.some(s=>s.id===a.sourceId)).map(a=>({...pick(a,['sourceId','role','originMethod','originId','reason']),basis:pick(a.basis,['sourceId','passageId','quote'])}));
 const claims=candidate.claims.map((c,i)=>({...pick(c,['text','form','attribution','factType','exception','citations','judgment']),id:'approved-claim-'+(i+1)}));
 for(const claim of claims){const check=policy.claimGate(claim,sources,sourceAssessments);if(!check.passed)throw Error('Current evidence rule defers candidate: '+check.reasons.join(','));}
 const packet={requestId,classification:'approved_public_content',brief:pick(brief,['audience','angle','contentKind']),claims,sources,sourceAssessments};
 return {...packet,approval:{status:'pending',by:null,at:null,bundleSha256:digest(packet)}};
}
module.exports={prepare};
if(require.main===module){
 const [source,candidateId,brief,requestId,output]=process.argv.slice(2);
 if(!output)throw Error('Usage: node prepare-request.cjs CANDIDATES_JSON CANDIDATE_ID BRIEF_JSON REQUEST_ID OUTPUT_JSON');
 const repo=path.resolve(__dirname,'../../..'),dest=path.resolve(output);
 if(dest===repo||dest.startsWith(repo+path.sep))throw Error('Packets must remain outside Git');
 const packet=prepare(JSON.parse(fs.readFileSync(source)),candidateId,JSON.parse(fs.readFileSync(brief)),requestId);
 fs.writeFileSync(dest,JSON.stringify(packet,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('Prepared pending approval; no inference. Review the complete public packet before marking approved_for_drafting.');
}
