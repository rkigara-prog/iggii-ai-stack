const crypto=require('crypto');
const {safeBriefDiagnostic,inspectBrief,constrainBriefCoverage}=require('./brief-contract.cjs');
const NODE='node_f047c33eb6b74231';
function updateBriefContract(input){
 const w=JSON.parse(JSON.stringify(input)),get=name=>{const n=w.nodes.find(n=>n.name===name);if(!n)throw Error('Missing brief contract node');return n;};
 const build=get('Build Content Brief Files'),restore=get('Restore Retrieved Evidence'),sink=get('Record Failure Code: '+NODE);
 if(crypto.createHash('sha256').update(build.parameters.jsCode).digest('hex')!=='b134b6da3deb3b18e5279129b8ab79d74f46460918ff1123fdbd5bacfe017d55')throw Error('Unreviewed brief builder');
 const marker='requestBody.messages.push({role:"user",content:JSON.stringify(packet)});';
 if(restore.parameters.jsCode.split(marker).length!==2)throw Error('Unreviewed request builder');
 restore.parameters.jsCode=restore.parameters.jsCode.replace(marker,constrainBriefCoverage.toString()+'\nObject.assign(requestBody,constrainBriefCoverage(requestBody,packet));\n'+marker);
 const declarations=safeBriefDiagnostic.toString()+'\n'+inspectBrief.toString()+'\nif($input.all().length!==1)return [{json:{briefBuildFailed:true,diagnostic:safeBriefDiagnostic({category:"response_shape_invalid",finishReason:"missing",counts:{}})}}];';
 build.parameters.jsCode=declarations+'\nconst packetCheck=inspectBrief($("Restore Retrieved Evidence").first().json,$json);\nif(packetCheck.diagnostic)return [{json:{briefBuildFailed:true,diagnostic:packetCheck.diagnostic}}];\ntry {const outputs=(()=>{\n'+build.parameters.jsCode+'\n})();if(!Array.isArray(outputs)||outputs.length!==2||outputs.some(x=>!x.binary?.data))throw Error("Invalid generated files");return outputs.map(x=>({...x,json:{...x.json,briefBuildFailed:false}}));}catch{return [{json:{briefBuildFailed:true,diagnostic:safeBriefDiagnostic({category:"unexpected_build_failure",finishReason:packetCheck.finishReason,counts:packetCheck.counts})}}];}';
 const edges=w.connections[build.name]?.main;if(!edges?.[0]?.length||edges[1]?.length!==1||edges[1][0].node!==sink.name)throw Error('Unreviewed brief edges');
 const success='Route Complete Brief Files',failed='Route Brief Diagnostic',recorder='Record Brief Contract Failure';
 if(w.nodes.some(n=>[success,failed,recorder].includes(n.name)))throw Error('Already modified brief contract');
 for(const [name,value]of [[success,false],[failed,true]]){
  const validate='const items=$input.all();if(!items.length||items.some(x=>typeof x.json?.briefBuildFailed!=="boolean")||new Set(items.map(x=>x.json.briefBuildFailed)).size!==1)throw Error("Invalid brief route");';
  const code=validate+'return items.flatMap((x,i)=>{if(x.json.briefBuildFailed!=='+value+')return [];const {briefBuildFailed,...json}=x.json;return [{...x,json,pairedItem:{item:i}}];});';
  w.nodes.push({id:'brief-contract-'+value,name,type:'n8n-nodes-base.code',typeVersion:2,position:[build.position[0]+220,build.position[1]+(value?180:0)],onError:'continueErrorOutput',parameters:{jsCode:code}});
  w.connections[name]={main:[value?[{node:recorder,type:'main',index:0}]:edges[0],edges[1]]};
 }
 const copy=JSON.parse(JSON.stringify(sink));copy.id='brief-contract-recorder';copy.name=recorder;
 if(copy.parameters.command.split('JSON.stringify({').length!==2)throw Error('Unreviewed failure command');
 copy.parameters.command=copy.parameters.command.replace('JSON.stringify({','JSON.stringify({diagnostic:(()=>{'+safeBriefDiagnostic.toString()+';return safeBriefDiagnostic($json.diagnostic);})(),');
 w.nodes.push(copy);w.connections[recorder]=JSON.parse(JSON.stringify(w.connections[sink.name]));
 w.connections[build.name]={main:[[{node:success,type:'main',index:0},{node:failed,type:'main',index:0}],edges[1]]};
 return w;
}
module.exports={updateBriefContract};
