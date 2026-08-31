# Self-hosted runner (Unraid)

Do not use GitHub's generic "Settings → Actions → Runners → New
self-hosted runner" tarball instructions as-is — they install the runner
as loose files wherever you happen to run them, with no persistence
story. Unraid's root filesystem is rebuilt from the boot flash drive on
every reboot, so anything installed that way disappears on restart.

This folder runs the runner as a Docker container instead, bind-mounted
under `/mnt/user/appdata/github-runner/` like every other service on this
box, using the `myoung34/github-runner` image (a maintained community
image built exactly for this).

## One-time setup

1. `mkdir -p /mnt/user/appdata/github-runner/work`
2. Copy this folder's `docker-compose.yml` to
   `/mnt/user/appdata/github-runner/docker-compose.yml`.
3. Copy `runner.env.example` to
   `/mnt/user/appdata/github-runner/.env`, fill in `ACCESS_TOKEN` with a
   **separate** fine-grained PAT (Administration: read/write, scoped
   only to this repo — see the comments in that file for why it's kept
   separate from the deploy token).
4. `cd /mnt/user/appdata/github-runner && docker compose up -d`
5. Confirm it registered: repo → Settings → Actions → Runners should
   show `unraid-runner` as Idle.

## If `docker compose up -d` fails inside a workflow run

The runner container talks to the *host's* Docker daemon over the
mounted socket, not a nested one — check `docker compose version`
inside the running container. If the plugin isn't present, this image
may need a different tag; check the image's tags on Docker Hub for one
that bundles the Compose v2 plugin.

## Why this isn't part of the auto-deploy pipeline

`.github/workflows/deploy.yml` only runs *on* a registered runner — it
can't be the thing that creates the runner. This one piece is manual,
once. Everything downstream of it (LiteLLM today, more services later)
deploys automatically from then on.
