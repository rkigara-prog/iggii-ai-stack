# Frozen model comparison protocol

This comparison follows PR #19. It changes neither production models nor scheduling.
JEV is a possible narrow routing/classification component, not a writer or a substantive
reasoner. Laya and JEV do not fill either alternative-model slot.

## Inputs and separation

- Reasoning: reuse the corrected 36-case set and S43/S63 gold. Add stable passage IDs without rewriting the saved text. These are **regression cases**, not held-out results.
- Ranking: use the same ten gold-eligible opportunities for every model, independent of model acceptance. Three fixed random permutations test order sensitivity. Gold priorities and eligibility are not sent to models.
- Writing: four new fixed briefs use saved public Microsoft, NIST, Canadian Cyber Centre and CISA pages. The set includes recent reporting, evergreen guidance and historical background. All writers receive identical approved facts, passages, dates, audience and editorial argument. Source judgments and fact approval are Codex judgments, pending human review.
- The two isolation/logging contract cases are development checks, not held-out evaluation. No prompt or scoring tuning on completed comparison responses. Original PR #17–19 artifacts stay unchanged. The frozen comparison is small and deliberately bounded; no population-level quality estimate is claimed.

Exact input, gold, full-source and prompt hashes are in the private freeze. Response records include input and system-prompt hashes. The runner loads gold only for hash integrity; it never inserts gold or an answer key into a request. It actually sends only the relevant packet and common phase prompt.

## Model conditions

The same common phase instructions and output budget apply to all three models.
Reasoning/ranking request thinking mode; writing disables it. Home-chat's evaluation
request can enable thinking without changing its production default (disabled).
This baseline is the installed model given the same reasoning opportunity, not a replay
of the older snippet-oriented prompt. Temperature is 0.6 for assessment/ranking and
0.8 for writing, top-p 0.95, with fixed seed 714919. Seeds do not guarantee identical
sampling across different runtimes. Budgets are 3,072 output tokens for assessment and
2,048 for ranking/writing. Reasoning tokens count toward these budgets. Truncation is
recorded as a runtime/budget failure, never repaired into a scored complete answer.

Responses are not constrained by provider-specific JSON grammars. Code validates the
resulting JSON and exact evidence references. Explicit thinking channels are separated for parsing. The first baseline response
exposed an untagged reasoning preamble from the installed serving stack; the common
adapter can extract one complete terminal task JSON object, while separately counting
non-JSON preambles as transport/schema nonconformance. Original replies and initial
parse errors remain unchanged; saved replies are reparsed without model calls. No
factual content or malformed JSON is repaired. This transport correction is not
prompt/scoring tuning and is applied identically to every arm.
No retry silently replaces a weak response. A transport/runtime failure stops the arm
with its checkpoint intact. All model calls stay on fixed local endpoints.

Alternative weights/runtimes are deployment bundles: Q4_K_M/Q4_0 and native llama.cpp
are not numerically identical to home-chat's sym_int4/vLLM. Report that confound. All
packets must fit the evaluation context without truncation. Native advertised maximum
context is distinct from the usable context established in the local runtime.

## Scoring

Deterministic checks: schema validity/completeness, expected IDs and rank coverage,
exact source URLs, passage IDs and contiguous quotations, word counts, canary echoes,
input-hash equality, finish status, tokens, latency and sampled memory/power/utilization.
An exact quotation does not prove claim support. Missing unsupported assertions from
a model's claim list must not escape full-prose review.

Reasoning: report accept/reject/defer agreement, claim-label accuracy, allowed-source
agreement, unsafe accepts (accept against reject/defer gold) separately from harmless
reject-versus-defer disagreements and false negative opportunities. Authority, relevance,
independence, scope and editorial argument quality are judged against retained evidence,
with representative case-level explanations. Ranking nDCG uses the existing subjective
Codex priorities; report ranking overlap/order sensitivity and identify its limits.

Writing: review every sentence against the shared approved facts and linked passages,
including omitted claims. Score factual support, attribution, citation accuracy, useful
insight, specificity, readability and lack of generic filler on 0–5 anchored scales.
Separate deterministic failures, **Codex judgments**, and Robert/Leigh's later ratings.
No same-model review is independent validation. Unsupported source claims, unattributed
telemetry, invented experience/outcomes and invented mandates are serious defects.
Recommendations may be useful without being factual source claims when clearly labeled.

Human preference and actual editing minutes remain unmeasured until Robert/Leigh fill
in the blind score sheet. Do not convert model/Codex correction estimates to measured
editing time. Blind labels vary by topic; identities and the claim-to-source key are
separate from everyday review pages.

## Resource envelope and recommendation

Calls are serial, queue behind home-chat/ComfyUI activity, and leave a three-second gap.
Use only GPU 0 for alternative partial offload, 32 layers for Qwen and 24 for Gemma (chosen before candidate inference from weight size and headroom); GPU 1 remains free
for the existing household allocation. Measure actual allocation before scoring; stop
an isolated evaluator if its additional GPU allocation exceeds 10 GiB, free GPU0 memory
falls below 3 GiB, or host available memory falls below 32 GiB. Native CPU work uses four
threads and lower scheduling priority. Full-GPU maintenance requires an explicit user
decision if partial offload is not viable. Do not silently substitute a weak CPU model.
Queue checks are cooperative, not a hard guarantee against a household request arriving
mid-call. Report actual deployment latency and resource use; do not extrapolate partial
offload numbers into a claimed full-GPU speed.

Recommend roles only after comparing all completed arms. A candidate must show useful
writing or reasoning gains without hiding unsafe acceptance or missing coverage. Report
incomplete/blocked arms rather than defaulting to retaining home-chat. Any recommendation
is provisional until blind human review; no production replacement occurs here.
