// Read private execution data, build a private per-source audit, print counts only.
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'/data/output/ias-linkedin-real-privacy';
const {execution,outputs}=require('./audit-acceptance.cjs');
const {validateReview}=require('./privacy-policy.cjs');
const result=execution('real-privacy-fixed');
if(result.error) throw Error('Repaired privacy run failed');
const inputs=outputs(result,'Aggregate Anonymous Candidate Themes').map(x=>x.json);
const responses=outputs(result,'Privacy Adjudication and Deduplication via gpt-oss');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'sample-manifest.private.json')));
if(responses.length!==inputs.length)throw Error('Source coverage mismatch');
const samples=manifest.map((m,i)=>{const j=inputs.findIndex(x=>x.sampleIndex===i);if(j<0)return {label:m.label,sourceSegments:require('./privacy-policy.cjs').sourceSegments(fs.readFileSync(m.stagedFile,'utf8')),retainedThemes:[]};const actual=require('./privacy-policy.cjs').sourceSegments(fs.readFileSync(m.stagedFile,'utf8'));if(JSON.stringify(actual)!==JSON.stringify(inputs[j].sourceSegments))throw Error('Sample/source pairing invalid');return {label:m.label,sourceSegments:inputs[j].sourceSegments,retainedThemes:validateReview(responses[j].json,inputs[j]).retained};});
fs.writeFileSync(path.join(root,'recheck-input.private.json'),JSON.stringify({samples}),{mode:0o600});
const final=outputs(result,'Build Final Public-Safe Theme List')[0].json;
console.log(JSON.stringify({sampleCount:samples.length,finalThemeCount:final.themeCount,privacyValidation:final.privacyValidation}));
