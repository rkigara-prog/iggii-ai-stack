"""Render the canonical Markdown guide as offline HTML and a printable PDF.

Requires markdown and reportlab. No live-system reads, network requests or pipeline calls.
Usage: python render-content-guide.py [--source GUIDE.md] [--output-dir DIR]
"""
import argparse
import hashlib
import html
import re
from pathlib import Path

import markdown
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Preformatted,
                                LongTable, TableStyle, KeepTogether)

REPO = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=REPO / 'n8n/linkedin/Content-Pipeline-Architecture.md')
parser.add_argument('--output-dir', type=Path)
args = parser.parse_args()
source = args.source.read_text()
digest = hashlib.sha256(args.source.read_bytes()).hexdigest()
out = args.output_dir or args.source.parent
out.mkdir(parents=True, exist_ok=True)
stem = args.source.stem
body = markdown.markdown(source, extensions=['tables', 'fenced_code', 'toc'])
css = '''
:root {color-scheme:light} body {margin:0;background:#f3f5f7;color:#182635;font:16px/1.6 system-ui,Segoe UI,sans-serif}
main {max-width:1500px;margin:auto;padding:42px 38px 72px;background:white}
h1 {font-size:34px;line-height:1.2;max-width:900px} h2 {margin-top:42px;border-top:2px solid #dae4e9;padding-top:20px;color:#16445a}
p,li {max-width:1050px} a {color:#075ba1} code {font:0.87em Consolas,monospace;overflow-wrap:anywhere;background:#edf2f5;border-radius:3px;padding:1px 3px}
pre {background:#142936;color:#f4f9fd;padding:22px;overflow:auto;border-radius:6px;line-height:1.45}
pre code {background:transparent;color:inherit;padding:0;white-space:pre;font-size:13px;overflow-wrap:normal}
table {border-collapse:collapse;width:100%;table-layout:fixed;font-size:13px;line-height:1.45;margin:22px 0;overflow-wrap:anywhere}
th,td {padding:10px 9px;vertical-align:top;border:1px solid #cbd9e2} th {background:#16445a;color:white;text-align:left}
tbody tr:nth-child(even) {background:#f0f5f7} table th:first-child,table td:first-child {width:30%}
nav {padding:14px 18px;background:#e8f1f6;border-left:4px solid #16445a} footer {border-top:1px solid #cbd9e2;margin-top:40px;padding-top:18px;font-size:12px;overflow-wrap:anywhere}
@media(max-width:800px) {main{padding:20px 16px}table{font-size:11px}th,td{padding:7px 4px}h1{font-size:27px}}
@media print {body{background:white}main{padding:0}pre{color:black;background:#eee}h2{break-after:avoid}tr{break-inside:avoid}}
'''
title = next((line[2:] for line in source.splitlines() if line.startswith('# ')), stem)
walkthrough = ' · <a href="#leighs-practical-walkthrough">Leigh’s walkthrough</a>' if 'id="leighs-practical-walkthrough"' in body else ''
html_doc = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><style>{css}</style></head>
<body><main><nav><a href="{stem}.pdf">Printable PDF</a> · <a href="{stem}.md">Canonical Markdown copy</a>{walkthrough}</nav>
{body}
<footer>Generated from {html.escape(args.source.name)}. Source SHA-256: {digest}. Shared copies are reference documents; edit the canonical source through Git.</footer>
</main></body></html>'''
(out / (stem + '.html')).write_text(html_doc)

fontdir = Path('/usr/share/fonts/truetype/dejavu')
for name, filename in [('Guide', 'DejaVuSans.ttf'), ('GuideBold', 'DejaVuSans-Bold.ttf'), ('GuideMono', 'DejaVuSansMono.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(fontdir / filename)))
pdfmetrics.registerFontFamily('Guide', normal='Guide', bold='GuideBold', italic='Guide', boldItalic='GuideBold')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('GuideBody', fontName='Guide', fontSize=9.7, leading=14, spaceAfter=8, splitLongWords=True))
styles.add(ParagraphStyle('GuideTitle', fontName='GuideBold', fontSize=21, leading=27, spaceAfter=18, keepWithNext=True))
styles.add(ParagraphStyle('GuideH2', fontName='GuideBold', fontSize=13, leading=17, spaceBefore=15, spaceAfter=9, keepWithNext=True))
styles.add(ParagraphStyle('GuideCell', fontName='Guide', fontSize=7.8, leading=11, splitLongWords=True))
styles.add(ParagraphStyle('GuideHeader', parent=styles['GuideCell'], fontName='GuideBold', textColor=colors.white))
styles.add(ParagraphStyle('GuideCode', fontName='GuideMono', fontSize=7.4, leading=9.2, spaceAfter=12))

def inline(text):
    # Protect code spans before interpreting emphasis or link syntax.
    code = []
    def protect(match):
        code.append('<font name="GuideMono">' + html.escape(match.group(1)) + '</font>')
        return f'CODEPLACEHOLDER{len(code)-1}END'
    text = re.sub(r'`([^`]+)`', protect, text)
    text = html.escape(text)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<link href="\2" color="#075ba1">\1</link>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    for i, value in enumerate(code):
        text = text.replace(f'CODEPLACEHOLDER{i}END', value)
    return text

page_width, page_height = landscape(A4)
width = page_width - 64
story = []
lines = source.splitlines()
i = 0
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
        continue
    if line.startswith('```'):
        i += 1
        block = []
        while i < len(lines) and not lines[i].startswith('```'):
            block.append(lines[i]); i += 1
        story.append(Preformatted('\n'.join(block), styles['GuideCode'], maxLineLength=145))
        i += 1
        continue
    if line.startswith('|'):
        raw = []
        while i < len(lines) and lines[i].startswith('|'):
            if not re.match(r'^\|[\s:|\-]+\|$', lines[i]):
                raw.append([cell.strip() for cell in lines[i].strip().strip('|').split('|')])
            i += 1
        count = len(raw[0])
        if count == 6:
            ratios = [0.34, 0.14, 0.16, 0.13, 0.12, 0.11]
        elif count == 5:
            ratios = [0.40, 0.21, 0.14, 0.13, 0.12]
        elif count == 3:
            ratios = [0.40, 0.27, 0.33]
        else:
            ratios = [1 / count] * count
        cells = [[Paragraph(inline(cell), styles['GuideHeader' if row == 0 else 'GuideCell']) for cell in record] for row, record in enumerate(raw)]
        table = LongTable(cells, colWidths=[width*r for r in ratios], repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.HexColor('#16445a')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white,colors.HexColor('#f0f5f7')]),
            ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#cbd9e2')),('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
            ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
        story += [table, Spacer(1,12)]
        continue
    if line.startswith('# '):
        story.append(Paragraph(inline(line[2:]), styles['GuideTitle'])); i += 1; continue
    if line.startswith('## '):
        story.append(Paragraph(inline(line[3:]), styles['GuideH2'])); i += 1; continue
    if re.match(r'^\d+\. ', line) or line.startswith('- '):
        story.append(Paragraph(inline(line), styles['GuideBody'])); i += 1; continue
    paragraph = [line]; i += 1
    while i < len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','```','- ')) and not re.match(r'^\d+\. ',lines[i]):
        paragraph.append(lines[i]); i += 1
    story.append(Paragraph(inline(' '.join(paragraph)), styles['GuideBody']))

def furniture(canvas, doc):
    canvas.setFont('Guide', 7)
    canvas.setFillColor(colors.HexColor('#5a7180'))
    canvas.drawString(32, page_height-20, 'CONTENT PIPELINE  |  Robert and Leigh  |  Verified October 7, 2026')
    canvas.drawString(32, 18, 'Canonical source: n8n/linkedin/' + args.source.name)
    canvas.drawRightString(page_width-32, 18, f'Page {doc.page}')

doc = SimpleDocTemplate(str(out/(stem+'.pdf')), pagesize=(page_width,page_height), rightMargin=32,leftMargin=32,topMargin=36,bottomMargin=34,
    title='Content pipeline folder architecture and operating guide', author='iggii-ai-stack', subject='Folder responsibilities, file lifecycle, review and archive operating guide', invariant=1)
doc.build(story, onFirstPage=furniture,onLaterPages=furniture)
print('Generated offline HTML and PDF from source SHA-256 ' + digest)
