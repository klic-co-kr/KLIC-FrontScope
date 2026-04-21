/**
 * Breakpoint Detector Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  detectBreakpoint,
  getCurrentBreakpoint,
  observeBreakpointChanges,
  getBreakpointInfo,
  BreakpointInfo,
} from '../breakpointDetector';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('breakpointDetector', () => {
  beforeEach(() => {
    mockMatchMedia.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectBreakpoint', () => {
    const defaultBreakpoints = [
      { name: 'sm', width: 640, min: 0, max: 640 },
      { name: 'md', width: 768, min: 640, max: 768 },
      { name: 'lg', width: 1024, min: 768, max: 1024 },
      { name: 'xl', width: 1280, min: 1024, max: 1280 },
    ];

    it('should detect small breakpoint', () => {
      mockMatchMedia.mockReturnValue({ matches: false } as MediaQueryList);

      const result = detectBreakpoint(500, defaultBreakpoints);
      expect(result.name).toBe('sm');
      expect(result.width).toBe(640);
    });

    it('should detect medium breakpoint', () => {
      const result = detectBreakpoint(700, defaultBreakpoints);
      expect(result.name).toBe('md');
      expect(result.width).toBe(768);
    });

    it('should detect large breakpoint', () => {
      const result = detectBreakpoint(900, defaultBreakpoints);
      expect(result.name).toBe('lg');
      expect(result.width).toBe(1024);
    });

    it('should detect extra large breakpoint', () => {
      const result = detectBreakpoint(1200, defaultBreakpoints);
      expect(result.name).toBe('xl');
      expect(result.width).toBe(1280);
    });

    it('should handle width larger than all breakpoints', () => {
      const result = detectBreakpoint(2000, defaultBreakpoints);
      expect(result.name).toBe('xl'); // Returns largest
    });

    it('should handle empty breakpoints array', () => {
      const result = detectBreakpoint(1000, []);
      expect(result).toBeNull();
    });
  });

  describe('getCurrentBreakpoint', () => {
    it('should return breakpoint based on window width', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const result = getCurrentBreakpoint();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle missing window object', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing missing window
      delete global.window;

      const result = getCurrentBreakpoint();

      global.window = originalWindow;
      expect(result).toBeDefined();
    });
  });

  describe('getBreakpointInfo', () => {
    const defaultBreakpoints = [
      { name: 'sm', width: 640, min: 0, max: 640 },
      { name: 'md', width: 768, min: 640, max: 768 },
      { name: 'lg', width: 1024, min: 768, max: 1024 },
      { name: 'xl', width: 1280, min: 1024, max: 1280 },
    ];

    it('should return complete breakpoint info', () => {
      const result = getBreakpointInfo(800, defaultBreakpoints);

      expect(result.name).toBe('lg');
      expect(result.min).toBe(768);
      expect(result.max).toBe(1024);
      expect(result.currentWidth).toBe(800);
    });

    it('should calculate distance to next breakpoint', () => {
      const result = getBreakpointInfo(800, defaultBreakpoints);

      expect(result.nextBreakpoint).toBe('xl');
      expect(result.distanceToNext).toBe(224); // 1024 - 800
    });

    it('should return null for last breakpoint nextBreakpoint', () => {
      const result = getBreakpointInfo(1500, defaultBreakpoints);

      expect(result.nextBreakpoint).toBeNull();
      expect(result.distanceToNext).toBeNull();
    });

    it('should include orientation info', () => {
      const result = getBreakpointInfo(800, defaultBreakpoints, 'landscape');

      expect(result.orientation).toBe('landscape');
    });

    it('should include device category', () => {
      const result = getBreakpointInfo(400, defaultBreakpoints);

      expect(result.category).toBeDefined();
      expect(typeof result.category).toBe('string');
    });
  });

  describe('observeBreakpointChanges', () => {
    it('should call callback on breakpoint change', () => {
      const mockCallback = vi.fn();
      const mockMediaQueryList = {
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList;

      mockMatchMedia.mockReturnValue(mockMediaQueryList);

      const cleanup = observeBreakpointChanges(mockCallback);

      expect(mockMatchMedia).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');

      // Cleanup
      cleanup();
    });

    it('should handle multiple media query listeners', () => {
      const mockCallback = vi.fn();

      const mockMediaQueryList1 = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList;

      const mockMediaQueryList2 = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList;

      mockMatchMedia
        .mockReturnValueOnce(mockMediaQueryList1)
        .mockReturnValueOnce(mockMediaQueryList2);

      const cleanup = observeBreakpointChanges(mockCallback);

      expect(mockMediaQueryList1.addEventListener).toHaveBeenCalled();
      expect(mockMediaQueryList2.addEventListener).toHaveBeenCalled();

      cleanup();
    });

    it('should cleanup listeners on unsubscribe', () => {
      const mockCallback = vi.fn();
      const mockMediaQueryList = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList;

      mockMatchMedia.mockReturnValue(mockMediaQueryList);

      const cleanup = observeBreakpointChanges(mockCallback);
      cleanup();

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('BreakpointInfo interface', () => {
    it('should create valid breakpoint info', () => {
      const info: BreakpointInfo = {
        name: 'md',
        min: 640,
        max: 768,
        currentWidth: 700,
        orientation: 'portrait',
        category: 'tablet',
        nextBreakpoint: 'lg',
        distanceToNext: 68,
      };

      expect(info.name).toBe('md');
      expect(info.orientation).toBe('portrait');
      expect(info.category).toBe('tablet');
    });

    it('should handle null next breakpoint', () => {
      const info: BreakpointInfo = {
        name: 'xl',
        min: 1280,
        max: Infinity,
        currentWidth: 1500,
        orientation: 'landscape',
        category: 'desktop',
        nextBreakpoint: null,
        distanceToNext: null,
      };

      expect(info.nextBreakpoint).toBeNull();
      expect(info.distanceToNext).toBeNull();
    });
  });
});
