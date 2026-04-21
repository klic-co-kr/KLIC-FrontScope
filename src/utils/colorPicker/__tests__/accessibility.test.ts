import { describe, test, expect } from 'vitest';
import { getRelativeLuminance } from '../accessibility/luminance';
import { getContrastRatio } from '../accessibility/contrast';
import { checkWCAG } from '../accessibility/wcag';
import { createColorFromHex } from '../colorFactory';

describe('Accessibility', () => {
  describe('Luminance', () => {
    test('calculates white luminance correctly', () => {
      const lum = getRelativeLuminance({ r: 255, g: 255, b: 255 });
      expect(lum).toBeCloseTo(1, 2);
    });

    test('calculates black luminance correctly', () => {
      const lum = getRelativeLuminance({ r: 0, g: 0, b: 0 });
      expect(lum).toBe(0);
    });
  });

  describe('Contrast Ratio', () => {
    test('calculates max contrast (black on white)', () => {
      const black = createColorFromHex('#000000');
      const white = createColorFromHex('#FFFFFF');
      const ratio = getContrastRatio(black, white);
      expect(ratio).toBe(21);
    });

    test('calculates min contrast (same colors)', () => {
      const white = createColorFromHex('#FFFFFF');
      const ratio = getContrastRatio(white, white);
      expect(ratio).toBe(1);
    });
  });

  describe('WCAG Compliance', () => {
    test('black on white passes AA', () => {
      const black = createColorFromHex('#000000');
      const white = createColorFromHex('#FFFFFF');
      expect(checkWCAG(black, white, 'AA')).toBe(true);
    });

    test('black on white passes AAA', () => {
      const black = createColorFromHex('#000000');
      const white = createColorFromHex('#FFFFFF');
      expect(checkWCAG(black, white, 'AAA')).toBe(true);
    });

    test('white on white fails AA', () => {
      const white = createColorFromHex('#FFFFFF');
      expect(checkWCAG(white, white, 'AA')).toBe(false);
    });
  });
});
