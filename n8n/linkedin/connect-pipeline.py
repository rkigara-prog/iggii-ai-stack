"""Connect sanitized inactive stages through waiting native subworkflow calls."""
import json
from pathlib import Path
BASE=Path(__file__).parent
ROOT='/data/output/ias-linkedin-acceptance'

def node(name,kind,parameters,version=1):
 return {'id':'ias-'+name.lower().replace(' ','-'),'name':name,'type':'n8n-nodes-base.'+kind,'typeVersion':version,'position':[2400,600],'parameters':parameters}
def edge(w,start,end):w['connections'][start]={'main':[[{'node':end,'type':'main','index':0}]]}
def command(action,expression='$json'):
 return '={{ "IAS_PRIVACY_ROOT='+ROOT+' node '+ROOT+'/pipeline-artifact.cjs '+action+' " + JSON.stringify('+expression+').base64Encode() }}'
def call(name,target):
 return node(name,'executeWorkflow',{'source':'database','workflowId':{'__rl':True,'value':target,'mode':'id'},'mode':'once','options':{'waitForSubWorkflow':True}},1.3)
def add(w,n):
 w['nodes']=[x for x in w['nodes'] if x['name']!=n['name']]+[n]
def trigger():return node('Pipeline Stage Input','executeWorkflowTrigger',{'inputSource':'passthrough'},1.1)
def save(stage,w):
 assert not w['active']
 assert all(n.get('disabled') and n['name'] not in w['connections'] for n in w['nodes'] if n['type'].endswith('scheduleTrigger'))
 (BASE/(stage+'.json')).write_text(json.dumps(w,indent=2)+'\n')

w=json.loads((BASE/'sanitization.json').read_text())
add(w,node('Prepare Enrichment Invocation','code',{'jsCode':'''const items=$input.all();
if(items.length!==1)throw Error('Privacy handoff count invalid');
const privacy=JSON.parse(items[0].json.stdout);
if(!privacy.runId||!privacy.sha256||!privacy.fileName)throw Error('Privacy handoff invalid');
return [{json:{privacy}}];'''},2))
add(w,call('Run Enrichment After Privacy Approval','IASLinkedinEnr01'))
edge(w,'Approve Privacy Artifact','Prepare Enrichment Invocation');edge(w,'Prepare Enrichment Invocation','Run Enrichment After Privacy Approval');save('sanitization',w)

w=json.loads((BASE/'enrichment.json').read_text());add(w,trigger());edge(w,'Pipeline Stage Input','Require Approved Privacy Artifact')
next(n for n in w['nodes'] if n['name']=='Require Approved Privacy Artifact')['parameters']['command']=command('theme')
add(w,node('Prepare Candidate Handoff','code',{'jsCode':'''const expected=$('Build Content Brief Files').all();
const written=$input.all();
if(expected.length!==2||written.length!==2||expected.some(x=>!written.some(y=>(y.json.fileName===x.json.fileName||y.json.fileName==='/data/output/ias-linkedin-acceptance/'+x.json.fileName))))throw Error('Candidate write handoff incomplete');
const names=expected.map(x=>x.json.fileName);
const candidateFile=names.find(n=>/^content-candidates-model-eval-\\d{4}-\\d{2}-\\d{2}\\.json$/.test(n));
const briefFile=names.find(n=>/^content-brief-model-eval-\\d{4}-\\d{2}-\\d{2}\\.md$/.test(n));
if(!candidateFile||!briefFile)throw Error('Candidate file handoff invalid');
return [{json:{privacy:$('Parse Latest Theme File').first().json.privacyProof,candidateFile,briefFile}}];'''},2))
add(w,node('Record Current Candidate Artifact','executeCommand',{'command':command('record')}))
add(w,node('Prepare Planner Invocation','code',{'jsCode':'''const items=$input.all();if(items.length!==1)throw Error('Candidate handoff count invalid');
return [{json:JSON.parse(items[0].json.stdout)}];'''},2))
add(w,call('Run Planner After Candidate Success','IASLinkedinPlan1'))
for a,b in [('Write Content Brief Files','Prepare Candidate Handoff'),('Prepare Candidate Handoff','Record Current Candidate Artifact'),('Record Current Candidate Artifact','Prepare Planner Invocation'),('Prepare Planner Invocation','Run Planner After Candidate Success')]:edge(w,a,b)
save('enrichment',w)

w=json.loads((BASE/'editorial-planner.json').read_text());add(w,trigger())
add(w,node('Require Current Candidate Artifact','executeCommand',{'command':command('verify-candidate')}))
for start in ['Pipeline Stage Input','Manual Test Trigger']:edge(w,start,'Require Current Candidate Artifact')
edge(w,'Require Current Candidate Artifact','Read Evidence-Calibrated Candidates')
next(n for n in w['nodes'] if n['name']=='Read Evidence-Calibrated Candidates')['parameters']['fileSelector']='={{ "'+ROOT+'/" + JSON.parse($("Require Current Candidate Artifact").first().json.stdout).candidate.fileName }}'
add(w,node('Validate Planner Artifact Selection','code',{'jsCode':'''const proof=JSON.parse($('Require Current Candidate Artifact').first().json.stdout);
const items=$input.all();if(items.length!==1||items[0].json.sourceCandidateFile!==proof.candidate.fileName||items[0].json.sourceThemeFile!==proof.privacy.fileName)throw Error('Planner artifact handoff mismatch');
return items;'''},2))
old=w['connections']['Parse Latest Candidate File']
if old['main'][0][0]['node']=='Validate Planner Artifact Selection':old=w['connections']['Validate Planner Artifact Selection']
w['connections']['Validate Planner Artifact Selection']=old;edge(w,'Parse Latest Candidate File','Validate Planner Artifact Selection')
add(w,node('Check Handoff Before Writing Plan','executeCommand',{'command':command('verify-candidate','JSON.parse($("Require Current Candidate Artifact").first().json.stdout)')},1));next(n for n in w['nodes'] if n['name']=='Check Handoff Before Writing Plan')['executeOnce']=True
add(w,node('Restore Current Plan Files','code',{'jsCode':"return $('Prepare Editorial Plan Files').all();"},2))
edge(w,'Prepare Editorial Plan Files','Check Handoff Before Writing Plan');edge(w,'Check Handoff Before Writing Plan','Restore Current Plan Files');edge(w,'Restore Current Plan Files','Write Editorial Plan Files');save('editorial-planner',w)
