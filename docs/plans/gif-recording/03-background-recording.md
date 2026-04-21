# Phase 3: Background Recording Orchestrator (Tasks 10-11)

Background Service Worker recording module and message handler integration.

---

## Task 10: Create Background Recording Orchestrator

**Files:**
- Create: `src/background/recording.ts`

**Step 1: Write the recording module**

```typescript
// src/background/recording.ts
// Service Worker — NO DOM access. Frame capture + Offscreen Document management only.
//
// Architecture changes from design doc (logical review fixes):
//   1. Frames buffered HERE (not sent per-frame to offscreen) — eliminates
//      chrome.runtime.sendMessage broadcasting ~40KB payloads to all contexts at 15FPS
//   2. Fire-and-forget encoding — background does NOT await encoding response.
//      Offscreen sends GIF_ENCODE_COMPLETE when done. Prevents SW termination
//      during long encodings (30-60s for 450 frames).
//   3. `isStopping` flag — prevents pending captureVisibleTab callbacks from
//      adding frames after stopRecording() is called (race condition fix).

import type { RecordingConfig } from '../types/recording';

interface BufferedFrame {
  dataUrl: string;
  index: number;
  delay: number;
}

let recordingInterval: ReturnType<typeof setInterval> | null = null;
let recordingConfig: RecordingConfig | null = null;
let frameIndex = 0;
let startTime = 0;
let lastFrameTime = 0;
let isCapturing = false;   // guard against overlapping captures
let isStopping = false;    // guard against post-stop capture callbacks

// Frame buffer — held in background, transferred to offscreen in batch at encoding time
let frameBuffer: BufferedFrame[] = [];

// Guard against concurrent createDocument calls (official Chrome docs pattern)
let creatingOffscreen: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'GIF encoding requires Canvas and Image APIs',
  });
  await creatingOffscreen;
  creatingOffscreen = null;
}

async function closeOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

// Ping offscreen document until it responds (listener registered)
async function waitForOffscreenReady(retries = 10, delayMs = 100): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'GIF_GET_FRAME_COUNT' });
      if (res?.success) return;
    } catch { /* offscreen not ready yet */ }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('Offscreen document failed to initialize');
}

export async function startRecording(config: RecordingConfig): Promise<void> {
  recordingConfig = config;
  frameIndex = 0;
  startTime = Date.now();
  lastFrameTime = startTime;
  isCapturing = false;
  isStopping = false;
  frameBuffer = [];

  // Notify content script
  chrome.tabs.sendMessage(config.tabId, { action: 'GIF_RECORDING_STARTED' });

  // Start periodic frame capture (ShareX pattern: capture separate from encoding)
  const interval = Math.round(1000 / config.fps);
  recordingInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;

    // Duration limit check
    if (elapsed >= config.maxDuration) {
      stopRecording();
      return;
    }

    // Skip if previous capture hasn't completed (prevents queue buildup)
    if (isCapturing) return;
    isCapturing = true;

    const now = Date.now();
    const delay = now - lastFrameTime;
    lastFrameTime = now;

    // Use Promise-based captureVisibleTab (MV3 standard, Chrome 88+)
    chrome.tabs.captureVisibleTab(config.windowId, { format: 'jpeg', quality: 80 })
      .then((dataUrl) => {
        isCapturing = false;

        // Race condition guard: if stopRecording() was called while capture was pending,
        // discard this frame to prevent adding frames after encoding has started.
        if (isStopping || !dataUrl) return;

        // Buffer frame locally (NOT sent to offscreen per-frame)
        frameBuffer.push({ dataUrl, index: frameIndex++, delay });

        // Progress broadcast (Side Panel listens on chrome.runtime.onMessage)
        chrome.runtime.sendMessage({
          action: 'GIF_RECORDING_PROGRESS',
          elapsed,
          frameCount: frameIndex,
        });
      })
      .catch(() => { isCapturing = false; });
  }, interval);
}

export async function stopRecording(): Promise<void> {
  // Set stopping flag BEFORE clearInterval to guard pending capture callbacks
  isStopping = true;

  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  if (!recordingConfig) return;

  const config = recordingConfig;
  recordingConfig = null;

  // Notify content script
  chrome.tabs.sendMessage(config.tabId, { action: 'GIF_RECORDING_ENDED' });

  // Create offscreen document for encoding (only needed at encoding time now)
  await ensureOffscreenDocument();
  await waitForOffscreenReady();

  // Transfer all buffered frames to offscreen document in ONE message.
  // This avoids per-frame broadcasts that would send ~40KB×450 to side panel.
  await chrome.runtime.sendMessage({
    action: 'GIF_SET_FRAMES',
    frames: frameBuffer,
  });

  // Free background memory immediately after transfer
  frameBuffer = [];

  // Fire-and-forget: do NOT await encoding response.
  // Offscreen sends GIF_ENCODE_COMPLETE when done (handled in onEncodeComplete).
  // This prevents service worker termination during long encodings (30-60s+).
  chrome.runtime.sendMessage({
    action: 'GIF_ENCODE',
    config: {
      width: config.width,
      height: config.height,
      fps: config.fps,
      maxColors: config.maxColors,
    },
  });

  // Reset state
  frameIndex = 0;
  isCapturing = false;
}

// Listen for encoding completion from offscreen document
export function setupEncodeCompleteListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'GIF_ENCODE_COMPLETE') return;

    if (message.success && message.gifDataUrl) {
      chrome.downloads.download({
        url: message.gifDataUrl,
        filename: `klic-recording-${Date.now()}.gif`,
        saveAs: true,
      });
    }

    // Cleanup: clear frames and close offscreen document
    chrome.runtime.sendMessage({ action: 'GIF_CLEAR_FRAMES' }).catch(() => {});
    closeOffscreenDocument().catch(() => {});
    isStopping = false;
  });
}

export function isRecording(): boolean {
  return recordingInterval !== null;
}

export function isEncodingInProgress(): boolean {
  return isStopping && recordingInterval === null;
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/background/recording.ts
git commit -m "feat(gif): create background recording orchestrator"
```

---

## Task 11: Integrate Recording into Background Message Handler

**Files:**
- Modify: `src/background/index.ts`

**Step 1: Add import and message handlers**

At the top of `src/background/index.ts`, add:

```typescript
import { startRecording, stopRecording, isRecording, isEncodingInProgress, setupEncodeCompleteListener } from './recording';
```

After the import, at module level (outside any listener), initialize the encode complete listener:

```typescript
// Initialize GIF encoding completion listener (fire-and-forget pattern)
setupEncodeCompleteListener();
```

In the existing `chrome.runtime.onMessage.addListener` callback (after the `CAPTURE_FULL_PAGE` handler block), add:

```typescript
    // GIF Recording
    if (request.action === 'GIF_RECORDING_START') {
        startRecording(request.config)
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
        return true;
    }

    if (request.action === 'GIF_RECORDING_STOP') {
        stopRecording()
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
        return true;
    }

    if (request.action === 'GIF_RECORDING_STATUS') {
        sendResponse({
            success: true,
            isRecording: isRecording(),
            isEncoding: isEncodingInProgress(),
        });
        return true;
    }
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/background/index.ts
git commit -m "feat(gif): integrate recording handlers into background message listener"
```
