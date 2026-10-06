#!/bin/bash
set -eu
base=/mnt/app_pool/appdata/localai-open-webui
image_id=$(cat "$base/image-id.txt") || exit 1
docker run -d --name localai-open-webui --label localai.managed=openwebui-v0.1.0 --restart unless-stopped --network bridge --publish 192.168.113.18:3002:8080 --mount type=bind,src="$base/data",dst=/app/backend/data --env-file "$base/runtime.env" "$image_id"
docker network inspect localai-terminal >/dev/null 2>&1 ||
  docker network create localai-terminal
docker network connect localai-terminal localai-open-webui
docker network inspect localai-extraction >/dev/null 2>&1 ||
  docker network create localai-extraction
docker network connect localai-extraction localai-open-webui
docker network inspect localai-paperless >/dev/null 2>&1 ||
  docker network create localai-paperless
docker network connect localai-paperless localai-open-webui
docker network inspect localai-audio >/dev/null 2>&1 ||
  docker network create localai-audio
docker network connect localai-audio localai-open-webui
