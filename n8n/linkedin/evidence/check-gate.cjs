// One focused gate: private regression fixtures + deployed-code extraction/assembly.
const fs=require('fs'),assert=require('assert/strict');
const {gate,reviewProse}=require('./policy.cjs');
const {extract}=require('./retrieve.cjs');
const fixtures=JSON.parse(fs.readFileSync(process.argv[2]));
const results=[];
for(const f of fixtures.cases){const r=gate(f.packet,f.response);assert.equal(r.rows[0].accepted,f.accepted,f.name);if(f.reason)assert(r.rows[0].reasons.includes(f.reason),f.name+': '+r.rows[0].reasons);results.push({case:f.name,accepted:r.rows[0].accepted,passed:true});}
const prose=reviewProse(fixtures.draft,fixtures.approvedClaims);assert(prose.reviewRequired);assert(prose.assertions.some(x=>x.status==='exact_approved_claim'));assert(prose.assertions.some(x=>x.status==='human_review_required'&&x.text.includes(fixtures.omittedAssertion)));
const html=Buffer.from(fixtures.html);const page=extract(html,'https://www.nist.gov/example');assert(page.passages.length);assert(page.publicationDate);assert(!page.text.includes('NAVIGATION SECRET'));assert(page.canonicalUrl==='https://www.nist.gov/example');
const workflows=JSON.parse(fs.readFileSync(process.argv[3]));for(const w of workflows){for(const n of w.nodes){if(n.type.endsWith('.code'))new Function(n.parameters.jsCode.replace(/await this\.helpers\.getBinaryDataBuffer/g,'this.helpers.getBinaryDataBuffer'));}}
const {Expression}=require('/usr/local/lib/node_modules/n8n/node_modules/n8n-workflow');
const expr=new Expression('America/New_York');const enr=workflows.find(w=>w.id==='IASLinkedinEnr01');const prepared=new Function('$json',enr.nodes.find(n=>n.name==='Restore Retrieved Evidence').parameters.jsCode)({stdout:JSON.stringify({shortlist:[],sources:[]})})[0].json;const value=expr.resolveSimpleParameterValue(enr.nodes.find(n=>n.name==='Final Rank Evidence-Bound Opportunities via gpt-oss').parameters.jsonBody,{$json:prepared});const body=typeof value==='string'?JSON.parse(value):value;assert.equal(body.model,'home-chat');assert(body.messages[0].content.includes('originId'));
console.log(JSON.stringify({nativeExpressionPassed:true,passed:true,cases:results,fullProseOmittedAssertionCaught:true,validProseRetained:true,pageExtractionAndMetadata:true,workflowCodeSyntax:true,modelsCalled:0}));
