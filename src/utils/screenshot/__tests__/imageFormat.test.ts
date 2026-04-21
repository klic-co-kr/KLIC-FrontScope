/**
 * Image Format Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  canvasToDataUrl,
  getMimeType,
  getFileExtension,
  calculateCompressionRatio,
  getOptimalQuality,
  isFormatSupported,
  supportsWebP,
  supportsAVIF,
} from '../imageFormat';

describe('imageFormat', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
  });

  afterEach(() => {
    canvas.remove();
  });

  describe('canvasToDataUrl', () => {
    it('should convert canvas to PNG data URL', () => {
      const dataUrl = canvasToDataUrl(canvas, 'png', 1);
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should convert canvas to JPEG data URL', () => {
      const dataUrl = canvasToDataUrl(canvas, 'jpeg', 0.8);
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should convert canvas to WebP data URL', () => {
      const dataUrl = canvasToDataUrl(canvas, 'webp', 0.8);
      expect(dataUrl).toMatch(/^data:image\/webp;base64,/);
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for PNG', () => {
      expect(getMimeType('png')).toBe('image/png');
    });

    it('should return correct MIME type for JPEG', () => {
      expect(getMimeType('jpeg')).toBe('image/jpeg');
    });

    it('should return correct MIME type for WebP', () => {
      expect(getMimeType('webp')).toBe('image/webp');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for PNG', () => {
      expect(getFileExtension('png')).toBe('png');
    });

    it('should return correct extension for JPEG', () => {
      expect(getFileExtension('jpeg')).toBe('jpg');
    });

    it('should return correct extension for WebP', () => {
      expect(getFileExtension('webp')).toBe('webp');
    });
  });

  describe('calculateCompressionRatio', () => {
    it('should calculate compression ratio correctly', () => {
      expect(calculateCompressionRatio(1000, 500)).toBe(50);
      expect(calculateCompressionRatio(1000, 200)).toBe(80);
      expect(calculateCompressionRatio(1000, 1000)).toBe(0);
    });

    it('should return 0 for zero original size', () => {
      expect(calculateCompressionRatio(0, 100)).toBe(0);
    });
  });

  describe('getOptimalQuality', () => {
    it('should return default quality when no target size', () => {
      expect(getOptimalQuality(1000)).toBe(0.85);
    });

    it('should return high quality when target size is larger', () => {
      expect(getOptimalQuality(1000, 2000)).toBe(0.92);
    });

    it('should return quality based on compression ratio', () => {
      expect(getOptimalQuality(1000, 800)).toBe(0.92);
      expect(getOptimalQuality(1000, 600)).toBe(0.85);
      expect(getOptimalQuality(1000, 400)).toBe(0.75);
      expect(getOptimalQuality(1000, 200)).toBe(0.65);
    });
  });

  describe('isFormatSupported', () => {
    it('should return true for PNG format', () => {
      expect(isFormatSupported('png')).toBe(true);
    });

    it('should return true for JPEG format', () => {
      expect(isFormatSupported('jpeg')).toBe(true);
    });
  });

  describe('supportsWebP', () => {
    it('should check WebP support', () => {
      const supported = supportsWebP();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('supportsAVIF', () => {
    it('should check AVIF support', () => {
      const supported = supportsAVIF();
      expect(typeof supported).toBe('boolean');
    });
  });
});
