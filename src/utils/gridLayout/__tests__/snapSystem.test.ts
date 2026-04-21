/**
 * Snap System Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  snapToGuide,
  snapToGrid,
  snapToBreakpoint,
  calculateSnapPosition,
  SnapTarget,
  SnapResult,
} from '../snapSystem';

describe('snapSystem', () => {
  describe('snapToGuide', () => {
    const guides: SnapTarget[] = [
      { type: 'guide', position: 100, id: 'guide-1' },
      { type: 'guide', position: 200, id: 'guide-2' },
      { type: 'guide', position: 300, id: 'guide-3' },
    ];

    it('should snap to nearby guide within threshold', () => {
      const result = snapToGuide(105, guides, 10);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(100);
      expect(result.target?.id).toBe('guide-1');
    });

    it('should not snap to guide outside threshold', () => {
      const result = snapToGuide(115, guides, 10);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(115);
      expect(result.target).toBeNull();
    });

    it('should snap to closest guide when multiple are within threshold', () => {
      const result = snapToGuide(150, guides, 60);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(100); // Closer to 100 than 200
    });

    it('should handle empty guides array', () => {
      const result = snapToGuide(100, [], 10);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(100);
    });
  });

  describe('snapToGrid', () => {
    it('should snap to grid lines', () => {
      const result = snapToGrid(47, 12, 10);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(48); // Closest to 4 * 12 = 48
    });

    it('should not snap outside threshold', () => {
      const result = snapToGrid(47, 12, 1);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(47);
    });

    it('should snap to zero position', () => {
      const result = snapToGrid(2, 12, 5);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(0);
    });

    it('should handle zero grid size', () => {
      const result = snapToGrid(50, 0, 10);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(50);
    });
  });

  describe('snapToBreakpoint', () => {
    const breakpoints = [
      { name: 'sm', width: 640, min: 0, max: 640 },
      { name: 'md', width: 768, min: 640, max: 768 },
      { name: 'lg', width: 1024, min: 768, max: 1024 },
      { name: 'xl', width: 1280, min: 1024, max: 1280 },
    ];

    it('should snap to breakpoint within threshold', () => {
      const result = snapToBreakpoint(765, breakpoints, 10);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(768);
      expect(result.target?.name).toBe('md');
    });

    it('should not snap outside threshold', () => {
      const result = snapToBreakpoint(780, breakpoints, 10);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(780);
    });

    it('should handle empty breakpoints array', () => {
      const result = snapToBreakpoint(768, [], 10);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(768);
    });
  });

  describe('calculateSnapPosition', () => {
    const targets: SnapTarget[] = [
      { type: 'guide', position: 100, id: 'guide-1' },
      { type: 'guide', position: 200, id: 'guide-2' },
      { type: 'grid', position: 120 },
      { type: 'breakpoint', position: 768, name: 'md' },
    ];

    it('should find best snap target among all types', () => {
      const result = calculateSnapPosition(105, targets, 10);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(100); // Closest to guide-1
    });

    it('should prioritize closer targets', () => {
      const result = calculateSnapPosition(118, targets, 10);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(120); // Grid is closer than guide-1
    });

    it('should return original position when no snap possible', () => {
      const result = calculateSnapPosition(500, targets, 10);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(500);
    });

    it('should handle zero threshold', () => {
      const result = calculateSnapPosition(100, targets, 0);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(100);
    });

    it('should return minimum position of 0', () => {
      const result = calculateSnapPosition(-10, targets, 10);
      expect(result.position).toBe(0);
    });
  });

  describe('SnapResult interface', () => {
    it('should create valid snap result', () => {
      const result: SnapResult = {
        snapped: true,
        position: 100,
        target: { type: 'guide', position: 100, id: 'guide-1' },
        distance: 5,
      };

      expect(result.snapped).toBe(true);
      expect(result.position).toBe(100);
      expect(result.target?.type).toBe('guide');
      expect(result.distance).toBe(5);
    });

    it('should create unsnap result', () => {
      const result: SnapResult = {
        snapped: false,
        position: 105,
        target: null,
        distance: 0,
      };

      expect(result.snapped).toBe(false);
      expect(result.target).toBeNull();
    });
  });
});
