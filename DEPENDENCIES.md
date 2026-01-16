# External Dependencies

This document lists all external dependencies required to run the ComfyUI Web UI.

## Runtime Dependencies

### 1. Node.js and npm
- **Version**: Node.js 18 or higher
- **Download**: https://nodejs.org/
- **Check version**: `node --version && npm --version`

### 2. Python
- **Version**: Python 3.10 or higher
- **Download**: https://www.python.org/downloads/
- **Check version**: `python --version` or `python3 --version`

### 3. ComfyUI
- **Repository**: https://github.com/comfyanonymous/ComfyUI
- **Installation**:
  ```bash
  git clone https://github.com/comfyanonymous/ComfyUI.git
  cd ComfyUI
  pip install -r requirements.txt
  ```
- **Required**: Must be running at `http://127.0.0.1:8188` with `--enable-cors-header` flag
- **Start command**: `python main.py --enable-cors-header`

## Model Files

All model files must be installed in the appropriate ComfyUI model directories. Download and place them in the following locations within your ComfyUI installation:

### Diffusion Models (Required)
Place in `ComfyUI/models/unet/` or `ComfyUI/models/diffusion_models/`:

- **flux-2-klein-4b.safetensors** (Distilled - Recommended)
  - Size: ~4GB
  - Speed: Fast (4 steps)
  - Download: https://huggingface.co/black-forest-labs/FLUX.1-dev
  - Alternative sources: Check Black Forest Labs official releases

- **flux-2-klein-base-4b.safetensors** (Base - Optional)
  - Size: ~4GB
  - Speed: Slower (20 steps)
  - Quality: Slightly better than distilled
  - Download: Same source as distilled model

### Text Encoder (Required)
Place in `ComfyUI/models/clip/`:

- **qwen_3_4b.safetensors**
  - Size: ~7GB
  - Purpose: Text prompt encoding
  - Download: https://huggingface.co/Comfy-Org/qwen2_vl_4b_fp8_styled/tree/main
  - Alternative: Check ComfyUI model repositories

### VAE (Required)
Place in `ComfyUI/models/vae/`:

- **flux2-vae.safetensors**
  - Size: ~300MB
  - Purpose: Latent image decoding
  - Download: https://huggingface.co/black-forest-labs/FLUX.1-dev/tree/main/vae
  - Alternative: May be bundled with Flux model releases

## Model Installation Guide

1. **Create model directories** (if they don't exist):
   ```bash
   cd ComfyUI
   mkdir -p models/unet models/clip models/vae
   ```

2. **Download models** using one of these methods:

   **Option A: Using `wget` (Linux/Mac)**
   ```bash
   # Example for downloading from Hugging Face
   cd ComfyUI/models/unet
   wget https://huggingface.co/.../flux-2-klein-4b.safetensors
   ```

   **Option B: Using browser**
   - Visit the download links above
   - Download files manually
   - Move them to the appropriate ComfyUI model directories

   **Option C: Using Hugging Face CLI**
   ```bash
   pip install huggingface-hub
   huggingface-cli download black-forest-labs/FLUX.1-dev --include "*.safetensors"
   ```

3. **Verify installation**:
   - Start ComfyUI: `python main.py`
   - Check the console for model loading messages
   - Models should appear in the node dropdowns

## Workflow File (Required)

The workflow file must be in API format and placed in the web UI's public directory:

- **Location**: `comfy-webui/public/image_flux2_klein_text_to_image_api.json`
- **Format**: API format (not UI format)
- **Export from ComfyUI**:
  1. Load your workflow in ComfyUI web interface
  2. Enable "Dev mode" in Settings
  3. Click "Save (API Format)"
  4. Save to the public directory

## Disk Space Requirements

- **Node.js dependencies**: ~200MB (`node_modules`)
- **ComfyUI installation**: ~500MB
- **Model files**: ~11-15GB total
  - Flux 2 Klein Distilled: ~4GB
  - Flux 2 Klein Base (optional): ~4GB
  - Qwen text encoder: ~7GB
  - Flux2 VAE: ~300MB

**Total**: Approximately 12-16GB of disk space required

## Network Requirements

- **Internet connection**: Required for initial model downloads
- **Local network**: ComfyUI and Web UI communicate via localhost (127.0.0.1)
- **Ports**:
  - `8188`: ComfyUI backend (must be free)
  - `5173`: Vite dev server (must be free)

## Optional Dependencies

### GPU Acceleration (Recommended)
- **NVIDIA GPU**: CUDA support highly recommended for reasonable generation speeds
- **AMD GPU**: ROCm support (varies by ComfyUI version)
- **Apple Silicon**: MPS (Metal Performance Shaders) support
- **CPU only**: Supported but very slow (not recommended for production use)

### Custom Nodes
If your workflow uses custom ComfyUI nodes, install them in `ComfyUI/custom_nodes/`. Check the workflow JSON for any non-standard node types.

## Troubleshooting

### Model Not Found Errors
- Verify model files are in the correct directories
- Check file names match exactly (case-sensitive)
- Ensure files aren't corrupted (re-download if needed)

### CUDA Out of Memory
- Use the distilled model (requires less VRAM)
- Reduce image dimensions (e.g., 768x768 instead of 1024x1024)
- Close other GPU-intensive applications

### ComfyUI Won't Start
- Check Python version: `python --version`
- Reinstall requirements: `pip install -r requirements.txt`
- Check for port conflicts: `lsof -i :8188`

## Version Compatibility

This web UI has been tested with:
- **ComfyUI**: Latest version as of January 2025
- **Flux 2 Klein models**: Version 2.0
- **Node.js**: 18.x, 20.x
- **Python**: 3.10, 3.11, 3.12

If you encounter compatibility issues with newer versions, please open an issue in the project repository.

## Updates and Maintenance

- **ComfyUI updates**: `git pull` in the ComfyUI directory
- **Model updates**: Replace model files as new versions are released
- **Web UI updates**: `git pull && npm install` in this directory
- **Check for breaking changes**: Review CHANGELOG.md and release notes

## Support and Resources

- **ComfyUI Documentation**: https://github.com/comfyanonymous/ComfyUI
- **Flux Models**: https://huggingface.co/black-forest-labs
- **ComfyUI Community**: https://comfyanonymous.github.io/ComfyUI_examples/
- **Model Manager**: Consider using ComfyUI Manager for easier model installation
