# External Dependencies

All external dependencies required to run the Medium Format Studio web UI.

## Runtime Dependencies

### Node.js
- **Version**: 18 or higher (developed on v25; see `.nvmrc`)
- **Install**: https://nodejs.org/ or via [nvm](https://github.com/nvm-sh/nvm)
- **Check**: `node --version && npm --version`

### Python
- **Version**: 3.10 or higher (for running ComfyUI)
- **Install**: https://www.python.org/downloads/
- **Check**: `python --version`

### ComfyUI
- **Repository**: https://github.com/comfyanonymous/ComfyUI
- **Install**:
  ```bash
  git clone https://github.com/comfyanonymous/ComfyUI.git
  cd ComfyUI
  pip install -r requirements.txt
  ```
- **Start** (CORS required):
  ```bash
  python main.py --enable-cors-header
  ```

## ComfyUI Custom Nodes

The Medium Format Studio workflow uses several custom nodes. Install each via [ComfyUI Manager](https://github.com/ltdrdata/ComfyUI-Manager) or by cloning into `ComfyUI/custom_nodes/`.

| Node Pack | Required For |
|-----------|-------------|
| [comfyui-kjnodes](https://github.com/kijai/ComfyUI-KJNodes) | `EmptyLatentImageCustomPresets` (film format presets) |
| [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) | `Power Lora Loader`, `Seed (rgthree)` |
| [ComfyUI-SeedVR2](https://github.com/kijai/ComfyUI-SeedVR2) | SeedVR2 AI upscaling (Final Print stage) |

**Installing via ComfyUI Manager (recommended):**
1. Install ComfyUI Manager: `cd ComfyUI/custom_nodes && git clone https://github.com/ltdrdata/ComfyUI-Manager.git`
2. Restart ComfyUI
3. Open ComfyUI web UI → Manager → Install Missing Custom Nodes

## Model Files

Place models in the indicated directories within your ComfyUI installation. All are required unless noted.

### Diffusion Model
Place in `ComfyUI/models/unet/` or `ComfyUI/models/diffusion_models/`:

- **`flux-2-klein-9b.safetensors`** (FP16, ~18GB) — primary model
- or **`flux-2-klein-9b-Q8_0.gguf`** (~9GB), **`flux-2-klein-9b-Q6_K.gguf`** (~7GB), etc.

The UI auto-discovers all `flux-2-klein-9b*` variants present on the server and lets you select among them. At least one variant is required.

### Text Encoder
Place in `ComfyUI/models/clip/`:

- **`qwen_3_8b_fp8mixed.safetensors`** (~8GB)

### VAE
Place in `ComfyUI/models/vae/`:

- **`flux2-vae.safetensors`** (~300MB)

### AI Upscaler (Final Print stage)
Place in `ComfyUI/models/`  — check SeedVR2 docs for exact subdirectory:

- **`seedvr2_ema_7b_sharp_fp16.safetensors`** (~14GB)

### LoRAs
Place in `ComfyUI/models/loras/FluxKlein/`:

- **`detail_slider_klein_9b_20260123_065513.safetensors`**
- **`klein_slider_chiaroscuro.safetensors`**

LoRAs are optional at runtime (each can be disabled in the UI), but both files must be present for the workflow to load without errors.

## Disk Space

| Component | Approximate Size |
|-----------|----------------|
| node_modules | ~200MB |
| ComfyUI installation | ~500MB |
| Flux 2 Klein 9B (FP16 .safetensors) | ~18GB |
| — or GGUF variants | 7–9GB |
| Qwen 8B text encoder | ~8GB |
| Flux2 VAE | ~300MB |
| SeedVR2 7B upscaler | ~14GB |
| LoRAs (both) | ~1GB |

**Total (FP16 path)**: ~42GB
**Total (GGUF Q8 path)**: ~33GB

## GPU / Compute Requirements

- **NVIDIA GPU (CUDA)**: Recommended; supports FlashAttention, SageAttention, full performance
- **AMD GPU (ROCm)**: Supported by ComfyUI; performance varies
- **Apple Silicon (MPS)**: Works via ComfyUI's MPS backend; lacks CUDA-only optimizations (FlashAttention, Triton). GGUF quantized variants reduce VRAM requirements.
- **CPU**: Technically supported but impractically slow for these model sizes

### VRAM Guidance

| Setup | Minimum VRAM |
|-------|-------------|
| Klein 9B FP16 | ~20GB |
| Klein 9B Q8 GGUF | ~12GB |
| Klein 9B Q6_K GGUF | ~10GB |
| + SeedVR2 (Final Print) | +8–10GB (loaded separately) |

ComfyUI offloads models as needed; lower VRAM is possible with slower generation.

## Network / Ports

- **8188** — ComfyUI backend (default; adjustable in ComfyUI settings)
- **5173** — Vite dev server

Both ports must be free on the local machine. The web UI can also connect to a remote ComfyUI instance (e.g. RunPod) — configure the URL via the server settings panel in the UI.

## Updating

```bash
# Web UI
git pull && npm install

# ComfyUI
cd /path/to/ComfyUI && git pull && pip install -r requirements.txt

# Custom nodes (via ComfyUI Manager)
# Open ComfyUI web UI → Manager → Update All
```
