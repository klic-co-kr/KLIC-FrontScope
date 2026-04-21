/**
 * Guide Line Position Utilities
 *
 * 가이드라인 위치 조작 관련 유틸리티 함수들
 */

import type { GuideLine } from '../../../types/gridLayout';

/**
 * 드래그 상태 인터페이스
 */
export interface DragState {
  guideId: string;
  startPosition: number;
  currentPosition: number;
  offset: number;
  orientation: 'horizontal' | 'vertical';
}

/**
 * 가이드라인 위치 이동
 */
export function moveGuideLine(
  guide: GuideLine,
  newPosition: number,
  maxDimension?: number
): GuideLine {
  const maxPos = maxDimension ?? window.innerWidth;
  const clampedPosition = Math.max(0, Math.min(newPosition, maxPos));

  return {
    ...guide,
    position: clampedPosition,
  };
}

/**
 * 가이드라인 드래그 시작
 */
export function startGuideDrag(
  guide: GuideLine,
  mousePosition: number
): DragState {
  return {
    guideId: guide.id,
    startPosition: guide.position,
    currentPosition: mousePosition,
    offset: mousePosition - guide.position,
    orientation: guide.type,
  };
}

/**
 * 가이드라인 드래그 중 위치 계산
 */
export function updateGuideDrag(
  dragState: DragState,
  mousePosition: number,
  maxDimension?: number
): number {
  const newPosition = mousePosition - dragState.offset;
  const maxDim = maxDimension ?? window.innerWidth;

  return Math.max(0, Math.min(newPosition, maxDim));
}

/**
 * 가이드라인 스냅 (다른 라인에)
 */
export function snapGuideToPosition(
  position: number,
  snapTargets: number[],
  threshold: number = 10
): { position: number; snapped: boolean; snappedTo?: number } {
  for (const target of snapTargets) {
    if (Math.abs(position - target) < threshold) {
      return { position: target, snapped: true, snappedTo: target };
    }
  }

  return { position, snapped: false };
}

/**
 * 가이드라인 스냅 (다른 가이드라인에)
 */
export function snapGuideToGuide(
  position: number,
  guides: GuideLine[],
  orientation: 'horizontal' | 'vertical',
  threshold: number = 10
): { position: number; snapped: boolean; snappedTo?: GuideLine } {
  const sameTypeGuides = guides.filter(
    g => g.type === orientation && g.visible && !g.locked
  );

  for (const guide of sameTypeGuides) {
    if (Math.abs(position - guide.position) < threshold) {
      return { position: guide.position, snapped: true, snappedTo: guide };
    }
  }

  return { position, snapped: false };
}

/**
 * 가이드라인 정렬 (균등 간격)
 */
export function distributeGuides(
  guides: GuideLine[],
  start: number,
  end: number
): GuideLine[] {
  const sameTypeGuides = guides
    .filter(g => !g.locked)
    .sort((a, b) => a.position - b.position);

  if (sameTypeGuides.length < 2) return guides;

  const step = (end - start) / (sameTypeGuides.length - 1);
  const updatedGuides = new Map<string, GuideLine>();

  sameTypeGuides.forEach((guide, index) => {
    updatedGuides.set(guide.id, {
      ...guide,
      position: start + step * index,
    });
  });

  return guides.map(g => updatedGuides.get(g.id) || g);
}

/**
 * 가이드라인 정렬 (기준선에 맞추기)
 */
export function alignGuidesToStart(
  guides: GuideLine[],
  offset: number = 0
): GuideLine[] {
  const alignMap = new Map<string, GuideLine>();

  guides.forEach(guide => {
    if (!guide.locked) {
      alignMap.set(guide.id, {
        ...guide,
        position: offset,
      });
    }
  });

  return guides.map(g => alignMap.get(g.id) || g);
}

/**
 * 가이드라인 정렬 (중앙에)
 */
export function alignGuidesToCenter(
  guides: GuideLine[],
  center: number
): GuideLine[] {
  const alignMap = new Map<string, GuideLine>();

  guides.forEach(guide => {
    if (!guide.locked) {
      alignMap.set(guide.id, {
        ...guide,
        position: center,
      });
    }
  });

  return guides.map(g => alignMap.get(g.id) || g);
}

/**
 * 가이드라인 정렬 (끝에)
 */
export function alignGuidesToEnd(
  guides: GuideLine[],
  endPosition: number
): GuideLine[] {
  const alignMap = new Map<string, GuideLine>();

  guides.forEach(guide => {
    if (!guide.locked) {
      alignMap.set(guide.id, {
        ...guide,
        position: endPosition,
      });
    }
  });

  return guides.map(g => alignMap.get(g.id) || g);
}

/**
 * 가이드라인 위치 유효성 검사
 */
export function isValidGuidePosition(
  position: number,
  maxDimension: number
): boolean {
  return position >= 0 && position <= maxDimension;
}

/**
 * 가이드라인 위치 클램프
 */
export function clampGuidePosition(
  position: number,
  maxDimension: number
): number {
  return Math.max(0, Math.min(position, maxDimension));
}
