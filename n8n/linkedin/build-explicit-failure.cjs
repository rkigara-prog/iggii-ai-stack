// Local draft builder. Requires native manual/automatic acceptance before rollout.
const {constrainPrivacySchema}=require('./privacy-decision-schema.cjs');
function updateFailure(w){
 require('./strict-research-routing.cjs').strictRoutes(w);
 const privacy=w.nodes.find(n=>n.name==='Privacy Adjudication and Deduplication via gpt-oss');
 if(privacy&&!privacy.parameters.jsonBody.includes('constrainPrivacySchema')){
  const expression=privacy.parameters.jsonBody;
  if(!expression.startsWith('={{ JSON.stringify(')||!expression.endsWith(') }}'))throw Error('Unknown privacy expression');
  const definition=require('fs').readFileSync(require.resolve('./privacy-decision-schema.cjs'),'utf8').split('module.exports=')[0];
  privacy.parameters.jsonBody='={{ (()=>{ '+definition+' const request='+expression.slice(19,-4)+'; request.response_format.json_schema.schema=constrainPrivacySchema(request.response_format.json_schema.schema); return JSON.stringify(request); })() }}';
 }
 const begin=w.nodes.find(n=>n.name==='Begin Privacy Attempt');
 const rootNode=begin||w.nodes.find(n=>['Require Approved Privacy Artifact','Require Current Candidate Artifact'].includes(n.name));
 if(!rootNode)throw Error('Unknown pipeline stage');
 const root=rootNode.parameters.command.match(/IAS_PRIVACY_ROOT=([^ "\\]+)/)?.[1]||rootNode.parameters.command.match(/node ([^ "\\]+)\/privacy-artifact\.cjs/)?.[1];if(!root)throw Error('Missing root');
 const record='Record Explicit Stage Failure',stop='Stop After Recorded Failure';
 const names=new Set([record,stop]);
 const supported=new Set(['code','httpRequest','executeCommand','readWriteFile','readBinaryFile','writeBinaryFile','convertToFile','extractFromFile','moveBinaryData','merge','if','executeWorkflow']);
 const guards=[];
 for(const n of [...w.nodes]){
  if(n.name.startsWith('Require Complete Node Success: '))continue;
  const type=n.type.split('.').pop();if(names.has(n.name)||n.disabled||/Trigger$/.test(type)||type==='stickyNote')continue;
  if(!supported.has(type))throw Error('Unreviewed failure output type: '+type);
  // Never continue normally on a caught error. The error output has only this sink.
  if(n.continueOnFail)throw Error('Legacy continueOnFail requires review');
  n.onError='continueErrorOutput';
  const outputs=type==='if'?2:1;
  const connection=w.connections[n.name]||={main:[]};connection.main||=[];
  while(connection.main.length<outputs)connection.main.push([]);
  connection.main[outputs]=[{node:record,type:'main',index:0}];
  // n8n can emit successes AND errors from a multi-item node. Never let the
  // success subset reach the next privacy/research/artifact node in that case.
  for(let i=0;i<outputs;i++)if(connection.main[i]?.length){
   const name='Require Complete Node Success: '+n.name+' '+i;
   if(connection.main[i][0]?.node===name)continue;
   guards.push({id:'complete-'+n.id+'-'+i,name,type:'n8n-nodes-base.code',typeVersion:2,position:[n.position[0]+100,n.position[1]],onError:'continueErrorOutput',parameters:{jsCode:'if ($('+JSON.stringify(n.name)+').all('+outputs+').length) throw Error("Pipeline node returned partial failure");\nreturn $input.all();'}});
   w.connections[name]={main:[connection.main[i],[{node:record,type:'main',index:0}]]};
   connection.main[i]=[{node:name,type:'main',index:0}];
  }
 }
 w.nodes.push(...guards);
 if(!w.nodes.some(n=>n.name===record))w.nodes.push({id:'explicit-stage-failure',name:record,type:'n8n-nodes-base.executeCommand',typeVersion:1,position:[0,700],executeOnce:true,parameters:{command:'={{ "IAS_PRIVACY_ROOT='+root+' node '+root+'/stage-result.cjs fail " + JSON.stringify({executionId:String($execution.id),reasonCode:"stage_failed"}).base64Encode() }}'}});
 if(!w.nodes.some(n=>n.name===stop))w.nodes.push({id:'explicit-stage-stop',name:stop,type:'n8n-nodes-base.stopAndError',typeVersion:1,position:[250,700],parameters:{errorType:'errorMessage',errorMessage:'Pipeline stage failed; consult local run metadata.'}});
 w.connections[record]={main:[[{node:stop,type:'main',index:0}]]};
 // Neither sink has error continuation: failure to persist MUST stop execution.
 return w;
}
module.exports={updateFailure};
