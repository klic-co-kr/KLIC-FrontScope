import { quantize } from 'gifenc';

type QuantizeFormat = 'rgb565' | 'rgb444';

export function getSampleIndices(totalFrames: number, maxSamples = 24): number[] {
  if (totalFrames <= 0) return [];
  if (totalFrames <= maxSamples) {
    return Array.from({ length: totalFrames }, (_, i) => i);
  }

  const step = (totalFrames - 1) / (maxSamples - 1);
  return Array.from({ length: maxSamples }, (_, i) => Math.round(i * step));
}

export function samplePixels(rgba: Uint8ClampedArray, pixelStep = 2): Uint8ClampedArray {
  const totalPixels = rgba.length / 4;
  const sampledCount = Math.ceil(totalPixels / pixelStep);
  const sampled = new Uint8ClampedArray(sampledCount * 4);

  let out = 0;
  for (let i = 0; i < totalPixels; i += pixelStep) {
    const src = i * 4;
    sampled[out++] = rgba[src];
    sampled[out++] = rgba[src + 1];
    sampled[out++] = rgba[src + 2];
    sampled[out++] = rgba[src + 3];
  }

  return sampled;
}

export function buildGlobalPalette(
  sampledFrames: Uint8ClampedArray[],
  maxColors: number,
  format: QuantizeFormat,
): number[][] {
  if (sampledFrames.length === 0) {
    throw new Error('No sampled frames available for palette generation');
  }

  const totalLength = sampledFrames.reduce((sum, frame) => sum + frame.length, 0);
  const merged = new Uint8ClampedArray(totalLength);

  let offset = 0;
  for (const frame of sampledFrames) {
    merged.set(frame, offset);
    offset += frame.length;
  }

  return quantize(merged, maxColors, { format });
}
