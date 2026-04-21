// src/hooks/__tests__/useGifSettings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGifSettings } from '../../useGifSettings';
import { DEFAULT_GIF_SETTINGS } from '../../types/recording';

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};

beforeEach(() => {
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn((keys: string[]) =>
          Promise.resolve(
            keys.reduce((acc, key) => ({ ...acc, [key]: mockStorage[key] || null })),
              {} as Record<string, unknown>
          )
        ),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(mockStorage, items);
          return Promise.resolve();
        }),
      },
    },
  });
  // Clear storage
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
});

describe('useGifSettings', () => {
  it('returns default settings initially', () => {
    const { result } = renderHook(() => useGifSettings());
    expect(result.current.settings).toEqual(DEFAULT_GIF_SETTINGS);
  });

  it('updateSettings merges partial settings', () => {
    const { result } = renderHook(() => useGifSettings());

    act(() => {
      result.current.updateSettings({ fps: 5 });
    });

    expect(result.current.settings.fps).toBe(5);
    expect(result.current.settings.duration).toBe(DEFAULT_GIF_SETTINGS.duration);
  });

  it('persists settings to chrome.storage', () => {
    const { result } = renderHook(() => useGifSettings());

    act(() => {
      result.current.updateSettings({ duration: 20 });
    });

    // Verify chrome.storage.local.set was called with correct data
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      'gif:settings': expect.objectContaining({
        duration: 20,
        fps: 5,
        quality: DEFAULT_GIF_SETTINGS.quality,
        width: DEFAULT_GIF_SETTINGS.width,
      }),
    });
  });
});
