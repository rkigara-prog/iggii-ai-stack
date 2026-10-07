// Runs as n8n's ordinary user. Inputs are approved public search results, never transcripts.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),dns=require('dns').promises,http=require('http'),https=require('https');
const dep='/usr/local/lib/node_modules/n8n/node_modules/.pnpm/node_modules/';
const cheerio=require(dep+'cheerio'),ip=require(dep+'ipaddr.js');
const {readable}=require('../content-access.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function canonical(value,base){const u=new URL(value,base);u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^(gclid|fbclid)$/i.test(k))u.searchParams.delete(k);return u.href;}
async function address(url){const u=new URL(url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port))throw Error('invalid_public_url');const addresses=await dns.lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(a=>ip.process(a.address).range()!=='unicast'))throw Error('nonpublic_address');return addresses.find(a=>a.family===4)||addresses[0];}
async function get(url,depth=0){
 if(depth>4)throw Error('redirect_limit');const a=await address(url),u=new URL(url);
 return new Promise((resolve,reject)=>{
 const req=(u.protocol==='https:'?https:http).get(url,{headers:{'User-Agent':'Mozilla/5.0 IASContentEvidence/1.0','Accept':'text/html'},lookup:(_h,opts,cb)=>opts.all?cb(null,[a]):cb(null,a.address,a.family)},res=>{
  if([301,302,303,307,308].includes(res.statusCode)){res.resume();return get(new URL(res.headers.location,url).href,depth+1).then(resolve,reject);}
  if(res.statusCode!==200){res.resume();return reject(Error('http_'+res.statusCode));}
  if(!/text\/html|application\/xhtml/i.test(res.headers['content-type']||'')){res.resume();return reject(Error('unsupported_content_type'));}
  const chunks=[];let size=0;res.on('data',b=>{size+=b.length;if(size>3000000){res.destroy();reject(Error('page_size_limit'));}else chunks.push(b);});res.on('error',reject);res.on('end',()=>resolve({bytes:Buffer.concat(chunks),finalUrl:url}));
 });req.setTimeout(20000,()=>req.destroy(Error('timeout')));req.on('error',reject);
 });
}
function extract(raw,finalUrl){
 const $=cheerio.load(raw.toString('utf8'));const declared=$('link[rel="canonical"]').attr('href');let canon=canonical(finalUrl);
 if(declared){try{const d=canonical(declared,finalUrl);if(new URL(d).hostname===new URL(finalUrl).hostname)canon=d;}catch{}}
 const publisher=$('meta[property="og:site_name"]').attr('content')||new URL(canon).hostname;
 const publicationDate=$('meta[property="article:published_time"]').attr('content')||$('meta[name="date"]').attr('content')||$('time[datetime]').first().attr('datetime')||null;
 const title=$('h1').first().text().trim()||$('title').text().trim();
 $('script,style,noscript,nav,header,footer,form,aside').remove();const body=$('article').first().length?$('article').first():$('main').first().length?$('main').first():$('body');
 const blocks=[];body.find('h1,h2,h3,p,li,td,pre').each((_i,e)=>{if($(e).find('p,li').length)return;const text=$(e).text().replace(/\s+/g,' ').trim();if(text.length>=30&&blocks.at(-1)!==text)blocks.push(text);});
 const text=blocks.join('\n');if(text.length<300||/just a moment|verify you are human|access denied/i.test(title))throw Error('unusable_page_text');
 const passages=blocks.flatMap(b=>{const a=[];for(let i=0;i<b.length;i+=1600)a.push(b.slice(i,i+1600));return a;}).map((text,i)=>({id:'p'+String(i+1).padStart(4,'0'),text}));
 return {canonicalUrl:canon,publisher,publicationDate,title,text,passages};
}
async function main(){
 const root=process.env.IAS_PRIVACY_ROOT;if(!root)throw Error('root_required');const input=JSON.parse(Buffer.from(process.argv[2],'base64'));
 const cache=path.join(root,'Evidence');if(!fs.existsSync(cache))fs.mkdirSync(cache,{mode:0o750});readable(cache,true);
 const sources=[];
 for(const raw of input.sources.slice(0,18)){
  const requestedUrl=raw.url,key=sha(requestedUrl),index=path.join(cache,key+'.latest.json');let record;
  if(fs.existsSync(index)){const old=JSON.parse(fs.readFileSync(index));if(Date.now()-Date.parse(old.retrievedAt)<24*3600000&&old.retrievalStatus==='retrieved')record=old;}
  if(!record){
   record={id:raw.id,requestedUrl,retrievedAt:new Date().toISOString(),retrievalStatus:'unavailable',publisher:raw.publisher||null,publicationDate:null,canonicalUrl:requestedUrl,passages:[]};
   try{const got=await get(requestedUrl);const parsed=extract(got.bytes,got.finalUrl);record={...record,...parsed,finalUrl:got.finalUrl,rawSha256:sha(got.bytes),textSha256:sha(parsed.text),retrievalStatus:'retrieved'};
    const version=key+'-'+record.rawSha256+'-'+record.retrievedAt.replace(/[^0-9]/g,'');record.cacheFile='Evidence/'+version+'.json';
    for(const [ext,bytes] of [['html',got.bytes],['json',Buffer.from(JSON.stringify(record,null,2))]]){const file=path.join(cache,version+'.'+ext);if(!fs.existsSync(file)){fs.writeFileSync(file,bytes,{mode:0o640,flag:'wx'});readable(file);}}
   }catch(e){record.errorCategory=e.message;}
   fs.writeFileSync(index,JSON.stringify(record),{mode:0o640});readable(index);
  }
  // Keep immutable full text in cache; bound the model packet without disguising omission.
  let size=0;const passages=record.passages.filter(p=>{size+=p.text.length;return size<=14000;});
  sources.push({...record,id:raw.id,text:undefined,passages,passagesOmitted:record.passages.length-passages.length});
 }
 const packet={...input,sources,retrievalVersion:'1.0'};
 const checkpoint=path.join(cache,'packet-'+sha(JSON.stringify(packet))+'.json');fs.writeFileSync(checkpoint,JSON.stringify(packet),{mode:0o640});readable(checkpoint);
 console.log(JSON.stringify(packet));
}
if(require.main===module)main().catch(e=>{console.error('Evidence retrieval failed: '+e.message);process.exitCode=1;});
module.exports={canonical,address,extract};
