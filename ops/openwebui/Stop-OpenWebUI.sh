#!/bin/bash
owner=$(docker inspect --format '{{index .Config.Labels "localai.managed"}}' localai-open-webui) || exit 1
[ "$owner" = openwebui-v0.1.0 ] || exit 1
docker stop --time 30 localai-open-webui && docker rm localai-open-webui
# Appdata and runtime secret remain intact.
