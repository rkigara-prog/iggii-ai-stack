"""Freeze public pages locally. Never fetch a URL embedded in transcript content."""
import argparse
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import ipaddress
import json
from pathlib import Path
import socket
import urllib.error
import urllib.parse
import urllib.request


def public_url(url):
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme not in ['http', 'https'] or not parsed.hostname
            or parsed.username or parsed.password or parsed.port not in [None, 80, 443]):
        raise ValueError('Invalid public URL')
    addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == 'https' else 80))
    if not addresses or not all(ipaddress.ip_address(a[4][0]).is_global for a in addresses):
        raise ValueError('Nonpublic address')


class PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class PageText(HTMLParser):
    """Conservative text extraction; manual passage selection still required."""
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []
        self.metadata = {}

    def handle_starttag(self, tag, attrs):
        if tag in ['script', 'style', 'noscript']:
            self.skip += 1
        if tag == 'meta':
            attrs = dict(attrs)
            self.metadata[attrs.get('property', attrs.get('name', ''))] = attrs.get('content', '')

    def handle_endtag(self, tag):
        if tag in ['script', 'style', 'noscript'] and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(data.strip())


def retrieve(source, output):
    url = source['url']
    row = dict(source, retrievedAt=datetime.now(timezone.utc).isoformat())
    key = hashlib.sha256(url.encode()).hexdigest()[:12]
    try:
        public_url(url)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 IASContentEvaluation/1.0'})
        with urllib.request.build_opener(PublicRedirect()).open(req, timeout=25) as response:
            row.update(status=response.status, finalUrl=response.url,
                       contentType=response.headers.get('Content-Type', ''))
            raw = response.read(4_000_001)
        if len(raw) > 4_000_000:
            raise ValueError('Page exceeds bounded fetch size')
        if 'html' not in row['contentType'].lower():
            raise ValueError('Unsupported page type; requires separate extraction')
        parser = PageText()
        parser.feed(raw.decode('utf-8', errors='replace'))
        text = '\n'.join(parser.parts)
        row.update(text=text, meta=parser.metadata,
                   rawSha256=hashlib.sha256(raw).hexdigest(),
                   textSha256=hashlib.sha256(text.encode()).hexdigest())
        target = output / (key + '.html')
        target.write_bytes(raw)
        target.chmod(0o600)
    except urllib.error.HTTPError as exc:
        row.update(status=exc.code, errorCategory='HTTPError')
    except Exception as exc:
        row['errorCategory'] = type(exc).__name__
    target = output / (key + '.json')
    target.write_text(json.dumps(row, indent=2))
    target.chmod(0o600)
    return row


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--sources', type=Path, required=True, help='Approved public source metadata JSON')
    ap.add_argument('--output', type=Path, required=True, help='Private path outside Git')
    args = ap.parse_args()
    repo = Path(__file__).resolve().parents[3]
    if args.output.resolve() == repo or repo in args.output.resolve().parents:
        raise ValueError('Raw evidence cannot be saved in Git checkout')
    args.output.mkdir(mode=0o700, parents=True, exist_ok=True)
    # Serial retrieval makes network usage bounded and predictable.
    for source in json.loads(args.sources.read_text()):
        row = retrieve(source, args.output)
        print(json.dumps({'retrieved': row.get('status') == 200,
                          'errorCategory': row.get('errorCategory')}))
