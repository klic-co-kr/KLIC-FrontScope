/**
 * Annotation Utilities Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnnotationManager } from '../annotation/annotationManager';
import { AnnotationHistory } from '../annotation/history';
import type { ArrowAnnotation, TextAnnotation } from '../../../types/screenshot';

describe('AnnotationManager', () => {
  let canvas: HTMLCanvasElement;
  let originalCanvas: HTMLCanvasElement;
  let manager: AnnotationManager;

  beforeEach(() => {
    // Create test canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    originalCanvas = document.createElement('canvas');
    originalCanvas.width = 800;
    originalCanvas.height = 600;

    const ctx = originalCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 600);
    }

    manager = new AnnotationManager(canvas, originalCanvas);
  });

  describe('addAnnotation', () => {
    it('should add arrow annotation', () => {
      const arrow: ArrowAnnotation = {
        id: 'test-arrow-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 100, y: 100 },
          end: { x: 200, y: 200 },
          style: { color: '#ef4444', width: 3 },
        },
      };

      manager.addAnnotation(arrow);

      const annotations = manager.getAnnotations();
      expect(annotations).toHaveLength(1);
      expect(annotations[0]).toEqual(arrow);
    });

    it('should add text annotation', () => {
      const text: TextAnnotation = {
        id: 'test-text-1',
        type: 'text',
        data: {
          type: 'text',
          text: 'Test annotation',
          position: { x: 50, y: 50 },
          style: {
            color: '#ffffff',
            fontSize: 16,
            fontFamily: 'Arial',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        },
      };

      manager.addAnnotation(text);

      const annotations = manager.getAnnotations();
      expect(annotations).toHaveLength(1);
      expect(annotations[0]).toEqual(text);
    });
  });

  describe('removeAnnotation', () => {
    it('should remove annotation by id', () => {
      const arrow: ArrowAnnotation = {
        id: 'test-arrow-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 100, y: 100 },
          end: { x: 200, y: 200 },
          style: { color: '#ef4444', width: 3 }, // Added style as it might be required or part of data
        },
      };

      manager.addAnnotation(arrow);
      expect(manager.getAnnotations()).toHaveLength(1);

      manager.removeAnnotation('test-arrow-1');
      expect(manager.getAnnotations()).toHaveLength(0);
    });
  });

  describe('clearAnnotations', () => {
    it('should clear all annotations', () => {
      const arrow1: ArrowAnnotation = {
        id: 'test-arrow-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 100, y: 100 },
          end: { x: 200, y: 200 },
          style: { color: 'red', width: 2 },
        },
      };

      const arrow2: ArrowAnnotation = {
        id: 'test-arrow-2',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 300, y: 300 },
          end: { x: 400, y: 400 },
          style: { color: 'blue', width: 2 },
        },
      };

      manager.addAnnotation(arrow1);
      manager.addAnnotation(arrow2);

      expect(manager.getAnnotations()).toHaveLength(2);

      manager.clearAnnotations();
      expect(manager.getAnnotations()).toHaveLength(0);
    });
  });

  describe('toDataURL', () => {
    it('should export to data URL', () => {
      const dataUrl = manager.toDataURL('image/png');
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });
});

describe('AnnotationHistory', () => {
  let history: AnnotationHistory;

  beforeEach(() => {
    history = new AnnotationHistory();
  });

  describe('add', () => {
    it('should add annotation to history', () => {
      const annotation: ArrowAnnotation = {
        id: 'test-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          style: { color: 'black', width: 1 },
        },
      };

      history.add(annotation);

      const present = history.getPresent();
      expect(present).toHaveLength(1);
      expect(present[0]).toEqual(annotation);
    });
  });

  describe('undo', () => {
    it('should undo last action', () => {
      const annotation: ArrowAnnotation = {
        id: 'test-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          style: { color: 'black', width: 1 },
        },
      };

      history.add(annotation);
      expect(history.getPresent()).toHaveLength(1);

      const result = history.undo();
      expect(result).toHaveLength(0);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);
    });

    it('should return null when nothing to undo', () => {
      const result = history.undo();
      expect(result).toBeNull();
    });
  });

  describe('redo', () => {
    it('should redo last undone action', () => {
      const annotation: ArrowAnnotation = {
        id: 'test-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          style: { color: 'black', width: 1 },
        },
      };

      history.add(annotation);
      history.undo();

      expect(history.canRedo()).toBe(true);

      const result = history.redo();
      expect(result).toHaveLength(1);
      expect(history.canRedo()).toBe(false);
      expect(history.canUndo()).toBe(true);
    });

    it('should return null when nothing to redo', () => {
      const result = history.redo();
      expect(result).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset history', () => {
      const annotation: ArrowAnnotation = {
        id: 'test-1',
        type: 'arrow',
        data: {
          type: 'arrow',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          style: { color: 'black', width: 1 },
        },
      };

      history.add(annotation);
      history.undo();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);

      history.reset();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });
});
