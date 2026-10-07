# Activation readiness — 2026-10-07 UTC

Activation is **not approved**. The mount fix is complete. The repaired privacy
stages passed a focused local-only check on the existing four-meeting sample:
one useful, source-grounded educational theme survived, with no disclosure or
ambiguous findings in the separate audit. All migration/evaluation workflows
remain inactive. No real theme was sent to Brave. This small same-model check
does not establish independent assurance or approve production cutover.

## Normal UI access

[The applied mount-access fix](../../ops/n8n/README.md) added supplementary GID 100
while preserving UID/GID 1000, the exact running image ID, all three mounts and
read-only flags, environment values, capability sets, network, port and restart
policy. The stored manifest now pins the current image digest. No other service
was restarted.

The normal default-user workflow probe opened/closed all 17 eligible transcript
files without reading their contents, wrote a benign marker in the isolated
acceptance directory, read it with the file node, validated it through the
JavaScript task runner and removed it. The probe ran via CLI with a separate
broker port; an authenticated browser click was not performed. HTTP health returned
200. All 29 pre-existing workflows' nodes, connections, settings and activation
states matched the pre-recreation snapshot. The only added workflow is the inactive
mount probe. This maintenance approval did not authorize workflow activation.

## Original real-meeting evaluation

This section records the baseline before repair; the focused repair results appear
below. Both runs use the same four staged meetings.

Seventeen recent API transcripts were eligible under the deployed v0.2.2 selector.
Four real meetings were selected using reproducible content-count heuristics:
technical density, mixed technical/engagement content, people/personal terms,
and administrative/lower-technical content. These are sampling strata, not claims
that a meeting is purely personal or administrative. The four sampled transcripts
contained 6,075–13,562 characters each. Sampling did not modify source files.

The evaluation copied those inputs into a separate private directory and ran an
inactive copy of the actual migrated extraction and final privacy-review stages.
This separate copy has ID `IASPrivacyReal01`. At that baseline, the three PR #12 migration copies
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

## Failure categories and fixes

The earlier 18 → 16 theme run did not pass privacy readiness. Inspection identified
three causes without treating every disputed allegation as a demonstrated leak:

- Extraction/gating retained disallowed framework terminology and commercial,
  staffing, private professional-networking and operational subjects. A generic
  phrase can still be a disguised forbidden topic or unsupported derivation.
- The former final gate saw candidate phrases without source context. It could not
  reliably distinguish independent educational explanation from task/status,
  sales, contract or private operational material.
- The batch auditor confused source details with actual output text, gave invalid
  quotations and inconsistent counts. Its one literal-evidence finding required
  context, and the other fifteen allegations could not establish a pass or prove
  fifteen leaks. The previous engagement-derived theme is no longer retained.

The inactive copies now preserve separate extraction and source-aware per-meeting
privacy-review HTTP stages. Extraction explicitly requires substantive technical
reasoning instead of filling a topic quota. Review must decide every actual
candidate, cite existing source-segment IDs and distinguish actual output wording
from unrelated private context. Technical claims must be supported in the source;
common knowledge must not fill missing reasoning. Retained themes require an
educational decision, no risk flags, and deterministic surface validation.
Rejected private subjects are discarded; an ambiguous, incomplete, malformed or
invalid-evidence response blocks the entire handoff. Named framework, identifier,
date/money and sensitive-subject exclusions remain in force.

Review schemas constrain candidate counts/indexes and source IDs. Boolean risk
flags prevent duplicate category entries. Empty extraction results are validated
and retained in coverage counts but are not sent to a reviewer to invent decisions.
The first repaired attempt correctly blocked an invented empty-input review; the
next attempt also blocked invalid duplicate categories and an incomplete response.
Neither failed attempt produced an approved artifact or was counted as a pass.

## Focused repair acceptance

The same staged transcripts and sample identities were reused; no meetings were
added. Extraction ran once for the repair. Subsequent review-schema corrections
reused those extraction results and reran only the affected privacy review. The
final evaluation's temporary private replay node was replaced afterward with the
actual extraction HTTP node; deployed evaluation definitions contain no cached
sample outputs.

| Sample | Repaired extracted candidates | Privacy-retained themes |
| --- | --- | --- |
| S01 | 4 | 0 |
| S02 | 5 | 0 |
| S03 | 0 | 0 |
| S04 | 5 | 1 |
| Total | 14 | 1 |

The source-aware stage rejected 13 candidates. One substantive educational
technical principle survived in the previously empty S04 control. Zero output
from the other samples was accepted because the source-aware review did not find
suitable independently educational support for their proposed candidates.

A separate local audit reviewed each source independently, using exact output
lookups by index and actual source segments resolved by ID, rather than generated
quotations or prior allegations. It found one clear, grounded, useful theme,
zero disclosure findings, zero ambiguous findings and zero missed safe educational
opportunities. Both disclosure and utility checks passed on this sample. The
review still uses the same served model in a separate call; it is not independent
model/human assurance. Private evidence and reasons remain outside Git.

Focused negative checks blocked 19 invalid/unsafe privacy or handoff cases:
incomplete/schema-invalid replies, missing/duplicate coverage, nonexistent source
IDs, ambiguous/unsupported/flagged retention, banned subjects/identifiers and
missing, pending, tampered or superseded artifacts. The actual embedded query
validator also accepted a safe control and blocked ambiguous/rejected queries;
its dynamic count schema was checked. An unsafe suffix in an untruncated
consolidation query was rejected before the legacy word-limit transformation. No criteria were relaxed for a pass.

A normal-user n8n enrichment run with no approved migration artifact stopped at
`Require Approved Privacy Artifact`, before any consolidation model or Brave
request. All four Brave branches have a current-approval guard. Research queries
also undergo a separate local privacy check before the first branch can run.
No enrichment/planning acceptance or external research was repeated in this repair.

## Fail-closed artifact handoff

`privacy-artifact.cjs begin` writes a private pending marker before extraction,
invalidating older approval. Only successful strict source-aware validation and
theme-file writing reach the approval node. Approval records the run ID, policy
version, exact file SHA-256, count and timestamp, and sets file mode 0600.
Enrichment reads only that approved file, verifies its hash/count/surface policy
and a maximum 24-hour age, and rechecks the same approval before each Brave branch.
Missing approval, later pending/failed attempts, tampering, expired approval or a
changed run/hash block research, including fallback to older theme files. The
24-hour bound is an additional maximum age, not proof of current-cycle completion.
Local markers are trusted workflow handoff records, not cryptographic attestations
against a host administrator.

## Private artifact handling

Real transcripts, sample identities, themes, execution logs, quotes and detailed
review reasons are outside Git, under the private
`/data/output/ias-linkedin-real-privacy` directory. Inputs and sensitive outputs
have mode 0600 inside a mode-0700 directory. Source transcripts remain on the
existing read-only mount. Review artifacts and logs were persisted there before
any future n8n recreation could discard temporary files.

Only aggregate counts, pseudonymous sample labels, scripts, settings proposals
and operating notes are committed. No credential values or decrypted credential
exports were used. After the repair, all 30 activation states matched the pre-repair snapshot.
Twenty-seven workflow definitions/connections/settings were unchanged, including
all original production workflows. Only the inactive sanitization, enrichment and
real-evaluation copies changed. All IAS schedules remain disabled/disconnected.
No credentials, context limits, model routes or services changed during this repair.

## Proposed cutover, after the gates pass

The final [cutover proposal](Cutover.md) records exact IDs, cron connections, paths,
merge behavior, approval boundaries and the legacy-inference rollback limitation.

1. Mount-access prerequisite completed: approved recreation and normal-user/task-
   runner validation passed; all migration workflows remain inactive.
2. Focused sample privacy remediation is complete. Review the private grounded
   evidence and the limits of same-model assurance before broader use. Preserve
   the fail-closed guards; every subsequent real cycle must pass locally before
   any external research. No independent-model deployment is part of this repair.
3. Prepare real-input profiles using `prepare-cutover.py`. They read
   `/data/transcripts` using the preserved API-first selector and write exclusively
   to `/data/output/ias-linkedin`. They remain inactive with schedules disconnected;
   they do not point at synthetic fixtures or write production's flat output files.
   Bind the existing dedicated IAS credentials with `bind.py --source-dir ...`.
   Deploy `privacy-policy.cjs` and `privacy-artifact.cjs` alongside the selector;
   `prepare-cutover.py` scopes marker commands with `IAS_PRIVACY_ROOT`.
   These profiles were generated and checked privately but have not been imported.
4. After explicit cutover authorization, install those profiles while inactive.
   Run a controlled real-input cycle: sanitization and local privacy review first,
   then Brave enrichment, then editorial planning. Require a successful current
   cycle and matching source artifact provenance at each handoff. The inherited
   three-day lookback is not a guarantee of a successful current cycle.
5. Seek separate activation approval. Initially replace only the original active
   sanitization schedule: deactivate its workflow (retain its definition), connect
   the IAS sanitization copy's Monday 07:00 schedule to `Begin Privacy Attempt`, and
   activate that copy. Keep enrichment/planning manual until an approved
   success-dependent handoff is in place; do not activate three independent crons
   that could consume stale artifacts after a failed upstream run. Preserve the
   host's existing timezone and original schedule definitions for rollback.

Rollback after an approved cutover restores the original sanitization activation
state and leaves all IAS copies inactive. Original files/definitions are retained;
outputs are separate. No full-post drafting or publishing is introduced. Webinar
review remains mandatory, and `automaticPublishingAllowed` remains false. OMC,
additional-model deployment, image generation and calendar work remain outside scope.

## Targeted production-input privacy repair — 2026-10-07

The production-profile attempt found three non-educational rejections with no
policy flag, all in one five-candidate review batch. Review prompts now explicitly
require `unsupported_topic` when educational support is absent and prohibit
reasonless rejection. The response schema and fail-closed validators remain unchanged.

Only the affected batch was rechecked. It passed with one retained/four rejected.
`replay-privacy-final.cjs` exercised the actual final-list node against that response
and ten cached passing responses, producing 12 themes from 61 decisions with 49
rejections. A separate source-aware local audit of the affected retained theme
found one clear/useful theme, zero disclosure/ambiguity/missed opportunity.
The discarded conditional-schema attempt was blocked as invalid; it is not part
of the deployed correction. No earlier passed model test was repeated.

Native API read access is verified, and the inactive sanitization/enrichment
prompts are updated. All production workflows/schedules remain unchanged.
The production marker remains pending: this cached check does not complete
a fresh production execution or the enrichment/planner cutover gates. See
[Cutover.md](Cutover.md) for the remaining controlled-cycle requirements.
