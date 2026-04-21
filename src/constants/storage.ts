/**
 * Storage Constants
 *
 * Chrome Storage Local에 사용할 키 상수 정의
 */

/**
 * Storage 키 상수
 */
export const STORAGE_KEYS = {
  // 텍스트 편집
  TEXT_EDIT_HISTORY: 'textEdit:history',
  TEXT_EDIT_SETTINGS: 'textEdit:settings',
  TEXT_EDIT_TEMP: 'textEdit:temp',
  TEXT_EDIT_STATS: 'textEdit:stats',

  // 스크린샷
  SCREENSHOT_HISTORY: 'screenshot:history',
  SCREENSHOT_SETTINGS: 'screenshot:settings',

  // CSS 스캔
  CSS_SCAN_HISTORY: 'cssScan:history',

  // 폰트 분석
  FONT_ANALYSIS_CACHE: 'fontAnalysis:cache',

  // 컬러피커
  COLOR_PICKER_HISTORY: 'colorPicker:history',
  COLOR_PICKER_COLLECTIONS: 'colorPicker:collections',
  COLOR_PICKER_FAVORITES: 'colorPicker:favorites',
  COLOR_PICKER_SETTINGS: 'colorPicker:settings',

  // 자/측정
  RULER_HISTORY: 'ruler:history',
  RULER_SETTINGS: 'ruler:settings',
  RULER_TEMP: 'ruler:temp',
  RULER_STATS: 'ruler:stats',

  // 에셋 관리
  ASSET_MANAGER_HISTORY: 'assetManager:history',
  ASSET_MANAGER_SETTINGS: 'assetManager:settings',
  ASSET_MANAGER_STATS: 'assetManager:stats',
  ASSET_MANAGER_COLLECTIONS: 'assetManager:collections',

  // 콘솔
  CONSOLE_LOGS: 'console:logs',
  CONSOLE_SETTINGS: 'console:settings',
  CONSOLE_STATS: 'console:stats',

  // 테일윈드
  TAILWIND_CACHE: 'tailwind:cache',
  TAILWIND_SETTINGS: 'tailwind:settings',
  TAILWIND_HISTORY: 'tailwind:history',

  // 리소스 및 네트워크
  RESOURCE_NETWORK_SETTINGS: 'resourceNetwork:settings',
  RESOURCE_NETWORK_STATS: 'resourceNetwork:stats',
  RESOURCE_NETWORK_STORAGE_EXPORT: 'resourceNetwork:storageExport',
  RESOURCE_NETWORK_SCHEDULED_CLEAN: 'resourceNetwork:scheduledClean',

  // 그리드 레이아웃
  GRID_LAYOUT_SETTINGS: 'gridLayout:settings',
  GRID_LAYOUT_GUIDELINES: 'gridLayout:guidelines',
  GRID_LAYOUT_VIEWPORT: 'gridLayout:viewport',
  GRID_LAYOUT_OVERLAY: 'gridLayout:overlay',
  GRID_LAYOUT_WHITESPACE: 'gridLayout:whitespace',
  GRID_LAYOUT_SNAPSHOTS: 'gridLayout:snapshots',
  GRID_LAYOUT_CUSTOM_PRESETS: 'gridLayout:customPresets',

  // 공통
  APP_SETTINGS: 'app:settings',

  SHORTCUTS_DATA: 'shortcuts:data',
} as const;

/**
 * Storage 제한 상수
 */
export const STORAGE_LIMITS = {
  /** 텍스트 편집 최대 히스토리 */
  TEXT_EDIT_MAX_HISTORY: 20,
  /** 스크린샷 최대 히스토리 */
  SCREENSHOT_MAX_HISTORY: 10,
  /** CSS 스캔 최대 히스토리 */
  CSS_SCAN_MAX_HISTORY: 15,
  /** 컬러피커 최대 히스토리 (0 = 무제한) */
  COLOR_PICKER_MAX_HISTORY: 0,
  /** 컬러피커 최대 컬렉션 수 */
  COLOR_PICKER_MAX_COLLECTIONS: 50,
  /** 컬러피커 컬렉션당 최대 색상 수 */
  COLOR_PICKER_MAX_COLORS_PER_COLLECTION: 100,
  /** 자/측정 최대 히스토리 */
  RULER_MAX_HISTORY: 20,
  /** 에셋 관리 최대 컬렉션 크기 */
  ASSET_MANAGER_MAX_COLLECTIONS: 50,
  ASSET_MANAGER_MAX_IMAGES_PER_COLLECTION: 500,
  /** 콘솔 최대 로그 */
  CONSOLE_MAX_LOGS: 1000,
  /** 콘솔 최대 메시지 길이 */
  CONSOLE_MAX_MESSAGE_LENGTH: 10000,
  /** 테일윈드 최대 히스토리 */
  TAILWIND_MAX_HISTORY: 50,
  /** 전체 Storage 할당량 (MB) */
  TOTAL_QUOTA_MB: 10,
  /** 리소스 네트워크 최대 네트워크 기록 */
  RESOURCE_MAX_NETWORK_HISTORY: 1000,
  /** 리소스 네트워크 최대 애니메이션 기록 */
  RESOURCE_MAX_ANIMATION_HISTORY: 500,
  /** 그리드 레이아웃 최대 가이드라인 */
  GRID_LAYOUT_MAX_GUIDELINES: 50,
  /** 그리드 레이아웃 최대 스냅샷 */
  GRID_LAYOUT_MAX_SNAPSHOTS: 20,
  /** 그리드 레이아웃 최대 커스텀 프리셋 */
  GRID_LAYOUT_MAX_CUSTOM_PRESETS: 10,
  /** 최대 이미지 크기 (MB) */
  MAX_IMAGE_SIZE_MB: 50,
} as const;

/**
 * Storage 타입
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
