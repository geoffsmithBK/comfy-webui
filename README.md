# ComfyUI Web Interface

A modern web-based user interface for ComfyUI workflows, built with React and Vite.

## Features

- Clean, dark-themed interface
- Real-time progress tracking via WebSocket
- Text-to-image generation using Flux 2 Klein models
- Support for both Base and Distilled model variants
- **Automatic parameter optimization** - Steps and CFG automatically adjust based on selected model:
  - Distilled: 4 steps, CFG 1.0 (fast generation)
  - Base: 20 steps, CFG 5.0 (high quality)
- Customizable image dimensions and seed
- Download generated images
- Responsive design

## Prerequisites

- Node.js 18 or higher
- ComfyUI server running at `http://127.0.0.1:8188` with `--enable-cors-header` flag
- Flux 2 Klein models installed in ComfyUI:
  - `flux-2-klein-4b.safetensors` (distilled)
  - `flux-2-klein-base-4b.safetensors` (optional)
  - `qwen_3_4b.safetensors` (text encoder)
  - `flux2-vae.safetensors` (VAE)
- **Workflow in API format** - Export your workflow from ComfyUI:
  1. Enable "Dev mode" in ComfyUI Settings
  2. Click "Save (API Format)"
  3. Save as `public/image_flux2_klein_text_to_image_api.json`

## Installation

Install dependencies:

```bash
npm install
```

## Running the Application

You need **two terminal windows** running simultaneously:

**Terminal 1 - Start ComfyUI Backend:**
```bash
cd /path/to/ComfyUI
python main.py --enable-cors-header
```

**Terminal 2 - Start Web UI Frontend:**
```bash
cd /path/to/comfy-webui
npm run dev
```

Then open your browser to `http://127.0.0.1:5173/`

### Server Management

**Restarting the Dev Server:**
- Press `Ctrl+C` in the terminal running Vite
- Run `npm run dev` again

**Shutting Down:**
- Press `Ctrl+C` in both terminal windows

**Note:** Always use `Ctrl+C` for graceful shutdown. Avoid force-killing processes (`kill -9`) as it can cause port conflicts and resource leaks.

## Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

1. Ensure ComfyUI is running at `http://127.0.0.1:8188`
2. Enter your prompt in the text area
3. Adjust parameters:
   - Width and Height (default: 1024x1024)
   - Seed (click Randomize for a new seed)
   - Model (Distilled for speed, Base for quality)
4. Click "Generate Image"
5. Watch real-time progress
6. Download your generated image

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── PromptInput.jsx  # Prompt text input
│   ├── ParameterControls.jsx  # Parameter controls
│   ├── ImageDisplay.jsx # Image display and download
│   └── ProgressBar.jsx  # Progress indicator
├── workflows/           # Workflow-specific components
│   └── TextToImage.jsx  # Text-to-image workflow
├── services/            # API and utilities
│   ├── comfyui-api.js   # ComfyUI API client
│   └── workflow-loader.js # Workflow JSON utilities
├── utils/               # Helper functions
│   └── constants.js     # Constants and configuration
├── App.jsx              # Main app component
└── main.jsx             # Entry point
```

## Extensibility

This application is designed for easy extension with new workflows:

- Add new workflow components in `src/workflows/`
- Reuse existing UI components
- Use the same API service for all workflows
- Add routing to switch between workflow types

Future workflow ideas:
- Image-to-image editing
- Video generation
- Inpainting and outpainting

## Troubleshooting

**Error: "Cannot execute because a node is missing the class_type property"**
- You're using the wrong workflow format
- Export the workflow in API format from ComfyUI:
  1. Enable "Dev mode" in Settings
  2. Click "Save (API Format)"
  3. Save to `public/image_flux2_klein_text_to_image_api.json`
- Alternative: In browser console, run `copy(JSON.stringify(await app.graphToPrompt(), null, 2))` and paste to the file

**Error: "request with non matching host and origin"**
- Start ComfyUI with: `python main.py --enable-cors-header`
- Access the web UI at `http://127.0.0.1:5173/` (not localhost)

**Error: ComfyUI server is not running**
- Ensure ComfyUI is started and accessible at `http://127.0.0.1:8188`
- Check that no firewall is blocking the connection

**Workflow errors**
- Verify all required models are installed in ComfyUI
- Check the browser console for detailed error messages

**Image not loading**
- Check the Network tab in browser DevTools
- Verify the image was successfully generated in ComfyUI

## License

MIT
