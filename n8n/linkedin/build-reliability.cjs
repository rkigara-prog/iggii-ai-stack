// Reproducible source-export patch. Never imports or activates a live workflow.
const fs=require('fs'),path=require('path');const D=__dirname;
const read=p=>fs.readFileSync(path.join(D,p),'utf8');
const relevance=read('evidence/relevance.cjs').split('module.exports=')[0];
const policy=read('evidence/policy.cjs').split('module.exports=')[0].replace("const {relevant}=require('./relevance.cjs');",relevance);
const clause='Return zero to eight topics, only when supported and safe. Do not fill a quota. If every topic is excluded return {"themes":[]}. ';
function node(w,name){const n=w.nodes.find(n=>n.name===name);if(!n)throw Error('Missing expected node');return n;}
function route(w,from,yes,no){const name=from+' Has Research';if(!w.nodes.some(n=>n.name===name))w.nodes.push({id:'reliability-'+name.replace(/[^a-z]/gi,'').toLowerCase(),name,type:'n8n-nodes-base.if',typeVersion:2.2,position:[0,0],parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:'research-present',leftValue:'={{ $json.noResearch !== true }}',rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}});w.connections[from]={main:[[{node:name,type:'main',index:0}]]};w.connections[name]={main:[[{node:yes,type:'main',index:0}],[{node:no,type:'main',index:0}]]};}
function update(w){
 if(w.nodes.some(n=>n.name==='Build Final Public-Safe Theme List')){
  const extraction=node(w,'Sanitize via qwen3.5 (Per Meeting)');
  if(!extraction.parameters.jsonBody.includes('"uniqueItems"'))extraction.parameters.jsonBody=extraction.parameters.jsonBody.replace('"maxItems": 6','"maxItems": 6, "uniqueItems": true').replace('"type": "string",','"type": "string", "minLength": 1,');
  let n=node(w,'Aggregate Anonymous Candidate Themes');n.parameters.jsCode=n.parameters.jsCode.replace("if (!nonempty.length) throw Error('No candidate themes; privacy handoff blocked');","if (!nonempty.length) return [{json:{noResearch:true}}];");
  n=node(w,'Build Final Public-Safe Theme List');n.parameters.jsCode=n.parameters.jsCode.replace("if (!safe.length) throw Error('Privacy gate returned no public-safe themes');","if (!safe.length) return [{json:{noResearch:true}}];");
  const begin=node(w,'Begin Privacy Attempt').parameters.command;
  const base=begin.match(/(?:IAS_PRIVACY_ROOT=[^ "\\]+ )?node ([^ "\\]+)\/privacy-artifact.cjs/)[0];
  const empty='={{ '+JSON.stringify(base+' empty ')+' + JSON.parse($("Begin Privacy Attempt").first().json.stdout).runId }}';
  if(!begin.includes('$execution.id'))node(w,'Begin Privacy Attempt').parameters.command='={{ '+JSON.stringify(begin+' ')+' + $execution.id }}';
  if(!w.nodes.some(n=>n.name==='Finish Without Research'))w.nodes.push({id:'reliability-no-research',name:'Finish Without Research',type:'n8n-nodes-base.executeCommand',typeVersion:1,position:[0,200],parameters:{command:empty}});
  else node(w,'Finish Without Research').parameters.command=empty;
  route(w,'Aggregate Anonymous Candidate Themes','Privacy Adjudication and Deduplication via gpt-oss','Finish Without Research');
  route(w,'Build Final Public-Safe Theme List','Prepare Theme File','Finish Without Research');
  const files=node(w,'Build Recent Transcript File List');
  files.parameters.jsCode=files.parameters.jsCode.replace('return [];','return [{json:{noResearch:true}}];');
  route(w,'Build Recent Transcript File List','Read Recent Transcripts From Disk','Finish Without Research');
 }
 if(w.nodes.some(n=>n.name==='Consolidate Themes via qwen3.5')){
  const n=node(w,'Consolidate Themes via qwen3.5');let e=n.parameters.jsonBody;
  e=e.replace('Consolidate duplicates and closely related ideas into five to eight broader public topics. ',clause.replace(/"/g,'\\"'));
  e=e.replace('"minItems": 1','"minItems": 0');
  for(const [key,max] of [['theme',220],['searchQuery',390],['rationale',1000]])e=e.replace(new RegExp('"'+key+'"\\s*:\\s*\\{[^}]*\\}'),'"'+key+'": '+JSON.stringify({type:'string',minLength:8,maxLength:max}));
  n.parameters.jsonBody=e;
  let parse=node(w,'Parse Consolidated Themes');parse.parameters.jsCode=parse.parameters.jsCode.replace('parsed.themes.length < 1 || ','');if(!parse.parameters.jsCode.includes('noResearch:true'))parse.parameters.jsCode=parse.parameters.jsCode.replace('const themes = parsed.themes;','if (!parsed.themes.length) return [{json:{noResearch:true}}];\n  const themes = parsed.themes;');
  const command=node(w,'Require Approved Privacy Artifact').parameters.command;
  const root=command.match(/IAS_PRIVACY_ROOT=([^ ]+)/)[1];
  if(!w.nodes.some(n=>n.name==='Finish Research With No Topics'))w.nodes.push({id:'reliability-empty-research',name:'Finish Research With No Topics',type:'n8n-nodes-base.executeCommand',typeVersion:1,position:[0,200],parameters:{command:'={{ "IAS_PRIVACY_ROOT='+root+' node '+root+'/stage-result.cjs record " + JSON.stringify({runId:$("Parse Latest Theme File").first().json.privacyProof.runId,stage:"research",state:"completed_no_research",reasonCode:"all_excluded"}).base64Encode() }}'}});
  route(w,'Parse Consolidated Themes','Validate Research Query Privacy','Finish Research With No Topics');
  const shortlist=node(w,'Prepare Evidence Shortlist');const prefix=shortlist.parameters.jsCode.split('\n')[0];
  shortlist.parameters.jsCode=prefix+'\n'+relevance+'\n'+read('evidence/shortlist.cjs');
  route(w,'Prepare Evidence Shortlist','Retrieve Source Pages','Finish Research With No Topics');
  const restore=node(w,'Restore Retrieved Evidence');let code=restore.parameters.jsCode;const body=JSON.parse(code.slice(code.indexOf('const requestBody=')+18,code.indexOf(';\nrequestBody.messages.push')));
  body.response_format={type:'json_schema',json_schema:{name:'evidence_assessment',strict:true,schema:require('./evidence/response-schema.cjs').schema}};
  body.messages[0].content=read('evidence/final-prompt.txt');
  restore.parameters.jsCode='const packet=JSON.parse($json.stdout);\nconst requestBody='+JSON.stringify(body,null,2)+';\nrequestBody.messages.push({role:"user",content:JSON.stringify(packet)});\nreturn [{json:{...packet,requestBody}}];';
  node(w,'Build Content Brief Files').parameters.jsCode=policy+'\n'+read('evidence/build-brief.cjs');
 }
 if(w.nodes.some(n=>n.name==='Validate Editorial Plan')){
  const n=node(w,'Validate Editorial Plan');const marker=';return {reviewProse};})();\n';if(n.parameters.jsCode.startsWith('const evidencePolicy=(()=>{'))n.parameters.jsCode='const evidencePolicy=(()=>{'+policy+marker+n.parameters.jsCode.split(marker)[1];
  const planner=node(w,'Plan Dynamic Editorial Portfolio via gpt-oss');
  if(planner.parameters.jsonBody.includes('"type": "json_object"'))planner.parameters.jsonBody=planner.parameters.jsonBody.replace('{\n  "type": "json_object"\n}',JSON.stringify({type:'json_schema',json_schema:{name:'editorial_plan',strict:true,schema:require('./evidence/response-schema.cjs').plannerSchema}},null,2));
  n.parameters.jsCode=n.parameters.jsCode.replace('const planned = parseJson($json.choices?.[0]?.message?.content);',"if ($json.choices?.[0]?.finish_reason !== 'stop') throw Error('Planner response incomplete');\nlet planned; try { planned = JSON.parse($json.choices[0].message.content); } catch { throw Error('Planner response malformed'); }\nif (!Array.isArray(planned.selectedTopics) || planned.selectedTopics.length > 5) throw Error('Planner response schema invalid');");
 }
 for(const name of ['Require Approved Privacy Artifact','Require Current Candidate Artifact']){const n=w.nodes.find(n=>n.name===name);if(n&&!n.parameters.command.includes('$execution.id'))n.parameters.command=n.parameters.command.replace(/ }}$/,' + " " + $execution.id }}');}
 return w;
}
if(require.main===module)for(const file of ['sanitization.json','enrichment.json','editorial-planner.json']){const p=path.join(D,file);fs.writeFileSync(p,JSON.stringify(update(JSON.parse(read(file))),null,2)+'\n');}
module.exports={update};
