# TODO - ComfyUI Web UI Feature Development

## Goal: Enhanced Image Generation Workflow & Iteration

Make the image generation 'session' feel less silo'd/brittle/encumbering for creative professionals. Enable better continuity between generations, easier parameter review, and smoother iteration workflows.

---

## User-Proposed Features

### 1. Image Gallery with Metadata Display
- Display previously-generated images in a gallery view
- Show embedded metadata parsed and formatted for readability
- Allow users to review what parameters produced what results

### 2. Drag-and-Drop Parameter Loading
- Drag a previously-generated image (or video file) into the web UI
- Display the image as it appeared when first generated
- Parse and pre-populate generation parameters into UI fields
- Enable quick iteration: "I liked this image, now try it with X changed"

---

## Additional Feature Ideas

### 3. Session History Panel
- Collapsible sidebar showing thumbnails of all images generated in current session
- Click any thumbnail to load its parameters back into the form
- Persist history across page refreshes (localStorage)
- Provides immediate visual feedback and continuity within a work session

### 4. Quick Variations
- "Generate Variations" button that creates 2-4 images
- Uses identical parameters except for different random seeds
- Quickly explore the possibility space of a single prompt
- Compare subtle variations to find the best result

### 5. Parameter Diff View
- When comparing two images side-by-side
- Highlight what's different between their parameters
- Example: "Seed: 12345 → 67890, CFG: 1.0 → 5.0"
- Makes it obvious what caused changes in output

### 6. Prompt Fragments / Building Blocks
- Save reusable prompt snippets/style presets
- Examples: "early digital camera style, slight noise, flash photography"
- Quick-insert buttons for common styles
- Build a personal library of effective prompt components

### 7. "Send to Edit" / "Load Parameters" Button
- After viewing a generated image, one-click to load its parameters
- Populates prompt, negative prompt, dimensions, seed, model, steps, CFG
- Eliminates manual re-entry for iteration

### 8. Image-to-Image / Image Editing Workflow Support
- Support for Flux Klein image-to-image (editing) workflows
- Upload and process user-provided images:
  - AI-generated images (with embedded metadata)
  - Non-AI images (photos, artwork, etc.)
- Parse and extract metadata from uploaded images when available
- Allow users to edit existing images with new prompts
- Maintain workflow parameters from source image when applicable
- Handle reference images and image conditioning nodes

---

## Technical Investigation Required

### Metadata Format Investigation
**Question**: How does ComfyUI embed metadata in saved images?

**Key Questions**:
1. Are full generation parameters embedded in PNG file metadata?
2. Or are parameters only stored in ComfyUI's `/history` API?
3. What metadata format does ComfyUI use? (PNG chunks, EXIF, custom?)
4. Can we parse parameters from any saved ComfyUI image, or only via API?

**Impact**: Determines feasibility of drag-and-drop feature for arbitrary saved images vs. only images from current/recent sessions.

**Next Step**: Investigate ComfyUI's image metadata format before implementing drag-and-drop.

---

## Implementation Priority (TBD)

_To be determined based on technical investigation and user preference_

Possible approaches:
- Start with Session History (lowest complexity, high impact)
- Or investigate metadata format first, then decide on gallery vs drag-and-drop
- Or implement "Load Parameters" button for currently-generated images as foundation

---

## 9. Draw Things Backend Support (Multi-Backend Abstraction)

Add Draw Things as an alternate inference backend alongside ComfyUI, enabling optimized local image generation on Apple Silicon Macs via Metal FlashAttention.

### Why
- ComfyUI on Apple Silicon uses PyTorch MPS, which lacks FlashAttention/SageAttention/Triton (all CUDA-only)
- Draw Things uses native Metal FlashAttention, providing substantial speedups for diffusion inference on Apple Silicon
- This project already runs on multiple machines -- ComfyUI on CUDA boxes, but the Mac deserves a fast local backend too

### What
- Backend abstraction layer in `src/services/` so the UI doesn't care which backend generates the image
- ComfyUI adapter: wraps existing `comfyui-api.js` (workflow JSON + WebSocket progress)
- Draw Things adapter: REST API at `localhost:7860`, SD WebUI-compatible (`POST /sdapi/v1/txt2img`), synchronous response with base64 images
- Backend selector in the UI (e.g., dropdown or settings panel)
- Handle differences: ComfyUI has real-time WebSocket progress; Draw Things is request-response (show indeterminate progress)

### Draw Things API Details
- `GET /` -- returns current model/settings as JSON
- `POST /sdapi/v1/txt2img` -- accepts prompt, dimensions, seed, steps, cfg, etc.; returns base64 image array
- Model/sampler configured through Draw Things GUI; API uses whatever is currently loaded
- No authentication required
- Draw Things must be running with its HTTP API server enabled

### Technical Notes
- Draw Things added Flux 2 Klein support in v1.20260120.0 (Jan 2026)
- Draw Things supports safetensors format for model import
- Flux Klein uses Qwen3 text encoder (4B for Klein 4B, 8B for Klein 9B) -- different from Flux.1's CLIP-L + T5-XXL

---

## Status: Planning Phase

Awaiting decision on:
1. Should we investigate metadata format first?
2. Or discuss feature prioritization and then dig into technical details?
3. Or start on the Draw Things backend abstraction?
