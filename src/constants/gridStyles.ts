/**
 * Grid Style Constants
 *
 * 그리드 레이아웃 도구의 스타일 관련 상수
 */

import type { GuideLineStyle, WhitespacePattern } from '../types/gridLayout';

/**
 * 가이드라인 스타일 라벨
 */
export const GUIDE_LINE_STYLE_LABELS: Record<GuideLineStyle, string> = {
  solid: '실선',
  dashed: '점선',
  dotted: '점묘선',
} as const;

/**
 * 화이트스페이스 패턴 라벨
 */
export const WHITESPACE_PATTERN_LABELS: Record<WhitespacePattern, string> = {
  solid: '단색',
  diagonal: '대각선',
  crosshatch: '십자무늬',
} as const;

/**
 * 그리드 색상 프리셋
 */
export const GRID_COLOR_PRESETS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'White', value: '#ffffff' },
] as const;

/**
 * 그리드 너비 프리셋
 */
export const GRID_WIDTH_PRESETS = [1, 2, 3, 4, 5] as const;

/**
 * 그리드 투명도 프리셋
 */
export const GRID_OPACITY_PRESETS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] as const;

/**
 * 컬럼 수 프리셋
 */
export const COLUMN_COUNT_PRESETS = [1, 2, 3, 4, 6, 8, 12, 16] as const;

/**
 * 갭(gap) 프리셋 (px)
 */
export const GAP_PRESETS = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

/**
 * 마진 프리셋
 */
export const MARGIN_PRESETS = [
  { name: '없음', value: '0' },
  { name: 'Auto', value: 'auto' },
  { name: '16px', value: '16px' },
  { name: '24px', value: '24px' },
  { name: '32px', value: '32px' },
] as const;

/**
 * 최대 너비 프리셋
 */
export const MAX_WIDTH_PRESETS = [
  { name: '100%', value: '100%' },
  { name: '1200px', value: '1200px' },
  { name: '1280px', value: '1280px' },
  { name: '1440px', value: '1440px' },
  { name: '1536px', value: '1536px' },
] as const;

/**
 * 브레이크포인트 라벨
 */
export const BREAKPOINT_LABELS = {
  sm: 'Small (640px)',
  md: 'Medium (768px)',
  lg: 'Large (1024px)',
  xl: 'XL (1280px)',
  '2xl': '2XL (1536px)',
} as const;

/**
 * 디바이스 카테고리 라벨
 */
export const DEVICE_CATEGORY_LABELS = {
  mobile: '모바일',
  tablet: '태블릿',
  desktop: '데스크톱',
  custom: '사용자 정의',
} as const;

/**
 * 화면 방향 라벨
 */
export const ORIENTATION_LABELS = {
  portrait: '세로',
  landscape: '가로',
} as const;

/**
 * 줌 레벨 프리셋
 */
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

/**
 * 화이트스페이스 크기 프리셋
 */
export const WHITESPACE_SIZE_PRESETS = [4, 6, 8, 10, 12, 16, 20] as const;

/**
 * 스냅 임계값 프리셋
 */
export const SNAP_THRESHOLD_PRESETS = [1, 3, 5, 8, 10] as const;

/**
 * 기본 그리드 오버레이 설정 (Tailwind 기반)
 */
export const TAILWIND_GRID_DEFAULTS = {
  sm: { columns: 4, containerWidth: 640 },
  md: { columns: 8, containerWidth: 768 },
  lg: { columns: 12, containerWidth: 1024 },
  xl: { columns: 12, containerWidth: 1280 },
  '2xl': { columns: 12, containerWidth: 1536 },
} as const;

/**
 * 인기 있는 레이아웃 시스템 프리셋
 */
export const LAYOUT_SYSTEM_PRESETS = [
  {
    name: 'Tailwind CSS',
    description: 'Tailwind CSS 기본 그리드 시스템',
    breakpoints: TAILWIND_GRID_DEFAULTS,
  },
  {
    name: 'Bootstrap 5',
    description: 'Bootstrap 5 그리드 시스템',
    breakpoints: {
      sm: { columns: 4, containerWidth: 540 },
      md: { columns: 8, containerWidth: 720 },
      lg: { columns: 12, containerWidth: 960 },
      xl: { columns: 12, containerWidth: 1140 },
      xxl: { columns: 12, containerWidth: 1320 },
    },
  },
  {
    name: 'Material UI',
    description: 'Material Design 그리드 시스템',
    breakpoints: {
      xs: { columns: 4, containerWidth: 0 },
      sm: { columns: 8, containerWidth: 600 },
      md: { columns: 12, containerWidth: 900 },
      lg: { columns: 12, containerWidth: 1200 },
      xl: { columns: 12, containerWidth: 1536 },
    },
  },
] as const;

/**
 * 키보드 단축키 기본값
 */
export const DEFAULT_KEYBOARD_SHORTCUTS = {
  toggleGrid: 'Ctrl+Shift+G',
  toggleGuides: 'Ctrl+Shift+H',
  clearAll: 'Ctrl+Shift+X',
  addHorizontalGuide: 'Ctrl+Alt+H',
  addVerticalGuide: 'Ctrl+Alt+V',
  toggleSnap: 'Ctrl+Shift+S',
  increaseColumns: 'Ctrl+Alt+Right',
  decreaseColumns: 'Ctrl+Alt+Left',
  zoomIn: 'Ctrl+Plus',
  zoomOut: 'Ctrl+Minus',
  resetZoom: 'Ctrl+0',
} as const;

/**
 * 유효한 키보드 단축키 조합
 */
export const VALID_KEY_COMBINATIONS = [
  'Ctrl',
  'Shift',
  'Alt',
  'Meta',
] as const;

/**
 * 단축키 키 매핑 (디스플레이용)
 */
export const KEY_DISPLAY_NAMES: Record<string, string> = {
  Ctrl: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Meta: 'Cmd',
  Plus: '+',
  Minus: '-',
  Left: '←',
  Right: '→',
  Up: '↑',
  Down: '↓',
  Escape: 'Esc',
  Enter: 'Enter',
  Delete: 'Del',
  Backspace: 'Backspace',
} as const;

/**
 * 키보드 단축키 카테고리
 */
export type ShortcutCategory = 'toggle' | 'guides' | 'viewport' | 'grid' | 'whitespace' | 'general';

/**
 * 키보드 단축키 정의
 */
export interface KeyboardShortcut {
  id: string;
  label: string;
  description?: string;
  shortcut: string;
  category: ShortcutCategory;
}

/**
 * 그리드 레이아웃 키보드 단축키 목록
 */
export const GRID_LAYOUT_SHORTCUTS: KeyboardShortcut[] = [
  // Toggle
  {
    id: 'toggle-grid',
    label: '그리드 토글',
    description: '그리드 오버레이 표시/숨김',
    shortcut: 'Ctrl+Shift+G',
    category: 'toggle',
  },
  {
    id: 'toggle-guides',
    label: '가이드라인 토글',
    description: '가이드라인 표시/숨김',
    shortcut: 'Ctrl+Shift+H',
    category: 'toggle',
  },
  {
    id: 'toggle-whitespace',
    label: '화이트스페이스 토글',
    description: '화이트스페이스 표시/숨김',
    shortcut: 'Ctrl+Shift+W',
    category: 'toggle',
  },
  {
    id: 'toggle-snap',
    label: '스냅 토글',
    description: '스냅 기능 켜기/끄기',
    shortcut: 'Ctrl+Shift+S',
    category: 'toggle',
  },

  // Guides
  {
    id: 'add-horizontal-guide',
    label: '수평 가이드 추가',
    description: '화면 중앙에 수평 가이드라인 추가',
    shortcut: 'Ctrl+Alt+H',
    category: 'guides',
  },
  {
    id: 'add-vertical-guide',
    label: '수직 가이드 추가',
    description: '화면 중앙에 수직 가이드라인 추가',
    shortcut: 'Ctrl+Alt+V',
    category: 'guides',
  },
  {
    id: 'clear-all-guides',
    label: '모든 가이드 삭제',
    description: '모든 가이드라인 제거',
    shortcut: 'Ctrl+Shift+X',
    category: 'guides',
  },
  {
    id: 'lock-all-guides',
    label: '모든 가이드 잠금',
    description: '모든 가이드라인 잠금',
    shortcut: 'Ctrl+Shift+L',
    category: 'guides',
  },

  // Viewport
  {
    id: 'zoom-in',
    label: '확대',
    description: '뷰포트 확대',
    shortcut: 'Ctrl+Plus',
    category: 'viewport',
  },
  {
    id: 'zoom-out',
    label: '축소',
    description: '뷰포트 축소',
    shortcut: 'Ctrl+Minus',
    category: 'viewport',
  },
  {
    id: 'reset-zoom',
    label: '줌 리셋',
    description: '뷰포트 줌 100%로 리셋',
    shortcut: 'Ctrl+0',
    category: 'viewport',
  },
  {
    id: 'rotate-viewport',
    label: '뷰포트 회전',
    description: '뷰포트 가로/세로 회전',
    shortcut: 'Ctrl+R',
    category: 'viewport',
  },

  // Grid
  {
    id: 'increase-columns',
    label: '컬럼 증가',
    description: '그리드 컬럼 수 증가',
    shortcut: 'Ctrl+Alt+Right',
    category: 'grid',
  },
  {
    id: 'decrease-columns',
    label: '컬럼 감소',
    description: '그리드 컬럼 수 감소',
    shortcut: 'Ctrl+Alt+Left',
    category: 'grid',
  },
  {
    id: 'toggle-column-numbers',
    label: '컬럼 번호 토글',
    description: '컬럼 번호 표시/숨김',
    shortcut: 'Ctrl+Shift+N',
    category: 'grid',
  },

  // Whitespace
  {
    id: 'cycle-whitespace-pattern',
    label: '패턴 순환',
    description: '화이트스페이스 패턴 변경',
    shortcut: 'Ctrl+Shift+P',
    category: 'whitespace',
  },
  {
    id: 'increase-whitespace-opacity',
    label: '불투명도 증가',
    description: '화이트스페이스 불투명도 증가',
    shortcut: 'Ctrl+Alt+Up',
    category: 'whitespace',
  },
  {
    id: 'decrease-whitespace-opacity',
    label: '불투명도 감소',
    description: '화이트스페이스 불투명도 감소',
    shortcut: 'Ctrl+Alt+Down',
    category: 'whitespace',
  },
] as const;
