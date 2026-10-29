const assert=require('assert/strict');
const NAME='Check Handoff Before Writing Plan';
const roots=['/data/output/ias-linkedin-acceptance','/data/output/ias-linkedin'];
function commands(root){
 if(!roots.includes(root))throw Error('Unreviewed planner root');
 const old='={{ "IAS_PRIVACY_ROOT='+root+' node '+root+'/pipeline-artifact.cjs verify-candidate " + JSON.stringify(JSON.parse($("Require Current Candidate Artifact").first().json.stdout)).base64Encode() }}';
 return {old,next:old.slice(0,-3)+' + " " + $execution.id }}'};
}
function checkedNode(w,expected){
 const matches=w.nodes.filter(n=>n.name===NAME),n=matches[0];
 if(matches.length!==1||n.type!=='n8n-nodes-base.executeCommand'||n.typeVersion!==1||n.executeOnce!==true||n.parameters?.command!==expected)throw Error('Unreviewed planner handoff check');
 return n;
}
function assertOnlyPlannerHandoff(before,after,root='/data/output/ias-linkedin-acceptance'){
 const c=commands(root);checkedNode(before,c.old);checkedNode(after,c.next);
 const restored=JSON.parse(JSON.stringify(after));checkedNode(restored,c.next).parameters.command=c.old;
 assert.deepEqual(restored,before,'Unexpected change outside final handoff command');
}
function updatePlannerHandoff(input,root='/data/output/ias-linkedin-acceptance'){
 const w=JSON.parse(JSON.stringify(input)),c=commands(root);
 checkedNode(w,c.old).parameters.command=c.next;assertOnlyPlannerHandoff(input,w,root);return w;
}
module.exports={updatePlannerHandoff,assertOnlyPlannerHandoff,commands};
