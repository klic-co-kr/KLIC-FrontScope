/**
 * Text Edit Type Definitions
 *
 * 텍스트 편집 도구를 위한 TypeScript 타입 정의
 */

/**
 * 단일 텍스트 편집 기록
 */
export interface TextEdit {
  /** 고유 ID (UUID) */
  id: string;
  /** 편집 시간戳 (Date.now()) */
  timestamp: number;
  /** 편집된 요소 정보 */
  element: {
    /** 태그명 (예: 'P', 'H1', 'SPAN') */
    tagName: string;
    /** CSS 선택자 */
    selector: string;
    /** XPath */
    xpath: string;
    /** 클래스명 */
    className?: string;
    /** 요소 ID */
    id?: string;
  };
  /** 변경 사항 */
  changes: {
    /** 수정 전 텍스트 */
    before: string;
    /** 수정 후 텍스트 */
    after: string;
    /** 글자 수 차이 */
    charDiff: number;
  };
  /** 추가 메타데이터 */
  metadata?: {
    /** 단어 수 */
    wordCount: {
      before: number;
      after: number;
    };
    /** 감지된 언어 */
    language?: 'ko' | 'en' | 'ja' | 'zh' | 'other';
    /** 편집 소요 시간 (ms) */
    editDuration?: number;
  };
}

/**
 * 텍스트 편집 히스토리
 */
export interface TextEditHistory {
  /** 편집 기록 배열 */
  edits: TextEdit[];
  /** 최대 저장 개수 */
  maxSize: number;
  /** 총 편집 횟수 */
  totalEdits: number;
  /** 마지막 편집 시간 */
  lastEditTime: number;
}

/**
 * 편집 가능한 요소 정보
 */
export interface EditableElement {
  /** DOM 요소 */
  element: HTMLElement;
  /** CSS 선택자 */
  selector: string;
  /** 원본 텍스트 */
  originalText: string;
  /** 편집 중 여부 */
  isEditing: boolean;
  /** 편집 시작 시간 */
  editStartTime?: number;
}

/**
 * 텍스트 편집 설정
 */
export interface TextEditSettings {
  /** 최대 히스토리 크기 (기본 20) */
  maxHistorySize: number;
  /** 최대 히스토리 (별칭) */
  maxHistory?: number;
  /** 자동 저장 여부 */
  autoSave: boolean;
  /** HTML 포맷 보존 여부 */
  preserveFormatting: boolean;
  /** 하이라이트 색상 */
  highlightColor: string;
  /** 키보드 단축키 활성화 */
  enableKeyboardShortcuts: boolean;
  /** 단축키 설정 */
  shortcuts: {
    /** 저장 단축키 (기본 'Ctrl+Enter') */
    save: string;
    /** 취소 단축키 (기본 'Escape') */
    cancel: string;
    /** 실행 취소 단축키 (기본 'Ctrl+Z') */
    undo: string;
  };
}

/**
 * 텍스트 편집 통계
 */
export interface TextEditStats {
  /** 총 편집 횟수 */
  totalEdits: number;
  /** 추가된 총 글자 수 */
  totalCharsAdded: number;
  /** 제거된 총 글자 수 */
  totalCharsRemoved: number;
  /** 변경된 총 글자 수 */
  totalCharsChanged: number;
  /** 변경된 총 단어 수 */
  totalWordsChanged: number;
  /** 편집된 요소 수 */
  editedElements: number;
  /** 평균 편집 시간 (ms) */
  averageEditDuration: number;
  /** 마지막 편집 시간 */
  lastEditTime: number;
}

/**
 * 텍스트 분석 결과
 */
export interface TextAnalysis {
  /** 글자 수 (공백 포함) */
  chars: number;
  /** 글자 수 (공백 제외) */
  charsNoSpaces: number;
  /** 단어 수 */
  words: number;
  /** 줄 수 */
  lines: number;
  /** 문장 수 */
  sentences: number;
  /** 감지된 언어 */
  language: 'ko' | 'en' | 'ja' | 'zh' | 'other';
}

/**
 * 텍스트 차이 정보
 */
export interface TextDiff {
  /** 추가된 단어/구문 */
  added: string[];
  /** 제거된 단어/구문 */
  removed: string[];
  /** 변경되지 않은 부분 */
  unchanged: string[];
  /** 글자 수 차이 */
  charDiff: number;
  /** 단어 수 차이 */
  wordDiff: number;
  /** 유사도 (0-1) */
  similarity: number;
}

/**
 * 키보드 단축키 정의
 */
export interface KeyboardShortcut {
  /** 키 이름 */
  key: string;
  /** Ctrl 키 필요 여부 */
  ctrlKey?: boolean;
  /** Shift 키 필요 여부 */
  shiftKey?: boolean;
  /** Alt 키 필요 여부 */
  altKey?: boolean;
  /** Meta(Cmd) 키 필요 여부 */
  metaKey?: boolean;
  /** 핸들러 함수 */
  handler: (event: KeyboardEvent, element: HTMLElement) => void;
  /** 설명 */
  description?: string;
}

/**
 * 메시지 타입
 */
export interface TextEditMessage {
  action:
  | 'TEXT_EDIT_TOGGLE'
  | 'TEXT_EDIT_SAVE'
  | 'TEXT_EDIT_UNDO'
  | 'TEXT_EDIT_UNDO_ALL'
  | 'TEXT_EDIT_GET_STATS'
  | 'TEXT_EDIT_HIGHLIGHT'
  | 'TEXT_EDIT_START'
  | 'TEXT_EDIT_END';
  data?: unknown;
  timestamp: number;
}

/**
 * 메시지 응답 타입
 */
export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  count?: number; // For undo all or similar
  active?: boolean; // For toggle
}
