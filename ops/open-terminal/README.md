# Open Terminal deployment

Runs on Unraid Iggy-Nas as localai-open-terminal.
Installed version is 0.14.0. image-id.txt pins the image digest.

Host configuration directory is /mnt/app_pool/appdata/localai-open-terminal.
runtime.env holds OPEN_TERMINAL_API_KEY and remains outside Git.
Start-OpenTerminal.sh requires the existing workspace volume.

The localai-open-terminal-home Docker volume mounts at /home/user.
Its current host location is
/var/lib/docker/volumes/localai-open-terminal-home/_data.
Back up this volume separately from the host configuration directory.

The container uses the localai-terminal bridge network without a
published host port. Outbound network access is available.
Limits are 2 CPUs, 4 GiB memory, and 512 processes.
The host does not support Docker swap limits.

WebUI connects through its Admin Integrations Open Terminal entry at
http://localai-open-terminal:8000 using Bearer authentication.
Select Local Terminal in a chat to expose its tools.
This deployment has one shared workspace, not per-user isolation.
Access restrictions require verification before household rollout.

## Validation on 2026-10-06

- WebUI reached the terminal health endpoint.
- Native terminal commands and file write/read operations passed.
- The test file survived terminal restart and container recreation.
- WebUI recreation preserved its terminal network connection.
- WebUI version API returned 0.11.4 after recreation.

Pyodide Code Interpreter was tested separately.
A full backup restore test remains pending.

## Operations

The startup script creates a new container and requires its name
to be available. Preserve the workspace volume during recreation.
WebUI's startup script reconnects it to localai-terminal.
The root-stack GitHub Actions workflow does not deploy these scripts.
