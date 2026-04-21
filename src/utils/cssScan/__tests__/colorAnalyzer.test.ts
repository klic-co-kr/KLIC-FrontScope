/**
 * Color Analyzer Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseColor,
  calculateContrastRatio,
  calculateLuminance,
  rgbToHex,
  rgbToHsl,
} from '../colorAnalyzer';

describe('colorAnalyzer', () => {
  describe('parseColor', () => {
    it('should parse hex color', () => {
      const result = parseColor('#ff0000');
      expect(result).toBeDefined();
      expect(result?.hex).toBe('#ff0000');
      expect(result?.format).toBe('hex');
    });

    it('should parse hex shorthand', () => {
      const result = parseColor('#f00');
      expect(result?.hex).toBe('#ff0000');
    });

    it('should parse rgb color', () => {
      const result = parseColor('rgb(255, 0, 0)');
      expect(result).toBeDefined();
      expect(result?.rgb).toBe('rgb(255, 0, 0)');
      expect(result?.format).toBe('rgb');
    });

    it('should parse rgba color', () => {
      const result = parseColor('rgba(255, 0, 0, 0.5)');
      expect(result?.format).toBe('rgba');
      expect(result?.alpha).toBe(0.5);
    });

    it('should parse hsl color', () => {
      const result = parseColor('hsl(0, 100%, 50%)');
      expect(result?.format).toBe('hsl');
    });

    it('should parse named color', () => {
      const result = parseColor('red');
      expect(result?.format).toBe('named');
      expect(result?.hex).toBe('#ff0000');
    });

    it('should return null for invalid color', () => {
      const result = parseColor('invalid-color');
      expect(result).toBeNull();
    });
  });

  describe('calculateLuminance', () => {
    it('should calculate luminance for white', () => {
      expect(calculateLuminance('#ffffff')).toBeCloseTo(1, 2);
    });

    it('should calculate luminance for black', () => {
      expect(calculateLuminance('#000000')).toBeCloseTo(0, 2);
    });

    it('should calculate luminance for gray', () => {
      expect(calculateLuminance('#808080')).toBeCloseTo(0.5, 2);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(21);
    });

    it('should calculate contrast ratio for white on black', () => {
      const ratio = calculateContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeGreaterThanOrEqual(21);
    });

    it('should return 1 for same colors', () => {
      const ratio = calculateContrastRatio('#ff0000', '#ff0000');
      expect(ratio).toBe(1);
    });
  });

  describe('rgbToHex', () => {
    it('should convert rgb to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('should pad hex values', () => {
      expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
    });
  });

  describe('rgbToHsl', () => {
    it('should convert rgb to hsl string', () => {
      const hsl = rgbToHsl(255, 0, 0);
      expect(hsl).toContain('hsl(');
      expect(hsl).toContain('0'); // hue
      expect(hsl).toContain('100%'); // saturation
    });
  });
});
