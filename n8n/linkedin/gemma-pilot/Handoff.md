# Gemma drafting pilot handoff

**Prepared, not activated.** The new manual n8n workflow and isolated worker are on
the development branch. Nothing was imported into n8n or connected to the Monday
pipeline. Home-chat, OMC, household services and disabled publishing are unchanged.

The pilot pins PR #21's **Gemma 4 31B IT Q4_0** artifact, SHA256
`031dc1c5fa9c5a0abbf3c39c5173fb2af65f5ac2dc2a090268561d3c72dcd834`.
It carries human-approved public claims, attribution, exact passages, URLs and
source judgments into writing. The existing evidence rules and single-source
exceptions remain intact. Complete-prose review catches assertions omitted from
the writer's claim list. Every result is a human-review draft; no publisher exists.

**Resource plan:** one request at a time, GPU0 with 24 offloaded layers, 16,384
context, four CPU threads and unload after each request. PR #21 measured 8.728 GiB
additional GPU memory, 22.705 GiB process RSS and 224.065 seconds median writing
latency. Queue and memory guards defer/cancel the pilot for household work. This
partial-offload option requires **no planned production outage** if headroom passes.
Full-GPU operation would require a separate maintenance decision affecting chat/OMC.

**Saved failure diagnosis—no benchmark rerun:**

| Assessment outcome | home-chat | Qwen |
|---|---:|---:|
| Budget exhausted at exactly 3,072 output tokens | 27 | 18 |
| Transport timeouts / request runtime errors | 0 / 0 | 0 / 0 |
| Completed responses with schema failures | 2 | 0 |

Home-chat's two schema failures were invalid claim-form enums. Qwen's earlier
checkpoint exit `-15` records were planned handoffs, not the cause of its eighteen
incomplete assessments. Thinking budgets and ambiguous origin-count wording limit
the diagnosis; larger budgets were not tested.

**Remaining activation decision:** after Robert and Leigh's blind review, approve
or decline a bounded, manual Gemma writing pilot. Activation then needs its restricted
SSH key/host pin, temporary device access with rollback, an explicitly enabled private
activation file, and one approved public packet. None is enabled now. Live SSH/model
execution remains untested; focused offline and mocked integration checks passed.

Use [the runbook](Runbook.md) for exact routing, installation, limits and rollback;
[workflow.json](workflow.json) is the prepared import. Future drafts open at
`\\Iggy-Nas\Shared\ContentPipeline\output\ias-linkedin\Reviews\Gemma-Pilot\<requestId>.draft.html`.
That folder is not created yet. Blind materials are unchanged; the existing
20:51:03 UTC access rollback and 20:52 confirmation remain scheduled unchanged.
