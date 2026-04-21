/**
 * Font Analyzer Message Constants
 *
 * 폰트 분석 메시지 액션 상수
 */

/**
 * 메시지 액션 타입
 */
export const FONT_ANALYZER_MESSAGE_ACTIONS = {
  // 분석 관련
  START_ANALYSIS: 'FONT_ANALYZER_START',
  CANCEL_ANALYSIS: 'FONT_ANALYZER_CANCEL',
  ANALYSIS_COMPLETE: 'FONT_ANALYZER_COMPLETE',
  ANALYSIS_ERROR: 'FONT_ANALYZER_ERROR',

  // 폰트 조회
  GET_FONTS: 'FONT_GET_FONTS',
  GET_FONT_INFO: 'FONT_GET_INFO',
  FONTS_RESPONSE: 'FONT_FONTS_RESPONSE',
  FONT_INFO_RESPONSE: 'FONT_INFO_RESPONSE',

  // 웹 폰트
  GET_WEB_FONTS: 'FONT_GET_WEB_FONTS',
  WEB_FONTS_RESPONSE: 'FONT_WEB_FONTS_RESPONSE',

  // 시스템 폰트
  GET_SYSTEM_FONTS: 'FONT_GET_SYSTEM_FONTS',
  SYSTEM_FONTS_RESPONSE: 'FONT_SYSTEM_FONTS_RESPONSE',

  // 폰트 비교
  COMPARE_FONTS: 'FONT_COMPARE_FONTS',
  COMPARE_RESPONSE: 'FONT_COMPARE_RESPONSE',

  // 폰트 페어 추천
  SUGGEST_PAIRS: 'FONT_SUGGEST_PAIRS',
  PAIRS_RESPONSE: 'FONT_PAIRS_RESPONSE',

  // 설정
  UPDATE_SETTINGS: 'FONT_UPDATE_SETTINGS',
  GET_SETTINGS: 'FONT_GET_SETTINGS',
  SETTINGS_RESPONSE: 'FONT_SETTINGS_RESPONSE',

  // 하이라이트
  HIGHLIGHT_FONT: 'FONT_HIGHLIGHT',
  REMOVE_HIGHLIGHT: 'FONT_REMOVE_HIGHLIGHT',
} as const;

/**
 * 메시지 액션 값 타입
 */
export type FontAnalyzerMessageAction = typeof FONT_ANALYZER_MESSAGE_ACTIONS[keyof typeof FONT_ANALYZER_MESSAGE_ACTIONS];

/**
 * 베이스 메시지 인터페이스
 */
export interface FontAnalyzerBaseMessage {
  action: FontAnalyzerMessageAction;
}

/**
 * 분석 시작 메시지
 */
export interface FontAnalyzerStartMessage extends FontAnalyzerBaseMessage {
  action: 'FONT_ANALYZER_START';
  options?: {
    includeSystemFonts?: boolean;
    includeWebFonts?: boolean;
    checkMetrics?: boolean;
  };
}

/**
 * 폰트 정보 요청 메시지
 */
export interface GetFontsMessage extends FontAnalyzerBaseMessage {
  action: 'FONT_GET_FONTS';
  selector?: string;
  options?: {
    includeMetrics?: boolean;
    includeVariants?: boolean;
  };
}

/**
 * 폰트 정보 응답 메시지
 */
export interface FontsResponseMessage extends FontAnalyzerBaseMessage {
  action: 'FONT_FONTS_RESPONSE' | 'FONT_INFO_RESPONSE' | 'FONT_WEB_FONTS_RESPONSE' | 'FONT_SYSTEM_FONTS_RESPONSE' | 'FONT_COMPARE_RESPONSE' | 'FONT_PAIRS_RESPONSE' | 'FONT_SETTINGS_RESPONSE';
  data?: unknown;
  error?: string;
}

/**
 * 폰트 비교 요청 메시지
 */
export interface CompareFontsMessage extends FontAnalyzerBaseMessage {
  action: 'FONT_COMPARE_FONTS';
  selector1: string;
  selector2: string;
}

/**
 * 설정 업데이트 메시지
 */
export interface UpdateFontSettingsMessage extends FontAnalyzerBaseMessage {
  action: 'FONT_UPDATE_SETTINGS';
  settings: {
    autoScan?: boolean;
    showSystemFonts?: boolean;
    showWebFonts?: boolean;
    highlightOnHover?: boolean;
    showMetrics?: boolean;
    checkLoading?: boolean;
    theme?: 'light' | 'dark';
  };
}

/**
 * 하이라이트 메시지
 */
export interface FontHighlightMessage extends FontAnalyzerBaseMessage {
  action: 'FONT_HIGHLIGHT' | 'FONT_REMOVE_HIGHLIGHT';
  selector?: string;
  color?: string;
}

/**
 * Font Analyzer 메시지 타입 (유니온)
 */
export type FontAnalyzerMessage =
  | FontAnalyzerStartMessage
  | GetFontsMessage
  | FontsResponseMessage
  | CompareFontsMessage
  | UpdateFontSettingsMessage
  | FontHighlightMessage;
