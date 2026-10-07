# Final PR #12 cutover proposal

Status: ready for code/documentation review; **merge and activation are not approved**.
All migration/evaluation copies remain inactive. This proposal uses the completed
acceptance evidence; no passed tests were repeated for its preparation.

## Workflow identities and proposed activation states

| Stage | Retained original ID | Current original state | Replacement ID | Initial cutover state |
| --- | --- | --- | --- | --- |
| Sanitization/privacy v3.1 | `Yjc03gS873IHEJPI` | Active | `IASLinkedinSan01` | Original inactive; replacement active after gates pass |
| Enrichment/recovery v4.7 | `7dhbdbE5Uk0jMbk2` | Inactive | `IASLinkedinEnr01` | Both inactive; replacement run manually |
| Editorial planner v1.6.3 | `on2tXEPsd4eeK6X4` | Inactive | `IASLinkedinPlan1` | Both inactive; replacement run manually |

`up5el6dumwgWkx6i` is the older inactive enrichment v3.2, not the cutover source.
`IASPrivacyReal01` and `IASMountProbe01` are evaluation/probe workflows; they stay
inactive and are not production pipeline stages. Other original workflows,
including active M365/OMC workflows, are outside the change.

## Exact schedule change

The instance uses `America/New_York` for both n8n and process timezone; the three
stage workflows have no timezone override. Preserve this, including daylight-saving
behavior. Output date formatting also remains `America/New_York`.

- Original sanitization: Monday 07:00, cron `0 7 * * 1`. Unpublish/deactivate
  `Yjc03gS873IHEJPI` only after the replacement's controlled cycle succeeds. Keep
  its definition and existing schedule/connection intact for state rollback.
- Replacement sanitization: enable its existing `Weekly Schedule (Mon 7am)` node,
  retain cron `0 7 * * 1`, and connect that node to **`Begin Privacy Attempt`**.
  This differs from the original entry connection to the transcript selector:
  bypassing the new begin node would bypass approval invalidation.
- Original enrichment's Monday 09:00 (`0 9 * * 1`) and original planner's Monday
  10:00 (`0 10 * * 1`) remain stored but inactive. Their replacement schedule nodes
  stay disabled and disconnected. Run enrichment/planning manually after verified
  upstream success. Activating either downstream cron requires a later decision.

The replacement connection to save before publishing is exactly:

```json
{
  "Weekly Schedule (Mon 7am)": {
    "main": [[{"node": "Begin Privacy Attempt", "type": "main", "index": 0}]]
  }
}
```

Use the authenticated n8n UI's native publish/unpublish controls, or its supported
activation API. CLI definition imports prepare inactive workflows; direct database
flag edits are not a runtime scheduling mechanism. No container restart is part of
this cutover.

## Production input/output paths

| Purpose | Container path | Unraid backing path |
| --- | --- | --- |
| Transcript input, read-only | `/data/transcripts/Krisp-API` and `/data/transcripts/Krisp` | `/mnt/user/Shared/Transcripts/Krisp-API` and `/mnt/user/Shared/Transcripts/Krisp` |
| Existing flat output root, retained | `/data/output` | `/mnt/user/Shared/ContentPipeline/output` |
| Replacement production output/helper root | `/data/output/ias-linkedin` | `/mnt/user/Shared/ContentPipeline/output/ias-linkedin` |
| n8n persistent data | `/home/node/.n8n` | `/mnt/app_pool/appdata/n8n/data` |

Both original and replacement transcript selection preserve API-first v0.2.2 rules:
API `started_at`, ten-day window, legacy `mtime`, and duplicate suppression. The
replacement invokes `IAS_TRANSCRIPTS_ROOT=/data/transcripts node
/data/output/ias-linkedin/select-transcripts.cjs`. It does not use staged samples.

The original stages use the following basenames directly under `/data/output`.
The replacements use the same basenames **only under `/data/output/ias-linkedin`**:

- `theme-list-model-eval-qwen35-YYYY-MM-DD.txt`
- `content-brief-model-eval-YYYY-MM-DD.md`
- `content-candidates-model-eval-YYYY-MM-DD.json`
- `linkedin-editorial-plan-model-eval-YYYY-MM-DD.md` and `.json`

Deploy `select-transcripts.cjs`, `privacy-policy.cjs` and `privacy-artifact.cjs` in
the replacement root, with directory mode 0700 and files mode 0600, owned by the
normal n8n UID/GID 1000. Marker commands use
`IAS_PRIVACY_ROOT=/data/output/ias-linkedin`. `privacy-status.json` binds approval
to the current run, exact theme file hash/count, policy version and maximum
24-hour age. Enrichment reads only that approved file and rechecks approval before
all four Brave branches. A failed/pending newer attempt blocks older approval.

The acceptance root `/data/output/ias-linkedin-acceptance` and private real-sample
root `/data/output/ias-linkedin-real-privacy` remain evaluation namespaces. Do not
copy their generated content or approval markers into production. Private bound
exports, source snapshots, logs, output hashes and cutover records remain outside
Git. All model calls retain the existing local LiteLLM `home-chat` route; credentials
are the existing dedicated IAS references. No image, model or context change is
proposed.

## Why 13 of 14 candidates were rejected

The completed source-aware review rejected all thirteen before deterministic
surface validation. Its overlapping flags were: private engagement (13), identifying
context (7), personnel/personal (6), financial/date (5), incident/operations (7),
unsupported topic (5), and identifying combinations (9). Flags describe the model's
source-context judgments, not thirteen proven literal disclosures or independent
measurements of every category.

The sample was selected by word-count heuristics, not as four educational talks.
Nine rejected candidates came from task/status/remediation and commercial/scope
material. Four came from private process/tool choices or inferred benefits lacking
sufficient independently educational explanation. Personal/networking/staffing
material produced no candidates in another sample. A genuine technical principle
survived in the sample that previously produced no themes.

This supports sensitive or insufficiently educational source material as the main
explanation for low yield. The separate local audit found the one surviving theme
useful and grounded, and found no missed safe educational opportunity. It does
**not** prove filtering is never overly restrictive: both reviewers use the same
model, broad source-context flags may overstate categories, and the surface guards
also conservatively exclude acronym/incident-related terms that can be generic
in other contexts. This evidence does not justify weakening those guards or claim
high recall across meetings. Acceptance of the documented same-model/utility limit,
or private human review of the existing evidence, is a deployment decision; no
additional model or sample evaluation is proposed here.

## Diff and secret review

Reviewed the complete PR diff against `main` and compared original node definitions
with the provider/path migration. Additional source-node changes were confined to
the documented extraction/privacy logic and enrichment input/query validation.
Evidence packaging, scoring, exact URL/excerpt checks, source-family requirements,
watchlist exclusion, editorial rules and original execution capabilities were
preserved. New connections place an approval guard before every Brave branch.
The planner still has the inherited three-day input lookback, so its current-cycle
handoff remains an operator check while it is inactive/manual.

Committed exports are inactive, have schedules disabled/disconnected, omit
credential bindings and execution/pinned data, and contain no private transcripts
or generated content. Inline headers contain no authorization values. Secret-pattern
inspection found no keys/tokens/private keys, and the prior private-source-span
scan is recorded in [Readiness.md](Readiness.md). The diff contains no root Compose,
LiteLLM routing or GitHub deployment workflow changes. No review-blocking code or
secret finding was identified. Passed inference/search/privacy tests were not rerun.

## Approval A: merge only, with no service deployment

The existing main-push workflow runs `docker compose pull` and `docker compose up -d`
for LiteLLM; it does not import n8n workflows. For this workflow/docs PR, propose a
squash commit containing `[skip ci]` to avoid that unrelated service reconciliation.
GitHub documents this for `push` workflows in [Skipping workflow runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs).
Current review found no required checks/branch rules; recheck repository policy and
head immediately before the approved merge. Do not bypass any newly required check.

After explicit approval, substitute the exact reviewed head SHA:

```bash
gh pr merge 12 --repo rkigara-prog/iggii-ai-stack --squash \
  --match-head-commit APPROVED_HEAD_SHA \
  --subject 'Migrate inactive content pipeline and prepare cutover [skip ci]'
```

Do not enable auto-merge or delete the working branch. Merging stores definitions;
it does not install production profiles or authorize activation.

## Approval B: staged installation and activation

This approval must explicitly cover real-input processing, generic Brave research,
the bounded schedule switch, and the rollback policy below. Prepare profiles from
the merged revision with `prepare-cutover.py`, then bind the dedicated IAS
credentials with `bind.py --source-dir ...`, outside Git. Reuse the three exact
replacement IDs; do not overwrite the retained originals.

1. Save fresh private snapshots of original/replacement definitions, versions,
   active states, timezone and current output metadata. Wait for relevant executing
   workflows to finish; do not terminate them. Check for drift before applying.
2. Create the isolated production root and deploy the three helpers. Import the
   real-input profiles under the replacement IDs while inactive and unscheduled.
3. Run one controlled cycle of these **production profiles**, which has not yet
   been exercised. Run `IASLinkedinSan01`; require successful source-aware review
   and a new approved marker. Review its private evidence locally. If no themes
   survive or any validation fails, stop with the old schedule unchanged.
4. Only after that local pass, run `IASLinkedinEnr01`, then `IASLinkedinPlan1`.
   Require each execution's success and its actual newly written outputs. Record
   the privacy run/hash and generated output hashes privately; confirm the approval
   is still the same after enrichment, the candidates came from that successful
   execution and its approved theme artifact, and the plan used those exact
   candidates. Do not accept an older file merely because it is within three days.
   Preserve evidence checks, watchlist separation, manual webinar review and
   `automaticPublishingAllowed: false`. No post drafting/publishing is permitted.
5. If the controlled cycle passes and activation is expressly authorized, save
   the exact Monday 07:00 connection above in `IASLinkedinSan01`. Unpublish
   `Yjc03gS873IHEJPI`; publish `IASLinkedinSan01`. Confirm exactly one of this pair
   is active, the new schedule enters `Begin Privacy Attempt`, and all enrichment,
   planner, sample/probe workflows remain inactive. Leave downstream stages manual.

No deployment cycle or schedule switch above has been performed by this proposal.
The production-profile cycle is new deployment validation, not a repeat of the
completed synthetic or fixed-sample acceptance checks.

## Rollback and remaining activation blockers

A controlled production-profile cycle is still pending. No outstanding disclosure
or utility finding remains on the repaired four-meeting sample; broader independent
assurance and human acceptance of its limits are not established by that sample.

The retained originals depend on legacy Ollama at
`http://192.168.113.32:11434/api/chat`. The prior readiness inspection found it
unavailable; a single read-only reachability check during proposal review again
received no HTTP response. No legacy service/model was started. Therefore restoring
an original schedule is **configuration rollback, not a guaranteed working inference
fallback**. Before activation, explicitly accept a fail-safe halt when that endpoint
is unavailable, or arrange separately approved legacy service readiness. Do not
start models or disturb the current 128K vLLM deployment to manufacture fallback.

Rollback steps after an approved switch:

1. Unpublish/deactivate `IASLinkedinSan01`; stop initiating manual enrichment or
   planning. Let any in-flight authorized execution finish; do not terminate it.
   Keep `IASLinkedinEnr01` and `IASLinkedinPlan1` inactive.
2. Disable/disconnect the IAS Monday schedule while inactive. Quarantine its
   approval marker and new outputs privately so subsequent manual runs cannot
   consume them. Keep original flat outputs and definitions intact.
3. If legacy inference is available and restoration is authorized, republish the
   retained `Yjc03gS873IHEJPI` with its unchanged Monday 07:00 schedule/connection.
   Original enrichment/planner remain inactive. Confirm one active sanitization
   workflow and no active IAS content workflows.
4. If legacy inference is unavailable, leave both sanitization workflows inactive
   under the approved fail-safe-halt policy and report the blocked fallback. Do not
   silently promise restored generation or launch the legacy models.
5. Restore previous inactive IAS definitions from the private snapshot if needed.
   This rollback affects workflow states/profiles only; the already approved mount
   access fix, existing credentials and inference service configuration are retained.

Before any schedule change, failure/denial simply leaves the original activation
states intact. OMC calendars/messages, publishing, images, backup/monitoring/ASM/
NetBox and additional-model deployment remain outside this cutover.
