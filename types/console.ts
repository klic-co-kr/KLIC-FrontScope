/**
 * Console Types
 *
 * 콘솔 로그 캡처 및 분석을 위한 타입 정의
 */

/**
 * 콘솔 로그 레벨
 */
export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

/**
 * 콘솔 로그 항목
 */
export interface ConsoleLog {
  id: string;                    // UUID
  timestamp: number;             // Date.now()
  level: LogLevel;               // 로그 레벨
  message: string;               // 포맷된 메시지
  args: unknown[];               // 원본 인자들
  stackTrace?: string;           // 스택 트레이스 (error only)
  source?: {
    file: string;                // 파일명
    line: number;                // 라인 번호
    column: number;              // 컬럼 번호
  };
  count?: number;                // 같은 로그 반복 횟수
  performance?: {
    label: string;               // console.time 레이블
    duration: number;            // 실행 시간 (ms)
  };
  metadata?: {
    url: string;                 // 페이지 URL
    userAgent: string;           // User Agent
    timestamp: string;           // 포맷된 시간
  };
}

/**
 * 콘솔 로그 히스토리
 */
export interface ConsoleHistory {
  logs: ConsoleLog[];
  maxSize: number;               // 기본 1000
  totalLogs: number;
  lastLogTime: number;
  counts: {
    log: number;
    warn: number;
    error: number;
    info: number;
    debug: number;
  };
}

/**
 * 콘솔 필터 옵션
 */
export interface ConsoleFilter {
  levels: LogLevel[];            // 표시할 레벨
  search?: string;               // 검색 키워드
  dateRange?: {
    start: number;
    end: number;
  };
  hasStackTrace?: boolean;       // 스택 트레이스 있는 것만
}

/**
 * 콘솔 설정
 */
export interface ConsoleSettings {
  maxHistorySize: number;        // 기본 1000
  captureStackTrace: boolean;    // 스택 트레이스 캡처
  preserveLog: boolean;          // 페이지 이동 시 로그 보존
  groupSimilar: boolean;         // 유사 로그 그룹화
  timestampFormat: string;       // 시간 포맷
  enabledLevels: LogLevel[];     // 캡처할 레벨
  maxMessageLength: number;      // 최대 메시지 길이
}

/**
 * 콘솔 통계
 */
export interface ConsoleStats {
  totalLogs: number;
  byLevel: {
    log: number;
    warn: number;
    error: number;
    info: number;
    debug: number;
  };
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: number;
  }>;
  averageLogsPerMinute: number;
  firstLogTime: number;
  lastLogTime: number;
}

/**
 * 콘솔 내보내기 포맷
 */
export type ExportFormat = 'json' | 'txt' | 'csv';

/**
 * 콘솔 내보내기 옵션
 */
export interface ExportOptions {
  format: ExportFormat;
  includedLevels?: LogLevel[];
  dateRange?: {
    start: number;
    end: number;
  };
  includeStackTrace?: boolean;
  includeMetadata?: boolean;
}
