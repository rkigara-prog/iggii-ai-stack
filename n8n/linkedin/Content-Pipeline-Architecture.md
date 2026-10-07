# Content pipeline folder architecture and operating guide

Robert and Leigh should work from `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin`. Open **CURRENT.md** for the latest completed set, read the plan and research brief, and save decisions in **Reviews**. The surrounding folders separate original private meeting material, generated content evidence, human decisions, preserved completed cycles and evaluation work.

This guide describes the deployed system on **October 7, 2026**. It does not propose a folder migration. The browser copy is **Content-Pipeline-Architecture.html** and the printable copy is **Content-Pipeline-Architecture.pdf**, in the same starting folder. The canonical editable source is `n8n/linkedin/Content-Pipeline-Architecture.md` in `rkigara-prog/iggii-ai-stack`; shared HTML/PDF copies are generated from that source.

## Folder design at a glance

```text
\\Iggy-Nas\Shared
├── Transcripts                         ORIGINAL PRIVATE INPUTS
│   ├── Krisp-API                       Canonical API TXT + JSON pairs
│   ├── Krisp                           Legacy TXT + retained API shadows
│   └── older meeting-named folders     Retained; outside the active selector
└── ContentPipeline
    └── output                          Historical shared output namespace
        ├── ias-linkedin                CURRENT PRODUCTION WORKING AREA
        │   ├── START-HERE.md            Short starting instructions
        │   ├── Content-Pipeline-Architecture.md / .html / .pdf
        │   ├── CURRENT.md              Links to last complete archived set
        │   ├── current-status.json      Completion index and file hashes
        │   ├── theme-list-*.txt         Sanitized intermediate theme artifact
        │   ├── content-brief-*.md       Research intermediate and reading copy
        │   ├── content-candidates-*.json  Evidence-bound planner input
        │   ├── linkedin-editorial-plan-*.md / .json  Final cycle outputs
        │   ├── privacy-status.json       Present privacy handoff
        │   ├── candidate-status.json     Expected automated handoff; currently absent
        │   ├── *.cjs                   Service helpers, not editorial documents
        │   └── Reviews                 HUMAN EDITS AND APPROVAL RECORDS
        ├── Archive
        │   ├── ias-linkedin
        │   │   ├── UTC-date-content-hash/  Five copied outputs + manifest.json
        │   │   └── .pending-UUID/         Only if a copy failed; not a final archive
        │   └── older flat files           Retained historical archives
        ├── older flat outputs / traces   LEGACY AND EVALUATION MATERIAL
        ├── omc-krisp                     Compatibility selector for old workflow
        ├── ias-linkedin-acceptance       SYNTHETIC ACCEPTANCE AREA
        │   ├── transcripts/Krisp-API and transcripts/Krisp
        │   └── archive-check*            Synthetic output and archive fixtures
        ├── ias-linkedin-real-privacy     PRIVATE REAL-MEETING EVALUATION AREA
        │   └── transcripts/Krisp-API and transcripts/Krisp
        └── ias-orchestration             SYNTHETIC HANDOFF CHECKS
            └── fixtures
```

The wildcard names in this tree identify file families, not extra folders. Production has **no separate intermediate-processing directory**: sanitized themes, researched candidates and completed plans share `ias-linkedin`, with distinct filenames and machine proofs establishing their stage. Most extracted themes, privacy decisions, search replies and ranking work exist inside an n8n execution rather than as durable folders. Do not use an evaluation folder to find production drafts.

## Exact host and container mappings

The Windows name `Iggy-Nas` resolves to Unraid at `192.168.113.18`. If name resolution fails, replace `Iggy-Nas` with `192.168.113.18` in any Windows path below. The SMB share is **Shared**; these are private LAN paths.

| Windows share path | Unraid host path | n8n container path and access |
| --- | --- | --- |
| `\\Iggy-Nas\Shared\Transcripts` | `/mnt/user/Shared/Transcripts` | `/data/transcripts`, read-only mount |
| `\\Iggy-Nas\Shared\Transcripts\Krisp-API` | `/mnt/user/Shared/Transcripts/Krisp-API` | `/data/transcripts/Krisp-API`, read-only |
| `\\Iggy-Nas\Shared\Transcripts\Krisp` | `/mnt/user/Shared/Transcripts/Krisp` | `/data/transcripts/Krisp`, read-only |
| `\\Iggy-Nas\Shared\ContentPipeline\output` | `/mnt/user/Shared/ContentPipeline/output` | `/data/output`, read/write mount |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin` | `/mnt/user/Shared/ContentPipeline/output/ias-linkedin` | `/data/output/ias-linkedin` |
| `\\Iggy-Nas\Shared\ContentPipeline\output\Archive\ias-linkedin` | `/mnt/user/Shared/ContentPipeline/output/Archive/ias-linkedin` | `/data/output/Archive/ias-linkedin` |
| No path in Shared; service persistence | `/mnt/app_pool/appdata/n8n/data` | `/home/node/.n8n`; execution infrastructure and private operator records |

The collector writes directly to the canonical host `Krisp-API` path through its own read/write bind mount. Its private service state is under `/mnt/app_pool/appdata/omc-krisp-transcript-ingest`, outside Shared/Transcripts. Neither credentials nor collector state belong in editorial folders. Old `/volume1` paths refer to the retired Synology arrangement, not a current mount. There is no deployed `Krisp-ai` folder in this pipeline.

## Folder responsibilities

In this table, **San** means the published sanitizer `IASLinkedinSan01`, **Enr** means `IASLinkedinEnr01`, and **Plan** means `IASLinkedinPlan1`. “None active” means the current content chain does not read the folder; it does not declare the folder safe to delete. Robert and Leigh should follow the editing policy even where their accounts technically have write access.

| Exact Windows share path | Purpose | Why it is separate | File creator | Consumer | Robert or Leigh editing policy |
| --- | --- | --- | --- | --- | --- |
| `\\Iggy-Nas\Shared` | Private SMB share entry | Existing share authorization precedes folder permissions | Unraid share configuration/operators | Samba serves authorized accounts | Use the named child locations; do not change share settings |
| `\\Iggy-Nas\Shared\Transcripts` | Private source namespace | Keeps original meetings outside generated content | Intake services and historical imports | San scans only the two named source roots below; OMC has separate intake | Do not edit, rename or move source material |
| `\\Iggy-Nas\Shared\Transcripts\Krisp-API` | Authoritative API TXT/JSON pairs | Preserves API identity, metadata and collector ownership of intake | `omc-krisp-collector`; repairs restored canonical copies | San selector; separately, OMC transcript intake | Neither reviewer should edit; a JSON sidecar is not a draft |
| `\\Iggy-Nas\Shared\Transcripts\Krisp` | Legacy transcripts and retained API shadows | Supports legacy intake while canonical API copies take priority | Google Drive Transcript Pull/rclone and historical imports/moves | San fallback and duplicate checks; separate OMC legacy intake | Do not edit; unknown dates and duplicates are retained |
| `\\Iggy-Nas\Shared\ContentPipeline` | Container for content assets | Existing content namespace outside raw inputs | Historical setup/operators | Through its output child | No routine edits at this level |
| `\\Iggy-Nas\Shared\ContentPipeline\output` | Mounted output parent; older flat files | Existing deployment mount and pre-cutover namespace | Original workflows, evaluation runs and historical operators | Current stages use only explicit child paths | Browse for history; do not move or overwrite ambiguous flat files |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin` | Current production artifacts, proofs and guides | Isolates the active chain from legacy wildcard outputs and test data | San, Enr, Plan and approved documentation deployment | Enr reads approved themes; Plan reads proven candidates; archive helper reads all five | Read generated artifacts; edit canonical guides through Git, not live helpers |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews` | Human requested edits and approval records | Prevents editorial changes from invalidating generated evidence hashes | Robert and Leigh | No active workflow; people read these records | Both may create/edit documents here |
| `\\Iggy-Nas\Shared\ContentPipeline\output\Archive` | Historical archive parent | Existing archive location retained during repair | Original archival process, whose trigger is unrecovered | No active workflow reads the older flat archives | Treat old files as history; no cleanup without classification |
| `\\Iggy-Nas\Shared\ContentPipeline\output\Archive\ias-linkedin` | Verified copies of completed production sets | Gives review a stable copy while working files can change | Plan completion helper; initial controlled bootstrap | CURRENT.md links and human review; helper checks repeat copies | Read only for editorial work; Robert administers recovery |
| `\\Iggy-Nas\Shared\ContentPipeline\output\omc-krisp` | Versioned compatibility selector | Keeps the older inactive workflow's helper reference intact | Earlier migration/intake repair | Original inactive sanitizer `Yjc03gS873IHEJPI`; not active San | Do not edit; active selector is inside ias-linkedin |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance` | Synthetic migration/acceptance outputs | Keeps invented test material out of production selectors | Inactive/manual acceptance tools and operators | Test workflows/checks only | Operator-managed; Leigh has no access; not editorial content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\transcripts` | Synthetic source staging | Allows the selector to be checked without real input | Acceptance fixtures | Acceptance selector | Neither reviewer should use it as a source |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\transcripts\Krisp-API` | Synthetic API-shaped pairs | Exercises API handling | Acceptance fixture preparation | Acceptance selector | Operator only |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\transcripts\Krisp` | Synthetic legacy-shaped TXT | Exercises fallback and duplicate rules | Acceptance fixture preparation | Acceptance selector | Operator only |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check` | Initial synthetic writer/archive check | Retains check evidence without adding it to production | Archive acceptance tools | Temporary test workflow, now removed; helper checks | Operator only |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-final` | Later synthetic archival check | Historical validation iteration; no permanent distinct role documented | Archive acceptance tools | Checks only | Operator only; do not mistake it for a final production cycle |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-release` | Final synthetic helper validation | Historical validation iteration | Archive acceptance tools | Checks only | Operator only |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-real-privacy` | Real-meeting privacy evaluation results | Separates sensitive evaluation packets from production/research | Inactive `IASPrivacyReal01` and private evaluation tools | Manual privacy evaluation, not active chain | Operator only; Leigh has no access |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-real-privacy\transcripts` | Private evaluation source staging | Source context stays within its evaluation profile | Approved evaluation preparation | Evaluation selector | Neither reviewer should treat it as canonical intake |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-real-privacy\transcripts\Krisp-API` | Staged API-shaped evaluation input | Mirrors API input structure | Approved evaluation preparation | Evaluation selector | Operator only |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-real-privacy\transcripts\Krisp` | Staged legacy evaluation input | Mirrors legacy input structure | Approved evaluation preparation | Evaluation selector | Operator only |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-orchestration` | Synthetic subworkflow handoff evidence | Tests waiting calls/failures without inference or production output | Orchestration fixture tools | Manual orchestration checks | Operator only; Leigh has no access |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-orchestration\fixtures` | Synthetic themes/candidates/plans | Keeps fixture artifacts beneath their test profile | Fixture scripts/test workflows | Fixture stages only | Operator only |

There are also seven retained meeting-named folders immediately under Transcripts. The active selector does not scan these; their earlier processing role is not documented sufficiently to justify consolidation. Their exact locations are:

| Exact Windows share path | Purpose and separation | Creator | Active consumer | Editing policy |
| --- | --- | --- | --- | --- |
| `\\Iggy-Nas\Shared\Transcripts\chrome meeting - July 24, 2026 2-00-51 PM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |
| `\\Iggy-Nas\Shared\Transcripts\chrome meeting - July 24, 2026 9-30-03 AM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |
| `\\Iggy-Nas\Shared\Transcripts\ms-teams meeting - July 24, 2026 3-10-38 PM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |
| `\\Iggy-Nas\Shared\Transcripts\ms-teams meeting - July 24, 2026 11-01-51 AM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |
| `\\Iggy-Nas\Shared\Transcripts\ms-teams meeting - July 24, 2026 1-28-51 PM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |
| `\\Iggy-Nas\Shared\Transcripts\ms-teams meeting - July 24, 2026 9-03-08 AM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |
| `\\Iggy-Nas\Shared\Transcripts\Zoom meeting - July 24, 2026 9-59-57 AM` | Historical meeting import; original layout retained | Earlier import; exact writer unrecovered | None active | Do not edit/move |

The fixture subfolders below are internal test counterparts, not another production architecture. Older flat synthetic copies also remain inside the initial archive-check/Archive. Every per-cycle hash directory inside these folders inherits the enclosing fixture's purpose and policy.

| Exact Windows share path | Purpose | Why separate | File creator | Consumer | Editing policy |
| --- | --- | --- | --- | --- | --- |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check\output` | Synthetic working files | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check\Archive` | Synthetic archive parent | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check\Archive\output` | Corrected synthetic archive namespace | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-final\output` | Synthetic working files | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-final\Archive` | Synthetic archive parent | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-final\Archive\output` | Corrected synthetic archive namespace | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-release\output` | Synthetic working files | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-release\Archive` | Synthetic archive parent | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |
| `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin-acceptance\archive-check-release\Archive\output` | Corrected synthetic archive namespace | Mirrors the tested helper profile; private fixture evidence | Archive acceptance tools | Fixture/check tools only | Operator only; neither reviewer uses it for content |

For production cycle directories, the exact current Windows path is listed under Archiving and recovery. Each such child holds one content set, exists to preserve a distinct completed result, is created by Plan's completion helper, is read through CURRENT.md/human review, and should not be edited by either reviewer. A `.pending-UUID` child has the same creator and restricted access but is incomplete recovery material; no pending production directory was observed.

Service-only folders have no mapping within the Shared share:

| Host folder | Purpose and separation | Creator | Consumer | Editing policy |
| --- | --- | --- | --- | --- |
| `/mnt/app_pool/appdata/n8n/data` | n8n persistence/private operation records; separate from editorial data | n8n and authorized operator tools | n8n runtime and operator recovery | Neither reviewer edits it for content work |
| `/mnt/app_pool/appdata/omc-krisp-transcript-ingest` | Collector configuration/state/checkpoints; independent of original TXT/JSON source pairs | Collector and authorized operators | API intake service | Neither reviewer edits it for content work |

## Data flow and file authority

```text
PRIVATE SOURCES                         LOCAL n8n PROCESSING
Krisp-API TXT + JSON ─┐
                     ├─► API-first/date selector ─► extraction + privacy gate
Krisp legacy TXT ────┘                                    │
                                                         ▼
                                               approved theme TXT
                                                         │
                                        consolidation + generic Brave queries
                                                         │
                                         public sources + evidence/ranking checks
                                                         ▼
                                               brief MD + candidates JSON
                                                         │
                                                   editorial planner
                                                         ▼
                                                 plan MD + plan JSON
                                                         │
                                  verified five-file COPY ─► Archive/ias-linkedin
                                                         │
                                          CURRENT.md ─────┘
                                                │
                                  Robert/Leigh read and decide
                                                ▼
                                 Reviews records     NO automation consumer
```

1. **Intake preserves originals.** The API collector creates a TXT transcript with its corresponding JSON metadata. The canonical pair is authoritative for API identity and `started_at`. Legacy TXT remains authoritative for meetings without an API pair. Restored API shadows in Krisp are retained copies, not an alternative canonical home. OMC's intake uses its own state/references; content processing does not rename meetings or change OMC identities.
2. **Selection establishes the input set.** San's `select-transcripts.cjs` scans Krisp-API first and Krisp second, recursively within those roots. It uses a rolling ten-day meeting-date window, not file modification time. API metadata must match the filename identity and contain a timezone-qualified date. Identical API shadows and matching legacy IDs are suppressed; conflicting API copies block selection. Undated legacy files stay on disk but are not selected. Copying a transcript to make it appear recent is not an intake method.
3. **Sanitization establishes research permission.** San extracts themes locally and runs a separate privacy review, then writes up to twenty anonymous theme bullets. `privacy-status.json` changes from pending to approved and binds the TXT's filename/hash to a run. Approval must still match the file and be no more than 24 hours old when downstream processing checks it. An old theme file alone is not authority to research; a new attempt invalidates the previous approval.
4. **Research creates generated evidence.** Enr reads the exact approved theme, consolidates topics, and issues generic queries through four Brave branches: theme-matched news, emerging/discovery news, recovery/industry news, and authoritative foundations. Raw transcripts are not web-search input. Source-family, evidence-fragment, scoring, corroboration and unsupported-claim rules separate qualified opportunities from the watchlist. The brief is the reading copy; the candidates JSON is the machine handoff. `candidate-status.json` binds candidate/brief hashes to the privacy proof.
5. **Planning creates an editorial proposal.** Plan verifies that handoff, selects from qualified candidates, preserves exact verified source URLs and writes both plan formats. Watchlist entries become research gaps, not approved post briefs. Webinar overlap still requires human review. A completed plan may have `partial` or `insufficient_verified_topics` status; technical completion does not certify editorial quality.
6. **Archiving establishes a completed record.** After both plan writes, the helper verifies the five-file set and publishes preserved copies plus a manifest. Only then does it replace `current-status.json` and CURRENT.md. These identify the latest successfully indexed set, not the newest file modification time. A failed cycle can leave newer partial working files while CURRENT.md correctly stays on the previous complete set.
7. **Review records human decisions.** Robert and Leigh create their own review documents. No active workflow reads Reviews or interprets “approved” as a trigger. There is no automated drafting, image generation or LinkedIn publishing action in this chain; `automaticPublishingAllowed` remains false.

Original inputs are authoritative for meeting evidence. JSON handoff proofs are authoritative for whether the next automated stage may consume generated files. The current bootstrapped set has privacy-status.json but no candidate-status.json: it is a preserved accepted set, not a currently resumable candidate handoff. Do not create that marker manually; Enr records a fresh proof during a successful automated cycle.

The candidates/plan JSON files are authoritative machine records for their stages; their Markdown partners are readable renderings. CURRENT.md and the archive manifest are authoritative for locating and verifying the completed set. Review records are authoritative only for the reviewers' stated decisions. None of these generated or historical copies replaces an original transcript.

## The five output files

The current completed set has **October 6, 2026 filenames**. Its plan finished at **2026-10-07 01:53:26.887 UTC**, which was October 6 in New York. Filename dates are generated in America/New_York; archive directory dates use the plan's UTC `generatedAt`. Future cycles keep these basename patterns with their own dates.

| Actual current filename | Contents | Intended use and automation role |
| --- | --- | --- |
| `theme-list-model-eval-qwen35-2026-10-06.txt` | Up to twenty anonymous public-topic bullets derived from the privacy gate | San's generated intermediate; Enr reads it only with its matching privacy proof. Read for context; never restore private names or details |
| `content-brief-model-eval-2026-10-06.md` | Research opportunities, supporting sources/evidence, scoring context and watchlist items needing verification | Human research reading copy; archived and hash-bound alongside candidates. Read before approving an angle |
| `content-candidates-model-eval-2026-10-06.json` | Structured qualified theme-aligned/emerging opportunities, source/evidence records, diagnostics and watchlist | Enr's machine output and Plan's exact input. Do not hand-edit to promote a watchlist item or change evidence |
| `linkedin-editorial-plan-model-eval-2026-10-06.md` | Selected topic briefs, editorial angles, takeaways, verified URLs, webinar review and research priorities | Primary document for Leigh and Robert to read and discuss; save changes separately in Reviews |
| `linkedin-editorial-plan-model-eval-2026-10-06.json` | Structured planner decisions, selected/deferred topics, policy summary and validation warnings | Machine companion and archival lineage record; not a publishing queue or an approval form |

The words `model-eval`, `qwen35`, and `gpt-oss` in inherited basenames/node labels do not make this current set a test run or establish the served model. The live stages use the migrated local `home-chat` route. Membership in `ias-linkedin`, published workflow bindings and matching completion proofs identify production. There are five content outputs; CURRENT.md, guides, handoff markers and the archive manifest are additional metadata, not extra content outputs.

## Permissions and privacy boundaries

| Identity | Production working area and archive | Reviews | Original transcripts and tests |
| --- | --- | --- | --- |
| Robert, SMB account `rigarashi`, UID 1000 | Owner access; may administer files, but should not edit generated evidence during editorial review | Create/edit/read | Original source tree is accessible; current private test roots are owner-accessible |
| Leigh, SMB account `leigh`, UID 1001 | Read/traverse; generated files and helpers are not writable | Create/edit/read | Source roots use the existing users group and are accessible; current test roots are mode 0700 and not accessible |
| n8n, UID/GID 1000, supplementary groups 100 and 1800 | Creates/updates generated files, proofs, index and archives | Technically accessible, but no workflow consumes it | Read-only transcript mount; permitted private test access |
| API collector | Writes canonical API input through its specific bind mount | No content-review role | Docker has no configured non-root User override; input files are normalized to nobody:users. Private collector state stays outside the content output mount |
| OMC worker, UID 1002, users group 100 | Excluded from the private production/archive child roots | Excluded | Existing source access supports separate OMC intake; identities and references remain unchanged |
| Guest/unauthorized share account | Shared SMB authorization denies access | Denied | No public access is configured |

The private `contentpipeline` group, GID 1800, contains exactly Robert and Leigh. n8n has that supplementary GID separately. Production/archive directories are normally 2750 and generated files 0640; Reviews is 2770. Helpers explicitly assign GID 1800 because Unraid shfs did not reliably honor named ACLs or directory group inheritance. The group is restored by the boot hook; the Portainer n8n manifest persists its supplementary groups.

**Folder separation is not a claim that raw transcripts are hidden from Leigh.** Both reviewers currently have access to the private transcript source roots through Shared/users permissions. The important processing boundary is that San alone reads raw meetings and Enr's web queries use approved anonymous themes. Content artifacts are intended to support eventual public content, but they remain private working material, not automatically publishable data. The real-privacy evaluation area may itself contain sensitive staging/results and stays closed to Leigh. Existing same-model privacy-assurance limitations remain; a folder name or successful gate is not independent-model assurance.

## Archiving and recovery

**Confirmed current behavior:** the active Plan completion node runs once after its two file writes, before returning success to Enr and San. It copies all five content outputs, verifies hashes and source lineage, then publishes a manifest and completion index. Archiving does **not** wait for human approval, move working outputs, archive review notes, remove transcripts, or expire old copies.

A finalized directory is named `YYYY-MM-DD-<64-character SHA-256 content hash>`. The date is the UTC plan completion date; the hash covers the ordered filenames, sizes and file hashes of the five-file set. The current exact directory is:

```text
\\Iggy-Nas\Shared\ContentPipeline\output\Archive\ias-linkedin\2026-10-07-b8ec0ec5b54bb6bdf1f910c2c85f08afc7a23e54c289a1b7c3fef65dbd37b0a9
```

| Exact Windows cycle folder | Purpose | Why separate | File creator | Consumer | Editing policy |
| --- | --- | --- | --- | --- | --- |
| `\\Iggy-Nas\Shared\ContentPipeline\output\Archive\ias-linkedin\2026-10-07-b8ec0ec5b54bb6bdf1f910c2c85f08afc7a23e54c289a1b7c3fef65dbd37b0a9` | Current preserved five-file set and checksum manifest | Keeps this distinct completed result stable across reruns | Controlled bootstrap of the already-accepted set; future directories are written by Plan's helper | CURRENT.md and human review | Neither reviewer edits the generated copy; Robert handles verified recovery |

It contains the five files named above and `manifest.json`. Its manifest records `bootstrap: true`: the already-accepted set was copied during the repair, rather than by a new model run. That does not renew its privacy approval. The stored approval was made at 2026-10-07 01:49:45.270 UTC and expires at 2026-10-08 01:49:45.270 UTC if not invalidated sooner. The normal completion path still requires fresh, matching privacy/candidate proofs.

| Situation | Current behavior and safe response |
| --- | --- |
| Another successful cycle on a different day | Creates another dated/hash directory and updates CURRENT.md |
| Changed output set on the same day | Creates a different hash directory; working basenames may be overwritten but prior finalized copies remain |
| Exact same five-file set archived again | Verifies the existing copy/manifest and reuses it; does not duplicate the set |
| Source changes, incomplete set, invalid path, or mismatching existing archive | Fails closed; does not silently overwrite the conflicting archive or delete sources |
| Interrupted copy | May leave `.pending-UUID`; it is not a completed cycle. Robert should inspect it with the private operation record and preserve it until its status is resolved |
| Archive/index failure after planning | Working files may exist, but parent success is blocked. Use the last valid CURRENT.md set; do not assume newer files form a completed cycle |
| Index repair | Robert/operator verifies finalized manifest hashes and lineage before restoring links. A controlled snapshot of an already-accepted set may rebuild an index; it is not permission to rerun research with an expired approval |
| Legacy flat Archive files | Remain historical. They are not automatically imported into the new manifest/index system |

Copies are retained **indefinitely**, with no expiry or deletion job. The previous legacy archive trigger/age rule was not recoverable from deployed workflows, cron/User Scripts or retained migration records. The repair adopted completion-based copying and non-destructive retention; this should not be described as restoration of a proven old age threshold. Future expiry, storage limits, review-note retention and any automatic approval consumer remain unresolved design decisions requiring separate work. Completed archive directories are immutable by operating policy and read-only for Leigh, not a filesystem write-once guarantee against Robert or the service.

The authenticated SMB/copy-preservation gate and inactive synthetic n8n archive handoff passed in the earlier repair. The first Monday production run with the hook and a host reboot have not yet occurred. This guide's checks read paths, definitions and links only; they do not repeat pipeline execution or archive operations.

## Leigh's practical walkthrough

1. Open `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin`. Sign in as `leigh`. If an old window still reports access denied, disconnect and reconnect Shared to refresh the repaired group membership. Use the IP-based path if the hostname does not resolve.
2. Open **Content-Pipeline-Architecture.html** in a browser, or its PDF for printing. START-HERE.md links to both. For work on a cycle, open **CURRENT.md** and check its completion time. This points to preserved copies, so the next scheduled run cannot replace the files you are reviewing.
3. Open the linked **linkedin-editorial-plan-model-eval-DATE.md** first, then **content-brief-model-eval-DATE.md** to inspect the evidence and cited sources. Markdown is plain text; a Markdown viewer improves formatting but is not required. JSON files are for detailed structured evidence, not documents to rewrite. Read the theme TXT only for topic context.
4. Create a file under `\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews`, for example `2026-10-07-review.md` or a Word document. Record the cycle directory/hash, exact source filenames, topic, requested wording changes, source-check result, webinar-overlap decision, reviewer/date and approval or rejection. A review-file date alone is not enough to distinguish same-day reruns.
5. Save proposed text and approvals in that review file. Do not replace the generated plan/JSON or copy private transcript details into a content draft. An “approved” note is a human record only: **automation does not consume review files**, start drafting, or post to LinkedIn.
6. For an older cycle, open `\\Iggy-Nas\Shared\ContentPipeline\output\Archive\ias-linkedin`. Choose a finalized date/hash directory, check its manifest/completion time and open its plan and brief. Ignore `.pending-*`. If several sets share a date, use their different hashes and your review's recorded cycle reference. Very old flat archives are one level higher at Archive and may not have manifests.
7. If CURRENT.md is older than expected, report the timestamp to Robert. Do not promote a file from a test folder or trigger an ad hoc rerun to make it look current. Robert can inspect the failed stage while review continues on the last complete set.

## Design assessment

| Separation or leftover | Assessment | Future consolidation consideration |
| --- | --- | --- |
| Original Transcripts versus ContentPipeline | Justified: sources retain identities/metadata and are mounted read-only into n8n; downstream web research consumes anonymized derivatives | Keep the source/content boundary |
| Krisp-API versus Krisp | Justified while API intake and legacy fallback coexist | Retained shadows may eventually be deduplicated only after collector/OMC references, hashes and retention are resolved; no manual moving |
| One current ias-linkedin namespace | Justified: isolates explicit production paths from old flat wildcard/evaluation files | A separate folder per processing stage is not currently required; filenames/proofs express stage boundaries |
| Working outputs versus completed archive copies | Justified: permits reruns without replacing reviewed evidence | Keep copy/index distinction; choose expiry/storage policy separately |
| Reviews versus generated files | Justified: protects hashes and keeps human decisions distinct from automated proof | A future approval consumer would need its own schema and explicit trigger; none exists now |
| Synthetic acceptance versus real-privacy evaluation | Justified: synthetic checks and sensitive real-source evaluation have different privacy needs | Preserve isolation even if operator tooling is unified |
| Separate orchestration fixtures | Its isolation is justified; the standalone top-level name reflects the historical test implementation | Could join a managed test namespace after references/evidence are inventoried |
| archive-check, archive-check-final, archive-check-release | Historical iterations, not three documented enduring design roles | Candidates for a documented validation-evidence retention scheme; not cleanup targets today |
| Old flat outputs, Qwen quality variants and model traces | Historical leftovers from previous/evaluation workflows, not current handoffs | Classify provenance, sensitivity and consumers before any relocation; traces are not automatically public-safe |
| omc-krisp compatibility helper | Existing inactive-workflow reference explains its retention | Could be retired with a deliberate legacy rollback-policy change; it is not the active selector |
| Old meeting-named source folders | Retained imports outside current selector; exact original writer/rationale is unrecovered | No invented processing role or implied deletion permission |
| Helper code mixed with current documents | Functional existing deployment choice: commands resolve helper paths under the mounted output area | A service-only code mount may be cleaner later, but would require deployment/path changes; none made here |
| model-eval filenames and inactive workflow display names | Compatibility/history, not accurate user-facing state labels | Renaming could improve clarity, but requires updating regexes, handoffs and rollback references together |

No folder was created, moved, merged or removed for this documentation task. Only guide files and documentation links are deployed into the existing starting location.

## Live state and reconciled records

The live instance has three published stages despite “inactive” in their display names. San is the sole enabled content clock: **Monday 07:00 America/New_York**, cron `0 7 * * 1`. Enr's stored Monday 09:00 and Plan's Monday 10:00 schedules are disabled/disconnected; waiting parent calls invoke them. The next scheduled start is October 12, 2026 at 11:00 UTC. LinkedIn posting remains disabled.

| Workflow ID | Published version observed October 7 | Role |
| --- | --- | --- |
| `IASLinkedinSan01` | `0f5efe7d-b8ff-4547-8910-35ab7ecc1049` | Selector, extraction/privacy approval and waiting enrichment call |
| `IASLinkedinEnr01` | `70e431c0-d9b7-4a0d-a3b6-576b4d0ec7ac` | Approved themes, Brave research, candidates and waiting planner call |
| `IASLinkedinPlan1` | `acfd5d24-452d-42aa-af06-96cabe56b6b3` | Editorial plan and verified archive/index completion |

Earlier repository statements that all IAS copies are inactive describe migration preparation, not this deployed state. Git JSON templates still intentionally have inactive/disconnected clocks; they are not runtime-state exports. The original OMC-krisp selector reference belongs to the preserved inactive sanitizer, while live San uses `/data/output/ias-linkedin/select-transcripts.cjs`. The top-level activation snapshot in content-pipeline-state.json records the original planner publication; its later contentUsabilityRepair section records the current version above. The output date and UTC archive date are both correct. The earlier repair prose described the approval as already expired; its live timestamp instead sets the expiry to October 8 at 01:49:45.270 UTC. Its stored state can remain “approved” after that time while the helper rejects it as stale.

Repository references below support the current trace and distinguish historical records. Live mounts, workflow exports, helper behavior, current index/manifest, directory permissions and Samba share configuration take precedence when older prose conflicts.

- [Applied content access and archive record](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/ops/n8n/Content-Usability.md)
- [Sanitized focused acceptance](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/ops/n8n/content-usability-20261007/acceptance.json)
- [Current state and subsequent repair metadata](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/ops/n8n/content-pipeline-state.json)
- [Transcript intake and identity repair](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/ops/n8n/krisp-api-repair-20261007/README.md)
- [Cutover history and applied publication](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/n8n/linkedin/Cutover.md)
- [Archive implementation](https://github.com/rkigara-prog/iggii-ai-stack/blob/main/n8n/linkedin/archive-artifact.cjs)
