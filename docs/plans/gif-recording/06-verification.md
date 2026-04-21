# Phase 6: Verification (Tasks 21-23, 30)

gifenc type declarations, full build verification, manual E2E checklist.

---

## Task 21: Handle gifenc Type Declarations (if needed)

**Files:**
- Create (if needed): `src/offscreen/gifenc.d.ts`

**Step 1: Check if gifenc has types**

Run: `ls node_modules/gifenc/index.d.ts 2>/dev/null || echo "No types"`

**Step 2: If no types, create declaration file**

```typescript
// src/offscreen/gifenc.d.ts
declare module 'gifenc' {
  interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: number[][]; delay?: number; dispose?: number }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
  }

  export function GIFEncoder(opts?: { auto?: boolean }): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8ClampedArray | number[],
    maxColors: number,
    options?: { format?: string; oneBitAlpha?: boolean | number }
  ): number[][];

  export function applyPalette(
    rgba: Uint8ClampedArray | number[],
    palette: number[][],
    format?: string
  ): Uint8Array;

  export function nearestColorIndex(
    palette: number[][],
    pixel: number[],
    dist?: (a: number[], b: number[]) => number
  ): number;

  export function nearestColorIndexWithDistance(
    palette: number[][],
    pixel: number[],
    dist?: (a: number[], b: number[]) => number
  ): [number, number];

  export function snapColorsToPalette(
    palette: number[][],
    knownColors: number[][],
    threshold?: number
  ): void;

  export function prequantize(
    rgba: Uint8ClampedArray | number[],
    options?: { roundRGB?: number; roundAlpha?: number; oneBitAlpha?: boolean | number }
  ): void;
}
```

**Step 3: Type check**

Run: `tsc -b`
Expected: No errors

**Step 4: Commit (if file was created)**

```bash
git add src/offscreen/gifenc.d.ts
git commit -m "feat(gif): add gifenc type declarations"
```

---

## Task 22: Full Build Verification

**Step 1: Type check**

Run: `tsc -b`
Expected: No errors

**Step 2: Build**

Run: `npm run build`
Expected: Build succeeds, produces:
- `dist/assets/offscreen.js` (new)
- `dist/assets/background.js` (updated)
- `dist/assets/content.js` (updated)
- `dist/assets/sidepanel.js` (updated)

**Step 3: Verify offscreen.html is in dist**

Run: `ls dist/offscreen.html`
Expected: File exists (copied from `public/`)

**Step 4: Lint**

Run: `npm run lint`
Expected: No errors (fix any that appear)

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(gif): resolve build and lint issues"
```

---

## Task 23: Manual E2E Verification Checklist

Load the extension in Chrome and verify:

1. **Extension loads without errors**
   - `chrome://extensions/` → Load unpacked → select `dist/`
   - No errors in extension card

2. **Screenshot tool shows CapturePanel**
   - Open Side Panel → click Screenshot tool
   - Verify: Two tabs visible — "Screenshot" and "GIF Recording"
   - Screenshot tab: shows 3 CaptureButton (Element, Area, Full Page) + Gallery/Settings sub-tabs
   - Existing screenshot functionality still works

3. **GIF Recording tab UI**
   - Switch to "GIF Recording" tab
   - Verify: "Record Viewport" button visible
   - Verify: Settings controls (Duration slider, FPS select, Quality select, Width select)
   - Verify: Estimated file size shown at bottom

4. **Recording flow**
   - Click "Record Viewport"
   - Verify: Recording status bar appears with timer and frame count
   - Verify: Page shows red "REC" indicator (top-right)
   - Click "Stop" or wait for duration to elapse
   - Verify: "Encoding GIF..." progress bar appears
   - Verify: Chrome download dialog opens with `.gif` file
   - Verify: "REC" indicator disappears from page
   - Verify: Downloaded GIF is playable and has expected content

5. **Settings persistence**
   - Change FPS to 5, close and reopen side panel
   - Verify: FPS still shows 5

---

## Task 30: Quality + Duration Verification Matrix

Run manual verification with these presets:

| Case | Preset | Expected Focus |
|------|--------|----------------|
| A | 10s @ 800w / 15fps / high | Baseline quality and smoothness |
| B | 20s @ 960w / 12fps / highFidelity | High-fidelity stability and detail |
| C | 30s @ 960w / 10fps / balanced | Long-duration completion and size tradeoff |
| D | 15s @ 1280w / 10fps / highFidelity | High-resolution edge/text clarity |

For each case, record:

1. **Encode result**
   - Success/fail
   - Any auto-stop reason (`duration`, `memory`) from UI state

2. **File metrics**
   - Downloaded file size (MB)
   - Start-to-download elapsed time (seconds)

3. **Visual quality checks**
   - Text edge clarity
   - Gradient banding visibility
   - Color flicker between adjacent frames

4. **Memory guard behavior**
   - Whether capture auto-switched from high-fidelity to balanced mode
   - Whether recording auto-stopped due to memory limit

### Pass Criteria

- At least one 30s preset completes successfully with acceptable visual quality.
- No extension crash/hang during recording or encoding.
- Budget warning and suggestion UI appears for high-risk presets.
