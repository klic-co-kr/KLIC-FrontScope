/**
 * Font Extractor Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  extractFontInfo,
  parseFontWeight,
  normalizeFontStyle,
  analyzeFontSizes,
  analyzeLineHeights,
} from '../fontExtractor';

describe('fontExtractor', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('extractFontInfo', () => {
    it('should extract font info from element', () => {
      mockElement.style.fontFamily = 'Arial, sans-serif';
      mockElement.style.fontSize = '16px';
      mockElement.style.fontWeight = 'bold';
      mockElement.style.fontStyle = 'italic';
      mockElement.style.lineHeight = '1.5';

      const fontInfo = extractFontInfo(mockElement);

      expect(fontInfo).toBeDefined();
      expect(fontInfo?.family).toBe('Arial');
      expect(fontInfo?.size).toBe(16);
      expect(fontInfo?.sizeUnit).toBe('px');
      expect(fontInfo?.weight).toBe(700);
      expect(fontInfo?.style).toBe('italic');
      expect(fontInfo?.lineHeight).toBe(1.5);
    });

    it('should return null for non-element', () => {
      const fontInfo = extractFontInfo(null as unknown as HTMLElement);
      expect(fontInfo).toBeNull();
    });

    it('should parse em units', () => {
      mockElement.style.fontSize = '1.5em';
      const fontInfo = extractFontInfo(mockElement);
      expect(fontInfo?.size).toBe(1.5);
      expect(fontInfo?.sizeUnit).toBe('em');
    });

    it('should parse rem units', () => {
      mockElement.style.fontSize = '2rem';
      const fontInfo = extractFontInfo(mockElement);
      expect(fontInfo?.size).toBe(2);
      expect(fontInfo?.sizeUnit).toBe('rem');
    });
  });

  describe('parseFontWeight', () => {
    it('should parse numeric weights', () => {
      expect(parseFontWeight('100')).toBe(100);
      expect(parseFontWeight('400')).toBe(400);
      expect(parseFontWeight('700')).toBe(700);
      expect(parseFontWeight('900')).toBe(900);
    });

    it('should parse named weights', () => {
      expect(parseFontWeight('thin')).toBe(100);
      expect(parseFontWeight('normal')).toBe(400);
      expect(parseFontWeight('bold')).toBe(700);
      expect(parseFontWeight('black')).toBe(900);
    });

    it('should return default for unknown weights', () => {
      expect(parseFontWeight('unknown')).toBe(400);
    });
  });

  describe('normalizeFontStyle', () => {
    it('should normalize italic styles', () => {
      expect(normalizeFontStyle('italic')).toBe('italic');
      expect(normalizeFontStyle('ITALIC')).toBe('italic');
      expect(normalizeFontStyle('Oblique')).toBe('oblique');
    });

    it('should return normal for other styles', () => {
      expect(normalizeFontStyle('normal')).toBe('normal');
      expect(normalizeFontStyle('')).toBe('normal');
    });
  });

  describe('analyzeFontSizes', () => {
    beforeEach(() => {
      // Create elements with different font sizes
      const el1 = document.createElement('p');
      el1.style.fontSize = '16px';
      el1.textContent = 'Text';

      const el2 = document.createElement('h1');
      el2.style.fontSize = '32px';
      el2.textContent = 'Heading';

      const el3 = document.createElement('span');
      el3.style.fontSize = '14px';
      el3.textContent = 'Small';

      document.body.appendChild(el1);
      document.body.appendChild(el2);
      document.body.appendChild(el3);
    });

    it('should analyze font sizes', () => {
      const result = analyzeFontSizes();

      expect(result.sizes.length).toBeGreaterThan(0);
      expect(result.minSize).toBeLessThan(result.maxSize);
      expect(result.averageSize).toBeGreaterThan(0);
    });

    it('should find most common size', () => {
      const result = analyzeFontSizes();
      expect(result.mostCommon).toBeDefined();
      expect(result.mostCommon).not.toBeNull();
    });
  });

  describe('analyzeLineHeights', () => {
    beforeEach(() => {
      const el1 = document.createElement('p');
      el1.style.lineHeight = '1.5';
      el1.textContent = 'Text';

      const el2 = document.createElement('div');
      el2.style.lineHeight = '2';
      el2.textContent = 'More text';

      document.body.appendChild(el1);
      document.body.appendChild(el2);
    });

    it('should analyze line heights', () => {
      const result = analyzeLineHeights();

      expect(result.lineHeights.length).toBeGreaterThan(0);
      expect(result.average).toBeGreaterThan(0);
      expect(result.min).toBeLessThanOrEqual(result.max);
    });

    it('should provide recommendations for poor line heights', () => {
      const el = document.createElement('p');
      el.style.lineHeight = '1';
      el.textContent = 'Tight';
      document.body.appendChild(el);

      const result = analyzeLineHeights();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
