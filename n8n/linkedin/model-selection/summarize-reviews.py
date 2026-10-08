"""Export numeric Codex ratings only; keep draft text and evidence outside Git."""
import argparse
from collections import Counter
import json
from pathlib import Path
import statistics

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 raw=json.loads((a.root/'writing-judgments.json').read_text())
 expected={arm+'/'+id for arm in ['home-chat','qwen3.8-27b','gemma4-31b'] for id in ['W1','W2','W3','W4']}
 assert set(raw)==expected,'Complete all twelve prose reviews before exporting'
 result={'rater':'Codex','independentHumanRatings':False,'humanEditingMinutes':'unmeasured','estimatedCorrectionEffort':'not measured or inferred from sentence flags','scale':'0–5; see Review-Rubric.md','provenance':'Complete prose reviewed against frozen public source passages; semantic support and style scores are judgments, not deterministic proof','drafts':{},'armMeans':{}}
 for key,r in sorted(raw.items()):
  assert r['completeProseReviewed'] and r['actualEditingMinutes'] is None
  result['drafts'][key]={'scores':r['scores'],'completeProseReviewed':True,'sentenceCount':r['sentenceCount'],'sentenceJudgmentCounts':dict(Counter(s['judgment'] for s in r['sentences'])),'reviewStatus':r['reviewStatus']}
 for arm in ['home-chat','qwen3.8-27b','gemma4-31b']:
  rows=[r['scores'] for key,r in raw.items() if key.startswith(arm+'/')]
  result['armMeans'][arm]={dimension:round(statistics.mean(r[dimension] for r in rows),2) for dimension in rows[0]}
 a.output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result['armMeans']))

if __name__=='__main__':main()
