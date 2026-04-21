/**
 * Font Analyzer Error Messages
 *
 * 폰트 분석 관련 에러 메시지 상수
 */

export const FONT_ANALYZER_ERRORS = {
  // 일반 에러
  ANALYSIS_FAILED: '폰트 분석에 실패했습니다',
  ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
  FONT_NOT_LOADED: '폰트가 로드되지 않았습니다',
  INVALID_FONT_FAMILY: '잘못된 폰트 패밀리입니다',

  // 웹 폰트 관련
  WEB_FONT_LOAD_FAILED: '웹 폰트 로드에 실패했습니다',
  WEB_FONT_ACCESS_DENIED: '웹 폰트 접근이 거부되었습니다 (CORS)',
  WEB_FONT_TIMEOUT: '웹 폰트 로드 시간이 초과되었습니다',

  // 시스템 폰트 관련
  SYSTEM_FONT_DETECTION_FAILED: '시스템 폰트 감지에 실패했습니다',
  FONT_NOT_AVAILABLE: '사용 가능한 폰트가 아닙니다',

  // 비교 관련
  COMPARE_FAILED: '폰트 비교에 실패했습니다',
  FONTS_NOT_COMPARABLE: '비교할 수 없는 폰트입니다',

  // 설정 관련
  INVALID_SETTINGS: '잘못된 설정입니다',
  SETTINGS_LOAD_FAILED: '설정 로드에 실패했습니다',

  // 저장소 관련
  STORAGE_SAVE_FAILED: '저장소 저장에 실패했습니다',
  STORAGE_LOAD_FAILED: '저장소 로드에 실패했습니다',
  STORAGE_QUOTA_EXCEEDED: '저장소 공간이 부족합니다',

  // 권한 관련
  PERMISSION_DENIED: '폰트 정보 조회 권한이 없습니다',
} as const;

/**
 * 커스텀 에러 클래스
 */
export class FontAnalyzerError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FontAnalyzerError';
  }
}

/**
 * 에러 생성 함수
 */
export function createFontAnalyzerError(
  code: keyof typeof FONT_ANALYZER_ERRORS,
  details?: unknown
): FontAnalyzerError {
  return new FontAnalyzerError(code, FONT_ANALYZER_ERRORS[code], details);
}
