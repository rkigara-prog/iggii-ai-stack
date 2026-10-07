const packet=$('Restore Retrieved Evidence').first().json;
let response;try{response=JSON.parse($json.choices?.[0]?.message?.content);}catch{response={};}
const assessment=gate(packet,response);
const themeAligned=[],watchlist=[];
for(const row of assessment.rows){
 const boundIds=new Set(row.claims.flatMap(c=>list(c.citations).map(x=>x.sourceId)));
 const original=packet.shortlist.find(t=>t.id===row.id);
 const sources=packet.sources.filter(s=>(boundIds.size?boundIds.has(s.id):original.sourceIds.includes(s.id)));
 const accepted=row.accepted;
 const text=accepted?row.claims[0].text:row.topic;
 const candidate={topic:text,proposedHeadline:'Review: '+text,rank:1,whyNow:'Review the dated source passages and current applicability before drafting.',targetAudience:['Technology leaders','Security leaders'],contentAngle:'Assess applicability and a bounded leadership decision.',openingHook:'',recommendedFormat:'LinkedIn post',relatedMeetingThemes:[],scores:{total:row.score,sourceQuality:accepted?10:0},confidence:null,verificationStatus:accepted?'evidence_bound':'deferred',evidenceBundleId:row.id,
 sources:sources.map(s=>({...s,url:s.canonicalUrl,publishedAt:s.publicationDate,sourceTier:response.sourceAssessments?.find(a=>a.sourceId===s.id)?.role||'unknown'})),
 claims:row.claims,evidenceAssessment:row,
 editorialRisks:accepted?['Semantic support and origin assignments are home-chat judgments. Human editorial and webinar review required.']:row.reasons,
 validation:{evidencePolicyVersion:'1.0',pageEvidencePassed:accepted,semanticJudgmentsRecorded:true,independentVerification:false,reviewRequired:true}};
 (accepted?themeAligned:watchlist).push(candidate);
}
themeAligned.sort((a,b)=>b.scores.total-a.scores.total);themeAligned.forEach((c,i)=>c.rank=i+1);watchlist.forEach((c,i)=>c.rank=i+1);
const generatedAt=new Date().toISOString();const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const result={workflowVersion:'5.0',status:themeAligned.length?'ready':'watchlist_only',generatedAt,sourceThemeFile:packet.sourceThemeFile,sourceThemeDate:packet.sourceThemeDate,consolidatedThemes:packet.consolidatedThemes,articleCount:packet.sources.length,themeAligned,emerging:[],watchlist,
 evidencePolicyVersion:'1.0',sourceAssessments:response.sourceAssessments||[],diagnostics:{retrieved:packet.sources.filter(s=>s.retrievalStatus==='retrieved').length,unavailable:packet.sources.filter(s=>s.retrievalStatus!=='retrieved').length,accepted:themeAligned.length,deferred:watchlist.length,lexicalEvidenceRepairs:0,deterministicFallbacks:0},automaticPublishingAllowed:false};
const lines=['# Weekly content evidence brief','',`Generated ${generatedAt}. Status: ${result.status}.`,'','Accepted means the passage/origin policy passed using recorded home-chat judgments; it is not independent factual verification. Human editorial and webinar review remain required.',''];
for(const [label,rows] of [['Evidence-bound opportunities',themeAligned],['Deferred for evidence or human review',watchlist]]){lines.push('## '+label,'');for(const c of rows){lines.push('### '+c.topic,'',...c.editorialRisks.map(r=>'- '+r),'');for(const claim of c.claims){lines.push('Claim: '+claim.text,'',`Semantic judgment: ${claim.judgment?.reason||'Unresolved'}`,'');for(const ref of list(claim.citations)){const s=c.sources.find(s=>s.id===ref.sourceId);lines.push(`- ${s?.canonicalUrl||'Unknown source'} | ${ref.passageId} | ${ref.quote}`);}}for(const s of c.sources)lines.push(`- Source ${s.id}: ${s.requestedUrl}; retrieved ${s.retrievedAt}; published ${s.publicationDate||'unknown'}; ${s.retrievalStatus}; cache ${s.cacheFile||'unavailable'}`);lines.push('');}}
const binaryItem=(fileName,contents,mimeType)=>({json:{fileName},binary:{data:{data:Buffer.from(contents).toString('base64'),mimeType,fileName}}});
return [binaryItem(`content-brief-model-eval-${date}.md`,lines.join('\n')+'\n','text/markdown'),binaryItem(`content-candidates-model-eval-${date}.json`,JSON.stringify(result,null,2)+'\n','application/json')];
