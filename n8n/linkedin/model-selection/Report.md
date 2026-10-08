# Three-model content comparison — completion report

For the model-selection decision, read the [decision brief](Decision-Brief.md):
exact runtimes, mutually exclusive decision counts, denominators and the two
different groups of five. This clarification reuses all saved results and leaves
the blind review unchanged.

**Completed 8 October 2026: 129 saved calls, with no replacement sampling.**
Gemma 4 31B IT is the provisional choice for reviewed writing and evidence assessment.
It delivers more completed positive assessments and clearer drafts than the other
evaluated bundles. It is not ready for unchecked qualification or reliable automatic
editorial ranking. Production model selection remains unchanged pending Robert and
Leigh's review; actual human editing effort is still unmeasured.

## What was compared

The deployed `home-chat` (Qwen3.5-35B-A3B, sym_int4/vLLM) was compared with
Qwen3.8-27B Q4_K_M and Gemma 4 31B IT Q4_0 using the same frozen packets and
phase instructions. [Candidate selection](Candidate-Selection.md) records exact
artifacts, revisions, official references, licensing and exclusions. JEV and Laya
are not alternative writers in this comparison. Historical Ollama tags do not
establish the digest of previously installed weights.

Each arm received 36 assessment cases, three shuffled orders of ten eligible
reference cases, and four public writing briefs covering recent Microsoft reporting,
evergreen NIST/Canadian Cyber Centre guidance and historical CISA background.
Labels and priorities are **Codex regression judgments**, not held-out human labels.
The writing briefs reuse development-used sources. Full page text, URLs, dates,
passage IDs, raw responses and hashes remain outside Git; gold was not sent to models.
No poor answer was replaced, evidence shortened or prompt tuned during comparison.

## Reasoning and editorial selection

These counts compare completed judgments with the fixed Codex gold. They do not
make the gold independent proof. A completed semantic answer can still fail the
response schema; the two are deliberately reported separately.

| Assessment result | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Completed semantic decisions | 9/36 | 18/36 | 36/36 |
| Decisions agreeing with gold | 9/36 | 17/36 | 28/36 |
| Full response schema passes | 7/36 | 18/36 | 26/36 |
| Claim-support labels agreeing with gold | 9/36 | 18/36 | 35/36 |
| Supported claims correctly identified | 0/16 | 0/16 | 15/16 |
| Unsupported claims correctly identified | 9/20 | 18/20 | 20/20 |
| Gold-eligible reference cases accepted | 0/10 | 0/10 | 10/10 |
| Eligible accepts also passing schema/excerpt mechanics | 0/10 | 0/10 | 5/10 |
| Unsupported supplied claims accepted | 0 | 0 | 0 |
| Acceptances against evidence-eligibility gold | 0 | 0 | 5 |
| Harmless reject/defer disagreements | 0 | 1 | 3 |
| Assessment answers exhausted output budget | 27/36 | 18/36 | 0/36 |

Gemma completed every assessment and accepted all ten eligible reference cases,
including the retained public NetScaler case R01. The other arms' zero unsafe accepts
are not equivalent useful safety: neither delivered an accepted opportunity within
this budget. Qwen correctly identified eighteen unsupported claims, including
exposure-versus-breach, sector, release-maturity and guarantee failures.

Gemma's five eligibility disagreements are **S13, S23, S53, S63 and S73**. The supplied
claims have passage support, but the model accepts single-origin evidence without
establishing the required authoritative-source exception. It recognizes syndicated
origins in S13/S23 and unresolved independence in S53; recognition does not reliably
control its final decision. In S63 it cites the corrected S6A passage, avoiding the
irrelevant funding page. Three of these acceptances pass schema/excerpt mechanics,
showing why those mechanics cannot replace eligibility checks. These are not five
fabricated supplied claims. The issuer-authority ambiguity discussed below also limits
how strongly these cases distinguish model quality; gold remains unchanged.

S43 is a different error: Gemma correctly detects promotion behind a misleading
primary label and cites the repaired S4B mapping, but conflates insufficient
corroboration with no passage support. Its reject-versus-defer decision is safe routing,
while its support label differs from gold. S54/S64 correctly block missing or
irrelevant page evidence but reject where the contract calls for recoverable deferral.
Ten Gemma assessments fail the full schema, commonly because required strings are null;
those values were not repaired.

Proposed arguments also need review. Gemma S41/S44 strengthen “RCE not demonstrated”
into a DoS-only risk claim; S13 broadens “unaffected by this issue” into “secure”; S53
asserts governance sufficiency beyond the guidance. R01 needs attribution kept specific
to each CVE. Conversely, S71 preserves the legal-services limitation and develops a
bounded argument about evidence origins; S11/S21/S31/S61 preserve useful scope and
uncertainty. These are **Codex argument judgments**, separate from supplied-claim scores.

Ranking completion was **0/3 home-chat, 0/3 Qwen and 2/3 Gemma**. All missing rankings
exhausted the output budget; they are not assigned invented rankings or zero quality
scores. Gemma's nDCG@5 scores against Codex priorities were **0.82 and 0.99**, but its
two top-five lists shared only **2/5 entries**. Both put R01 first; one then favored
governance/methodology, the other incident scoping. This is limited, order-sensitive
evidence, not a reliable ranking winner. The ten IDs contain eight distinct topic
texts, including two privacy-context variant pairs; these scores do not establish a
diverse real editorial calendar or human usefulness.

## Writing

All twelve unedited drafts are available for blind review. The following means are
**unblinded Codex judgments on complete prose**, on a 0–5 scale. Every sentence was
reviewed against the frozen evidence, including assertions absent from a writer's
claim list. These are neither independent human ratings nor measured editing effort.
Each mean includes **all four drafts per model** (twelve total), including schema
or formatting failures. No writing response was incomplete; incomplete assessment
and ranking outputs do not affect these writing averages. The saved JSON field
`writing.complete` counts schema passes, not completed prose.

| Dimension | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Factual support | 2.25 | 2.25 | 3.25 |
| Attribution | 3.25 | 3.75 | 4.25 |
| Citation accuracy | 2.75 | 2.75 | 3.25 |
| Useful insight | 2.25 | 2.75 | 3.00 |
| Specificity | 3.00 | 3.00 | 3.25 |
| Readability | 2.75 | 2.50 | 4.00 |
| Low generic filler | 2.00 | 2.00 | 2.75 |

| Deterministic writing check | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Completed drafts | 4/4 | 4/4 | 4/4 |
| Full schema after common presentation adapter | 2/4 | 3/4 | 4/4 |
| Within 150–220 words | 4/4 | 1/4 | 3/4 |
| Required source URL inside draft | 0/4 | 4/4 | 4/4 |
| Listed citations matching normalized exact page passages | 16/16 | 23/24 | 16/16 |
| Median call seconds | 7.990 | 184.611 | 224.065 |

Home-chat put URLs in an extra `sources` field in two cases; those URLs are absent
from the draft itself. Qwen's one failed passage binding is a correct publication
metadata date with a null passage ID: a contract limitation, not a fabricated date.
Gemma's whole-message JSON fences are unwrapped by the common adapter while strict
JSON nonconformance remains recorded. Exact excerpts alone do not verify the prose.

Gemma's NIST draft is the strongest prose example, with a minor duration-rounding
issue. Its recovery draft retains the three-month and last-resort qualifiers but adds
an unsupported “systemic collapse” opening. Qwen is more specific in places, but three
drafts are too long and its CISA draft mistakes retrieval year for publication year.
Home-chat adds unsupported exclusions/outcomes and strengthens “should” to “must.”

All three CISA drafts make unsupported legal-status assertions. The common brief asks
for a distinction between recommendations and legal requirements without evidence of
legal effect: an instruction gap contributes alongside model failures. No invented
first-person experience was found, but all twelve drafts still need human review.

Privacy is not a demonstrated strength of any arm. Across seven synthetic-canary
challenge requests each, returned API content echoed markers **5 times for home-chat,
2 for Qwen and 2 for Gemma**. Complete final task objects echoed them 1, 2 and 2 times,
respectively; completed challenge answers numbered 1, 2 and 6, so these are not directly
comparable privacy-success rates. No real transcripts were used. Public-only writing
briefs were not privacy stress tests; exact-marker absence is not a complete audit.

## Runtime and deployment limits

| Measured deployment result | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Median assessment seconds | 34.716 | 637.621 | 304.856 |
| Native median decode tokens/second | Not separately measured | 4.882 | 3.613 |
| Total API-call hours, 43 saved calls | 0.357 | 6.581 | 4.305 |
| Output tokens, including thinking | 112,396 | 104,086 | 43,451 |
| Peak additional GPU0 GiB | Existing production allocation | 8.455 | 8.728 |
| Peak native process RSS GiB | Not sampled | 17.634 | 22.705 |

The 85 calls pending at the original forecast ultimately used **10.67 hours of API
call time**. The resume controller ran **21:08 UTC on 7 October to 07:39 UTC on
8 October (10.52 hours)**, after two Qwen assessment checkpoints had already completed.
Call time, controller wall time and setup/download time are different measurements.
All earlier responses were reused.

The initial **18.442-hour projection = 85 remaining calls × 781.085 seconds** from
one cold Qwen call, which decoded at 4.631 tokens/second. It was an extrapolation,
not measured total runtime. Later estimates separately used remaining output budgets
and measured throughput; prefill, reload and queue overhead were additional.

Both alternatives use partial GPU0 offload plus system RAM, four lower-priority CPU
threads and a 16,384-token context: Qwen offloads 32/64 layers, Gemma 24/60. Qwen used
about four CPU cores in one observation. This conservative deployment limits speed;
full-GPU and higher-thread performance are unmeasured. Different architecture,
quantization and runtimes also make this a deployment-bundle comparison, not a pure
architecture experiment. Slow offloaded execution is not itself poor reasoning.

Longer packets also cost more: Gemma's first ranking processed all **9,019 prompt
tokens** in 330.406 seconds, then generated 2,048 tokens in 750.089 seconds
(2.729 tokens/second), without a final ranking. Gemma used fewer output tokens overall
than Qwen and completed more judgments despite slower decoding. No household-wait
messages were recorded in the resume logs, and both observational CPU-pressure samples
were zero; those observations are not a controlled contention experiment.

The extended device-access lease expires at 20:51:03 UTC on 8 October; its root-owned
rollback timer remains configured, with evaluator shutdown one minute earlier.
Device rights were verified after the original six-hour expiry. No Docker/sudo
rights, production allocation settings, model selection, Monday schedule or publishing state
were changed. Household idle checks and memory guards are cooperative protections,
not a measured household latency guarantee. OMC retains its home-chat endpoint.

At completion the isolated server had stopped, home-chat health and ComfyUI queue
endpoints returned HTTP 200, and rollback remained armed. Its execution was not
triggered early or claimed as observed. Full-GPU performance, the production
131,072-token context and end-to-end OMC latency were not tested. All packets fit
unchanged: maximum prompt tokens were 8,715/8,753/9,019, respectively; all 86 native
release records reported no context truncation. Output-budget truncation is separate.

## Interpretation limits and next decision

Prefer **Gemma as the next reviewed content-assessment and writing candidate**, using
queued batch execution if its measured latency is acceptable. Retain deterministic
schema/excerpt/source-policy gates and complete-prose human review; do not let the
same model approve its own claims. Ten semantic eligible accepts became only five
passes through response/excerpt mechanics, and even valid excerpts did not establish
authority exceptions. There is no demonstrated advantage here that justifies adding
Qwen3.8 for these roles. Home-chat is much faster, but this comparison does not support
calling it the best content model.

Before any production choice, Robert and Leigh should compare the blind drafts and
measure actual editing minutes. Resolve the source-authority and counting ambiguities
below, plus required-field conformance, before treating a model's accept decision as
operational qualification. Ranking stability remains unresolved. No production
replacement, additional model runs, paid calls or broader infrastructure changes
are part of this completed batch.

The frozen reasoning prompt says “a relevant primary source and two independent
eligible origins,” while gold intends **two origins total, including the primary**.
Saved home-chat and Qwen S41 reasoning explicitly debates two versus three before
truncation. This common ambiguity and the fixed thinking-token budget limit what
noncompletion says about underlying reasoning ability. No unfinished thinking is
treated as a final decision. The next protocol should clarify the count; this run preserves prompt and gold.

For S13/S23/S53/S63/S73, narrow attributed advisory, guidance or research facts could qualify for an
authoritative single-source exception **if issuer authority were established**.
The synthetic packets do not establish that authority explicitly. Keep this
qualification boundary visible rather than treating every eligibility disagreement
as an unsupported factual claim. Corrected S43/S63 labels remain unchanged.

Home-chat's evaluation enables thinking for assessment/ranking; production defaults
to thinking disabled. Results therefore do not directly measure the current
production prompt's performance. Neither larger reasoning budgets nor full-GPU
alternatives were tested. Human preference and actual editing minutes remain
unmeasured. Source and privacy judgments still require review; a same-model check
or confidence score is not independent verification.

## Robert and Leigh's review

Open `START-HERE.html` in:

`\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews\Model-Comparison-20261007`

Read each topic's three anonymous drafts and linked frozen evidence before opening
`Reviewer-Key/Answer-Key.html`. Save a personal copy of `Score-Sheet.csv` as
`Robert-review.csv` or `Leigh-review.csv`. To measure editing effort fairly, choose
one topic and edit all three drafts to the same publication-ready standard, timing
each separately. Leave minutes blank when only reading or rating. Save edits with
the draft label and your name. These review files are human records, not automation
inputs; nothing here enables LinkedIn publishing.

The shared `Report.html` mirrors this report. Technical code, manifests and sanitized
results are in this repository; raw answers, source text, private markers and
sentence-level evidence reviews stay outside Git. Original checkpoint results are
preserved separately.

Validation artifacts: [scored results](results.json), [frozen-response verification](final-verification.json),
[runtime measurements](runtime-results.json), [Codex writing ratings](writing-judgments.json)
and [protocol](Protocol.md). All 129 request/input hashes, budgets and checkpoints were
checked without inference; all twelve drafts and fifteen accepted arguments have
Codex review records outside Git. The saved quotation-contract acceptance results
were reused. No unrelated model, pipeline or calendar tests were rerun.
