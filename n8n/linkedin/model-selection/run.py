"""Serial local comparison, immutable packets, checkpoint every response, no gold in prompts."""
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import ast
import json
from pathlib import Path
import re
import subprocess
import threading
import time
import urllib.parse
import urllib.request
from prompts import REASONING, RANKING, WRITING

HERE=Path(__file__).parent
# Reuse the two small queue helpers verbatim from the prior harness, without
# importing its obsolete prompt module or executing its command-line program.
prior_tree=ast.parse((HERE.parent/'evaluation/run.py').read_text())
prior_helpers=ast.Module(body=[n for n in prior_tree.body if isinstance(n,ast.FunctionDef) and n.name in ['get_json','idle']],type_ignores=[])
prior_namespace={'json':json,'urllib':urllib,'re':re}
exec(compile(prior_helpers,'prior-queue-helpers','exec'),prior_namespace)

def save(path,x):
 path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
 temp=path.with_suffix('.partial');temp.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n');temp.chmod(0o600);temp.replace(path)
def digest(b):return hashlib.sha256(b).hexdigest()
def snapshot(pid):
 result={'sampledAt':time.time(),'gpu':[]}
 for i in [0,1]:
  try:
   x=json.loads(subprocess.check_output(['/usr/bin/xpu-smi','stats','-d',str(i),'-j'],timeout=10))
   result['gpu'].append({'device':i,**{v['metrics_type']:v['value'] for v in x['device_level'] if v['metrics_type'] in ['XPUM_STATS_MEMORY_USED','XPUM_STATS_GPU_UTILIZATION','XPUM_STATS_POWER']}})
  except Exception as e:result['gpu'].append({'device':i,'error':type(e).__name__})
 if pid:
  try:
   status=Path(f'/proc/{pid}/status').read_text();result['rssKiB']=int(re.search(r'^VmRSS:\s+(\d+)',status,re.M)[1])
  except Exception:pass
 return result

def extract(reply):
 choice=reply.get('choices',[{}])[0];message=choice.get('message',{});content=message.get('content') or ''
 # Transport adapter only: separate a well-formed reasoning channel from the final answer.
 inline=None
 if content.lstrip().startswith('<think>') and '</think>' in content:
  inline,content=content.split('</think>',1);inline=inline.split('<think>',1)[1]
 try:parsed=json.loads(content.strip());error=None;strict=True;adapter='json_or_explicit_reasoning_channel'
 except Exception as e:
  parsed=None;error=type(e).__name__;strict=False;adapter=None
  # Accept a single whole-message JSON fence as presentation only. Keep the raw
  # reply and strict_json=False; never repair malformed JSON or task content.
  fence=re.fullmatch(r'\s*```(?:json)?\s*\n(.*?)```\s*',content,re.S)
  if fence:
   try:
    value=json.loads(fence[1])
    if isinstance(value,dict) and set(value)&{'decision','ranked_ids','draft'}:
     parsed=value;content=fence[1];error=None;adapter='single_json_code_fence'
   except (ValueError,TypeError):pass
  # Some serving stacks emit reasoning as untagged content. Extract only one
  # complete terminal task object. Preserve/report the non-JSON preamble; no
  # malformed JSON, evidence or judgment is rewritten and no call is repeated.
  terminals=[]
  for index,char in enumerate(content if parsed is None else ''):
   if char!='{':continue
   try:
    value,end=json.JSONDecoder().raw_decode(content[index:])
    if isinstance(value,dict) and not content[index+end:].strip() and set(value)&{'decision','ranked_ids','draft'}:terminals.append((index,value))
   except (ValueError,TypeError):pass
  if len(terminals)==1:
   index,parsed=terminals[0];inline=content[:index];content=content[index:];error=None;adapter='terminal_json_after_unseparated_preamble'
 return {'finish_reason':choice.get('finish_reason'),'final_text':content,'parsed':parsed,'parse_error':error,'strict_json':strict,'transport_adapter':adapter,'reasoning_present':bool(message.get('reasoning_content') or message.get('reasoning') or inline)}

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--arm',required=True);p.add_argument('--base',required=True);p.add_argument('--model',required=True);p.add_argument('--auth-file',type=Path);p.add_argument('--pid',type=int);p.add_argument('--phase',choices=['all','assessment','ranking','writing'],default='all');a=p.parse_args()
 if a.base not in ['http://192.168.113.32:8000','http://127.0.0.1:8017']:raise ValueError('Only approved local endpoints')
 root=a.root.resolve();seal=json.loads((root/'freeze.json').read_text())
 for name,h in seal['sha256'].items():
  if digest((root/name).read_bytes())!=h:raise ValueError('Frozen evidence changed: '+name)
 if digest((HERE/'prompts.py').read_bytes())!=seal['promptSha256']:raise ValueError('Frozen prompts changed')
 lock=(root/'comparison.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 headers={'Content-Type':'application/json'}
 if a.auth_file:headers['Authorization']='Bearer '+json.loads(a.auth_file.read_text())['HOME_CHAT_API_KEY']
 assessment=json.loads((root/'assessment-packets.json').read_text())
 ranking=json.loads((root/'ranking-packets.json').read_text());writing=json.loads((root/'writing-packets.json').read_text())
 tasks=[('assessment',x['id'],x,REASONING,3072,True) for x in assessment]+[('ranking','order-'+str(i+1),x['candidates'],RANKING,2048,True) for i,x in enumerate(ranking)]+[('writing',x['id'],x,WRITING,2048,False) for x in writing]
 for phase,id,packet,prompt,budget,thinking in tasks:
  if a.phase!='all' and phase!=a.phase:continue
  dest=root/'responses'/a.arm/(phase+'-'+id+'.json')
  if dest.exists():continue
  while True:
   available,_=prior_namespace['idle']('http://192.168.113.32:8000','http://192.168.113.32:8188')
   if available:break
   print(json.dumps({'arm':a.arm,'waitingForHousehold':True}),flush=True);time.sleep(15)
  input_text=json.dumps(packet,ensure_ascii=False,separators=(',',':'))
  body={'model':a.model,'temperature':0.6 if thinking else 0.8,'top_p':0.95,'seed':714919,'stream':False,'max_tokens':budget,'chat_template_kwargs':{'enable_thinking':thinking},'messages':[{'role':'system','content':prompt},{'role':'user','content':input_text}]}
  samples=[];stop=threading.Event()
  def monitor():
   while not stop.is_set():samples.append(snapshot(a.pid));stop.wait(3)
  thread=threading.Thread(target=monitor,daemon=True);thread.start();started=time.monotonic()
  record={'arm':a.arm,'phase':phase,'id':id,'startedAt':datetime.now(timezone.utc).isoformat(),'inputSha256':digest(input_text.encode()),'systemPromptSha256':digest(prompt.encode()),'requestParameters':{k:v for k,v in body.items() if k!='messages'},'status':'error'}
  try:
   req=urllib.request.Request(a.base+'/v1/chat/completions',data=json.dumps(body).encode(),headers=headers)
   # Transport patience is separate from the frozen generation-token budget.
   # Long full-evidence native calls must not be cut off by a short socket read
   # timeout; the isolated wrapper independently enforces the resource lease.
   with urllib.request.urlopen(req,timeout=2400) as response:reply=json.load(response)
   record.update(status='response',reply=reply,**extract(reply))
  except Exception as e:record.update(errorType=type(e).__name__,error=str(e))
  finally:
   record['latencySeconds']=round(time.monotonic()-started,3);stop.set();thread.join(timeout=25);record['resourceSamples']=samples;save(dest,record)
  print(json.dumps({'arm':a.arm,'phase':phase,'id':id,'status':record['status'],'finish':record.get('finish_reason'),'parseError':record.get('parse_error'),'latencySeconds':record['latencySeconds']}),flush=True)
  if record['status']=='error':raise RuntimeError('Transport/runtime error preserved; stop rather than silently retry')
  time.sleep(3)
if __name__=='__main__':main()
