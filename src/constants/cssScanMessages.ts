/**
 * CSS Scan Message Constants
 *
 * CSS 스캔 메시지 액션 상수
 */

/**
 * 메시지 액션 타입
 */
export const CSS_SCAN_MESSAGE_ACTIONS = {
  // 스캔 관련
  START_SCAN: 'CSS_SCAN_START',
  CANCEL_SCAN: 'CSS_SCAN_CANCEL',
  SCAN_COMPLETE: 'CSS_SCAN_COMPLETE',
  SCAN_ERROR: 'CSS_SCAN_ERROR',

  // 요소 스타일 조회
  GET_ELEMENT_STYLE: 'CSS_GET_ELEMENT_STYLE',
  ELEMENT_STYLE_RESPONSE: 'CSS_ELEMENT_STYLE_RESPONSE',

  // 선택자 분석
  ANALYZE_SELECTORS: 'CSS_ANALYZE_SELECTORS',
  SELECTORS_RESPONSE: 'CSS_SELECTORS_RESPONSE',

  // 스타일시트 분석
  GET_STYLESHEETS: 'CSS_GET_STYLESHEETS',
  STYLESHEETS_RESPONSE: 'CSS_STYLESHEETS_RESPONSE',

  // 비교
  COMPARE_STYLES: 'CSS_COMPARE_STYLES',
  COMPARE_RESPONSE: 'CSS_COMPARE_RESPONSE',

  // 내보내기
  EXPORT_STYLES: 'CSS_EXPORT_STYLES',
  EXPORT_RESPONSE: 'CSS_EXPORT_RESPONSE',

  // 완료/에러
  COMPLETE: 'CSS_SCAN_COMPLETE',
  ERROR: 'CSS_SCAN_ERROR',

  // 설정
  UPDATE_SETTINGS: 'CSS_UPDATE_SETTINGS',
  GET_SETTINGS: 'CSS_GET_SETTINGS',
  SETTINGS_RESPONSE: 'CSS_SETTINGS_RESPONSE',

  // 하이라이트
  HIGHLIGHT_ELEMENT: 'CSS_HIGHLIGHT_ELEMENT',
  REMOVE_HIGHLIGHT: 'CSS_REMOVE_HIGHLIGHT',
} as const;

/**
 * 메시지 액션 값 타입
 */
export type CSSScanMessageAction = typeof CSS_SCAN_MESSAGE_ACTIONS[keyof typeof CSS_SCAN_MESSAGE_ACTIONS];

/**
 * 베이스 메시지 인터페이스
 */
export interface CSSScanBaseMessage {
  action: CSSScanMessageAction;
}

/**
 * 스캔 시작 메시지
 */
export interface CSSScanStartMessage extends CSSScanBaseMessage {
  action: 'CSS_SCAN_START';
  options?: {
    includeComputed?: boolean;
    includeInherited?: boolean;
    includeAnimations?: boolean;
  };
}

/**
 * 스캔 취소 메시지
 */
export interface CSSScanCancelMessage extends CSSScanBaseMessage {
  action: 'CSS_SCAN_CANCEL';
}

/**
 * 요소 스타일 요청 메시지
 */
export interface CSSGetElementStyleMessage extends CSSScanBaseMessage {
  action: 'CSS_GET_ELEMENT_STYLE';
  selector: string;
  options?: {
    includeComputed?: boolean;
    includeInherited?: boolean;
  };
  includeComputed?: boolean;
  includeInherited?: boolean;
}

/**
 * 스타일 응답 메시지
 */
export interface CSSStyleResponseMessage extends CSSScanBaseMessage {
  action: 'CSS_ELEMENT_STYLE_RESPONSE' | 'CSS_SELECTORS_RESPONSE' | 'CSS_STYLESHEETS_RESPONSE';
  data: unknown;
  error?: string;
}

/**
 * 비교 요청 메시지
 */
export interface CSSCompareStylesMessage extends CSSScanBaseMessage {
  action: 'CSS_COMPARE_STYLES';
  element1Selector: string;
  element2Selector: string;
}

/**
 * 내보내기 요청 메시지
 */
export interface CSSExportStylesMessage extends CSSScanBaseMessage {
  action: 'CSS_EXPORT_STYLES';
  selector?: string;
  format: 'css' | 'scss' | 'less' | 'json';
  options?: {
    minify?: boolean;
    includeSelectors?: boolean;
  };
}

/**
 * 설정 업데이트 메시지
 */
export interface CSSUpdateSettingsMessage extends CSSScanBaseMessage {
  action: 'CSS_UPDATE_SETTINGS';
  settings: {
    autoScan?: boolean;
    highlightOnHover?: boolean;
    showBoxModel?: boolean;
    showInherited?: boolean;
    showComputed?: boolean;
    exportFormat?: 'css' | 'scss' | 'less' | 'json';
    theme?: 'light' | 'dark';
  };
}

/**
 * 하이라이트 메시지
 */
export interface CSSHighlightMessage extends CSSScanBaseMessage {
  action: 'CSS_HIGHLIGHT_ELEMENT' | 'CSS_REMOVE_HIGHLIGHT';
  selector?: string;
  color?: string;
}

/**
 * 스캔 완료 메시지
 */
export interface CSSScanCompleteMessage extends CSSScanBaseMessage {
  action: 'CSS_SCAN_COMPLETE';
  result: unknown;
}

/**
 * 스캔 에러 메시지
 */
export interface CSSScanErrorMessage extends CSSScanBaseMessage {
  action: 'CSS_SCAN_ERROR';
  error: string;
}

/**
 * 내보내기 응답 메시지
 */
export interface CSSExportResponseMessage extends CSSScanBaseMessage {
  action: 'CSS_EXPORT_RESPONSE';
  data?: string;
  error?: string;
}

/**
 * CSS Scan 메시지 타입 (유니온)
 */
export type CSSScanMessage =
  | CSSScanStartMessage
  | CSSScanCancelMessage
  | CSSScanCompleteMessage
  | CSSScanErrorMessage
  | CSSGetElementStyleMessage
  | CSSStyleResponseMessage
  | CSSCompareStylesMessage
  | CSSExportStylesMessage
  | CSSExportResponseMessage
  | CSSUpdateSettingsMessage
  | CSSHighlightMessage;
