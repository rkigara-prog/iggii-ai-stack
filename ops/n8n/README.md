# n8n mount-access readiness

The n8n container runs as UID/GID 1000. The existing Unraid transcript and output
bind mounts are owned by UID 99/GID 100, with mode 2770. The persistent n8n data
mount is owned appropriately for UID 1000. Changing n8n's primary user or taking
ownership of the shared mounts would be unnecessary and broader than this fix.

## Exact pending change

Add supplementary GID 100 to n8n, retaining UID/GID 1000. The stored Portainer
stack 12 manifest already has `group_add: ["100"]`, but the running container's
`HostConfig.GroupAdd` is empty. A container recreation is required to apply this;
restarting the same container is insufficient.

The stored manifest also references an image different from the running one.
The prepared manifest replaces only that image reference with the currently
running image's immutable repository digest:

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
stored privately outside Git. Every other parsed field is unchanged, including
all three mounts, read-only transcript access, port 5678, environment values,
restart policy and `n8n_default` network. No image upgrade/downgrade is proposed.

Stored manifest path on Unraid:
`/mnt/app_pool/appdata/portainer/compose/12/docker-compose.yml`.
Proposed manifest: `/tmp/ias-readiness/n8n-compose-proposed.yaml`.

| Manifest | SHA-256 |
| --- | --- |
| Original | `8c1128d3cab297c606c34df168d81ecae6b5fb3a5576e842707a49da8cf8b1f0` |
| Proposed | `89ba7f5a33da6761c3fe2c33a618ebedfd629e8ffcbdd477675526ed3a71e55d` |

The proposed manifest passed `docker compose config --quiet`. A transient
`docker exec --user 1000:100` process verified read/traverse access to both shared
mounts. These checks do not yet prove UI task-runner access after recreation.

## Apply only after explicit approval

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

This briefly interrupts n8n. No command above has been applied. The proposal
requires approval for that production recreation.

## Validate and roll back

After approval/recreation, verify: the running image ID matches the pre-change ID;
`GroupAdd` contains `100`; all original bind mounts, read-only flags and ports
match; the regular container process can read the selector/transcript roots and
write/remove a probe only inside its isolated acceptance directory; the UI and
JavaScript task runner complete an inactive manual file-access probe; all original
workflow definitions and activation states match their pre-change fingerprints.
Do not activate a migration workflow during validation.

If validation fails, restore the pre-change running configuration from the private
Docker inspection snapshot (the prior stored manifest alone has a stale image pin
and does not describe the running container). Retain the current image digest and
original mounts/env/network, remove only the added group, and recreate n8n again
within the approved maintenance action. Restore the stored manifest separately.
Do not change shared-file ownership or permissively open the transcript mount.
