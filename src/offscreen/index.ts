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
      qualityProfile: config.qualityProfile,
      cropBounds: config.cropBounds,
      viewportWidth: config.viewportWidth,
      onProgress: (percent) => {
        chrome.runtime.sendMessage({
          action: 'GIF_ENCODING_PROGRESS',
          data: { percent },
        });
      },
    })
      .then((gifDataUrl) => {
        chrome.runtime.sendMessage({
          action: 'GIF_ENCODE_COMPLETE',
          data: { success: true, gifDataUrl },
        });
      })
      .catch((error) => {
        chrome.runtime.sendMessage({
          action: 'GIF_ENCODE_COMPLETE',
          data: { success: false, error: (error as Error).message },
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
