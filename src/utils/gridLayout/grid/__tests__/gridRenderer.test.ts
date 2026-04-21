/**
 * Grid Renderer Unit Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateGridHTML,
  updateGridOverlay,
  removeGridOverlay,
  generateColumnGridLines,
  renderGridCanvas,
} from '../gridRenderer';
import type { GridOverlaySettings } from '../../../../types/gridLayout';

describe('gridRenderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    removeGridOverlay();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('generateGridHTML', () => {
    const defaultSettings: GridOverlaySettings = {
      enabled: true,
      columnCount: 12,
      columnWidth: 80,
      gutterWidth: 20,
      color: '#ff0000',
      opacity: 0.5,
    };

    it('should generate grid overlay HTML', () => {
      const html = generateGridHTML(defaultSettings, 1200);

      expect(html).toContain('grid-overlay-container');
      expect(html).toContain('background-color');
    });

    it('should include correct number of columns', () => {
      const html = generateGridHTML(defaultSettings, 1200);

      // Check for 12 columns
      expect(html).toContain('data-column');
    });

    it('should handle zero width', () => {
      const html = generateGridHTML(defaultSettings, 0);

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
    });

    it('should include margin offset', () => {
      const settingsWithMargin = { ...defaultSettings, margin: 50 };
      const html = generateGridHTML(settingsWithMargin, 1200);

      expect(html).toBeDefined();
    });

    it('should handle disabled grid', () => {
      const disabledSettings = { ...defaultSettings, enabled: false };
      const html = generateGridHTML(disabledSettings, 1200);

      expect(html).toBeDefined();
    });
  });

  describe('generateColumnGridLines', () => {
    it('should generate vertical grid lines', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const lines = generateColumnGridLines(settings, 1200);

      expect(lines).toHaveLength(13); // 12 columns + 1 end line
      expect(lines[0].position).toBe(0);
      expect(lines[lines.length - 1].position).toBe(1200);
    });

    it('should include gutter positions', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 4,
        columnWidth: 100,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const lines = generateColumnGridLines(settings, 500);

      // First line at 0
      expect(lines[0].position).toBe(0);

      // Subsequent lines should account for column + gutter
      expect(lines[1].position).toBe(100); // First column width
      expect(lines[2].position).toBe(120); // + gutter
    });

    it('should handle single column', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 1,
        columnWidth: 100,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const lines = generateColumnGridLines(settings, 100);

      expect(lines).toHaveLength(2); // Start and end only
      expect(lines[0].position).toBe(0);
      expect(lines[1].position).toBe(100);
    });
  });

  describe('updateGridOverlay', () => {
    it('should update existing grid overlay', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      // Create initial overlay
      const html = generateGridHTML(settings, 1200);
      container.innerHTML = html;

      // Update settings
      const updatedSettings = { ...settings, color: '#00ff00', columnCount: 6 };
      updateGridOverlay(updatedSettings);

      const updatedContainer = document.getElementById('grid-overlay-container');
      expect(updatedContainer).toBeDefined();
    });

    it('should create overlay if none exists', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      updateGridOverlay(settings);

      const newContainer = document.getElementById('grid-overlay-container');
      expect(newContainer).toBeDefined();
    });

    it('should handle disabled state', () => {
      const settings: GridOverlaySettings = {
        enabled: false,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      updateGridOverlay(settings);

      const container = document.getElementById('grid-overlay-container');
      // Should not create overlay when disabled
      expect(container).toBeNull();
    });
  });

  describe('removeGridOverlay', () => {
    it('should remove grid overlay elements', () => {
      // Create overlay
      const div = document.createElement('div');
      div.id = 'grid-overlay-container';
      document.body.appendChild(div);

      removeGridOverlay();

      const removed = document.getElementById('grid-overlay-container');
      expect(removed).toBeNull();
    });

    it('should remove wrapper element', () => {
      const wrapper = document.createElement('div');
      wrapper.id = 'grid-overlay-wrapper';
      document.body.appendChild(wrapper);

      removeGridOverlay();

      const removed = document.getElementById('grid-overlay-wrapper');
      expect(removed).toBeNull();
    });

    it('should handle no overlay present', () => {
      expect(() => removeGridOverlay()).not.toThrow();
    });
  });

  describe('renderGridCanvas', () => {
    it('should render grid to canvas', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;

      const result = renderGridCanvas(canvas, settings);

      expect(result).toBe(true);
    });

    it('should handle invalid canvas', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const result = renderGridCanvas(null as any, settings);

      expect(result).toBe(false);
    });

    it('should apply opacity to canvas', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 4,
        columnWidth: 100,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.3,
      };

      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;

      const result = renderGridCanvas(canvas, settings);

      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle zero column count', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 0,
        columnWidth: 80,
        gutterWidth: 20,
        color: '#ff0000',
        opacity: 0.5,
      };

      const html = generateGridHTML(settings, 1200);

      expect(html).toBeDefined();
    });

    it('should handle negative dimensions', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 12,
        columnWidth: -10,
        gutterWidth: -5,
        color: '#ff0000',
        opacity: 0.5,
      };

      const html = generateGridHTML(settings, 1200);

      expect(html).toBeDefined();
    });

    it('should handle very large column counts', () => {
      const settings: GridOverlaySettings = {
        enabled: true,
        columnCount: 100,
        columnWidth: 10,
        gutterWidth: 5,
        color: '#ff0000',
        opacity: 0.5,
      };

      const html = generateGridHTML(settings, 2000);

      expect(html).toBeDefined();
    });
  });
});
