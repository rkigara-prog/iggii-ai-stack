#!/bin/bash
set -eu
base=/mnt/app_pool/appdata/localai-open-terminal
image_id=$(cat "$base/image-id.txt")
test -s "$base/runtime.env"

docker network inspect localai-terminal >/dev/null 2>&1 ||
  docker network create localai-terminal
docker volume inspect localai-open-terminal-home >/dev/null

docker run -d \
  --name localai-open-terminal \
  --label localai.managed=open-terminal-v0.1.0 \
  --restart unless-stopped \
  --network localai-terminal \
  --cpus 2 \
  --memory 4g \
  --pids-limit 512 \
  --mount type=volume,src=localai-open-terminal-home,dst=/home/user \
  --env-file "$base/runtime.env" \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "$image_id"
