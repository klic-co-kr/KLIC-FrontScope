/**
 * Breakpoint Detector Utilities
 *
 * 브레이크포인트 감지 관련 유틸리티 함수들
 */

import { TAILWIND_BREAKPOINTS } from '../../../constants/viewportPresets';

/**
 * 브레이크포인트 타입
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 현재 브레이크포인트 감지
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width < TAILWIND_BREAKPOINTS.sm) return 'sm';
  if (width < TAILWIND_BREAKPOINTS.md) return 'sm';
  if (width < TAILWIND_BREAKPOINTS.lg) return 'md';
  if (width < TAILWIND_BREAKPOINTS.xl) return 'lg';
  if (width < TAILWIND_BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/**
 * 브레이크포인트 정보
 */
export interface BreakpointInfo {
  current: Breakpoint;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  min: number;
  max: number;
  nextBreakpoint?: Breakpoint;
  distanceToNext?: number;
}

/**
 * 브레이크포인트 정보 가져오기
 */
export function getBreakpointInfo(width: number): BreakpointInfo {
  const current = getCurrentBreakpoint(width);

  const info: BreakpointInfo = {
    current,
    width,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    min: 0,
    max: Infinity,
  };

  switch (current) {
    case 'sm':
      info.isMobile = true;
      info.min = 0;
      info.max = TAILWIND_BREAKPOINTS.sm - 1;
      info.nextBreakpoint = 'md';
      info.distanceToNext = TAILWIND_BREAKPOINTS.sm - width;
      break;
    case 'md':
      info.isMobile = true;
      info.min = TAILWIND_BREAKPOINTS.sm;
      info.max = TAILWIND_BREAKPOINTS.md - 1;
      info.nextBreakpoint = 'lg';
      info.distanceToNext = TAILWIND_BREAKPOINTS.md - width;
      break;
    case 'lg':
      info.isTablet = true;
      info.min = TAILWIND_BREAKPOINTS.md;
      info.max = TAILWIND_BREAKPOINTS.lg - 1;
      info.nextBreakpoint = 'xl';
      info.distanceToNext = TAILWIND_BREAKPOINTS.lg - width;
      break;
    case 'xl':
      info.isDesktop = true;
      info.min = TAILWIND_BREAKPOINTS.lg;
      info.max = TAILWIND_BREAKPOINTS.xl - 1;
      info.nextBreakpoint = '2xl';
      info.distanceToNext = TAILWIND_BREAKPOINTS.xl - width;
      break;
    case '2xl':
      info.isDesktop = true;
      info.min = TAILWIND_BREAKPOINTS.xl;
      info.max = Infinity;
      // No next breakpoint for 2xl
      break;
  }

  return info;
}

/**
 * 브레이크포인트 변경 감지
 */
export function hasBreakpointChanged(oldWidth: number, newWidth: number): boolean {
  return getCurrentBreakpoint(oldWidth) !== getCurrentBreakpoint(newWidth);
}

/**
 * 다음 브레이크포인트 계산
 */
export function getNextBreakpoint(
  current: Breakpoint,
  direction: 'up' | 'down'
): Breakpoint {
  const breakpoints: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(current);

  if (direction === 'up') {
    return breakpoints[Math.min(currentIndex + 1, breakpoints.length - 1)];
  } else {
    return breakpoints[Math.max(currentIndex - 1, 0)];
  }
}

/**
 * 이전 브레이크포인트 가져오기
 */
export function getPreviousBreakpoint(current: Breakpoint): Breakpoint {
  return getNextBreakpoint(current, 'down');
}

/**
 * 다음 브레이크포인트 가져오기
 */
export function getNextBreakpointUp(current: Breakpoint): Breakpoint {
  return getNextBreakpoint(current, 'up');
}

/**
 * 브레이크포인트별 최소 너비 가져오기
 */
export function getBreakpointMinWidth(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'sm':
      return 0;
    case 'md':
      return TAILWIND_BREAKPOINTS.sm;
    case 'lg':
      return TAILWIND_BREAKPOINTS.md;
    case 'xl':
      return TAILWIND_BREAKPOINTS.lg;
    case '2xl':
      return TAILWIND_BREAKPOINTS.xl;
  }
}

/**
 * 브레이크포인트별 최대 너비 가져오기
 */
export function getBreakpointMaxWidth(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'sm':
      return TAILWIND_BREAKPOINTS.sm - 1;
    case 'md':
      return TAILWIND_BREAKPOINTS.md - 1;
    case 'lg':
      return TAILWIND_BREAKPOINTS.lg - 1;
    case 'xl':
      return TAILWIND_BREAKPOINTS.xl - 1;
    case '2xl':
      return Infinity;
  }
}

/**
 * 브레이크포인트별 컬럼 수 가져오기
 */
export interface BreakpointSettings {
  enabled: boolean;
  columns: number;
}

export function getColumnsForBreakpoint(
  settings: Record<Breakpoint, BreakpointSettings>,
  breakpoint: Breakpoint,
  defaultColumns: number = 12
): number {
  const breakpointSettings = settings[breakpoint];
  return breakpointSettings?.enabled ? breakpointSettings.columns : defaultColumns;
}

/**
 * 너비에 해당하는 모든 활성화된 브레이크포인트 목록
 */
export function getActiveBreakpoints(width: number): Breakpoint[] {
  const active: Breakpoint[] = ['sm']; // sm은 항상 활성

  if (width >= TAILWIND_BREAKPOINTS.sm) active.push('md');
  if (width >= TAILWIND_BREAKPOINTS.md) active.push('lg');
  if (width >= TAILWIND_BREAKPOINTS.lg) active.push('xl');
  if (width >= TAILWIND_BREAKPOINTS.xl) active.push('2xl');

  return active;
}

/**
 * 브레이크포인트 비율 계산
 */
export function getBreakpointPercentage(
  currentWidth: number,
  breakpoint: Breakpoint
): number {
  const minWidth = getBreakpointMinWidth(breakpoint);
  const maxWidth = getBreakpointMaxWidth(breakpoint);

  if (maxWidth === Infinity) {
    return 100;
  }

  const range = maxWidth - minWidth;
  if (range === 0) return 100;

  return Math.min(((currentWidth - minWidth) / range) * 100, 100);
}
