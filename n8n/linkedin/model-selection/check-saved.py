"""Validate completed saved comparison artifacts without inference or network calls."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from prompts import REASONING, RANKING, WRITING
from run import extract

def sha(data):
 return hashlib.sha256(data).hexdigest()

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();root=a.root
 freeze=json.loads((root/'freeze.json').read_text())
 for name,expected in freeze['sha256'].items():
  assert sha((root/name).read_bytes())==expected, name+' changed'
 assert sha(Path(__file__).with_name('prompts.py').read_bytes())==freeze['promptSha256']
 tasks={}
 for phase,name,prompt,budget,thinking in [('assessment','assessment-packets.json',REASONING,3072,True),('ranking','ranking-packets.json',RANKING,2048,True),('writing','writing-packets.json',WRITING,2048,False)]:
  for i,packet in enumerate(json.loads((root/name).read_text())):
   id='order-'+str(i+1) if phase=='ranking' else packet['id']
   body=packet['candidates'] if phase=='ranking' else packet
   tasks[phase+'-'+id]=(phase,id,body,prompt,budget,thinking)
 judgments=json.loads((root/'writing-judgments.json').read_text());report={'verifiedAt':datetime.now(timezone.utc).isoformat(),'networkCalls':0,'modelCalls':0,'frozenInputsUnchanged':True,'arms':{}}
 for arm in ['home-chat','qwen3.8-27b','gemma4-31b']:
  files={f.stem:f for f in (root/'responses'/arm).glob('*.json')}
  assert set(files)==set(tasks),(arm,'missing or extra checkpoints',sorted(set(tasks)-set(files)))
  finishes=Counter();max_prompt=0;max_total=0
  for name,file in files.items():
   r=json.loads(file.read_text());phase,id,packet,prompt,budget,thinking=tasks[name]
   assert (r['arm'],r['phase'],r['id'],r['status'])==(arm,phase,id,'response')
   assert r['inputSha256']==sha(json.dumps(packet,ensure_ascii=False,separators=(',',':')).encode())
   assert r['systemPromptSha256']==sha(prompt.encode())
   assert r['requestParameters']=={'model':arm,'temperature':.6 if thinking else .8,'top_p':.95,'seed':714919,'stream':False,'max_tokens':budget,'chat_template_kwargs':{'enable_thinking':thinking}}
   e=extract(r['reply']);finishes[e['finish_reason']]+=1
   assert e['finish_reason'] in ['stop','length']
   usage=r['reply']['usage'];max_prompt=max(max_prompt,usage['prompt_tokens']);max_total=max(max_total,usage['total_tokens'])
   assert usage['completion_tokens']<=budget
   if arm!='home-chat':assert usage['total_tokens']<=16384
   if phase=='writing':
    assert e['finish_reason']=='stop' and isinstance(e['parsed'],dict) and isinstance(e['parsed'].get('draft'),str)
    j=judgments[arm+'/'+id]
    assert j['rater']=='Codex' and j['independentHumanRating'] is False and j['actualEditingMinutes'] is None and j['completeProseReviewed']
    assert j['sentenceCount']==len(j['sentences'])>0
  report['arms'][arm]={'savedCalls':len(files),'sameFrozenPacketsAndPrompts':True,'sameRequestBudgets':True,'finishCounts':dict(finishes),'maxPromptTokens':max_prompt,'maxTotalTokens':max_total,'completeProseReviews':4}
 a.output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))

if __name__=='__main__':main()
