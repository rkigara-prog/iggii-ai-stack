# Content evidence-quality repair — October 7, 2026

The repair is deployed. Source pages now precede final evidence assessment; claims
must bind to retrieved passages; source eligibility and corroboration are enforced
in code. Semantic support and origin classifications remain fallible home-chat
judgments. No automatic publishing or production post-drafting stage was added.

Subsequent parser, extraction and qualification repairs are documented in [Evidence-Completion.html](Evidence-Completion.html). This report preserves the PR #18 result and links to its original archive.

## Result to review

Start at `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\CURRENT.md`.
The controlled cycle completed at **2026-10-07 17:27:45 UTC**. Its five output files
were copied and checksum-verified in the existing archive. The previous archive's
six files, including its manifest, remain byte-for-byte unchanged.

- [Editorial plan](../Archive/ias-linkedin/2026-10-07-fc22ada0a35725373abe9ef48be2b579ae6b0c24fbdd82c5e92044514489bed0/linkedin-editorial-plan-model-eval-2026-10-07.md): **zero selected topics**; five deferred research topics. This is a completed evidence-limited plan, not approval to draft.
- [Research brief](../Archive/ias-linkedin/2026-10-07-fc22ada0a35725373abe9ef48be2b579ae6b0c24fbdd82c5e92044514489bed0/content-brief-model-eval-2026-10-07.md): claims, exact source URLs, passage IDs, model judgments and blocking reasons.
- [Machine evidence record](../Archive/ias-linkedin/2026-10-07-fc22ada0a35725373abe9ef48be2b579ae6b0c24fbdd82c5e92044514489bed0/content-candidates-model-eval-2026-10-07.json): retained page passages, retrieval metadata, source judgments and all claim-check results.
- Save source review, corrections and editorial decisions in **Reviews**, identifying this cycle. These records are not consumed by automation.

The cycle attempted **18 public URLs: 13 usable pages, five unavailable**. All five
candidate groups deferred. Blocking reasons included missing/invalid passage bindings,
unbound quantities, missing eligible primary evidence and unresolved corroboration.
No evidence fragments were replaced lexically, and no fallback topic was manufactured.

The earlier completed cycle had one accepted candidate and five watchlist items.
These are different cycles and candidate sets: the count difference is **not** a
controlled measure of recall, precision or writing quality.

## Before and after

| Before | Deployed behavior |
| --- | --- |
| Search titles/descriptions treated as evidence | Bounded public-page retrieval; immutable HTML/text snapshots, timestamps, URLs and passage IDs |
| Exact snippet fragments and lexical repair | Exact passage bindings; missing bindings defer; no lexical substitution or fallback acceptance |
| Source domains counted as independent origins | Eligible roles, page-bound origin bases and distinct origins required; unknown independence defers |
| Model could label news reporting as primary | Code limits primary eligibility to an explicit vetted host set plus origin/basis checks; no model-only elevation of news sites |
| Implicit two-source rule with no narrow exception | Two eligible origins by default; exact attributed official-document/release statements have a documented narrow exception |
| Writer's listed claims used as coverage | Existing evaluation writing checks every prose sentence; unmatched assertions go to human review |
| Empty acceptance stopped the handoff | Completed zero-topic plans can archive normally while retaining deferral reasons |

See the [policy and limitations](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/n8n/linkedin/evidence/README.md).
Primary-host eligibility is conservative; unlisted authorities need explicit review.
Even a vetted domain does not establish truth or independence. Model judgments can
still be wrong and must not be described as independent verification.

## Validation and recovery disclosure

The final focused gate passed **15 policy/coverage cases**, including three valid
acceptances: bounded two-source scope, exposure with uncertainty preserved, and a
narrow attributed authoritative statement. Twelve unsafe/unresolved cases were
blocked, including news self-classified as primary, unknown origins, syndication,
promotion, unavailable pages, invalid passage IDs and exaggerated scope/quantities.
Complete-prose coverage caught an assertion omitted from the writer's claim list.
These are regression fixtures with stipulated judgments, not semantic-model accuracy
measurements. Required checks were repeated only to correct observed integration defects.

The single controlled cycle required recovery: after privacy approval, search and
retrieval, n8n rejected braces in the final prompt's embedded schema. The prompt is
now encoded safely and checked with n8n's expression evaluator. No final assessment
model call occurred before that parser failure.

The failed child execution did not retain its exact shortlist. The continuation reused
the same retrieved pages, grouped by their original source-ID order, and completed
final assessment, planning and archival. Privacy processing, search and retrieval
were not repeated. This is **a recovered cycle, not proof of an uninterrupted run**.
Future retrievals now save an exact packet checkpoint for recovery.

The saved final assessment exposed model misclassification of news as primary. The
additional primary-host guard was deployed and checked against the same saved response:
zero accepts/five deferrals remained, with no new model calls. Original completed
artifacts were not rewritten. No further optional model tests were run.

## Evaluation corrections

Original packets, gold, freeze and model responses remain private and unchanged.
Original result metrics remain in Git; the original writing score record is also
preserved separately. Revised results are labeled **regression results on inspected
cases**, never held-out evaluation.

- S43: removed the promotional source from allowed supporting sources; the technical reporting source remains. Candidate decision stays defer.
- S63: marked the primary passage as supporting the claim while leaving the unrelated second source ineligible. Candidate decision stays defer.
- Topic decision totals are unchanged. Claim-label agreement changes from 28→27 for baseline, 27→26 for grounded instructions, and 17→18 for Laya.
- Correction counts, gold labels and subjective writing/ranking scores are explicitly **Codex judgments**. They are not independent human ratings or measured editing effort.
- All eight saved drafts received complete-prose coverage records without new model calls. Unmatched paraphrases and recommendations are review flags, not automatic findings of falsity.

[Revised regression results](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/n8n/linkedin/evaluation/revised-regression-results.json)
and [corrected evaluation report](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/n8n/linkedin/evaluation/Report.md).
**Human editing effort and alternative-writer quality remain unmeasured.**

## Remaining review and operating limits

Robert and Leigh should resolve source authority/origin, full claim meaning, dates,
quantities and applicability before promoting a deferred item. Some retrieved text
was not accepted because the model did not provide qualifying bindings or use the
narrow exception. Do not treat deferral as proof that a source contains no useful facts.
This milestone establishes stricter controls, not a measured reduction in editing time.

HTML retrieval has size/time limits; PDFs, blocked pages and ambiguous extraction can
defer. Models receive bounded passages with omission counts, while full text remains
in `Evidence`. Publication metadata is retained when available, not assumed correct.
Public source snapshots are retained indefinitely; successful cache entries may be
reused for 24 hours. Full-page caches are separate from the five-file archive; selected
passages and judgments are embedded in the archived candidate JSON.

Home-chat, household service settings, Monday 07:00 America/New_York scheduling and
disabled LinkedIn publishing remain intact. Private transcripts, OMC identities and
existing archives were not reorganized or deleted. No Jev or other paid model calls
were made; only the existing pipeline's authorized search services were used.
