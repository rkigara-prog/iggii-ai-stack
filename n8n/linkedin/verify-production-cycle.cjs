// Verify one manual production-profile cycle; private logs/artifacts never leave the host.
// Usage: node verify-production-cycle.cjs OUTPUT_ROOT PRIVATE_LOG_DIR STAGE
const fs=require('fs'), path=require('path'), crypto=require('crypto'), assert=require('assert/strict');
const root=process.argv[2], logDir=process.argv[3], stage=process.argv[4];
const {execution,outputs}=require('./audit-acceptance.cjs');
const {extraction,validateReview,sourceSegments,policyVersion}=require('./privacy-policy.cjs');
assert(root && logDir && ['sanitization','enrichment','editorial-planner'].includes(stage));
const recordFile=path.join(logDir,'cycle-provenance.private.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function save(value){fs.writeFileSync(recordFile,JSON.stringify(value,null,2),{mode:0o600});}
function approval(){
 const marker=JSON.parse(fs.readFileSync(path.join(root,'privacy-status.json')));
 assert.equal(marker.state,'approved');assert.equal(marker.policyVersion,policyVersion);
 const age=Date.now()-Date.parse(marker.approvedAt);assert(Number.isFinite(age)&&age>=0&&age<24*3600*1000);
 assert(/^theme-list-model-eval-qwen35-\d{4}-\d{2}-\d{2}\.txt$/.test(marker.fileName));
 assert.equal(hash(fs.readFileSync(path.join(root,marker.fileName))),marker.sha256);
 return marker;
}
function sameApproval(record){const m=approval();assert.equal(m.runId,record.privacy.runId);assert.equal(m.sha256,record.privacy.sha256);return m;}
function produced(result,node){return outputs(result,node).map(item=>{
 const name=item.json.fileName;assert(/^[a-z0-9.-]+$/i.test(name));
 const bytes=fs.readFileSync(path.join(root,name));
 assert.equal(hash(bytes),hash(Buffer.from(item.binary.data.data,'base64')),'File differs from execution output');
 fs.chmodSync(path.join(root,name),0o600);
 return {fileName:name,sha256:hash(bytes),bytes};
});}
function metadata(items){return items.map(({fileName,sha256})=>({fileName,sha256}));}
function verify(){
const r=execution(stage);assert(!r.error,'Workflow execution failed');
if(stage==='sanitization'){
 assert(['Approve Privacy Artifact','Run Enrichment After Privacy Approval'].includes(r.lastNodeExecuted));
 const decoded=outputs(r,'Decode Each Transcript').map(x=>x.json);
 const extracts=outputs(r,'Sanitize via qwen3.5 (Per Meeting)').map(x=>extraction(x.json));
 const inputs=outputs(r,'Aggregate Anonymous Candidate Themes').map(x=>x.json);
 const reviews=outputs(r,'Privacy Adjudication and Deduplication via gpt-oss');
 assert.equal(decoded.length,extracts.length);assert.equal(inputs.length,reviews.length);
 let reviewed=0,rejected=0;const safe=new Set(),seen=new Set();
 for(let i=0;i<inputs.length;i++){
  const input=inputs[i];assert(Number.isInteger(input.sampleIndex)&&input.sampleIndex>=0&&input.sampleIndex<decoded.length);
  assert(!seen.has(input.sampleIndex));seen.add(input.sampleIndex);
  assert.deepEqual(input.candidates,extracts[input.sampleIndex]);
  assert.deepEqual(input.sourceSegments,sourceSegments(decoded[input.sampleIndex].text));
  const result=validateReview(reviews[i].json,input);reviewed+=result.reviewed;rejected+=result.rejected.length;
  result.retained.forEach(t=>safe.add(t));
 }
 assert.equal(inputs.length,extracts.filter(x=>x.length).length);
 const final=outputs(r,'Build Final Public-Safe Theme List')[0].json;
 assert.equal(final.privacyValidation.passed,true);assert.equal(final.privacyValidation.reviewed,reviewed);assert.equal(final.privacyValidation.rejected,rejected);
 const themes=final.combinedThemes.trim().split('\n').map(x=>{assert(x.startsWith('- '));return x.slice(2);});
 assert(themes.length>0&&themes.length<=20);assert.equal(themes.length,final.themeCount);assert(themes.every(t=>safe.has(t)));
 const files=produced(r,'Prepare Theme File');assert.equal(files.length,1);
 assert.equal(files[0].bytes.toString('utf8'),final.combinedThemes);
 const marker=approval();assert.equal(marker.sha256,files[0].sha256);assert.equal(marker.fileName,files[0].fileName);assert.equal(marker.themeCount,themes.length);
 const before=JSON.parse(fs.readFileSync(path.join(logDir,'output-before.private.json')));
 assert(!before.some(x=>x.name===marker.fileName),'Expected new current-cycle theme artifact');
 save({privacy:marker,themeArtifact:metadata(files)[0],meetings:decoded.length,reviewed,rejected,finalThemes:themes.length});
 console.log(JSON.stringify({sanitizationPassed:true,meetings:decoded.length,reviewed,rejected,finalThemes:themes.length,currentArtifactProvenancePassed:true}));
}else{
 const record=JSON.parse(fs.readFileSync(recordFile));const marker=sameApproval(record);
 if(stage==='enrichment'){
  const input=outputs(r,'Parse Latest Theme File')[0].json;
  assert.equal(input.privacyProof.runId,marker.runId);assert.equal(input.privacyProof.sha256,marker.sha256);assert.equal(input.sourceThemeFile,record.themeArtifact.fileName);
  const queries=outputs(r,'Parse Consolidated Themes');assert(queries.length>0);
  assert(outputs(r,'Reject Unsafe Research Queries').length===queries.length);
  let queryCount=0;
  for(const name of ['Search Theme-Matched News','Search Emerging and Authoritative News','Search Evidence Recovery and Industry News','Search Authoritative Foundations']){
   const checks=outputs(r,'Check Privacy Before '+name);assert(checks.length>0);
   for(const check of checks){const proof=JSON.parse(check.json.stdout);assert.equal(proof.runId,marker.runId);assert.equal(proof.sha256,marker.sha256);}
   assert(outputs(r,name).length>0);queryCount+=outputs(r,'Restore Queries Before '+name).length;
  }
  const files=produced(r,'Build Content Brief Files');assert.equal(files.length,2);
  const file=files.find(x=>x.fileName.endsWith('.json')),data=JSON.parse(file.bytes);
  assert.equal(data.sourceThemeFile,record.themeArtifact.fileName);assert.equal(data.status,'ready');
  const verified=[...data.themeAligned,...data.emerging],bundles=new Map(outputs(r,'Merge and Reclassify Recovery Evidence')[0].json.qualifiedEvidenceBundles.map(b=>[b.bundleId,b]));
  assert(verified.length>0);
  const normalize=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&#x27;|&#39;|&apos;/gi,"'").replace(/&quot;/gi,'"').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&nbsp;/gi,' ').toLowerCase().replace(/\s+/g,' ').trim();
  for(const c of verified){
   assert.equal(c.verificationStatus,'verified');
   for(const k of ['strongEvidence','bundleValid','semanticEvidenceAligned'])assert.equal(c.validation[k],true);
   assert.notEqual(c.validation.unresolvedBlockingRisk,true);assert(c.validation.independentSourceFamilyCount>=2);assert(c.sources.length>=2);
   const bundle=bundles.get(c.evidenceBundleId);assert(bundle?.qualified);
   for(const s of c.sources){const supplied=bundle.records.find(x=>x.url===s.url);assert(supplied);
    const evidence=normalize(s.supportingEvidence),words=evidence.split(' ').length;assert(words>=5&&words<=18);assert(normalize(supplied.title+' '+supplied.description).includes(evidence));
   }
   assert.equal(c.scores.total,Object.entries(c.scores).filter(([k])=>k!=='total').reduce((n,[,v])=>n+v,0));assert(c.scores.total<=94);
  }
  record.researchArtifacts=metadata(files);record.candidateArtifact={fileName:file.fileName,sha256:file.sha256};
  record.braveQueries=queryCount;record.qualifiedBundles=bundles.size;record.verifiedCandidates=verified.length;record.watchlistCandidates=data.watchlist.length;save(record);
  console.log(JSON.stringify({enrichmentPassed:true,braveQueries:queryCount,qualifiedBundles:bundles.size,verifiedCandidates:verified.length,watchlistCandidates:data.watchlist.length,currentArtifactExactUrlsEvidenceAndScoresPassed:true}));
 }else{
  const bytes=fs.readFileSync(path.join(root,record.candidateArtifact.fileName));assert.equal(hash(bytes),record.candidateArtifact.sha256);
  const candidates=JSON.parse(bytes),input=outputs(r,'Parse Latest Candidate File')[0].json;
  assert.equal(input.sourceCandidateFile,record.candidateArtifact.fileName);assert.equal(input.sourceThemeFile,record.themeArtifact.fileName);
  assert.deepEqual(input.verifiedCandidates,[...candidates.themeAligned,...candidates.emerging]);
  const plan=outputs(r,'Validate Editorial Plan')[0].json;
  assert.equal(plan.sourceCandidateFile,record.candidateArtifact.fileName);assert.equal(plan.sourceThemeFile,record.themeArtifact.fileName);
  assert(plan.selectedTopicCount>0&&plan.selectedTopicCount<=5);assert.equal(plan.selectedTopicCount,plan.selectedTopics.length);assert.equal(plan.policySummary.automaticPublishingAllowed,false);
  const verified=new Map([...candidates.themeAligned,...candidates.emerging].map(c=>[c.topic,c])),watchlist=new Set(candidates.watchlist.map(c=>c.topic));
  for(const selection of plan.selectedTopics){assert(!watchlist.has(selection.sourceCandidateTopic));const candidate=verified.get(selection.sourceCandidateTopic);assert(candidate);assert.deepEqual(new Set(selection.sourceUrls),new Set(candidate.sources.map(s=>s.url)));assert.equal(selection.webinarReview,'manual_review_required');}
  const files=produced(r,'Prepare Editorial Plan Files');assert.equal(files.length,2);assert.deepEqual(JSON.parse(files.find(x=>x.fileName.endsWith('.json')).bytes),plan);
  record.editorialArtifacts=metadata(files);record.selectedTopics=plan.selectedTopicCount;record.plannerStatus=plan.status;record.complete=true;save(record);
  console.log(JSON.stringify({editorialPassed:true,selectedTopics:plan.selectedTopicCount,plannerStatus:plan.status,currentCandidateProvenanceAndExactUrlsPassed:true,watchlistExcluded:true,manualWebinarReviewRequired:true,automaticPublishingAllowed:false}));
 }
}

}
try { verify(); } catch {
 console.error('Production-cycle verification failed; inspect private evidence locally.');
 process.exitCode=1;
}
