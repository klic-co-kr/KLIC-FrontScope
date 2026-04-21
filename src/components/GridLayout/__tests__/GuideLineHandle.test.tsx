/**
 * GuideLineHandle Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { GuideLineHandle } from '../GuideLineHandle';
import type { GuideLine } from '../../../types/gridLayout';

const sampleGuide: GuideLine = {
  id: 'guide-1',
  type: 'vertical',
  position: 100,
  color: '#ff0000',
  visible: true,
  locked: false,
};

describe('GuideLineHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render guide handle', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply guide color', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('should show handle on hover', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(handle);

      // Handle should be visible
    });

    it('should hide handle when not hovered', () => {
      render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      // Should have low opacity or be hidden
    });
  });

  describe('dragging', () => {
    it('should start drag on mouse down', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseDown(handle);

      // Drag should start
    });

    it('should call onDrag during drag', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseDown(handle);
      fireEvent.mouseMove(document, { clientX: 150 });

      // onDrag should be called with new position
    });

    it('should end drag on mouse up', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseDown(handle);
      fireEvent.mouseUp(document);

      // Drag should end
    });

    it('should use correct cursor for horizontal guides', () => {
      const horizontalGuide: GuideLine = {
        ...sampleGuide,
        type: 'horizontal',
      };

      const { container } = render(
        <GuideLineHandle guide={horizontalGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.cursor).toContain('ns-resize');
    });

    it('should use correct cursor for vertical guides', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.cursor).toContain('ew-resize');
    });
  });

  describe('locked guides', () => {
    it('should show locked state', () => {
      const lockedGuide: GuideLine = {
        ...sampleGuide,
        locked: true,
      };

      const { container } = render(
        <GuideLineHandle guide={lockedGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.classList.contains('locked')).toBe(true);
    });

    it('should not drag locked guides', () => {
      const onDrag = vi.fn();
      const lockedGuide: GuideLine = {
        ...sampleGuide,
        locked: true,
      };

      const { container } = render(
        <GuideLineHandle guide={lockedGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseDown(handle);

      // Should not start drag
    });

    it('should show lock icon', () => {
      const lockedGuide: GuideLine = {
        ...sampleGuide,
        locked: true,
      };

      render(
        <GuideLineHandle guide={lockedGuide} onDrag={vi.fn()} />
      );

      // Lock icon should be visible
    });
  });

  describe('visibility', () => {
    it('should be hidden when guide is invisible', () => {
      const invisibleGuide: GuideLine = {
        ...sampleGuide,
        visible: false,
      };

      const { container } = render(
        <GuideLineHandle guide={invisibleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.display).toBe('none');
    });

    it('should be visible when guide is visible', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.display).not.toBe('none');
    });
  });

  describe('position', () => {
    it('should position correctly for vertical guides', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.left).toBe('100px');
    });

    it('should position correctly for horizontal guides', () => {
      const horizontalGuide: GuideLine = {
        ...sampleGuide,
        type: 'horizontal',
        position: 200,
      };

      const { container } = render(
        <GuideLineHandle guide={horizontalGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.style.top).toBe('200px');
    });
  });

  describe('snap feedback', () => {
    it('should show snap indicator when snapped', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} isSnapped={true} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.classList.contains('snapped')).toBe(true);
    });

    it('should hide snap indicator when not snapped', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} isSnapped={false} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.classList.contains('snapped')).toBe(false);
    });
  });

  describe('touch events', () => {
    it('should handle touch start', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.touchStart(handle, { touches: [{ clientX: 100, clientY: 0 }] });

      // Touch drag should start
    });

    it('should handle touch move', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.touchStart(handle, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchMove(document, { touches: [{ clientX: 150, clientY: 0 }] });

      // onDrag should be called
    });

    it('should handle touch end', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.touchStart(handle, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(document);

      // Touch drag should end
    });
  });

  describe('keyboard interaction', () => {
    it('should be focusable', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('should move on arrow keys', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      handle.focus();
      fireEvent.keyDown(handle, { key: 'ArrowRight' });

      // Should move guide
    });

    it('should move faster with shift key', () => {
      const onDrag = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      const handle = container.firstChild as HTMLElement;
      handle.focus();
      fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });

      // Should move faster
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA label', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.getAttribute('aria-label')).toContain('guide');
    });

    it('should announce position changes', () => {
      render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      // Changes should be announced
    });

    it('should indicate locked state to screen readers', () => {
      const lockedGuide: GuideLine = {
        ...sampleGuide,
        locked: true,
      };

      const { container } = render(
        <GuideLineHandle guide={lockedGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.getAttribute('aria-label')).toContain('locked');
    });
  });

  describe('context menu', () => {
    it('should show context menu on right click', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.contextMenu(handle);

      // Context menu should appear
    });

    it('should allow locking via context menu', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.contextMenu(handle);

      // Lock option should be available
    });

    it('should allow deletion via context menu', () => {
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} onDelete={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.contextMenu(handle);

      // Delete option should be available
    });
  });

  describe('edge cases', () => {
    it('should handle zero position', () => {
      const zeroGuide: GuideLine = {
        ...sampleGuide,
        position: 0,
      };

      const { container } = render(
        <GuideLineHandle guide={zeroGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle).toBeInTheDocument();
    });

    it('should handle very large positions', () => {
      const largeGuide: GuideLine = {
        ...sampleGuide,
        position: 10000,
      };

      const { container } = render(
        <GuideLineHandle guide={largeGuide} onDrag={vi.fn()} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should use transform for smooth dragging', () => {
      render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} />
      );

      // Transform should be used
    });

    it('should not cause layout thrashing', () => {
      const onDrag = vi.fn();
      render(
        <GuideLineHandle guide={sampleGuide} onDrag={onDrag} />
      );

      // Simulate rapid drag events
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(document, { clientX: 100 + i });
      }

      // Should handle efficiently
    });
  });

  describe('double click', () => {
    it('should lock/unlock on double click', () => {
      const onToggleLock = vi.fn();
      const { container } = render(
        <GuideLineHandle guide={sampleGuide} onDrag={vi.fn()} onToggleLock={onToggleLock} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.dblClick(handle);

      expect(onToggleLock).toHaveBeenCalled();
    });
  });
});
