/**
 * Screenshot Error Messages
 *
 * 스크린샷 관련 에러 메시지 상수 정의
 */

export const SCREENSHOT_ERRORS = {
  CAPTURE_FAILED: '캡처에 실패했습니다',
  CLIPBOARD_DENIED: '클립보드 권한이 없습니다',
  CLIPBOARD_WRITE_FAILED: '클립보드에 복사하지 못했습니다',
  SIZE_TOO_LARGE: '이미지가 너무 큽니다 (최대 10MB)',
  ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
  HTML2CANVAS_ERROR: 'html2canvas 라이브러리 오류',
  STORAGE_QUOTA_EXCEEDED: '저장 공간이 부족합니다',
  DOWNLOAD_FAILED: '다운로드에 실패했습니다',
  INVALID_FORMAT: '잘못된 이미지 포맷입니다',
  NO_ACTIVE_TAB: '활성 탭이 없습니다',
  PERMISSION_DENIED: '화면 캡처 권한이 없습니다',
  USER_CANCELLED: '사용자가 취소했습니다',
} as const;

/**
 * 커스텀 에러 클래스
 */
export class ScreenshotError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ScreenshotError';
  }
}
