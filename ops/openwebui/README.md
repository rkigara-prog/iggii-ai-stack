# Open WebUI deployment

## Current deployment

- Host is Unraid Iggy-Nas, 192.168.113.18.
- URL is http://192.168.113.18:3002.
- Container is localai-open-webui.
- Version is 0.11.4. The immutable image reference is in image-id.txt.
- Deployment directory is /mnt/app_pool/appdata/localai-open-webui.
- Persistent data is the data subdirectory, mounted at /app/backend/data.
- Credentials remain in runtime.env outside Git.
- Portainer displays this standalone container with no Stack association.
- GitHub Actions deploys the root stack, not these scripts.

These scripts record the existing host configuration. Start-OpenWebUI.sh
creates a container and requires the name to be available. Stop-OpenWebUI.sh
stops and removes that container after checking its management label.
It preserves persistent data.

## Validation on 2026-10-06

Container health and the version API passed. A fresh home-chat response
completed without a reasoning preamble. Existing chat history preservation
still needs user confirmation. Actual tool execution remains untested.

## Recovery checkpoint

Backup directory:
/mnt/app_pool/appdata/localai-backups/openwebui-20261006-113034

The stopped application's directory was archived to openwebui.tar and
compared against the source files. A SHA-256 checksum was saved.
This was a file comparison, not a full application restore test.

The backup includes runtime.env and must remain private.
container-inspect.json and old-image-id.txt are stored beside the archive.

The old container is retained as localai-open-webui-rollback-v0113
with its restart policy disabled.

## Rollback procedure

Run on Unraid during a maintenance window.

1. Verify the archive checksum using the saved checksum file.
2. Stop the new localai-open-webui container.
3. Rename it to an unused failed-upgrade name and disable its restart policy.
4. Move the current deployment directory to an unused recovery directory.
   Preserve it for investigation and any post-update chat recovery.
5. Re-create the original deployment directory and extract openwebui.tar
   into it as root, preserving ownership and permissions.
6. Rename localai-open-webui-rollback-v0113 to localai-open-webui.
7. Restore its unless-stopped restart policy and start it.
8. Verify container health, version 0.11.3, login, history, and chat.

Restore pre-update data before starting the old image. Do not run the old
image against a potentially migrated database. Rolling back to this
checkpoint excludes chats and settings created after the backup.

## Follow-up

Review CORS_ALLOW_ORIGIN, which currently emits a wildcard warning.
Keep any credentials, data, and backup archives outside Git.
