/**
 * Font Analyzer CSS Classes
 *
 * 폰트 분석 관련 CSS 클래스 상수 정의
 */

export const FONT_ANALYZER_CLASSES = {
  // 요소 하이라이트
  HIGHLIGHTED: 'font-analyzer-highlighted',
  HIGHLIGHT_OVERLAY: 'font-analyzer-overlay',
  FONT_BORDER: 'font-analyzer-font-border',

  // 폰트 정보 패널
  INFO_PANEL: 'font-info-panel',
  METRICS_PANEL: 'font-metrics-panel',

  // 웹 폰트 뱃지
  BADGE: 'font-badge',
  LOADING: 'font-loading',
  LOADED: 'font-loaded',
  ERROR: 'font-error',

  // 폰트 비교
  COMPARISON_VIEW: 'font-comparison-view',
  DIFF: 'font-diff',
  SAME: 'font-same',

  // 폰트 목록
  FONT_LIST: 'font-list',
  FONT_ITEM: 'font-item',
  FONT_PREVIEW: 'font-preview',

  // 폰트 페어
  PAIR_PREVIEW: 'pair-preview',
  PAIR_SCORE: 'pair-score',

  // 검색 결과
  SEARCH_RESULTS: 'font-search-results',
  SEARCH_HIGHLIGHT: 'font-search-highlight',

  // 메트릭스 가이드
  GUIDE_ASCENDER: 'guide-ascender',
  GUIDE_DESCENDER: 'guide-descender',
  GUIDE_CAP: 'guide-cap-height',
  GUIDE_X: 'guide-x-height',

  // 테마
  THEME_LIGHT: 'font-analyzer-light',
  THEME_DARK: 'font-analyzer-dark',
} as const;
