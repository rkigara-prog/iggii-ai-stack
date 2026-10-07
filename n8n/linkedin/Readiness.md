# Activation readiness — 2026-10-07 UTC

Activation is **not approved and not ready**. The mount fix is prepared and needs
an approved n8n recreation. The real-meeting evaluation demonstrated theme
survival, but did not establish a reliable privacy/usefulness pass. No real-meeting
theme was submitted to Brave. The three migration workflows and the separate
real-meeting evaluation workflow remain inactive.

## Normal UI access

[The exact mount-access proposal](../../ops/n8n/README.md) preserves the running
image, all three mounts and their read-only flags, environment, network, port,
and restart policy. The running container lacks supplementary GID 100 even though
the stored Portainer manifest declares it. Applying the group requires recreating
n8n, briefly interrupting it; no recreation or manifest replacement has occurred.
The stored image pin is stale, so the proposal also pins the currently running
image to avoid an unintended upgrade/downgrade during recreation.

The proposed full manifest passed Compose validation and is stored privately on
Unraid. The secret-free effective settings, normal-user probe workflow and probe
script are in `ops/n8n`. After approval, wait for current executions to finish,
apply only the reviewed manifest, and verify default-user/task-runner access and
original workflow fingerprints. No activation is part of that approval.

## Real-meeting sample

Seventeen recent API transcripts were eligible under the deployed v0.2.2 selector.
Four real meetings were selected using reproducible content-count heuristics:
technical density, mixed technical/engagement content, people/personal terms,
and administrative/lower-technical content. These are sampling strata, not claims
that a meeting is purely personal or administrative. The four sampled transcripts
contained 6,075–13,562 characters each. Sampling did not modify source files.

The evaluation copied those inputs into a separate private directory and ran an
inactive copy of the actual migrated extraction and final privacy-review stages.
This separate copy has ID `IASPrivacyReal01`. The three PR #12 migration copies
were not repointed or edited. No production workflow was executed for the test.

| Sample label | Heuristic stratum | Extracted themes |
| --- | --- | --- |
| S01 | Technical-dense | 6 |
| S02 | Mixed technical/engagement | 6 |
| S03 | People/personal terms | 6 |
| S04 | Administrative/lower-technical | 0 |
| Total | Four real meetings | 18 |

The separate privacy gate retained 16 themes. Deterministic scans found no exact
email/URL/currency identifier carryover or matches to the tested sensitive-topic,
ISO-date and monetary patterns. These checks do not cover every name, disguised
engagement fact or identifying combination.

## Disclosure and usefulness evaluation

A separate local-only skeptical audit considered the raw source, extracted themes,
and final themes. It used the same served model in a distinct call, so it is not
independent-model assurance. Its initial broad allegations were not accepted as
conclusive: one sample's safe/unsafe counts were internally inconsistent. The
audit tooling now rejects inconsistent counts, indexes and incomplete coverage.

A bounded, schema-constrained adjudication required alleged disclosure evidence
to occur literally in both the output theme and a source transcript. It produced:

| Evidence adjudication | Count |
| --- | --- |
| Final themes reviewed | 16 |
| Potential disclosure with matching theme/source excerpts | 1 |
| Findings with invalid excerpts, retained as unresolved | 15 |
| Clear safety approvals established | 0 |

The single quote-grounded potential finding concerns identifiers/private engagement
context. Matching excerpts establish grounding of a finding, not by themselves
proof of disclosure. Invalid quotations are rejected as proof; they are not
counted as fifteen demonstrated leaks. The complete findings, quotes and source
links remain private for contextual review.

Useful themes clearly survived the extraction/gate quantitatively (18 → 16).
However, no reliable judgment that those surviving themes are safe for external
research was established. The local reviewers also alleged missed safe opportunities,
but their disputed findings are not treated as verified utility failures. This
sample therefore does **not** pass activation readiness. Do not infer privacy
preservation from clean literal scans or the earlier synthetic test.

One adjudication response hit its output cap and could not be parsed; it was not
accepted. A bounded JSON schema and complete index/coverage checks fixed the
measurement path. No context limits or inference service capabilities were changed.
The legacy Ollama endpoint refused a read-only residency request, so no comparison
model was loaded or legacy service started. The route used for every real-data call
was verified as local `hosted_vllm/home-chat`, with no home-chat cloud fallback.

## Private artifact handling

Real transcripts, sample identities, themes, execution logs, quotes and detailed
review reasons are outside Git, under the private
`/data/output/ias-linkedin-real-privacy` directory. Inputs and sensitive outputs
have mode 0600 inside a mode-0700 directory. Source transcripts remain on the
existing read-only mount. Review artifacts and logs were persisted there before
any future n8n recreation could discard temporary files.

Only aggregate counts, pseudonymous sample labels, scripts, settings proposals
and operating notes are committed. No credential values or decrypted credential
exports were used. All 28 pre-evaluation workflow definitions/connections/settings
and activation states (25 original plus three migration copies) remain unchanged.
The newly imported evaluation copy is inactive with its schedule disconnected.

## Proposed cutover, after the gates pass

1. Approve and apply the mount-access recreation separately; verify the normal
   user and task runner without activating any migration workflow.
2. Review the private quote-grounded finding and resolve the disputed audit
   findings. Establish a defensible disclosure/utility rubric and address any
   confirmed privacy-stage defect. Re-evaluate only the affected cases plus a
   useful technical control. Clear real themes locally before any web research.
3. Prepare real-input profiles using `prepare-cutover.py`. They read
   `/data/transcripts` using the preserved API-first selector and write exclusively
   to `/data/output/ias-linkedin`. They remain inactive with schedules disconnected;
   they do not point at synthetic fixtures or write production's flat output files.
   Bind the existing dedicated IAS credentials with `bind.py --source-dir ...`.
   These profiles were generated and checked privately but have not been imported.
4. After explicit cutover authorization, install those profiles while inactive.
   Run a controlled real-input cycle: sanitization and local privacy review first,
   then Brave enrichment, then editorial planning. Require a successful current
   cycle and matching source artifact provenance at each handoff. The inherited
   three-day lookback is not a guarantee of a successful current cycle.
5. Seek separate activation approval. Initially replace only the original active
   sanitization schedule: deactivate its workflow (retain its definition), restore
   the IAS sanitization copy's original Monday 07:00 schedule connection, and
   activate that copy. Keep enrichment/planning manual until an approved
   success-dependent handoff is in place; do not activate three independent crons
   that could consume stale artifacts after a failed upstream run. Preserve the
   host's existing timezone and original schedule definitions for rollback.

Rollback after an approved cutover restores the original sanitization activation
state and leaves all IAS copies inactive. Original files/definitions are retained;
outputs are separate. No full-post drafting or publishing is introduced. Webinar
review remains mandatory, and `automaticPublishingAllowed` remains false. OMC,
additional-model deployment, image generation and calendar work remain outside scope.
