import { describe, it, expect } from 'vitest';
import {
  clampDepth,
  getAncestorAtDepth,
  depthDeltaFromDrag,
  depthDeltaFromWheel,
} from '../jsInspectorDepth';

describe('jsInspectorDepth', () => {
  describe('clampDepth', () => {
    it('clamps negative depth to 0', () => {
      expect(clampDepth(-1, 20)).toBe(0);
      expect(clampDepth(-999, 0)).toBe(0);
    });

    it('clamps depth above maxDepth', () => {
      expect(clampDepth(21, 20)).toBe(20);
      expect(clampDepth(999, 3)).toBe(3);
    });

    it('truncates non-integer inputs', () => {
      expect(clampDepth(2.9, 20)).toBe(2);
      expect(clampDepth(2.9, 2.1)).toBe(2);
    });
  });

  describe('getAncestorAtDepth', () => {
    it('returns the element itself at depth 0', () => {
      const el = document.createElement('div');
      expect(getAncestorAtDepth(el, 0)).toBe(el);
    });

    it('walks up the DOM tree by depth', () => {
      const root = document.createElement('div');
      const parent = document.createElement('div');
      const child = document.createElement('div');
      root.appendChild(parent);
      parent.appendChild(child);

      expect(getAncestorAtDepth(child, 1)).toBe(parent);
      expect(getAncestorAtDepth(child, 2)).toBe(root);
    });

    it('clamps at the top when requested depth exceeds available ancestors', () => {
      const root = document.createElement('div');
      const child = document.createElement('div');
      root.appendChild(child);

      expect(getAncestorAtDepth(child, 20)).toBe(root);
    });

    it('respects maxDepth clamp', () => {
      const root = document.createElement('div');
      const parent = document.createElement('div');
      const child = document.createElement('div');
      root.appendChild(parent);
      parent.appendChild(child);

      expect(getAncestorAtDepth(child, 2, 1)).toBe(parent);
    });
  });

  describe('depthDeltaFromDrag', () => {
    it('returns 0 when drag is below threshold', () => {
      expect(depthDeltaFromDrag(-10, 24)).toBe(0);
      expect(depthDeltaFromDrag(10, 24)).toBe(0);
    });

    it('maps dragging up (negative deltaY) to positive depth delta', () => {
      expect(depthDeltaFromDrag(-24, 24)).toBe(1);
      expect(depthDeltaFromDrag(-48, 24)).toBe(2);
    });

    it('maps dragging down (positive deltaY) to negative depth delta', () => {
      expect(depthDeltaFromDrag(24, 24)).toBe(-1);
      expect(depthDeltaFromDrag(50, 24)).toBe(-2);
    });
  });

  describe('depthDeltaFromWheel', () => {
    it('returns +1 for wheel up, -1 for wheel down, 0 for no delta', () => {
      expect(depthDeltaFromWheel(1)).toBe(1);
      expect(depthDeltaFromWheel(-1)).toBe(-1);
      expect(depthDeltaFromWheel(0)).toBe(0);
    });
  });
});
