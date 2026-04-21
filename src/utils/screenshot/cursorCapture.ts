/**
 * Cursor Capture Utilities
 *
 * 마우스 커서 캡처 유틸리티
 */

import type { Point } from '../../types/screenshot';

declare global {
  interface Window {
    mouseX: number;
    mouseY: number;
  }
}

/**
 * 커서 위치
 */
export interface CursorPosition extends Point {
  timestamp: number;
}

/**
 * 커서 이동 경로
 */
export interface CursorPath {
  positions: CursorPosition[];
  startTime: number;
  endTime: number;
}

/**
 * 현재 커서 위치 가져오기
 */
export function getCursorPosition(): Point {
  return {
    x: window.mouseX || 0,
    y: window.mouseY || 0,
  };
}

/**
 * 커서 경로 추적 시작
 */
export function startCursorTracking(): () => void {
  const positions: CursorPosition[] = [];
  const startTime = Date.now();

  const handleMouseMove = (e: MouseEvent) => {
    positions.push({
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now() - startTime,
    });

    // 전역 변수에 현재 위치 저장
    (window as Window & { mouseX?: number; mouseY?: number }).mouseX = e.clientX;
    (window as Window & { mouseX?: number; mouseY?: number }).mouseY = e.clientY;
  };

  document.addEventListener('mousemove', handleMouseMove);

  // 초기화
  if (!(window as Window & { mouseX?: number; mouseY?: number }).mouseX) {
    (window as Window & { mouseX?: number; mouseY?: number }).mouseX = 0;
  }
  if (!(window as Window & { mouseX?: number; mouseY?: number }).mouseY) {
    (window as Window & { mouseX?: number; mouseY?: number }).mouseY = 0;
  }

  // 정리 함수 반환
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
  };
}

/**
 * 커서 이미지 그리기
 */
export function drawCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: {
    color?: string;
    size?: number;
    style?: 'default' | 'pointer' | 'crosshair';
  } = {}
): void {
  const { color = '#000000', size = 20, style = 'default' } = options;

  ctx.save();
  ctx.translate(x, y);

  switch (style) {
    case 'default':
      drawDefaultCursor(ctx, color, size);
      break;
    case 'pointer':
      drawPointerCursor(ctx, color, size);
      break;
    case 'crosshair':
      drawCrosshairCursor(ctx, color, size);
      break;
  }

  ctx.restore();
}

/**
 * 기본 커서 그리기
 */
function drawDefaultCursor(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size * 0.8);
  ctx.lineTo(size * 0.2, size * 0.6);
  ctx.lineTo(size * 0.35, size * 0.75);
  ctx.lineTo(size * 0.45, size * 0.65);
  ctx.lineTo(size * 0.35, size * 0.55);
  ctx.lineTo(size * 0.6, size * 0.55);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();
}

/**
 * 포인터 커서 그리기
 */
function drawPointerCursor(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.6, size * 0.4);
  ctx.lineTo(size * 0.4, size * 0.5);
  ctx.lineTo(size * 0.5, size * 0.7);
  ctx.lineTo(size * 0.3, size * 0.6);
  ctx.lineTo(0, size * 0.3);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();
}

/**
 * 십자 커서 그리기
 */
function drawCrosshairCursor(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const halfSize = size / 2;

  // 수평선
  ctx.beginPath();
  ctx.moveTo(-halfSize, 0);
  ctx.lineTo(halfSize, 0);
  ctx.stroke();

  // 수직선
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(0, halfSize);
  ctx.stroke();

  // 중심점
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 커서 경로 그리기
 */
export function drawCursorPath(
  ctx: CanvasRenderingContext2D,
  path: CursorPath,
  options: {
    color?: string;
    width?: number;
    showPoints?: boolean;
  } = {}
): void {
  const { color = '#ef4444', width = 2, showPoints = false } = options;

  if (path.positions.length < 2) {
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 경로 그리기
  ctx.beginPath();
  ctx.moveTo(path.positions[0].x, path.positions[0].y);

  for (let i = 1; i < path.positions.length; i++) {
    ctx.lineTo(path.positions[i].x, path.positions[i].y);
  }

  ctx.stroke();

  // 점 표시
  if (showPoints) {
    ctx.fillStyle = color;
    for (const pos of path.positions) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, width, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 커서 하이라이트 그리기
 */
export function drawCursorHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 30,
  color: string = '#ef4444'
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * 커서 클릭 효과 그리기
 */
export function drawClickEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  maxFrames: number = 20,
  radius: number = 30
): boolean {
  const progress = frame / maxFrames;
  const currentRadius = radius * progress;
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  return frame < maxFrames;
}

/**
 * 커서가 특정 영역에 있는지 확인
 */
export function isCursorInArea(
  cursor: Point,
  area: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    cursor.x >= area.x &&
    cursor.x <= area.x + area.width &&
    cursor.y >= area.y &&
    cursor.y <= area.y + area.height
  );
}

/**
 * 두 커서 위치 간 거리 계산
 */
export function calculateCursorDistance(
  pos1: Point,
  pos2: Point
): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 커서 경로 단순화 (Douglas-Peucker 알고리즘)
 */
export function simplifyCursorPath(
  positions: CursorPosition[],
  tolerance: number = 5
): CursorPosition[] {
  if (positions.length <= 2) {
    return positions;
  }

  const firstPoint = positions[0];
  const lastPoint = positions[positions.length - 1];

  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < positions.length - 1; i++) {
    const distance = perpendicularDistance(
      positions[i],
      firstPoint,
      lastPoint
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyCursorPath(
      positions.slice(0, maxIndex + 1),
      tolerance
    );
    const right = simplifyCursorPath(
      positions.slice(maxIndex),
      tolerance
    );

    return [...left.slice(0, -1), ...right];
  }

  return [firstPoint, lastPoint];
}

/**
 * 점에서 선분까지의 수직 거리 계산
 */
function perpendicularDistance(
  point: CursorPosition,
  lineStart: CursorPosition,
  lineEnd: CursorPosition
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const magnitude = Math.sqrt(dx * dx + dy * dy);

  if (magnitude === 0) {
    return calculateCursorDistance(point, lineStart);
  }

  const u =
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
    (magnitude * magnitude);

  const closestX = lineStart.x + u * dx;
  const closestY = lineStart.y + u * dy;

  return calculateCursorDistance(point, { x: closestX, y: closestY });
}
