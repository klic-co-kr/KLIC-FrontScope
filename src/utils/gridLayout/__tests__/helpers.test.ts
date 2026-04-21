/**
 * Grid Layout Helpers Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  hexToRgba,
  rgbaToHex,
  isValidColor,
  lerp,
  clamp,
  roundToStep,
  inchesToPixels,
  pixelsToInches,
  pixelsToEm,
  emToPixels,
  getPixelRatio,
  formatPosition,
  formatDimension,
  calculateDiagonal,
  aspectRatio,
  fitWithinBounds,
  scaleFromCenter,
  rotatePoint,
  distanceBetweenPoints,
  pointInRect,
  rectsIntersect,
  normalizeAngle,
} from '../helpers';

describe('helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate ID with prefix', () => {
      const id = generateId('test');

      expect(id).toContain('test');
    });
  });

  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      const result = hexToRgba('#ff0000', 0.5);

      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle 3-digit hex', () => {
      const result = hexToRgba('#f00', 1);

      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle 6-digit hex', () => {
      const result = hexToRgba('#00ff00', 0.8);

      expect(result).toBe('rgba(0, 255, 0, 0.8)');
    });

    it('should handle 8-digit hex', () => {
      const result = hexToRgba('#0000ff', 0.3);

      expect(result).toBe('rgba(0, 0, 255, 0.3)');
    });

    it('should handle invalid hex', () => {
      const result = hexToRgba('invalid', 0.5);

      expect(result).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('rgbaToHex', () => {
    it('should convert rgba to hex', () => {
      const result = rgbaToHex(255, 0, 0);

      expect(result).toBe('#ff0000');
    });

    it('should handle alpha channel', () => {
      const result = rgbaToHex(0, 255, 0, 128);

      expect(result).toBe('#00ff0080');
    });

    it('should clamp values to 0-255', () => {
      const result = rgbaToHex(-10, 300, 128);

      expect(result).toBe('#008080');
    });
  });

  describe('isValidColor', () => {
    it('should validate hex colors', () => {
      expect(isValidColor('#ff0000')).toBe(true);
      expect(isValidColor('#f00')).toBe(true);
      expect(isValidColor('#gggggg')).toBe(false);
    });

    it('should validate rgb/rgba colors', () => {
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(isValidColor('rgb(300, 0, 0)')).toBe(false);
    });

    it('should validate named colors', () => {
      expect(isValidColor('red')).toBe(true);
      expect(isValidColor('blue')).toBe(true);
      expect(isValidColor('notacolor')).toBe(false);
    });
  });

  describe('lerp', () => {
    it('should linear interpolate', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0.75)).toBe(75);
    });

    it('should handle t=0 and t=1', () => {
      expect(lerp(50, 100, 0)).toBe(50);
      expect(lerp(50, 100, 1)).toBe(100);
    });
  });

  describe('clamp', () => {
    it('should clamp within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('should handle edge values', () => {
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });
  });

  describe('roundToStep', () => {
    it('should round to nearest step', () => {
      expect(roundToStep(47, 12)).toBe(48);
      expect(roundToStep(53, 12)).toBe(48);
      expect(roundToStep(54, 12)).toBe(60);
    });

    it('should handle zero step', () => {
      expect(roundToStep(50, 0)).toBe(50);
    });

    it('should handle negative values', () => {
      expect(roundToStep(-47, 12)).toBe(-48);
    });
  });

  describe('inchesToPixels', () => {
    it('should convert inches to pixels at 96 DPI', () => {
      expect(inchesToPixels(1)).toBe(96);
      expect(inchesToPixels(2)).toBe(192);
      expect(inchesToPixels(0.5)).toBe(48);
    });

    it('should handle custom DPI', () => {
      expect(inchesToPixels(1, 72)).toBe(72);
    });
  });

  describe('pixelsToInches', () => {
    it('should convert pixels to inches at 96 DPI', () => {
      expect(pixelsToInches(96)).toBe(1);
      expect(pixelsToInches(192)).toBe(2);
      expect(pixelsToInches(48)).toBe(0.5);
    });

    it('should handle custom DPI', () => {
      expect(pixelsToInches(72, 72)).toBe(1);
    });
  });

  describe('pixelsToEm', () => {
    it('should convert pixels to em', () => {
      expect(pixelsToEm(16, 16)).toBe(1);
      expect(pixelsToEm(32, 16)).toBe(2);
      expect(pixelsToEm(8, 16)).toBe(0.5);
    });

    it('should handle zero base size', () => {
      expect(pixelsToEm(16, 0)).toBe(0);
    });
  });

  describe('emToPixels', () => {
    it('should convert em to pixels', () => {
      expect(emToPixels(1, 16)).toBe(16);
      expect(emToPixels(2, 16)).toBe(32);
      expect(emToPixels(0.5, 16)).toBe(8);
    });
  });

  describe('getPixelRatio', () => {
    it('should return device pixel ratio', () => {
      const ratio = getPixelRatio();

      expect(typeof ratio).toBe('number');
      expect(ratio).toBeGreaterThan(0);
    });

    it('should handle default ratio', () => {
      const ratio = getPixelRatio();

      expect(ratio).toBeGreaterThanOrEqual(1);
    });
  });

  describe('formatPosition', () => {
    it('should format position string', () => {
      expect(formatPosition(100)).toBe('100px');
      expect(formatPosition(50.5)).toBe('50.5px');
    });

    it('should handle unit parameter', () => {
      expect(formatPosition(100, 'em')).toBe('100em');
      expect(formatPosition(100, 'rem')).toBe('100rem');
    });

    it('should handle decimals', () => {
      expect(formatPosition(100.123, 'px', 2)).toBe('100.12px');
    });
  });

  describe('formatDimension', () => {
    it('should format dimension with unit', () => {
      expect(formatDimension(1920, 1080)).toBe('1920 × 1080');
    });

    it('should handle custom separator', () => {
      expect(formatDimension(1920, 1080, 'x')).toBe('1920x1080');
    });
  });

  describe('calculateDiagonal', () => {
    it('should calculate diagonal length', () => {
      expect(calculateDiagonal(1920, 1080)).toBeCloseTo(2202.9, 0);
      expect(calculateDiagonal(3, 4)).toBe(5);
    });
  });

  describe('aspectRatio', () => {
    it('should calculate aspect ratio', () => {
      expect(aspectRatio(1920, 1080)).toBeCloseTo(1.78, 2);
      expect(aspectRatio(16, 9)).toBeCloseTo(1.78, 2);
    });

    it('should handle zero height', () => {
      expect(aspectRatio(1920, 0)).toBe(Infinity);
    });

    it('should return simplified ratio', () => {
      const ratio = aspectRatio(1920, 1080, true);
      expect(ratio).toMatch(/\d+:\d+/);
    });
  });

  describe('fitWithinBounds', () => {
    it('should fit dimensions within bounds', () => {
      const result = fitWithinBounds(2000, 1500, 1920, 1080);

      expect(result.width).toBeLessThanOrEqual(1920);
      expect(result.height).toBeLessThanOrEqual(1080);
    });

    it('should maintain aspect ratio', () => {
      const result = fitWithinBounds(2000, 1500, 1920, 1080);
      const ratio = result.width / result.height;

      expect(ratio).toBeCloseTo(2000 / 1500, 1);
    });

    it('should not enlarge if smaller than bounds', () => {
      const result = fitWithinBounds(800, 600, 1920, 1080);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  describe('scaleFromCenter', () => {
    it('should scale rectangle from center', () => {
      const result = scaleFromCenter(100, 100, 200, 200, 1.5);

      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
      expect(result.width).toBe(300);
      expect(result.height).toBe(300);
    });

    it('should handle scale factor < 1', () => {
      const result = scaleFromCenter(100, 100, 200, 200, 0.5);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('rotatePoint', () => {
    it('should rotate point around origin', () => {
      const result = rotatePoint(1, 0, 90);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });

    it('should rotate point around custom center', () => {
      const result = rotatePoint(2, 0, 90, 1, 0);

      expect(result.x).toBeCloseTo(1, 5);
      expect(result.y).toBeCloseTo(1, 5);
    });
  });

  describe('distanceBetweenPoints', () => {
    it('should calculate Euclidean distance', () => {
      expect(distanceBetweenPoints(0, 0, 3, 4)).toBe(5);
      expect(distanceBetweenPoints(0, 0, 1, 1)).toBeCloseTo(1.41, 1);
    });
  });

  describe('pointInRect', () => {
    it('should detect point inside rectangle', () => {
      expect(pointInRect(50, 50, 0, 0, 100, 100)).toBe(true);
      expect(pointInRect(0, 0, 0, 0, 100, 100)).toBe(true);
      expect(pointInRect(100, 100, 0, 0, 100, 100)).toBe(true);
    });

    it('should detect point outside rectangle', () => {
      expect(pointInRect(150, 50, 0, 0, 100, 100)).toBe(false);
      expect(pointInRect(50, 150, 0, 0, 100, 100)).toBe(false);
    });
  });

  describe('rectsIntersect', () => {
    it('should detect intersecting rectangles', () => {
      expect(rectsIntersect(0, 0, 100, 100, 50, 50, 150, 150)).toBe(true);
    });

    it('should detect non-intersecting rectangles', () => {
      expect(rectsIntersect(0, 0, 100, 100, 150, 150, 250, 250)).toBe(false);
    });

    it('should handle touching edges', () => {
      expect(rectsIntersect(0, 0, 100, 100, 100, 0, 200, 100)).toBe(true);
    });
  });

  describe('normalizeAngle', () => {
    it('should normalize angle to 0-360', () => {
      expect(normalizeAngle(370)).toBe(10);
      expect(normalizeAngle(-10)).toBe(350);
      expect(normalizeAngle(180)).toBe(180);
    });

    it('should handle zero', () => {
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(360)).toBe(0);
    });

    it('should handle large angles', () => {
      expect(normalizeAngle(720)).toBe(0);
      expect(normalizeAngle(1080)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle NaN values', () => {
      expect(isNaN(lerp(NaN, 100, 0.5))).toBe(true);
    });

    it('should handle Infinity', () => {
      expect(clamp(Infinity, 0, 100)).toBe(100);
    });

    it('should handle very small numbers', () => {
      expect(roundToStep(0.001, 0.01)).toBeCloseTo(0, 2);
    });
  });
});
