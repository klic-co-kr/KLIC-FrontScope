/**
 * Screenshot CSS Classes
 *
 * 스크린샷 관련 CSS 클래스 상수 정의
 */

export const SCREENSHOT_CLASSES = {
  // 영역 선택
  SELECTION: 'klic-screenshot-selection',
  CAPTURING: 'klic-screenshot-capturing',
  OVERLAY: 'klic-screenshot-overlay',
  DIMMED: 'klic-screenshot-dimmed',

  // 하이라이트
  ELEMENT_HIGHLIGHT: 'klic-screenshot-element-highlight',
  AREA_SELECTED: 'klic-screenshot-area-selected',

  // 캡처 캔버러스
  CURSOR: 'klic-screenshot-cursor',

  // 주석
  ANNOTATION_ARROW: 'klic-annotation-arrow',
  ANNOTATION_TEXT: 'klic-annotation-text',
  ANNOTATION_SHAPE: 'klic-annotation-shape',
  ANNOTATION_PEN: 'klic-annotation-pen',
  ANNOTATION_SELECTED: 'klic-annotation-selected',

  // 미리보기
  THUMBNAIL: 'klic-screenshot-thumbnail',
  PREVIEW: 'klic-screenshot-preview',
} as const;

// Re-export actions from screenshotMessages
export { SCREENSHOT_ACTIONS, SCREENSHOT_MESSAGE_ACTIONS } from './screenshotMessages';
