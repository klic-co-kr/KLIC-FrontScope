/**
 * System Font Utils Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getMonospaceFonts,
  getSerifFonts,
  getSansSerifFonts,
  getDisplayFonts,
  recommendSystemFontsForLanguage,
  recommendKoreanWebFonts,
  recommendJapaneseWebFonts,
  recommendChineseWebFonts,
} from '../systemFontUtils';

describe('systemFontUtils', () => {
  describe('getMonospaceFonts', () => {
    it('should return array of monospace fonts', () => {
      const fonts = getMonospaceFonts();

      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts).toContain('Consolas');
      expect(fonts).toContain('Monaco');
      expect(fonts).toContain('Courier New');
    });
  });

  describe('getSerifFonts', () => {
    it('should return array of serif fonts', () => {
      const fonts = getSerifFonts();

      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts).toContain('Georgia');
      expect(fonts).toContain('Times New Roman');
      expect(fonts).toContain('Palatino');
    });
  });

  describe('getSansSerifFonts', () => {
    it('should return array of sans-serif fonts', () => {
      const fonts = getSansSerifFonts();

      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts).toContain('Arial');
      expect(fonts).toContain('Helvetica');
      expect(fonts).toContain('Verdana');
    });
  });

  describe('getDisplayFonts', () => {
    it('should return array of display fonts', () => {
      const fonts = getDisplayFonts();

      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts).toContain('Impact');
      expect(fonts).toContain('Bebas Neue');
    });
  });

  describe('recommendSystemFontsForLanguage', () => {
    it('should recommend Korean fonts', () => {
      const result = recommendSystemFontsForLanguage('ko');

      expect(result.primary).toBeDefined();
      expect(result.fallback).toBeDefined();
      expect(result.primary).toContain('Gothic');
    });

    it('should recommend Japanese fonts', () => {
      const result = recommendSystemFontsForLanguage('ja');

      expect(result.primary).toBeDefined();
      expect(result.fallback).toBeDefined();
    });

    it('should recommend Chinese fonts (simplified)', () => {
      const result = recommendSystemFontsForLanguage('zh-CN');

      expect(result.primary).toBeDefined();
      expect(result.fallback).toBeDefined();
    });

    it('should recommend Chinese fonts (traditional)', () => {
      const result = recommendSystemFontsForLanguage('zh-TW');

      expect(result.primary).toBeDefined();
      expect(result.fallback).toBeDefined();
    });

    it('should recommend default fonts for unknown language', () => {
      const result = recommendSystemFontsForLanguage('en');

      expect(result.primary).toBe('Arial');
      expect(result.fallback).toContain('Helvetica');
    });
  });

  describe('recommendKoreanWebFonts', () => {
    it('should recommend Korean web fonts', () => {
      const result = recommendKoreanWebFonts();

      expect(result.heading).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.display).toBeDefined();
      expect(result.monospace).toBeDefined();

      expect(result.heading).toContain('Noto Sans KR');
      expect(result.body).toContain('Noto Sans KR');
    });
  });

  describe('recommendJapaneseWebFonts', () => {
    it('should recommend Japanese web fonts', () => {
      const result = recommendJapaneseWebFonts();

      expect(result.heading).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.display).toBeDefined();
      expect(result.monospace).toBeDefined();

      expect(result.heading).toContain('Noto Sans JP');
      expect(result.body).toContain('Noto Sans JP');
    });
  });

  describe('recommendChineseWebFonts', () => {
    it('should recommend Chinese web fonts', () => {
      const result = recommendChineseWebFonts();

      expect(result.heading).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.display).toBeDefined();
      expect(result.monospace).toBeDefined();

      expect(result.heading).toContain('Noto Sans SC');
      expect(result.body).toContain('Noto Sans SC');
    });
  });
});
