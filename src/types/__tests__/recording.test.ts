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
      qualityProfile: 'balanced',
      width: 640,
      mode: 'fullscreen',
    });
  });

  it('GIFSettings type is assignable', () => {
    const settings: GIFSettings = {
      duration: 5,
      fps: 10,
      quality: 'low',
      qualityProfile: 'balanced',
      width: 320,
      mode: 'fullscreen',
    };
    expect(settings.duration).toBe(5);
  });

  it('RecordingState type is assignable', () => {
    const state: RecordingState = {
      isRecording: false,
      isEncoding: false,
      isSelecting: false,
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
      mode: 'fullscreen',
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
