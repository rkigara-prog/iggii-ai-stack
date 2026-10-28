const assert=require('node:assert/strict'),fs=require('fs');
const {strictRoutes,validateCode,filterCode}=require('../strict-research-routing.cjs');
const run=(code,items)=>Function('$input',code)({all:()=>items});
const batch=[{json:{noResearch:false,id:'a'},binary:{x:1}},{json:{noResearch:true,id:'b'}},{json:{noResearch:false,id:'c'}}];
assert.deepEqual(run(validateCode,batch).map(x=>x.pairedItem.item),[0,1,2]);
assert.deepEqual(run(filterCode(false),batch).map(x=>[x.json.id,x.pairedItem.item]),[['a',0],['c',2]]);
assert.deepEqual(run(filterCode(true),batch).map(x=>[x.json.id,x.pairedItem.item]),[['b',1]]);
for(const bad of [{}, {noResearch:null},{noResearch:'false'},{noResearch:0},{noResearch:[]},Object.create({noResearch:true})])assert.throws(()=>run(validateCode,[batch[0],{json:bad}]),/contract invalid/);
assert.throws(()=>run(validateCode,[]));
let count=0;
for(const stage of ['sanitizer','enrichment']){
 const original=JSON.parse(fs.readFileSync(__dirname+'/../'+({sanitizer:'sanitization',enrichment:'enrichment'}[stage])+'.json'));
 const w=strictRoutes(structuredClone(original));
 if(stage==='sanitizer'){
  const name='Build Recent Transcript File List';const before=original.nodes.find(n=>n.name===name),after=w.nodes.find(n=>n.name===name);
  const input={stdout:'/synthetic/a\n/synthetic/b\n/synthetic/c'};
  const old=Function('$json',before.parameters.jsCode)(input),now=Function('$json',after.parameters.jsCode)(input);
  assert.equal(now.length,3);assert.deepEqual(now,old.map(x=>({...x,json:{...x.json,noResearch:false}})));
  assert(now.every(x=>!Object.hasOwn(x,'pairedItem')),'Do not invent producer lineage on expansion');
 }
 for(const gate of original.nodes.filter(n=>n.type.endsWith('.if'))){count++;const outputs=original.connections[gate.name].main;
  const barrier=w.nodes.find(n=>n.name===gate.name);assert.equal(barrier.parameters.jsCode,validateCode);
  for(const [i,value] of [false,true].entries()){const name=gate.name+(value?' No Research':' Research');assert.deepEqual(w.connections[name].main[0],outputs[i]);}
 }
 const bad=structuredClone(original);bad.nodes.find(n=>n.type.endsWith('.if')).parameters.conditions.conditions[0].leftValue='={{ true }}';assert.throws(()=>strictRoutes(bad),/Unreviewed/);
}
assert.equal(count,5);
console.log('PASS five exact gates; full-batch malformed/missing/type rejection; true/false/mixed routing, binary and paired indices; unknown predicate rejection.');
