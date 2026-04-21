/**
 * Storage Helpers Unit Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveGridLayoutSettings,
  loadGridLayoutSettings,
  saveGuides,
  loadGuides,
  saveViewportPreset,
  loadViewportPreset,
  clearGridLayoutData,
  exportGridLayoutData,
  importGridLayoutData,
  getStorageStats,
} from '../storageHelpers';
import type { GridOverlaySettings, GuideLine } from '../../../types/gridLayout';

// Mock chrome.storage.local
const mockStorage = new Map<string, any>();

const mockChromeStorage = {
  get: vi.fn((keys, callback) => {
    const result: Record<string, any> = {};
    if (Array.isArray(keys)) {
      for (const key of keys) {
        if (mockStorage.has(key)) {
          result[key] = mockStorage.get(key);
        }
      }
    } else if (typeof keys === 'string') {
      if (mockStorage.has(keys)) {
        result[keys] = mockStorage.get(keys);
      }
    } else if (keys === null) {
      // Return all
      for (const [key, value] of mockStorage.entries()) {
        result[key] = value;
      }
    }
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

describe('storageHelpers', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveGridLayoutSettings', () => {
    it('should save grid layout settings', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      await saveGridLayoutSettings(settings);

      expect(mockChromeStorage.set).toHaveBeenCalled();
      const savedData = mockStorage.get('gridLayout:settings');
      expect(savedData).toEqual(settings);
    });

    it('should handle partial settings', async () => {
      const settings: Partial<GridOverlaySettings> = {
        enabled: true,
        columnCount: 12,
      };

      await saveGridLayoutSettings(settings as GridOverlaySettings);

      expect(mockChromeStorage.set).toHaveBeenCalled();
    });
  });

  describe('loadGridLayoutSettings', () => {
    it('should load saved settings', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      mockStorage.set('gridLayout:settings', settings);

      const result = await loadGridLayoutSettings();

      expect(result).toEqual(settings);
    });

    it('should return default settings when none exist', async () => {
      const result = await loadGridLayoutSettings();

      expect(result).toBeDefined();
      expect(result.enabled).toBe(false);
    });

    it('should handle corrupted data', async () => {
      mockStorage.set('gridLayout:settings', 'invalid-json');

      const result = await loadGridLayoutSettings();

      expect(result).toBeDefined();
      expect(result.enabled).toBe(false);
    });
  });

  describe('saveGuides', () => {
    it('should save guide lines', async () => {
      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
        { id: 'guide-2', type: 'horizontal', position: 200, color: '#00ff00', visible: true, locked: false },
      ];

      await saveGuides(guides);

      expect(mockChromeStorage.set).toHaveBeenCalled();
      const savedData = mockStorage.get('gridLayout:guides');
      expect(savedData).toEqual(guides);
    });

    it('should handle empty guides array', async () => {
      await saveGuides([]);

      expect(mockChromeStorage.set).toHaveBeenCalled();
    });
  });

  describe('loadGuides', () => {
    it('should load saved guides', async () => {
      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
      ];

      mockStorage.set('gridLayout:guides', guides);

      const result = await loadGuides();

      expect(result).toEqual(guides);
    });

    it('should return empty array when none exist', async () => {
      const result = await loadGuides();

      expect(result).toEqual([]);
    });
  });

  describe('saveViewportPreset', () => {
    it('should save viewport preset', async () => {
      const preset = 'desktop-1920x1080';

      await saveViewportPreset(preset);

      expect(mockChromeStorage.set).toHaveBeenCalled();
      expect(mockStorage.get('gridLayout:viewport')).toBe(preset);
    });
  });

  describe('loadViewportPreset', () => {
    it('should load saved preset', async () => {
      const preset = 'desktop-1920x1080';
      mockStorage.set('gridLayout:viewport', preset);

      const result = await loadViewportPreset();

      expect(result).toBe(preset);
    });

    it('should return null when none exists', async () => {
      const result = await loadViewportPreset();

      expect(result).toBeNull();
    });
  });

  describe('clearGridLayoutData', () => {
    it('should clear all grid layout data', async () => {
      mockStorage.set('gridLayout:settings', { enabled: true });
      mockStorage.set('gridLayout:guides', []);
      mockStorage.set('gridLayout:viewport', 'desktop-1920x1080');

      await clearGridLayoutData();

      expect(mockChromeStorage.remove).toHaveBeenCalled();
      expect(mockStorage.size).toBe(0);
    });
  });

  describe('exportGridLayoutData', () => {
    it('should export all grid layout data', async () => {
      const settings: GridOverlaySettings = { enabled: true, columnCount: 12, columnWidth: 80, gutterWidth: 20, color: '#ff0000' };
      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
      ];

      mockStorage.set('gridLayout:settings', settings);
      mockStorage.set('gridLayout:guides', guides);
      mockStorage.set('gridLayout:viewport', 'desktop-1920x1080');

      const result = await exportGridLayoutData();

      expect(result).toEqual({
        settings,
        guides,
        viewport: 'desktop-1920x1080',
        exportDate: expect.any(String),
        version: expect.any(String),
      });
    });

    it('should export with custom filename', async () => {
      const result = await exportGridLayoutData('my-grid-layout');

      expect(result.filename).toContain('my-grid-layout');
    });
  });

  describe('importGridLayoutData', () => {
    it('should import grid layout data', async () => {
      const data = {
        settings: { enabled: true, columnCount: 12, columnWidth: 80, gutterWidth: 20, color: '#ff0000' },
        guides: [
          { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
        ],
        viewport: 'desktop-1920x1080',
      };

      const result = await importGridLayoutData(data);

      expect(result.success).toBe(true);
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });

    it('should validate imported data', async () => {
      const invalidData = { settings: 'invalid' };

      const result = await importGridLayoutData(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const data = { settings: null };

      const result = await importGridLayoutData(data as any);

      expect(result.success).toBe(false);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      mockStorage.set('gridLayout:settings', { enabled: true });
      mockStorage.set('gridLayout:guides', [{ id: '1' }]);
      mockStorage.set('gridLayout:viewport', 'desktop-1920x1080');

      const result = await getStorageStats();

      expect(result.keyCount).toBe(3);
      expect(result.guideCount).toBe(1);
      expect(result.hasSettings).toBe(true);
      expect(result.hasViewport).toBe(true);
    });

    it('should return zero stats for empty storage', async () => {
      const result = await getStorageStats();

      expect(result.keyCount).toBe(0);
      expect(result.guideCount).toBe(0);
      expect(result.hasSettings).toBe(false);
    });

    it('should calculate size estimate', async () => {
      mockStorage.set('gridLayout:settings', { enabled: true, columnCount: 12 });

      const result = await getStorageStats();

      expect(result.sizeEstimate).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockChromeStorage.get.mockRejectedValue(new Error('Storage error'));

      const result = await loadGridLayoutSettings();

      expect(result).toBeDefined();
    });

    it('should handle invalid JSON in storage', async () => {
      mockStorage.set('gridLayout:settings', '{invalid json}');

      const result = await loadGridLayoutSettings();

      expect(result).toBeDefined();
    });
  });
});
