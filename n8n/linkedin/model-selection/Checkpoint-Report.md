# Model comparison checkpoint — 7 October 2026

**Access is repaired. The comparison is incomplete and has no model-selection recommendation yet.**
All 43 baseline calls and the first Qwen call are preserved. The evaluator is stopped
pending a resource-window decision; production services are running unchanged.
PR #20 records the completed quotation fix, protocol, manifests and checkpoint results; the full comparison remains unfinished.

The selected alternatives are **Qwen3.8-27B Q4_K_M** and **Gemma 4 31B IT Q4_0**.
The three-model shortlist, exact weight hashes, historical-tag uncertainty, licensing
and official references are in [Candidate-Selection.md](Candidate-Selection.md).
Neither JEV nor Laya is counted as an alternative writer.

## What is established

- Both weight artifacts passed complete SHA256 verification. The native pinned
  llama.cpp/SYCL runtime built successfully against installed oneAPI 2025.3.2.
- Qwen loaded and processed a 4,440-token prompt at a 16,384-token configured context.
  It generated 3,072 tokens at **4.63 tokens/second**, taking **781.085 seconds**
  end to end, then hit the fixed output budget. This is a runtime feasibility
  measurement and an incomplete response, not a successful reasoning judgment.
- With 32 layers on GPU 0, its peak incremental allocation was **8.44 GiB**;
  GPU 1 remained at its existing allocation. Resource limits were respected.
  Gemma's actual native load, usable context and latency remain unmeasured.
- The current device ACL expires **8 October, 01:53:26 UTC**. Extrapolating the one
  cold Qwen call across 85 remaining calls gives about **18.4 hours**. That is not a
  measured duration: task lengths, prefix caching and Gemma performance differ.
- A read-only check of live OMC configuration confirms that both its intelligence
  models use home-chat. Releasing production memory would affect OMC inference as
  well as household chat. No production container was stopped.

## Baseline observations, not a comparative ranking

| Phase | Saved result | Limit |
|---|---|---|
| Reasoning | 36/36 calls saved; 7 complete schema-valid assessments, all agreeing with corrected gold | 27 output-budget truncations and two other schema/coverage failures. All seven complete answers reject; no demonstrated supported-topic acceptance in this run |
| Ranking | Three randomized orders saved | All three hit the output budget; no completed ranking score |
| Writing | Four full drafts saved, all within 150–220 prose words | Two violate the top-level schema by adding `sources`; none includes the requested URLs in the draft text |
| Listed quotations | 16/16 mechanically match supplied passages under documented normalization | Exact matching does not establish full-prose factual support |
| Privacy | Four responses echo synthetic canaries in returned API content | Includes unseparated reasoning/incomplete responses; no real private transcripts were used or disclosed |
| Human effort | Not measured | Codex sentence reviews and ratings are judgments; Robert/Leigh preference and editing minutes are pending |

The baseline writing review identifies assertions omitted from the writer's claim
lists: an unsupported historical shift in the RMM attack surface; unsupported claims
about absence of immediate mandates; recency/requirement strengthening in isolation
planning; and an unsupported characterization of the 2024 memorandum's legal effect.
These are source-bounded Codex judgments, not legal determinations or independent
human ratings. Full sentence-to-passage records remain outside Git for the eventual
separate answer key. The drafts have not been silently corrected.

These findings show why complete-prose review and output-budget reporting matter.
They do **not** establish that either alternative is better, or that home-chat should
be retained. One incomplete Qwen response cannot support that comparison. The next
step is to finish the unchanged frozen comparison, not tune the prompts on these cases.

## Work already completed

The isolation/logging quotation-contract correction is deployed. Explicitly attributed
paraphrases can use the existing claim-specific authoritative-source exception, while
citation excerpts stay exact and scope/quantity/semantic requirements still apply.
The two saved supported cases pass; twelve adjacent unsafe variants are blocked.
No new model/retrieval calls were used for that gate, and no unrelated acceptance or
calendar tests were repeated. Production models, Monday scheduling and disabled
LinkedIn publishing remain unchanged.

The [resource decision](Resource-Decision.md) provides a prepared **24-hour extension
of the existing device lease**, which preserves service availability, and the exact
scope/rollback plan for an alternative four-hour maintenance window. Neither has
been executed. The shared starting page intentionally has no purported blind
comparison yet: both alternative writers must finish first.

Canonical private checkpoints:
`/home/rigarashi/.local/share/linkedin-model-selection-20261007/frozen`.
Original PR #17–19 evidence/results are unchanged. Evidence and draft contents remain
outside Git; only sanitized metrics and judgments are committed here.
