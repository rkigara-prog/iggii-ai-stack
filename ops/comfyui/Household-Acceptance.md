# Household image generation correction

## Result on 2026-10-06

Leigh can select home-chat after its access settings were adjusted.
The user confirmed successful image generation from Leigh's account
after correcting the generation workflow.

## Cause and correction

Image Generation contained the Klein editing workflow while its node
mappings still referenced SDXL. WebUI raised KeyError '3' when applying
the sampling-step value, before submitting the request to ComfyUI.

The Image Generation workflow was replaced with the SDXL API workflow.
Its model is sd_xl_base_1.0.safetensors.

Generation mappings are:

- Prompt uses text on node 6.
- Model uses ckpt_name on node 4.
- Width and height use width and height on node 5.
- Steps and seed use steps and seed on node 3.

Image Editing retains the separate Klein workflow documented in
Image-Editing.md.

## Configuration location

The active workflows, mappings, and model access settings reside in
Open WebUI persistent data. This commit records the correction; it does
not apply those settings through the root-stack deployment workflow.

The repository generation reference is workflow-api.json.
The editing reference is workflow-edit-klein-api.json.
Check the workflow JSON together with its mappings when changing either.
Correct mappings alone do not establish that the matching workflow is loaded.
