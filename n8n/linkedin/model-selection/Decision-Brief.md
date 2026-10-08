# Model-selection decision brief — 8 October 2026

**Provisional recommendation: prefer Gemma 4 31B IT for reviewed writing; consider
it for evidence triage and proposed editorial arguments, with independent approval.**
No arm demonstrated reliable autonomous qualification or stable editorial ranking.
Home-chat remains the fast production service pending Robert and Leigh's review,
not the quality winner by default. Qwen3.8 did not demonstrate an advantage that
justifies an additional deployment for these tasks.

This clarification uses the completed 129 saved calls. There were **no new model
calls, changed labels, replacement answers or changes to the blind review files**.
The [full report](Report.md) and [case-count audit](decision-counts.json) provide
the supporting record. Scores and gold labels are **Codex model judgments**, not
independent verification or human preferences. Actual editing minutes remain unmeasured.

## Exactly what was tested

| Evaluation ID | Upstream model ID | Recorded revision | Quantization / exact evaluated artifact |
|---|---|---|---|
| `home-chat` | `Qwen/Qwen3.5-35B-A3B` | Deployed snapshot `59d61f3ce65a6d9863b86d2e96597125219dc754` | vLLM `sym_int4`; no separate quantized-weight artifact digest was captured |
| `qwen3.8-27b` | `Qwen/Qwen3.8-27B` | Observed upstream `1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0` | Official Ollama Q4_K_M; SHA256 `f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d` |
| `gemma4-31b` | `google/gemma-4-31B-it` | Observed upstream `842da3794eaa0b77d5f08bae87a17459d91ff475`; ggml-org conversion `4fa4fdf38bee237b5c9e8a5b4e72cf39404c9dcc` | Q4_0; SHA256 `031dc1c5fa9c5a0abbf3c39c5173fb2af65f5ac2dc2a090268561d3c72dcd834` |

For both GGUFs, the exact upstream commit used to create the quantization is
**unestablished**; the observed upstream revision is not that proof. The weight
digests identify exactly what ran. [Candidate selection](Candidate-Selection.md)
contains the retained official model-card and registry references.

**Historical `qwen3.8:27b`:** retained records establish use of that tag, but not
its historical digest. This comparison tested the current official Qwen3.8-27B
Q4_K_M artifact for that model family. It was not replaced by Qwen3.5 or Laya;
byte identity with the earlier installation cannot be proved. The current
`qwen3.8:27b-q8_0` resolves to Q8_0, but its historical installation is unestablished
and it was **not tested**. Gemma is the second alternative, not a relabeling of Qwen.

| Runtime setting | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---|---|---|
| Engine | Intel llm-scaler/vLLM `0.26.1.dev0+g568afb3a1.d20260907.xpu` | llama.cpp SYCL | Same llama.cpp SYCL |
| Engine dependencies/revision | PyTorch `2.12.0+xpu`, Transformers `5.8.0` | Commit `b86d2f07542b29ab099aed34fd6b6d1b2fd4b81c`, oneAPI `2025.3.2` | Same commit and oneAPI |
| Configured context | 131,072 | 16,384 | 16,384 |
| GPU placement | Tensor parallel 2 across both B70s | GPU0, 32/64 layers; remainder in system RAM | GPU0, 24/60 layers; remainder in system RAM |
| Concurrency | Service max sequences 2; evaluation sequential | One slot | One slot |
| CPU/batches | Max batched tokens 4,096 | 4 threads / 4 batch threads, nice 10, batch 256 / microbatch 128 | Same |
| Cache/execution | float16 dtype and Mamba SSM cache; block 64, eager mode, GPU utilization 0.55 | split mode none, main GPU0, fit off, no context shift, Jinja, reasoning format deepseek | Same |
| Tool handling | Auto tool choice, parser `qwen3_coder`; no tools supplied by evaluation | No tools supplied; no web UI | Same |

Native servers used loopback port 8017 and `ONEAPI_DEVICE_SELECTOR=level_zero:0`.
All arms used seed **714919**, top_p **0.95**, nonstreaming requests and no JSON
grammar. Assessment: thinking enabled, temperature **0.6**, max output **3,072**.
Ranking: thinking enabled, temperature **0.6**, max output **2,048**.
Writing: thinking disabled, temperature **0.8**, max output **2,048**.
Home-chat's production default is thinking disabled; per-request evaluation settings
did not change it. Native packets were not shortened: all 86 native responses have
saved release records with no context truncation. Advertised context maxima were not tested.

## Completion and correctness are different

Each arm received **36 assessments: 10 accept, 18 reject and 8 defer gold labels**.
The ten eligible IDs represent eight distinct topic texts, with two privacy-context
variant pairs. The following five outcome rows are mutually exclusive and sum to 36.
“Correct” means agreement with the fixed Codex gold, independent of schema compliance.

| Assessment outcome | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Correct accepts | 0 | 0 | 10 |
| Correct blocks, including correct reject/defer routing | 9 | 17 | 18 |
| Unsafe accepts against eligibility gold | 0 | 0 | 5 |
| Reject-versus-defer errors, still blocking acceptance | 0 | 1 | 3 |
| Incomplete: output budget exhausted, no final decision | 27 | 18 | 0 |

Correct blocks break down as **9 reject + 0 defer**, **15 reject + 2 defer** and
**18 reject + 0 defer**, respectively. Qwen R04 defers instead of rejecting;
Gemma S43/S54/S64 reject instead of deferring. These routing errors are distinct
from unsafe acceptance. No completed answer wrongly blocked a gold-eligible case;
home-chat and Qwen left **all ten eligible cases unanswered**.

| Separate diagnostic | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Semantic decision completion | 9/36 (25%) | 18/36 (50%) | 36/36 (100%) |
| Gold-correct decisions across all cases | 9/36 (25%) | 17/36 (47.22%) | 28/36 (77.78%) |
| Gold agreement among completed decisions only | 9/9 (100%) | 17/18 (94.44%) | 28/36 (77.78%) |
| Full response schema passes | 7/36 | 18/36 | 26/36 |
| Schema AND decision agreement | 7/36 | 17/36 | 20/36 |
| Unsupported supplied claims accepted | 0 | 0 | 0 |

The conditional percentages are strongly selected by noncompletion; they do not
make home-chat the safest or most accurate useful assessor. Incomplete responses
are unknown, not correct blocks or zero-quality writing. The old JSON names
`assessment.complete` and `writing.complete` mean **full-schema passes**;
`decisionAccuracyPercent` is the **schema-and-agreement composite** (19.44%,
47.22%, 55.56%), not pure decision correctness. Original results remain unchanged.

The common prompt ambiguously says “a relevant primary source and two independent
eligible origins”; gold means two total including the primary. Saved home-chat and
Qwen reasoning debates two versus three. Fixed thinking budgets, this ambiguity,
quantization and serving differences limit conclusions about underlying model ability.

## The two different groups of five

**Five eligible accepts passing mechanics — Gemma only:** R01, S21, S41, S51, S71.
Gemma accepted all ten gold-eligible IDs; these five also passed full schema, exact
excerpt binding and the final-answer canary check. S11, S31, S34, S44 and S61 failed
the required string `scope_notes` by returning null. This is not five independently
approved topics: S41 still overstates DoS-only scope, R01 needs CVE-specific attribution,
and S51 proposes an unevidenced durability benefit. Exact quotations do not validate
every proposed argument. Home-chat and Qwen had no completed eligible accepts.

**Five unestablished authority exceptions — also Gemma only, different IDs:**

| Case | What the saved answer/evidence shows | Why the accept is counted unsafe against gold |
|---|---|---|
| S13 | Recognizes copied coverage; invokes an official-advisory exception | Packet does not establish an official advisory; also broadens issue-specific scope into “secure” |
| S23 | Recognizes syndication; treats primary quote plus copy as sufficient | Copy supplies no independent corroboration; official authority not established |
| S53 | Marks second origin unknown/unresolved; assumes official guidance | Neither independence nor authoritative-issuer exception established; proposed governance conclusion overreaches |
| S63 | Uses corrected S6A, avoiding unrelated S6B | Research observation is supported, but issuer authority for the exception is unestablished |
| S73 | Uses the single primary study excerpt and bounded sector scope | An exact study quote alone does not establish the claimed authority exception |

All five have **supported supplied facts**, but gold says **defer**, not accept.
S23/S53/S63 even pass schema/excerpt mechanics; S13/S73 also fail null scope fields.
These are qualification failures, not five fabricated supplied claims. Narrow,
attributed facts can legitimately qualify on one authoritative source when that
authority and claim-specific exception are established. The packets' authority
ambiguity limits this comparison; the audit did not change gold or prohibit those exceptions.

## Writing: four drafts per model, none incomplete

All **12 drafts finished**, and **every writing average includes all four drafts
for its model**, including format, schema, length or citation failures. No draft
was discarded, assigned zero for incompletion or replaced. Assessment/ranking
incompletes do not enter these averages. Schema passes were only 2/4, 3/4 and 4/4;
that does not mean only two, three and four drafts were scored.

| Codex complete-prose rating, mean /5 (n=4 per column) | home-chat | Qwen3.8-27B | Gemma 4 31B IT |
|---|---:|---:|---:|
| Factual support | 2.25 | 2.25 | 3.25 |
| Attribution | 3.25 | 3.75 | 4.25 |
| Citation accuracy | 2.75 | 2.75 | 3.25 |
| Useful insight | 2.25 | 2.75 | 3.00 |
| Specificity | 3.00 | 3.00 | 3.25 |
| Readability | 2.75 | 2.50 | 4.00 |
| Low generic filler | 2.00 | 2.00 | 2.75 |

These are **unblinded Codex judgments**, not measured revision effort. Deterministic
URL inclusion was 0/4, 4/4, 4/4; word-range compliance 4/4, 1/4, 3/4. Citation binding
was 16/16, 23/24, 16/16 listed excerpts, **not factual-claim support rates**. Qwen's
one failed binding used a correct metadata publication date without a passage ID.
All twelve drafts still need review. Gemma's NIST draft is the strongest Codex-rated
example; its recovery draft adds unsupported “systemic collapse.” All three CISA
drafts make unsupported legal-status assertions, partly prompted by an unevidenced
legal distinction in the shared brief.

Rankings completed 0/3, 0/3 and 2/3. Gemma's two nDCG@5 scores (0.82, 0.99) use only
those **two completed rankings** and Codex priorities; the incomplete third is not
scored zero. Their top-five overlap is only 2/5. No stable ranking winner is established.

## Role decision and deployment limits

| Role | Provisional choice | Evidence and remaining condition |
|---|---|---|
| Evidence triage / proposed arguments | Gemma, reviewed | 36/36 decisions and 15/16 supported labels correct; five unsafe eligibility accepts and argument overreach prevent autonomous approval |
| Editorial ranking | No winner | Only Gemma completed two orders; large order sensitivity and duplicated topic variants |
| Draft writing | Gemma, subject to blind review | Better Codex ratings across all seven dimensions; all four drafts still need human review; actual editing effort unknown |
| Fast household/production service | Keep current home-chat pending review | Much faster; no production switch authorized by these scores, and this is not a content-quality win |
| Additional Qwen3.8 deployment | Not justified by this batch | Half the assessments incomplete, no accepted eligible opportunities, no completed ranking, three overlong drafts; larger-budget/full-GPU quality remains unmeasured |

Median assessment seconds were **34.716 / 637.621 / 304.856**; writing seconds
**7.990 / 184.611 / 224.065**. Native offload decoded about **4.882 / 3.613 tokens/s**,
using four CPU threads while preserving production GPU allocations. The initial
18.442-hour estimate extrapolated one cold Qwen call across 85 pending calls; that
cohort actually took 10.67 API hours. Offload/resource limits affect deployment speed,
not proof of model quality. No full-GPU or controlled household-latency trial was run.
No model demonstrated a privacy win in the small synthetic challenges.

Open the unchanged blind comparison at `START-HERE.html` in the shared review folder.
Score before opening `Reviewer-Key/Answer-Key.html`; save personal score sheets and
time actual edits. Production models, Monday scheduling and disabled LinkedIn
publishing remain unchanged. The existing root-owned access rollback is scheduled
for **8 October 2026, 20:51:03 UTC**; scheduled status is not execution confirmation.
An unprivileged observer is scheduled at 20:52 UTC to check the restored ACLs and
effective access, then update `Access-Cleanup.txt` and `Access-Cleanup.json` in this
shared review folder. It retries at 20:55/20:58 if needed and removes its own cron
entry after successful confirmation/publication. It does not alter the root rollback.
Until that check runs, cleanup remains pending.
