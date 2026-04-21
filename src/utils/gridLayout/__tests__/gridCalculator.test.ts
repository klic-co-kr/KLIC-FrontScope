/**
 * Grid Calculator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateColumnWidth,
  calculateGutterWidth,
  calculateGridLines,
  calculateColumnPosition,
  getColumnCountForWidth,
  calculateGridMetrics,
} from '../gridCalculator';

describe('gridCalculator', () => {
  describe('calculateColumnWidth', () => {
    it('should calculate column width with gutters', () => {
      const result = calculateColumnWidth(1200, 12, 20);
      expect(result).toBeCloseTo(93.33, 1); // (1200 - 11 * 20) / 12
    });

    it('should handle no gutters', () => {
      const result = calculateColumnWidth(1200, 12, 0);
      expect(result).toBe(100); // 1200 / 12
    });

    it('should handle single column', () => {
      const result = calculateColumnWidth(1200, 1, 20);
      expect(result).toBe(1200);
    });

    it('should handle zero width', () => {
      const result = calculateColumnWidth(0, 12, 20);
      expect(result).toBe(-20); // Negative gutter compensation
    });
  });

  describe('calculateGutterWidth', () => {
    it('should calculate total gutter width', () => {
      const result = calculateGutterWidth(12, 20);
      expect(result).toBe(220); // 11 * 20
    });

    it('should handle single column (no gutters)', () => {
      const result = calculateGutterWidth(1, 20);
      expect(result).toBe(0);
    });

    it('should handle no gutters', () => {
      const result = calculateGutterWidth(12, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateGridLines', () => {
    it('should calculate vertical grid lines', () => {
      const result = calculateGridLines(1200, 12, 20, 0, 'vertical');
      expect(result).toHaveLength(13); // 12 columns + 1 end line
      expect(result[0]).toBe(0);
      expect(result[12]).toBe(1200);
    });

    it('should calculate horizontal grid lines', () => {
      const result = calculateGridLines(800, 10, 0, 0, 'horizontal');
      expect(result).toHaveLength(11); // 10 rows + 1 end line
    });

    it('should include margin offset', () => {
      const result = calculateGridLines(1000, 10, 10, 50, 'vertical');
      expect(result[0]).toBe(50);
      expect(result[10]).toBe(1050); // 50 + 1000
    });
  });

  describe('calculateColumnPosition', () => {
    it('should calculate start position for column', () => {
      const result = calculateColumnPosition(3, 1200, 12, 20);
      expect(result).toBeCloseTo(286.67, 1);
    });

    it('should handle first column', () => {
      const result = calculateColumnPosition(1, 1200, 12, 20);
      expect(result).toBe(0);
    });

    it('should handle zero-based column', () => {
      const result = calculateColumnPosition(0, 1200, 12, 20);
      expect(result).toBe(0);
    });
  });

  describe('getColumnCountForWidth', () => {
    const breakpoints = [
      { name: 'sm', width: 640, min: 0, max: 640 },
      { name: 'md', width: 768, min: 640, max: 768 },
      { name: 'lg', width: 1024, min: 768, max: 1024 },
      { name: 'xl', width: 1280, min: 1024, max: 1280 },
    ];

    it('should return column count for breakpoint', () => {
      const result = getColumnCountForWidth(700, breakpoints, 12);
      expect(result).toBe(12);
    });

    it('should return default count for unknown width', () => {
      const result = getColumnCountForWidth(2000, breakpoints, 12);
      expect(result).toBe(12);
    });

    it('should handle empty breakpoints', () => {
      const result = getColumnCountForWidth(700, [], 12);
      expect(result).toBe(12);
    });
  });

  describe('calculateGridMetrics', () => {
    it('should calculate complete grid metrics', () => {
      const result = calculateGridMetrics(1200, 12, 20, 0);

      expect(result.columnWidth).toBeCloseTo(93.33, 1);
      expect(result.gutterWidth).toBe(20);
      expect(result.totalGutterWidth).toBe(220);
      expect(result.columnCount).toBe(12);
      expect(result.containerWidth).toBe(1200);
    });

    it('should handle edge case with no columns', () => {
      const result = calculateGridMetrics(1200, 0, 20, 0);

      expect(result.columnCount).toBe(0);
      expect(result.columnWidth).toBe(0);
    });

    it('should include margin in calculations', () => {
      const result = calculateGridMetrics(1100, 12, 20, 50);

      expect(result.containerWidth).toBe(1100);
      expect(result.margin).toBe(50);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle negative values gracefully', () => {
      const result = calculateColumnWidth(-100, 12, 20);
      expect(typeof result).toBe('number');
    });

    it('should handle very large column counts', () => {
      const result = calculateColumnWidth(1200, 100, 0);
      expect(result).toBe(12);
    });

    it('should handle zero gutter width', () => {
      const result = calculateGutterWidth(12, 0);
      expect(result).toBe(0);
    });
  });
});
