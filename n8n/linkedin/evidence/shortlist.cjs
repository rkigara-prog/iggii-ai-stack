const source=$json;
const groups=[];
for(const g of (source.recoveryEvidenceByTopic||[]).slice(0,4))groups.push({topic:g.topic,records:g.evidenceRecords});
for(const g of (source.foundationEvidenceByTheme||[]).slice(0,3))groups.push({topic:g.relatedTheme,records:g.evidenceRecords});
const sources=[],byUrl=new Map(),shortlist=[];
for(const g of groups){const ids=[];for(const a of (g.records||[]).slice(0,4)){
 if(!/^https?:\/\//.test(a.url)||a.url.length>2000)continue;
 let s=byUrl.get(a.url);if(!s){if(sources.length>=18)continue;s={id:'s'+(sources.length+1),url:a.url,publisher:a.publisher};sources.push(s);byUrl.set(a.url,s);}ids.push(s.id);
 }if(ids.length)shortlist.push({id:'t'+(shortlist.length+1),topic:g.topic,sourceIds:ids});}
return [{json:{sourceThemeFile:source.sourceThemeFile,sourceThemeDate:source.sourceThemeDate,consolidatedThemes:source.consolidatedThemes,shortlist,sources}}];
