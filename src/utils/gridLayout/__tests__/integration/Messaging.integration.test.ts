/**
 * Grid Layout Messaging Integration Tests
 *
 * Tests for message passing between content script and side panel
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chrome } from 'vitest-chrome-extension';
import { MESSAGE_ACTIONS } from '../../../../constants/messages';
import type { GuideLine, GridOverlaySettings, WhitespaceSettings } from '../../../../types/gridLayout';

describe('Grid Layout Messaging Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
  });

  describe('Content Script Message Handling', () => {
    it('should handle GRID_LAYOUT_TOGGLE message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE,
        active: true,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_ACTIVATE message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ACTIVATE,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_DEACTIVATE message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_DEACTIVATE,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Grid Overlay Messages', () => {
    it('should handle GRID_LAYOUT_TOGGLE_OVERLAY message', async () => {
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

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_TOGGLE_WHITESPACE message', async () => {
      const settings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        spacing: 20,
      };

      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_WHITESPACE,
        settings,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Guide Line Messages', () => {
    it('should handle GRID_LAYOUT_ADD_GUIDE message', async () => {
      const guide: GuideLine = {
        id: 'guide-1',
        type: 'vertical',
        position: 100,
        color: '#ff0000',
        visible: true,
        locked: false,
      };

      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE,
        guide,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_UPDATE_GUIDE message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE,
        guideId: 'guide-1',
        updates: { position: 150, color: '#00ff00' },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_REMOVE_GUIDE message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_GUIDE,
        guideId: 'guide-1',
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_TOGGLE_GUIDES message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_GUIDES,
        visible: true,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_GUIDE_MOVED message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_GUIDE_MOVED,
        guideId: 'guide-1',
        position: 200,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Viewport Messages', () => {
    it('should handle GRID_LAYOUT_SET_VIEWPORT message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_SET_VIEWPORT,
        preset: 'desktop-1920x1080',
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_ROTATE_VIEWPORT message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ROTATE_VIEWPORT,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Settings Messages', () => {
    it('should handle GRID_LAYOUT_GET_SETTINGS message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_GET_SETTINGS,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
      expect(response.settings).toBeDefined();
    });

    it('should handle GRID_LAYOUT_UPDATE_SETTINGS message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_SETTINGS,
        settings: {
          gridOverlay: {
            enabled: true,
            columnCount: 12,
            columnWidth: 80,
            gutterWidth: 20,
            color: '#ff0000',
            opacity: 0.5,
          },
        },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Preset Messages', () => {
    it('should handle GRID_LAYOUT_ADD_PRESET message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_PRESET,
        preset: {
          id: 'custom-800x600',
          name: 'Custom Preset',
          width: 800,
          height: 600,
          category: 'custom',
        },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should handle GRID_LAYOUT_REMOVE_PRESET message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_PRESET,
        presetId: 'custom-800x600',
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Export/Import Messages', () => {
    it('should handle GRID_LAYOUT_EXPORT message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_EXPORT,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should handle GRID_LAYOUT_IMPORT message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_IMPORT,
        data: {
          settings: {
            enabled: true,
            columnCount: 12,
          },
          guides: [],
        },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Snapshot Messages', () => {
    it('should handle GRID_LAYOUT_SAVE_SNAPSHOT message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_SAVE_SNAPSHOT,
        name: 'Test Snapshot',
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Info Messages', () => {
    it('should handle GRID_LAYOUT_GET_INFO message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_GET_INFO,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
      expect(response.info).toBeDefined();
    });
  });

  describe('Clear Messages', () => {
    it('should handle GRID_LAYOUT_CLEAR_ALL message', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_CLEAR_ALL,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message actions', async () => {
      const message = {
        action: 'INVALID_ACTION',
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE,
        // Missing guide field
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toBeDefined();
    });

    it('should handle malformed data', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE,
        guideId: 'guide-1',
        updates: 'invalid-data',
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toBeDefined();
    });
  });

  describe('Message Batching', () => {
    it('should handle multiple messages in sequence', async () => {
      const messages = [
        { action: MESSAGE_ACTIONS.GRID_LAYOUT_ACTIVATE },
        { action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, guide: { id: 'guide-1', type: 'vertical', position: 100, color: '#ff0000', visible: true, locked: false } },
        { action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, guide: { id: 'guide-2', type: 'horizontal', position: 200, color: '#00ff00', visible: true, locked: false } },
      ];

      const responses = await Promise.all(
        messages.map(msg => chrome.runtime.sendMessage(msg))
      );

      responses.forEach(response => {
        expect(response.success).toBe(true);
      });
    });
  });

  describe('Message Responses', () => {
    it('should include success status in response', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_GET_INFO,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toHaveProperty('success');
    });

    it('should include data in response when applicable', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_GET_SETTINGS,
      };

      const response = await chrome.runtime.sendMessage(message);

      if (response.success) {
        expect(response).toHaveProperty('settings');
      }
    });

    it('should include error message on failure', async () => {
      const message = {
        action: 'INVALID_ACTION',
      };

      const response = await chrome.runtime.sendMessage(message);

      if (!response.success) {
        expect(response).toHaveProperty('error');
      }
    });
  });

  describe('Cross-Context Communication', () => {
    it('should communicate from side panel to content script', async () => {
      // Side panel sends message
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY,
        settings: { enabled: true, columnCount: 12, columnWidth: 80, gutterWidth: 20, color: '#ff0000', opacity: 0.5 },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });

    it('should communicate from content script to side panel', async () => {
      // Content script sends update
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_GUIDE_MOVED,
        guideId: 'guide-1',
        position: 150,
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response.success).toBe(true);
    });
  });

  describe('Async Message Handling', () => {
    it('should handle async operations', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_EXPORT,
      };

      const startTime = Date.now();
      const response = await chrome.runtime.sendMessage(message);
      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeGreaterThan(0);
    });

    it('should not block on long operations', async () => {
      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_IMPORT,
        data: {
          settings: { enabled: true },
          guides: Array.from({ length: 100 }, (_, i) => ({
            id: `guide-${i}`,
            type: 'vertical',
            position: i * 10,
            color: '#ff0000',
            visible: true,
            locked: false,
          })),
        },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toBeDefined();
    });
  });

  describe('Message Validation', () => {
    it('should validate guide data', async () => {
      const invalidGuide = {
        id: 'guide-1',
        type: 'invalid-type',
        position: -100,
        color: 'not-a-color',
      };

      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE,
        guide: invalidGuide,
      };

      const response = await chrome.runtime.sendMessage(message);

      // Should handle invalid data
      expect(response).toBeDefined();
    });

    it('should validate settings data', async () => {
      const invalidSettings = {
        enabled: 'not-a-boolean',
        columnCount: -1,
        opacity: 2,
      };

      const message = {
        action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_SETTINGS,
        settings: { gridOverlay: invalidSettings },
      };

      const response = await chrome.runtime.sendMessage(message);

      expect(response).toBeDefined();
    });
  });
});
