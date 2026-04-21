// src/background/recording.ts
// Service Worker — NO DOM access. Frame capture + Offscreen Document management only.
//
// Architecture changes from design doc (logical review fixes):
//   1. Frames buffered HERE (not sent per-frame to offscreen) — eliminates
//      chrome.runtime.sendMessage broadcasting ~40KB payloads to all contexts at 15FPS
//   2. Fire-and-forget encoding — background does NOT await encoding response.
//      Offscreen sends GIF_ENCODE_COMPLETE when done. Prevents SW termination
//      during long encodings (30-60s for 450 frames).
//   3. isStopping flag — prevents pending captureVisibleTab callbacks from
//      adding frames after stopRecording() is called (race condition fix).

import type { RecordingConfig } from '../types/recording';
import { MESSAGE_ACTIONS } from '../constants/messages';

interface BufferedFrame {
  dataUrl: string;
  index: number;
  delay: number;
}

interface CaptureOptions {
  format: 'png' | 'jpeg';
  quality?: number;
}

let recordingInterval: ReturnType<typeof setInterval> | null = null;
let recordingConfig: RecordingConfig | null = null;
let frameIndex = 0;
let startTime = 0;
let lastFrameTime = 0;
let isCapturing = false;   // guard against overlapping captures
let isStopping = false;    // guard against post-stop capture callbacks
let frameBufferBytesEstimate = 0;
let currentCaptureOptions: CaptureOptions = { format: 'jpeg', quality: 90 };

const SOFT_MEMORY_LIMIT_BYTES = 120 * 1024 * 1024;
const HARD_MEMORY_LIMIT_BYTES = 180 * 1024 * 1024;

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
  frameBufferBytesEstimate = 0;
  currentCaptureOptions = config.qualityProfile === 'highFidelity'
    ? { format: 'png' }
    : { format: 'jpeg', quality: 90 };

  // Notify content script (include mode for scroll lock)
  chrome.tabs.sendMessage(config.tabId, {
    action: 'GIF_RECORDING_STARTED',
    data: { mode: config.mode },
  });

  // Start periodic frame capture (ShareX pattern: capture separate from encoding)
  const interval = Math.round(1000 / config.fps);
  recordingInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;

    // Duration limit check
    if (elapsed >= config.maxDuration) {
      stopRecording();
      // Notify Side Panel of auto-stop (H5)
      chrome.runtime.sendMessage({ action: 'GIF_RECORDING_AUTO_STOPPED' });
      return;
    }

    // Skip if previous capture hasn't completed (prevents queue buildup)
    if (isCapturing) return;
    isCapturing = true;

    const now = Date.now();
    const delay = now - lastFrameTime;
    lastFrameTime = now;

    // Use Promise-based captureVisibleTab (MV3 standard, Chrome 88+)
    chrome.tabs.captureVisibleTab(config.windowId, currentCaptureOptions)
      .then((dataUrl) => {
        isCapturing = false;

        // Race condition guard: if stopRecording() was called while capture was pending,
        // discard this frame to prevent adding frames after encoding has started.
        if (isStopping || !dataUrl) return;

        // Buffer frame locally (NOT sent to offscreen per-frame)
        frameBuffer.push({ dataUrl, index: frameIndex++, delay });
        frameBufferBytesEstimate += estimateDataUrlBytes(dataUrl);

        if (frameBufferBytesEstimate >= SOFT_MEMORY_LIMIT_BYTES && currentCaptureOptions.format === 'png') {
          currentCaptureOptions = { format: 'jpeg', quality: 90 };
          chrome.runtime.sendMessage({
            action: MESSAGE_ACTIONS.GIF_RECORDING_MEMORY_ADJUSTED,
            data: { mode: 'balanced' },
          });
        }

        if (frameBufferBytesEstimate >= HARD_MEMORY_LIMIT_BYTES) {
          chrome.runtime.sendMessage({
            action: 'GIF_RECORDING_AUTO_STOPPED',
            data: { reason: 'memory' },
          });
          void stopRecording();
          return;
        }

        // Progress broadcast (Side Panel listens on chrome.runtime.onMessage)
        chrome.runtime.sendMessage({
          action: 'GIF_RECORDING_PROGRESS',
          data: { elapsed, frameCount: frameIndex },
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
  frameBufferBytesEstimate = 0;

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
      qualityProfile: config.qualityProfile,
      cropBounds: config.cropBounds,
      viewportWidth: config.viewportWidth,
    },
  });

  // Reset state
  frameIndex = 0;
  isCapturing = false;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return 0;
  const base64 = dataUrl.slice(commaIndex + 1);
  return Math.floor((base64.length * 3) / 4);
}

// Listen for encoding completion from offscreen document
// Download is handled by Side Panel — background only does cleanup
export function setupEncodeCompleteListener(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'GIF_ENCODE_COMPLETE') return;

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
