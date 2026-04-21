/**
 * Guide Line Removal Utilities
 *
 * 가이드라인 삭제 관련 유틸리티 함수들
 */

import type { GuideLine } from '../../../types/gridLayout';

/**
 * 특정 가이드라인 삭제
 */
export function removeGuideLine(guides: GuideLine[], guideId: string): GuideLine[] {
  return guides.filter(g => g.id !== guideId);
}

/**
 * 여러 가이드라인 삭제
 */
export function removeGuideLines(guides: GuideLine[], guideIds: string[]): GuideLine[] {
  const idSet = new Set(guideIds);
  return guides.filter(g => !idSet.has(g.id));
}

/**
 * 모든 가이드라인 삭제
 */
export function clearAllGuides(): GuideLine[] {
  return [];
}

/**
 * 특정 타입의 가이드라인만 삭제
 */
export function clearGuidesByType(guides: GuideLine[], type: 'horizontal' | 'vertical'): GuideLine[] {
  return guides.filter(g => g.type !== type);
}

/**
 * 잠금 해제된 가이드라인만 삭제
 */
export function clearUnlockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.locked);
}

/**
 * 숨겨진 가이드라인만 삭제
 */
export function clearHiddenGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.visible);
}

/**
 * 잠긴 가이드라인만 삭제
 */
export function clearLockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => !g.locked);
}

/**
 * 특정 위치 근처의 가이드라인 삭제
 */
export function clearGuidesNearPosition(
  guides: GuideLine[],
  position: number,
  threshold: number = 5,
  orientation?: 'horizontal' | 'vertical'
): GuideLine[] {
  return guides.filter(g => {
    if (orientation && g.type !== orientation) return true;
    return Math.abs(g.position - position) >= threshold;
  });
}

/**
 * 가이드라인 배열에서 중복 위치 제거
 */
export function removeDuplicatePositions(guides: GuideLine[], tolerance: number = 1): GuideLine[] {
  const seen = new Set<string>();
  const result: GuideLine[] = [];

  for (const guide of guides) {
    const key = `${guide.type}-${Math.round(guide.position / tolerance)}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(guide);
    }
  }

  return result;
}

/**
 * 지정된 범위 밖의 가이드라인 삭제
 */
export function clearGuidesOutsideRange(
  guides: GuideLine[],
  range: { min: number; max: number },
  orientation: 'horizontal' | 'vertical'
): GuideLine[] {
  return guides.filter(g => {
    if (g.type !== orientation) return true;
    return g.position >= range.min && g.position <= range.max;
  });
}

/**
 * 지정된 범위 내의 가이드라인 삭제
 */
export function clearGuidesInRange(
  guides: GuideLine[],
  range: { min: number; max: number },
  orientation: 'horizontal' | 'vertical'
): GuideLine[] {
  return guides.filter(g => {
    if (g.type !== orientation) return true;
    return g.position < range.min || g.position > range.max;
  });
}
