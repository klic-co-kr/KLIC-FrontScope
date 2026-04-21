export function getFrameDifferenceScore(
  previous: Uint8ClampedArray,
  current: Uint8ClampedArray,
  pixelStep = 8,
): number {
  if (previous.length !== current.length || previous.length === 0) {
    return 255;
  }

  const channels = 4;
  const pixels = previous.length / channels;
  let samples = 0;
  let total = 0;

  for (let i = 0; i < pixels; i += pixelStep) {
    const idx = i * channels;
    total += Math.abs(previous[idx] - current[idx]);
    total += Math.abs(previous[idx + 1] - current[idx + 1]);
    total += Math.abs(previous[idx + 2] - current[idx + 2]);
    samples += 3;
  }

  if (samples === 0) return 255;
  return total / samples;
}
