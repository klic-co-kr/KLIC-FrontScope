/**
 * CSS Scan Error Messages
 *
 * CSS 스캔 관련 에러 메시지 상수
 */

export const CSS_SCAN_ERRORS = {
  // 일반 에러
  SCAN_FAILED: '스타일 스캔에 실패했습니다',
  ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
  INVALID_SELECTOR: '잘못된 선택자입니다',
  PARSE_ERROR: 'CSS 파싱 오류가 발생했습니다',

  // 스타일시트 관련
  STYLESHEET_NOT_FOUND: '스타일시트를 찾을 수 없습니다',
  STYLESHEET_ACCESS_DENIED: '스타일시이트 접근이 거부되었습니다 (CORS)',
  STYLESHEET_LOAD_FAILED: '스타일시이트 로드에 실패했습니다',

  // 내보내기 관련
  EXPORT_FAILED: '스타일 내보내기에 실패했습니다',
  INVALID_FORMAT: '잘못된 내보내기 형식입니다',
  FILE_WRITE_FAILED: '파일 쓰기에 실패했습니다',

  // 비교 관련
  COMPARE_FAILED: '스타일 비교에 실패했습니다',
  ELEMENTS_NOT_COMPARABLE: '비교할 수 없는 요소들입니다',

  // 저장소 관련
  STORAGE_SAVE_FAILED: '저장소 저장에 실패했습니다',
  STORAGE_LOAD_FAILED: '저장소 로드에 실패했습니다',
  STORAGE_QUOTA_EXCEEDED: '저장소 공간이 부족합니다',

  // 권한 관련
  PERMISSION_DENIED: '스타일 조회 권한이 없습니다',
  CROSS_ORIGIN_RESTRICTED: 'Cross-Origin 제약으로 접근할 수 없습니다',

  // 설정 관련
  INVALID_SETTINGS: '잘못된 설정입니다',
  SETTINGS_LOAD_FAILED: '설정 로드에 실패했습니다',
} as const;

/**
 * 커스텀 에러 클래스
 */
export class CSSScanError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CSSScanError';
  }
}

/**
 * 에러 형식 생성 함수
 */
export function createCSSScanError(
  code: keyof typeof CSS_SCAN_ERRORS,
  details?: unknown
): CSSScanError {
  return new CSSScanError(code, CSS_SCAN_ERRORS[code], details);
}

/**
 * 에러인지 확인하는 타입 가드
 */
export function isCSSScanError(error: unknown): error is CSSScanError {
  return error instanceof CSSScanError;
}
