/**
 * Grid Layout Helper Utilities
 *
 * 그리드 레이아웃 도구를 위한 헬퍼 함수들
 */

import type {
  GuideLine,
  GridOverlaySettings,
  WhitespaceSettings,
  GridLayoutSettings,
  GridMeasurement,
} from '../../types/gridLayout';
import {
  TAILWIND_BREAKPOINTS,
  type TailwindBreakpoint,
} from '../../constants/viewportPresets';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { generateGuideLineId } from '../common/uuid';

/**
 * 현재 뷰포트 크기에 해당하는 브레이크포인트 찾기
 */
export function getCurrentBreakpoint(width: number): TailwindBreakpoint {
  if (width < TAILWIND_BREAKPOINTS.sm) return 'sm';
  if (width < TAILWIND_BREAKPOINTS.md) return 'sm';
  if (width < TAILWIND_BREAKPOINTS.lg) return 'md';
  if (width < TAILWIND_BREAKPOINTS.xl) return 'lg';
  if (width < TAILWIND_BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
}

/**
 * 브레이크포인트에 해당하는 컬럼 수 가져오기
 */
export function getColumnsForBreakpoint(
  settings: GridOverlaySettings,
  breakpoint: TailwindBreakpoint
): number {
  const bpSettings = settings.breakpoints[breakpoint];
  return bpSettings?.enabled ? bpSettings.columns : settings.columns;
}

/**
 * 뷰포트 너비에 따른 컬럼 수 계산
 */
export function calculateColumns(
  settings: GridOverlaySettings,
  viewportWidth: number
): number {
  const breakpoint = getCurrentBreakpoint(viewportWidth);
  return getColumnsForBreakpoint(settings, breakpoint);
}

/**
 * 가이드라인 생성
 */
export function createGuideLine(
  type: 'horizontal' | 'vertical',
  position: number,
  options: Partial<Omit<GuideLine, 'id' | 'type' | 'position'>> = {}
): GuideLine {
  return {
    id: generateGuideLineId(),
    type,
    position,
    color: options.color || '#3b82f6',
    width: options.width || 2,
    style: options.style || 'dashed',
    locked: options.locked || false,
    visible: options.visible !== undefined ? options.visible : true,
  };
}

/**
 * 가이드라인 위치 유효성 검사
 */
export function isValidGuideLinePosition(
  position: number,
  viewportSize: { width: number; height: number },
  type: 'horizontal' | 'vertical'
): boolean {
  const max = type === 'horizontal' ? viewportSize.height : viewportSize.width;
  return position >= 0 && position <= max;
}

/**
 * 가장 가까운 가이드라인 찾기 (스냅용)
 */
export function findClosestGuideLine(
  guidelines: GuideLine[],
  position: number,
  orientation: 'horizontal' | 'vertical',
  threshold: number
): GuideLine | null {
  const filtered = guidelines.filter(
    g => g.type === orientation && g.visible && !g.locked
  );

  let closest: GuideLine | null = null;
  let minDiff = threshold;

  for (const guide of filtered) {
    const diff = Math.abs(guide.position - position);
    if (diff < minDiff) {
      minDiff = diff;
      closest = guide;
    }
  }

  return closest;
}

/**
 * 스냅 위치 계산
 */
export function calculateSnapPosition(
  position: number,
  guidelines: GuideLine[],
  orientation: 'horizontal' | 'vertical',
  threshold: number
): number {
  const closest = findClosestGuideLine(guidelines, position, orientation, threshold);
  return closest ? closest.position : position;
}

/**
 * 그리드 측정 정보 계산
 */
export function calculateGridMeasurement(
  x: number,
  y: number,
  settings: GridOverlaySettings,
  viewportWidth: number
): GridMeasurement {
  const columns = calculateColumns(settings, viewportWidth);
  const gap = settings.gap;
  const totalGap = gap * (columns - 1);
  const maxContentWidth = viewportWidth - totalGap;
  const columnWidth = maxContentWidth / columns;

  // 컬럼 인덱스 계산 (0-based)
  const columnIndex = Math.floor(x / (columnWidth + gap));

  return {
    x,
    y,
    width: columnWidth,
    height: 0,
    columnWidth,
    columnIndex: Math.min(columnIndex, columns - 1),
    breakpoint: getCurrentBreakpoint(viewportWidth),
  };
}

/**
 * 그리드 라인 위치 계산
 */
export function calculateGridLinePositions(
  settings: GridOverlaySettings,
  viewportWidth: number
): number[] {
  const columns = calculateColumns(settings, viewportWidth);
  const gap = settings.gap;
  const columnWidth = (viewportWidth - gap * (columns - 1)) / columns;

  const positions: number[] = [];
  for (let i = 0; i <= columns; i++) {
    positions.push(i * (columnWidth + gap));
  }

  return positions;
}

/**
 * CSS 그리드 템플릿 생성
 */
export function generateGridTemplateCSS(
  settings: GridOverlaySettings,
  viewportWidth: number
): string {
  const columns = calculateColumns(settings, viewportWidth);
  const gap = settings.gap;

  if (settings.maxWidth && settings.maxWidth !== '100%') {
    return `grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px; max-width: ${settings.maxWidth}; margin: ${settings.margin};`;
  }

  return `grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px;`;
}

/**
 * 뷰포트 프리셋 유효성 검사
 */
export function isValidViewportSize(width: number, height: number): boolean {
  return (
    width >= 320 &&
    width <= 7680 &&
    height >= 320 &&
    height <= 7680
  );
}

/**
 * 화이트스페이스 SVG 패턴 생성
 */
export function createWhitespacePatternSVG(
  settings: WhitespaceSettings
): string {
  const { pattern, color, size } = settings;
  const opacity = Math.round(settings.opacity * 255)
    .toString(16)
    .padStart(2, '0');
  const fillColor = `${color}${opacity}`;

  switch (pattern) {
    case 'solid':
      return `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${fillColor}"/></svg>`;

    case 'diagonal':
      return `<svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg" patternUnits="userSpaceOnUse">
        <pattern id="diagonal" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="${size}" stroke="${fillColor}" stroke-width="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#diagonal)"/>
      </svg>`;

    case 'crosshatch':
      return `<svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg" patternUnits="userSpaceOnUse">
        <pattern id="crosshatch" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="${size}" y2="0" stroke="${fillColor}" stroke-width="1"/>
          <line x1="0" y1="0" x2="0" y2="${size}" stroke="${fillColor}" stroke-width="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#crosshatch)"/>
      </svg>`;

    default:
      return '';
  }
}

/**
 * 뷰포트 비율 계산
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * 뷰포트 방향 결정
 */
export function determineOrientation(width: number, height: number): 'portrait' | 'landscape' {
  return width >= height ? 'landscape' : 'portrait';
}

/**
 * 줌 레벨 유효성 검사
 */
export function isValidZoomLevel(zoom: number): boolean {
  return zoom >= 0.1 && zoom <= 2.0;
}

/**
 * 줌 적용 후 크기 계산
 */
export function applyZoom(
  value: number,
  zoom: number
): number {
  return Math.round(value * zoom);
}

/**
 * 컬럼 수 유효성 검사
 */
export function isValidColumnCount(columns: number): boolean {
  return Number.isInteger(columns) && columns >= 1 && columns <= 16;
}

/**
 * 갭 값 유효성 검사
 */
export function isValidGapValue(gap: number): boolean {
  return Number.isInteger(gap) && gap >= 0 && gap <= 100;
}

/**
 * 투명도 값 유효성 검사
 */
export function isValidOpacity(opacity: number): boolean {
  return opacity >= 0 && opacity <= 1;
}

/**
 * 색상 값 유효성 검사 (HEX)
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * 설정 병합 (사용자 설정 + 기본 설정)
 */
export function mergeGridLayoutSettings(
  userSettings: Partial<GridLayoutSettings>
): GridLayoutSettings {
  return {
    guideLines: {
      ...DEFAULT_GRID_LAYOUT_SETTINGS.guideLines,
      ...userSettings.guideLines,
    },
    viewport: {
      ...DEFAULT_GRID_LAYOUT_SETTINGS.viewport,
      ...userSettings.viewport,
    },
    gridOverlay: {
      ...DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay,
      ...userSettings.gridOverlay,
      breakpoints: {
        ...DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay.breakpoints,
        ...userSettings.gridOverlay?.breakpoints,
      },
    },
    whitespace: {
      ...DEFAULT_GRID_LAYOUT_SETTINGS.whitespace,
      ...userSettings.whitespace,
    },
    keyboardShortcuts: {
      ...DEFAULT_GRID_LAYOUT_SETTINGS.keyboardShortcuts,
      ...userSettings.keyboardShortcuts,
    },
  };
}

/**
 * 설정 초기화
 */
export function createDefaultGridLayoutSettings(): GridLayoutSettings {
  return JSON.parse(JSON.stringify(DEFAULT_GRID_LAYOUT_SETTINGS));
}

/**
 * 가이드라인 정렬 (레이어 순서)
 */
export function sortGuideLines(guidelines: GuideLine[]): GuideLine[] {
  return [...guidelines].sort((a, b) => {
    // 잠금 해제된 것이 먼저
    if (a.locked !== b.locked) {
      return a.locked ? 1 : -1;
    }
    // 위치 순
    return a.position - b.position;
  });
}

/**
 * 가이드라인 필터링 (표시된 것만)
 */
export function getVisibleGuideLines(guidelines: GuideLine[]): GuideLine[] {
  return guidelines.filter(g => g.visible);
}

/**
 * 가이드라인 통계
 */
export function getGuideLineStats(guidelines: GuideLine[]): {
  total: number;
  horizontal: number;
  vertical: number;
  locked: number;
  visible: number;
} {
  return {
    total: guidelines.length,
    horizontal: guidelines.filter(g => g.type === 'horizontal').length,
    vertical: guidelines.filter(g => g.type === 'vertical').length,
    locked: guidelines.filter(g => g.locked).length,
    visible: guidelines.filter(g => g.visible).length,
  };
}

/**
 * 키보드 단축키 포맷팅
 */
export function formatShortcut(shortcut: string): string {
  return shortcut.split('+').map(key => {
    const displayName = key.trim();
    return displayName.length === 1 ? displayName.toUpperCase() : displayName;
  }).join(' + ');
}

/**
 * 브레이크포인트 비율 계산
 */
export function getBreakpointPercentage(
  currentWidth: number,
  breakpoint: TailwindBreakpoint
): number {
  const bpWidth = TAILWIND_BREAKPOINTS[breakpoint];
  return Math.min((currentWidth / bpWidth) * 100, 100);
}
