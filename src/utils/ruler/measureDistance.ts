import { Distance } from '../../types/ruler';

/**
 * 두 점 간 거리 계산
 */
export function measureDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): Distance {
  const horizontal = Math.abs(point2.x - point1.x);
  const vertical = Math.abs(point2.y - point1.y);
  const diagonal = calculateEuclideanDistance(point1, point2);
  const angle = calculateAngle(point1, point2);

  return {
    horizontal,
    vertical,
    diagonal,
    angle,
  };
}

/**
 * 유클리드 거리 계산
 */
export function calculateEuclideanDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 각도 계산 (라디안)
 */
export function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  return Math.atan2(dy, dx);
}

/**
 * 라디안을 도로 변환
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 맨해튼 거리 계산
 */
export function calculateManhattanDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y);
}
