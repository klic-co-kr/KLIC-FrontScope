# Phase 2: Offscreen + GIF Encoding (Tasks 7-9)

GIF size estimator utility, gifEncoder module, offscreen document entry point.

---

## Task 7: Create GIF Size Estimator Utility

**Files:**
- Create: `src/utils/gif/estimateGifSize.ts`
- Test: `src/utils/gif/__tests__/estimateGifSize.test.ts`

**Step 1: Write the failing test**

```typescript
// src/utils/gif/__tests__/estimateGifSize.test.ts
import { describe, it, expect } from 'vitest';
import { estimateGifSize } from '../estimateGifSize';
import type { GIFSettings } from '../../../types/recording';

describe('estimateGifSize', () => {
  it('returns size in MB for default settings', () => {
    const settings: GIFSettings = {
      duration: 10,
      fps: 15,
      quality: 'medium',
      width: 640,
    };
    const result = estimateGifSize(settings);
    // 150 frames * ~37.5KB/frame (16:9 @ 640px, medium quality) ≈ ~5.5MB
    expect(result).toBeGreaterThan(1);
    expect(result).toBeLessThan(10);
  });

  it('scales with duration', () => {
    const base: GIFSettings = { duration: 5, fps: 10, quality: 'medium', width: 640 };
    const double: GIFSettings = { ...base, duration: 10 };
    expect(estimateGifSize(double)).toBeGreaterThan(estimateGifSize(base));
  });

  it('scales with fps', () => {
    const low: GIFSettings = { duration: 10, fps: 5, quality: 'medium', width: 640 };
    const high: GIFSettings = { ...low, fps: 15 };
    expect(estimateGifSize(high)).toBeGreaterThan(estimateGifSize(low));
  });

  it('scales with quality (color count)', () => {
    const low: GIFSettings = { duration: 10, fps: 15, quality: 'low', width: 640 };
    const high: GIFSettings = { ...low, quality: 'high' };
    expect(estimateGifSize(high)).toBeGreaterThan(estimateGifSize(low));
  });

  it('scales with width', () => {
    const small: GIFSettings = { duration: 10, fps: 15, quality: 'medium', width: 320 };
    const large: GIFSettings = { ...small, width: 800 };
    expect(estimateGifSize(large)).toBeGreaterThan(estimateGifSize(small));
  });

  it('returns a number with 1 decimal place precision', () => {
    const settings: GIFSettings = { duration: 10, fps: 15, quality: 'medium', width: 640 };
    const result = estimateGifSize(settings);
    const decimalPlaces = (result.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/gif/__tests__/estimateGifSize.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/utils/gif/estimateGifSize.ts
import { GIF_QUALITY_COLORS } from '../../types/recording';
import type { GIFSettings } from '../../types/recording';

/**
 * Estimate GIF file size in MB based on settings.
 *
 * Heuristic: GIF byte size per frame ~ width * aspectHeight * colorDepthFactor / compressionRatio
 * LZW compression typically achieves 2-4x on screen content.
 */
export function estimateGifSize(settings: GIFSettings): number {
  const { duration, fps, quality, width } = settings;
  const frameCount = duration * fps;
  const height = Math.round(width * 0.5625); // assume 16:9 aspect (common viewport)
  const colors = GIF_QUALITY_COLORS[quality];

  // Bytes per pixel in palette-indexed GIF: ~1 byte (8-bit index)
  // LZW compression ratio: ~3x for typical screen content
  const colorDepthFactor = colors / 256; // higher colors = larger
  const rawBytesPerFrame = width * height * 1 * colorDepthFactor;
  const compressedBytesPerFrame = rawBytesPerFrame / 3;

  // GIF overhead: header + color table + frame descriptors
  const overhead = 1024; // ~1KB
  const totalBytes = overhead + frameCount * compressedBytesPerFrame;

  return Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/gif/__tests__/estimateGifSize.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/utils/gif/estimateGifSize.ts src/utils/gif/__tests__/estimateGifSize.test.ts
git commit -m "feat(gif): add GIF file size estimation utility"
```

---

## Task 8: Create Offscreen Document GIF Encoder

**Files:**
- Create: `src/offscreen/gifEncoder.ts`

**Step 1: Write the GIF encoder module**

```typescript
// src/offscreen/gifEncoder.ts
// Runs in Offscreen Document context — has full DOM access (Canvas, Image)

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

interface FrameData {
  dataUrl: string;
  index: number;
  delay: number; // actual ms delay from previous frame
}

let frames: FrameData[] = [];

/**
 * Set all frames at once (batch transfer from background).
 * This avoids per-frame chrome.runtime.sendMessage broadcasts
 * that would also reach side panel unnecessarily (~40KB per frame).
 */
export function setFrames(batch: FrameData[]): void {
  frames = batch;
}

export function clearFrames(): void {
  frames = [];
}

export function getFrameCount(): number {
  return frames.length;
}

export async function encodeGif(config: {
  width: number;
  height: number;
  fps: number;
  maxColors: number;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const { width, height, fps, maxColors, onProgress } = config;
  const defaultDelay = Math.round(1000 / fps);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const gif = GIFEncoder();

  // Sort frames by index (ShareX 2-pass: capture order preserved)
  const sortedFrames = [...frames].sort((a, b) => a.index - b.index);

  for (let i = 0; i < sortedFrames.length; i++) {
    const frame = sortedFrames[i];
    const imageData = await decodeFrame(frame.dataUrl, width, height, ctx);
    const palette = quantize(imageData.data, maxColors);
    const indexedPixels = applyPalette(imageData.data, palette);

    // Use actual frame delay, fallback to default
    // GIF delay is in centiseconds (1/100s)
    const gifDelay = Math.max(Math.round((frame.delay || defaultDelay) / 10), 2);

    gif.writeFrame(indexedPixels, width, height, { palette, delay: gifDelay });

    onProgress?.(Math.round(((i + 1) / sortedFrames.length) * 100));
  }

  gif.finish();
  const bytes = gif.bytes();

  const blob = new Blob([bytes], { type: 'image/gif' });
  return blobToDataUrl(blob);
}

function decodeFrame(
  dataUrl: string,
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = () => reject(new Error('Failed to decode frame'));
    img.src = dataUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors (may need gifenc types — if not available, see Phase 6 Task 21)

**Step 3: Commit**

```bash
git add src/offscreen/gifEncoder.ts
git commit -m "feat(gif): create GIF encoder module for Offscreen Document"
```

---

## Task 9: Create Offscreen Document Entry Point

**Files:**
- Create: `src/offscreen/index.ts`

**Step 1: Write the offscreen message handler**

```typescript
// src/offscreen/index.ts
// Offscreen Document — DOM-capable context for GIF encoding

import { setFrames, clearFrames, encodeGif, getFrameCount } from './gifEncoder';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Batch frame transfer — background sends all frames at once after recording stops.
  // This replaces per-frame ADD_FRAME messages that would broadcast ~40KB payloads
  // to ALL extension contexts (side panel, popup) via chrome.runtime.sendMessage.
  if (message.action === 'GIF_SET_FRAMES') {
    setFrames(message.frames);
    sendResponse({ success: true, frameCount: getFrameCount() });
    return true;
  }

  // Fire-and-forget encoding: background does NOT await this response.
  // Instead, offscreen sends GIF_ENCODE_COMPLETE when done.
  // This prevents service worker termination during long encodings (30-60s+).
  if (message.action === 'GIF_ENCODE') {
    sendResponse({ success: true }); // ACK immediately

    const { config } = message;
    encodeGif({
      width: config.width,
      height: config.height,
      fps: config.fps,
      maxColors: config.maxColors,
      onProgress: (percent) => {
        chrome.runtime.sendMessage({
          action: 'GIF_ENCODING_PROGRESS',
          percent,
        });
      },
    })
      .then((gifDataUrl) => {
        chrome.runtime.sendMessage({
          action: 'GIF_ENCODE_COMPLETE',
          success: true,
          gifDataUrl,
        });
      })
      .catch((error) => {
        chrome.runtime.sendMessage({
          action: 'GIF_ENCODE_COMPLETE',
          success: false,
          error: (error as Error).message,
        });
      });
    return true;
  }

  if (message.action === 'GIF_CLEAR_FRAMES') {
    clearFrames();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'GIF_GET_FRAME_COUNT') {
    sendResponse({ success: true, frameCount: getFrameCount() });
    return true;
  }
});
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Build**

Run: `npm run build`
Expected: Build succeeds, `dist/assets/offscreen.js` is generated

**Step 4: Commit**

```bash
git add src/offscreen/index.ts
git commit -m "feat(gif): create Offscreen Document entry point with message handler"
```
