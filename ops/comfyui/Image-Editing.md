# Local image editing

SDXL remains the image-generation model.
Image editing uses FLUX.2 Klein 4B FP8 through the existing ComfyUI service.

The model manifest records download revisions and verified SHA-256 hashes.
Model weights remain outside Git.

## Workflow

Import workflow-edit-klein-api.json into WebUI's Image Editing settings.
Select flux-2-klein-4b-fp8.safetensors as the editing model.
Use the existing ComfyUI endpoint and 1024x1024 image size.

Mappings

- Image uses image on node 10.
- Prompt uses text on node 6.
- Model uses unet_name on node 4.
- Width uses width on node 11.
- Height uses height on node 11.

The workflow uses four sampling steps and CFG 1.
The Qwen text encoder runs on CPU to preserve GPU headroom.
WebUI settings reside in its persistent data.

## Acceptance on 2026-10-06

A WebUI edit added snow to the ground, banks, and trees while retaining
the fox, stream, and watercolor appearance. The user accepted the result.
The user confirmed home-chat responded during editing.

The earlier SDXL editing workflow did not meet visual acceptance.
Full-context concurrent chat, sustained load, and reboot recovery were
not tested as part of this milestone.

The root-stack GitHub workflow does not deploy this Ubuntu service.
