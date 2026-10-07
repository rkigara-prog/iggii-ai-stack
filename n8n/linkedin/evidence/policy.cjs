// Pure, shared gate. Semantic assessments remain fallible model judgments.
const list=x=>Array.isArray(x)?x:[];
const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
function host(u){return String(u||'').match(/^https?:\/\/([^/?#:]+)/i)?.[1]?.toLowerCase().replace(/^www\./,'')||'';}
function exactCitation(c,sources){const s=sources.find(x=>x.id===c?.sourceId);const p=s?.passages?.find(x=>x.id===c.passageId);return !!(s?.retrievalStatus==='retrieved'&&p&&clean(c.quote).length>=12&&clean(p.text).includes(clean(c.quote)));}
const dimensions=['scope','attribution','dates','quantities','products','sectors','uncertainty'];
const official={ 'nist.gov':'NIST', 'pages.nist.gov':'NIST', 'csrc.nist.gov':'NIST', 'cisa.gov':'CISA', 'aws.amazon.com':'AWS', 'learn.microsoft.com':'Microsoft', 'microsoft.com':'Microsoft', 'docs.aws.amazon.com':'AWS' };
function authority(source){const h=host(source.canonicalUrl);if(/\/(?:community|forums?|users?|answers|blogs\/community)\b/i.test(source.canonicalUrl)||h==='techcommunity.microsoft.com')return null;return official[h]||null;}
function criticalTokens(text){return [...new Set((String(text).match(/\bCVE-\d{4}-\d{4,7}\b|\b\d[\d,.]*(?:%|\b)/gi)||[]).map(x=>x.toLowerCase()))];}
function sourceGate(a,sources){
 const s=sources.find(x=>x.id===a?.sourceId);const issues=[];
 const primaryHosts=new Set([...Object.keys(official),'cyber.gc.ca','unit42.paloaltonetworks.com','research-hub.nlr.gov','nlr.gov']);
 if(a?.role==='primary'&&(!primaryHosts.has(host(s?.canonicalUrl))||/community|forum|sponsored/i.test(s?.canonicalUrl||'')))issues.push('primary_authority_unestablished');
 if(a?.originMethod==='first_party_record'&&a?.role!=='primary')issues.push('first_party_authority_unestablished');
 if(!s||s.retrievalStatus!=='retrieved')issues.push('source_text_unavailable');
 if(!['primary','independent_reporting'].includes(a?.role))issues.push('source_eligibility_unresolved');
 if(!['first_party_record','direct_observation','original_analysis','interview'].includes(a?.originMethod)||!clean(a?.originId)||/^(unknown|unresolved|uncertain|not established)$/i.test(clean(a?.originId))||!clean(a?.reason))issues.push('source_independence_unresolved');
 if(!exactCitation({...a?.basis,sourceId:a?.sourceId},sources))issues.push('origin_basis_not_on_page');
 if(/syndicat|press release|sponsored|advertisement/i.test(a?.basis?.quote||''))issues.push('dependent_or_promotional_origin');
 // A self-reported publisher/domain never establishes authority or independence.
 return {eligible:!issues.length,issues,judgment:a,source:s};
}
function claimGate(claim,sources,assessments){
 const reasons=[];const citations=list(claim?.citations);const valid=citations.filter(c=>exactCitation(c,sources));
 if(!clean(claim?.text)||valid.length!==citations.length||!valid.length)reasons.push('missing_or_invalid_passage_binding');
 if(!claim?.judgment||claim.judgment.support!=='supported'||!clean(claim.judgment.reason))reasons.push('semantic_support_unresolved');
 for(const d of dimensions)if(claim?.judgment?.[d]!=='preserved')reasons.push(d+'_unresolved');
 const passageText=valid.map(c=>c.quote).join(' ').toLowerCase();
 for(const token of criticalTokens(claim?.text))if(!criticalTokens(passageText).includes(token))reasons.push('unbound_numeric_or_product_identifier');
 const claimText=clean(claim?.text);
 if(/\b(our|we|my)\b/i.test(claimText))reasons.push('writer_attribution_unestablished');
 if(/\b(all|every|guarantee[sd]?|eliminates?)\b/i.test(claimText)&&!/\b(all|every|guarantee[sd]?|eliminates?)\b/i.test(passageText))reasons.push('absolute_scope_not_in_passage');
 if(/\b(confirmed compromises?|confirmed breaches|were breached|are compromised)\b/i.test(claimText)&&/\b(not|potentially|may be|exposed)\b/i.test(passageText)&&!claimText.match(/\b(not|potentially|may be|exposed)\b/i))reasons.push('exposure_compromise_scope_conflict');
 if(/\b(newly|this week|launched today)\b/i.test(claimText)&&valid.some(c=>{const s=sources.find(s=>s.id===c.sourceId);return !s?.publicationDate||Date.now()-Date.parse(s.publicationDate)>14*86400000;}))reasons.push('current_event_date_unresolved');
 const selected=[...new Set(valid.map(c=>c.sourceId))].map(id=>sourceGate(assessments.find(a=>a.sourceId===id),sources));
 for(const v of selected)reasons.push(...v.issues);
 const eligible=selected.filter(v=>v.eligible), origins=new Set(eligible.map(v=>clean(v.judgment.originId).toLowerCase()));
 // Different domains alone do not establish independence. Same host never counts twice.
 const hosts=new Set(eligible.map(v=>host(v.source.canonicalUrl)));
 let exception=null;
 if(claim?.exception==='attributed_authoritative_statement'&&eligible.length===1){
  const s=eligible[0].source,publisher=authority(s);
  // Only the exact attributed document statement is exempt, not outcomes or efficacy.
  const q=valid[0]?.quote;
  if(publisher&&eligible[0].judgment.role==='primary'&&clean(claim.text)===`${publisher} states: ${clean(q)}`&&
    ['document_statement','release_status'].includes(claim.factType)&&!/guarantee|eliminat|proves?|effective|compliant|safer|secure than/i.test(q))exception='attributed_authoritative_statement';
 }
 if(!exception&&(origins.size<2||hosts.size<2))reasons.push('independent_corroboration_unresolved');
 if(!eligible.some(v=>v.judgment.role==='primary'))reasons.push('relevant_primary_source_missing');
 return {passed:!reasons.length,reasons:[...new Set(reasons)],exception,independentOrigins:origins.size,
  deterministicChecks:{passageBindings:valid.length===citations.length&&valid.length>0,numericIdentifierCheck:!reasons.includes('unbound_numeric_or_product_identifier')},
  semanticJudgment:claim?.judgment||null,sourceJudgments:eligible.map(v=>v.judgment),independentVerification:false};
}
function gate(packet,response){
 const sources=list(packet.sources),assessments=list(response?.sourceAssessments),seen=new Set();
 const rows=[];
 for(const topic of list(packet.shortlist)){
  const proposed=list(response?.candidates).find(c=>c.id===topic.id);const claims=list(proposed?.claims);
  const checks=claims.map(c=>claimGate(c,sources.filter(s=>topic.sourceIds.includes(s.id)),assessments));const reasons=checks.flatMap(c=>c.reasons);
  if(!claims.length)reasons.push('no_bound_material_claims');
  if(claims.length>3)reasons.push('claim_limit_exceeded');
  if(proposed?.decision!=='accept')reasons.push('model_deferred');
  if(claims.some(c=>seen.has(clean(c.text).toLowerCase())))reasons.push('duplicate_claim');
  const accepted=!reasons.length;if(accepted)claims.forEach(c=>seen.add(clean(c.text).toLowerCase()));
  rows.push({id:topic.id,topic:topic.topic,accepted,claims,checks,reasons:[...new Set(reasons)],score:Math.max(0,Math.min(100,Number(proposed?.editorialScore)||0)),reviewRequired:true});
 }
 return {version:'1.0',semanticAssessor:'home-chat',independentVerification:false,rows};
}
// Conservative full-prose coverage: inspect every sentence, not the writer's claim list.
// This deliberately routes paraphrases/unmapped advice to humans instead of certifying them.
function reviewProse(text,approvedClaims){
 const allowed=list(approvedClaims).map(c=>clean(c.text??c));
 const sentences=String(text).split(/(?<=[.!?])\s+|\n+/).map(clean).filter(Boolean);
 const assertions=sentences.map((s,i)=>({id:'assertion-'+(i+1),text:s,status:allowed.includes(s)?'exact_approved_claim':'human_review_required',reason:allowed.includes(s)?'Exact previously bound claim; inherits its judgment limitations':'Unmapped prose: resolve factual assertions, attribution and recommendations with evidence; not proof of falsity'}));
 return {method:'deterministic_full_prose_coverage',independentSemanticVerification:false,reviewRequired:assertions.some(a=>a.status==='human_review_required'),assertions,automaticPublishingAllowed:false};
}
module.exports={exactCitation,sourceGate,claimGate,gate,reviewProse,authority,dimensions};
