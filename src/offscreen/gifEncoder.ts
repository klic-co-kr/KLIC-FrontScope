// src/offscreen/gifEncoder.ts
// Runs in Offscreen Document context — has full DOM access (Canvas, Image)

import { GIFEncoder, applyPalette } from 'gifenc';
import type { CropBounds, GIFQualityProfile } from '../types/recording';
import { buildGlobalPalette, getSampleIndices, samplePixels } from './paletteBuilder';
import { getFrameDifferenceScore } from './frameDiff';

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
  qualityProfile?: GIFQualityProfile;
  cropBounds?: CropBounds;
  viewportWidth?: number;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const { width, height, fps, maxColors, qualityProfile, cropBounds, viewportWidth, onProgress } = config;
  const defaultDelay = Math.round(1000 / fps);
  const quantizeFormat = qualityProfile === 'balanced' ? 'rgb444' : 'rgb565';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const gif = GIFEncoder();

  // Sort frames by index (ShareX 2-pass: capture order preserved)
  const sortedFrames = [...frames].sort((a, b) => a.index - b.index);
  if (sortedFrames.length === 0) {
    throw new Error('No frames to encode');
  }

  const sampleIndices = getSampleIndices(sortedFrames.length, 24);
  const sampledFrames: Uint8ClampedArray[] = [];

  for (let i = 0; i < sampleIndices.length; i++) {
    const frame = sortedFrames[sampleIndices[i]];
    const imageData = await decodeFrame(frame.dataUrl, width, height, ctx, cropBounds, viewportWidth);
    sampledFrames.push(samplePixels(imageData.data, 2));
    onProgress?.(Math.round(((i + 1) / sampleIndices.length) * 20));
  }

  const globalPalette = buildGlobalPalette(sampledFrames, maxColors, quantizeFormat);
  const useFrameReduction = qualityProfile === 'balanced';
  const frameDiffThreshold = 6;
  let carryDelay = 0;
  let previousKeptFrame: Uint8ClampedArray | null = null;
  let hasWrittenFirstFrame = false;

  const chunkSize = 30;
  for (let i = 0; i < sortedFrames.length; i++) {
    const frame = sortedFrames[i];
    const imageData = await decodeFrame(frame.dataUrl, width, height, ctx, cropBounds, viewportWidth);
    const effectiveDelay = (frame.delay || defaultDelay) + carryDelay;
    const isLastFrame = i === sortedFrames.length - 1;

    if (useFrameReduction && previousKeptFrame && !isLastFrame) {
      const difference = getFrameDifferenceScore(previousKeptFrame, imageData.data, 8);
      if (difference < frameDiffThreshold) {
        carryDelay = effectiveDelay;
        onProgress?.(Math.round(20 + ((i + 1) / sortedFrames.length) * 80));
        continue;
      }
    }

    const indexedPixels = applyPalette(imageData.data, globalPalette, quantizeFormat);

    // Use actual frame delay, fallback to default
    // GIF delay is in centiseconds (1/100s)
    const gifDelay = Math.max(Math.round(effectiveDelay / 10), 2);

    gif.writeFrame(indexedPixels, width, height, {
      palette: hasWrittenFirstFrame ? undefined : globalPalette,
      delay: gifDelay,
    });

    hasWrittenFirstFrame = true;
    previousKeptFrame = imageData.data.slice();
    carryDelay = 0;
    frame.dataUrl = '';

    if ((i + 1) % chunkSize === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    onProgress?.(Math.round(20 + ((i + 1) / sortedFrames.length) * 80));
  }

  gif.finish();
  const bytes = gif.bytes();

  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  return blobToDataUrl(blob);
}

function decodeFrame(
  dataUrl: string,
  outputWidth: number,
  outputHeight: number,
  ctx: CanvasRenderingContext2D,
  cropBounds?: CropBounds,
  viewportWidth?: number,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (cropBounds && viewportWidth) {
        // captureVisibleTab captures at devicePixelRatio scale
        const dpr = img.naturalWidth / viewportWidth;
        const sx = cropBounds.x * dpr;
        const sy = cropBounds.y * dpr;
        const sw = cropBounds.width * dpr;
        const sh = cropBounds.height * dpr;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
      } else {
        ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
      }
      resolve(ctx.getImageData(0, 0, outputWidth, outputHeight));
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
