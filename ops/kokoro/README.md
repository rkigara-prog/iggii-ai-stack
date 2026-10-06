# Local speech deployment

Kokoro runs on Unraid as localai-kokoro.
The immutable image reference is recorded in image-id.txt.
Deployment scripts reside in /mnt/app_pool/appdata/localai-kokoro.
The container uses CPU inference with limits of four CPUs and 4 GB RAM.
It joins localai-audio and publishes no host ports.
WebUI's startup script restores its audio-network attachment.

Start-Kokoro.sh requires the container name to be available.
Stop-Kokoro.sh checks the management label before stopping and removing it.
No persistent volume is configured for this service.
The root-stack GitHub workflow does not deploy these scripts.

## WebUI configuration

Administrator Audio settings are stored in WebUI persistent data.

- Speech input uses local Whisper with the base model.
- Speech output uses the OpenAI-compatible engine.
- API base URL is http://localai-kokoro:8880/v1.
- API key field contains the placeholder not-needed.
- Model is kokoro.
- Default voice is af_heart.
- Response splitting is Punctuation.

The placeholder is not an authentication credential.
The service is reachable by containers on its Docker network.

Personal Audio settings use the Default speech engine.
Users can type a voice ID in Set Voice and save.
Available examples include af_heart, af_bella, am_michael,
bf_emma, and bm_george.

## Acceptance on 2026-10-06

CPU startup and model warmup completed.
WebUI reached the voice endpoint, which returned 72 voice packs.
The user confirmed improved speech playback.
Changing the personal voice ID changed the spoken voice.
The current personal interface provides a text field without a dropdown.

## Follow-up

Provide a searchable voice selector with previews.
Browser Kokoro was attempted but did not provide the desired playback.
The deployed configuration uses server-side Kokoro instead.
Concurrent household speech load has not been measured.
