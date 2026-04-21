// src/utils/gif/__tests__/estimateGifSize.test.ts
import { describe, it, expect } from 'vitest';
import { assessGifSizeBudget, estimateGifSize } from '../estimateGifSize';
import type { GIFSettings } from '../../../types/recording';

function makeSettings(overrides: Partial<GIFSettings> = {}): GIFSettings {
  return {
    duration: 10,
    fps: 15,
    quality: 'medium',
    qualityProfile: 'balanced',
    width: 640,
    mode: 'fullscreen',
    ...overrides,
  };
}

describe('estimateGifSize', () => {
  it('returns size in MB for default settings', () => {
    const settings = makeSettings();
    const result = estimateGifSize(settings);
    // 150 frames * ~37.5KB/frame (16:9 @ 640px, medium quality) ≈ ~5.5MB
    expect(result).toBeGreaterThan(1);
    expect(result).toBeLessThan(10);
  });

  it('scales with duration', () => {
    const base = makeSettings({ duration: 5, fps: 10, quality: 'medium', width: 640 });
    const double: GIFSettings = { ...base, duration: 10 };
    expect(estimateGifSize(double)).toBeGreaterThan(estimateGifSize(base));
  });

  it('scales with fps', () => {
    const low = makeSettings({ duration: 10, fps: 5, quality: 'medium', width: 640 });
    const high: GIFSettings = { ...low, fps: 15 };
    expect(estimateGifSize(high)).toBeGreaterThan(estimateGifSize(low));
  });

  it('scales with quality (color count)', () => {
    const low = makeSettings({ duration: 10, fps: 15, quality: 'low', width: 640 });
    const high: GIFSettings = { ...low, quality: 'high' };
    expect(estimateGifSize(high)).toBeGreaterThan(estimateGifSize(low));
  });

  it('scales with width', () => {
    const small = makeSettings({ duration: 10, fps: 15, quality: 'medium', width: 320 });
    const large: GIFSettings = { ...small, width: 800 };
    expect(estimateGifSize(large)).toBeGreaterThan(estimateGifSize(small));
  });

  it('returns a number with 1 decimal place precision', () => {
    const settings = makeSettings({ duration: 10, fps: 15, quality: 'medium', width: 640 });
    const result = estimateGifSize(settings);
    const decimalPlaces = (result.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });

  it('highFidelity profile estimates larger size than balanced', () => {
    const balanced = makeSettings({ qualityProfile: 'balanced' });
    const highFidelity = makeSettings({ qualityProfile: 'highFidelity' });
    expect(estimateGifSize(highFidelity)).toBeGreaterThan(estimateGifSize(balanced));
  });

  it('budget assessment returns suggestion when size is critical', () => {
    const settings = makeSettings({ duration: 30, fps: 15, quality: 'high', width: 1280, qualityProfile: 'highFidelity' });
    const budget = assessGifSizeBudget(settings);
    expect(budget.status).toBe('critical');
    expect(budget.suggestion).toBeDefined();
  });
});
