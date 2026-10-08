"""Build an inactive, unconnected manual n8n pilot; never import or activate it."""
import json
from pathlib import Path

HERE = Path(__file__).parent
ROOT = '/data/output/ias-linkedin/Reviews/Gemma-Pilot'


def build():
    nodes = []
    def node(name, kind, parameters, version=1):
        nodes.append({'id': 'gemma-pilot-' + str(len(nodes)), 'name': name,
                      'type': 'n8n-nodes-base.' + kind, 'typeVersion': version,
                      'position': [len(nodes)*240, 0], 'parameters': parameters})
    node('Manual Pilot Only', 'manualTrigger', {})
    node('Read Approved Public Request', 'readWriteFile', {'fileSelector': ROOT+'/request.json', 'options': {}}, 1)
    # Use installed OpenSSH, which supports host pinning; the installed SSH node does not expose it.
    node('Prepare Pinned SSH Transport', 'code', {'jsCode': '''
const raw=await this.helpers.getBinaryDataBuffer(0,'data');
if(raw.length>65536)throw Error('Packet too large; do not truncate evidence');
const packet=JSON.parse(raw.toString('utf8'));
if(!/^[a-zA-Z0-9_-]{1,64}$/.test(packet.requestId))throw Error('Invalid request ID');
if(packet.approval?.status!=='approved_for_drafting')throw Error('Human drafting approval missing');
return [{json:{packet,encoded:raw.toString('base64')}}];
'''}, 2)
    node('Run Isolated Gemma Worker', 'executeCommand', {'command': '''={{ "printf %s '" + $json.encoded + "' | /usr/bin/timeout 1900 /usr/bin/ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/home/node/.n8n/gemma-pilot-known-hosts -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -i /home/node/.n8n/gemma-pilot-ssh.key rigarashi@192.168.113.32 linkedin-gemma-pilot" }}'''})
    # No new n8n module allowlist or restart. Ubuntu runs the shared evidence contract.
    code='''
const packet=$('Prepare Pinned SSH Transport').first().json.packet;
if($json.exitCode!==undefined&&$json.exitCode!==0)throw Error('SSH worker failed');
const record=JSON.parse($json.stdout);
if(record.status!=='response'||record.requestId!==packet.requestId||record.serverStopped!==true)throw Error('Worker blocked or mismatched; retain checkpoint');
const reviewed=record.review;
if(!reviewed||reviewed.automaticPublishingAllowed!==false||reviewed.humanApprovalRequired!==true||reviewed.publicationApproval!==null)throw Error('Human review contract missing');
for(const [out,input] of [['approvedClaims','claims'],['sources','sources'],['sourceAssessments','sourceAssessments'],['claimsApproval','approval']]){
 if(JSON.stringify(reviewed[out])!==JSON.stringify(packet[input]))throw Error('Evidence handoff mismatch: '+input);
}
if(reviewed.fullProseReview?.method!=='deterministic_full_prose_coverage'||reviewed.fullProseReview?.automaticPublishingAllowed!==false)throw Error('Complete prose review missing');
return [{json:{requestId:packet.requestId,reviewStatus:'human_review_required',automaticPublishingAllowed:false,reviewBase64:Buffer.from(JSON.stringify(reviewed)).toString('base64')}}];
'''
    node('Review Complete Draft and Evidence', 'code', {'jsCode': code}, 2)
    node('Save Pilot Review Only', 'executeCommand', {'command':'={{ "node /home/node/.n8n/gemma-pilot/write-review.cjs " + $json.reviewBase64 }}'})
    connections={a['name']:{'main':[[{'node':b['name'],'type':'main','index':0}]]} for a,b in zip(nodes,nodes[1:])}
    return {'name':'DEVELOPMENT ONLY — Gemma LinkedIn drafting pilot','active':False,'nodes':nodes,'connections':connections,
            'settings':{'executionOrder':'v1','executionTimeout':2000,'saveDataSuccessExecution':'none','saveDataErrorExecution':'all','saveManualExecutions':False},
            'pinData':{},'tags':[]}


if __name__=='__main__':
    (HERE/'workflow.json').write_text(json.dumps(build(),indent=2)+'\n')
