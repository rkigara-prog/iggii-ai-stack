#!/bin/bash
set -eu
base=/mnt/app_pool/appdata/localai-paperless-reader
image_id=$(cat "$base/image-id.txt")
test -s "$base/paperless-token.txt"
test -s "$base/service-key.txt"
docker network inspect localai-paperless >/dev/null 2>&1 ||
  docker network create localai-paperless
docker run -d \
  --name localai-paperless-reader \
  --restart unless-stopped \
  --network localai-paperless \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges=true \
  --memory 256m \
  --cpus 1 \
  --pids-limit 64 \
  --mount type=bind,src="$base/paperless-token.txt",dst=/secrets/paperless-token.txt,readonly \
  --mount type=bind,src="$base/service-key.txt",dst=/secrets/service-key.txt,readonly \
  --env PAPERLESS_URL=http://192.168.113.18:8001 \
  --env PAPERLESS_PUBLIC_URL=http://192.168.113.18:8001 \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "$image_id"
