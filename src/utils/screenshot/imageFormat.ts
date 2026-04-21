/**
 * Image Format Utilities
 *
 * 이미지 포맷 변환 및 처리 유틸리티
 */

import type { ImageFormat } from '../../types/screenshot';
import { FORMAT_MIME_TYPES, FORMAT_EXTENSIONS } from '../../constants/screenshotDefaults';

/**
 * Canvas를 Data URL로 변환
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number
): string {
  return canvas.toDataURL(
    `image/${format}`,
    quality
  );
}

/**
 * 포맷에 따른 MIME 타입 가져오기
 */
export function getMimeType(format: ImageFormat): string {
  return FORMAT_MIME_TYPES[format];
}

/**
 * 포맷에 따른 파일 확장자 가져오기
 */
export function getFileExtension(format: ImageFormat): string {
  return FORMAT_EXTENSIONS[format];
}

/**
 * 이미지 포맷 변환 (Canvas 기반)
 */
export async function convertFormat(
  canvas: HTMLCanvasElement,
  toFormat: ImageFormat,
  quality: number
): Promise<string> {
  // 임시 이미지 생성
  const image = new Image();
  const dataUrl = canvasToDataUrl(canvas, toFormat, quality);

  return new Promise((resolve, reject) => {
    image.onload = () => {
      // 변환된 이미지를 다시 Canvas에 그리기
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const ctx = newCanvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(image, 0, 0);

        // 원하는 포맷으로 변환
        const result = newCanvas.toDataURL(`image/${toFormat}`, quality);
        resolve(result);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = dataUrl;
  });
}

/**
 * 이미지 압축률 계산
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.round((1 - compressedSize / originalSize) * 100);
}

/**
 * JPEG/WebP 최적 품질 계산
 */
export function getOptimalQuality(
  originalSize: number,
  targetSize?: number
): number {
  // 기본 품질
  if (!targetSize) {
    return 0.85;
  }

  // 목표 크기에 맞는 품질 계산
  if (originalSize <= targetSize) {
    return 0.92;
  }

  const ratio = targetSize / originalSize;

  // 품질 대 크기 감소
  if (ratio > 0.8) {
    return 0.92;
  } else if (ratio > 0.5) {
    return 0.85;
  } else if (ratio > 0.3) {
    return 0.75;
  } else {
    return 0.65;
  }
}

/**
 * 이미지 포맷 지원 확인
 */
export function isFormatSupported(format: ImageFormat): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
}

/**
 * WebP 지원 확인
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * AVIF 지원 확인
 */
export function supportsAVIF(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
}
