#!/bin/bash
set -eu
cd "$(dirname "$0")"
. ./build-pins.env

docker build \
  --build-arg BUILDER_IMAGE="$BUILDER_IMAGE" \
  --build-arg RUNTIME_IMAGE="$RUNTIME_IMAGE" \
  --build-arg CADDY_VERSION="$CADDY_VERSION" \
  --build-arg CLOUDFLARE_COMMIT="$CLOUDFLARE_COMMIT" \
  -t localai-caddy:0.1.0 .
