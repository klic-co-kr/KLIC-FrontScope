import { describe, test, expect } from 'vitest';
import { hexToRgb, rgbToHex } from '../conversions/hexRgb';
import { rgbToHsl, hslToRgb } from '../conversions/rgbHsl';
import { rgbToHsv, hsvToRgb } from '../conversions/rgbHsv';

describe('Color Conversions', () => {
  describe('HEX ↔ RGB', () => {
    test('hexToRgb converts white correctly', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    });

    test('hexToRgb converts black correctly', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    test('hexToRgb converts red correctly', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('hexToRgb handles 3-digit hex', () => {
      expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('rgbToHex converts white correctly', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
    });

    test('rgbToHex converts black correctly', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    });

    test('rgbToHex converts red correctly', () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000');
    });
  });

  describe('RGB ↔ HSL', () => {
    test('rgbToHsl converts red correctly', () => {
      const result = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    test('rgbToHsl converts green correctly', () => {
      const result = rgbToHsl({ r: 0, g: 255, b: 0 });
      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    test('rgbToHsl converts blue correctly', () => {
      const result = rgbToHsl({ r: 0, g: 0, b: 255 });
      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    test('hslToRgb converts red correctly', () => {
      const result = hslToRgb({ h: 0, s: 100, l: 50 });
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });
  });

  describe('RGB ↔ HSV', () => {
    test('rgbToHsv converts red correctly', () => {
      const result = rgbToHsv({ r: 255, g: 0, b: 0 });
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.v).toBe(100);
    });

    test('hsvToRgb converts red correctly', () => {
      const result = hsvToRgb({ h: 0, s: 100, v: 100 });
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });
  });
});
