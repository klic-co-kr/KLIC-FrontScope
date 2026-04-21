# Phase 1: 기반 설정

**태스크**: 4개
**예상 시간**: 1시간
**의존성**: 없음

---

### Task #8.1: 타입 정의 - 콘솔 로그 인터페이스

- **파일**: `src/types/console.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
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
  args: any[];                   // 원본 인자들
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
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

---

### Task #8.2: Storage 및 메시지 상수 확장

- **파일**: `src/constants/storage.ts`, `src/constants/messages.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
// src/constants/storage.ts 추가
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 콘솔
  CONSOLE_HISTORY: 'console:history',
  CONSOLE_SETTINGS: 'console:settings',
  CONSOLE_STATS: 'console:stats',
} as const;

export const STORAGE_LIMITS = {
  // ... 기존 제한
  CONSOLE_MAX_HISTORY: 1000,
  CONSOLE_MAX_MESSAGE_LENGTH: 10000,
} as const;

// src/constants/messages.ts 추가
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 콘솔
  CONSOLE_LOG_CAPTURED: 'CONSOLE_LOG_CAPTURED',
  CONSOLE_GET_LOGS: 'CONSOLE_GET_LOGS',
  CONSOLE_CLEAR_LOGS: 'CONSOLE_CLEAR_LOGS',
  CONSOLE_EXPORT_LOGS: 'CONSOLE_EXPORT_LOGS',
  CONSOLE_TOGGLE_INTERCEPT: 'CONSOLE_TOGGLE_INTERCEPT',
  CONSOLE_GET_STATS: 'CONSOLE_GET_STATS',
} as const;
```

---

### Task #8.3: 기본 설정 값

- **파일**: `src/constants/defaults.ts`
- **시간**: 10분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { ConsoleSettings } from '../types/console';

export const DEFAULT_CONSOLE_SETTINGS: ConsoleSettings = {
  maxHistorySize: 1000,
  captureStackTrace: true,
  preserveLog: true,
  groupSimilar: true,
  timestampFormat: 'HH:mm:ss.SSS',
  enabledLevels: ['log', 'warn', 'error', 'info', 'debug'],
  maxMessageLength: 10000,
};
```

---

### Task #8.4: 로그 레벨 상수 및 유틸리티

- **파일**: `src/constants/console.ts`
- **시간**: 5분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { LogLevel } from '../types/console';

/**
 * 로그 레벨 우선순위
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  log: 1,
  info: 2,
  warn: 3,
  error: 4,
};

/**
 * 로그 레벨 색상
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#9ca3af',    // gray-400
  log: '#000000',      // black
  info: '#3b82f6',     // blue-500
  warn: '#f59e0b',     // amber-500
  error: '#ef4444',    // red-500
};

/**
 * 로그 레벨 아이콘
 */
export const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🐛',
  log: '📝',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

/**
 * 로그 레벨 표시 이름
 */
export const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'Debug',
  log: 'Log',
  info: 'Info',
  warn: 'Warning',
  error: 'Error',
};
```

---

[Phase 2: 콘솔 인터셉터](./TASK-08-PHASE2.md) 로 계속
