/**
 * Font Analyzer Storage Constants
 *
 * 폰트 분석 저장소 키 상수
 */

import type { FontAnalyzerSettings } from '../types/fontAnalyzer';

/**
 * Chrome Storage 키
 */
export const FONT_ANALYZER_STORAGE_KEYS = {
  // 분석 결과
  ANALYSIS_RESULTS: 'font-analysis-results',
  LATEST_RESULT: 'font-analysis-latest',

  // 설정
  SETTINGS: 'font-analyzer-settings',

  // 즐겨찾기 폰트
  FAVORITE_FONTS: 'font-favorites',

  // 폰트 페어
  FONT_PAIRS: 'font-pairs',

  // 검색 기록
  SEARCH_HISTORY: 'font-searches',

  // 웹 폰트 캐시
  WEB_FONT_CACHE: 'web-font-cache',
} as const;

/**
 * 저장소 키 타입
 */
export type FontAnalyzerStorageKey = keyof typeof FONT_ANALYZER_STORAGE_KEYS;

/**
 * 기본 설정
 */
export const DEFAULT_FONT_ANALYZER_SETTINGS: FontAnalyzerSettings = {
  autoScan: false,
  showSystemFonts: true,
  showWebFonts: true,
  highlightOnHover: true,
  showMetrics: false,
  checkLoading: true,
  theme: 'light',
};

/**
 * 스토리지 초기 데이터
 */
export const FONT_ANALYZER_INITIAL_DATA: Record<string, unknown> = {
  [FONT_ANALYZER_STORAGE_KEYS.ANALYSIS_RESULTS]: [],
  [FONT_ANALYZER_STORAGE_KEYS.LATEST_RESULT]: null,
  [FONT_ANALYZER_STORAGE_KEYS.SETTINGS]: DEFAULT_FONT_ANALYZER_SETTINGS,
  [FONT_ANALYZER_STORAGE_KEYS.FAVORITE_FONTS]: [],
  [FONT_ANALYZER_STORAGE_KEYS.FONT_PAIRS]: [],
  [FONT_ANALYZER_STORAGE_KEYS.SEARCH_HISTORY]: [],
  [FONT_ANALYZER_STORAGE_KEYS.WEB_FONT_CACHE]: {},
};
