# Reliability changes: review and rollout

These changes are prepared code, not evidence of a deployed or successful content run. Retain existing privacy and evidence validators, human review, and disabled public posting.

Generated workflow exports are intentionally not part of this patch. CI runs the reproducible builders against the existing repository templates before testing. Keep production exports and generated deployment copies private.

## Behavior

- Valid empty extraction, all-rejected privacy review, empty consolidation, and empty relevant-source shortlist terminate without research or reuse of an older approval. Malformed or ambiguous responses still fail closed.
- Generation contracts permit zero to eight consolidation topics. Evidence assessment uses a strict schema, exact coverage, quotation/paraphrase fields, and explicit topic judgments. Official-document exceptions retain the existing narrow policy conditions; no authority domains are added.
- Topic overlap is a necessary exclusion check, never proof. Model topic judgment and existing evidence gates must also pass. Public page retrieval retains the existing network restrictions. At most six extra original-source links can be followed beyond the eighteen initial pages, one level deep, using links observed on those pages. Passage selection preserves IDs.
- `run-status.json` distinguishes running, failed, stalled, completed_no_research, completed_all_deferred, and content_ready. Content_ready means accepted plan topics available for human review, not finished posts. Local alerts contain only a run ID, stage, enumerated code, and counts.
- `stage-result.cjs inspect` detects a running stage older than ninety minutes and writes an idempotent local alert. It must be called by an approved operational check; this patch creates no monitoring schedule and enables no external notification destination.

## Tests and rollout gates

Run all contract, retrieval, selector, and archive commands in the pull-request CI workflow. Also validate the exported IF nodes and JSON-schema request against the deployed n8n/model versions in a controlled acceptance run before publishing. Local JavaScript compilation cannot establish backend schema support or n8n import compatibility.

Outbox records are written before terminal status so failed writes remain retryable. Any future delivery adapter must compare the event ID with the current terminal status before sending; a prepared outbox file alone is not delivery authority.

Error Trigger behavior requires installed-version acceptance: trigger a synthetic automatic failure with raw execution retention still disabled and verify execution-ID correlation. A manual UI execution does not test Error Trigger. Missing IDs must fail closed and never be guessed from the latest run. If the installed version omits the ID, rollout remains blocked pending a safe correlation design; do not enable raw payload retention. The local stalled-run check requires an explicitly approved invocation and is not an already-running monitor.

1. Save private backups of all affected live workflows and helper scripts. Use the current live exports as patch input; never replace live production workflows wholesale with the inactive source templates. Run `update()` from build-reliability.cjs on those exports and inspect the complete diff. Preserve credentials, roots, schedules, IDs, and activation. Changes to expression serialization must be checked with n8n's native evaluator.
2. Stage the evidence helpers, status helper, and updated artifact helpers together in an isolated acceptance output root. Import the generated inactive failure-handler workflow. Bind its actual assigned ID as the error workflow for each pipeline stage during approved rollout; it is not automatically assigned by this source patch. The error handler rejects unmatched execution IDs. Do not retain error-trigger payloads.
3. Exercise empty extraction, all-rejected privacy, empty consolidation, failed schema response, missing source, malformed binding, archive failure, and zero-selected-topic outcomes. Verify no stale artifact is reused and no disallowed external search occurs. Check stage and local alert metadata for sensitive content.
4. Run a bounded current approved-theme acceptance cycle. Record selected/deferred counts and reason codes; compare evidence quality, not merely execution success. A zero-selected result is valid but must be visible as completed_all_deferred.
5. Request approval for the exact production workflow/helper deployment. No external alert delivery is enabled until an owner destination and sending authority are confirmed. Do not merge as a substitute for n8n deployment.

## Rollback

Restore the saved helper versions and workflow versions together, and restore previous error-workflow bindings. Preserve status/outbox and content artifacts for diagnosis. A rollback must retain privacy gates and public-posting safeguards. Do not remove completed content or private backups.

## Repository deployment

The workflow can run on deployment-workflow/helper changes, but a hosted-runner job first compares the complete push range. Only changes to root `docker-compose.yml` or `litellm/**` allow the self-hosted deployment job. Removed runtime files and mixed changes count; an unknown comparison range fails closed. Workflow, CI, n8n, and documentation changes alone do not reconcile the shared proxy, including this PR's merge if no runtime files are added to its scope. Normal tests remain enabled; no skip-CI marker, permission change, or branch-protection change is needed. A merge remains a separate release decision. Update this explicit runtime-input list if the root Compose stack gains other repository dependencies.
