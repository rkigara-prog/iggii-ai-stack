# LinkedIn content: start here

Open **\\\\Iggy-Nas\\Shared\\ContentPipeline\\output\\ias-linkedin** in File Explorer.
If the name does not resolve, use **\\\\192.168.113.18\\Shared\\ContentPipeline\\output\\ias-linkedin**.
On a Mac: **smb://192.168.113.18/Shared/ContentPipeline/output/ias-linkedin**.
Sign in with your existing Shared account: Robert uses `rigarashi`; Leigh uses `leigh`. If a window that was already open still reports access denied, disconnect and reconnect the Shared share to refresh its group membership.

1. Open **CURRENT.md**. It identifies the latest completed cycle and links to its preserved files. A completed cycle may be old if a newer run has failed; check its timestamp.
2. Read **linkedin-editorial-plan-model-eval-DATE.md** for recommended topics, editorial angles, source links and webinar review. Read **content-brief-model-eval-DATE.md** for the supporting research. The `.json` partners are machine records; the theme `.txt` is the anonymized input to research.
3. Put edits, webinar/source review and approvals in **Reviews**, using a file such as `2026-10-07-review.md` or your preferred document format. Identify the CURRENT.md cycle, topic, reviewer, requested changes and decision. Both Robert and Leigh can edit these review documents. Keep generated files unchanged so their evidence and hashes remain reliable.
4. Approval records are manual editorial decisions. They do not start another workflow or publish a post. Resolve webinar overlap and verify cited sources before drafting. LinkedIn posting remains disabled.

The dated files directly in this folder are working production outputs. They may be replaced during a run. CURRENT.md links to a verified archive copy of the last complete set so review can continue while the pipeline runs. Helper `.cjs` files and `*-status.json` files are service internals; do not edit them.

Completed sets are preserved at **../Archive/ias-linkedin**, one directory per distinct set with a checksum manifest. Archives are retained indefinitely and are read-only for Leigh. Ignore `.pending-*` directories: those are incomplete copies requiring operator recovery. Existing files in **../Archive** are historical archives and remain untouched. Archiving copies all five outputs, verifies the copies and leaves working outputs in place. It never archives or deletes source transcripts.

The parent `output` folder contains older flat production/evaluation outputs, including Qwen evaluation variants. Those are retained history, not the current pipeline. `ias-linkedin-acceptance`, `ias-linkedin-real-privacy` and `ias-orchestration` are test/evaluation areas, not folders to use for editorial decisions. These private test areas were not opened to additional users.

Source transcripts remain in **Shared/Transcripts/Krisp-API** (canonical API intake) and **Shared/Transcripts/Krisp** (legacy and retained API shadows). Do not move, rename or edit them: the collector and OMC depend on their identities and metadata. The selector prefers API copies and uses meeting dates.

The weekly chain starts Monday at **07:00 America/New_York**: transcripts → anonymized themes/privacy gate → Brave research and evidence checks → editorial plan → verified archive/index. The research/planner stages have no separate enabled clock. A gate failure stops the chain; CURRENT.md continues to identify the last complete archived set.
