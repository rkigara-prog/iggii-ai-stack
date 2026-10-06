# Private HTTPS and voice access

Preferred WebUI address is https://ai.iggii.com.
OPNsense internal DNS resolves this name to 192.168.113.18.

Caddy runs on Unraid as localai-caddy.
It publishes TCP 443 on 192.168.113.18 and proxies to
http://192.168.113.18:3002.
HTTP redirects are disabled to preserve Unraid's existing port 80 listener.

The image contains the Cloudflare DNS provider.
Build inputs are recorded in build-pins.env.
Run Build-Caddy.sh to rebuild from those inputs.
image-id.txt records the deployed local image ID.
A rebuild can produce a different image ID. Update the deployment image
reference deliberately after reviewing the rebuilt image.

## Deployment

Host directory is /mnt/app_pool/appdata/localai-caddy.
Start-Caddy.sh requires the container name to be available.
It reads image-id.txt and runtime.env from the host directory.
Caddyfile, data, and config are bind mounted from that directory.

runtime.env contains CF_API_TOKEN and remains outside Git.
The token is scoped to the iggii.com zone with DNS Edit and Zone Read.
Certificate keys, account keys, and autosaved configuration remain private.
Preserve the data and config directories during container replacement.

The root-stack GitHub workflow does not deploy this standalone service.

## Network scope

Certificates use Let's Encrypt DNS-01 validation through Cloudflare.
No public address record, inbound forwarding, or public tunnel was added
for this deployment. Public access is outside the intended scope.
Certificate issuance does not establish public application reachability.
Public certificate transparency records can disclose the hostname.

## WebUI settings

The external WebUI runtime.env contains these non-secret values.

WEBUI_URL=https://ai.iggii.com
CORS_ALLOW_ORIGIN=https://ai.iggii.com;http://ai.iggii.com:3002;http://192.168.113.18:3002

The existing HTTP listener on LAN port 3002 remains available.
Settings and credentials in WebUI persistent data remain outside Git.

## Acceptance on 2026-10-06

Caddy obtained a trusted certificate through DNS-01.
HTTPS certificate verification and the version API passed.
The user confirmed the browser reported a secure connection.
Microphone transcription and speech playback worked.
Server-side Kokoro playback and personal voice changes passed.
See ../kokoro/README.md for speech configuration.

Certificate renewal and recovery after a host reboot have not been tested.
