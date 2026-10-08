# Authorized manual Gemma drafting pilot — 8 October 2026

One uninterrupted manual n8n cycle completed at **14:55:35 UTC**, producing two
complete, review-only drafts. Both need revision. There were **zero publication
approvals**. The user's authorization is recorded in
[pilot-authorization.json](pilot-authorization.json); it is not completed blind
review or permission for automatic publishing.

Open `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews\Gemma-Pilot\START-HERE.html`.
Each original `.draft.html` includes frozen passages and evidence links; its
`.review.json` retains URLs, publisher, publication date or explicit null, retrieval
time, passage IDs, source judgments, attribution and full-prose flags. Human edits
and approvals are separate records and are not consumed by publication automation.
Public evidence and drafts remain outside Git; Git contains sanitized metrics and
review judgments. Source transcripts, current production outputs and archives were
not changed.

## Measured result

| Result | NIST identity reference | CISA infrastructure reference |
|---|---:|---:|
| Request ID suffix | identity-reference | infrastructure-reference |
| Full worker seconds, including load/unload | 264.243 | 225.793 |
| Prompt / output tokens | 2,435 / 545 | 2,364 / 423 |
| Native output tokens/second | 3.603 | 3.590 |
| Listed claims with exact evidence bindings | 2 | 1 |
| Complete-prose sentences routed to review | 6 | 7 |
| Completion | stop; complete | stop; complete |

Request IDs have prefix `20261008-`. Total n8n wall time was **493.393 seconds**.
The two calls had no budget exhaustion, transport timeout, runtime error, context
truncation or resource-guard cancellation. Both used the existing single-JSON-fence
transport adapter, which preserves the raw response and does not repair its content.
An initial CLI startup failed before inference because port 5679 was occupied by
the production task-runner broker. Setting **only the manual CLI process** to broker
port 5681 fixed it. The successful cycle then made exactly two model calls.

The final access check found that Unraid had assigned generated review files GID
1000 instead of the established contentpipeline GID 1800. Named ACLs did not give
Leigh effective access. The writer now explicitly sets GID 1800 and mode 0640;
the four original files were repaired through the idempotent writer, with hashes
unchanged. Effective read access for Robert and Leigh and write access to the
review directory passed. Originals remain separate from editable human records.

Peak sampled additional GPU0 was **8.679 GiB**, GPU1 growth **6.793 MiB**, and process
RSS **17.210 GiB** (RSS excludes GPU allocations). GPU0 peak power was **98.9 W**.
There were 37 and 31 resource samples; brief spikes may be missed. Available host
RAM was guarded but not persisted per sample. GPU memory returned to baseline after
both models unloaded. Household endpoints remained available; polling is not a
household latency guarantee or a contention benchmark. No production service was
stopped or reallocated.

## Evidence and whole-prose outcome

The saved production candidate cycle had **two eligible and five deferred topics**.
Only the two eligible historical references were drafted. Existing claim-specific
authoritative-statement exceptions were retained: the two NIST pages were not
counted as independent corroboration, and CISA supported an attributed document
statement, not inferred legal obligations. No evidence threshold was relaxed.

Codex reviewed every sentence against the saved packets, separately from exact
binding/schema checks. [pilot-prose-review.json](pilot-prose-review.json) records
all 13 judgments. These are model judgments, not independent verification:

- **NIST:** the July 2025 release and August 2025 supersession facts have support.
  The claim that the date gap can cause audit confusion does not. Present-day
  completeness and announcement chronology also need tighter wording.
- **CISA:** the April 2024 publication fact has support. Current-news framing and
  the operational-stability benefit do not. The PPD-21 replacement detail appears
  in saved passage `s5/p0006`, but Gemma added it outside the approved claim set
  and omitted it from its claim list; bind/review or remove it. Do not misclassify
  that entire detail as fabricated.

The conservative whole-prose check flagged supported paraphrases as well as unsafe
assertions. A flag means human review, not proof of falsity. Mechanical success did
not approve either post. Original drafts remain intact alongside the review notes.

## Artifact, controls and cleanup

The exact PR #21 artifact was hashed before each load:
`google/gemma-4-31B-it`, `gemma-4-31B-it-Q4_0.gguf`, SHA256
`031dc1c5fa9c5a0abbf3c39c5173fb2af65f5ac2dc2a090268561d3c72dcd834`.
[runtime.json](runtime.json) records upstream/conversion revisions and the remaining
quantization-input provenance uncertainty. Runtime: llama.cpp SYCL
`b86d2f07542b29ab099aed34fd6b6d1b2fd4b81c`, oneAPI 2025.3.2, GPU0 24 layers,
context 16,384, four CPU threads, one slot, nice 10; thinking off, temperature 0.8,
top-p 0.95, seed 714919, output cap 2,048. Full packets were retained.

SSH was restricted to the NAS address, forced worker command, expiry and pinned host
key. Private activation allowed only the two packet hashes, with an expiry within
two hours. Automatic key/activation cleanup was scheduled before access was enabled.
The worker unloaded after each request; cleanup removed the key and n8n credential
files, disabled activation and confirmed the loopback listener closed at 14:59 UTC.
The separate existing root-owned GPU ACL rollback and its scheduled verification
were retained. After the user ran that rollback interactively, physical checks at
**15:38 UTC confirmed cleanup**: both render devices retain their original identity,
root:render ownership and mode 0660, with no extended ACL or effective user
read/write access. Pilot credentials are absent, activation is disabled and the
listener remains closed. The scheduled 20:51:03 UTC rollback and 20:52 verification
remain intact as fallbacks. `pilot-cleanup.json` distinguishes this confirmed early
restoration from the unchanged observer's pending future scheduled-expiry status.

The deployed development workflow `AikiRKUpJ52fqZNf` remains inactive, manual-only
and disconnected from production. Read-only comparison confirmed the three
production workflows unchanged. No recurring pilot or publisher was introduced.
The focused preparation/authorization checks and successful live cycle were reused;
no benchmark, unrelated model, calendar or pipeline tests were rerun.

## Decision for ongoing use

The pilot establishes that this artifact can draft with full public evidence under
partial offload without a planned production outage. It **does not establish less
manual rewriting**. Robert and Leigh should record preference, substantive corrections
and actual editing minutes for these drafts and complete their unchanged blind
review before authorizing further manual use. Keep home-chat in production and the
pilot disabled meanwhile. A recurring schedule, production model switch or full-GPU
allocation requires a separate decision.
