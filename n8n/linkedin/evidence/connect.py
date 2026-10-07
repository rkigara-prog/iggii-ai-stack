"""Patch exported live definitions, retaining credentials privately and all schedules."""
import copy,json,sys
from pathlib import Path
D=Path(__file__).parent
policy=(D/'policy.cjs').read_text().split('module.exports=')[0]
def update(workflows):
 result=copy.deepcopy(workflows)
 for w in result:
  nodes={n['name']:n for n in w['nodes']}
  if w['id']=='IASLinkedinEnr01':
   # Match the existing research privacy contract before proposing queries; never bypass it.
   consolidation=next(n for n in w['nodes'] if n['name'].startswith('Consolidate'))
   prompt=consolidation['parameters']['jsonBody']
   old='Each search query must be generic, contain four to twelve useful words, and contain no company, customer, vendor, product, or person names.'
   new=old+' Every concept in the theme, query and rationale must be supported by the supplied themes. Do not add named frameworks, locations, dates, operational facts or inferred business context. Keep the rationale a brief explanation of grouping the supplied concepts; do not broaden it into new claims.'
   if new not in prompt: consolidation['parameters']['jsonBody']=prompt.replace(old,new)
   reject=nodes['Reject Unsafe Research Queries']['parameters']['jsCode']
   reject=reject.replace("throw Error('Research privacy review rejected query');", "throw Error('Research privacy review rejected query: '+JSON.stringify(parseReply($input.first().json).decisions.filter(r=>r.verdict!=='retain').map(r=>({index:r.candidateIndex,verdict:r.verdict,flags:Object.keys(r.riskFlags).filter(k=>r.riskFlags[k])}))));")
   nodes['Reject Unsafe Research Queries']['parameters']['jsCode']=reject
   anchor=nodes['Merge and Reclassify Recovery Evidence'];root=nodes['Write Content Brief Files']['parameters']['fileName'].split('/{{')[0].lstrip('=')
   extra=[{'name':'Prepare Evidence Shortlist','type':'n8n-nodes-base.code','typeVersion':2,'parameters':{'jsCode':'const curatedFollowups='+json.dumps(json.loads((D/'followups.json').read_text()))+';\n'+(D/'shortlist.cjs').read_text()}},
    {'name':'Retrieve Source Pages','type':'n8n-nodes-base.executeCommand','typeVersion':1,'parameters':{'command':'={{ "IAS_PRIVACY_ROOT='+root+' node '+root+'/evidence/retrieve.cjs " + JSON.stringify($json).base64Encode() }}'}},
    {'name':'Restore Retrieved Evidence','type':'n8n-nodes-base.code','typeVersion':2,'parameters':{'jsCode':'return [{json:JSON.parse($json.stdout)}];'}}]
   for i,n in enumerate(extra):
    n.update(id='ias-evidence-'+str(i),position=[anchor['position'][0]+220*(i+1),anchor['position'][1]+200])
    old=next((x for x in w['nodes'] if x['name']==n['name']),None)
    if old: old['parameters']=n['parameters']
    else: w['nodes'].append(n)
   chain=[anchor['name']]+[n['name'] for n in extra]+['Final Rank Evidence-Bound Opportunities via gpt-oss']
   for a,b in zip(chain,chain[1:]):w['connections'][a]={'main':[[{'node':b,'type':'main','index':0}]]}
   body={'model':'home-chat','temperature':0,'max_tokens':14000,'stream':False,'response_format':{'type':'json_object'},'messages':[{'role':'system','content':(D/'final-prompt.txt').read_text()}]}
   restore=next(n for n in w['nodes'] if n['name']=='Restore Retrieved Evidence')
   restore['parameters']['jsCode']='const packet=JSON.parse($json.stdout);\nconst requestBody='+json.dumps(body,indent=2)+';\nrequestBody.messages.push({role:"user",content:JSON.stringify(packet)});\nreturn [{json:{...packet,requestBody}}];'
   # Prompt data never enters the expression source; only an object reference is evaluated.
   nodes[chain[-1]]['parameters']['jsonBody']='={{ $json.requestBody }}'
   nodes[chain[-1]]['parameters'].setdefault('options',{})['timeout']=300000
   nodes['Build Content Brief Files']['parameters']['jsCode']=policy+'\n'+(D/'build-brief.cjs').read_text()
  elif w['id']=='IASLinkedinPlan1':
   p=nodes['Parse Latest Candidate File']['parameters']['jsCode'];a=p.index('].filter(');b=p.index('\n\nconst watchlistCandidates',a)
   p=p[:a]+'''].filter(candidate => candidate && source.evidencePolicyVersion === '1.0' && candidate.verificationStatus === 'evidence_bound' && candidate.validation?.pageEvidencePassed === true && candidate.claims?.length > 0);'''+p[b:];nodes['Parse Latest Candidate File']['parameters']['jsCode']=p
   p=nodes['Validate Editorial Plan']['parameters']['jsCode'];
   if p.startswith('const evidencePolicy=(()=>{'):p=p.split(';return {reviewProse};})();\n',1)[1]
   p=p.replace('if (sourceUrls.length < 2)',"if (sourceUrls.length < 1 || candidate.validation?.pageEvidencePassed !== true)")
   # Embed pure helper under a namespace to avoid collisions with existing clean/list.
   p='const evidencePolicy=(()=>{'+policy+';return {reviewProse};})();\n'+p
   if 'approvedClaims: candidate.claims' not in p:p=p.replace('verifiedEvidence: {',"approvedClaims: candidate.claims,\n    evidenceLinks: candidate.sources.map(s=>({url:s.url,requestedUrl:s.requestedUrl,cacheFile:s.cacheFile,retrievedAt:s.retrievedAt})),\n    evidenceJudgments: candidate.evidenceAssessment,\n    fullProseReview: evidencePolicy.reviewProse(JSON.stringify(proposed),candidate.claims),\n    humanReviewRequired: true,\n    verifiedEvidence: {")
   nodes['Validate Editorial Plan']['parameters']['jsCode']=p
   p=nodes['Prepare Editorial Plan Files']['parameters']['jsCode'];p=p.replace("'Verified sources', '',","'Evidence-bound sources (semantic judgments require human review)', '',");p=p.replace("...item.sourceUrls.map((value) => `- ${value}`), ''","...item.sourceUrls.map((value) => `- ${value}`), '',\n      'Approved factual claims and evidence passages', '',\n      ...(item.approvedClaims||[]).flatMap(c=>['- '+c.text,...(c.citations||[]).map(r=>'  - '+r.sourceId+'/'+r.passageId+': '+r.quote)]), '',\n      'Human review required: complete prose, source-origin judgments, current applicability and webinar overlap. See fullProseReview in the JSON plan.', ''")
   if 'Approved factual claims and evidence passages' not in nodes['Prepare Editorial Plan Files']['parameters']['jsCode']:nodes['Prepare Editorial Plan Files']['parameters']['jsCode']=p
 return result
if __name__=='__main__':
 src,dest=map(Path,sys.argv[1:]);dest.write_text(json.dumps(update(json.loads(src.read_text())),indent=2)+'\n');dest.chmod(0o600)
