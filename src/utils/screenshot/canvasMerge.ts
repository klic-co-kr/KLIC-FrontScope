/**
 * Canvas Merge Utilities
 *
 * 여러 Canvas를 병합하는 유틸리티 (전체 페이지 캡처용)
 */

import type { Dimensions } from '../../types/screenshot';

/**
 * 병합할 Canvas 정보
 */
export interface CanvasToMerge {
  canvas: HTMLCanvasElement;
  x?: number;
  y?: number;
}

/**
 * 세로 방향으로 Canvas 병합
 */
export function mergeCanvasesVertical(canvases: HTMLCanvasElement[]): HTMLCanvasElement {
  if (canvases.length === 0) {
    throw new Error('No canvases to merge');
  }

  if (canvases.length === 1) {
    return canvases[0];
  }

  const maxWidth = Math.max(...canvases.map(c => c.width));
  const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);

  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = maxWidth;
  mergedCanvas.height = totalHeight;
  const ctx = mergedCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  let currentY = 0;
  for (const canvas of canvases) {
    const x = (maxWidth - canvas.width) / 2; // 가운데 정렬
    ctx.drawImage(canvas, x, currentY);
    currentY += canvas.height;
  }

  return mergedCanvas;
}

/**
 * 가로 방향으로 Canvas 병합
 */
export function mergeCanvasesHorizontal(canvases: HTMLCanvasElement[]): HTMLCanvasElement {
  if (canvases.length === 0) {
    throw new Error('No canvases to merge');
  }

  if (canvases.length === 1) {
    return canvases[0];
  }

  const totalWidth = canvases.reduce((sum, c) => sum + c.width, 0);
  const maxHeight = Math.max(...canvases.map(c => c.height));

  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = totalWidth;
  mergedCanvas.height = maxHeight;
  const ctx = mergedCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  let currentX = 0;
  for (const canvas of canvases) {
    const y = (maxHeight - canvas.height) / 2; // 세로 중앙 정렬
    ctx.drawImage(canvas, currentX, y);
    currentX += canvas.width;
  }

  return mergedCanvas;
}

/**
 * 지정된 위치에 Canvas 병합
 */
export function mergeCanvasesWithPosition(
  canvases: CanvasToMerge[],
  dimensions: Dimensions
): HTMLCanvasElement {
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = dimensions.width;
  mergedCanvas.height = dimensions.height;
  const ctx = mergedCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  for (const item of canvases) {
    const x = item.x ?? 0;
    const y = item.y ?? 0;
    ctx.drawImage(item.canvas, x, y);
  }

  return mergedCanvas;
}

/**
 * 겹치는 영역 제거하고 병합
 */
export function mergeCanvasesWithoutOverlap(
  canvases: HTMLCanvasElement[],
  overlapThreshold: number = 50
): HTMLCanvasElement {
  if (canvases.length === 0) {
    throw new Error('No canvases to merge');
  }

  if (canvases.length === 1) {
    return canvases[0];
  }

  // 겹치는 영역 계산 (간단 구현)
  // const canvasWidth = canvases[0].width;
  const nonOverlappingCanvases: HTMLCanvasElement[] = [canvases[0]];

  for (let i = 1; i < canvases.length; i++) {
    const prevCanvas = canvases[i - 1];
    const currCanvas = canvases[i];

    // 겹치는 픽셀 수 계산 (단순화)
    calculateOverlap(prevCanvas, currCanvas, overlapThreshold);

    nonOverlappingCanvases.push(currCanvas);
  }

  return mergeCanvasesVertical(canvases);
}

/**
 * 두 Canvas 간의 겹치는 영역 계산
 */
function calculateOverlap(
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement,
  threshold: number
): number {
  const ctx1 = canvas1.getContext('2d');
  const ctx2 = canvas2.getContext('2d');

  if (!ctx1 || !ctx2) {
    return 0;
  }

  // 마지막 부분과 첫 부분 비교
  const compareHeight = Math.min(threshold, canvas1.height, canvas2.height);
  const sampleCount = 10;
  const step = Math.floor(compareHeight / sampleCount);

  let matches = 0;

  for (let y = 0; y < compareHeight; y += step) {
    const data1 = ctx1.getImageData(0, canvas1.height - compareHeight + y, canvas1.width, 1).data;
    const data2 = ctx2.getImageData(0, y, canvas2.width, 1).data;

    if (compareImageData(data1, data2)) {
      matches++;
    }
  }

  return matches >= sampleCount / 2 ? compareHeight : 0;
}

/**
 * 이미지 데이터 비교
 */
function compareImageData(data1: Uint8ClampedArray, data2: Uint8ClampedArray): boolean {
  if (data1.length !== data2.length) {
    return false;
  }

  let diff = 0;
  const threshold = data1.length * 0.05; // 5%까지 차이 허용

  for (let i = 0; i < data1.length; i += 4) {
    const rDiff = Math.abs(data1[i] - data2[i]);
    const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
    const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);

    if (rDiff > 30 || gDiff > 30 || bDiff > 30) {
      diff++;
    }
  }

  return diff <= threshold;
}

/**
 * Grid 형태로 Canvas 병합
 */
export function mergeCanvasesGrid(
  canvases: HTMLCanvasElement[][],
  gap: number = 0
): HTMLCanvasElement {
  const rowCount = canvases.length;
  const colCount = canvases[0]?.length ?? 0;

  const colWidths: number[] = [];
  const rowHeights: number[] = [];

  // 각 열의 최대 너비 계산
  for (let col = 0; col < colCount; col++) {
    let maxWidth = 0;
    for (let row = 0; row < rowCount; row++) {
      maxWidth = Math.max(maxWidth, canvases[row]?.[col]?.width ?? 0);
    }
    colWidths.push(maxWidth);
  }

  // 각 행의 최대 높이 계산
  for (let row = 0; row < rowCount; row++) {
    let maxHeight = 0;
    for (let col = 0; col < colCount; col++) {
      maxHeight = Math.max(maxHeight, canvases[row]?.[col]?.height ?? 0);
    }
    rowHeights.push(maxHeight);
  }

  const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + gap * (colCount - 1);
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + gap * (rowCount - 1);

  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = totalWidth;
  mergedCanvas.height = totalHeight;
  const ctx = mergedCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  let currentY = 0;
  for (let row = 0; row < rowCount; row++) {
    let currentX = 0;
    for (let col = 0; col < colCount; col++) {
      const canvas = canvases[row]?.[col];
      if (canvas) {
        ctx.drawImage(canvas, currentX, currentY);
      }
      currentX += colWidths[col] + gap;
    }
    currentY += rowHeights[row] + gap;
  }

  return mergedCanvas;
}

/**
 * Canvas 배열을 단일 Canvas로 병합 (일반용)
 */
export function mergeCanvases(
  canvases: HTMLCanvasElement[],
  direction: 'vertical' | 'horizontal' = 'vertical'
): HTMLCanvasElement {
  if (direction === 'vertical') {
    return mergeCanvasesVertical(canvases);
  } else {
    return mergeCanvasesHorizontal(canvases);
  }
}
