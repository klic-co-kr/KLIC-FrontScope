/**
 * Image Resize Utilities
 *
 * 이미지 리사이징 및 크롭 유틸리티
 */

import type { Dimensions } from '../../types/screenshot';

/**
 * Canvas 크기 조정
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  quality: number = 1
): HTMLCanvasElement {
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;
  const ctx = resizedCanvas.getContext('2d');

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = quality === 1 ? 'high' : 'medium';
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  }

  return resizedCanvas;
}

/**
 * 비율에 맞춰 크기 조정
 */
export function resizeByAspectRatio(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  const aspectRatio = originalWidth / originalHeight;

  let targetWidth = maxWidth;
  let targetHeight = maxHeight;

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    if (maxWidth / maxHeight > aspectRatio) {
      targetWidth = maxHeight * aspectRatio;
    } else {
      targetHeight = maxWidth / aspectRatio;
    }

    return resizeCanvas(canvas, Math.floor(targetWidth), Math.floor(targetHeight));
  }

  return canvas;
}

/**
 * 썸네일 생성
 */
export function resizeForThumbnail(
  canvas: HTMLCanvasElement,
  thumbnailSize: { width: number; height: number }
): HTMLCanvasElement {
  return resizeByAspectRatio(canvas, thumbnailSize.width, thumbnailSize.height);
}

/**
 * Canvas 크롭
 */
export function cropCanvas(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = width;
  croppedCanvas.height = height;
  const ctx = croppedCanvas.getContext('2d');

  if (ctx) {
    ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  }

  return croppedCanvas;
}

/**
 * 패딩 추가
 */
export function addPadding(
  canvas: HTMLCanvasElement,
  padding: number,
  color: string = '#ffffff'
): HTMLCanvasElement {
  const paddedCanvas = document.createElement('canvas');
  paddedCanvas.width = canvas.width + padding * 2;
  paddedCanvas.height = canvas.height + padding * 2;
  const ctx = paddedCanvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
    ctx.drawImage(canvas, padding, padding);
  }

  return paddedCanvas;
}

/**
 * Canvas 회전
 */
export function rotateCanvas(
  canvas: HTMLCanvasElement,
  degrees: number
): HTMLCanvasElement {
  const radians = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const newWidth = canvas.width * cos + canvas.height * sin;
  const newHeight = canvas.width * sin + canvas.height * cos;

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = newWidth;
  rotatedCanvas.height = newHeight;
  const ctx = rotatedCanvas.getContext('2d');

  if (ctx) {
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  }

  return rotatedCanvas;
}

/**
 * Canvas 좌우 반전
 */
export function flipCanvas(
  canvas: HTMLCanvasElement,
  horizontal: boolean = true
): HTMLCanvasElement {
  const flippedCanvas = document.createElement('canvas');
  flippedCanvas.width = canvas.width;
  flippedCanvas.height = canvas.height;
  const ctx = flippedCanvas.getContext('2d');

  if (ctx) {
    ctx.translate(horizontal ? canvas.width : 0, horizontal ? 0 : canvas.height);
    ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
    ctx.drawImage(canvas, 0, 0);
  }

  return flippedCanvas;
}

/**
 * 적정 크기 계산
 */
export function calculateOptimalSize(
  originalDimensions: Dimensions,
  maxSize: number = 2000
): Dimensions {
  const { width, height } = originalDimensions;
  const maxDimension = Math.max(width, height);

  if (maxDimension <= maxSize) {
    return originalDimensions;
  }

  const scale = maxSize / maxDimension;
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
  };
}

/**
 * 비율 계산
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * 적합한 썸네일 크기 계산
 */
export function calculateThumbnailSize(
  originalDimensions: Dimensions,
  maxThumbnailSize: { width: number; height: number } = { width: 320, height: 180 }
): Dimensions {
  return calculateOptimalSize(originalDimensions, Math.max(maxThumbnailSize.width, maxThumbnailSize.height));
}
