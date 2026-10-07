// Only the two retained PR #19 failures and adjacent safety boundaries; no model calls.
const fs=require('fs'),assert=require('assert/strict');
const {gate}=require('../evidence/policy.cjs');
const saved=JSON.parse(fs.readFileSync(process.argv[2]));
const results=[];
for(const id of ['t3','t4']){
 const row=saved.watchlist.find(c=>c.evidenceBundleId===id);assert(row);
 const packet={sources:row.sources,shortlist:[{id,topic:row.topic,sourceIds:row.sources.map(s=>s.id)}]};
 const original={sourceAssessments:saved.sourceAssessments,candidates:[{id,decision:'accept',claims:row.claims}]};
 assert(!gate(packet,original).rows[0].accepted,'Original undeclared paraphrase must not silently qualify');
 const updated=structuredClone(original);
 for(const c of updated.candidates[0].claims){
  if(c.text.startsWith('CISA states:')){c.form='exact_quote';continue;}
  c.form='paraphrase';c.attribution={publisher:'CISA',sourceId:c.citations[0].sourceId};
  c.judgment.reason='Codex focused judgment: the bounded restatement preserves the saved CISA passage meaning; this is not an exact quote or independent verification.';
 }
 const good=gate(packet,updated).rows[0];assert(good.accepted);
 assert(good.checks.some(c=>c.exception==='attributed_authoritative_paraphrase'));
 assert.deepEqual(good.claims.map(c=>c.citations),row.claims.map(c=>c.citations),'Source excerpts must stay unchanged');
 for(const [name,mutate]of [
  ['missing_attribution',c=>delete c.attribution],
  ['wrong_publisher',c=>c.attribution.publisher='NIST'],
  ['invented_quantity',c=>c.text+=' This requires 9000 days.'],
  ['unresolved_scope',c=>c.judgment.scope='unresolved'],
  ['fabricated_excerpt',c=>c.citations[0].quote+=' invented words'],
  ['invented_experience',c=>c.text+=' We proved this in our client deployment.'],
 ]){const bad=structuredClone(updated);mutate(bad.candidates[0].claims[0]);assert(!gate(packet,bad).rows[0].accepted,name);}
 results.push({id,supportedDeclaredParaphraseAccepted:true,unchangedExactExcerpts:true,undeclaredParaphraseDeferred:true,unsafeVariantsBlocked:6});
}
console.log(JSON.stringify({passed:true,modelCalls:0,sourceRetrievalCalls:0,judgments:'Codex focused review, not independent human measurement',cases:results}));
