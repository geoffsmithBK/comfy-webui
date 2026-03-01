# Stage 4 Refinement Prompt — Design

## Problem

The MFS pipeline currently shares a single positive prompt (node 13) and CFGGuider (node 3) across stages 3 and 4. This means there's no way to inject stage-specific text (e.g. "High resolution. Refine and subtly enhance the image...") into the Work Print diffusion pass without invalidating the Contact Print cache.

## Goal

Allow the user to enter an optional refinement prompt that applies **only** to stage 4's diffusion pass, while preserving ComfyUI's node-level caching for stages 1–3. This opens the door to per-stage stylistic tweaks without regenerating earlier stages.

## Approach: Separate CLIPTextEncode + ConditioningCombine

### New Workflow Nodes (Stage 4)

Three new nodes added to `medium_format_studio_api.json`, all assigned to stage 4:

| New Node | Class Type | Inputs | Purpose |
|----------|-----------|--------|---------|
| 90 | CLIPTextEncode | text: (refinement), clip: [11, 0] | Encode refinement prompt using same CLIP model |
| 91 | ConditioningCombine | conditioning_1: [13, 0], conditioning_2: [90, 0] | Merge original + refinement conditioning |
| 92 | CFGGuider | cfg: 1, model: [18, 0], positive: [91, 0], negative: [7, 0] | Dedicated stage 4 guider with combined conditioning |

### Rewiring

- Node 37 (SamplerCustomAdvanced, stage 4): `guider` input changes from `[3, 0]` to `[92, 0]`
- Node 1 (SamplerCustomAdvanced, stage 3): unchanged, continues using `[3, 0]`

### Cache Behavior

Changing the refinement text invalidates: node 90 → 91 → 92 → 37 → downstream stage 4 nodes. Stages 1–3 remain fully cached because nodes 13, 7, and 3 are untouched.

### Empty Refinement Handling

When the refinement text is empty, the workflow builder **omits** nodes 90, 91, 92 and leaves node 37 pointing at node 3 (the original shared guider). This makes the workflow byte-identical to today's, preserving full cache compatibility with existing generations.

When refinement text is present, the builder includes nodes 90/91/92, rewires node 37 to use node 92, and injects the text into node 90.

## Code Changes

### 1. `public/medium_format_studio_api.json`
- Add nodes 90, 91, 92 with the structure described above
- Rewire node 37's guider from `[3, 0]` to `[92, 0]`

### 2. `src/utils/constants.js`
- Add `'90', '91', '92'` to `MFS_STAGES[4]`
- Add to `MFS_NODE_IDS`:
  - `REFINEMENT_PROMPT: '90'`
  - `REFINEMENT_COMBINE: '91'`
  - `STAGE4_GUIDER: '92'`

### 3. `src/services/mfs-workflow-builder.js`
- In `applyParams()`: inject `params.refinementPrompt` into node 90's text
- In `buildWorkflowForTarget()`: when `params.refinementPrompt` is empty/falsy, remove nodes 90/91/92 from the workflow and rewire node 37's guider back to `[3, 0]`

### 4. `src/workflows/MediumFormatStudio.jsx`
- New state: `refinementPrompt` (string, default empty)
- UI: `PromptInput` in the Stage 4 sidebar section, labeled "Refinement Prompt"
- Cache warning dot: add `refinementPrompt` to dirty field tracking
- Include in `getParams()` return object

### 5. `CLAUDE.md`
- Add refinement prompt to the MFS Parameter Injection table
- Document the new nodes and cache behavior
