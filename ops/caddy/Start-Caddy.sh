#!/bin/bash
set -eu
base=/mnt/app_pool/appdata/localai-caddy
image_id=$(cat "$base/image-id.txt")
test -s "$base/runtime.env"

docker run -d \
  --name localai-caddy \
  --label localai.managed=caddy-v0.1.0 \
  --restart unless-stopped \
  --network bridge \
  --publish 192.168.113.18:443:443 \
  --env-file "$base/runtime.env" \
  --mount type=bind,src="$base/Caddyfile",dst=/etc/caddy/Caddyfile,readonly \
  --mount type=bind,src="$base/data",dst=/data \
  --mount type=bind,src="$base/config",dst=/config \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "$image_id" \
  caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
