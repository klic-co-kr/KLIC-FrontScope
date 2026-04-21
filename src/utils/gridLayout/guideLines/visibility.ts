/**
 * Guide Line Visibility Utilities
 *
 * 가이드라인 표시/숨김 관련 유틸리티 함수들
 */

import type { GuideLine } from '../../../types/gridLayout';

/**
 * 가이드라인 표시 여부 토글
 */
export function toggleGuideVisibility(guide: GuideLine): GuideLine {
  return {
    ...guide,
    visible: !guide.visible,
  };
}

/**
 * 가이드라인 표시 설정
 */
export function setGuideVisibility(guide: GuideLine, visible: boolean): GuideLine {
  return {
    ...guide,
    visible,
  };
}

/**
 * 모든 가이드라인 표시
 */
export function showAllGuides(guides: GuideLine[]): GuideLine[] {
  return guides.map(g => ({ ...g, visible: true }));
}

/**
 * 모든 가이드라인 숨김
 */
export function hideAllGuides(guides: GuideLine[]): GuideLine[] {
  return guides.map(g => ({ ...g, visible: false }));
}

/**
 * 표시 중인 가이드라인만 필터링
 */
export function getVisibleGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => g.visible);
}

/**
 * 숨겨진 가이드라인만 필터링
 */
export function getHiddenGuides(guides: GuideLine[]): GuideLine[] {
  return guides.filter(g => !g.visible);
}

/**
 * 특정 타입의 가이드라인 필터링 (표시된 것만)
 */
export function getGuidesByType(
  guides: GuideLine[],
  type: 'horizontal' | 'vertical'
): GuideLine[] {
  return guides.filter(g => g.type === type && g.visible);
}

/**
 * 특정 타입의 모든 가이드라인 필터링 (숨김 상태 무시)
 */
export function getAllGuidesByType(
  guides: GuideLine[],
  type: 'horizontal' | 'vertical'
): GuideLine[] {
  return guides.filter(g => g.type === type);
}

/**
 * 가이드라인 표시 상태에 따른 개수 통계
 */
export function getVisibilityStats(guides: GuideLine[]): {
  total: number;
  visible: number;
  hidden: number;
  horizontalVisible: number;
  verticalVisible: number;
} {
  const visible = getVisibleGuides(guides);

  return {
    total: guides.length,
    visible: visible.length,
    hidden: guides.length - visible.length,
    horizontalVisible: visible.filter(g => g.type === 'horizontal').length,
    verticalVisible: visible.filter(g => g.type === 'vertical').length,
  };
}

/**
 * 특정 ID 가이드라인의 표시 상태 토글
 */
export function toggleGuideVisibilityById(
  guides: GuideLine[],
  guideId: string
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? { ...g, visible: !g.visible } : g
  );
}

/**
 * 특정 ID 가이드라인의 표시 상태 설정
 */
export function setGuideVisibilityById(
  guides: GuideLine[],
  guideId: string,
  visible: boolean
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? { ...g, visible } : g
  );
}
