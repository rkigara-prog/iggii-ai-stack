ARG BUILDER_IMAGE=caddy:2-builder
ARG RUNTIME_IMAGE=caddy:2
FROM ${BUILDER_IMAGE} AS builder
ARG CADDY_VERSION
ARG CLOUDFLARE_COMMIT
RUN xcaddy build "${CADDY_VERSION}" \
    --with "github.com/caddy-dns/cloudflare@${CLOUDFLARE_COMMIT}"
FROM ${RUNTIME_IMAGE}
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
