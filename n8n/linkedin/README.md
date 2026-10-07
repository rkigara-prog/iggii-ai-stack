# Inactive local content-pipeline migration

These are manual, inactive copies of the deployed meeting-to-content stages.
They stop at an editorial plan. They contain no image-generation, post-drafting,
message-sending, calendar-writing, or LinkedIn publishing actions.

## Discovery

| Stage | Source ID | Deployed state | Migration copy ID |
| --- | --- | --- | --- |
| Transcript Sanitization, privacy gate v3.1 | `Yjc03gS873IHEJPI` | Active | `IASLinkedinSan01` |
| Content Enrichment, deterministic recovery v4.7 | `7dhbdbE5Uk0jMbk2` | Inactive | `IASLinkedinEnr01` |
| LinkedIn Editorial Planner, natural language v1.6.3 | `on2tXEPsd4eeK6X4` | Inactive | `IASLinkedinPlan1` |

The older Evidence Calibrated v3.2 enrichment is `up5el6dumwgWkx6i`, inactive.
The later v4.7 artifact has a different ID. The instance also contains duplicate
inactive Qwen 3.8 quality-evaluation stages; they were not used as the baseline.
No active LinkedIn planner or publishing workflow was found. Historical notes
inside inactive workflows do not establish current activation.

The active sanitization workflow actually references
`node /data/output/omc-krisp/select-transcripts-v0.2.2.cjs`.
Read-only inspection as container root confirmed its API-first selection,
`started_at` date filtering, ten-day window, and legacy duplicate suppression.
Its preview selected 17 recent API transcripts and no legacy transcripts.
Those real transcript payloads were not used in acceptance or exported to Git.

## Migration

The live LiteLLM configuration routes `home-chat` to
`hosted_vllm/home-chat` at `http://192.168.113.32:8000/v1`, with thinking disabled.
No cloud fallback is configured for this route. The copies call
`http://192.168.113.18:4000/v1/chat/completions` using a dedicated IAS header
credential. The service keeps its existing 131072-token context and two-sequence
capacity; no inference service settings were changed.

The six original model roles remain: per-transcript extraction, privacy adjudication,
theme consolidation, initial evidence ranking, final evidence ranking, and
editorial planning. Initially all use the same served model. This retains stage
boundaries; it does not establish independent-model review or privacy equivalence.

Ollama's `model`, `think`, `format`, and `options` request fields are translated
into the OpenAI-compatible model, temperature, and response-format fields.
Object schemas become JSON schemas, and JSON-only requests use JSON-object mode.
Enrichment additionally checks consolidated query privacy locally before web
research. All response readers, including cross-node first-pass readers, use
`choices[0].message.content`. Initial migration preserved prompts verbatim. The subsequent real-meeting privacy
repair strengthens extraction and adds source context and strict decision/evidence
validation to the separate privacy stage; see [Readiness.md](Readiness.md).
Pretty-printed schemas are necessary for the installed n8n expression compiler;
adjacent closing braces inside an expression were rejected as invalid syntax.
Node names and legacy artifact basenames remain stable for cross-node references
and parser compatibility; they do not describe the migrated model provider.

The four Brave search branches remain authenticated Brave requests: theme news,
discovery news, recovery/industry news, and authoritative foundation web search.
The original source-family classification, exact evidence fragments, qualified
bundle requirements, semantic coverage, deterministic scoring/caps, fallback,
unsupported-claim rejection and watchlist separation are preserved. Source URLs
are not replaced. Webinar review and `automaticPublishingAllowed: false` remain.

Schedules are disabled and disconnected in every copy. Original schedules and
workflow definitions remain unchanged. Original binary/MCP settings are retained;
execution payload retention is disabled in these copies. CLI logs used for the
check are private and remain outside Git.

## Isolation and deployment

All stage file inputs and outputs are under
`/data/output/ias-linkedin-acceptance`. Existing basenames are retained inside this
subdirectory; production wildcard patterns in `/data/output` do not match them.
The selector defaults to that directory's `transcripts` tree. It never defaults
to real transcripts. To stage another approved acceptance dataset, place its
API JSON/TXT and legacy TXT files in the matching `Krisp-API` and `Krisp` trees.
The selector preserves v0.2.2's selection/date/duplicate rules and reports counts
without transcript contents.

Ubuntu/Unraid mounts are current. `/volume1` is not used. The n8n output bind mount
is `/mnt/user/Shared/ContentPipeline/output` on Unraid. Its parent is owned by
UID 99/GID 100 with mode 2770, whereas the container defaults to UID/GID 1000.
The approved recreation added supplementary group 100 to the normal n8n user.
The default UID/GID 1000 file-access and JavaScript task-runner probe passed;
all existing mounts, running image, environment and production workflow states
were preserved. See [ops/n8n](../../ops/n8n/README.md) for the applied change and
validation. The original acceptance used `docker exec --user 1000:100`; the
post-recreation probe required no user override. All migration copies remain inactive.

The installed copies use a new IAS LiteLLM credential and a separately named
clone of the existing Brave credential's encrypted record. No decrypted n8n
credentials were exported. Credential IDs/bindings, raw inputs, model outputs,
search payloads, and execution logs are excluded from committed workflow exports.

To rebuild from a credential-free deployed three-stage export:

```bash
python3 n8n/linkedin/migrate.py /private/pipeline.json n8n/linkedin
python3 n8n/linkedin/bind.py /private/bound \
  --litellm-id YOUR_DEDICATED_IAS_ID --brave-id YOUR_DEDICATED_IAS_ID
```

`bind.py` uses distinct IAS workflow IDs. Check for ID collisions before installing
in another instance. Bind credentials within the same owner/project as the copies.
Copy the bound exports privately into the n8n container and use
`n8n import:workflow --input=...`; the CLI defaults to inactive imports.
Deploy `select-transcripts.cjs`, `privacy-policy.cjs` and `privacy-artifact.cjs`
into the isolated directory and keep input/output and log directories private.
The artifact helper defaults to the acceptance directory; real-input profiles
explicitly set `IAS_PRIVACY_ROOT` through `prepare-cutover.py`. The root GitHub workflow deploys LiteLLM only; it does
not import these workflows or deploy the Ubuntu inference service.

Run the copies sequentially. Enrichment now enforces a fresh, matching privacy
approval internally and cannot consume an unapproved or superseded theme file:

```bash
# Run inside the authorized Unraid host; redirect each raw output to a private log.
docker exec -e N8N_RUNNERS_BROKER_PORT=5699 n8n \
  n8n execute --id=IASLinkedinSan01 --rawOutput > /private/sanitization-execution.log 2>&1
# Copy the private log into /tmp/ias-linkedin/sanitization-execution.log.
# audit-acceptance.cjs --privacy-only must pass before the next stage.
docker exec -e N8N_RUNNERS_BROKER_PORT=5699 n8n \
  n8n execute --id=IASLinkedinEnr01 --rawOutput > /private/enrichment-execution.log 2>&1
docker exec -e N8N_RUNNERS_BROKER_PORT=5699 n8n \
  n8n execute --id=IASLinkedinPlan1 --rawOutput > /private/editorial-planner-execution.log 2>&1
```

The alternate broker port is scoped to each CLI process; production runner
settings are untouched. Use restrictive log permissions (`umask 077`) and never
print raw output in a shared terminal. The historical acceptance audit expects its three synthetic inputs and is not a
universal privacy detector. `check-privacy-gates.cjs` checks the repaired fail-closed
validators without inference or search requests. `build-privacy-recheck.cjs` and
`recheck-real-privacy.py` produce private source-grounded per-sample audits; never
print or commit their packets, findings or model replies.

`audit-acceptance.cjs` reads the private stage logs and isolated artifact directory
and emits aggregate results. `check-evidence-gates.cjs` runs the actual migrated
validators against invented-source, same-family, and watchlist attacks without
additional model/search calls. Pass the isolated root, private log directory, and
bound workflow directory as arguments as appropriate. Source node parameter
fingerprints are recorded for review in `source-fingerprints.json`.

## Acceptance

The end-to-end run passed; see [Acceptance.md](Acceptance.md) for counts, negative
checks, preservation evidence and limits. [workflow-inventory.json](workflow-inventory.json)
records every original workflow name/ID/state at discovery.

## Activation readiness

The four-real-meeting evaluation and proposed cutover are documented in
[Readiness.md](Readiness.md). The focused repaired privacy check passed on the same four-meeting sample.
Activation remains unapproved, and cutover/current-cycle validation is still pending.
All copies remain inactive; no real themes were sent to web research. The same PR contains the
applied mount-access fix and successful normal-user validation probe.

The final [cutover proposal](Cutover.md) lists the exact approval actions,
production paths, rollback policy and remaining activation gates.

## Remaining decisions

Broader privacy assurance, current-cycle handoff, production activation and
editorial quality approval remain separate decisions. No post may be drafted until the
required webinar review. OMC integration and additional-model evaluation remain
outside this milestone.

## Current production-cycle verification

After an authorized manual execution, use `verify-production-cycle.cjs` with the
production output root, private CLI-log directory and stage (`sanitization`,
`enrichment`, `editorial-planner`). It verifies newly produced file bytes and binds
the downstream artifacts to the same approved privacy run/hash. The initial output
metadata snapshot must be saved privately as `output-before.private.json`. Logs
are named `<stage>-execution.log`; the helper imports the existing log reader and
privacy validators. Stop on any failed gate before starting the next stage.

After planning, `verify-source-links.py OUTPUT_ROOT PRIVATE_LOG_DIR` checks the
current candidate/plan hashes, exact selected-source links and public link
reachability. Detailed URLs/results stay private; console output contains counts.
These tools do not activate workflows or publish content. The completed controlled
cycle is recorded in [Cutover.md](Cutover.md).
