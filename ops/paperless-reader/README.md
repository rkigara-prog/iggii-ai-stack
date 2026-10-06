# Paperless Reader milestone

## Deployment

Unraid container localai-paperless-reader provides authenticated,
read-only document search and text retrieval through an OpenAPI service.
Paperless remains the source of documents; no separate library is copied.

Runtime directory is /mnt/app_pool/appdata/localai-paperless-reader.
paperless-token.txt and service-key.txt remain outside Git.
The service runs as UID/GID 10001 with read-only secret mounts.
Runtime image-id.txt pins the locally built image by Docker image ID.

Build from this directory's Dockerfile and server.py, passing the digest
in base-image.txt as the BASE_IMAGE build argument. Record the built
image ID in the runtime directory before using Start-PaperlessReader.sh.
The script requires the container name to be available.

The localai-paperless network connects the reader and Open WebUI.
The reader publishes no host port. WebUI's startup script restores its
network attachment after recreation.
Paperless is reached at http://192.168.113.18:8001.

## Access and WebUI configuration

Paperless service account webui-reader has document view access.
The authenticated API reported 1624 accessible documents during setup.
A Paperless workflow grants this account view access to new documents.

WebUI integration URL is http://localai-paperless-reader:8080.
OpenAPI specification path is openapi.json.
Bearer authentication uses service-key.txt, not the Paperless token.
Integration access is restricted to paperless-readers for Robert and Leigh.
Paperless Reader is bound to home-chat as a default tool.
These WebUI settings reside in its persistent data.

## Acceptance on 2026-10-06

Paperless search and document-read tools were invoked across messages.
A conversation exceeded the former 32768-token inference limit.
Home-chat was changed to tensor parallel size 2, GPU selection 0,1,
and maximum context 131072 using the existing pinned inference image.

Both GPU workers initialized. Each reported 9.69 GiB of model weights
and 15.21 GiB of KV cache. Server startup completed.
The user confirmed the previously failing conversation completed after
the change. Full 128K performance and concurrent long chats were not measured.

The excerpt-reduction proposal was withdrawn in favor of more context.
Leigh access and exclusion of other household users remain unverified.
The reader lifecycle script is recorded but has not been recreation-tested.
The root-stack GitHub workflow does not deploy this standalone service.
