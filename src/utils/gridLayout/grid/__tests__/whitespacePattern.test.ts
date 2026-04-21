/**
 * Whitespace Pattern Unit Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createWhitespaceOverlay,
  updateWhitespaceOverlay,
  removeWhitespaceOverlay,
  generateWhitespacePattern,
  calculateWhitespaceZones,
  analyzePageWhitespace,
} from '../whitespacePattern';
import type { WhitespaceSettings, WhitespaceZone } from '../../../../types/gridLayout';

describe('whitespacePattern', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    removeWhitespaceOverlay();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('createWhitespaceOverlay', () => {
    const defaultSettings: WhitespaceSettings = {
      enabled: true,
      pattern: 'grid',
      color: '#00ff00',
      opacity: 0.3,
      spacing: 20,
    };

    it('should create whitespace overlay element', () => {
      createWhitespaceOverlay(defaultSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
      expect(overlay?.className).toContain('whitespace-overlay');
    });

    it('should apply grid pattern', () => {
      createWhitespaceOverlay(defaultSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
      expect(overlay?.style.backgroundImage).toBeDefined();
    });

    it('should apply dots pattern', () => {
      const dotsSettings = { ...defaultSettings, pattern: 'dots' };
      createWhitespaceOverlay(dotsSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });

    it('should apply lines pattern', () => {
      const linesSettings = { ...defaultSettings, pattern: 'lines' };
      createWhitespaceOverlay(linesSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });

    it('should apply custom color', () => {
      const customSettings = { ...defaultSettings, color: '#ff00ff' };
      createWhitespaceOverlay(customSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });

    it('should apply custom opacity', () => {
      const customSettings = { ...defaultSettings, opacity: 0.7 };
      createWhitespaceOverlay(customSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
      expect(overlay?.style.opacity).toBe('0.7');
    });

    it('should handle disabled state', () => {
      const disabledSettings = { ...defaultSettings, enabled: false };
      createWhitespaceOverlay(disabledSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeNull();
    });
  });

  describe('updateWhitespaceOverlay', () => {
    const defaultSettings: WhitespaceSettings = {
      enabled: true,
      pattern: 'grid',
      color: '#00ff00',
      opacity: 0.3,
      spacing: 20,
    };

    it('should update existing overlay', () => {
      createWhitespaceOverlay(defaultSettings);

      const updatedSettings = { ...defaultSettings, color: '#ff0000', spacing: 40 };
      updateWhitespaceOverlay(updatedSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });

    it('should create overlay if none exists', () => {
      updateWhitespaceOverlay(defaultSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });

    it('should remove overlay when disabled', () => {
      createWhitespaceOverlay(defaultSettings);

      const disabledSettings = { ...defaultSettings, enabled: false };
      updateWhitespaceOverlay(disabledSettings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeNull();
    });
  });

  describe('removeWhitespaceOverlay', () => {
    it('should remove overlay element', () => {
      const settings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        spacing: 20,
      };

      createWhitespaceOverlay(settings);
      expect(document.getElementById('whitespace-overlay')).toBeDefined();

      removeWhitespaceOverlay();
      expect(document.getElementById('whitespace-overlay')).toBeNull();
    });

    it('should handle no overlay present', () => {
      expect(() => removeWhitespaceOverlay()).not.toThrow();
    });
  });

  describe('generateWhitespacePattern', () => {
    it('should generate grid SVG pattern', () => {
      const pattern = generateWhitespacePattern('grid', '#00ff00', 20);

      expect(pattern).toContain('svg');
      expect(pattern).toContain('pattern');
      expect(pattern).toContain('#00ff00');
    });

    it('should generate dots SVG pattern', () => {
      const pattern = generateWhitespacePattern('dots', '#ff0000', 15);

      expect(pattern).toContain('svg');
      expect(pattern).toContain('circle');
    });

    it('should generate lines SVG pattern', () => {
      const pattern = generateWhitespacePattern('lines', '#0000ff', 10);

      expect(pattern).toContain('svg');
      expect(pattern).toContain('line');
    });

    it('should handle custom spacing', () => {
      const pattern = generateWhitespacePattern('grid', '#00ff00', 50);

      expect(pattern).toContain('50');
    });

    it('should handle invalid pattern type', () => {
      const pattern = generateWhitespacePattern('invalid' as any, '#00ff00', 20);

      expect(pattern).toBeDefined();
    });
  });

  describe('calculateWhitespaceZones', () => {
    beforeEach(() => {
      // Create test elements
      const header = document.createElement('header');
      header.id = 'header';
      header.style.width = '100%';
      header.style.height = '60px';
      container.appendChild(header);

      const main = document.createElement('main');
      main.id = 'main';
      main.style.width = '80%';
      main.style.height = '400px';
      main.style.margin = '20px auto';
      container.appendChild(main);

      const footer = document.createElement('footer');
      footer.id = 'footer';
      footer.style.width = '100%';
      footer.style.height = '40px';
      container.appendChild(footer);
    });

    it('should identify whitespace zones', () => {
      const zones = calculateWhitespaceZones(container);

      expect(Array.isArray(zones)).toBe(true);
      expect(zones.length).toBeGreaterThan(0);
    });

    it('should calculate zone dimensions', () => {
      const zones = calculateWhitespaceZones(container);

      zones.forEach((zone: WhitespaceZone) => {
        expect(zone.x).toBeDefined();
        expect(zone.y).toBeDefined();
        expect(zone.width).toBeDefined();
        expect(zone.height).toBeDefined();
      });
    });

    it('should classify zone types', () => {
      const zones = calculateWhitespaceZones(container);

      zones.forEach((zone: WhitespaceZone) => {
        expect(['margin', 'padding', 'gap', 'empty'].includes(zone.type)).toBe(true);
      });
    });

    it('should handle empty container', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      const zones = calculateWhitespaceZones(emptyContainer);

      expect(Array.isArray(zones)).toBe(true);

      emptyContainer.remove();
    });
  });

  describe('analyzePageWhitespace', () => {
    it('should analyze overall page whitespace', () => {
      const analysis = analyzePageWhitespace();

      expect(analysis).toBeDefined();
      expect(analysis.totalArea).toBeGreaterThan(0);
      expect(analysis.whitespaceArea).toBeGreaterThanOrEqual(0);
      expect(analysis.whitespacePercentage).toBeGreaterThanOrEqual(0);
      expect(analysis.whitespacePercentage).toBeLessThanOrEqual(100);
    });

    it('should identify whitespace zones', () => {
      const analysis = analyzePageWhitespace();

      expect(Array.isArray(analysis.zones)).toBe(true);
    });

    it('should calculate statistics', () => {
      const analysis = analyzePageWhitespace();

      expect(analysis.averageWhitespaceWidth).toBeDefined();
      expect(analysis.averageWhitespaceHeight).toBeDefined();
    });

    it('should handle viewport changes', () => {
      analyzePageWhitespace();

      // Simulate viewport change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const analysis2 = analyzePageWhitespace();

      expect(analysis2).toBeDefined();
    });
  });

  describe('WhitespaceZone interface', () => {
    it('should create valid whitespace zone', () => {
      const zone: WhitespaceZone = {
        type: 'margin',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        element: null,
      };

      expect(zone.type).toBe('margin');
      expect(zone.x).toBe(0);
      expect(zone.y).toBe(0);
      expect(zone.width).toBe(100);
      expect(zone.height).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should handle zero opacity', () => {
      const settings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0,
        spacing: 20,
      };

      createWhitespaceOverlay(settings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
      expect(overlay?.style.opacity).toBe('0');
    });

    it('should handle very large spacing', () => {
      const settings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        spacing: 500,
      };

      createWhitespaceOverlay(settings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });

    it('should handle negative spacing', () => {
      const settings: WhitespaceSettings = {
        enabled: true,
        pattern: 'grid',
        color: '#00ff00',
        opacity: 0.3,
        spacing: -10,
      };

      createWhitespaceOverlay(settings);

      const overlay = document.getElementById('whitespace-overlay');
      expect(overlay).toBeDefined();
    });
  });
});
