/**
 * CSS Scan CSS Classes
 *
 * CSS 스캔 관련 CSS 클래스 상수
 */

export const CSS_SCAN_CLASSES = {
  // 요소 하이라이트
  HIGHLIGHTED: 'css-scan-highlighted',
  HIGHLIGHT_OVERLAY: 'css-scan-highlight-overlay',
  HIGHLIGHT_BORDER: 'css-scan-highlight-border',
  ELEMENT_HIGHLIGHT: 'css-scan-element-highlight',
  CAPTURING: 'css-scan-capturing',

  // 박스 모델
  BOX_MODEL_OVERLAY: 'css-scan-box-model',
  BOX_MODEL_CONTENT: 'css-scan-box-content',
  BOX_MODEL_PADDING: 'css-scan-box-padding',
  BOX_MODEL_BORDER: 'css-scan-box-border',
  BOX_MODEL_MARGIN: 'css-scan-box-margin',

  // 가이드라인
  GUIDE_HORIZONTAL: 'css-scan-guide-h',
  GUIDE_VERTICAL: 'css-scan-guide-v',

  // 정보 패널
  INFO_PANEL: 'css-scan-info-panel',
  INFO_PANEL_FIXED: 'css-scan-info-panel-fixed',
  INFO_PANEL_FLOATING: 'css-scan-info-panel-floating',

  // 스타일 뷰어
  STYLE_VIEWER: 'css-scan-style-viewer',
  STYLE_PROPERTY: 'css-scan-property',
  STYLE_VALUE: 'css-scan-value',
  STYLE_RULE: 'css-scan-rule',
  STYLE_SELECTOR: 'css-scan-selector',

  // 컬러 피커
  COLOR_PREVIEW: 'css-scan-color-preview',
  COLOR_SWATCH: 'css-scan-color-swatch',

  // 선택자 뷰어
  SELECTOR_TAG: 'css-scan-selector-tag',
  SELECTOR_ID: 'css-scan-selector-id',
  SELECTOR_CLASS: 'css-scan-selector-class',
  SELECTOR_ATTR: 'css-scan-selector-attr',
  SELECTOR_PSEUDO: 'css-scan-selector-pseudo',

  // 비교 뷰
  COMPARISON_VIEW: 'css-scan-comparison',
  COMPARISON_DIFF: 'css-scan-diff',
  COMPARISON_SAME: 'css-scan-same',

  // 내보내기
  EXPORT_PREVIEW: 'css-scan-export-preview',
  EXPORT_CODE: 'css-scan-code',

  // 검색
  SEARCH_RESULTS: 'css-scan-search-results',
  SEARCH_HIGHLIGHT: 'css-scan-search-highlight',

  // 애니메이션
  ANIMATED: 'css-scan-animated',
  ANIMATION_TIMELINE: 'css-scan-animation-timeline',

  // 반응형
  BREAKPOINT_INDICATOR: 'css-scan-breakpoint',
  MEDIA_QUERY_BADGE: 'css-scan-media-badge',

  // 접근성
  ACCESSIBILITY_INFO: 'css-scan-a11y',
  CONTRAST_RATIO: 'css-scan-contrast',

  // 테마
  THEME_LIGHT: 'css-scan-light',
  THEME_DARK: 'css-scan-dark',
} as const;
