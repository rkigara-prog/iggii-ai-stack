// Static error-edge attribution. Never reads error items or interpolates their contents.
const crypto=require('crypto');
const codeFor=name=>'node_'+crypto.createHash('sha256').update(name).digest('hex').slice(0,16);
function addDiagnostics(w){
 const sink=w.nodes.find(n=>n.name==='Record Explicit Stage Failure');if(!sink)throw Error('Missing failure sink');
 const catalog={};
 for(const [name,connection] of Object.entries(w.connections)){
  for(const output of connection.main||[])for(const edge of output){
   if(edge.node!==sink.name){
    if(edge.node.startsWith('Record Failure Code: ')){
     const code=codeFor(name),n=w.nodes.find(n=>n.name===edge.node);
     const expected=sink.parameters.command.replace('reasonCode:"stage_failed"','reasonCode:"stage_failed",nodeCode:'+JSON.stringify(code));
     if(edge.node!=='Record Failure Code: '+code||!n||n.onError||n.continueOnFail||n.type!==sink.type||n.executeOnce!==sink.executeOnce||n.parameters.command!==expected||JSON.stringify(w.connections[n.name])!==JSON.stringify(w.connections[sink.name]))throw Error('Invalid diagnostic sink');
     catalog[code]=name;
    }
    continue;
   }
   const code=codeFor(name),recorder='Record Failure Code: '+code;
   if(catalog[code]&&catalog[code]!==name)throw Error('Code collision');catalog[code]=name;
   const copy=structuredClone(sink);copy.id='diagnostic-'+code;copy.name=recorder;
   if(!copy.parameters.command.includes('reasonCode:"stage_failed"'))throw Error('Unknown failure command');
   copy.parameters.command=copy.parameters.command.replace('reasonCode:"stage_failed"','reasonCode:"stage_failed",nodeCode:'+JSON.stringify(code));
   if(!w.nodes.some(n=>n.name===recorder))w.nodes.push(copy);
   w.connections[recorder]=structuredClone(w.connections[sink.name]);edge.node=recorder;
  }
 }
 return {workflow:w,catalog};
}
module.exports={addDiagnostics,codeFor};

