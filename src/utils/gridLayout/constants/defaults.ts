/**
 * Default Settings Constants
 */

import type { GridLayoutSettings } from '../../../types/gridLayout';

/**
 * 기본 가이드라인 설정
 */
export const DEFAULT_GUIDELINE = {
  color: '#ff0000',
  width: 1,
  style: 'solid' as const,
  locked: false,
  visible: true,
  opacity: 1,
};

/**
 * 기본 가이드라인 관리 설정
 */
export const DEFAULT_GUIDELINE_SETTINGS = {
  items: [],
  showOnHover: false,
  snapToLines: true,
  snapThreshold: 10,
  maxGuidelines: 50,
};

/**
 * 기본 뷰포트 상태
 */
export const DEFAULT_VIEWPORT_STATE = {
  preset: null,
  customWidth: 1920,
  customHeight: 1080,
  orientation: 'landscape' as const,
  zoom: 1,
};

/**
 * 기본 그리드 오버레이 설정
 */
export const DEFAULT_GRID_OVERLAY = {
  enabled: false,
  columns: 12,
  gap: 20,
  margin: '0',
  maxWidth: '100%',
  color: '#ff0000',
  opacity: 0.5,
  style: 'solid' as const,
  showColumnNumbers: false,
  showColumnBackgrounds: false,
  showInfo: false,
  lineWidth: 1,
  zIndex: 9999,
  breakpoints: {
    sm: { enabled: true, columns: 4 },
    md: { enabled: true, columns: 8 },
    lg: { enabled: true, columns: 12 },
    xl: { enabled: true, columns: 12 },
    '2xl': { enabled: true, columns: 12 },
  },
};

/**
 * 기본 화이트스페이스 설정
 */
export const DEFAULT_WHITESPACE = {
  enabled: false,
  pattern: 'solid' as const,
  color: '#00ff00',
  opacity: 0.3,
  size: 20,
};

/**
 * 기본 키보드 단축키 설정
 */
export const DEFAULT_KEYBOARD_SHORTCUTS = {
  toggleGrid: 'Ctrl+G',
  toggleGuides: 'Ctrl+Shift+G',
  clearAll: 'Ctrl+Shift+X',
};

/**
 * 전체 기본 Grid Layout 설정
 */
export const DEFAULT_GRID_LAYOUT_SETTINGS: GridLayoutSettings = {
  guideLines: DEFAULT_GUIDELINE_SETTINGS,
  viewport: DEFAULT_VIEWPORT_STATE,
  gridOverlay: DEFAULT_GRID_OVERLAY,
  whitespace: DEFAULT_WHITESPACE,
  keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
};
