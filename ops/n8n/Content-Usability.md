# Applied content-pipeline access and archival repair — 2026-10-07

Robert and Leigh start at `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin`.
Open **START-HERE.md**, then **CURRENT.md** for the latest completed five-file set.
The [short guide](../../n8n/linkedin/START-HERE.md) and
[folder architecture](../../n8n/linkedin/Content-Pipeline-Architecture.md) are deployed there, including HTML/PDF copies of the architecture guide. SMB can also use
`192.168.113.18`; macOS uses `smb://192.168.113.18/Shared/ContentPipeline/output/ias-linkedin`.
Existing SMB connections may need disconnect/reconnect to refresh group membership.

## Trace and production boundaries

The actual container mounts are `/mnt/user/Shared/Transcripts` → `/data/transcripts`
(read-only), `/mnt/user/Shared/ContentPipeline/output` → `/data/output` (read/write),
and `/mnt/app_pool/appdata/n8n/data` → `/home/node/.n8n`. `/volume1` is historical.

| Stage/location | Current behavior |
| --- | --- |
| `Shared/Transcripts/Krisp-API` | Canonical API collector intake; preserved meeting identities and metadata |
| `Shared/Transcripts/Krisp` | Legacy transcripts and retained API shadows; never moved/deleted by this repair |
| `IASLinkedinSan01` | Monday `0 7 * * 1`, America/New_York → API-preferred meeting-date selector → extraction/privacy gate → anonymous theme TXT |
| `IASLinkedinEnr01` | Waiting child call; approved theme/hash → consolidation → four authenticated Brave branches → evidence checks/ranking → brief MD and candidates JSON |
| `IASLinkedinPlan1` | Waiting child call; matching candidate proof → editorial validation → plan MD/JSON → completed-cycle archive |
| `output/ias-linkedin` | Production working files, helpers, guide, latest-complete index; no basename/path changes |
| `output/Archive/ias-linkedin` | New verified completed-cycle copies beneath the existing Archive; one date/content-hash directory per distinct set |
| Other files directly in `output` | Retained pre-cutover/legacy and model-evaluation outputs; not current inputs to the active chain |
| `output/Archive` existing files | Historical archives preserved byte-for-byte |
| `ias-linkedin-acceptance`, `ias-linkedin-real-privacy`, `ias-orchestration` | Synthetic/real privacy/orchestration evaluation areas; private, excluded from production and editorial review |

Original workflow IDs `Yjc03gS873IHEJPI`, `7dhbdbE5Uk0jMbk2`, and
`on2tXEPsd4eeK6X4` remain inactive and intact. Git workflow templates remain inactive
and credential-free. The source workflows, migration checkpoint, cutover/activation
records, current all-workflow export, mounts, Unraid cron/User Scripts and Samba
configuration were inspected. The earlier intake acceptance was reused, and its
already-deployed changes were merged through PR #14 as `22df3da`.

## Access cause and repair

Leigh was already authenticated to the **Shared SMB share** from her workstation.
Samba's deployed private share already had `valid users` and `write list` limited to
`rigarashi leigh omcworker`. Its application authorization was correct; no share
permission, credential, guest setting or unrelated application role was changed.
No evidence identified n8n or Open WebUI as her content-file interface.

The migrated production directory had a zero ACL mask and GID 1000; files were
mode 0600. Helpers explicitly applied 0600, so changing existing files alone would
not persist. A named Leigh ACL passed on the physical disk but failed on the SMB
user-share path: Unraid's `fuse.shfs` mount uses `default_permissions` and does not
honor that named ACL effectively. Its writes also did not preserve directory GID
inheritance. Actual SMB opens exposed both failures; access(2) alone was insufficient.

The repair creates private GID **1800**, `contentpipeline`, with exactly Robert
(`rigarashi`, UID 1000) and Leigh (UID 1001). Production/archive roots use GID 1800,
mode 2750 and matching access/default ACLs; generated files use 0640. `Reviews`
uses 2770 for both reviewers. Leigh can read generated files and edit review
records, but cannot rewrite helpers or generated evidence. Robert and the n8n
service retain their existing UID 1000; OMC identities/groups were not changed.

The group is restored at boot by `/boot/config/content-pipeline-access-group.sh`,
called from the existing `/boot/config/go`. The exact source is
[content-pipeline-access-group.sh](content-pipeline-access-group.sh).
[repair-content-access.sh](repair-content-access.sh) applies scoped permissions.
It does not recurse through transcripts, tests or arbitrary legacy files.

The persistent Portainer stack 12 manifest adds supplementary GID 1800 alongside
100. Applying this required one n8n recreation after confirming **no workflow was
running**. Image ID, effective environment/configuration, capabilities, restart
policy, ports, networks and all bind mounts/read-only flags compare equal before/
after; only `GroupAdd` changed. Container-generated hostname, Compose config-hash
label, environment ordering and bind ordering were normalized for comparison.
The running immutable image was retained. `/healthz` returned 200.

`content-access.cjs` explicitly assigns GID 1800 to production files and archive
subdirectories; it does not depend on shfs inheritance. Non-production profiles
retain their original group. Privacy approval criteria, candidate hash checks and
all model/search/evidence/editorial policy code remain unchanged.

## Archival cause, trigger and retention

No output archival node or script exists in the discovered active or historical
workflow definitions, and no archive job is installed in Unraid cron/User Scripts.
The migrated Archive holds historical files, but the original job's exact trigger/
age threshold could not be recovered from the retained migration configuration.
The live chain previously ended at **Write Editorial Plan Files**, so it never
archived the new production namespace. This is separate from n8n's workflow
archive/unarchive flag, which remains unchanged.

The conservative repair uses the existing Archive destination and preserves data:
**after a successful complete cycle**, the planner executes one completion helper
(after both plan writes). It verifies current privacy/candidate proofs and five-file
lineage, copies theme TXT, brief MD, candidates JSON and plan MD/JSON, verifies their
SHA-256 digests, and publishes a manifest and latest-complete index. Hash-derived
directory names preserve different reruns even on the same day. Repeating the same
operation is idempotent; collisions, changed proofs, incomplete sets and invalid
paths fail closed. A failed copy leaves `.pending-*` material for operator recovery;
only finalized directories are archives. Failures propagate to the parent chain.

Working outputs remain in place, and archived copies are retained **indefinitely**.
No deletion/expiry threshold was inferred from missing history. This is a conservative
retention choice within the requested preservation scope, not a claim that the old
job used this exact policy. Any future destructive expiry needs a separate decision.
Source transcripts, OMC identities, unrelated files, prior archives and ambiguous
flat outputs remain untouched. Review notes are retained independently in Reviews.

The previously accepted October 6 filename set (completed October 7 UTC) was
bootstrapped into a verified archive without re-running inference, privacy research
or editorial generation. This archival bootstrap records lineage and bytes only;
it does not renew the existing privacy approval or independently authorize downstream research. The live marker records approval at October 7, 01:49:45.270 UTC, with a 24-hour expiry at October 8, 01:49:45.270 UTC unless a new attempt invalidates it sooner.
CURRENT.md identifies this last complete set until a later successful run replaces
its index. The original five working outputs are byte-identical to their prior run.

## One focused acceptance gate

[acceptance.json](content-usability-20261007/acceptance.json) records the unified gate:

- Authenticated SMB access as **both Leigh and Robert**, using installed Samba
  identities locally without printing passwords/hashes: directory discovery,
  guide/current index, all five working/archive files, and review write/read/delete.
- A successful real archive operation with exact five-file byte comparisons and
  preservation checks for every pre-existing transcript, flat output and legacy archive.
- Actual failed opens for the excluded OMC worker and guest; Leigh's generated-file
  write attempt is denied. No public or broadly writable content access was introduced.
- The actual inactive n8n writer→archive node path completed successfully with a
  synthetic five-file set. Collision, idempotency, incomplete/path-traversal and
  changed-proof checks passed. Its temporary workflow was removed; 30 workflows remain.

The three active/published content stages retain their states; all other workflows
and the sanitizer/enrichment definitions/version pointers remain unchanged. Only
planner publication gains the completion hook. Its latest published version is
`acfd5d24-452d-42aa-af06-96cabe56b6b3`. Exactly one content clock remains enabled:
Monday 07:00 America/New_York; child clocks remain disabled/disconnected.
**LinkedIn posting remains disabled.** No new model, Brave, calendar or OMC test/run
was initiated. Previous content/privacy/evidence/orchestration/intake acceptance
was reused. The next scheduled start is October 12 at 07:00 New York (11:00 UTC).

Raw exports, API responses, backups, checksums, SMB logs and synthetic artifacts
remain private in `/tmp/content-usability` and `/home/node/.n8n/content-usability`
on Unraid. Additional root-only gate logs are in `/tmp/content-usability-gate.*`.
No credential values, transcript contents or generated content enter Git.

## Limits and recovery

The authenticated SMB gate ran on the server, not by clicking Leigh's existing
workstation session. She may need to reconnect that session. A host reboot was
not performed; the persistent group hook and Compose manifest were validated,
and n8n recreation was verified. The first Monday run with the completion hook
has not yet occurred. Existing same-model privacy-assurance and manual source/
webinar review limitations remain. There is no expiry/deletion job.

To disable archival only, use the native owner API to save/publish the privately
saved planner's original nodes/connections/settings, leaving its clock disabled.
Keep the repaired access helpers/group and all archive/index/data files. Parent
and enrichment clocks/states need no change. Do not delete archives for rollback.
For a full runtime rollback, use the private pre-change container inspection and
`compose-before.private.yaml` after confirming no executions are running; restore
matching pre-change helpers/ACLs before removing the supplementary group. That
rollback restores the known access defect and is emergency recovery only. Never
replace n8n credentials, encryption keys, OMC state or source transcripts.
