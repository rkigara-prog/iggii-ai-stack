"""Revoke only this pilot's admission/key; retain evidence and existing GPU rollback."""
from datetime import datetime, timezone
import json
from pathlib import Path
import socket
import subprocess
import time

STATE=Path('/home/rigarashi/.local/share/linkedin-gemma-pilot')
MARKER='# linkedin-gemma-pilot-cleanup-20261008'


def main():
    activation=STATE/'activation.json'
    if activation.exists():
        value=json.loads(activation.read_text());value['enabled']=False
        temporary=activation.with_suffix('.cleanup.tmp');temporary.write_text(json.dumps(value,indent=2)+'\n')
        temporary.chmod(0o600);temporary.replace(activation)
    authorized=Path('/home/rigarashi/.ssh/authorized_keys')
    line=(STATE/'authorized-key-line.private.txt').read_text().strip()
    lines=authorized.read_text().splitlines()
    if line in lines:
        temporary=authorized.with_suffix('.pilot-cleanup.tmp')
        temporary.write_text('\n'.join(x for x in lines if x!=line)+('\n' if len(lines)>1 else ''))
        temporary.chmod(0o600);temporary.replace(authorized)
    # Existing management credential; no new privileged Ubuntu execution or ACL changes.
    result=subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=15','-i',
        '/home/rigarashi/.ssh/iggii_automation','root@192.168.113.18',
        'docker exec -u 0 n8n rm -f -- /home/node/.n8n/gemma-pilot-ssh.key /home/node/.n8n/gemma-pilot-known-hosts'],
        capture_output=True,text=True,timeout=45)
    for name in ['pilot-id_ed25519','pilot-id_ed25519.pub']:
        (STATE/name).unlink(missing_ok=True)
    closed=False
    for _ in range(18):
        with socket.socket() as probe:
            probe.settimeout(1);closed=probe.connect_ex(('127.0.0.1',8017))!=0
        if closed:break
        time.sleep(5)
    report={'checkedAt':datetime.now(timezone.utc).isoformat(),'pilotActivationDisabled':True,
        'pilotAuthorizedKeyRemoved':line not in authorized.read_text().splitlines(),
        'n8nPilotCredentialFilesRemoved':result.returncode==0,'pilotLocalPrivateKeyRemoved':not (STATE/'pilot-id_ed25519').exists(),
        'pilotLoopbackListenerClosed':closed,'existingGpuAclRollbackChanged':False,
        'gpuAclCleanupConfirmed':False,'gpuAclNote':'Separate existing root-owned rollback still governs render ACLs; verify actual restoration separately.'}
    (STATE/'pilot-cleanup.private.json').write_text(json.dumps(report,indent=2)+'\n')
    if not closed or result.returncode:
        raise RuntimeError('Pilot cleanup incomplete; retain scheduled retry')
    cron=subprocess.run(['crontab','-l'],capture_output=True,text=True)
    if cron.returncode==0 and MARKER in cron.stdout:
        subprocess.run(['crontab','-'],input='\n'.join(x for x in cron.stdout.splitlines() if MARKER not in x)+'\n',text=True,check=True)
    print(json.dumps(report))


if __name__=='__main__':main()
