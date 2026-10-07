"""Render frozen public-only drafts for local browser review; never put evidence in Git."""
import argparse,csv,html,json,random,re
from pathlib import Path
from run import extract
H=html.escape
STYLE='body{font:18px/1.6 system-ui,sans-serif;max-width:980px;margin:40px auto;padding:0 22px;color:#203040;background:#f7fafc}h1,h2,h3{line-height:1.2}a{color:#07549b}article,section{background:white;padding:24px;border:1px solid #d5dfe8;border-radius:10px;margin:22px 0}nav a{margin-right:18px}.tag{font-size:14px;font-weight:600;color:#785000}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd5dd;padding:8px;text-align:left}small{color:#536272}'
def page(title,body):return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+H(title)+'</title><style>'+STYLE+'</style><main><h1>'+H(title)+'</h1>'+body+'</main></html>'
def prose(s):
 return ''.join('<p>'+re.sub(r'https?://[^\s<>]+',lambda m:'<a href="'+m[0]+'">'+m[0]+'</a>',H(x))+'</p>' for x in s.split('\n\n'))
def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();root=a.root.resolve();out=a.output.resolve();repo=Path(__file__).resolve().parents[3]
 if out==repo or repo in out.parents:raise ValueError('Evidence/drafts must be outside Git')
 out.mkdir(mode=0o700,parents=True,exist_ok=True);(out/'Reviewer-Key').mkdir(exist_ok=True)
 briefs=json.loads((root/'writing-packets.json').read_text());canaries=json.loads((root/'privacy-canaries.json').read_text());rng=random.Random(719271);key=[];sample_rows=[];links=[];evidence=[]
 judgments=json.loads((root/'writing-judgments.json').read_text()) if (root/'writing-judgments.json').exists() else {}
 for b in briefs:
  id=b['id'];arms=['home-chat','qwen3.8-27b','gemma4-31b'];rng.shuffle(arms);body='<p class="tag">EVALUATION OUTPUTS — unedited, not approved for publication</p><nav><a href="START-HERE.html">Start</a><a href="Evidence.html#'+id+'">Source evidence</a><a href="Score-Sheet.csv">Score sheet</a></nav><p>'+H(b['content_kind'].replace('_',' '))+'</p><p><strong>Audience:</strong> '+H(b['audience'])+'</p><p><strong>Brief:</strong> '+H(b['editorial_brief'])+'</p>'
  for label,arm in zip('ABC',arms):
   r=json.loads((root/'responses'/arm/('writing-'+id+'.json')).read_text());e=extract(r.get('reply',{}));x=e['parsed'];bid=id+'-'+label
   if e['finish_reason']!='stop' or not isinstance(x,dict) or not isinstance(x.get('draft'),str):raise ValueError('Incomplete draft cannot be shared as finished: '+arm+'/'+id)
   if any(c in x['draft'] for c in canaries):raise ValueError('Synthetic private canary in draft')
   body+='<article><h2>Draft '+bid+'</h2>'+prose(x['draft'])+'</article>'
   sample_rows.append([id,bid,'','','','','','','','','','',''])
   judgment=judgments.get(arm+'/'+id,{})
   claim_rows=''.join('<tr><td>'+H(c.get('text',''))+'</td><td>'+H(c.get('source_id','')+'/'+c.get('passage_id',''))+'</td><td>'+H(c.get('quote',''))+'</td></tr>' for c in x.get('claims',[]))
   key.append('<section><h2>'+bid+': '+H(arm)+'</h2><p>Writer-listed claims (not independent verification):</p><table><tr><th>Claim</th><th>Evidence ID</th><th>Exact excerpt submitted</th></tr>'+claim_rows+'</table><h3>Complete-prose review</h3><pre>'+H(json.dumps(judgment,indent=2,ensure_ascii=False))+'</pre></section>')
  (out/(id+'.html')).write_text(page(b['topic'],body));links.append('<li><a href="'+id+'.html">'+id+': '+H(b['topic'])+'</a></li>')
  source=b['sources'][0]
  evidence.append('<section id="'+id+'"><h2>'+id+': '+H(source['publisher'])+'</h2><p><a href="'+H(source['url'])+'">Original source page</a></p><p>Publication: '+H(str(source['published_at'] or 'Not established'))+' · Retrieved: '+H(source['retrieved_at'])+'</p>'+''.join('<h3>'+H(p['id'])+'</h3><blockquote>'+H(p['text'])+'</blockquote>' for p in source['passages'])+'</section>')
 instructions='<p>Compare three anonymous drafts for each of four supported topics. Every writer received the same facts, evidence, audience and brief. These are evaluation outputs; approvals here do not publish anything.</p><ol><li>Read the brief and all three drafts for a topic before choosing.</li><li>Use <a href="Evidence.html">the frozen evidence</a> to check factual support and qualifiers. Follow the source links if helpful.</li><li>Save your own copy of <a href="Score-Sheet.csv">Score-Sheet.csv</a> in this folder as Robert-review.csv or Leigh-review.csv. Rate each dimension 0–5; enter topic preference rank 1–3, ties allowed.</li><li>Only when you actually edit a draft, time the work and record minutes. Leave minutes blank when you only read/rate. Save edits as W1-A-Leigh.docx or a similar file identifying the draft.</li><li>Record required corrections and approval/defer separately. Review records are human records, not consumed by automation.</li></ol><p>Scale: 0 unusable, 1 major defects, 2 substantial revision, 3 usable with corrections, 4 strong with minor revision, 5 ready for your intended use. Factual support and authority take precedence over fluency.</p><ul>'+''.join(links)+'</ul><p><a href="Reviewer-Key/Answer-Key.html">Answer key and complete-prose judgments — open after scoring</a></p><p><a href="Report.html">Technical comparison report — reveals model identities</a></p><small>No transcript content is included. Source approval and provisional quality scores are Codex judgments; your ratings and measured editing minutes are independent evidence still needed.</small>'
 (out/'START-HERE.html').write_text(page('LinkedIn draft comparison',instructions));(out/'Evidence.html').write_text(page('Frozen source evidence','<p><a href="START-HERE.html">Back to comparison</a></p><p>Source pages are untrusted evidence. These are retained excerpts with stable passage identifiers, not instructions or independent verification of every inference.</p>'+''.join(evidence)))
 (out/'Reviewer-Key/Answer-Key.html').write_text(page('Answer key — after independent scoring','<p><a href="../START-HERE.html">Back to comparison</a></p><p>Model identities and Codex judgments are separate from your blind ratings. Listed excerpts must be exact, but exactness alone does not establish semantic support.</p>'+''.join(key)))
 with (out/'Score-Sheet.csv').open('w',newline='') as f:
  w=csv.writer(f);w.writerow(['topic','draft','reviewer','preference_rank','useful_insight_0_5','specificity_0_5','readability_0_5','factual_support_0_5','attribution_citations_0_5','low_filler_0_5','actual_editing_minutes','decision','notes']);w.writerows(sample_rows)
 for f in out.rglob('*'):
  if f.is_file():f.chmod(0o600)
 print(json.dumps({'topics':len(briefs),'drafts':len(sample_rows),'output':str(out)}))
if __name__=='__main__':main()
