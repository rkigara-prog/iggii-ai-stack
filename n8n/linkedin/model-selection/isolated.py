"""One isolated native evaluation arm; stop only our process on resource violations."""
import argparse, fcntl, json, os, signal, subprocess, sys, time, urllib.request, shutil
from datetime import datetime,timezone
from pathlib import Path
from run import snapshot, save, prior_namespace

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--arm',choices=['qwen3.8-27b','gemma4-31b'],required=True);p.add_argument('--phase',choices=['all','assessment','ranking','writing'],default='all');a=p.parse_args();root=a.root.resolve();here=Path(__file__).parent.resolve()
 # Wait for an existing arm; do not hold the comparison lock while child runner uses it.
 with (root/'frozen/comparison.lock').open('a') as f:fcntl.flock(f,fcntl.LOCK_EX)
 while not prior_namespace['idle']('http://192.168.113.32:8000','http://192.168.113.32:8188')[0]:time.sleep(15)
 layers=32 if a.arm=='qwen3.8-27b' else 24
 model={'qwen3.8-27b':'qwen3.8-27b-Q4_K_M.gguf','gemma4-31b':'gemma-4-31B-it-Q4_0.gguf'}[a.arm]
 completed=json.loads((root/'models/download-results.json').read_text());manifest=json.loads((here/'models.json').read_text());entry=next(x for x in manifest['quantizedArtifacts'] if x['file']==model)
 assert any(x['sha256']==entry['sha256'] and x['bytes']==entry['bytes'] for x in completed)
 assert (root/'models'/model).stat().st_size==entry['bytes']
 history=root/'runtime-history'/datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ');history.mkdir(mode=0o700,parents=True,exist_ok=True)
 for name in [a.arm+'-runtime.private.json',a.arm+'-server.private.log']:
  if (root/name).exists():shutil.copy2(root/name,history/name)
 baseline=snapshot(None);base_used=baseline['gpu'][0]['XPUM_STATS_MEMORY_USED'];base_gpu1=baseline['gpu'][1]['XPUM_STATS_MEMORY_USED'];samples=[]
 args=[str(root/'llama-build/bin/llama-server'),'--model',str(root/'models'/model),'--alias',a.arm,'--host','127.0.0.1','--port','8017','--ctx-size','16384','--parallel','1','--threads','4','--threads-batch','4','--batch-size','256','--ubatch-size','128','--n-gpu-layers',str(layers),'--split-mode','none','--main-gpu','0','--fit','off','--no-context-shift','--jinja','--reasoning-format','deepseek','--no-webui']
 env=dict(os.environ,ONEAPI_DEVICE_SELECTOR='level_zero:0');log=(root/(a.arm+'-server.private.log')).open('w');proc=subprocess.Popen(['nice','-n','10']+args,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 record={'arm':a.arm,'phase':a.phase,'args':args,'pid':proc.pid,'baseline':baseline,'status':'starting','startedAt':time.time()};save(root/(a.arm+'-runtime.private.json'),record);child=None
 try:
  deadline=time.monotonic()+600;ready=False
  while True:
   if time.time()>float(os.environ.get('EVALUATION_ACCESS_DEADLINE','inf')):raise RuntimeError('Temporary GPU access lease is about to expire; checkpoints retained')
   if proc.poll() is not None:raise RuntimeError('Isolated server exited: '+str(proc.returncode))
   s=snapshot(proc.pid);samples.append(s);used=s['gpu'][0].get('XPUM_STATS_MEMORY_USED');available=int(next(x.split()[1] for x in Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemAvailable:')))/1024/1024
   if used is None or 'XPUM_STATS_MEMORY_USED' not in s['gpu'][1]:raise RuntimeError('GPU budget telemetry unavailable')
   if s['gpu'][1]['XPUM_STATS_MEMORY_USED']-base_gpu1>512:raise RuntimeError('GPU1 allocation changed; yield to household work and inspect device mapping')
   if used-base_used>10240 or 32656-used<3072 or available<32:raise RuntimeError('Resource limit reached; stop isolated server only')
   if not ready:
    try:
     with urllib.request.urlopen('http://127.0.0.1:8017/health',timeout=2) as r:ready=json.load(r).get('status')=='ok'
    except Exception:pass
    if ready:
     record.update(status='evaluating',readyAt=time.time(),loadedSnapshot=s)
     child=subprocess.Popen([sys.executable,str(here/'run.py'),'--root',str(root/'frozen'),'--arm',a.arm,'--base','http://127.0.0.1:8017','--model',a.arm,'--pid',str(proc.pid),'--phase',a.phase])
    elif time.monotonic()>deadline:raise RuntimeError('Server readiness deadline')
   if child and child.poll() is not None:
    if child.returncode:raise RuntimeError('Evaluation stopped with checkpoint; exit '+str(child.returncode))
    record['status']='completed';break
   time.sleep(5)
 except Exception as e:record.update(status='blocked',error=str(e));raise
 finally:
  if child and child.poll() is None:child.terminate();child.wait(timeout=30)
  if proc.poll() is None:
   os.killpg(proc.pid,signal.SIGTERM)
   try:proc.wait(timeout=30)
   except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
  record.update(finishedAt=time.time(),resourceSamples=samples);save(root/(a.arm+'-runtime.private.json'),record);log.close()
if __name__=='__main__':main()
