"""Freeze reused corrected evidence and shared writing briefs, outside Git."""
import argparse
import hashlib
import json
from pathlib import Path
import random
from datetime import datetime, timezone

def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n');p.chmod(0o600)
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);a=p.parse_args();root=a.root.resolve()
repo=Path(__file__).resolve().parents[3]
if root==repo or repo in root.parents:raise ValueError('Private evidence must be outside Git')
root.mkdir(mode=0o700,parents=True,exist_ok=True)
if (root/'freeze.json').exists():raise ValueError('Already frozen; do not overwrite comparison inputs')
old=Path('/home/rigarashi/.local/share/linkedin-quality-20261007');completion=Path('/home/rigarashi/.local/share/linkedin-completion-20261007')
packets=json.loads((old/'packets.private.json').read_text());gold=json.loads((old/'gold-revised.private.json').read_text())
for packet in packets:
 for source in packet['sources']:
  # Add a stable identifier around the original frozen passage without rewriting it.
  source['passages']=[{'id':'p0001','text':source['page_passages']}]
random.Random(194719).shuffle(packets)
save(root/'assessment-packets.json',packets);save(root/'gold.json',gold)
save(root/'privacy-canaries.json',json.loads((old/'privacy-canaries.private.json').read_text()))
ranking=[p for p in packets if gold[p['id']]['decision']=='accept'];orders=[]
for seed in [71491,71492,71493]:
 order=list(ranking);random.Random(seed).shuffle(order);orders.append({'seed':seed,'candidates':order})
save(root/'ranking-packets.json',orders)
targets=json.loads((completion/'target-reextraction.private.json').read_text());current=json.loads((completion/'candidates.private.json').read_text());previous=json.loads(Path('/home/rigarashi/.local/share/linkedin-evidence-repair-20261007/saved-cycle-assessment.private.json').read_text())
def source_copy(source,id,ids):
 return {'id':id,'url':source.get('canonicalUrl') or source['requestedUrl'],'publisher':source['publisher'],'published_at':source.get('publicationDate'),'retrieved_at':source['retrievedAt'],'passages':[p for p in source['passages'] if p['id'] in ids],'full_text_sha256':source.get('textSha256') or sha(source.get('text','').encode()),'raw_sha256':source.get('rawSha256')}
ms=next(s for s in targets if s['id']=='msblog');nist=next(s for s in targets if s['id']=='nist4');can=next(s for s in previous['packet']['sources'] if s['id']=='s13');cisa=next(s for c in current['themeAligned'] for s in c['sources'] if s['id']=='s5')
# These are writing inputs approved by Codex source review, not human ratings or evaluation answers.
specs=[
 ('W1','current_news','A recent Microsoft report about RMM phishing; distinguish September publication from July observations',ms,'Microsoft',['p0001','p0047'],'Security leaders deciding how to govern approved remote-management tools','Explain why a legitimate tool can still be used through a deceptive installation path. Recommend a bounded review of approved tools and identity settings, without claiming all RMM deployments are compromised.'),
 ('W2','evergreen_analysis','Moving an identity roadmap off superseded guidance',nist,'NIST',['p0002','p0003','p0004'],'Technology leaders reviewing identity governance','Use the July 2025 Revision 4 release as a durable roadmap question, not breaking news. Distinguish checking the governing revision from proving compliance or implementing unspecified controls.'),
 ('W3','evergreen_analysis','Preparing for critical-infrastructure isolation as a last resort',can,'Canadian Centre for Cyber Security',['p0006','p0007','p0015'],'Leaders responsible for essential infrastructure and operational resilience','Develop a contingency-planning argument that preserves up-to-three-month readiness, last-resort use and industry-defined triggers. Do not turn this into a general mandate to disconnect every business.'),
 ('W4','historical_background','A 2024 resilience memorandum as context for present planning',cisa,'CISA',['p0002','p0006','p0007','p0009'],'Infrastructure and security leaders reviewing dependency planning','Use the April 2024 memorandum and the replacement of PPD-21 as historical context. Separate CISA recommendations from legally binding requirements and propose one practical dependency-review decision.')]
briefs=[]
for id,kind,title,s,publisher,ids,audience,argument in specs:
 source=source_copy(s,id+'-s1',ids);source['publisher']=publisher
 if len(source['passages'])!=len(ids):raise ValueError('Missing saved writing passage '+id)
 briefs.append({'id':id,'as_of':'2026-10-07','content_kind':kind,'topic':title,'audience':audience,'editorial_brief':argument,'approved_facts':[{'id':id+'-f'+str(i+1),'attribution':publisher,'source_id':source['id'],'passage_id':p['id'],'source_statement':p['text'],'qualification':'Attributed source statement; preserve its limits, not independent confirmation'} for i,p in enumerate(source['passages'])],'sources':[source]})
save(root/'writing-packets.json',briefs)
# Preserve full page records separately from bounded writer inputs.
save(root/'writing-full-sources.json',[ms,nist,can,cisa])
files=['assessment-packets.json','gold.json','privacy-canaries.json','ranking-packets.json','writing-packets.json','writing-full-sources.json']
seal={'frozenAt':datetime.now(timezone.utc).isoformat(),'sha256':{f:sha((root/f).read_bytes()) for f in files},'promptSha256':sha((Path(__file__).parent/'prompts.py').read_bytes()),'originalPacketsSha256':sha((old/'packets.private.json').read_bytes()),'correctedGoldSha256':sha((old/'gold-revised.private.json').read_bytes()),'assessmentCount':len(packets),'writingCount':len(briefs),'rankingOrders':3,'assessmentStatus':'36 reused regression cases; not held-out','writingStatus':'new fixed public-evidence comparison briefs; no tuning after freeze; authored by Codex, not independent human gold'}
save(root/'freeze.json',seal);print(json.dumps({k:v for k,v in seal.items() if k not in ['sha256']}))
