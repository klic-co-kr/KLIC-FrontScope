/**
 * Shape Annotation Utilities
 *
 * 도형 주석 유틸리티
 */

import type { Point, ShapeAnnotation } from '../../../types/screenshot';
import { drawRectangle, drawCircle, drawEllipse } from './drawing';

/**
 * 도형 그리기
 */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  annotation: ShapeAnnotation
): void {
  const { shape, points, style } = annotation.data;

  switch (shape) {
    case 'rectangle':
      drawRectShape(ctx, points, style);
      break;
    case 'circle':
      drawCircleShape(ctx, points, style);
      break;
    case 'ellipse':
      drawEllipseShape(ctx, points, style);
      break;
    case 'triangle':
      drawTriangleShape(ctx, points, style);
      break;
    case 'star':
      drawStarShape(ctx, points, style);
      break;
    case 'arrow':
      drawArrowShape(ctx, points, style);
      break;
    case 'line':
      drawLineShape(ctx, points, style);
      break;
  }
}

/**
 * 직사각형 도형
 */
function drawRectShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[1];
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  drawRectangle(ctx, x, y, width, height, {
    borderColor: style?.borderColor,
    borderWidth: style?.borderWidth,
    fillColor: style?.fillColor,
    dashed: style?.dashed,
  });
}

/**
 * 원형 도형
 */
function drawCircleShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[1];
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  const radius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  ) / 2;

  drawCircle(ctx, { x: centerX, y: centerY }, radius, {
    borderColor: style?.borderColor,
    borderWidth: style?.borderWidth,
    fillColor: style?.fillColor,
    dashed: style?.dashed,
  });
}

/**
 * 타원 도형
 */
function drawEllipseShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[1];
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  const radiusX = Math.abs(end.x - start.x) / 2;
  const radiusY = Math.abs(end.y - start.y) / 2;

  drawEllipse(ctx, { x: centerX, y: centerY }, radiusX, radiusY, {
    borderColor: style?.borderColor,
    borderWidth: style?.borderWidth,
    fillColor: style?.fillColor,
    dashed: style?.dashed,
  });
}

/**
 * 삼각형 도형
 */
function drawTriangleShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[1];

  // 정삼각형 계산
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  const size = Math.max(
    Math.abs(end.x - start.x),
    Math.abs(end.y - start.y)
  );

  const height = (size * Math.sqrt(3)) / 2;

  const trianglePoints = [
    { x: centerX, y: centerY - height / 2 },
    { x: centerX - size / 2, y: centerY + height / 2 },
    { x: centerX + size / 2, y: centerY + height / 2 },
  ];

  drawPolygon(ctx, trianglePoints, {
    borderColor: style?.borderColor,
    borderWidth: style?.borderWidth,
    fillColor: style?.fillColor,
    dashed: style?.dashed,
  });
}

/**
 * 다각형 그리기
 */
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  options: {
    borderColor?: string;
    borderWidth?: number;
    fillColor?: string;
    dashed?: boolean;
    close?: boolean;
  } = {}
): void {
  const {
    borderColor = '#3b82f6',
    borderWidth = 3,
    fillColor,
    dashed = false,
    close = true,
  } = options;

  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  if (close) {
    ctx.closePath();
  }

  if (fillColor && close) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    if (dashed) {
      ctx.setLineDash([10, 5]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * 별 도형
 */
function drawStarShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[1];
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  const outerRadius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  ) / 2;
  const innerRadius = outerRadius * 0.4;

  const spikes = 5;
  const starPoints: Point[] = [];

  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    starPoints.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  drawPolygon(ctx, starPoints, {
    borderColor: style?.borderColor,
    borderWidth: style?.borderWidth,
    fillColor: style?.fillColor,
  });
}

/**
 * 화살표 도형
 */
function drawArrowShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  const start = points[0];
  const end = points[points.length - 1];

  // 화살표 본체
  ctx.strokeStyle = style?.borderColor || '#ef4444';
  ctx.lineWidth = style?.borderWidth || 3;
  ctx.lineCap = 'round';
  ctx.setLineDash(style?.dashed ? [10, 5] : []);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);

  if (points.length > 2) {
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  } else {
    ctx.lineTo(end.x, end.y);
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // 화살표 머리
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headSize = 15;

  ctx.fillStyle = style?.borderColor || '#ef4444';
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headSize * Math.cos(angle - Math.PI / 6),
    end.y - headSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    end.x - headSize * Math.cos(angle + Math.PI / 6),
    end.y - headSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * 선 도형
 */
function drawLineShape(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style?: ShapeAnnotation['data']['style']
): void {
  if (points.length < 2) return;

  ctx.strokeStyle = style?.borderColor || '#ef4444';
  ctx.lineWidth = style?.borderWidth || 3;
  ctx.lineCap = 'round';
  ctx.setLineDash(style?.dashed ? [10, 5] : []);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 하이라이트 도형 (반투명 사각형)
 */
export function drawHighlight(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string = '#fbbf24'
): void {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = 1;
}

/**
 * 흐림 효과 (모자이크)
 */
export function drawBlur(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  area: { x: number; y: number; width: number; height: number },
  blurLevel: number = 10
): void {
  const { x, y, width, height } = area;

  // 작은 크기로 축소했다가 다시 확대하여 모자이크 효과
  const scaledWidth = Math.max(1, Math.floor(width / blurLevel));
  const scaledHeight = Math.max(1, Math.floor(height / blurLevel));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  const tempCtx = tempCanvas.getContext('2d');

  if (tempCtx) {
    // 축소
    tempCtx.drawImage(sourceCanvas, x, y, width, height, 0, 0, scaledWidth, scaledHeight);

    // 확대 (이웃 보간으로 픽셀화)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight, x, y, width, height);
    ctx.imageSmoothingEnabled = true;
  }
}

/**
 * 픽셀화 효과
 */
export function drawPixelate(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  area: { x: number; y: number; width: number; height: number },
  pixelSize: number = 10
): void {
  drawBlur(ctx, sourceCanvas, area, pixelSize);
}

/**
 * 도형 선택 핸들 그리기
 */
export function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  boundingBox: { x: number; y: number; width: number; height: number },
  handleSize: number = 8
): void {
  const { x, y, width, height } = boundingBox;
  const handles = [
    { x: x - handleSize / 2, y: y - handleSize / 2 }, // 좌상단
    { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2 }, // 상단
    { x: x + width - handleSize / 2, y: y - handleSize / 2 }, // 우상단
    { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // 우측
    { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }, // 우하단
    { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2 }, // 하단
    { x: x - handleSize / 2, y: y + height - handleSize / 2 }, // 좌하단
    { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // 좌측
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;

  for (const handle of handles) {
    ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
  }
}

/**
 * 회전 핸들 그리기
 */
export function drawRotationHandle(
  ctx: CanvasRenderingContext2D,
  boundingBox: { x: number; y: number; width: number; height: number }
): void {
  const centerX = boundingBox.x + boundingBox.width / 2;
  const handleY = boundingBox.y - 30;

  // 연결선
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(centerX, boundingBox.y);
  ctx.lineTo(centerX, handleY + 10);
  ctx.stroke();
  ctx.setLineDash([]);

  // 회전 핸들 (원형)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, handleY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
