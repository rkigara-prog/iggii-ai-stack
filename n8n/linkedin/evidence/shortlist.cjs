const source=$json;
const groups=[];
for(const g of (source.recoveryEvidenceByTopic||[]).slice(0,4))groups.push({topic:g.topic,records:g.evidenceRecords});
for(const g of (source.foundationEvidenceByTheme||[]).slice(0,3))groups.push({topic:g.relatedTheme,records:g.evidenceRecords});
// Round-robin allocation prevents early recovery groups starving foundation groups.
for(const g of groups){
 const extra=[];for(const a of g.records||[])for(const f of curatedFollowups)if(a.url?.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'')===f.matchUrl)extra.push({...f,discoveryUrl:a.url,origin:'documented_targeted_followup'});
 g.records=[...extra,...(g.records||[])].filter((a,i,all)=>all.findIndex(x=>x.url===a.url)===i).slice(0,4);
}
const sources=[],byUrl=new Map(),shortlist=groups.map((g,i)=>({id:'t'+(i+1),topic:g.topic,sourceIds:[]}));
for(let position=0;position<4;position++)for(let gi=0;gi<groups.length;gi++){
 const a=groups[gi].records[position];if(!a||!/^https?:\/\//.test(a.url)||a.url.length>2000)continue;
 let s=byUrl.get(a.url);if(!s){if(sources.length>=18)continue;s={id:'s'+(sources.length+1),url:a.url,publisher:a.publisher,discoveryUrl:a.discoveryUrl,selectionReason:a.reason};sources.push(s);byUrl.set(a.url,s);}shortlist[gi].sourceIds.push(s.id);
}

return [{json:{sourceThemeFile:source.sourceThemeFile,sourceThemeDate:source.sourceThemeDate,consolidatedThemes:source.consolidatedThemes,shortlist:shortlist.filter(t=>t.sourceIds.length),sources}}];
