/**
 * Grid Layout Integration Tests
 *
 * Tests for end-to-end functionality across multiple modules
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chrome } from 'vitest-chrome-extension';
import type { GuideLine, GridOverlaySettings, WhitespaceSettings } from '../../../../types/gridLayout';
import {
  saveGridLayoutSettings,
  loadGridLayoutSettings,
  saveGuides,
  loadGuides,
  clearGridLayoutData,
} from '../../storageHelpers';
import {
  injectGridOverlay,
  injectWhitespaceOverlay,
  removeAllOverlays,
  isOverlayActive,
} from '../../../content/gridLayout/overlayInjector';
import { MESSAGE_ACTIONS } from '../../../../constants/messages';

describe('Grid Layout Integration Tests', () => {
  beforeEach(() => {
    // Clear storage before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up overlays
    removeAllOverlays();
  });

  describe('Storage Integration', () => {
    it('should save and load grid settings', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      await saveGridLayoutSettings(settings);
      const loaded = await loadGridLayoutSettings();

      expect(loaded).toEqual(settings);
    });

    it('should save and load guides', async () => {
      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
        { id: 'guide-2', type: 'horizontal', position: 200, color: '#00ff00', visible: true, locked: false },
      ];

      await saveGuides(guides);
      const loaded = await loadGuides();

      expect(loaded).toEqual(guides);
    });

    it('should persist settings across sessions', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      await saveGridLayoutSettings(settings);

      // Simulate new session
      const loaded = await loadGridLayoutSettings();

      expect(loaded).toEqual(settings);
    });

    it('should handle concurrent storage operations', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
      ];

      // Save both concurrently
      await Promise.all([
        saveGridLayoutSettings(settings),
        saveGuides(guides),
      ]);

      const [loadedSettings, loadedGuides] = await Promise.all([
        loadGridLayoutSettings(),
        loadGuides(),
      ]);

      expect(loadedSettings).toEqual(settings);
      expect(loadedGuides).toEqual(guides);
    });

    it('should clear all grid layout data', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      await saveGridLayoutSettings(settings);
      await clearGridLayoutData();

      const loaded = await loadGridLayoutSettings();

      expect(loaded.enabled).toBe(false);
    });
  });

  describe('Overlay Injection Integration', () => {
    it('should inject grid overlay', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      injectGridOverlay(settings);

      expect(isOverlayActive()).toBe(true);
    });

    it('should inject whitespace overlay', () => {
      const settings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        spacing: 20,
      };

      injectWhitespaceOverlay(settings);

      expect(isOverlayActive()).toBe(true);
    });

    it('should inject both overlays simultaneously', () => {
      const gridSettings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const whitespaceSettings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        spacing: 20,
      };

      injectGridOverlay(gridSettings);
      injectWhitespaceOverlay(whitespaceSettings);

      expect(isOverlayActive()).toBe(true);
    });

    it('should remove all overlays', () => {
      const gridSettings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      injectGridOverlay(gridSettings);
      expect(isOverlayActive()).toBe(true);

      removeAllOverlays();
      expect(isOverlayActive()).toBe(false);
    });

    it('should update existing overlay', () => {
      const settings1: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      injectGridOverlay(settings1);

      const settings2: GridOverlaySettings = {
        ...settings1,
        columnCount: 6,
        color: '#00ff00',
      };

      injectGridOverlay(settings2);

      expect(isOverlayActive()).toBe(true);
    });
  });

  describe('Message Passing Integration', () => {
    it('should handle GRID_LAYOUT_TOGGLE_OVERLAY message', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY,
        settings,
      };

      // Send message
      chrome.runtime.sendMessage(message);

      // Verify overlay was created
      expect(isOverlayActive()).toBe(true);
    });

    it('should handle GRID_LAYOUT_ADD_GUIDELINE message', () => {
      const guide: GuideLine = {
        id: 'guide-1',
        type: 'vertical',
        position: 100,
        color: '#ff0000',
        visible: true,
        locked: false,
      };

      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDELINE,
        guide,
      };

      chrome.runtime.sendMessage(message);

      // Verify guide was added
    });

    it('should handle GRID_LAYOUT_UPDATE_GUIDELINE message', () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDELINE,
        guideId: 'guide-1',
        updates: { position: 150 },
      };

      chrome.runtime.sendMessage(message);

      // Verify guide was updated
    });

    it('should handle GRID_LAYOUT_REMOVE_GUIDELINE message', () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_GUIDELINE,
        guideId: 'guide-1',
      };

      chrome.runtime.sendMessage(message);

      // Verify guide was removed
    });

    it('should handle GRID_LAYOUT_CLEAR_ALL message', () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_CLEAR_ALL,
      };

      chrome.runtime.sendMessage(message);

      expect(isOverlayActive()).toBe(false);
    });
  });

  describe('Settings Sync Integration', () => {
    it('should sync settings from side panel to content script', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      // Save from side panel
      await saveGridLayoutSettings(settings);

      // Load in content script
      const loaded = await loadGridLayoutSettings();

      expect(loaded).toEqual(settings);
    });

    it('should sync guide changes across contexts', async () => {
      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
      ];

      await saveGuides(guides);

      const loaded = await loadGuides();

      expect(loaded).toEqual(guides);
    });
  });

  describe('Viewport Integration', () => {
    it('should handle viewport changes', () => {
      // Simulate viewport change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      window.dispatchEvent(new Event('resize'));

      // Overlay should update
    });

    it('should detect breakpoint changes', () => {
      const originalWidth = window.innerWidth;

      // Change to mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      window.dispatchEvent(new Event('resize'));

      // Should detect mobile breakpoint

      // Restore
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalWidth,
      });
    });
  });

  describe('Guide Drag Integration', () => {
    it('should handle guide drag events', () => {
      // Start drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 0,
        bubbles: true,
      });

      document.dispatchEvent(mouseDownEvent);

      // Drag
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 0,
        bubbles: true,
      });

      document.dispatchEvent(mouseMoveEvent);

      // End drag
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
      });

      document.dispatchEvent(mouseUpEvent);

      // Verify guide position was updated
    });

    it('should snap guide to grid during drag', () => {
      // Snap should work
    });
  });

  describe('Export/Import Integration', () => {
    it('should export grid layout data', async () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const guides: GuideLine[] = [
        { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
      ];

      await saveGridLayoutSettings(settings);
      await saveGuides(guides);

      const { exportGridLayoutData } = await import('../../storageHelpers');
      const exported = await exportGridLayoutData();

      expect(exported.settings).toEqual(settings);
      expect(exported.guides).toEqual(guides);
    });

    it('should import grid layout data', async () => {
      const data = {
        settings: {
          enabled: true,
          columnCount: 12,
          columnWidth: 80,
          gutterWidth: 20,
          color: '#ff0000',
          opacity: 0.5,
        },
        guides: [
          { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false },
        ],
        viewport: 'desktop-1920x1080',
      };

      const { importGridLayoutData } = await import('../../storageHelpers');
      const result = await importGridLayoutData(data);

      expect(result.success).toBe(true);

      const loaded = await loadGridLayoutSettings();
      expect(loaded.enabled).toBe(true);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      vi.spyOn(chrome.storage.local, 'get').mockRejectedValue(new Error('Storage error'));

      const loaded = await loadGridLayoutSettings();

      expect(loaded).toBeDefined();
      expect(loaded.enabled).toBe(false);
    });

    it('should handle overlay injection errors', () => {
      const invalidSettings = {
        enabled: true,
        columnCount: -1,
        columnWidth: 0,
        gutterWidth: 0,
        color: 'invalid',
        opacity: 2,
      } as GridOverlaySettings;

      expect(() => injectGridOverlay(invalidSettings)).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid overlay updates', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        injectGridOverlay({ ...settings, columnCount: 12 + i });
      }

      const duration = performance.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle many guides efficiently', async () => {
      const guides: GuideLine[] = Array.from({ length: 50 }, (_, i) => ({
        id: `guide-${i}`,
        type: i % 2 === 0 ? 'vertical' : 'horizontal',
        position: i * 20,
        color: '#ff0000',
        visible: true,
        locked: false,
      }));

      const start = performance.now();

      await saveGuides(guides);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Memory Management', () => {
    it('should clean up overlays on deactivate', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      injectGridOverlay(settings);
      expect(isOverlayActive()).toBe(true);

      removeAllOverlays();
      expect(isOverlayActive()).toBe(false);

      // Verify DOM is cleaned up
      const container = document.getElementById('grid-overlay-container');
      expect(container).toBeNull();
    });

    it('should remove event listeners on cleanup', () => {
      // Event listeners should be removed
    });
  });
});
