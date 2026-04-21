/**
 * Guide Line Styling Utilities
 *
 * 가이드라인 스타일 변경 관련 유틸리티 함수들
 */

import type { GuideLine, GuideLineStyle } from '../../../types/gridLayout';

/**
 * 가이드라인 색상 변경
 */
export function setGuideColor(guide: GuideLine, color: string): GuideLine {
  return {
    ...guide,
    color,
  };
}

/**
 * 가이드라인 두께 변경
 */
export function setGuideWidth(guide: GuideLine, width: number): GuideLine {
  const clampedWidth = Math.max(1, Math.min(width, 5));
  return {
    ...guide,
    width: clampedWidth,
  };
}

/**
 * 가이드라인 스타일 변경
 */
export function setGuideStyle(guide: GuideLine, style: GuideLineStyle): GuideLine {
  return {
    ...guide,
    style,
  };
}

/**
 * 가이드라인 스타일 일괄 변경
 */
export function setAllGuidesStyle(
  guides: GuideLine[],
  style: GuideLineStyle
): GuideLine[] {
  return guides.map(g => ({ ...g, style }));
}

/**
 * 가이드라인 색상 일괄 변경
 */
export function setAllGuidesColor(
  guides: GuideLine[],
  color: string
): GuideLine[] {
  return guides.map(g => ({ ...g, color }));
}

/**
 * 가이드라인 두께 일괄 변경
 */
export function setAllGuidesWidth(
  guides: GuideLine[],
  width: number
): GuideLine[] {
  const clampedWidth = Math.max(1, Math.min(width, 5));
  return guides.map(g => ({ ...g, width: clampedWidth }));
}

/**
 * 특정 ID 가이드라인의 색상 변경
 */
export function setGuideColorById(
  guides: GuideLine[],
  guideId: string,
  color: string
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? { ...g, color } : g
  );
}

/**
 * 특정 ID 가이드라인의 두께 변경
 */
export function setGuideWidthById(
  guides: GuideLine[],
  guideId: string,
  width: number
): GuideLine[] {
  const clampedWidth = Math.max(1, Math.min(width, 5));
  return guides.map(g =>
    g.id === guideId ? { ...g, width: clampedWidth } : g
  );
}

/**
 * 특정 ID 가이드라인의 스타일 변경
 */
export function setGuideStyleById(
  guides: GuideLine[],
  guideId: string,
  style: GuideLineStyle
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? { ...g, style } : g
  );
}

/**
 * 특정 타입의 가이드라인 스타일 일괄 변경
 */
export function setGuidesStyleByType(
  guides: GuideLine[],
  type: 'horizontal' | 'vertical',
  style: GuideLineStyle
): GuideLine[] {
  return guides.map(g =>
    g.type === type ? { ...g, style } : g
  );
}

/**
 * 특정 타입의 가이드라인 색상 일괄 변경
 */
export function setGuidesColorByType(
  guides: GuideLine[],
  type: 'horizontal' | 'vertical',
  color: string
): GuideLine[] {
  return guides.map(g =>
    g.type === type ? { ...g, color } : g
  );
}

/**
 * 가이드라인 스타일 속성 일괄 변경
 */
export function setGuideStyleAttributes(
  guide: GuideLine,
  attributes: Partial<Pick<GuideLine, 'color' | 'width' | 'style'>>
): GuideLine {
  const updated = { ...guide };

  if (attributes.color !== undefined) {
    updated.color = attributes.color;
  }
  if (attributes.width !== undefined) {
    updated.width = Math.max(1, Math.min(attributes.width, 5));
  }
  if (attributes.style !== undefined) {
    updated.style = attributes.style;
  }

  return updated;
}

/**
 * 특정 ID 가이드라인의 스타일 속성 일괄 변경
 */
export function setGuideStyleAttributesById(
  guides: GuideLine[],
  guideId: string,
  attributes: Partial<Pick<GuideLine, 'color' | 'width' | 'style'>>
): GuideLine[] {
  return guides.map(g =>
    g.id === guideId ? setGuideStyleAttributes(g, attributes) : g
  );
}

/**
 * 모든 가이드라인의 스타일 속성 일괄 변경
 */
export function setAllGuidesStyleAttributes(
  guides: GuideLine[],
  attributes: Partial<Pick<GuideLine, 'color' | 'width' | 'style'>>
): GuideLine[] {
  return guides.map(g => setGuideStyleAttributes(g, attributes));
}
