/**
 * Snap System Utilities
 *
 * 가이드라인 스냅 시스템 관련 유틸리티 함수들
 */

import type { GuideLine } from '../../../types/gridLayout';
import { calculateColumnPositions, calculateRowPositions } from './gridCalculator';

/**
 * 스냅 결과
 */
export interface SnapResult {
  position: number;
  snapped: boolean;
  target?: number;
  distance?: number;
  type?: 'grid' | 'guide' | 'center';
}

/**
 * 스냅 타겟 계산 (그리드 기반)
 */
export function calculateSnapTargets(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number,
  options: {
    includeColumnCenters?: boolean;
    includeGaps?: boolean;
  } = {}
): number[] {
  const positions = calculateColumnPositions(containerWidth, columns, gap, margin);
  const targets: number[] = [];

  const {
    includeColumnCenters = true,
    includeGaps = true,
  } = options;

  // 각 컬럼의 시작과 끝
  positions.forEach((pos) => {
    targets.push(pos.startX);
    targets.push(pos.endX);

    if (includeColumnCenters) {
      targets.push(pos.centerX);
    }
  });

  // 갭 중앙도 추가
  if (includeGaps) {
    for (let i = 0; i < positions.length - 1; i++) {
      const gapCenter = (positions[i].endX + positions[i + 1].startX) / 2;
      targets.push(gapCenter);
    }
  }

  // 컨테이너 경계
  targets.push(0);
  targets.push(containerWidth);

  return targets;
}

/**
 * Y축 스냅 타겟 계산 (행 기반)
 */
export function calculateYSnapTargets(
  containerHeight: number,
  rows: number,
  gap: number,
  margin: number
): number[] {
  const positions = calculateRowPositions(containerHeight, rows, gap, margin);
  const targets: number[] = [];

  positions.forEach((pos) => {
    targets.push(pos.startY);
    targets.push(pos.endY);
    targets.push(pos.centerY);
  });

  targets.push(0);
  targets.push(containerHeight);

  return targets;
}

/**
 * 그리드에 스냅
 */
export function snapToGrid(
  position: number,
  snapTargets: number[],
  threshold: number = 10
): SnapResult {
  let closestTarget: number | undefined;
  let closestDistance = Infinity;

  for (const target of snapTargets) {
    const distance = Math.abs(position - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestTarget = target;
    }
  }

  if (closestDistance <= threshold && closestTarget !== undefined) {
    return {
      position: closestTarget,
      snapped: true,
      target: closestTarget,
      distance: closestDistance,
      type: 'grid',
    };
  }

  return {
    position,
    snapped: false,
  };
}

/**
 * 가이드라인에 스냅
 */
export function snapToGuide(
  position: number,
  guides: GuideLine[],
  orientation: 'horizontal' | 'vertical',
  threshold: number = 10
): SnapResult {
  const sameTypeGuides = guides.filter(
    (g) => g.type === orientation && g.visible && !g.locked
  );

  let closestGuide: GuideLine | undefined;
  let closestDistance = Infinity;

  for (const guide of sameTypeGuides) {
    const distance = Math.abs(position - guide.position);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestGuide = guide;
    }
  }

  if (closestDistance <= threshold && closestGuide !== undefined) {
    return {
      position: closestGuide.position,
      snapped: true,
      target: closestGuide.position,
      distance: closestDistance,
      type: 'guide',
    };
  }

  return {
    position,
    snapped: false,
  };
}

/**
 * 중앙에 스냅
 */
export function snapToCenter(
  position: number,
  containerSize: number,
  threshold: number = 15
): SnapResult {
  const center = containerSize / 2;
  const distance = Math.abs(position - center);

  if (distance <= threshold) {
    return {
      position: center,
      snapped: true,
      target: center,
      distance,
      type: 'center',
    };
  }

  return {
    position,
    snapped: false,
  };
}

/**
 * 모든 스냅 소스에 스냅
 */
export function snapToAll(
  position: number,
  options: {
    gridTargets?: number[];
    guides?: GuideLine[];
    orientation?: 'horizontal' | 'vertical';
    containerSize?: number;
    threshold?: number;
    enableGridSnap?: boolean;
    enableGuideSnap?: boolean;
    enableCenterSnap?: boolean;
  } = {}
): SnapResult {
  const {
    gridTargets = [],
    guides = [],
    orientation = 'vertical',
    containerSize = 0,
    threshold = 10,
    enableGridSnap = true,
    enableGuideSnap = true,
    enableCenterSnap = true,
  } = options;

  let bestResult: SnapResult = { position, snapped: false };
  let minDistance = Infinity;

  // 그리드 스냅
  if (enableGridSnap && gridTargets.length > 0) {
    const result = snapToGrid(position, gridTargets, threshold);
    if (result.snapped && result.distance && result.distance < minDistance) {
      minDistance = result.distance;
      bestResult = result;
    }
  }

  // 가이드 스냅
  if (enableGuideSnap && guides.length > 0) {
    const result = snapToGuide(position, guides, orientation, threshold);
    if (result.snapped && result.distance && result.distance < minDistance) {
      minDistance = result.distance;
      bestResult = result;
    }
  }

  // 중앙 스냅
  if (enableCenterSnap && containerSize > 0) {
    const result = snapToCenter(position, containerSize, threshold);
    if (result.snapped && result.distance && result.distance < minDistance) {
      bestResult = result;
    }
  }

  return bestResult.snapped ? bestResult : { position, snapped: false };
}

/**
 * 가이드라인 그리드에 스냅
 */
export function snapGuideLinesToGrid(
  guides: GuideLine[],
  containerWidth: number,
  containerHeight: number,
  columns: number,
  rows: number,
  gap: number,
  margin: number,
  threshold: number = 10
): GuideLine[] {
  const xTargets = calculateSnapTargets(containerWidth, columns, gap, margin);
  const yTargets = calculateYSnapTargets(containerHeight, rows, gap, margin);

  return guides.map((guide) => {
    if (guide.type === 'vertical') {
      const result = snapToGrid(guide.position, xTargets, threshold);
      return result.snapped ? { ...guide, position: result.position } : guide;
    } else {
      const result = snapToGrid(guide.position, yTargets, threshold);
      return result.snapped ? { ...guide, position: result.position } : guide;
    }
  });
}

/**
 * 모든 가이드라인 스냅 (사용자 정의 타겟)
 */
export function snapAllGuidesToTargets(
  guides: GuideLine[],
  snapTargets: number[],
  threshold: number = 10
): GuideLine[] {
  return guides.map((guide) => {
    const result = snapToGrid(guide.position, snapTargets, threshold);
    return result.snapped ? { ...guide, position: result.position } : guide;
  });
}

/**
 * 스냅 가이드라인 생성 (시각적 피드백용)
 */
export function createSnapGuideLine(
  position: number,
  orientation: 'horizontal' | 'vertical'
): GuideLine {
  return {
    id: `snap-guide-${Date.now()}`,
    type: orientation,
    position,
    color: '#00FF00',
    width: 1,
    style: 'dashed',
    locked: true,
    visible: true,
  };
}

/**
 * 가장 가까운 스냅 타겟 찾기
 */
export function findClosestSnapTarget(
  position: number,
  snapTargets: number[],
  maxDistance: number = 50
): number | null {
  let closest: number | null = null;
  let minDistance = maxDistance;

  for (const target of snapTargets) {
    const distance = Math.abs(position - target);
    if (distance < minDistance) {
      minDistance = distance;
      closest = target;
    }
  }

  return closest;
}

/**
 * 스냅 영역 계산 (스냅이 활성화되는 범위)
 */
export function calculateSnapZone(
  targetPosition: number,
  threshold: number
): { start: number; end: number } {
  return {
    start: targetPosition - threshold,
    end: targetPosition + threshold,
  };
}

/**
 * 위치가 스냅 영역 내에 있는지 확인
 */
export function isInSnapZone(
  position: number,
  targetPosition: number,
  threshold: number
): boolean {
  const zone = calculateSnapZone(targetPosition, threshold);
  return position >= zone.start && position <= zone.end;
}
