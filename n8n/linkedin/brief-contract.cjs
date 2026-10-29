// Fixed diagnostics only: never retain response text, IDs, URLs or exceptions.
function safeBriefDiagnostic(value){
 const categories=['response_incomplete','response_malformed','candidate_coverage_invalid','source_coverage_invalid','packet_invalid','response_shape_invalid','unexpected_build_failure'];
 const finishes=['stop','length','content_filter','tool_calls','function_call','missing','other'];
 const keys=['expectedCandidates','returnedCandidates','expectedSources','returnedSources','candidateDuplicates','candidateMissing','candidateUnknown','sourceDuplicates','sourceMissing','sourceUnknown'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!=='category,counts,finishReason'||!categories.includes(value.category)||!finishes.includes(value.finishReason)||!value.counts||typeof value.counts!=='object'||Array.isArray(value.counts))throw Error('Invalid brief diagnostic');
 const counts={};for(const [k,v]of Object.entries(value.counts)){if(!keys.includes(k)||!Number.isInteger(v)||v<0||v>100000)throw Error('Invalid brief diagnostic');counts[k]=v;}
 return {category:value.category,finishReason:value.finishReason,counts};
}
function inspectBrief(packet,reply){
 const raw=reply?.choices?.[0]?.finish_reason;
 const finishReason=['stop','length','content_filter','tool_calls','function_call'].includes(raw)?raw:raw==null?'missing':'other';
 const counts={},failure=category=>({diagnostic:safeBriefDiagnostic({category,finishReason,counts})});
 const validRows=(rows,key,max)=>Array.isArray(rows)&&rows.length<=max&&rows.every(r=>r&&typeof r==='object'&&typeof r[key]==='string'&&r[key].trim())&&new Set(rows.map(r=>r[key])).size===rows.length;
 if(!packet||!validRows(packet.sources,'id',24)||!validRows(packet.shortlist,'id',8)||packet.shortlist.some(t=>!Array.isArray(t.sourceIds)||t.sourceIds.some(id=>typeof id!=='string'||!packet.sources.some(s=>s.id===id))))return failure('packet_invalid');
 counts.expectedCandidates=packet.shortlist.length;counts.expectedSources=packet.sources.length;
 if(finishReason!=='stop')return failure('response_incomplete');
 let response;try{if(typeof reply.choices[0].message?.content!=='string')return failure('response_shape_invalid');response=JSON.parse(reply.choices[0].message.content);}catch{return failure('response_malformed');}
 if(!response||typeof response!=='object'||!Array.isArray(response.candidates)||!Array.isArray(response.sourceAssessments))return failure('response_shape_invalid');
 for(const [rows,expected,key,prefix,countKey]of [[response.candidates,packet.shortlist,'id','candidate','Candidates'],[response.sourceAssessments,packet.sources,'sourceId','source','Sources']]){
  counts['returned'+countKey]=Math.min(rows.length,100000);
  if(rows.length>100000||rows.some(r=>!r||typeof r!=='object'||typeof r[key]!=='string'))return failure('response_shape_invalid');
  const ids=rows.map(r=>r[key]),set=new Set(ids),wanted=new Set(expected.map(r=>r.id));
  counts[prefix+'Duplicates']=ids.length-set.size;counts[prefix+'Missing']=[...wanted].filter(id=>!set.has(id)).length;counts[prefix+'Unknown']=[...set].filter(id=>!wanted.has(id)).length;
 }
 if(counts.candidateDuplicates||counts.candidateMissing||counts.candidateUnknown||counts.returnedCandidates!==counts.expectedCandidates)return failure('candidate_coverage_invalid');
 if(counts.sourceDuplicates||counts.sourceMissing||counts.sourceUnknown||counts.returnedSources!==counts.expectedSources)return failure('source_coverage_invalid');
 return {response,finishReason,counts};
}
function constrainBriefCoverage(request,packet){
 // JSON request only; avoid structuredClone dependence in n8n expressions.
 const next=JSON.parse(JSON.stringify(request));
 for(const [input,output,key,max]of [['sources','sourceAssessments','sourceId',24],['shortlist','candidates','id',8]]){
  const rows=packet[input],array=next.response_format?.json_schema?.schema?.properties?.[output];
  if(!Array.isArray(rows)||rows.length>max||rows.some(r=>!r||typeof r.id!=='string'||!r.id.trim())||new Set(rows.map(r=>r.id)).size!==rows.length||array?.type!=='array'||!array.items?.properties?.[key])throw Error('Evidence coverage contract invalid');
  array.minItems=rows.length;array.maxItems=rows.length;
  if(rows.length)array.items.properties[key]={type:'string',enum:rows.map(r=>r.id)};
 }
 if(!Array.isArray(next.messages)||next.messages.length<1||next.messages.length>2||next.messages[0]?.role!=='system'||typeof next.messages[0].content!=='string'||next.messages.slice(1).some(m=>m?.role!=='user'||typeof m.content!=='string'))throw Error('Evidence message contract invalid');
 next.messages[0].content += '\n\n' + 'Return exactly one assessment for every supplied source ID, including unavailable sources. For unavailable evidence use role unknown, originMethod unknown, originId unknown, null basis fields and a bounded reason. Never invent passages. Return exactly one candidate for every shortlist ID; defer with empty claims when evidence is insufficient. Never duplicate or invent IDs. All downstream identity and evidence checks remain mandatory.';
 return next;
}
module.exports={safeBriefDiagnostic,inspectBrief,constrainBriefCoverage};
