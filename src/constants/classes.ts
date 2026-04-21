/**
 * CSS Class Constants
 *
 * 각 도구에서 사용할 CSS 클래스명 상수
 */

/**
 * 텍스트 편집 CSS 클래스
 */
export const TEXT_EDIT_CLASSES = {
  HOVER: 'klic-text-edit-hover',
  EDITING: 'klic-text-edit-editing',
  EDITED: 'klic-text-edit-edited',
  HIGHLIGHT: 'klic-text-edit-highlight',
  DISABLED: 'klic-text-edit-disabled',
} as const;

/**
 * 스크린샷 CSS 클래스
 */
export const SCREENSHOT_CLASSES = {
  SELECTION: 'klic-screenshot-selection',
  CAPTURING: 'klic-screenshot-capturing',
  OVERLAY: 'klic-screenshot-overlay',
} as const;

/**
 * CSS 스캔 CSS 클래스
 */
export const CSS_SCAN_CLASSES = {
  HIGHLIGHT: 'klic-css-scan-highlight',
  SELECTED: 'klic-css-scan-selected',
  BOX_MODEL: 'klic-css-scan-box-model',
} as const;

/**
 * 폰트 분석 CSS 클래스
 */
export const FONT_CLASSES = {
  PREVIEW: 'klic-font-preview',
  HIGHLIGHT: 'klic-font-highlight',
} as const;

/**
 * 컬러피커 CSS 클래스
 */
export const COLOR_PICKER_CLASSES = {
  PREVIEW: 'klic-color-preview',
  SWATCH: 'klic-color-swatch',
  SELECTED: 'klic-color-selected',
} as const;

/**
 * 자/측정 CSS 클래스
 */
export const RULER_CLASSES = {
  HOVER: 'klic-ruler-hover',
  MEASURING: 'klic-ruler-measuring',
  MEASURED: 'klic-ruler-measured',
  OVERLAY: 'klic-ruler-overlay',
  LINE: 'klic-ruler-line',
  LABEL: 'klic-ruler-label',
  BOX_MODEL: 'klic-ruler-box-model',
  DISABLED: 'klic-ruler-disabled',
} as const;

/**
 * 에셋 관리 CSS 클래스
 */
export const ASSET_CLASSES = {
  HIGHLIGHT: 'klic-asset-highlight',
  SELECTED: 'klic-asset-selected',
  OVERLAY: 'klic-asset-overlay',
  BADGE: 'klic-asset-badge',
  TOOLTIP: 'klic-asset-tooltip',
  EXTRACTING: 'klic-extracting',
  EXTRACTED: 'klic-extracted',
} as const;

/**
 * 에셋 관리자 CSS 클래스
 */
export const ASSET_MANAGER_CLASSES = {
  HOVER: 'klic-asset-hover',
  SELECTED: 'klic-asset-selected',
  EXTRACTING: 'klic-asset-extracting',
  DOWNLOADING: 'klic-asset-downloading',
  ANALYZING: 'klic-asset-analyzing',
} as const;

/**
 * 공통 툴 프리픽스
 */
export const TOOL_PREFIX = 'klic-' as const;

/**
 * 툴별 CSS 클래스 생성 함수
 */
export function getToolClass(tool: string, state: string): string {
  return `${TOOL_PREFIX}${tool}-${state}`;
}

/**
 * 공통 오버레이 클래스
 */
export const COMMON_CLASSES = {
  OVERLAY: 'klic-overlay',
  TOOLTIP: 'klic-tooltip',
  LOADING: 'klic-loading',
  HIDDEN: 'klic-hidden',
} as const;
