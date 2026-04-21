/**
 * Font Pairing Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  suggestFontPair,
  calculatePairContrast,
  validatePair,
  getDocumentFontPairings,
} from '../fontPairing';

describe('fontPairing', () => {
  beforeEach(() => {
    // Setup test document
    document.body.innerHTML = `
      <h1 style="font-family: Playfair Display">Heading</h1>
      <p style="font-family: Source Sans Pro">Body text</p>
      <h2 style="font-family: Montserrat">Subheading</h2>
      <div style="font-family: Open Sans">More content</div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('suggestFontPair', () => {
    it('should suggest font pairs', () => {
      const pairs = suggestFontPair();

      expect(Array.isArray(pairs)).toBe(true);
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs.length).toBeLessThanOrEqual(10);
    });

    it('should suggest pairs with current heading', () => {
      const pairs = suggestFontPair('Playfair Display', undefined);

      expect(pairs.length).toBeGreaterThan(0);
      pairs.forEach(pair => {
        expect(pair.heading).toBe('Playfair Display');
      });
    });

    it('should suggest pairs with current body', () => {
      const pairs = suggestFontPair(undefined, 'Source Sans Pro');

      expect(pairs.length).toBeGreaterThan(0);
      pairs.forEach(pair => {
        expect(pair.body).toBe('Source Sans Pro');
      });
    });

    it('should include score for each pair', () => {
      const pairs = suggestFontPair();

      pairs.forEach(pair => {
        expect(pair.score).toBeGreaterThanOrEqual(0);
        expect(pair.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('calculatePairContrast', () => {
    it('should calculate size ratio', () => {
      const result = calculatePairContrast('24', '16');

      expect(result.ratio).toBeCloseTo(1.5);
    });

    it('should check WCAG AA compliance', () => {
      const result = calculatePairContrast('24', '16');

      expect(result.wcagAA).toBe(true);
    });

    it('should check WCAG AAA compliance', () => {
      const result = calculatePairContrast('32', '16');

      expect(result.wcagAAA).toBe(true);
    });
  });

  describe('validatePair', () => {
    it('should validate good pairs', () => {
      const result = validatePair('Playfair Display', 'Source Sans Pro');

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should reject same font for heading and body', () => {
      const result = validatePair('Arial', 'Arial');

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Heading and body use the same font');
    });

    it('should reject too similar fonts', () => {
      const result = validatePair('Arial', 'Arial Black');

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should check size ratio', () => {
      const result = validatePair('48', '16'); // ratio = 3

      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('Size ratio'))).toBe(true);
    });
  });

  describe('getDocumentFontPairings', () => {
    it('should extract font pairings from document', () => {
      const pairings = getDocumentFontPairings();

      expect(Array.isArray(pairings)).toBe(true);
      expect(pairings.length).toBeGreaterThan(0);
    });

    it('should count usage', () => {
      const pairings = getDocumentFontPairings();

      pairings.forEach(pairing => {
        expect(pairing.usageCount).toBeGreaterThan(0);
      });
    });

    it('should sort by usage count', () => {
      const pairings = getDocumentFontPairings();

      for (let i = 1; i < pairings.length; i++) {
        expect(pairings[i - 1].usageCount).toBeGreaterThanOrEqual(pairings[i].usageCount);
      }
    });
  });
});
