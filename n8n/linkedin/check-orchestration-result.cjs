// Assert native orchestration results from synthetic checks; no content assertions.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {execution,outputs}=require('./audit-acceptance.cjs');
const fixtureRoot=process.argv[2],logDir=process.argv[3],scenario=process.argv[4];
const expected={pass:['enrichment','planner','complete'],'privacy-fail':[],'enrichment-fail':['enrichment'],'planner-fail':['enrichment','planner'],'stale-candidate':['enrichment']};
try{
 const r=execution(scenario),eventsFile=path.join(fixtureRoot,'events.jsonl');
 const events=fs.existsSync(eventsFile)?fs.readFileSync(eventsFile,'utf8').trim().split('\n').filter(Boolean).map(x=>JSON.parse(x).event):[];
 assert.deepEqual(events,expected[scenario]);assert.equal(!!r.error,scenario!=='pass');
 if(scenario==='pass'){
  assert.equal(r.lastNodeExecuted,'Run Enrichment After Privacy Approval');
  assert(outputs(r,r.lastNodeExecuted).every(x=>JSON.parse(x.json.stdout).complete===true));
 }
 console.log(JSON.stringify({scenario,passed:true,events,parentFailed:!!r.error}));
}catch{console.error('Synthetic orchestration check failed; inspect private fixture log');process.exitCode=1;}
