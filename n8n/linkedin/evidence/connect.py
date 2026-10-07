"""Patch exported live definitions, retaining credentials privately and all schedules."""
import copy,json,sys,base64
from pathlib import Path
D=Path(__file__).parent
policy=(D/'policy.cjs').read_text().split('module.exports=')[0]
def update(workflows):
 result=copy.deepcopy(workflows)
 for w in result:
  nodes={n['name']:n for n in w['nodes']}
  if w['id']=='IASLinkedinEnr01':
   anchor=nodes['Merge and Reclassify Recovery Evidence'];root=nodes['Write Content Brief Files']['parameters']['fileName'].split('/{{')[0].lstrip('=')
   extra=[{'name':'Prepare Evidence Shortlist','type':'n8n-nodes-base.code','typeVersion':2,'parameters':{'jsCode':(D/'shortlist.cjs').read_text()}},
    {'name':'Retrieve Source Pages','type':'n8n-nodes-base.executeCommand','typeVersion':1,'parameters':{'command':'={{ "IAS_PRIVACY_ROOT='+root+' node '+root+'/evidence/retrieve.cjs " + JSON.stringify($json).base64Encode() }}'}},
    {'name':'Restore Retrieved Evidence','type':'n8n-nodes-base.code','typeVersion':2,'parameters':{'jsCode':'return [{json:JSON.parse($json.stdout)}];'}}]
   for i,n in enumerate(extra):n.update(id='ias-evidence-'+str(i),position=[anchor['position'][0]+220*(i+1),anchor['position'][1]+200]);w['nodes'].append(n)
   chain=[anchor['name']]+[n['name'] for n in extra]+['Final Rank Evidence-Bound Opportunities via gpt-oss']
   for a,b in zip(chain,chain[1:]):w['connections'][a]={'main':[[{'node':b,'type':'main','index':0}]]}
   body={'model':'home-chat','temperature':0,'max_tokens':14000,'stream':False,'response_format':{'type':'json_object'},'messages':[{'role':'system','content':'__SYSTEM__'},{'role':'user','content':'__PACKET__'}]}
   nodes[chain[-1]]['parameters']['jsonBody']='={{ JSON.stringify('+json.dumps(body,indent=2).replace('"__PACKET__"','JSON.stringify($json)').replace('"__SYSTEM__"',json.dumps(base64.b64encode((D/'final-prompt.txt').read_bytes()).decode())+'.base64Decode()')+') }}'
   nodes[chain[-1]]['parameters'].setdefault('options',{})['timeout']=300000
   nodes['Build Content Brief Files']['parameters']['jsCode']=policy+'\n'+(D/'build-brief.cjs').read_text()
  elif w['id']=='IASLinkedinPlan1':
   p=nodes['Parse Latest Candidate File']['parameters']['jsCode'];a=p.index('].filter((candidate) =>');b=p.index('\n\nconst watchlistCandidates',a)
   p=p[:a]+'''].filter(candidate => candidate && source.evidencePolicyVersion === '1.0' && candidate.verificationStatus === 'evidence_bound' && candidate.validation?.pageEvidencePassed === true && candidate.claims?.length > 0);'''+p[b:];nodes['Parse Latest Candidate File']['parameters']['jsCode']=p
   p=nodes['Validate Editorial Plan']['parameters']['jsCode'];p=p.replace('if (sourceUrls.length < 2)',"if (sourceUrls.length < 1 || candidate.validation?.pageEvidencePassed !== true)")
   # Embed pure helper under a namespace to avoid collisions with existing clean/list.
   p='const evidencePolicy=(()=>{'+policy+';return {reviewProse};})();\n'+p
   p=p.replace('verifiedEvidence: {',"approvedClaims: candidate.claims,\n    evidenceLinks: candidate.sources.map(s=>({url:s.url,requestedUrl:s.requestedUrl,cacheFile:s.cacheFile,retrievedAt:s.retrievedAt})),\n    evidenceJudgments: candidate.evidenceAssessment,\n    fullProseReview: evidencePolicy.reviewProse(JSON.stringify(proposed),candidate.claims),\n    humanReviewRequired: true,\n    verifiedEvidence: {")
   nodes['Validate Editorial Plan']['parameters']['jsCode']=p
   p=nodes['Prepare Editorial Plan Files']['parameters']['jsCode'];p=p.replace("'Verified sources', '',","'Evidence-bound sources (semantic judgments require human review)', '',");p=p.replace("...item.sourceUrls.map((value) => `- ${value}`), ''","...item.sourceUrls.map((value) => `- ${value}`), '',\n      'Approved factual claims and evidence passages', '',\n      ...(item.approvedClaims||[]).flatMap(c=>['- '+c.text,...(c.citations||[]).map(r=>'  - '+r.sourceId+'/'+r.passageId+': '+r.quote)]), '',\n      'Human review required: complete prose, source-origin judgments, current applicability and webinar overlap. See fullProseReview in the JSON plan.', ''")
   nodes['Prepare Editorial Plan Files']['parameters']['jsCode']=p
 return result
if __name__=='__main__':
 src,dest=map(Path,sys.argv[1:]);dest.write_text(json.dumps(update(json.loads(src.read_text())),indent=2)+'\n');dest.chmod(0o600)
