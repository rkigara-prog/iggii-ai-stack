"""Build inactive runtime checks using real orchestration nodes and synthetic content stubs.
No inference, web search, transcripts, production outputs or publishing actions.
"""
import base64,json,sys
from pathlib import Path
BASE=Path(__file__).parent
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
ROOT='/data/output/ias-orchestration/fixtures'
HELPERS='/home/node/.n8n/ias-orchestration'
def load(stage):return json.loads((BASE/(stage+'.json')).read_text().replace('/data/output/ias-linkedin-acceptance',ROOT).replace(ROOT+'/pipeline-artifact.cjs',HELPERS+'/pipeline-artifact.cjs'))
def node(name,kind,params,version=1):return {'name':name,'id':'fixture-'+name.replace(' ','-'),'type':'n8n-nodes-base.'+kind,'typeVersion':version,'position':[0,0],'parameters':params}
def edge(w,a,b):w['connections'][a]={'main':[[{'node':b,'type':'main','index':0}]]}
def keep(w,names):w['nodes']=[n for n in w['nodes'] if n['name'] in names];w['connections']={a:c for a,c in w['connections'].items() if a in names and all(x['node'] in names for branch in c.get('main',[]) for x in branch)}
def command(action):return 'IAS_PRIVACY_ROOT='+ROOT+' node '+HELPERS+'/orchestration-fixture.cjs '+action

def save(w,name):
 w['name']='IAS_Orchestration_Check_'+name;w['active']=False
 for n in w['nodes']:
  if n['type'].endswith('executeWorkflow'):
   target=n['parameters']['workflowId']['value'];n['parameters']['workflowId']['value']={'IASLinkedinEnr01':'IASOrchEnr01','IASLinkedinPlan1':'IASOrchPlan1'}[target]
 (out/(name+'.json')).write_text(json.dumps([w],indent=2)+'\n');(out/(name+'.json')).chmod(0o600)

for mode in ['pass','privacy-fail','enrichment-fail','planner-fail','stale-candidate']:
 w=load('sanitization');keep(w,['Prepare Enrichment Invocation','Run Enrichment After Privacy Approval']);w['id']='IASOrchSan01'
 w['nodes'] += [node('Fixture Start','manualTrigger',{}),node('Fixture Begin','executeCommand',{'command':command('begin '+mode)}),node('Approve Privacy Artifact','executeCommand',{'command':'={{ "IAS_PRIVACY_ROOT='+ROOT+' node '+HELPERS+'/privacy-artifact.cjs approve " + JSON.parse($("Fixture Begin").first().json.stdout).runId + " theme-list-model-eval-qwen35-2026-10-06.txt" }}'})]
 for a,b in [('Fixture Start','Fixture Begin'),('Fixture Begin','Approve Privacy Artifact'),('Approve Privacy Artifact','Prepare Enrichment Invocation'),('Prepare Enrichment Invocation','Run Enrichment After Privacy Approval')]:edge(w,a,b)
 save(w,'sanitization-'+mode)

w=load('enrichment');names=['Pipeline Stage Input','Require Approved Privacy Artifact','Prepare Candidate Handoff','Record Current Candidate Artifact','Prepare Planner Invocation','Run Planner After Candidate Success','Write Content Brief Files'];keep(w,names);w['id']='IASOrchEnr01'
w['nodes'] += [node('Parse Latest Theme File','code',{'jsCode':"return [{json:{privacyProof:JSON.parse($input.first().json.stdout)}}];"},2),node('Synthetic Research','executeCommand',{'command':command('research')}),node('Build Content Brief Files','code',{'jsCode':'''const proof=$('Parse Latest Theme File').first().json.privacyProof;
const candidate={status:'ready',generatedAt:new Date().toISOString(),sourceThemeFile:proof.fileName,themeAligned:[{topic:'synthetic orchestration candidate'}],emerging:[],watchlist:[]};
return [['content-candidates-model-eval-2026-10-06.json',JSON.stringify(candidate)],['content-brief-model-eval-2026-10-06.md','Synthetic brief']].map(([fileName,text])=>({json:{fileName},binary:{data:{fileName,data:Buffer.from(text).toString('base64')}}}));'''},2),node('Synthetic Handoff Mutation','executeCommand',{'command':command('handoff')})]
for a,b in [('Require Approved Privacy Artifact','Parse Latest Theme File'),('Parse Latest Theme File','Synthetic Research'),('Synthetic Research','Build Content Brief Files'),('Build Content Brief Files','Write Content Brief Files'),('Write Content Brief Files','Prepare Candidate Handoff'),('Prepare Candidate Handoff','Record Current Candidate Artifact'),('Record Current Candidate Artifact','Synthetic Handoff Mutation'),('Synthetic Handoff Mutation','Prepare Planner Invocation'),('Prepare Planner Invocation','Run Planner After Candidate Success')]:edge(w,a,b)
save(w,'enrichment')

w=load('editorial-planner');keep(w,['Pipeline Stage Input','Require Current Candidate Artifact','Validate Planner Artifact Selection','Check Handoff Before Writing Plan','Restore Current Plan Files','Write Editorial Plan Files']);w['id']='IASOrchPlan1'
w['nodes'] += [node('Parse Latest Candidate File','code',{'jsCode':"const proof=JSON.parse($('Require Current Candidate Artifact').first().json.stdout);return [{json:{sourceCandidateFile:proof.candidate.fileName,sourceThemeFile:proof.privacy.fileName}}];"},2),node('Synthetic Planning','executeCommand',{'command':command('planner')}),node('Prepare Editorial Plan Files','code',{'jsCode':"return ['md','json'].map(ext=>({json:{fileName:'linkedin-editorial-plan-model-eval-2026-10-06.'+ext},binary:{data:{data:Buffer.from(ext==='json'?'{}':'Synthetic plan').toString('base64')}}}));"},2),node('Fixture Complete','executeCommand',{'command':command('complete'),'executeOnce':True})]
for a,b in [('Require Current Candidate Artifact','Parse Latest Candidate File'),('Parse Latest Candidate File','Validate Planner Artifact Selection'),('Validate Planner Artifact Selection','Synthetic Planning'),('Synthetic Planning','Prepare Editorial Plan Files'),('Prepare Editorial Plan Files','Check Handoff Before Writing Plan'),('Check Handoff Before Writing Plan','Restore Current Plan Files'),('Restore Current Plan Files','Write Editorial Plan Files'),('Write Editorial Plan Files','Fixture Complete')]:edge(w,a,b)
next(n for n in w['nodes'] if n['name']=='Fixture Complete')['executeOnce']=True
save(w,'editorial-planner')
# This n8n version requires publication for database-ID subworkflows. Inline the
# synthetic children for runtime checks without publishing any fixture or migration.
planner=json.loads((out/'editorial-planner.json').read_text())[0]
enrichment=json.loads((out/'enrichment.json').read_text())[0]
call=next(n for n in enrichment['nodes'] if n['type'].endswith('executeWorkflow'))
call['parameters'].pop('workflowId');call['parameters']['source']='parameter';call['parameters']['workflowJson']='={{ "'+base64.b64encode(json.dumps(planner).encode()).decode()+'".base64Decode() }}'
for mode in ['pass','privacy-fail','enrichment-fail','planner-fail','stale-candidate']:
 p=out/('sanitization-'+mode+'.json');w=json.loads(p.read_text())[0]
 call=next(n for n in w['nodes'] if n['type'].endswith('executeWorkflow'))
 call['parameters'].pop('workflowId');call['parameters']['source']='parameter';call['parameters']['workflowJson']='={{ "'+base64.b64encode(json.dumps(enrichment).encode()).decode()+'".base64Decode() }}'
 p.write_text(json.dumps([w],indent=2)+'\n');p.chmod(0o600)
