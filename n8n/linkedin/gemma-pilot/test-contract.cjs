// Synthetic plumbing fixtures only: no source retrieval, model call or real advisory.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os');
const {validate,request,result,digest}=require('./contract.cjs');
const {writeReview}=require('./write-review.cjs');
const q='This synthetic document describes an optional planning step.';
const judgment=Object.fromEntries(['scope','attribution','dates','quantities','products','sectors','uncertainty'].map(k=>[k,'preserved']));
function sign(p){const {approval,...content}=p;p.approval={status:'approved_for_drafting',by:'Leigh',at:'2026-10-08T12:00:00Z',bundleSha256:digest(content)};return p;}
function fixture(){return sign({requestId:'synthetic-plumbing-only',classification:'approved_public_content',brief:{audience:'Technology leaders',angle:'Discuss the planning choice; synthetic fixture only.',contentKind:'evergreen'},claims:[{id:'c1',text:'NIST states: '+q,factType:'document_statement',exception:'attributed_authoritative_statement',citations:[{sourceId:'s1',passageId:'p1',quote:q}],judgment:{support:'supported',reason:'Synthetic fixture judgment, not actual evidence.',...judgment}}],sources:[{id:'s1',requestedUrl:'https://www.nist.gov/synthetic-pilot-fixture',finalUrl:'https://www.nist.gov/synthetic-pilot-fixture',canonicalUrl:'https://www.nist.gov/synthetic-pilot-fixture',publisher:'NIST',publicationDate:null,retrievedAt:'2026-10-08T12:00:00Z',retrievalStatus:'retrieved',passages:[{id:'p1',text:q}]}],sourceAssessments:[{sourceId:'s1',role:'primary',originMethod:'first_party_record',originId:'synthetic-one',reason:'Synthetic origin fixture.',basis:{passageId:'p1',quote:q}}]});}
function record(p){return {requestId:p.requestId,packetSha256:digest(p),status:'response',serverStopped:true,reply:{choices:[{finish_reason:'stop',message:{content:JSON.stringify({draft:p.claims[0].text+'\nhttps://www.nist.gov/synthetic-pilot-fixture\nThis always eliminates every incident.',claims:[{text:p.claims[0].text,approvedClaimId:'c1',sourceId:'s1',passageId:'p1',quote:q}],recommendations:[]})}}]}};}
let checks=0;
function check(f){f();checks++;}
check(()=>assert.equal(request(fixture()).model,'gemma4-31b'));
check(()=>{const p=fixture();Object.assign(p.approval,{status:'authorized_pilot_drafting',by:'user',authorizationType:'bounded_manual_pilot',evidenceSelectionBy:'Codex',blindReviewCompleted:false,publicationApproved:false});validate(p);p.approval.publicationApproved=true;assert.throws(()=>validate(p));});
check(()=>{const p=fixture();p.claims[0].form='paraphrase';p.claims[0].attribution={publisher:'NIST',sourceId:'s1'};p.claims[0].text='NIST states (paraphrased): This synthetic document describes an optional planning step.';validate(sign(p));});
check(()=>{const p=fixture();delete p.claims[0].exception;p.claims[0].text=q;const s=structuredClone(p.sources[0]);s.id='s2';s.canonicalUrl=s.finalUrl=s.requestedUrl='https://www.cisa.gov/synthetic-pilot-fixture';s.publisher='CISA';p.sources.push(s);p.sourceAssessments.push({...structuredClone(p.sourceAssessments[0]),sourceId:'s2',originId:'synthetic-two'});p.claims[0].citations.push({sourceId:'s2',passageId:'p1',quote:q});validate(sign(p));});
for(const mutate of [p=>p.sources[0].retrievalStatus='unavailable',p=>p.claims[0].text+=' 9000 days.',p=>p.sourceAssessments[0].originMethod='unknown',p=>p.sourceAssessments[0].role='promotion',p=>p.classification='private_transcript',p=>p.claims[0].judgment.scope='unresolved'])check(()=>{const p=fixture();mutate(p);assert.throws(()=>validate(sign(p)));});
check(()=>{const p=fixture();p.brief.angle='Changed after approval';assert.throws(()=>validate(p),/Approval does not match/);});
check(()=>{const p=fixture(),r=record(p),v=result(p,r);assert.equal(v.automaticPublishingAllowed,false);assert.equal(v.humanApprovalRequired,true);assert(v.fullProseReview.assertions.some(s=>s.text.includes('eliminates')&&s.status==='human_review_required'));assert.deepEqual(v.sources,p.sources);});
for(const change of [x=>x.claims[0].quote='Changed excerpt with similar words.',x=>x.claims[0].approvedClaimId='invented',x=>x.draft+=' https://unapproved.example/'])check(()=>{const p=fixture(),r=record(p),x=JSON.parse(r.reply.choices[0].message.content);change(x);r.reply.choices[0].message.content=JSON.stringify(x);assert.throws(()=>result(p,r));});
check(()=>{const p=fixture(),r=record(p);r.reply.choices[0].finish_reason='length';assert.throws(()=>result(p,r),/Incomplete/);});
check(()=>{const p=fixture(),r=record(p);r.reply.choices[0].message.content='```json\n'+r.reply.choices[0].message.content+'```';assert.equal(result(p,r).adapter,'whole_message_json_fence');});
check(()=>{const dir=fs.mkdtempSync(os.tmpdir()+'/gemma-review-');try{const p=fixture(),review=result(p,record(p));writeReview(review,dir);writeReview(review,dir);fs.writeFileSync(dir+'/'+p.requestId+'.review.json','Human edits');assert.throws(()=>writeReview(review,dir),/preserve/);}finally{fs.rmSync(dir,{recursive:true});}});
async function workflowCheck(){
 const workflow=JSON.parse(fs.readFileSync(__dirname+'/workflow.json'));
 assert.equal(workflow.active,false);assert(!workflow.nodes.some(n=>/schedule|webhook|executeWorkflowTrigger|httpRequest/i.test(n.type)));
 const p=fixture(),r=record(p);r.review=result(p,r);
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const prepare=workflow.nodes.find(n=>n.name==='Prepare Pinned SSH Transport').parameters.jsCode;
 const prepared=await new AsyncFunction(prepare).call({helpers:{getBinaryDataBuffer:async()=>Buffer.from(JSON.stringify(p))}});
 assert.deepEqual(JSON.parse(Buffer.from(prepared[0].json.encoded,'base64')),p);
 const review=workflow.nodes.find(n=>n.name==='Review Complete Draft and Evidence').parameters.jsCode;
 const output=await new AsyncFunction('$','$input',review)(()=>({all:()=>[{json:{packet:p}}]}),{all:()=>[{json:{stdout:JSON.stringify(r),exitCode:0}}]});
 assert.deepEqual(JSON.parse(Buffer.from(output[0].json.reviewBase64,'base64')).sources,p.sources);
 r.review.sources[0].canonicalUrl='https://tampered.example';
 await assert.rejects(()=>new AsyncFunction('$','$input',review)(()=>({all:()=>[{json:{packet:fixture()}}]}),{all:()=>[{json:{stdout:JSON.stringify(r)}}]}),/handoff mismatch/);
 checks++;console.log(JSON.stringify({passed:true,checks,modelCalls:0,fixtures:'synthetic plumbing only',proseReview:'omitted unsafe assertion routed to human review',workflow:'inactive manual flow; mocked SSH response; no live execution'}));
}
if(require.main===module)workflowCheck().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={fixture,record};
