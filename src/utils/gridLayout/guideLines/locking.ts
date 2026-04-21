/**
 * Guide Line Locking Utilities
 *
 * 가이드라인 잠금 관련 유틸리티 함수들
 */

import type { GuideLine } from '../../../types/gridLayout';

/**
 * 가이드라인 잠금 토글
 */
export function toggleGuideLock(guide: GuideLine): GuideLine {
  return {
    ...guide,
    locked: !guide.locked,
  };
}

/**
 * 가이드라인 잠금 설정
 */
export function setGuideLock(guide: GuideLine, locked: boolean): GuideLine {
  return {
    ...guide,
    locked,
  };
}

/**
 * 잠금 해제된 가이드라인만 필터링
 */
export function getUnlockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => !g.locked);
}

/**
 * 잠긴 가이드라인만 필터링
 */
export function getLockedGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.locked);
}

/**
 * 모든 가이드라인 잠금 해제
 */
export function unlockAllGuides(guides: GuideLine[]): GuideLine[] {
  return guides.map(g => ({ ...g, locked: false }));
}

/**
 * 모든 가이드라인 잠금
 */
export function lockAllGuides(guides: GuideLine[]): GuideLine[] {
  return guides.map(g => ({ ...g, locked: true }));
}

/**
 * 특정 ID 가이드라인의 잠금 상태 토글
 */
export function toggleGuideLockById(
  guides: GuideLine[],
  guideId: string
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? { ...g, locked: !g.locked } : g
  );
}

/**
 * 특정 ID 가이드라인의 잠금 상태 설정
 */
export function setGuideLockById(
  guides: GuideLine[],
  guideId: string,
  locked: boolean
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? { ...g, locked } : g
  );
}

/**
 * 가이드라인 잠금 상태에 따른 개수 통계
 */
export function getLockStats(guides: GuideLine[]): {
  total: number;
  locked: number;
  unlocked: number;
  lockedHorizontal: number;
  lockedVertical: number;
} {
  const locked = getLockedGuides(guides);

  return {
    total: guides.length,
    locked: locked.length,
    unlocked: guides.length - locked.length,
    lockedHorizontal: locked.filter(g => g.type === 'horizontal').length,
    lockedVertical: locked.filter(g => g.type === 'vertical').length,
  };
}

/**
 * 표시되고 잠금 해제된 가이드라인만 필터링 (편집 가능한 가이드라인)
 */
export function getEditableGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.visible && !g.locked);
}
