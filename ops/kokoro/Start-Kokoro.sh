#!/bin/bash
set -eu
base=/mnt/app_pool/appdata/localai-kokoro
image_id=$(cat "$base/image-id.txt")

docker network inspect localai-audio >/dev/null 2>&1 ||
  docker network create localai-audio

docker run -d \
  --name localai-kokoro \
  --label localai.managed=kokoro-v0.1.0 \
  --restart unless-stopped \
  --network localai-audio \
  --cpus 4 \
  --memory 4g \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "$image_id"
