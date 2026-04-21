/**
 * Drawing Utilities
 *
 * Canvas 그리기 기본 유틸리티
 */

import type { Point, Dimensions } from '../../../types/screenshot';

/**
 * 선 그리기
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  options: {
    color?: string;
    width?: number;
    dashed?: boolean;
    cap?: 'butt' | 'round' | 'square';
  } = {}
): void {
  const { color = '#ef4444', width = 3, dashed = false, cap = 'round' } = options;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;

  if (dashed) {
    ctx.setLineDash([10, 5]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * 화살표 그리기
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  options: {
    color?: string;
    width?: number;
    headSize?: number;
  } = {}
): void {
  const { color = '#ef4444', width = 3, headSize = 15 } = options;

  // 선 그리기
  drawLine(ctx, start, end, { color, width });

  // 화살표 머리 계산
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  ctx.fillStyle = color;
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
 * 이중 화살표 그리기
 */
export function drawDoubleArrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  options: {
    color?: string;
    width?: number;
    headSize?: number;
  } = {}
): void {
  const { color = '#ef4444', width = 3, headSize = 15 } = options;

  // 중앙 선 그리기
  drawLine(ctx, start, end, { color, width });

  // 시작점 화살표
  const startAngle = Math.atan2(start.y - end.y, start.x - end.x);
  drawArrowHead(ctx, start, startAngle, color, headSize);

  // 끝점 화살표
  const endAngle = Math.atan2(end.y - start.y, end.x - start.x);
  drawArrowHead(ctx, end, endAngle, color, headSize);
}

/**
 * 화살표 머리 그리기
 */
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  point: Point,
  angle: number,
  color: string,
  size: number
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(
    point.x - size * Math.cos(angle - Math.PI / 6),
    point.y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    point.x - size * Math.cos(angle + Math.PI / 6),
    point.y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * 직사각형 그리기
 */
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    borderColor?: string;
    borderWidth?: number;
    fillColor?: string;
    dashed?: boolean;
  } = {}
): void {
  const {
    borderColor = '#3b82f6',
    borderWidth = 3,
    fillColor,
    dashed = false,
  } = options;

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  }

  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    if (dashed) {
      ctx.setLineDash([10, 5]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }
}

/**
 * 원형 그리기
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  options: {
    borderColor?: string;
    borderWidth?: number;
    fillColor?: string;
    dashed?: boolean;
  } = {}
): void {
  const {
    borderColor = '#3b82f6',
    borderWidth = 3,
    fillColor,
    dashed = false,
  } = options;

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

  if (fillColor) {
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
 * 타원 그리기
 */
export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radiusX: number,
  radiusY: number,
  options: {
    borderColor?: string;
    borderWidth?: number;
    fillColor?: string;
    dashed?: boolean;
  } = {}
): void {
  const {
    borderColor = '#3b82f6',
    borderWidth = 3,
    fillColor,
    dashed = false,
  } = options;

  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);

  if (fillColor) {
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

  if (points.length < 2) {
    return;
  }

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
 * 자유 곡선 그리기 (부드러운 곡선)
 */
export function drawSmoothCurve(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  options: {
    color?: string;
    width?: number;
    tension?: number;
  } = {}
): void {
  const { color = '#10b981', width = 2, tension = 0.5 } = options;

  if (points.length < 2) {
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;

      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  ctx.stroke();
}

/**
 * 자유곡선 (직선 연결)
 */
export function drawFreehand(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  options: {
    color?: string;
    width?: number;
  } = {}
): void {
  const { color = '#10b981', width = 2 } = options;

  if (points.length < 2) {
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

/**
 * 지우개 영역 그리기
 */
export function eraseArea(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 점 그리기
 */
export function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: Point,
  options: {
    color?: string;
    radius?: number;
  } = {}
): void {
  const { color = '#3b82f6', radius = 5 } = options;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 격자 그리기
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  dimensions: Dimensions,
  options: {
    color?: string;
    lineWidth?: number;
    spacing?: number;
  } = {}
): void {
  const { color = '#e5e7eb', lineWidth = 1, spacing = 20 } = options;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // 수직선
  for (let x = 0; x <= dimensions.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, dimensions.height);
    ctx.stroke();
  }

  // 수평선
  for (let y = 0; y <= dimensions.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(dimensions.width, y);
    ctx.stroke();
  }
}

/**
 * 코드너트 그리기
 */
export function drawRoundedRectangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  options: {
    borderColor?: string;
    borderWidth?: number;
    fillColor?: string;
  } = {}
): void {
  const {
    borderColor = '#3b82f6',
    borderWidth = 3,
    fillColor,
  } = options;

  ctx.beginPath();

  // 모서리가 캔버스 크기를 초과하지 않도록 제한
  const maxRadius = Math.min(width, height) / 2;
  const r = Math.min(radius, maxRadius);

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }
}

/**
 * 그림자 효과 추가
 */
export function addShadow(
  ctx: CanvasRenderingContext2D,
  options: {
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  } = {}
): void {
  const {
    color = 'rgba(0, 0, 0, 0.3)',
    blur = 10,
    offsetX = 5,
    offsetY = 5,
  } = options;

  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX;
  ctx.shadowOffsetY = offsetY;
}

/**
 * 그림자 효과 제거
 */
export function removeShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
