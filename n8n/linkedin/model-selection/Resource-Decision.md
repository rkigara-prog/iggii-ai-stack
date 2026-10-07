# Resource decision before completing the comparison

The Ubuntu access repair succeeded without changing Docker socket access, account
groups or sudoers. The same detached session can run the pinned native Intel SYCL
server. The temporary device ACL lease currently expires **8 October 2026 at
01:53:26 UTC**. All baseline calls are saved; the first alternative run is preserving
its checkpoint before requesting this decision.

## Keep services available: extend the existing device lease

The preferred option when household and OMC continuity takes priority is to allow
up to **24 more hours** for the fixed remaining comparison. Partial GPU 0 offload
runs the substantive model, but decode throughput is 4.63 tokens
per second on the completed first Qwen request (781.085 seconds total). This is not a full-GPU performance
measurement. Warm-prefix caching can reduce prompt time, not remove the CPU weight
traffic on every generated token. A simple cold-call extrapolation is about 18.4 hours for the 85 remaining calls; Gemma and warm-cache throughput are not yet measured. The run remains bounded to saved/frozen cases;
no optional model calls are added.

The prepared helper only extends the existing named-user render-device ACL lease.
It validates the original root-owned backup and current ACL, creates a new root-owned
rollback timer before stopping the old timer, and changes no permissions, services,
socket access, groups or sudoers. It refuses unexpected ACL/device changes. No
password is read or stored by it.

Run in a separate Ubuntu PuTTY session if choosing this option:

```bash
sudo /usr/bin/python3 /home/rigarashi/projects/iggii-ai-stack/n8n/linkedin/model-selection/extend-evaluation-access.py --hours 24
```

The evaluator will use the new recorded expiry, resume after saved checkpoints,
run the candidates sequentially, yield to household work and stop its own processes
at the deadline. Runtime failures remain explicit; an extension is not a promise
that every case will complete. The helper prints an exact early-rollback command.

## Faster option: an explicitly authorized production maintenance window

A **four-hour maximum** window could release production GPU memory for a full-GPU
comparison. This option has NOT been executed or authorized. It is not a production
model replacement. Completion within four hours is a projection to verify, not a
measured guarantee.

1. Confirm live home-chat/Comfy queues are idle and no content cycle is running.
   Record the exact `localai-home-chat` container ID, image, command, configuration
   hash and running state. The next Monday pipeline schedule remains unchanged.
2. OMC is affected: a read-only check of the live Windows v0.8.0.22 configuration
   confirms `work_intelligence.inference` uses `openai_local`,
   `http://192.168.113.32:8000/v1`, and `home-chat` for both primary and adjudicator.
   Do not rely on the repository's old Ollama-only description. Wait for existing
   intelligence work to finish and hold **only new inference work** using a verified
   scoped mechanism; if a mechanism cannot isolate it from calendar/background work,
   abort the window. Do not kill the unified background controller, change calendars,
   or reset jobs/data. This dependency is why releasing memory needs a user decision.
3. Establish a root-owned automatic recovery timer before stopping anything. The
   narrowly scoped privileged operation is `/usr/bin/docker stop --time 60
   localai-home-chat`; no other container is stopped. The user must expect household
   chat and OMC intelligence inference to be unavailable for the window. ComfyUI stays
   up; avoid starting image jobs around restoration to keep its shared GPU headroom.
4. Run the same two pinned artifacts one at a time on **GPU 0 only**, native SYCL,
   loopback 8017, `--n-gpu-layers 99`, one slot, 16,384 context, unchanged frozen
   prompts/packets/output budgets. Cap evaluator GPU 0 allocation at 26 GiB, free
   GPU 0 memory at 6 GiB minimum, and host available RAM at 32 GiB minimum. No private
   packets go off-host. Do not send new baseline calls or overwrite the saved partial
   offload response. Separate mixed-runtime latency records.
5. Stop only evaluator processes at completion/error or **230 minutes**, whichever
   comes first. Restore the *same existing container* with `/usr/bin/docker start
   localai-home-chat`; verify the same model/configuration and health without a new
   evaluation. Resume only the held OMC inference work, with its original settings.
   A fallback recovery timer at 240 minutes must stop the evaluator before restarting
   home-chat. Preserve incomplete checkpoints if the cap is reached.

The maintenance option requires coordinated OMC queue holding and a narrowly scoped
interactive privileged launcher; neither is installed or executed pre-approval.
The no-outage extension above is already prepared and avoids these additional changes.

## Preservation

PR #20 records the completed quotation repair, candidate discovery, protocol and
checkpoint tooling. The comparison has no deployment recommendation yet. Its two
alternatives, blind review and final scored report require a subsequent completion
change after the resource window is resolved. Home-chat is not declared the winner
because it is already installed. All production models, services and schedules remain
unchanged while this decision is pending; LinkedIn publishing remains disabled.
