// Conservative necessary checks; lexical overlap never proves relevance or truth.
const stop=new Set('the a an and or of for to in on with by from via using use systems system enterprise technology security governance framework frameworks alignment strategies management'.split(' '));
function terms(value){return [...new Set((String(value||'').toLowerCase().match(/[a-z][a-z0-9-]*/g)||[]).filter(t=>t.length>2&&!stop.has(t)).map(t=>t.replace(/(?:ing|s)$/,'')))];}
function relevant(topic,text){const wanted=terms(topic),found=new Set(terms(text));return wanted.length>0&&wanted.filter(t=>found.has(t)).length>=Math.min(2,wanted.length);}
function selectPassages(source,topics,limit=14000){
 const all=source.passages||[];const ranked=all.map((p,i)=>({p,i,score:topics.reduce((n,t)=>n+terms(t).filter(k=>terms(p.text).includes(k)).length,0)})).sort((a,b)=>b.score-a.score||a.i-b.i);
 let size=0;const chosen=[];for(const row of ranked){if(size+row.p.text.length<=limit){chosen.push(row);size+=row.p.text.length;}}
 // Keep the original IDs: filtering and reordering must never change a citation identity.
 return chosen.sort((a,b)=>a.i-b.i).map(r=>r.p);
}
function originalLinks(links,topic){return links.filter(l=>/research|report|advisory|analysis|findings|according|announc/i.test(l.context||'')&&relevant(topic,l.context)).slice(0,2);}
module.exports={terms,relevant,selectPassages,originalLinks};
