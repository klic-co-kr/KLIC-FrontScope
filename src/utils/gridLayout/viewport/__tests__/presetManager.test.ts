/**
 * Viewport Preset Manager Unit Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPreset,
  getAllPresets,
  getPresetByCategory,
  createCustomPreset,
  deleteCustomPreset,
  updateCustomPreset,
  getDefaultPreset,
  isCustomPreset,
  presetMatchesDimensions,
} from '../presetManager';
import { DEFAULT_PRESETS } from '../../constants/viewportPresets';

// Mock chrome.storage.local
const mockStorage = new Map<string, any>();

const mockChromeStorage = {
  get: vi.fn((keys, callback) => {
    const result: Record<string, any> = {};
    if (callback) {
      callback(result);
    }
    return Promise.resolve(result);
  }),
  set: vi.fn((items, callback) => {
    for (const [key, value] of Object.entries(items)) {
      mockStorage.set(key, value);
    }
    if (callback) callback();
    return Promise.resolve();
  }),
  remove: vi.fn((keys, callback) => {
    for (const key of keys) {
      mockStorage.delete(key);
    }
    if (callback) callback();
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
  }),
};

Object.defineProperty(global, 'chrome', {
  writable: true,
  value: {
    storage: {
      local: mockChromeStorage,
    },
  },
});

describe('presetManager', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreset', () => {
    it('should return preset by ID', () => {
      const result = getPreset('desktop-1920x1080');
      expect(result).toBeDefined();
      expect(result?.id).toBe('desktop-1920x1080');
      expect(result?.width).toBe(1920);
      expect(result?.height).toBe(1080);
    });

    it('should return null for unknown preset', () => {
      const result = getPreset('unknown-preset');
      expect(result).toBeNull();
    });

    it('should retrieve custom preset from storage', async () => {
      const customPreset = {
        id: 'custom-800x600',
        name: 'Custom 800x600',
        width: 800,
        height: 600,
        category: 'custom',
      };

      mockStorage.set('custom-presets', [customPreset]);

      const result = await getPreset('custom-800x600');
      expect(result).toEqual(customPreset);
    });
  });

  describe('getAllPresets', () => {
    it('should return all default presets', () => {
      const result = getAllPresets();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(DEFAULT_PRESETS);
    });

    it('should include custom presets', async () => {
      const customPresets = [
        {
          id: 'custom-1',
          name: 'Custom 1',
          width: 800,
          height: 600,
          category: 'custom',
        },
      ];

      mockStorage.set('custom-presets', customPresets);

      const result = await getAllPresets();
      expect(result.length).toBeGreaterThan(DEFAULT_PRESETS.length);
    });
  });

  describe('getPresetByCategory', () => {
    it('should return all mobile presets', () => {
      const result = getPresetByCategory('mobile');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.category === 'mobile')).toBe(true);
    });

    it('should return all tablet presets', () => {
      const result = getPresetByCategory('tablet');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.category === 'tablet')).toBe(true);
    });

    it('should return all desktop presets', () => {
      const result = getPresetByCategory('desktop');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.category === 'desktop')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const result = getPresetByCategory('unknown' as any);
      expect(result).toEqual([]);
    });
  });

  describe('createCustomPreset', () => {
    it('should create new custom preset', async () => {
      const preset = {
        name: 'My Custom Preset',
        width: 1440,
        height: 900,
        category: 'custom' as const,
      };

      const result = await createCustomPreset(preset);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(preset.name);
      expect(result.width).toBe(preset.width);
      expect(result.height).toBe(preset.height);
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });

    it('should generate unique ID', async () => {
      const preset = {
        name: 'Test Preset',
        width: 1000,
        height: 800,
        category: 'custom' as const,
      };

      const result1 = await createCustomPreset(preset);
      const result2 = await createCustomPreset(preset);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should validate preset dimensions', async () => {
      const preset = {
        name: 'Invalid Preset',
        width: -100,
        height: 0,
        category: 'custom' as const,
      };

      await expect(createCustomPreset(preset)).rejects.toThrow();
    });
  });

  describe('updateCustomPreset', () => {
    it('should update existing custom preset', async () => {
      const customPreset = {
        id: 'custom-123',
        name: 'Original Name',
        width: 800,
        height: 600,
        category: 'custom' as const,
      };

      mockStorage.set('custom-presets', [customPreset]);

      const updates = { name: 'Updated Name', width: 1024 };
      const result = await updateCustomPreset('custom-123', updates);

      expect(result?.name).toBe('Updated Name');
      expect(result?.width).toBe(1024);
      expect(result?.height).toBe(600); // Unchanged
    });

    it('should return null for non-existent preset', async () => {
      const result = await updateCustomPreset('non-existent', { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should not update default presets', async () => {
      const result = await updateCustomPreset('desktop-1920x1080', { name: 'Hacked' });
      expect(result).toBeNull();
    });
  });

  describe('deleteCustomPreset', () => {
    it('should delete custom preset', async () => {
      const customPreset = {
        id: 'custom-to-delete',
        name: 'Delete Me',
        width: 800,
        height: 600,
        category: 'custom' as const,
      };

      mockStorage.set('custom-presets', [customPreset]);

      const result = await deleteCustomPreset('custom-to-delete');
      expect(result).toBe(true);
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });

    it('should return false for non-existent preset', async () => {
      const result = await deleteCustomPreset('non-existent');
      expect(result).toBe(false);
    });

    it('should not delete default presets', async () => {
      const result = await deleteCustomPreset('desktop-1920x1080');
      expect(result).toBe(false);
    });
  });

  describe('getDefaultPreset', () => {
    it('should return default desktop preset', () => {
      const result = getDefaultPreset();
      expect(result).toBeDefined();
      expect(result.category).toBe('desktop');
    });

    it('should return specific category default', () => {
      const result = getDefaultPreset('mobile');
      expect(result).toBeDefined();
      expect(result.category).toBe('mobile');
    });
  });

  describe('isCustomPreset', () => {
    it('should identify custom presets', () => {
      const result = isCustomPreset('custom-123');
      expect(result).toBe(true);
    });

    it('should identify default presets', () => {
      const result = isCustomPreset('desktop-1920x1080');
      expect(result).toBe(false);
    });

    it('should handle null ID', () => {
      const result = isCustomPreset(null as any);
      expect(result).toBe(false);
    });
  });

  describe('presetMatchesDimensions', () => {
    it('should match exact dimensions', () => {
      const result = presetMatchesDimensions('desktop-1920x1080', 1920, 1080);
      expect(result).toBe(true);
    });

    it('should not match different dimensions', () => {
      const result = presetMatchesDimensions('desktop-1920x1080', 1280, 720);
      expect(result).toBe(false);
    });

    it('should handle non-existent preset', () => {
      const result = presetMatchesDimensions('unknown', 1920, 1080);
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle preset ID validation', () => {
      const result = getPreset('');
      expect(result).toBeNull();
    });

    it('should handle category validation', () => {
      const result = getPresetByCategory('' as any);
      expect(result).toEqual([]);
    });
  });
});
