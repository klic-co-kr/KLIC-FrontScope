/**
 * Style Extractor Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import {
  calculateSpecificity,
} from '../styleExtractor';

// Mock DOM
global.document = {
  createElement: (tag: string) => ({
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
    },
    getAttribute: () => null,
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
    }),
    children: [],
    querySelectorAll: () => [],
    parentElement: null,
    style: {
      length: 0,
      getPropertyValue: () => '',
      getPropertyPriority: () => '',
    },
  }),
  querySelectorAll: () => [],
  styleSheets: [],
} as unknown as Document;

global.window = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComputedStyle: (_element: unknown) => ({
    length: 0,
    getPropertyValue: (prop: string) => {
      const styles: Record<string, string> = {
        'display': 'block',
        'color': '#000000',
        'background-color': '#ffffff',
        'font-size': '16px',
      };
      return styles[prop] || '';
    },
    getPropertyPriority: () => '',
  }),
} as any;

describe('styleExtractor', () => {
  describe('calculateSpecificity', () => {
    it('should calculate specificity for ID selector', () => {
      expect(calculateSpecificity('#test')).toBe(100);
    });

    it('should calculate specificity for class selector', () => {
      expect(calculateSpecificity('.test')).toBe(10);
    });

    it('should calculate specificity for element selector', () => {
      expect(calculateSpecificity('div')).toBe(1);
    });

    it('should calculate specificity for combined selector', () => {
      expect(calculateSpecificity('#id.class')).toBe(110);
      expect(calculateSpecificity('.class1.class2')).toBe(20);
      expect(calculateSpecificity('div.class')).toBe(11);
    });

    it('should calculate specificity for attribute selector', () => {
      expect(calculateSpecificity('[type="text"]')).toBe(10);
    });

    it('should calculate specificity for pseudo-class', () => {
      expect(calculateSpecificity(':hover')).toBe(10);
    });
  });
});
