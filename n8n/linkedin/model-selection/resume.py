"""Resume only missing frozen calls, collecting drafts before the long reasoning queue."""
import argparse,json,os,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
from run import save

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--wait-pid',type=int);a=p.parse_args();root=a.root.resolve();here=Path(__file__).parent.resolve()
 lease=json.loads((root/'access-extension.private.json').read_text());deadline=datetime.fromisoformat(lease['extendedAt']).timestamp()+lease['hours']*3600-60
 unit='linkedin-eval-access-'+lease['newLease'].lower()+'.timer'
 subprocess.run(['systemctl','is-active','--quiet',unit],check=True)
 if deadline<=time.time():raise RuntimeError('Device access lease expired')
 if a.wait_pid:
  while Path(f'/proc/{a.wait_pid}').exists():time.sleep(2)
 phases=[('qwen3.8-27b','writing'),('gemma4-31b','writing'),('qwen3.8-27b','all'),('gemma4-31b','all')]
 env=dict(os.environ,EVALUATION_ACCESS_DEADLINE=str(deadline));status={'startedAt':datetime.now(timezone.utc).isoformat(),'deadline':deadline,'phases':[],'productionMaintenance':False}
 try:
  for arm,phase in phases:
   expected=4 if phase=='writing' else 43;files=list((root/'frozen/responses'/arm).glob('writing-*.json' if phase=='writing' else '*.json'))
   if len(files)>=expected:status['phases'].append({'arm':arm,'phase':phase,'alreadySaved':True});continue
   step={'arm':arm,'phase':phase,'startedAt':datetime.now(timezone.utc).isoformat(),'status':'running'};status['phases'].append(step);save(root/'resume-status.private.json',status)
   with (root/(arm+'-'+phase+'-resume.private.log')).open('a') as log:
    result=subprocess.run([sys.executable,str(here/'isolated.py'),'--root',str(root),'--arm',arm,'--phase',phase],env=env,stdout=log,stderr=subprocess.STDOUT)
   step.update(finishedAt=datetime.now(timezone.utc).isoformat(),exitCode=result.returncode,status='completed' if result.returncode==0 else 'blocked');save(root/'resume-status.private.json',status)
   if result.returncode:raise RuntimeError('Phase stopped with checkpoints; inspect cause, do not silently repeat responses')
  status['status']='completed'
 except Exception as e:status.update(status='blocked',error=str(e));raise
 finally:save(root/'resume-status.private.json',status)
if __name__=='__main__':main()
