/**
 * Tailwind Detection Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectTailwind,
  isTailwindClass,
  parsePaddingValue,
  findClosestTailwindColor,
} from '../detection';
import '../arbitraryDetector';

describe('Tailwind Detection', () => {
  beforeEach(() => {
    // Setup test DOM
    document.body.innerHTML = `
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-blue-600">Title</h1>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('isTailwindClass', () => {
    it('should recognize valid Tailwind classes', () => {
      expect(isTailwindClass('flex')).toBe(true);
      expect(isTailwindClass('items-center')).toBe(true);
      expect(isTailwindClass('text-blue-600')).toBe(true);
      expect(isTailwindClass('p-4')).toBe(true);
    });

    it('should reject non-Tailwind classes', () => {
      expect(isTailwindClass('my-custom-class')).toBe(false);
      expect(isTailwindClass('MyComponent')).toBe(false);
      expect(isTailwindClass('button-primary')).toBe(false);
    });

    it('should handle arbitrary values', () => {
      expect(isTailwindClass('w-[500px]')).toBe(true);
      expect(isTailwindClass('text-[#123456]')).toBe(true);
      expect(isTailwindClass('bg-[rgba(0,0,0,0.5)]')).toBe(true);
    });
  });

  describe('detectTailwind', () => {
    it('should detect Tailwind when classes are present', () => {
      const result = detectTailwind();
      expect(result.isDetected).toBe(true);
      expect(result.source).toBe('build');
    });

    it('should report class count', () => {
      const result = detectTailwind();
      expect(result.classCount).toBeGreaterThan(0);
    });

    it('should detect version as v3 by default for build mode', () => {
      const result = detectTailwind();
      expect(result.version).toBe('v3');
    });
  });
});

describe('Padding Conversion', () => {
  describe('parsePaddingValue', () => {
    it('should convert px to rem values', () => {
      expect(parsePaddingValue('16px')).toBe('4');
      expect(parsePaddingValue('8px')).toBe('2');
      expect(parsePaddingValue('4px')).toBe('1');
    });

    it('should handle rem values', () => {
      expect(parsePaddingValue('1rem')).toBe('4');
      expect(parsePaddingValue('0.5rem')).toBe('2');
    });

    it('should return null for invalid values', () => {
      expect(parsePaddingValue('invalid')).toBeNull();
      expect(parsePaddingValue('10em')).toBeNull();
    });
  });
});

describe('Color Detection', () => {
  describe('findClosestTailwindColor', () => {
    it('should find exact matches', () => {
      const result = findClosestTailwindColor('#3b82f6');
      expect(result?.colorName).toBe('blue');
      expect(result?.shade).toBe(500);
    });

    it('should find close matches', () => {
      const result = findClosestTailwindColor('#3b81f5');
      expect(result?.colorName).toBe('blue');
    });

    it('should return null for distant colors', () => {
      const result = findClosestTailwindColor('#ff00ff');
      expect(result).toBeNull();
    });
  });
});
