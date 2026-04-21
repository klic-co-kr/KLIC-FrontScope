/**
 * Guide Line Creation Utilities
 *
 * 가이드라인 생성 관련 유틸리티 함수들
 */

import type { GuideLine, GuideLineOrientation } from '../../../types/gridLayout';
import { generateGuideLineId } from '../../common/uuid';

/**
 * 수평 가이드라인 생성
 */
export function createHorizontalGuide(
  position: number,
  options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }
): GuideLine {
  return {
    id: generateGuideLineId(),
    type: 'horizontal',
    position: Math.max(0, position),
    color: options?.color || '#FF3366',
    width: options?.width || 2,
    style: options?.style || 'dashed',
    locked: false,
    visible: true,
  };
}

/**
 * 수직 가이드라인 생성
 */
export function createVerticalGuide(
  position: number,
  options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }
): GuideLine {
  return {
    id: generateGuideLineId(),
    type: 'vertical',
    position: Math.max(0, position),
    color: options?.color || '#FF3366',
    width: options?.width || 2,
    style: options?.style || 'dashed',
    locked: false,
    visible: true,
  };
}

/**
 * 다중 가이드라인 생성 (균등 분배)
 */
export function createDistributedGuides(
  type: GuideLineOrientation,
  start: number,
  end: number,
  count: number,
  options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }
): GuideLine[] {
  const guides: GuideLine[] = [];

  if (count <= 0) return guides;

  const step = count > 1 ? (end - start) / (count - 1) : 0;

  for (let i = 0; i < count; i++) {
    const position = count > 1 ? start + step * i : (start + end) / 2;

    if (type === 'vertical') {
      guides.push(createVerticalGuide(position, options));
    } else {
      guides.push(createHorizontalGuide(position, options));
    }
  }

  return guides;
}

/**
 * 중앙 가이드라인 생성
 */
export function createCenterGuides(width: number, height: number): GuideLine[] {
  return [
    createVerticalGuide(width / 2, { style: 'solid', color: '#4ECDC4' }),
    createHorizontalGuide(height / 2, { style: 'solid', color: '#4ECDC4' }),
  ];
}

/**
 * 삼분할 가이드라인 생성
 */
export function createThirdsGuides(width: number, height: number): GuideLine[] {
  const guides: GuideLine[] = [];

  // 수직 3분할
  for (let i = 1; i < 3; i++) {
    guides.push(createVerticalGuide((width / 3) * i));
  }

  // 수평 3분할
  for (let i = 1; i < 3; i++) {
    guides.push(createHorizontalGuide((height / 3) * i));
  }

  return guides;
}

/**
 * 규칙적인 그리드 가이드라인 생성
 */
export function createGridGuides(
  width: number,
  height: number,
  columns: number,
  rows: number,
  options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }
): GuideLine[] {
  const guides: GuideLine[] = [];

  // 수직 가이드라인 (컬럼)
  if (columns > 1) {
    for (let i = 1; i < columns; i++) {
      const position = (width / columns) * i;
      guides.push(createVerticalGuide(position, options));
    }
  }

  // 수평 가이드라인 (행)
  if (rows > 1) {
    for (let i = 1; i < rows; i++) {
      const position = (height / rows) * i;
      guides.push(createHorizontalGuide(position, options));
    }
  }

  return guides;
}

/**
 * 가이드라인 복제
 */
export function cloneGuideLine(guide: GuideLine): GuideLine {
  return {
    ...guide,
    id: generateGuideLineId(),
  };
}
