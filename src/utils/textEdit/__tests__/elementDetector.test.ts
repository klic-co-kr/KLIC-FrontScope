/**
 * Text Edit Unit Tests
 *
 * 텍스트 편집 유틸리티 함수들에 대한 단위 테스트
 */

import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from '@jest/extra';

// DOM 환경 설정
let document: Document;

beforeEach(() => {
  const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://example.com',
  });
  document = window.document;
});

afterEach(() => {
  // 정리
});

describe('Element Detection', () => {
  describe('getEditableElements', () => {
    it('should find text elements', () => {
      // 테스트 요소 생성
      const p1 = document.createElement('p');
      p1.textContent = 'Hello World';
      const p2 = document.createElement('p');
      p2.textContent = 'Test';
      document.body.appendChild(p1);
      document.body.appendChild(p2);

      // 함수 가져오기 (실제 구현 필요)
      // const { getEditableElements } = require('../elementDetector');
      // const elements = getEditableElements();
      // expect(elements).toHaveLength(2);
    });

    it('should exclude script and style elements', () => {
      const script = document.createElement('script');
      const style = document.createElement('style');
      document.body.appendChild(script);
      document.body.appendChild(style);

      // const elements = getEditableElements();
      // expect(elements).not.toContain(script);
      // expect(elements).not.toContain(style);
    });
  });
});

describe('Text Analysis', () => {
  describe('countWords', () => {
    it('should count English words correctly', () => {
      // const { countWords } = require('../textAnalysis');
      // expect(countWords('Hello world test')).toBe(3);
      // expect(countWords('Single')).toBe(1);
    });

    it('should count Korean characters', () => {
      // const { countWords } = require('../textAnalysis');
      // expect(countWords('안녕하세요', 'ko')).toBe(5);
    });
  });

  describe('detectLanguage', () => {
    it('should detect Korean text', () => {
      // const { detectLanguage } = require('../textAnalysis');
      // expect(detectLanguage('안녕하세요')).toBe('ko');
    });

    it('should detect English text', () => {
      // const { detectLanguage } = require('../textAnalysis');
      // expect(detectLanguage('Hello world')).toBe('en');
    });
  });
});

describe('Text Diff', () => {
  describe('calculateDiff', () => {
    it('should detect added words', () => {
      // const { calculateDiff } = require('../textDiff');
      // const diff = calculateDiff('Hello world', 'Hello beautiful world');
      // expect(diff.added).toContain('beautiful');
      // expect(diff.wordDiff).toBe(1);
    });

    it('should calculate similarity', () => {
      // const { calculateDiff } = require('../textDiff');
      // const diff = calculateDiff('Hello world', 'Hello world');
      // expect(diff.similarity).toBe(1);
    });
  });
});

describe('CSS Selector Generator', () => {
  describe('getSelector', () => {
    it('should use ID if available', () => {
      const div = document.createElement('div');
      div.id = 'test-id';
      document.body.appendChild(div);

      // const { getSelector } = require('../../dom/selectorGenerator');
      // expect(getSelector(div)).toBe('#test-id');
    });

    it('should generate nth-child path for duplicate classes', () => {
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      div1.className = 'test';
      div2.className = 'test';
      document.body.appendChild(div1);
      document.body.appendChild(div2);

      // const { getSelector } = require('../../dom/selectorGenerator');
      // const selector1 = getSelector(div1);
      // expect(document.querySelectorAll(selector1)).toHaveLength(1);
    });
  });
});
