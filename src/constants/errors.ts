/**
 * Error Message Constants
 *
 * 각 도구에서 사용할 에러 메시지 상수
 */

/**
 * 텍스트 편집 에러 메시지
 */
export const TEXT_EDIT_ERRORS = {
  ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
  STORAGE_FULL: '저장 공간이 부족합니다',
  INVALID_ELEMENT: '편집할 수 없는 요소입니다',
  PERMISSION_DENIED: '편집 권한이 없습니다',
  IFRAME_ACCESS: 'iframe 내부는 접근할 수 없습니다',
  RESTORE_FAILED: '원본 복원에 실패했습니다',
} as const;

/**
 * 스크린샷 에러 메시지
 */
export const SCREENSHOT_ERRORS = {
  CAPTURE_FAILED: '캡처에 실패했습니다',
  CLIPBOARD_DENIED: '클립보드 권한이 없습니다',
  SIZE_TOO_LARGE: '이미지 크기가 너무 큽니다',
  HTML2CANVAS_ERROR: 'html2canvas 라이브러리 오류',
} as const;

/**
 * CSS 스캔 에러 메시지
 */
export const CSS_SCAN_ERRORS = {
  ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
  STYLES_NOT_AVAILABLE: '스타일 정보를 가져올 수 없습니다',
  CROSS_ORIGIN: 'CORS 제한으로 접근할 수 없습니다',
} as const;

/**
 * 폰트 분석 에러 메시지
 */
export const FONT_ERRORS = {
  PARSE_FAILED: '폰트 정보 파싱에 실패했습니다',
  NOT_A_FONT: '폰트 파일이 아닙니다',
  DOWNLOAD_FAILED: '폰트 다운로드에 실패했습니다',
} as const;

/**
 * 컬러피커 에러 메시지
 */
export const COLOR_PICKER_ERRORS = {
  EYEDROPPER_NOT_SUPPORTED: 'EyeDropper API를 지원하지 않는 브라우저입니다',
  EYEDROPPER_FAILED: '색상 추출에 실패했습니다',
  INVALID_COLOR: '유효하지 않은 색상 값입니다',
  CLIPBOARD_FAILED: '클립보드 복사에 실패했습니다',
  COLLECTION_FULL: '컬렉션 저장 공간이 부족합니다',
  COLLECTION_NOT_FOUND: '컬렉션을 찾을 수 없습니다',
  EXPORT_FAILED: '내보내기에 실패했습니다',
  IMPORT_FAILED: '가져오기에 실패했습니다',
  INVALID_FORMAT: '지원하지 않는 포맷입니다',
} as const;

/**
 * 자/측정 에러 메시지
 */
export const RULER_ERRORS = {
  ELEMENT_NOT_FOUND: '측정할 요소를 찾을 수 없습니다',
  INVALID_COORDINATES: '좌표가 유효하지 않습니다',
  MEASUREMENT_FAILED: '측정에 실패했습니다',
  STORAGE_FULL: '저장 공간이 부족합니다',
  INVALID_UNIT: '단위가 유효하지 않습니다',
  CANVAS_ERROR: '캔버스 렌더링 오류',
} as const;

/**
 * 에셋 관리 에러 메시지
 */
export const ASSET_ERRORS = {
  EXTRACTION_FAILED: '이미지 추출에 실패했습니다',
  DOWNLOAD_FAILED: '이미지 다운로드에 실패했습니다',
  CORS_RESTRICTED: 'CORS 제한으로 접근할 수 없는 이미지입니다',
  INVALID_IMAGE: '유효하지 않은 이미지입니다',
  INVALID_URL: '유효하지 않은 URL입니다',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  STORAGE_FULL: '저장 공간이 부족합니다',
  PERMISSION_DENIED: '권한이 거부되었습니다',
  INVALID_FORMAT: '지원하지 않는 포맷입니다',
  CLIPBOARD_FAILED: '클립보드 복사에 실패했습니다',
  ZIP_ERROR: 'ZIP 생성에 실패했습니다',
} as const;

/**
 * 그리드 레이아웃 에러 메시지
 */
export const GRID_LAYOUT_ERRORS = {
  OVERLAY_FAILED: '오버레이 표시에 실패했습니다',
  GUIDELINE_ADD_FAILED: '가이드라인 추가에 실패했습니다',
  GUIDELINE_REMOVE_FAILED: '가이드라인 제거에 실패했습니다',
  GUIDELINE_UPDATE_FAILED: '가이드라인 업데이트에 실패했습니다',
  VIEWPORT_SET_FAILED: '뷰포트 설정에 실패했습니다',
  INVALID_VIEWPORT_SIZE: '유효하지 않은 뷰포트 크기입니다',
  SNAPSHOT_SAVE_FAILED: '스냅샷 저장에 실패했습니다',
  EXPORT_FAILED: '내보내기에 실패했습니다',
  IMPORT_FAILED: '가져오기에 실패했습니다',
  PRESET_ADD_FAILED: '프리셋 추가에 실패했습니다',
  PRESET_REMOVE_FAILED: '프리셋 제거에 실패했습니다',
  PRESET_LIMIT_EXCEEDED: '프리셋 개수 제한을 초과했습니다',
  STORAGE_FULL: '저장 공간이 부족합니다',
} as const;

/**
 * 리소스 및 네트워크 에러 메시지
 */
export const RESOURCE_NETWORK_ERRORS = {
  STORAGE_ACCESS_FAILED: '스토리지 접근에 실패했습니다',
  COOKIE_ACCESS_FAILED: '쿠키 접근이 거부되었습니다',
  ANIMATION_SCAN_FAILED: '애니메이션 스캔에 실패했습니다',
  NETWORK_MONITOR_FAILED: '네트워크 모니터링을 시작할 수 없습니다',
  NETWORK_MONITOR_STOP_FAILED: '네트워크 모니터링을 중지할 수 없습니다',
  CACHE_ACCESS_FAILED: '캐시 정보를 가져올 수 없습니다',
  PERMISSION_DENIED: '필요한 권한이 거부되었습니다',
  EXPORT_FAILED: '내보내기에 실패했습니다',
  IMPORT_FAILED: '가져오기에 실패했습니다',
  INVALID_FILE_FORMAT: '유효하지 않은 파일 형식입니다',
  CLEAN_FAILED: '정리 작업에 실패했습니다',
  SCHEDULE_CLEAN_FAILED: '예약된 클린 실행에 실패했습니다',
} as const;

/**
 * 에셋 관리자 에러 메시지
 */
export const ERROR_MESSAGES = {
  ASSET_MANAGER: {
    NO_IMAGES_FOUND: '이미지를 찾을 수 없습니다',
    DOWNLOAD_FAILED: '다운로드에 실패했습니다',
    EXTRACT_FAILED: '추출에 실패했습니다',
    INVALID_IMAGE_URL: '유효하지 않은 이미지 URL입니다',
    IMAGE_LOAD_FAILED: '이미지 로딩에 실패했습니다',
    ZIP_CREATION_FAILED: 'ZIP 파일 생성에 실패했습니다',
    CLIPBOARD_COPY_FAILED: '클립보드 복사에 실패했습니다',
    SIZE_LIMIT_EXCEEDED: '파일 크기 제한을 초과했습니다',
    CORS_ERROR: 'CORS 오류로 이미지에 접근할 수 없습니다',
  },
} as const;

/**
 * 공통 에러 메시지
 */
export const COMMON_ERRORS = {
  UNKNOWN: '알 수 없는 오류가 발생했습니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  TIMEOUT: '요청 시간이 초과되었습니다',
} as const;

/**
 * 커스템 에러 클래스
 */
export class KlicError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'KlicError';
  }
}

/**
 * 에러 코드 타입
 */
export type ErrorCode =
  | typeof TEXT_EDIT_ERRORS[keyof typeof TEXT_EDIT_ERRORS]
  | typeof SCREENSHOT_ERRORS[keyof typeof SCREENSHOT_ERRORS]
  | typeof CSS_SCAN_ERRORS[keyof typeof CSS_SCAN_ERRORS]
  | typeof FONT_ERRORS[keyof typeof FONT_ERRORS]
  | typeof COLOR_PICKER_ERRORS[keyof typeof COLOR_PICKER_ERRORS]
  | typeof RULER_ERRORS[keyof typeof RULER_ERRORS]
  | typeof ASSET_ERRORS[keyof typeof ASSET_ERRORS]
  | typeof GRID_LAYOUT_ERRORS[keyof typeof GRID_LAYOUT_ERRORS];
