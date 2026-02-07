# Architecture Decisions

## ADR-001: Web + ComfyUI — Platform Strategy (Feb 2026)

### Context

As the MFS UI matures, we're encountering friction points characteristic of browser-sandboxed applications: the model dropdown is hardcoded rather than reflecting what's actually installed, the gallery is limited to ComfyUI's `/history` API rather than being a general file browser, and there's no way to browse the ComfyUI output folder directly.

This prompted a broader evaluation: should we stay as a web app, wrap in something like Tauri/Electron, or go fully native (Swift + MLX on macOS)?

### Decision

**Stay web + ComfyUI.** The friction points we're hitting are largely solvable within the current architecture. The browser sandbox is not the fundamental constraint it appears to be — ComfyUI is already a local process with full disk access, and its API (plus a small Python extension) can bridge the gap.

### Product Vision

The MFS UI is a metaphor-based creative tool for photographers confronting camera-less image generation. The darkroom metaphor (negative/development/contact print/work print/final print) gives film-literate creatives an accessible mental model for diffusion workflows — much as the film-to-digital transition used familiar terms (RAW = negative, RAW processing = development, Lightroom export = print) to ease adoption. The UI layer and interaction design are the novel contribution; inference is a commodity backend concern.

### Options Evaluated

#### Lane 1: Pure web, lean harder into ComfyUI API (CHOSEN)

The specific pain points have concrete solutions that don't require leaving the web:

**Dynamic model list** — ComfyUI's `GET /object_info` endpoint returns every registered node type and its valid input options, including all available model files on disk. We can populate the model dropdown dynamically instead of hardcoding it. This is straightforward, no filesystem access needed.

**Output folder browsing** — A thin ComfyUI server extension (~50 lines of Python) can serve directory listings and file metadata for the output folder over the existing `:8188` API. ComfyUI's extension/custom-node system is designed for this. The gallery tab could then offer both "recent generations" (from `/history`) and "browse output folder" (from the extension) views.

**Other filesystem needs** — The File System Access API (Chromium) handles ad-hoc "open a folder" use cases with a user gesture. Not Safari-compatible, but adequate for a power-user tool.

- **Cost**: Near zero. No new dependencies, no architecture change.
- **Limitation**: Tethered to a running ComfyUI instance. Can only see what it exposes.
- **Timeline**: These are days-of-work improvements, not architectural changes.

#### Lane 2: Tauri wrapper

Tauri 2.x gives a Rust backend with the existing React frontend — same web UI in a native window with full filesystem access, system tray, native menus. ~10-15MB binary overhead (vs. Electron's ~200MB+). Cross-platform preserved.

- **When to reconsider**: If we want Finder drag-and-drop, system keyboard shortcuts, menu bar integration, offline mode, or a polished `.dmg` distribution story.
- **Key advantage**: Preserves the entire React/CSS investment. Native capabilities are bolted on incrementally.
- **This is the right "next lane" if/when we outgrow pure web.**

#### Lane 3: Electron

Same idea as Tauri but heavier (full Chromium + Node.js). Running Chromium alongside a Python ML backend alongside a loaded model in VRAM is expensive on unified-memory Macs. Tauri wins on every dimension unless a specific Node.js library is required.

**Verdict**: Skip. Tauri is strictly better for this use case.

#### Lane 4: Native Swift + MLX

Full native macOS app. Direct filesystem, Metal, MLX for inference. Maximum platform integration and performance.

**Performance reality check**: For Flux Klein 9B on M-series, ComfyUI/MPS might take ~12-15s for a 6-step contact print. MLX/Metal FlashAttention might get to ~6-8s. Meaningful but not transformative — and the creative bottleneck is usually the human evaluating and adjusting, not the GPU.

**The real cost**: Abandoning ComfyUI's node ecosystem. The 5-stage MFS pipeline, LoRA stacking, SeedVR2 upscale chain, and hundreds of community custom nodes (ControlNet, IP-Adapter, InstantID, etc.) would all need reimplementation. This is months of work.

**Verdict**: This is a different *product* — "building an inference engine" vs. "building a creative UI for an inference engine." Not justified unless we're willing to go Mac-only and rewrite the backend from scratch.

### Actionable Next Steps (Low-Hanging Fruit)

These can be implemented incrementally within the current architecture:

1. **Dynamic model dropdown** — Fetch available models from ComfyUI's `GET /object_info` endpoint (or more specific model-listing endpoints) instead of hardcoding `MFS_MODELS` in `constants.js`. Fall back to hardcoded list if the server is unreachable.

2. **Output folder browser** — Write a small ComfyUI custom node / server extension (Python) that exposes directory listings of the output folder via a new REST endpoint. Update the gallery tab to support both "recent history" and "browse folder" views.

3. **Gallery refresh** — The gallery currently refetches on every tab switch. Could add a manual refresh button and/or poll for new items during generation.

4. **LoRA discovery** — We already resolve LoRA filenames from `getAvailableLoRAs()` on mount. The same pattern can be extended to populate a LoRA browser/picker rather than hardcoding the two LoRA slots.

### Update: Dynamic Model Detection (DONE)

The model dropdown has been replaced with auto-detection. On mount, the app queries `GET /object_info/UNETLoader` to discover which Klein 9B variant is installed (FP16, Q8_0, Q6_K), then displays it as a read-only label in Stage 1. The same pattern is used for LoRA filename resolution via `GET /object_info/LoraLoader`.

---

## ADR-002: Cloud GPU via RunPod (Feb 2026)

### Context

Flux Klein 9B on Apple Silicon (MPS) takes 100+ seconds for a 6-step contact print. The bottleneck is fundamental: ~200-400 GB/s memory bandwidth (vs. NVIDIA's 1-2 TB/s), no FlashAttention, no SageAttention, no Triton. The 8B text encoder (Qwen 3) adds significant hidden overhead before the progress bar even starts.

### Decision

**Use RunPod cloud GPUs as an optional remote backend.** The web UI already speaks to ComfyUI over HTTP/WebSocket — changing `127.0.0.1:8188` to a remote URL is a configuration change, not an architecture change.

### Implementation

**Server URL is UI-configurable.** A gear icon in the sidebar lower-left opens a settings popover with a URL input and connection status indicator. The URL is stored in `localStorage` and defaults to `http://127.0.0.1:8188` for zero-config local use. Supports RunPod's HTTPS proxy URLs (`https://<pod-id>-8188.proxy.runpod.net`).

**Protocol handling**: `https://` → `wss://` for WebSocket; `http://` → `ws://`. Derived automatically from the stored URL.

**Compute device auto-detection**: On mount, the app queries `/system_stats` and reads `devices[0].type` to determine `cuda:0` vs `mps`. This is injected into the workflow at build time for nodes that need device-specific configuration (SeedVR2 nodes 60, 61, 62).

### Performance: MPS vs CUDA

Measured with Flux Klein 9B, 6-step contact print, ~1M pixels:

| | Apple Silicon (MPS) | RTX 4090 (CUDA) |
|---|---|---|
| Sampling (6 steps) | ~0.5s (13-15 it/s) | ~3.4s (1.78 it/s)* |
| Total pipeline (cold) | 100+ seconds | ~75 seconds |
| Total pipeline (warm) | 80-100 seconds | ~4-5 seconds |
| Memory bandwidth | 200-400 GB/s | 1,008 GB/s |
| FlashAttention | No | Yes (via PyTorch SDPA) |

*The 4090's lower it/s is misleading — it reflects larger batch throughput per step. Wall-clock time is dramatically faster due to FlashAttention and higher bandwidth. Warm cache (models already loaded) is where CUDA truly shines.

### VRAM Management on 24GB Cards

The MFS pipeline's full model stack exceeds 24GB when loaded simultaneously:

| Model | Size (FP16) |
|---|---|
| Flux Klein 9B (diffusion) | ~18 GB |
| Qwen 3 8B (text encoder, FP8) | ~8 GB |
| SeedVR2 DiT 7B (AI upscale) | ~15.7 GB |
| SeedVR2 VAE | ~0.5 GB |
| Flux VAE | ~0.16 GB |

**Key lessons learned:**

1. **Don't use `--highvram`** on 24GB cards with this pipeline. The default memory mode lets ComfyUI swap models between CPU and GPU. `--highvram` tries to keep everything resident and OOMs when loading the diffusion model after the text encoder.

2. **SeedVR2 manages its own models** outside ComfyUI's model manager. When Stage 5 runs, ComfyUI still has ~12.5GB of Flux cached in VRAM. SeedVR2 tries to load its 15.7GB DiT alongside it → OOM.

3. **`blocks_to_swap = 30`** on SeedVR2's DiT loader (node 60) solves this. The DiT has ~36 transformer blocks; swapping 30 to CPU keeps only 6 blocks (~2.6GB) in VRAM during inference, leaving room for ComfyUI's cached models. Slower due to CPU↔GPU transfer per block, but doesn't OOM.

4. **Workflow template has Mac-specific values baked in** (`"device": "mps"` on SeedVR2 nodes). The workflow builder now auto-injects the correct device based on `/system_stats` detection. Only applies to CUDA — MPS values pass through from the template unchanged.

5. **Skip-work-print rewiring** must include node 52 (upscale factor, lives in Stage 4) even when Stage 4 is excluded, because Stage 5 nodes 76/77 (BasicMath) reference it for resolution calculations.

### Recommended ComfyUI Launch Flags (CUDA)

```bash
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True \
python main.py \
  --listen 0.0.0.0 \
  --port 8188 \
  --enable-cors-header \
  --use-pytorch-cross-attention \
  --fast \
  --bf16-unet \
  --bf16-vae \
  --disable-auto-launch
```

Do NOT use `--highvram` or `--gpu-only` on 24GB cards with the MFS pipeline. Default memory management handles model swapping correctly.

### RunPod Operational Notes

- **Pod template**: Use a ComfyUI template with PyTorch 2.6+ and CUDA 12.4+
- **Custom nodes required**: Same set as local (SeedVR2, rgthree, kjnodes, etc.)
- **Models**: Must be installed on the pod. Consider RunPod Network Volumes (~$0.10/GB/month) to persist models across pod restarts instead of re-downloading ~40GB each time.
- **Network Volumes** avoid re-downloading models on every pod start. Mount at `/workspace` and install ComfyUI + models there once.
- **Cost**: RTX 4090 on RunPod ≈ $0.40-0.70/hour. A few focused sessions per week ≈ $5-10/week.
- **CORS is mandatory**: ComfyUI must be started with `--enable-cors-header` for the web UI to connect through RunPod's HTTPS proxy.
- **Proxy URL format**: `https://<pod-id>-8188.proxy.runpod.net` — the app handles `https→wss` conversion for WebSocket automatically.

### Future: Docker Image

A custom Docker image baking in ComfyUI + custom nodes + workflow templates would eliminate per-pod setup friction. Models would still mount from a Network Volume. This is the natural next step for making cloud GPU usage frictionless.

### Revisit Triggers

Reconsider the Tauri lane if any of these become requirements:
- Native file drag-and-drop (into/out of the app)
- System-level global keyboard shortcuts
- Menu bar / dock integration
- Offline operation (no ComfyUI dependency for browsing/organizing)
- Distributable `.dmg` / `.app` packaging for non-technical users
