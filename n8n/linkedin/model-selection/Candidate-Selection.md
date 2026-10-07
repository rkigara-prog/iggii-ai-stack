# Candidate selection — 7 October 2026

The comparison selects **Qwen3.8-27B** and **Gemma 4 31B IT** against the deployed
home-chat model. These are substantive reasoning/writing alternatives. JEV is a
possible narrow classifier/router/checker, not a writer or replacement for evidence
reasoning. Laya is not counted as an alternative writer. No paid service is used.

## Exact identities and limits

| Role | Upstream identity / observed revision | Evaluation weights | Reason for selection |
|---|---|---|---|
| Baseline | `Qwen/Qwen3.5-35B-A3B`, `59d61f3ce65a6d9863b86d2e96597125219dc754` | Existing vLLM `sym_int4`, tensor parallel 2; served as `home-chat` | Actual production deployment; evaluated with the same evidence and phase instructions |
| Alternative 1 | `Qwen/Qwen3.8-27B`, observed upstream `1d4bf0f2ff6012fd82039f2fa52739d0dd7c60c0` | Official Ollama library Q4_K_M, 16,810,714,464 bytes; SHA256 `f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d` | Newer dense Qwen reasoning/writing candidate; tests more than the installed MoE configuration |
| Alternative 2 | `google/gemma-4-31B-it`, observed upstream `842da3794eaa0b77d5f08bae87a17459d91ff475` | ggml-org Q4_0, conversion revision `4fa4fdf38bee237b5c9e8a5b4e72cf39404c9dcc`, 17,992,313,088 bytes; SHA256 `031dc1c5fa9c5a0abbf3c39c5173fb2af65f5ac2dc2a090268561d3c72dcd834` | Substantive different-family instruction/reasoning/writing candidate |
| Third shortlist | `Qwen/Qwen3.6-35B-A3B`, `995ad96eacd98c81ed38be0c5b274b04031597b0` | Not downloaded | Credible efficient MoE alternative, but only two alternative slots; selected newer dense Qwen plus a different family |

The two downloaded artifacts passed full SHA256 verification before use. Their
observed upstream revisions are **not proof of the upstream commit used by each
quantization conversion**; that mapping remains unestablished. Exact quantized
artifacts are reproducible using their digest and pinned conversion revision.

Official references: [Qwen3.8 card](https://huggingface.co/Qwen/Qwen3.8-27B),
[Gemma 4 31B card](https://huggingface.co/google/gemma-4-31B-it),
[ggml-org conversion](https://huggingface.co/ggml-org/gemma-4-31B-it-GGUF),
[Qwen3.6 card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B).
All three shortlist cards declare Apache 2.0. The inspected Gemma 4 repository was
ungated; this is not an inference from the licensing of older Gemma generations.

## Historical Ollama names

Retained workflow/response records confirm use of `qwen3.8:27b`. They do not retain
its weight digest. No retained inventory inspected establishes installation of
`qwen3.8:27b-q8_0`. The historical name is not silently relabeled Qwen3.5.

Current official registry records resolve both names to **Qwen3.8-27B**:

| Current tag | Quantization | Manifest SHA256 | Text-weight SHA256 / bytes |
|---|---|---|---|
| `qwen3.8:27b` | Q4_K_M | `aaee06c39dcf2437cde036998d960e1fc1494b8191be7cc9657d01e509097813` | `f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d` / 16,810,714,464 |
| `qwen3.8:27b-q8_0` | Q8_0 | `8f5fb6b71ea00052cbe8545738c55ce61112c4e571cb60ca4dad00b131766039` | `2bb22714289826d7b9e0ba376c3ce47d08bce39abe598745857c44d88c09bdbf` / 29,047,084,384 |

[Official 27b tag](https://ollama.com/library/qwen3.8:27b) and
[official Q8_0 tag](https://ollama.com/library/qwen3.8:27b-q8_0).
Tags are mutable: today's registry cannot prove the historical revision. The GGUF
architecture label `qwen35` names runtime architecture compatibility, not the
identity of the trained weights. Optional vision projectors are irrelevant to
this text-only comparison and were not downloaded.

## Runtime and resource tradeoffs

The host has two Intel Arc Pro B70 GPUs, 32 GB each, and 128 GB system RAM. Existing
home-chat occupies about 18.4 GiB on each GPU; GPU 1 also serves household image work.
At preflight GPU 0 had about 13.5 GiB free. This is not an empty 64 GB evaluation pool.

The baseline runs Intel llm-scaler vLLM `0.26.1.dev0+g568afb3a1.d20260907.xpu`,
PyTorch `2.12.0+xpu`, Transformers `5.8.0`, configured context 131,072. The official
[Intel support documentation](https://github.com/intel/llm-scaler/blob/main/vllm/README.md)
lists Qwen3.8 and Gemma 4; compatibility in that stack does not authorize replacing
or restarting its production containers.

For isolated evaluation, llama.cpp commit
`b86d2f07542b29ab099aed34fd6b6d1b2fd4b81c` was built with native SYCL and the installed
Intel oneAPI 2025.3.2. Its model implementations include Qwen3.5-family architecture
and Gemma 4. [SYCL documentation](https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/SYCL.md)
documents Intel GPU and quantized/partial-offload support. The evaluator is bound to
GPU 0 and loopback port 8017, with four lower-priority CPU threads, one request at a
time and a 16,384-token context. Actual load feasibility and performance belong in
the results, not inferred from parameter count or advertised context.

Qwen3.8 advertises 262,144 native context and Gemma 4 31B 256K. These maxima are not
validated here. BF16 weights alone are approximately 55.6 GB and 62.5 GB respectively;
selected text GGUFs are about 16.8/18.0 GB, before context/runtime buffers. Partial
offload preserves production allocations but may impose substantial CPU latency.
Quantization and serving differences confound a pure model-architecture comparison;
these are practical deployment-bundle comparisons.

[Mistral Small 4 119B](https://huggingface.co/mistralai/Mistral-Small-4-119B-2603)
was considered but excluded: approximately 241.9 GB BF16 weights and a crude 4-bit
weight lower bound near 60 GB, before cache/runtime buffers, do not fit the available
GPU budget. Its CUDA-oriented quantization instructions do not establish Intel
compatibility. Gemma 4 26B-A4B was another smaller option, but the selected 31B model
provides a substantive dense comparison; convenience on CPU was not the selection rule.

## Access repair

Both account and detached-backend groups lacked Docker/render/video memberships;
there was no stale membership to refresh. Docker stayed root:docker 0660 and GPU
nodes root:render 0660. No existing noninteractive privileged helper was found.
The user ran the supplied limited helper interactively. It collected read-only
runtime metadata and granted this user temporary named ACL access to the two Intel
render nodes, with a root-owned six-hour rollback timer. It did not grant Docker
socket access, modify sudoers, store a password, restart services or expose devices
world-wide. The current process immediately gained GPU access.

The user subsequently extended that same access by 24 hours, at 20:51:03 UTC on
7 October. The active root-owned rollback timer expires at **20:51:03 UTC on
8 October 2026**; the evaluator shuts down one minute earlier. The prior timer is
inactive, the device rights are unchanged, and Docker/sudo rights remain unchanged.
Both selected alternatives have now loaded and produced saved responses within
the 16,384-token context and the existing resource envelope. The sanitized
verification is in `access-extension-verification.json`.
