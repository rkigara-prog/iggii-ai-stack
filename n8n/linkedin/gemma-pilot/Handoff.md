# Gemma pilot handoff

**The authorized manual pilot completed on 8 October 2026: two complete drafts in
8 minutes 13 seconds. Both require revisions and human approval.** Open:

`\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews\Gemma-Pilot\START-HERE.html`

The page links the original drafts, frozen public evidence and separate Codex
review notes. No third draft was forced: the retained cycle had two eligible topics
and five deferred topics. The authorization permitted a bounded pilot; it did not
record Robert and Leigh's blind review as complete or authorize publication.

The exact PR #21 Gemma artifact was used with 24 GPU0 layers, full evidence,
16,384 context and four CPU threads. Peak additional GPU0 memory was 8.679 GiB;
peak process RSS was 17.210 GiB. Production models, OMC routing, Monday scheduling
and publishing settings were unchanged. The imported manual workflow is inactive;
its temporary key and activation were removed/disabled after the run. GPU ACL
restoration was physically confirmed at 15:38 UTC after the user ran the existing
rollback. Both render devices have their original permissions and no temporary
user access. The 20:51 UTC rollback and 20:52 verification remain as fallbacks.
See `pilot-cleanup.json`.

**Content outcome:** NIST's dated revision facts were supported, but the draft
added an unsupported audit-confusion claim. CISA's dated publication fact was
supported, but the draft used current-news framing and an unsupported operational
benefit. Its additional PPD-21 detail has support in the saved page but was outside
the approved claim set. All these issues remain visible for human review; originals
have not been silently rewritten.

**Next decision:** Robert and Leigh should review the drafts and record actual
editing minutes before deciding whether to authorize further manual Gemma drafting.
This pilot does not establish reduced rewriting, justify a recurring schedule, or
authorize changing the production model. Blind comparison materials are unchanged.

See [Pilot-Report.md](Pilot-Report.md), [pilot-results.json](pilot-results.json) and
[pilot-prose-review.json](pilot-prose-review.json) for results and limitations;
[Runbook.md](Runbook.md) covers routing and rollback. The saved assessment failure
diagnosis remains in [incomplete-audit.json](incomplete-audit.json): home-chat's 27
and Qwen's 18 incomplete assessments exhausted their 3,072-token output budgets;
they were not transport timeouts. No benchmark was rerun.
