# iggii-ai-stack

Infrastructure for routing chat/research requests across OpenAI (ChatGPT
API), Anthropic (Claude API), and local Ollama models, plus SSH-triggered
coding automation (Claude Code / Codex) on the always-on workstation.

This repo is **separate from OMC** (Outlook Multi-Context Automation).
OMC keeps handling confidential/regulated data with Ollama-only
processing and is not touched by anything here. See the architecture
doc for the full design and the confidentiality boundary rationale.

## What's here

- `docker-compose.yml` — LiteLLM proxy service (deployed on the Unraid
  server, alongside the existing n8n/OMC stack).
- `litellm/config.yaml` — model routing + fallback rules.
- `.env.example` — reference for what secrets are needed. Real values go
  in `/mnt/user/appdata/iggii-ai-stack/secrets.env` on the Unraid box —
  **never** in this repo.
- `n8n/` — exported n8n workflow JSON for this stack (backup/version
  control only; the workflows live in the same n8n instance as OMC's).
- `.github/workflows/deploy.yml` — on push to `main`, a self-hosted
  runner on the Unraid server runs `docker compose pull && up -d`.

## First-time deploy setup (Unraid server)

1. Create `/mnt/user/appdata/iggii-ai-stack/secrets.env` from
   `.env.example`, filled in with real keys. Never commit this file.
2. Set up the self-hosted runner — see `ops/runner/README.md`.
   **Do not use GitHub's generic tarball instructions directly** — they
   don't survive an Unraid reboot. This is a containerized,
   appdata-convention setup instead.
3. Push to `main` — the runner picks it up and brings the stack up.

## Status

Early scaffold — LiteLLM proxy only so far. n8n routing workflows,
Azure OpenAI / AWS Bedrock as additional providers, and the OMC-visibility
decision (whether OMC's Ollama calls can safely go through this proxy)
are still open, tracked in the setup checklist.
