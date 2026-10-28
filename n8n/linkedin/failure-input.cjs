// Used in the n8n Error Trigger node. The incoming error is inspected transiently,
// never returned, logged, interpolated into a command, or stored in the outbox.
function failureInput(event){
 const executionId=String(event?.execution?.id||'');if(!/^\d{1,20}$/.test(executionId))throw Error('Uncorrelated execution');
 const message=String(event?.execution?.error?.message||'');
 let reasonCode='stage_failed';
 if(/timeout|timed out/i.test(message))reasonCode='model_timeout';
 else if(/privacy|source.review|pairing/i.test(message))reasonCode='privacy_blocked';
 else if(/malformed|incomplete|schema|json|response coverage|source coverage/i.test(message))reasonCode='model_response_invalid';
 else if(/retriev|fetch/i.test(message))reasonCode='evidence_fetch_failed';
 else if(/binding|citation/i.test(message))reasonCode='evidence_binding_failed';
 return {executionId,reasonCode};
}
module.exports={failureInput};
