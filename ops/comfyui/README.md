# Local image generation

## Deployment

ComfyUI runs on Ubuntu iggy-ai at 192.168.113.32.
Container is localai-comfyui.
Compose file is /srv/localai/deploy/comfyui.compose.yaml.
The Intel Omni image is pinned by digest in docker-compose.yml.

Persistent storage is /srv/localai/comfyui.
Models are mounted read-only; input, output, and user directories are writable.
The SDXL Base 1.0 checkpoint belongs under models/checkpoints.
model-manifest.json records its source revision and verified SHA-256.
Model weights and generated images remain outside Git.

GPU selection is ZE_AFFINITY_MASK=1.
Dynamic VRAM is disabled. Smart-memory retention and node caching are disabled.
ComfyUI reserves 2 GiB of headroom through its memory-management setting.
These controls are not hard GPU memory partitions.

Home-chat uses both GPUs with gpu-memory-utilization=0.55.
Its context remains 131072 tokens and max-num-seqs remains 2.
Startup reported 5.64 GiB KV cache per GPU and estimated 4.40x
full-context cache concurrency. This is not a throughput measurement.

## Open WebUI settings

Image Generation enabled.
Engine ComfyUI.
Base URL http://192.168.113.32:8188.
API key blank.
Model sd_xl_base_1.0.safetensors.
Image size 1024x1024.
Steps 25.

workflow-api.json records the effective generation workflow.
WebUI node mappings are:
- Prompt: key text, node 6
- Model: key ckpt_name, node 4
- Width: key width, node 5
- Height: key height, node 5
- Steps: key steps, node 3
- Seed: key seed, node 3

WebUI settings reside in its persistent data.
Image editing has not been configured.
The ComfyUI endpoint has no API authentication and is bound to the LAN address.
No public access was configured.

## Acceptance on 2026-10-06

The user confirmed successful image generation from Open WebUI and
a successful home-chat response during generation.
Full-context chat during image generation, sustained load, and recovery
after a host reboot remain untested.

The root-stack GitHub workflow does not deploy this Ubuntu service.
