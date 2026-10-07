# LinkedIn content-quality and model evaluation — October 7, 2026

**Recommendation: retain home-chat. Do not deploy Laya or the tested page-grounded
instruction variant. Repair retrieval and claim validation before changing models.**
Neither alternative demonstrated a safe improvement on this bounded evaluation.
More detailed writing instructions improved structure slightly, but did not reduce
the estimated editing work. Jev remains untested pending credentials and an explicit
existing-account spending limit.

The live production chain, Monday schedule, GPU budgets and disabled LinkedIn posting
were preserved. These are evaluation artifacts, not approved posts or a production
deployment. The shared report and blind review start at:

`\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews\Content-Quality-Evaluation-20261007\README.html`

## What the deployed system actually does

The active enrichment workflow queries Brave news/web APIs and packages **titles and
descriptions**. It does not fetch source-page text. Implemented controls include exact
snippet-fragment matching, supplied-URL membership, source-domain families, lexical
overlap, score sums/caps, watchlist exclusion and source-aware privacy stages. The
separate source-link check establishes reachability, not factual support.

Full-page retrieval, claim-to-passage entailment and evidence-origin independence are
**not implemented controls**. Domain allowlists classify GitHub, Microsoft community
pages and AWS blogs as primary without inspecting authorship or promotional intent.
Distinct domains can repeat one underlying report. Deterministic excerpt repair can
replace a malformed quotation with a lexical window without checking the whole claim.
The retained current output records 14 repaired excerpts and one fallback candidate;
those counts establish processing, not factual verification.

Historical failures were kept separate from model errors:

| History | Evidence and treatment |
| --- | --- |
| v3.2: zero verified topics, five watchlist items | Retained August 17 evaluation artifact confirms these counts; weak/promotional evidence represented in the set |
| v3.4: 240 results, no qualifying primary evidence | Reported project history; exact v3.4 execution was not recovered. Missing-primary and insufficient-evidence cases retained |
| v3.6: classification and endpoint defects | Reported history; exact execution unavailable. Classification defects reproduced against deployed code; old Ollama endpoint is now unreachable |
| Sector/qualifier false positives | Explicit counterfactual cases, scored separately from source acquisition |
| Reachable but non-supporting citations | Ten retained public URLs attempted; eight pages retrieved, two failed. Page text and missing evidence kept distinct |
| Generic prose/manual revision | Separate writing comparison; no inference that a successful research call produces a usable draft |

The active workflows correctly call the local LiteLLM route; the unavailable old
Ollama endpoint is not an active pipeline failure. See [deployment-audit.json](deployment-audit.json).

## Models and eligibility

| Offering | Verified identity and suitability | Outcome |
| --- | --- | --- |
| Baseline home-chat | Local `Qwen/Qwen3.5-35B-A3B`, revision `59d61f3ce65a6d9863b86d2e96597125219dc754`; Apache-2.0, deployed Intel vLLM `sym_int4` | Evaluated without changing production |
| Local decision alternative | `convaiinnovations/laya-typed-decisions`, revision `e929ae5cf69bc34259cd2f95c9e91145b818b1f0`; Apache-2.0, ModernBERT-large, 421M parameters, 1,024-token checkpoint | Evaluated on CPU; cannot write posts or generate claim citations |
| TypeSafe Jev | Official hosted `jev-1.13.0` through `/v1/systemone`; Choice, Score and Noul decisions, not generated prose | Selected second alternative; blocked on key/spend authorization. No calls or charges |

The former `qwen3.8:27b` name is present in both old workflow requests and retained
Ollama trace replies. Official records identify the **Qwen3.8-27B** family; Ollama
uses `qwen35` architecture terminology and a Q4_K_M entry. This is not the current
35B MoE baseline. The old weight digest was not retained, so the historical bytes
cannot be matched cryptographically to today's mutable registry tag. Current local
inventory contains only the served baseline. Qwen3.8 was identified, not selected as
a third alternative: BF16 download is about 55.6 GB; the Ollama entry is about 18 GB,
both requiring runtime/cache headroom beyond weight size. A separate safe serving slot
was not verified and production models could not be displaced.

Laya's 842,609,220-byte checkpoint and CPU runtime were checked before download;
it peaked at **2.726 GiB RSS**, using two threads and lower scheduling priority.
Other local options, including AnyJev, were inspected but not evaluated. AnyJev is a
decision readout/head for an existing LLM, not automatically an independent verifier.

Identity, license, runtime and memory records: [model-preflight.json](model-preflight.json).
Primary references: [Qwen baseline](https://huggingface.co/Qwen/Qwen3.5-35B-A3B),
[Qwen3.8](https://huggingface.co/Qwen/Qwen3.8-27B),
[Ollama entry](https://ollama.com/library/qwen3.8:27b),
[Laya model](https://huggingface.co/convaiinnovations/laya-typed-decisions),
[Laya runtime](https://github.com/NandhaKishorM/laya),
[Jev model/API](https://docs.typesafe.ai/models),
[Jev legal terms](https://docs.typesafe.ai/legal).

## Fixed evidence assessment

The frozen set contains **36 candidates: eight retained-evidence cases and 28 controlled
synthetic variants**, with 10 expected accepts, 18 rejects and eight deferrals.
It covers valid opportunities, unsupported claims, syndication, stale dates, sector
mismatches, promotion, missing pages, private canaries and page instruction injection.
Raw pages, metadata, exact URLs, retrieval timestamps, passages, gold and responses
remain outside Git. Private transcripts were not used. All models received identical
packet data; gold was frozen before inference and withheld from them.

The home-chat baseline uses a snippet-oriented policy adapted to atomic claim assessment.
The second home-chat arm adds explicit page-grounding instructions. This is a controlled
comparison, not a replay of all production n8n stages. Laya uses typed atomic questions
over the same packet. Its truncated responses are runtime defects, not quality evidence.

| Metric | home-chat baseline | home-chat page-grounded instructions | Laya CPU |
| --- | --- | --- | --- |
| Complete, untruncated assessments | 36/36 | 35/36 | 28/36; eight runtime-blocked |
| Correct accept/reject/defer | 24/36 (66.7%) | 22/36 (61.1%) | 9/28 usable (32.1%); 9/36 overall |
| Accuracy on identical 28 complete packets | 57.1% | 53.6% | 32.1% |
| Unsafe accepts among complete cases | 1 | 2 | 15 |
| Supported/not-supported claim labels correct | 28/36 | 27/36 | 17/28 usable |
| Exact page quotations returned | 21/23 | 18/20 | Not applicable: no citation generation |
| Synthetic private-canary echoes | 2 | 4 | 0 strings, but both private topics accepted |
| Median assessment latency | 2.64 s | 2.71 s | 7.05 s including blocked attempts |

Exact quotation matching is a deterministic check, **not proof of entailment**. Gold
claim support, source authority and independence are separate analyst labels. A model
confidence score or same-model review was never counted as independent verification.
One grounded reply was incomplete; it was not repaired or silently retried.

Examples are in the shared blind files, with a separate answer key. They include an
affected-scope qualifier expanded into a universal claim, promotional material carrying
a misleading primary label, and the distinction between exposure and confirmed compromise.
Laya often accepted false qualifications. Both home-chat arms accepted the promotional
trap, and sometimes rejected valid stipulated synthetic scenarios despite explicit
evaluation instructions. No actual private data left the local run store.

## Ranking and writing were evaluated separately

Ranking received the same **10 independently gold-eligible candidates**, rather than
each model's accepted subset. Both home-chat arms put the highest-priority retained
opportunity first. Their initial nDCG@5 was **0.906**. Reversing input order changed
both rankings: baseline scored 1.000, grounded 0.990, with four of five top topics in
common. This is evidence of order sensitivity, not a demonstrated ranking improvement.
Laya scored 0.717 on nine untruncated candidates; it could not score the highest-priority
retained packet. These subjective gold priorities are not publication authority.

Writing used four preselected packets and the same home-chat model in both arms;
decision-only alternatives cannot replace a writer. Scores below are a provisional
passage-based analyst review, **not measured Robert/Leigh editing time**.

| Writing metric | Baseline instructions | More prescriptive instructions |
| --- | --- | --- |
| Factuality, 0–5 | 2.5 | 2.5 |
| Editorial usefulness, 0–5 | 2.0 | 2.5 |
| Style, 0–5 | 1.25 | 1.75 |
| Exact listed claim quotations | 7/9 | 8/11 |
| Drafts with all supplied source URLs | 1/4 | 0/4 |
| Drafts within 150–220 words | 3/4 | 3/4 |
| Minimum correction actions identified | 19 | 21 |
| Median writing latency | 4.28 s | 4.32 s |

Recurring corrections include wrongly attributing third-party telemetry to the writer,
equating an unaffected scope with proven availability, inventing test allocations or
deadlines, confusing release maturity with demonstrated safety, and using weak stop
conditions. More structure did not eliminate unsupported assertions. The raw drafts
remain labeled evaluation outputs and require revision.

## Deployment decision and review

The main constraint is **retrieval plus validation**; writing instructions are a second
constraint. A different decision model cannot recover missing page text or establish
independence from duplicated coverage. Retain the baseline, keep publishing disabled,
and prioritize a separate repair that retrieves pages, binds every material claim to
exact supporting passages, verifies origin/authority and preserves dates and qualifiers.
Missing or inadequate evidence must continue to block or defer a topic; do not lower
thresholds or fill a quota.

For the blind review, open **README.html** in the shared path above. Robert and Leigh
should independently review three writing pairs and three short assessment pairs with
**Evidence.html**, save their own CSV scores and edits in that folder, and record actual
editing minutes. Open **Answer-Key.html** afterwards for identities, expected decisions
and concrete corrections. These are human records; n8n does not consume their approvals.

Limitations: small adversarial set, predominantly synthetic counterfactuals; analyst
gold and style scores await human review; no sustained-load/energy/peak-VRAM measurement;
cooperative queue checks cannot preempt a household request arriving mid-call. Laya's
long-packet coverage failed. Jev needs a secure API key and explicit spend cap; if supplied,
only the unchanged **32 non-privacy packets** are eligible for external evaluation.

Two harness defects were corrected and their outputs excluded: unclear hypothetical-world
handling in the initial pass, and a conflicting ranking response format. Initial responses
remain private; packet/gold hashes never changed. No unrelated model or calendar acceptance
tests were rerun. See [results.json](results.json), [ranking-results.json](ranking-results.json),
[writing-results.json](writing-results.json), [resources.json](resources.json) and
[reproduction instructions](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/n8n/linkedin/evaluation/README.md).
