// Execute the real retrieval loop against synthetic cached public pages. No network.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto');
const {createRequire}=require('node:module');
const script=path.resolve(__dirname,'../evidence/retrieve.cjs'),nativeRequire=createRequire(script);
const {claimGate}=require('../evidence/policy.cjs');
const quote='Input validation rejects malformed application inputs.';
const original={id:'s1',url:'https://www.nist.gov/example'},report={id:'s2',url:'https://independent.example/report'};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
async function run(initial){
 const root=fs.mkdtempSync(path.join(process.env.IAS_TEST_ROOT||os.tmpdir(),'linkedin-retrieval-'));fs.mkdirSync(path.join(root,'Evidence'));
 for(const s of [original,report])fs.writeFileSync(path.join(root,'Evidence',sha(s.url)+'.latest.json'),JSON.stringify({...s,requestedUrl:s.url,canonicalUrl:s.url,retrievedAt:new Date().toISOString(),retrievalStatus:'retrieved',extractionVersion:'1.2',passages:[{id:'p7',text:quote}],links:s.id==='s2'?[{url:original.url,context:'Input validation research report'}]:[]}));
 const input={sources:initial,shortlist:[{id:'t1',topic:'Input validation',sourceIds:initial.map(s=>s.id)}]};let packet;
 const mod={exports:{}};
 const sandbox={module:mod,exports:mod.exports,Buffer,URL,process:{env:{IAS_PRIVACY_ROOT:root},argv:['node',script,Buffer.from(JSON.stringify(input)).toString('base64')]},console:{log:s=>{packet=JSON.parse(s);}},require:name=>{
  if(name.endsWith('/cheerio')||name.endsWith('/ipaddr.js'))return {};
  if(name==='../content-access.cjs')return {readable:()=>{}};
  if(['http','https'].includes(name))return {get:()=>{throw Error('Unexpected network');}};
  return nativeRequire(name);
 }};
 vm.runInNewContext(fs.readFileSync(script,'utf8'),sandbox,{filename:script});await mod.exports.main();
 const orig=packet.sources.find(s=>s.canonicalUrl===original.url);
 assert.deepEqual(orig.originalOfIds,['s2']);
 const assessments=packet.sources.map(s=>({sourceId:s.id,role:s.id==='s2'?'independent_reporting':'primary',originId:s.id,originMethod:s.id==='s2'?'original_analysis':'first_party_record',basis:{passageId:'p7',quote},reason:'Synthetic'}));
 const judgment={support:'supported',reason:'Synthetic',...Object.fromEntries(['scope','attribution','dates','quantities','products','sectors','uncertainty'].map(k=>[k,'preserved']))};
 assert.equal(claimGate({text:quote,form:'exact_quote',factType:'document_statement',exception:null,attribution:{publisher:'NIST',sourceId:orig.id},citations:packet.sources.map(s=>({sourceId:s.id,passageId:'p7',quote})),judgment},packet.sources,assessments).passed,false);
}
(async()=>{for(const initial of [[original,report],[report,original],[report]])await run(initial);console.log('PASS real retrieval loop: preselected/discovered original and source permutations preserve provenance; no network');})().catch(e=>{console.error(e);process.exitCode=1;});
