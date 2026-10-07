# Production Krisp API intake repair — 2026-10-07

The collector actually outputs to `/mnt/user/Shared/Transcripts/Krisp-API`.
Manual moves into `Krisp` left the API folder empty while collector-ledger IDs were
still marked processed. All 80 moved API pairs matched ledger hashes and were
copied back with metadata and mtimes unchanged; originals remain in `Krisp`.
No live `Krisp-ai` folder was found. Do not keep moving API output manually.

The active `IASLinkedinSan01` uses `/data/output/ias-linkedin/select-transcripts.cjs`,
with `IAS_TRANSCRIPTS_ROOT=/data/transcripts`. It does not use the historical
`/data/output/omc-krisp/select-transcripts-v0.2.2.cjs`. Both helpers are repaired;
the active helper exactly matches `n8n/linkedin/select-transcripts.cjs`, while the
historical helper preserves its production default root. Mounts stay unchanged.

The selector discovers API pairs in both folders, validates identity and API
`started_at`, prefers canonical API copies, suppresses identical moved shadows
and matching legacy IDs, and blocks conflicting copies. Both API and legacy window
selection use actual meeting dates, never filesystem mtime. Undated legacy files
remain private/on disk but are not selected. At acceptance: 17 recent API meetings,
63 outside-window API meetings, 80 shadow copies and 26 legacy duplicates excluded,
136 legacy files excluded for unknown meeting date.

One recent authenticated API meeting passed the actual production n8n selector,
file-read and decode nodes in a temporary inactive input-only workflow, exactly
once. Its original OMC Postgres row ID was preserved, API date stored, and repeated
intake added no queue work. All 80 API row IDs survived canonical path rebinding;
all 162 historical legacy rows and their references remain. The probe and its
execution were deleted. No content/privacy/model tests were repeated.

All 30 production workflow definitions compare identical before/after. The weekly
Monday 07:00 America/New_York chain and callable enrichment/planner children remain
as deployed; independent child schedules and LinkedIn publishing remain disabled.
No n8n restart occurred. Aggregate evidence and hashes are in adjacent JSON files.
Secrets, meeting IDs/titles/text and execution payloads stay outside Git.

Collector source and OMC adapter/deployment record are in
`rkigara-prog/outlook-multi-context-automation`, `ops/krisp` and
`deployments/krisp-api-repair-20261007`. That record also documents a new nightly
maintenance guard failure discovered during final task verification and safe
restoration of the already-authorized original OMC background tasks without killing
any process. Calendar/inference acceptance was not repeated.

Rollback: atomically restore private original helper backups, retaining existing
workflow definitions/schedules. Do not delete restored API copies, restore stale
OMC databases or replay old jobs. A rollback to mtime selection reintroduces the
observed duplicate/date errors and should not be used as normal operation.
