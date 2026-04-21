/**
 * Download Helpers Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  generateDownloadFilename,
  calculateDataUrlSize,
  checkDownloadPermission,
} from '../downloadHelpers';

describe('downloadHelpers', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('generateDownloadFilename', () => {
    it('should generate filename with PNG extension', () => {
      const filename = generateDownloadFilename('png', 'test', 1672531200000);
      expect(filename).toMatch(/^test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.png$/);
    });

    it('should generate filename with JPEG extension', () => {
      const filename = generateDownloadFilename('jpeg', 'screenshot');
      expect(filename).toMatch(/^screenshot_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.jpg$/);
    });

    it('should generate filename with WebP extension', () => {
      const filename = generateDownloadFilename('webp', 'capture');
      expect(filename).toMatch(/^capture_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.webp$/);
    });
  });

  describe('calculateDataUrlSize', () => {
    it('should calculate size of data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const size = calculateDataUrlSize(dataUrl);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000);
    });

    it('should handle empty data URL', () => {
      const size = calculateDataUrlSize('data:,');
      expect(size).toBe(0);
    });
  });

  describe('checkDownloadPermission', () => {
    it('should check download permission', () => {
      const hasPermission = checkDownloadPermission();
      expect(typeof hasPermission).toBe('boolean');
    });
  });
});
