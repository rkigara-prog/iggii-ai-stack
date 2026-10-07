# n8n mount-access readiness

The n8n container runs as UID/GID 1000. The existing Unraid transcript and output
bind mounts are owned by UID 99/GID 100, with mode 2770. The persistent n8n data
mount is owned appropriately for UID 1000. Changing n8n's primary user or taking
ownership of the shared mounts would be unnecessary and broader than this fix.

## Applied change — 2026-10-07 UTC

The approved recreation added supplementary GID 100 to n8n, retaining UID/GID 1000. The stored Portainer
stack 12 manifest already has `group_add: ["100"]`, but the running container's
`HostConfig.GroupAdd` was empty. A container recreation is required to apply this;
restarting the same container is insufficient.

The stored manifest referenced a different image. The applied manifest pins the
existing image's immutable repository digest:

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n@sha256:ffeb52485f78b1b06c9a832205853cf75da72a07a514c9a27724df85979d6c34
    group_add:
      - "100"
```

[mount-access.override.yaml](mount-access.override.yaml) is a secret-free review
artifact for these effective settings. Do not use it alone to create a container.
The full original/proposed manifests contain existing environment secrets and are
stored privately outside Git. The applied manifest also explicitly preserves the former runtime environment and
capabilities. Effective configuration is preserved, including
all three mounts, read-only transcript access, port 5678, environment values,
restart policy and `n8n_default` network. No image upgrade/downgrade occurred.

Stored manifest path on Unraid:
`/mnt/app_pool/appdata/portainer/compose/12/docker-compose.yml`.
Applied private manifest: `/tmp/ias-readiness/n8n-compose-applied.yaml`.

| Manifest | SHA-256 |
| --- | --- |
| Original | `8c1128d3cab297c606c34df168d81ecae6b5fb3a5576e842707a49da8cf8b1f0` |
| Initially proposed | `89ba7f5a33da6761c3fe2c33a618ebedfd629e8ffcbdd477675526ed3a71e55d` |

The initially proposed manifest passed `docker compose config --quiet`. A transient
`docker exec --user 1000:100` process verified read/traverse access to both shared
mounts. Those preliminary checks were followed by the completed normal-user probe below.

## Approved application

1. Recheck current manifest/image/group/mount/env fingerprints and active executions.
   If any have changed, regenerate and review the proposal instead of overwriting.
   Wait for executing production workflows to finish; never terminate them.
2. Save the current manifest and pre-change workflow/mount fingerprints privately.
3. Replace the stored manifest with the exact proposed file, preserving its original
   file ownership and permissions. This also persists the current-image pin for
   subsequent Portainer deployments. Do not change Portainer's secrets or stack data.
4. Run on Unraid:

```bash
docker compose --project-name n8n \
  --file /mnt/app_pool/appdata/portainer/compose/12/docker-compose.yml \
  up --detach --no-deps --pull never --force-recreate n8n
```

The user explicitly approved the production recreation. The command was applied
after confirming no new/running executions and no configuration drift. Verification
found that Compose inherited a different `NODE_VERSION` environment value from the
image and omitted explicit capability settings. A second recreation within the
approved maintenance preserved the original environment value and capability sets.
The final private manifest passed Compose validation; its SHA-256 is
`7f15d97d1469057553ff484a183cff53230a6c1c34abbe93067e7deddacf312b`.
No other service was restarted. Docker reports equivalent bind modes, null/empty
optional settings and `CAP_` capability names differently after Compose recreation;
verification compared their effective meanings.

## Validation results and rollback

The completed verification confirmed: the running image ID matches the pre-change ID;
`GroupAdd` contains `100`; all original bind mounts, read-only flags and ports
match; the regular container process can read the selector/transcript roots and
write/remove a probe only inside its isolated acceptance directory; the normal workflow engine and
JavaScript task runner completed the inactive manual file-access probe; all original
workflow definitions and activation states match their pre-change fingerprints.
All 29 pre-existing definitions, connections, settings and activation states matched.
The only added workflow is the inactive mount probe. Default UID/GID 1000 with
supplementary group 100 opened/closed 17 eligible transcript files without reading
their contents. The file node read a benign isolated JSON marker, the JavaScript
runner validated it, and the final node removed it. HTTP `/healthz` returned 200.
The probe ran via CLI with a separate task-runner broker port; an authenticated
browser click was not performed. All IAS workflows remain inactive.

If validation fails, restore the pre-change running configuration from the private
Docker inspection snapshot (the prior stored manifest alone has a stale image pin
and does not describe the running container). Retain the current image digest and
original mounts/env/network, remove only the added group, and recreate n8n again
within the approved maintenance action. Restore the stored manifest separately.
Do not change shared-file ownership or permissively open the transcript mount.

## Content-pipeline activation — 2026-10-07 UTC

The user-approved PR #13 cutover is complete. Native API publication activated
`IASLinkedinPlan1` and `IASLinkedinEnr01` with their clocks disabled, then replaced
the original sanitizer's clock with `IASLinkedinSan01` Monday 07:00 America/New_York.
No container restart or mount/environment change was required.
[content-pipeline-state.json](content-pipeline-state.json) records the exact final
workflow/version state and verification counts. The complete rollback is in
[Cutover.md](../../n8n/linkedin/Cutover.md). Historical inactive-state statements
in the earlier mount-readiness record refer to that earlier maintenance step.

Production Krisp API intake was repaired on 2026-10-07 without workflow/schedule
changes. See [repair record](krisp-api-repair-20261007/README.md). The active helper
is `/data/output/ias-linkedin/select-transcripts.cjs`; API and legacy selection use
meeting dates. Full authenticated API/OMC/n8n input acceptance evidence is recorded
without transcript content. LinkedIn posting remains disabled.

## Current content-file access and archives — 2026-10-07 UTC

[Content-Usability.md](Content-Usability.md) records the applied SMB access and
completed-cycle archival repair. The current supplementary groups are **100 and
1800**; the image, effective environment and mounts remain unchanged. GID 1800 is
private to Robert/Leigh; helpers explicitly assign it to production outputs.
The unified authenticated SMB/current-index/archive gate passed. Use
`Shared/ContentPipeline/output/ias-linkedin/START-HERE.md` and `CURRENT.md`.
Existing connections may need reconnection. Original transcripts and archives
were preserved; no expiry/deletion or LinkedIn posting is enabled.
