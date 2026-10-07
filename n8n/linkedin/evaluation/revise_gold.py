"""Documented regression correction. Never modify original packets/gold/freeze/responses."""
import argparse,copy,json
from pathlib import Path
from run import digest
from score import assess,aggregate
ap=argparse.ArgumentParser();ap.add_argument('--private-root',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
r=a.private_root;p=json.loads((r/'packets.private.json').read_text());gold=json.loads((r/'gold.private.json').read_text());seal=json.loads((r/'freeze.private.json').read_text())
assert digest(p)==seal['packet_sha256'] and digest(gold)==seal['gold_sha256']
g=copy.deepcopy(gold)
g['S43']['claims']['S43-c1']['allowed_sources']=['S4B']
g['S63']['claims']['S63-c1'].update(supported=True,allowed_sources=['S6A'])
reasons={'S43':'Only the technical reporting passage supports the claim; the promotional passage provides no technical evidence. Candidate remains defer.', 'S63':'Primary passage supports the bounded claim; unrelated second source provides no corroboration. Separate claim support from topic eligibility; candidate remains defer.'}
revision={'original_freeze':seal,'revised_gold_sha256':digest(g),'reasons':reasons,'status':'Revised regression results on already inspected cases; not held-out evaluation','judgment_author':'Codex; not independently human-adjudicated'}
(r/'gold-revised.private.json').write_text(json.dumps(g,indent=2));(r/'gold-revised.private.json').chmod(0o600)
canaries=json.loads((r/'privacy-canaries.private.json').read_text());summary={'revision':revision,'arms':{}};details={}
for arm in ['baseline','grounded','laya']:
 rows=[]
 for packet in p:
  rec=json.loads((r/'responses'/f'assessment-{arm}-{packet["id"]}.json').read_text());assert rec['packet_sha256']==digest(packet)
  row=assess(packet,{**g[packet['id']],'private_canary_terms':canaries},rec);rows.append(row);details[f'{arm}-{packet["id"]}']=row
 summary['arms'][arm]=aggregate(rows)
summary['human_editing_effort']='unmeasured';summary['alternative_writer_quality']='unmeasured'
a.output.write_text(json.dumps(summary,indent=2)+'\n')
(r/'scores-revised.private.json').write_text(json.dumps(details));(r/'scores-revised.private.json').chmod(0o600)
print(json.dumps({arm:{k:v for k,v in x.items() if k in ['decision_correct','claim_correct','false_accept']} for arm,x in summary['arms'].items()}))
