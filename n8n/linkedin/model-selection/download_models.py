"""Fetch only the two frozen, licensed quantized artifacts; no inference or paid APIs."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import time
import urllib.request

p=argparse.ArgumentParser();p.add_argument('--models',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--rate-mib',type=float,default=25);a=p.parse_args()
a.output.mkdir(mode=0o700,parents=True,exist_ok=True)
def download(row):
    dest=a.output/row['file'];part=dest.with_suffix(dest.suffix+'.part')
    if dest.exists():
        if hashlib.file_digest(dest.open('rb'),'sha256').hexdigest()==row['sha256']:return {'model':row['model'],'cached':True,'bytes':dest.stat().st_size,'sha256':row['sha256']}
        raise ValueError('Existing model hash mismatch')
    start=part.stat().st_size if part.exists() else 0
    req=urllib.request.Request(row['url'],headers={'Range':f'bytes={start}-'} if start else {})
    began=time.monotonic();received=0
    with urllib.request.urlopen(req,timeout=90) as response:
        if start and response.status!=206:raise ValueError('Server did not honor resume range')
        with part.open('ab' if start else 'wb') as out:
            while block:=response.read(4*1024*1024):
                out.write(block);received+=len(block)
                delay=received/(a.rate_mib*1024**2)-(time.monotonic()-began)
                if delay>0:time.sleep(delay)
    if part.stat().st_size!=row['bytes']:raise ValueError('Model length mismatch')
    with part.open('rb') as f:actual=hashlib.file_digest(f,'sha256').hexdigest()
    if actual!=row['sha256']:raise ValueError('Model SHA256 mismatch')
    part.chmod(0o600);part.replace(dest)
    return {'model':row['model'],'bytes':row['bytes'],'sha256':actual,'downloadSeconds':round(time.monotonic()-began,2)}
with ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(download,json.loads(a.models.read_text())['quantizedArtifacts']))
(a.output/'download-results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
