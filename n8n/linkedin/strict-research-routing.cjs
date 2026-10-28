// Only these existing, reviewed routing contracts may be converted.
const producers=['Aggregate Anonymous Candidate Themes','Build Final Public-Safe Theme List','Build Recent Transcript File List','Parse Consolidated Themes','Prepare Evidence Shortlist'];
const validateCode=`const items=$input.all();
if (!items.length || items.some(item=>!item.json || !Object.hasOwn(item.json,'noResearch') || typeof item.json.noResearch!=='boolean')) throw Error('Research routing contract invalid');
return items.map((item,index)=>({...item,pairedItem:{item:index}}));`;
const filterCode=value=>`return $input.all().flatMap((item,index)=>item.json.noResearch===${value}?[{...item,pairedItem:{item:index}}]:[]);`;
function strictRoutes(w){
 for(const n of [...w.nodes].filter(n=>n.type==='n8n-nodes-base.if')){
  const producer=producers.find(p=>n.name===p+' Has Research');
  const expected={conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:'research-present',leftValue:'={{ $json.noResearch !== true }}',rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}};
  if(!producer||JSON.stringify(n.parameters)!==JSON.stringify(expected)||n.disabled||n.continueOnFail||n.onError)throw Error('Unreviewed research gate');
  const p=w.nodes.find(x=>x.name===producer),edges=w.connections[n.name]?.main;
  if(p?.type!=='n8n-nodes-base.code'||!edges||edges.length!==2)throw Error('Unknown research producer or branches');
  const incoming=Object.entries(w.connections).filter(([,c])=>c.main?.flat().some(e=>e.node===n.name));
  if(incoming.length!==1||incoming[0][0]!==producer)throw Error('Unknown research gate input');
  // Existing trusted producers use absence to mean research. Normalize at that
  // boundary, never inside the strict gate or by coercing a supplied value.
  p.parameters.jsCode='const routingItems=(()=>{\n'+p.parameters.jsCode+'\n})();\nif(!Array.isArray(routingItems)) throw Error("Research producer contract invalid");\nreturn routingItems.map((item,index)=>{if(!item.json || (Object.hasOwn(item.json,"noResearch") && typeof item.json.noResearch!=="boolean")) throw Error("Research producer contract invalid");return {...item,json:{...item.json,noResearch:Object.hasOwn(item.json,"noResearch")?item.json.noResearch:false}};});';
  n.type='n8n-nodes-base.code';n.typeVersion=2;n.parameters={jsCode:validateCode};
  w.connections[n.name]={main:[[]]};
  for(const [i,value] of [false,true].entries()){
   const name=n.name+(value?' No Research':' Research');
   if(w.nodes.some(x=>x.name===name))throw Error('Research route name collision');
   w.nodes.push({id:n.id+'-route-'+i,name,type:'n8n-nodes-base.code',typeVersion:2,position:[n.position[0]+200,n.position[1]+i*150],parameters:{jsCode:filterCode(value)}});
   w.connections[n.name].main[0].push({node:name,type:'main',index:0});w.connections[name]={main:[edges[i]]};
  }
 }
 return w;
}
module.exports={strictRoutes,validateCode,filterCode,producers};

