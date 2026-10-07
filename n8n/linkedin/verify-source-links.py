"""Check editorial source links without exposing URLs or content in console output.

Read only current-cycle candidate/plan files. Watchlist link reachability does
not promote those candidates into verified editorial selections. Keep detailed results private.
This checks public-link reachability, not independent factual corroboration.
"""
import concurrent.futures
import ipaddress
import hashlib
import json
from pathlib import Path
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request

root, evidence = map(Path, sys.argv[1:3])
record = json.loads((evidence/'cycle-provenance.private.json').read_text())
assert record['complete']
plan_file = next(f['fileName'] for f in record['editorialArtifacts'] if f['fileName'].endswith('.json'))
plan_meta = next(f for f in record['editorialArtifacts'] if f['fileName'] == plan_file)
plan_bytes = (root/plan_file).read_bytes()
candidate_bytes = (root/record['candidateArtifact']['fileName']).read_bytes()
assert hashlib.sha256(plan_bytes).hexdigest() == plan_meta['sha256']
assert hashlib.sha256(candidate_bytes).hexdigest() == record['candidateArtifact']['sha256']
plan = json.loads(plan_bytes)
candidates = json.loads(candidate_bytes)
verified = {c['topic']: c for c in candidates['themeAligned'] + candidates['emerging']}
links = {s['url'] for c in candidates['themeAligned'] + candidates['emerging'] + candidates['watchlist']
         for s in c['sources']}
selected_links = set()
for item in plan['selectedTopics']:
    candidate = verified[item['sourceCandidateTopic']]
    assert set(item['sourceUrls']) == {s['url'] for s in candidate['sources']}
    selected_links.update(item['sourceUrls'])
assert selected_links <= links

def public_url(url):
    p = urllib.parse.urlsplit(url)
    assert p.scheme in ('http', 'https') and p.hostname and not p.username and not p.password
    assert p.port in (None, 80, 443)
    addresses = socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == 'https' else 80))
    assert addresses and all(ipaddress.ip_address(a[4][0]).is_global for a in addresses)

class PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def check(url):
    row = {'url': url}
    try:
        public_url(url)
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (compatible; IASContentLinkCheck/1.0)'})
        with urllib.request.build_opener(PublicRedirect()).open(req, timeout=30) as response:
            row.update(status=response.status, finalUrl=response.url, reachable=200 <= response.status < 300,
                       contentType=response.headers.get('Content-Type',''))
            row['nonemptyBody'] = bool(response.read(4096))
    except urllib.error.HTTPError as error:
        row.update(status=error.code, reachable=False)
    except Exception as error:
        row.update(reachable=False, errorCategory=type(error).__name__)
    return row

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, sorted(links)))
out = evidence/'source-links.private.json'
out.write_text(json.dumps(results,indent=2)); out.chmod(0o600)
summary = {'uniqueContentSourceLinks':len(results), 'uniqueSelectedSourceLinks':len(selected_links), 'reachable':sum(r.get('reachable',False) for r in results),
           'nonemptyReachable':sum(r.get('reachable',False) and r.get('nonemptyBody',False) for r in results),
           'httpFailures':{}, 'transportFailures':sum('errorCategory' in r for r in results),
           'exactCandidateAndPlanUrlsPassed':True}
for row in results:
    if row.get('status',0) >= 300:
        key = str(row['status']); summary['httpFailures'][key] = summary['httpFailures'].get(key,0)+1
print(json.dumps(summary))
