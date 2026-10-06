#!/bin/bash
set -eu
owner=$(docker inspect --format '{{index .Config.Labels "localai.managed"}}' localai-kokoro)
[ "$owner" = kokoro-v0.1.0 ]
docker stop --timeout 30 localai-kokoro
docker rm localai-kokoro
