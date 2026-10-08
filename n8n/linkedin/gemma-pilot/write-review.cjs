// Installed only at activation in n8n's private app directory. No archive/current writes.
'use strict';
const fs=require('node:fs');
const root='/data/output/ias-linkedin/Reviews/Gemma-Pilot';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(review){
 const sources=review.sources.map(s=>'<details><summary>'+escape(s.publisher)+' — '+escape(s.id)+'</summary><p><a href="'+escape(s.canonicalUrl)+'">Original page</a> · Published: '+escape(s.publicationDate||'unestablished')+' · Retrieved: '+escape(s.retrievedAt)+'</p>'+s.passages.map(p=>'<p><b>'+escape(p.id)+'</b></p><blockquote>'+escape(p.text)+'</blockquote>').join('')+'</details>').join('');
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gemma pilot review</title><style>body{font:18px/1.6 system-ui;max-width:900px;margin:36px auto;padding:0 20px}pre{white-space:pre-wrap;font:inherit}details,blockquote{padding:12px;background:#f5f7fa}a{overflow-wrap:anywhere}</style><main><h1>Pilot draft — human review required</h1><p>Not approved for publication. Publishing remains disabled. Save edits separately using the request ID and your name; do not overwrite this original. Resolve every prose flag and record approval separately. Review files are human records, not publishing inputs.</p><p>Request: '+escape(review.requestId)+'</p><h2>Draft</h2><pre>'+escape(review.draft)+'</pre><h2>Evidence-bound input claims</h2><ul>'+review.approvedClaims.map(c=>'<li>'+escape(c.text)+'<br>'+c.citations.map(r=>escape(r.sourceId+'/'+r.passageId)+': '+escape(r.quote)).join('<br>')+'</li>').join('')+'</ul><h2>Complete-prose review flags</h2><p>Mechanical coverage is not semantic verification. Unmapped sentences require human evidence, attribution or recommendation review.</p><ul>'+review.fullProseReview.assertions.map(a=>'<li><b>'+escape(a.status)+'</b>: '+escape(a.text)+'</li>').join('')+'</ul><h2>Frozen public evidence</h2>'+sources+'</main></html>\n';
}
function preserve(target,data){
 try{fs.writeFileSync(target,data,{flag:'wx',mode:0o660});}
 catch(e){if(e.code!=='EEXIST'||fs.lstatSync(target).isSymbolicLink()||fs.readFileSync(target,'utf8')!==data)throw Error('Existing review differs; preserve it and choose a new explicit request ID');}
}
function writeReview(review,directory=root){
 if(!/^[a-zA-Z0-9_-]{1,64}$/.test(review.requestId)||review.automaticPublishingAllowed!==false||review.humanApprovalRequired!==true||review.publicationApproval!==null)throw Error('Invalid review-only artifact');
 const target=directory+'/'+review.requestId+'.review.json',data=JSON.stringify(review,null,2)+'\n';
 preserve(target,data);
 const readable=directory+'/'+review.requestId+'.draft.html';preserve(readable,html(review));
 // Unraid shfs does not reliably inherit the setgid directory group or honor
 // named ACLs. n8n has supplementary GID 1800; pin generated originals to the
 // established private contentpipeline group. Local test directories are exempt.
 if(directory===root)for(const file of [target,readable]){fs.chownSync(file,-1,1800);fs.chmodSync(file,0o640);}
 return {reviewFile:target,readableDraft:readable,automaticPublishingAllowed:false,humanApprovalRequired:true};
}
module.exports={writeReview,html};
if(require.main===module){
 const encoded=process.argv[2];if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded||''))throw Error('Invalid transport');
 console.log(JSON.stringify(writeReview(JSON.parse(Buffer.from(encoded,'base64').toString('utf8')))));
}
