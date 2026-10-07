# LinkedIn content-quality evaluation

Read [Report.md](Report.md) for the results and deployment recommendation. This
directory contains evaluation tooling and aggregate results, not production changes.
LinkedIn publishing remains disabled.

The private run root is `/home/rigarashi/.local/share/linkedin-quality-20261007` on
iggy-ai. It holds retained source artifacts, raw HTML/text, frozen packets, gold,
responses, canaries, blind drafts and credentials. It is mode 700 and outside Git.
Do not copy these payloads into issues, pull requests or this directory. The shared
blind review contains public/synthetic drafts only; original evidence stays local.

## Protocol and reproduction

1. Inspect active n8n HTTP nodes, source packaging, validators, routing and published
   versions. Record retrieval defects separately from model outcomes.
2. Retrieve approved public URLs with `retrieve.py`, preserving raw bytes, extracted
   text, exact URL, publisher, page publication/update metadata, retrieval timestamp
   and hashes. A reachable page is not sufficient evidence. Check selected passages
   against the retained text manually; HTML navigation can contaminate extraction.
3. Build 30–50 private packets matching `schema.json`. Include positive and negative
   cases. Label gold support and eligibility independently, using exact passages and
   provenance, before inference. Freeze packet and gold hashes in `freeze.private.json`.
   Gold must not be sent to models. Keep full pages outside Git even when a packet uses
   selected passages. Stipulated synthetic provenance tests a hypothetical world;
   synthetic opportunities can never be published as events.
4. Run `run.py --private-root PRIVATE_ROOT --phase assessment`. The baseline and
   page-grounded instruction arm use the same home-chat checkpoint and byte-identical
   packets. The former adapts the deployed snippet-oriented policy to atomic claims;
   it is not a replay of the entire production workflow. Responses are not repaired.
5. Run ranking separately (`--phase ranking`): every arm receives the same gold-eligible
   portfolio, independent of its own assessment results. Run writing separately
   (`--phase writing`) on the preselected four packets. This keeps selection errors
   from changing what the writing comparison receives.
6. Run `run_laya.py` in the pinned CPU runtime for assessment and ranking. Truncated
   answers are runtime-blocked, not trustworthy predictions. Laya cannot generate
   prose or claim citations. Do not compare its absent quotations with a writer's
   citation-generation rate. Compare decision accuracy on the common complete subset.
7. Optional Jev uses `run_jev.py` only after secure credentials and an explicit
   existing-account budget are provided. It excludes whole privacy/injection packets,
   rather than silently changing their evidence. Compare all models on that identical
   public subset. No external calls were authorized solely by possessing a key.
8. Run `score.py --private-root PRIVATE_ROOT --sanitized-output results.json`.
   It verifies frozen hashes and computes an explicit aggregate allowlist. Review
   prose manually against passages; exact quotations are necessary but do not prove
   entailment. A model's supported flag, confidence, or same-model review is not gold.

All model calls are serial. The local queue checks vLLM running/waiting requests
and ComfyUI queues before each call, pauses on activity, and leaves a three-second
gap. An existing household request can still arrive during an evaluation call;
this is a cooperative queue, not a hard priority reservation. Context remains
131,072, `max-num-seqs=2`, GPU utilization 0.55 per GPU. No production service was
restarted or replaced. Laya uses CPU only, two threads and a lower scheduling priority.

## Checks and limitations

`python3 test_checks.py` tests exact page versus snippet evidence, incomplete replies,
duplicate claim IDs, public-fetch address restrictions and external privacy exclusions.
Validate private packets against `schema.json`. `deployment-audit.json`,
`model-preflight.json`, `set-manifest.json` and `results.json` are sanitized records.

This is a deliberately adversarial, small benchmark with controlled synthetic
counterfactuals. It is not a random sample of weekly content, a calibrated precision
estimate, or proof of production privacy. The protocol correction and initial
excluded responses are retained privately. Gold needs Robert/Leigh's independent
review before using the scores as a deployment gate. Actual human revision time is
pending the blind review; reported editorial-edit counts are an analyst proxy.

## Blind review

Open the shared review instructions identified in Report.md. Each reviewer should
score and minimally edit the anonymous drafts independently, record elapsed editing
minutes and changed sentences, then consult the separate answer key/evidence map.
Do not publish any evaluation draft. Reviews are human records and are not consumed
by the active pipeline. Model identities are in the answer key, not the blind drafts.

## Pinned runtime

The standard-library home-chat tools require Python 3.12. The optional local decision
comparison used `laya==0.4.0`, `torch==2.14.1+cpu`, `transformers==5.19.0`,
`huggingface_hub==1.33.0` and `safetensors==0.8.0`; packet validation used
`jsonschema==4.26.0`. Exact checkpoint revision and weight hash are in model-preflight.
Install a CPU-only Torch wheel before Laya; explicitly select CPU to avoid automatic
XPU selection. Weights remain outside Git. No production Python environment changed.
