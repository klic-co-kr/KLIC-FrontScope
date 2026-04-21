/**
 * Screenshot Default Settings
 *
 * 스크린샷 기본 설정값 정의
 */

import type { ScreenshotSettings, ImageFormat, CaptureMode } from '../types/screenshot';

/**
 * 스크린샷 기본 설정
 */
export const DEFAULT_SCREENSHOT_SETTINGS: ScreenshotSettings = {
  defaultFormat: 'png' as ImageFormat,
  quality: 0.92,
  captureMode: 'element' as CaptureMode,
  enableAnnotations: true,
  autoDownload: false,
  includeCursor: false,
};

/**
 * 포맷별 기본 품질질
 */
export const FORMAT_QUALITIES: Record<string, number> = {
  png: 1.0,
  jpeg: 0.92,
  webp: 0.8,
  bmp: 1.0,
};

/**
 * 포맷별 MIME 타입
 */
export const FORMAT_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

/**
 * 포맷별 파일 확장자
 */
export const FORMAT_EXTENSIONS: Record<string, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  bmp: 'bmp',
};

/**
 * 기본 캡처 영역 크기
 */
export const DEFAULT_CAPTURE_SIZE = {
  width: 1920,
  height: 1080,
};

/**
 * 썸네일 크기
 */
export const THUMBNAIL_SIZE = {
  width: 320,
  height: 180,
};

/**
 * 주석 기본 설정
 */
export const DEFAULT_ANNOTATION_SETTINGS = {
  arrow: {
    color: '#ef4444',
    width: 3,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
  },
  shape: {
    color: '#3b82f6',
    fill: false,
  },
  pen: {
    color: '#10b981',
    width: 2,
  },
} as const;
