"""Build the pilot landing page and separate notes without rewriting original drafts."""
import argparse
from html import escape
import json
from pathlib import Path

HERE = Path(__file__).parent
STYLE = 'body{font:18px/1.6 system-ui;max-width:950px;margin:36px auto;padding:0 20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd;padding:12px;text-align:left}a,code{overflow-wrap:anywhere}.notice{background:#fff2ce;padding:16px}small{color:#445}'


def page(title, body):
    return f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title><style>{STYLE}</style><main>{body}</main></html>\n'


def render(destination):
    result = json.loads((HERE / 'pilot-results.json').read_text())
    notes = json.loads((HERE / 'pilot-prose-review.json').read_text())
    cleanup_path = HERE / 'pilot-cleanup.json'
    cleanup = json.loads(cleanup_path.read_text()) if cleanup_path.exists() else {}
    cleanup_text = ('Temporary pilot credentials, activation and GPU access are removed; the model is unloaded.'
                    if cleanup.get('gpuAclCleanupConfirmed') else
                    'The model is unloaded and pilot credentials/admission are removed. GPU ACL restoration is awaiting confirmation; the existing 20:51 UTC rollback remains scheduled.')
    rows = ''
    for sample, title, note in zip(result['samples'],
        ['NIST identity reference', 'CISA infrastructure reference'],
        ['Supported dated revision facts; revise the audit-confusion claim and date framing.',
         'Supported dated publication fact; revise current-news framing and the operational-benefit claim. An added PPD-21 detail needs an explicit claim binding.']):
        request = sample['requestId']
        rows += f'<tr><td><a href="{request}.draft.html">{title}</a><br><small>Historical background · needs revision</small></td><td>{note}<br><a href="Review-Notes.html#{request}">Codex review notes</a></td><td>{sample["elapsedSecondsIncludingLoadAndUnload"]:.1f} seconds<br>Complete output</td></tr>'
    start = '<h1>Gemma drafting pilot — 8 October 2026</h1><p class="notice"><strong>Two drafts, both awaiting revision and human approval.</strong> Pilot authorization is recorded. Blind review is not marked complete. Nothing is approved for publishing.</p>'
    start += '<p>Open a draft below. Its evidence section contains the saved public passages, source links and dates. These are historical reference topics, not newly verified news. The five deferred topics were not drafted; no third draft was forced.</p>'
    start += '<table><thead><tr><th>Draft and frozen evidence</th><th>Issues to resolve</th><th>Measured time</th></tr></thead><tbody>' + rows + '</tbody></table>'
    start += '<h2>Review and save your work</h2><ol><li>Read the original draft and expand its evidence sections. Read the separate review notes; they are Codex judgments, not human approval.</li><li>Copy the draft into your editor. Save a separate file in this folder using the request ID and your name, for example <code>20261008-identity-reference.Leigh.edited.docx</code>. Keep the original unchanged.</li><li>Resolve the factual flags, preserve attribution and evidence links, and make the historical framing explicit. Record actual editing minutes and your decision in your own copy of <a href="Review-Record-template.csv">the pilot review record</a>.</li><li>Record any approval separately with reviewer, date and exact edited filename. Review files are human records; automation does not consume them or publish posts.</li></ol>'
    start += f'<h2>Pilot outcome and next decision</h2><p>The single cycle took {result["n8nExecutionSeconds"]:.1f} seconds (8 minutes 13 seconds). Both responses completed, but this does not establish less manual rewriting. Decide whether further bounded manual Gemma drafting is worthwhile after reviewing these drafts and completing the existing blind comparison. Recurring execution remains disabled; production model selection is unchanged.</p><p>{escape(cleanup_text)} Household services, OMC routing, Monday scheduling and disabled publishing were preserved.</p><p><small>This page concerns the authorized pilot. Your existing blind drafts and score sheets have not been changed.</small></p>'
    details = '<h1>Complete-prose review notes</h1><p><a href="START-HERE.html">Back to pilot</a></p><p>Codex judgments against the saved evidence. A mechanical flag is not proof of falsity: supported paraphrases also require review. No new model calls or source retrieval were used to prepare these notes. Original drafts remain unchanged.</p>'
    for sample in notes['samples']:
        request = sample['requestId']
        details += f'<section id="{request}"><h2>{escape(request)}</h2><p><a href="{request}.draft.html">Original draft and evidence</a></p><ol>'
        for item in sample['assertions']:
            refs = ' Evidence: ' + ', '.join(item['evidence']) + '.' if item.get('evidence') else ''
            details += '<li><strong>' + escape(item['judgment'].replace('_', ' ')) + '</strong> — ' + escape(item['reason'] + refs) + '</li>'
        details += '</ol></section>'
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'START-HERE.html').write_text(page('Gemma pilot review', start))
    (destination / 'Review-Notes.html').write_text(page('Gemma pilot prose review', details))
    template = destination / 'Review-Record-template.csv'
    if not template.exists():
        template.write_text('request_id,reviewer,edited_filename,actual_editing_minutes,substantive_corrections,decision,reviewed_at,unresolved_issues\n'
                            '20261008-identity-reference,,,,,,,\n20261008-infrastructure-reference,,,,,,,\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    render(parser.parse_args().output)
