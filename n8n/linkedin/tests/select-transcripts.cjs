const {select}=require('../select-transcripts.cjs');
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'krisp-selection-'));
try {
 for(const d of ['Krisp-API','Krisp'])fs.mkdirSync(path.join(root,d));
 const id='a'.repeat(32),old='b'.repeat(32),now=Date.parse('2026-10-07T12:00:00Z');
 function pair(dir,id,date){const f=path.join(root,dir,`meeting__krisp_${id}.txt`);fs.writeFileSync(f,'Synthetic transcript');fs.writeFileSync(f.slice(0,-4)+'.json',JSON.stringify({id,started_at:date,metadata:{retained:true}}));return f;}
 const chosen=pair('Krisp-API',id,'2026-10-06T12:00:00Z');pair('Krisp',id,'2026-10-06T12:00:00Z');
 pair('Krisp-API',old,'2026-01-01T12:00:00Z');
 fs.writeFileSync(path.join(root,'Krisp',`krisp-${id}.txt`),'Duplicate');
 fs.writeFileSync(path.join(root,'Krisp',`krisp-${old}.txt`),'Old duplicate with fresh mtime');
 fs.writeFileSync(path.join(root,'Krisp','unknown.txt'),'Undated with fresh mtime');
 fs.writeFileSync(path.join(root,'Krisp','2026-01-01_old.txt'),'Old with fresh mtime');
 const dated=path.join(root,'Krisp','dated.txt');fs.writeFileSync(dated,'Started: 2026-10-05T12:00:00Z\nSynthetic');
 const result=select(root,now);assert.deepStrictEqual(result.paths,[dated,chosen].sort());
 assert.equal(result.stats.legacy_duplicates_excluded,2);assert.equal(result.stats.api_shadow_duplicates_excluded,1);assert.equal(result.stats.legacy_unknown_date,1);
 fs.writeFileSync(path.join(root,'Krisp',`meeting__krisp_${id}.txt`),'Conflicting');assert.throws(()=>select(root,now),/Conflicting/);
 console.log('PASS: API priority, shadow deduplication, meeting-date window, unknown-date exclusion, conflict blocking');
}finally{fs.rmSync(root,{recursive:true,force:true});}
