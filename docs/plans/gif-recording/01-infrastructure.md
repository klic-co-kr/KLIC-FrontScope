# Phase 1: Infrastructure (Tasks 1-6)

Types, constants, manifest permissions, offscreen HTML, Vite config, gifenc install.

---

## Task 1: Define GIF Recording Types

**Files:**
- Create: `src/types/recording.ts`
- Test: `src/types/__tests__/recording.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/recording.test.ts
import { describe, it, expect } from 'vitest';
import { GIF_QUALITY_COLORS, DEFAULT_GIF_SETTINGS } from '../recording';
import type { GIFSettings, RecordingState, RecordingConfig, GIFQuality } from '../recording';

describe('recording types', () => {
  it('GIF_QUALITY_COLORS maps quality to color count', () => {
    expect(GIF_QUALITY_COLORS.low).toBe(64);
    expect(GIF_QUALITY_COLORS.medium).toBe(128);
    expect(GIF_QUALITY_COLORS.high).toBe(256);
  });

  it('DEFAULT_GIF_SETTINGS has correct defaults', () => {
    expect(DEFAULT_GIF_SETTINGS).toEqual({
      duration: 10,
      fps: 15,
      quality: 'medium',
      width: 640,
    });
  });

  it('GIFSettings type is assignable', () => {
    const settings: GIFSettings = {
      duration: 5,
      fps: 10,
      quality: 'low',
      width: 320,
    };
    expect(settings.duration).toBe(5);
  });

  it('RecordingState type is assignable', () => {
    const state: RecordingState = {
      isRecording: false,
      isEncoding: false,
      elapsed: 0,
      frameCount: 0,
      encodingProgress: 0,
    };
    expect(state.isRecording).toBe(false);
  });

  it('RecordingConfig type is assignable', () => {
    const config: RecordingConfig = {
      tabId: 1,
      windowId: 1,
      width: 640,
      height: 480,
      fps: 15,
      maxDuration: 10,
      maxColors: 128,
    };
    expect(config.tabId).toBe(1);
  });

  it('GIFQuality union covers all options', () => {
    const qualities: GIFQuality[] = ['low', 'medium', 'high'];
    qualities.forEach(q => {
      expect(GIF_QUALITY_COLORS[q]).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/recording.test.ts`
Expected: FAIL — module `../recording` not found

**Step 3: Write minimal implementation**

```typescript
// src/types/recording.ts

export type GIFQuality = 'low' | 'medium' | 'high';

export const GIF_QUALITY_COLORS: Record<GIFQuality, number> = {
  low: 64,
  medium: 128,
  high: 256,
};

export interface GIFSettings {
  duration: number;       // 3-30s, default 10
  fps: number;            // 5, 10, 15, default 15 (ShareX default)
  quality: GIFQuality;
  width: 320 | 640 | 800; // output width, default 640
}

export const DEFAULT_GIF_SETTINGS: GIFSettings = {
  duration: 10,
  fps: 15,
  quality: 'medium',
  width: 640,
};

export interface RecordingState {
  isRecording: boolean;
  isEncoding: boolean;
  elapsed: number;         // seconds
  frameCount: number;
  encodingProgress: number; // 0-100
}

export interface RecordingConfig {
  tabId: number;
  windowId: number;
  width: number;
  height: number;
  fps: number;
  maxDuration: number;
  maxColors: number;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/recording.test.ts`
Expected: PASS (6 tests)

**Step 5: Type check**

Run: `tsc -b`
Expected: No errors

**Step 6: Commit**

```bash
git add src/types/recording.ts src/types/__tests__/recording.test.ts
git commit -m "feat(gif): add GIF recording types and constants"
```

---

## Task 2: Add GIF Recording Message Constants

**Files:**
- Modify: `src/constants/messages.ts`

**Step 1: Add GIF recording message actions to MESSAGE_ACTIONS**

In `src/constants/messages.ts`, add to the `MESSAGE_ACTIONS` object after the `GRID_LAYOUT_*` section:

```typescript
  // GIF 녹화
  GIF_RECORDING_START: 'GIF_RECORDING_START',
  GIF_RECORDING_STOP: 'GIF_RECORDING_STOP',
  GIF_RECORDING_PROGRESS: 'GIF_RECORDING_PROGRESS',
  GIF_ADD_FRAME: 'GIF_ADD_FRAME',
  GIF_ENCODE: 'GIF_ENCODE',
  GIF_ENCODING_PROGRESS: 'GIF_ENCODING_PROGRESS',
  GIF_ENCODE_COMPLETE: 'GIF_ENCODE_COMPLETE',
  GIF_CLEAR_FRAMES: 'GIF_CLEAR_FRAMES',
  GIF_RECORDING_STARTED: 'GIF_RECORDING_STARTED',
  GIF_RECORDING_ENDED: 'GIF_RECORDING_ENDED',
  GIF_RECORDING_STATUS: 'GIF_RECORDING_STATUS',
  GIF_GET_FRAME_COUNT: 'GIF_GET_FRAME_COUNT',
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/constants/messages.ts
git commit -m "feat(gif): add GIF recording message action constants"
```

---

## Task 3: Add Manifest Permissions

**Files:**
- Modify: `public/manifest.json`

**Step 1: Add `offscreen` and `downloads` permissions**

Add to the `permissions` array in `public/manifest.json`:

```json
"permissions": [
    "activeTab",
    "scripting",
    "storage",
    "alarms",
    "contextMenus",
    "sidePanel",
    "offscreen",
    "downloads"
],
```

**Step 2: Verify JSON validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/manifest.json','utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add public/manifest.json
git commit -m "feat(gif): add offscreen and downloads permissions to manifest"
```

---

## Task 4: Create Offscreen Document HTML

**Files:**
- Create: `offscreen.html` (project root — same level as `sidepanel.html`)

> **IMPORTANT:** The offscreen HTML must be a Vite HTML entry (not in `public/`).
> Vite outputs ES modules (`import`/`export`). Files in `public/` are copied as-is
> without processing, so a classic `<script>` tag would fail with SyntaxError.
> By placing at project root and registering as a Vite HTML entry, Vite injects
> the correct `<script type="module">` tag automatically.

**Step 1: Create the offscreen HTML file at project root**

```html
<!DOCTYPE html>
<html>
<head><title>KLIC Offscreen</title></head>
<body>
  <script type="module" src="/src/offscreen/index.ts"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add offscreen.html
git commit -m "feat(gif): add offscreen document HTML (Vite HTML entry)"
```

---

## Task 5: Add Offscreen Entry Point to Vite Config

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add offscreen to rollupOptions.input**

In `vite.config.ts`, add to the `input` object:

```typescript
input: {
  popup: resolve(__dirname, 'index.html'),
  sidepanel: resolve(__dirname, 'sidepanel.html'),
  background: resolve(__dirname, 'src/background/index.ts'),
  content: resolve(__dirname, 'src/content/index.ts'),
  offscreen: resolve(__dirname, 'offscreen.html'),   // HTML entry — Vite processes <script type="module">
},
```

> **Why HTML entry, not TS entry?**
> `offscreen.html` is loaded by Chrome via `chrome.offscreen.createDocument({ url: 'offscreen.html' })`.
> Chrome needs the HTML file in `dist/`. By registering it as a Vite HTML entry (like sidepanel.html),
> Vite processes the HTML, resolves the TypeScript source, and outputs both `dist/offscreen.html`
> and `dist/assets/offscreen.js` with correct `<script type="module">` references.
> Using a TS-only entry would require manually maintaining `public/offscreen.html` with
> hardcoded paths, and the classic `<script>` tag would fail because Vite outputs ES modules.

**Step 2: Verify vite config loads**

Run: `npx vite build --config vite.config.ts 2>&1 | head -5`
Expected: Build starts (may fail because `src/offscreen/index.ts` doesn't exist yet — that's OK for now)

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat(gif): add offscreen entry point to Vite build config"
```

---

## Task 6: Install gifenc Dependency & Progress Component

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/progress.tsx` (via shadcn CLI)

**Step 1: Install gifenc**

Run: `npm install gifenc`

**Step 2: Verify gifenc installation**

Run: `node -e "require('gifenc'); console.log('gifenc loaded')"`
Expected: "gifenc loaded" (or similar success)

**Step 3: Install shadcn/ui Progress component**

Run: `npx shadcn@latest add progress`
Expected: `src/components/ui/progress.tsx` created

> **Why:** GifRecordingTab (Phase 5 Task 16) uses `<Progress>` for encoding progress bar. This component is not yet installed.

**Step 4: Verify Progress component exists**

Run: `ls src/components/ui/progress.tsx`
Expected: File exists

**Step 5: Commit**

```bash
git add package.json package-lock.json src/components/ui/progress.tsx
git commit -m "feat(gif): install gifenc and shadcn/ui progress component"
```
