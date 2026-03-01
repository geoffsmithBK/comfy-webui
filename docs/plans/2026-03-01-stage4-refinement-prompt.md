# Stage 4 Refinement Prompt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow per-stage prompt injection into the Work Print diffusion pass without invalidating ComfyUI's cache for stages 1–3.

**Architecture:** Add 3 new nodes to the workflow template (CLIPTextEncode, ConditioningCombine, CFGGuider) that live in stage 4. When refinement text is present, the stage 4 sampler uses a dedicated guider with combined conditioning. When empty, the nodes are omitted and the workflow is identical to today's.

**Tech Stack:** React (state + UI), ComfyUI workflow JSON, existing mfs-workflow-builder service.

---

### Task 1: Add new nodes to workflow JSON template

**Files:**
- Modify: `public/medium_format_studio_api.json`

**Step 1: Add 3 new nodes and rewire node 37**

Using a script to safely modify the JSON:

```bash
python3 -c "
import json

with open('public/medium_format_studio_api.json') as f:
    wf = json.load(f)

# Node 90: CLIPTextEncode for refinement prompt
wf['90'] = {
    'inputs': {
        'text': '',
        'clip': ['11', 0]
    },
    'class_type': 'CLIPTextEncode',
    '_meta': {'title': 'Refinement Prompt'}
}

# Node 91: ConditioningCombine — merge original + refinement
wf['91'] = {
    'inputs': {
        'conditioning_1': ['13', 0],
        'conditioning_2': ['90', 0]
    },
    'class_type': 'ConditioningCombine',
    '_meta': {'title': 'Combine Conditioning'}
}

# Node 92: CFGGuider dedicated to stage 4
wf['92'] = {
    'inputs': {
        'cfg': 1,
        'model': ['18', 0],
        'positive': ['91', 0],
        'negative': ['7', 0]
    },
    'class_type': 'CFGGuider',
    '_meta': {'title': 'Stage 4 CFGGuider'}
}

# Rewire node 37 (stage 4 sampler) to use new guider
wf['37']['inputs']['guider'] = ['92', 0]

with open('public/medium_format_studio_api.json', 'w') as f:
    json.dump(wf, f, indent=2)
    f.write('\n')

print('Done: added nodes 90, 91, 92 and rewired node 37')
"
```

**Step 2: Verify the JSON is valid**

```bash
python3 -c "
import json
with open('public/medium_format_studio_api.json') as f:
    wf = json.load(f)
assert '90' in wf and wf['90']['class_type'] == 'CLIPTextEncode'
assert '91' in wf and wf['91']['class_type'] == 'ConditioningCombine'
assert '92' in wf and wf['92']['class_type'] == 'CFGGuider'
assert wf['37']['inputs']['guider'] == ['92', 0]
assert wf['92']['inputs']['positive'] == ['91', 0]
print('All assertions passed')
"
```

**Step 3: Commit**

```bash
git add public/medium_format_studio_api.json
git commit -m "feat: add refinement prompt nodes (90/91/92) to MFS workflow template"
```

---

### Task 2: Update constants.js with new node IDs

**Files:**
- Modify: `src/utils/constants.js`

**Step 1: Add new nodes to MFS_STAGES[4]**

In `MFS_STAGES`, add `'90', '91', '92'` to the stage 4 array:

```js
// Before:
4: ['46', '52', '36', '50', '53', '39', '43', '38', '37', '47', '74', '48'],
// After:
4: ['46', '52', '36', '50', '53', '39', '43', '38', '37', '47', '74', '48', '90', '91', '92'],
```

**Step 2: Add new entries to MFS_NODE_IDS**

```js
REFINEMENT_PROMPT: '90',       // CLIPTextEncode (stage 4 refinement)
REFINEMENT_COMBINE: '91',      // ConditioningCombine (original + refinement)
STAGE4_GUIDER: '92',           // CFGGuider (stage 4 dedicated)
```

**Step 3: Verify build passes**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/utils/constants.js
git commit -m "feat: register refinement prompt nodes in MFS constants"
```

---

### Task 3: Implement conditional refinement in workflow builder

**Files:**
- Modify: `src/services/mfs-workflow-builder.js`

**Step 1: Add refinement prompt injection to applyParams()**

After the existing positive prompt injection block (around line 137), add:

```js
// Refinement prompt (node 90) — stage 4 only
if (params.refinementPrompt && workflow[MFS_NODE_IDS.REFINEMENT_PROMPT]) {
  workflow[MFS_NODE_IDS.REFINEMENT_PROMPT].inputs.text = params.refinementPrompt;
}
```

**Step 2: Add empty-refinement bypass to buildWorkflowForTarget()**

After the `applyParams(workflow, params)` call (line 116), add logic to strip refinement nodes when text is empty:

```js
// 7. Bypass refinement conditioning when no refinement prompt
if (!params.refinementPrompt) {
  delete workflow[MFS_NODE_IDS.REFINEMENT_PROMPT];
  delete workflow[MFS_NODE_IDS.REFINEMENT_COMBINE];
  delete workflow[MFS_NODE_IDS.STAGE4_GUIDER];
  // Rewire stage 4 sampler back to the shared guider (node 3)
  if (workflow['37']) {
    workflow['37'].inputs.guider = ['3', 0];
  }
}
```

**Step 3: Add `refinementPrompt` to the JSDoc params**

```js
 * @param {string} [params.refinementPrompt] - Optional stage 4 refinement prompt text
```

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/services/mfs-workflow-builder.js
git commit -m "feat: conditional refinement prompt injection with cache-safe bypass"
```

---

### Task 4: Make PromptInput reusable (support custom id/label)

**Files:**
- Modify: `src/components/PromptInput.jsx`

Currently PromptInput has hardcoded `id="prompt"` and label text "Prompt". Since we need a second instance, make these configurable:

**Step 1: Add id and label props with defaults**

```jsx
export default function PromptInput({ value, onChange, placeholder, disabled, dirty, id = 'prompt', label = 'Prompt', rows = 8 }) {
  return (
    <div className="prompt-input-container">
      <label htmlFor={id} className="prompt-label">
        {label}<CacheWarningDot dirty={dirty} />
      </label>
      <textarea
        id={id}
        className="prompt-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Enter your image description...'}
        disabled={disabled}
        rows={rows}
      />
    </div>
  );
}
```

This is backwards-compatible — existing usage passes no `id`/`label`/`rows` and gets the current defaults.

**Step 2: Verify build passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/PromptInput.jsx
git commit -m "refactor: make PromptInput id, label, and rows configurable"
```

---

### Task 5: Add refinement prompt state and UI to MediumFormatStudio

**Files:**
- Modify: `src/workflows/MediumFormatStudio.jsx`

**Step 1: Add state**

In the form state section (around line 62), add:

```js
const [refinementPrompt, setRefinementPrompt] = useState('');
```

**Step 2: Add to getParams()**

In the `getParams()` function, add `refinementPrompt` to the returned object:

```js
refinementPrompt,
```

**Step 3: Add to lastGeneratedParamsRef snapshot**

In `runGeneration()`, add `refinementPrompt` to the snapshot object:

```js
refinementPrompt,
```

**Step 4: Add dirty field tracking**

In the `dirtyFields` derivation, add:

```js
refinementPrompt: refinementPrompt !== snap.refinementPrompt,
```

**Step 5: Add UI in Stage 4 sidebar**

In the Stage 4 `<SidebarSection>`, add a PromptInput before the upscale factor field:

```jsx
<PromptInput
  id="refinement-prompt"
  label="Refinement Prompt"
  value={refinementPrompt}
  onChange={setRefinementPrompt}
  placeholder="Optional: refine and enhance..."
  disabled={paramsLocked}
  dirty={dirtyFields.refinementPrompt}
  rows={3}
/>
```

**Step 6: Verify build passes**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/workflows/MediumFormatStudio.jsx
git commit -m "feat: add refinement prompt UI to Stage 4 sidebar"
```

---

### Task 6: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add to MFS Parameter Injection table**

Add a new row:

```
| Refinement Prompt | 90 | `inputs.text` | CLIPTextEncode (stage 4 only) |
```

**Step 2: Add to Pipeline Stages table**

Update Stage 4 "Key Nodes" to include 90, 91, 92.

**Step 3: Add brief note about cache-safe refinement**

In the "Progressive Execution & Caching" section, add a note that stage 4 has an optional refinement prompt that uses its own CLIPTextEncode/ConditioningCombine/CFGGuider to avoid invalidating stages 1–3.

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document stage 4 refinement prompt and cache behavior"
```

---

### Task 7: End-to-end verification

**Step 1: Start dev server and test in browser**

```bash
npm run dev
```

Test these scenarios:
1. **Empty refinement, generate contact print** — should work exactly as before
2. **Empty refinement, promote to work print** — should cache stages 1–3, only run stage 4
3. **Add refinement text, generate contact → promote to work** — stages 1–3 cached, stage 4 runs with combined conditioning
4. **Change refinement text, promote to work again** — only stage 4 re-runs (not stage 3)
5. **Clear refinement text, promote to work** — should rewire back to shared guider, stage 4 re-runs

Verify in browser console that WebSocket `onCached` messages show stage 1–3 nodes being cached in scenarios 2–5.

**Step 2: Final commit if any fixes needed**
