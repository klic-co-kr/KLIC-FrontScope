/**
 * Screenshot Storage Constants
 *
 * 스크린샷 Storage에 사용할 키 상수 정의
 */

/**
 * 스크린샷 Storage 키 상수
 */
export const SCREENSHOT_STORAGE_KEYS = {
  HISTORY: 'screenshot:history',
  SETTINGS: 'screenshot:settings',
  TEMP: 'screenshot:temp',
  ANNOTATIONS: 'screenshot:annotations',
} as const;

/**
 * Storage 제한 상수
 */
export const SCREENSHOT_LIMITS = {
  MAX_HISTORY: 10,
  MAX_ANNOTATIONS_PER_SCREENSHOT: 50,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_THUMBNAIL_SIZE: 100 * 1024, // 100KB
} as const;
