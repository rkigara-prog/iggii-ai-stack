# Model selection after PR #19

This directory holds code, immutable input hashes, model manifests, sanitized metrics
and the comparison reports. **Evidence packets, private canaries, raw responses,
source-page text and blind draft contents stay outside Git.** No production model
replacement or automatic publishing is part of this milestone.

- [Checkpoint report](Checkpoint-Report.md) and [resource decision](Resource-Decision.md): current coverage and the remaining access-window decision. No model recommendation yet; PR #20 completes the repair/setup checkpoint, with comparison results to follow.
- [Candidate selection](Candidate-Selection.md): exact artifacts, official references,
  historical tag uncertainty and resource tradeoffs.
- [Frozen protocol](Protocol.md) and [review rubric](Review-Rubric.md): what was compared,
  what is deterministic, what is a Codex judgment and what awaits human review.
- `freeze.json`: hashes of the reused corrected regression evidence and new fixed
  public writing briefs. It contains no evidence text or expected answers.
- `quotation-contract-results.json`: the two saved isolation/logging cases and their
  adjacent unsafe variants; no new retrieval/model calls or unrelated acceptance tests.
- `response.schema.json` / `score.py`: output schema, packet-dependent coverage,
  passage-reference checks and deterministic metrics. Exact excerpts do not prove meaning.

Private workspace on iggy-ai:
`/home/rigarashi/.local/share/linkedin-model-selection-20261007` (0700).
The original PR #17–19 evidence and results remain unchanged in their existing roots.

## Reproduction and recovery

`prepare.py --root PRIVATE/frozen` creates inputs only if no freeze exists. It reuses
the retained corrected gold and source snapshots; it does not fetch pages. Do not run
it over a completed freeze. `prompts.py` is hash-locked after freezing. Every response
stores hashes of the actual system prompt and packet; gold is never sent to models.

`download_models.py --models models.json --output PRIVATE/models` downloads only the two manifest artifacts, with
bounded bandwidth and full SHA256 verification. Downloads are not production installs.
The native server uses the pinned llama.cpp revision and installed Intel oneAPI.

`run.py --root PRIVATE/frozen --arm home-chat --base http://192.168.113.32:8000
--model home-chat --auth-file EXISTING_PRIVATE_AUTH` runs the baseline serially. The
auth file is read locally and never copied to Git or displayed. Existing response
checkpoints are not repeated, including incomplete answers. `--phase` can resume a
phase without overwriting prior files; it is not authorization to select favorable cases.

Source `/opt/intel/oneapi/setvars.sh` before invoking `isolated.py --root PRIVATE
--arm qwen3.8-27b` or `--arm gemma4-31b`. Set `EVALUATION_ACCESS_DEADLINE` to the
approved temporary-access expiry minus a shutdown margin (Unix seconds). The wrapper
waits for the comparison lock and household idle state, binds GPU 0 and loopback,
enforces resource headroom, saves metadata, and terminates only its own server.
Do not launch both wrappers together. Use the saved runtime record/log to diagnose
failure; do not silently rerun a failed model response.

`score.py --root PRIVATE/frozen --output results.json` reparses saved responses without
model calls. It separates untagged reasoning preambles using one terminal JSON object
and reports strict JSON nonconformance; no evidence or model judgment is repaired.
Incomplete coverage is explicit. Subjective prose review is a separate record, with
claim-to-passage judgments and unresolved assertions retained outside Git.

`blind.py --root PRIVATE/frozen --output PRIVATE/shared-review` requires complete
writing responses for all three arms. It creates escaped static HTML and a blank CSV
score sheet, with topic-specific shuffled identities in a separate answer key. Only
reviewed public-source material may be copied into the shared Reviews location.
Review files remain human records and do not drive n8n or publishing.

## Access and operational boundaries

`prepare-evaluation-access.py` defaults to inspection. Its interactive root-only
mode snapshots metadata and applies temporary named-user render-device ACLs with a
root-owned rollback timer. It does not grant Docker socket access or change sudoers.
Credentials are never requested, recorded or sent to a service.

The quotation/paraphrase contract correction was deployed with the established
native n8n API procedure in `../evidence/deploy.cjs`. It leaves schedule nodes,
sanitizer, service routing and disabled publishing unchanged. The focused checks
reuse saved PR #19 cases; a new production cycle is not needed for this comparison.

Repository push-to-main CI restarts the household Docker stack. Follow the established
`[skip ci]` commit/merge convention for these evaluation artifacts, while completing
focused local checks and checking PR mergeability. Do not trigger that unrelated
restart to manufacture a green evaluation check.
