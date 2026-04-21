/**
 * CSS Scan Storage Constants
 *
 * CSS 스캔 저장소 키 상수
 */

import type { CSSScanSettings } from '../types/cssScan';

/**
 * Chrome Storage 키
 */
export const CSS_SCAN_STORAGE_KEYS = {
  // 스캔 결과
  SCAN_RESULTS: 'css-scan-results',
  LATEST_RESULT: 'css-scan-latest',

  // 설정
  SETTINGS: 'css-scan-settings',

  // 즐겨찾기
  FAVORITED_ELEMENTS: 'css-scan-favorites',

  // 내보내기 기록
  EXPORT_HISTORY: 'css-scan-exports',

  // 검색 기록
  SEARCH_HISTORY: 'css-scan-searches',
} as const;

/**
 * 저장소 키 타입
 */
export type CSSScanStorageKey = keyof typeof CSS_SCAN_STORAGE_KEYS;

/**
 * 기본 설정
 */
export const DEFAULT_CSS_SCAN_SETTINGS: CSSScanSettings = {
  autoScan: false,
  highlightOnHover: true,
  showBoxModel: true,
  showInherited: false,
  showComputed: true,
  exportFormat: 'css',
  theme: 'light',
};

/**
 * 스토리지 초기 데이터
 */
export const CSS_SCAN_INITIAL_DATA: Record<string, unknown> = {
  [CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS]: [],
  [CSS_SCAN_STORAGE_KEYS.LATEST_RESULT]: null,
  [CSS_SCAN_STORAGE_KEYS.SETTINGS]: DEFAULT_CSS_SCAN_SETTINGS,
  [CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS]: [],
  [CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY]: [],
  [CSS_SCAN_STORAGE_KEYS.SEARCH_HISTORY]: [],
};
