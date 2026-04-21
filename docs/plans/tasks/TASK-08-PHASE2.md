# Phase 2: 콘솔 인터셉터

**태스크**: 6개
**예상 시간**: 3시간
**의존성**: Phase 1 완료

---

### Task #8.5: 콘솔 메서드 인터셉터

- **파일**: `src/utils/console/interceptor.ts`
- **시간**: 1시간
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { ConsoleLog, LogLevel } from '../../types/console';
import { generateUUID } from '../common/uuid';
import { captureStackTrace } from './stackTrace';
import { formatLogMessage, parseArguments } from './formatter';

/**
 * 원본 콘솔 메서드 저장
 */
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
  time: console.time,
  timeEnd: console.timeEnd,
};

/**
 * 타이머 저장소
 */
const timers = new Map<string, number>();

/**
 * 로그 캡처 콜백
 */
let onLogCaptured: ((log: ConsoleLog) => void) | null = null;

/**
 * 인터셉터 활성화 상태
 */
let isIntercepting = false;

/**
 * 콘솔 인터셉터 초기화
 */
export function interceptConsole(callback: (log: ConsoleLog) => void) {
  if (isIntercepting) {
    return;
  }

  onLogCaptured = callback;
  isIntercepting = true;

  // console.log 오버라이드
  console.log = function (...args: any[]) {
    captureLog('log', args);
    originalConsole.log.apply(console, args);
  };

  // console.warn 오버라이드
  console.warn = function (...args: any[]) {
    captureLog('warn', args);
    originalConsole.warn.apply(console, args);
  };

  // console.error 오버라이드
  console.error = function (...args: any[]) {
    captureLog('error', args);
    originalConsole.error.apply(console, args);
  };

  // console.info 오버라이드
  console.info = function (...args: any[]) {
    captureLog('info', args);
    originalConsole.info.apply(console, args);
  };

  // console.debug 오버라이드
  console.debug = function (...args: any[]) {
    captureLog('debug', args);
    originalConsole.debug.apply(console, args);
  };

  // console.time 오버라이드
  console.time = function (label: string = 'default') {
    timers.set(label, performance.now());
    originalConsole.time.apply(console, [label]);
  };

  // console.timeEnd 오버라이드
  console.timeEnd = function (label: string = 'default') {
    const startTime = timers.get(label);

    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      timers.delete(label);

      capturePerformanceLog(label, duration);
    }

    originalConsole.timeEnd.apply(console, [label]);
  };
}

/**
 * 콘솔 인터셉터 복원
 */
export function restoreConsole() {
  if (!isIntercepting) {
    return;
  }

  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.time = originalConsole.time;
  console.timeEnd = originalConsole.timeEnd;

  isIntercepting = false;
  onLogCaptured = null;
  timers.clear();
}

/**
 * 로그 캡처
 */
function captureLog(level: LogLevel, args: any[]) {
  if (!onLogCaptured) {
    return;
  }

  const timestamp = Date.now();
  const message = formatLogMessage(args);
  const parsedArgs = parseArguments(args);

  const log: ConsoleLog = {
    id: generateUUID(),
    timestamp,
    level,
    message,
    args: parsedArgs,
    metadata: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(timestamp).toISOString(),
    },
  };

  // 에러인 경우 스택 트레이스 캡처
  if (level === 'error') {
    log.stackTrace = captureStackTrace();
  }

  onLogCaptured(log);
}

/**
 * 성능 로그 캡처
 */
function capturePerformanceLog(label: string, duration: number) {
  if (!onLogCaptured) {
    return;
  }

  const timestamp = Date.now();
  const message = `${label}: ${duration.toFixed(2)}ms`;

  const log: ConsoleLog = {
    id: generateUUID(),
    timestamp,
    level: 'info',
    message,
    args: [message],
    performance: {
      label,
      duration,
    },
    metadata: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(timestamp).toISOString(),
    },
  };

  onLogCaptured(log);
}

/**
 * 인터셉터 활성화 상태 확인
 */
export function isConsoleIntercepting(): boolean {
  return isIntercepting;
}
```
- **테스트 케이스**:
  - console.log/warn/error/info/debug 캡처
  - console.time/timeEnd 성능 측정
  - 원본 콘솔 동작 유지
  - 복원 후 정상 동작
- **완료 조건**: 모든 콘솔 메서드 정상 인터셉트

---

### Task #8.6: 스택 트레이스 캡처

- **파일**: `src/utils/console/stackTrace.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 스택 트레이스 정보
 */
export interface StackFrame {
  file: string;
  line: number;
  column: number;
  functionName?: string;
}

/**
 * 스택 트레이스 캡처
 */
export function captureStackTrace(): string {
  try {
    const error = new Error();
    return error.stack || '';
  } catch (e) {
    return '';
  }
}

/**
 * 스택 트레이스 파싱
 */
export function parseStackTrace(stack: string): StackFrame[] {
  if (!stack) {
    return [];
  }

  const lines = stack.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    // Chrome/Edge 형식: "at functionName (file:line:column)"
    const chromeMatch = line.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/);
    if (chromeMatch) {
      frames.push({
        functionName: chromeMatch[1],
        file: chromeMatch[2],
        line: parseInt(chromeMatch[3]),
        column: parseInt(chromeMatch[4]),
      });
      continue;
    }

    // Chrome/Edge 형식 (익명): "at file:line:column"
    const chromeAnonymousMatch = line.match(/at\s+(.*?):(\d+):(\d+)/);
    if (chromeAnonymousMatch) {
      frames.push({
        file: chromeAnonymousMatch[1],
        line: parseInt(chromeAnonymousMatch[2]),
        column: parseInt(chromeAnonymousMatch[3]),
      });
      continue;
    }

    // Firefox 형식: "functionName@file:line:column"
    const firefoxMatch = line.match(/(.*?)@(.*?):(\d+):(\d+)/);
    if (firefoxMatch) {
      frames.push({
        functionName: firefoxMatch[1] || undefined,
        file: firefoxMatch[2],
        line: parseInt(firefoxMatch[3]),
        column: parseInt(firefoxMatch[4]),
      });
    }
  }

  return frames;
}

/**
 * 스택 트레이스에서 소스 위치 추출
 */
export function extractSourceLocation(stack: string): {
  file: string;
  line: number;
  column: number;
} | null {
  const frames = parseStackTrace(stack);

  // 첫 번째 프레임 (가장 최근 호출)에서 위치 추출
  // 인터셉터 자체를 제외하기 위해 2-3번째 프레임 사용
  const frame = frames[2] || frames[1] || frames[0];

  if (!frame) {
    return null;
  }

  return {
    file: frame.file,
    line: frame.line,
    column: frame.column,
  };
}

/**
 * 스택 트레이스 포맷팅
 */
export function formatStackTrace(stack: string): string {
  const frames = parseStackTrace(stack);

  return frames
    .map((frame) => {
      const func = frame.functionName || '<anonymous>';
      return `  at ${func} (${frame.file}:${frame.line}:${frame.column})`;
    })
    .join('\n');
}
```
- **완료 조건**: Chrome/Firefox/Edge에서 스택 트레이스 파싱 성공

---

### Task #8.7: 로그 메시지 포맷터

- **파일**: `src/utils/console/formatter.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 로그 인자를 문자열로 포맷
 */
export function formatLogMessage(args: any[]): string {
  return args
    .map((arg) => formatArgument(arg))
    .join(' ');
}

/**
 * 단일 인자 포맷
 */
export function formatArgument(arg: any): string {
  if (arg === null) {
    return 'null';
  }

  if (arg === undefined) {
    return 'undefined';
  }

  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'number' || typeof arg === 'boolean') {
    return String(arg);
  }

  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`;
  }

  if (arg instanceof Date) {
    return arg.toISOString();
  }

  if (Array.isArray(arg)) {
    return formatArray(arg);
  }

  if (typeof arg === 'object') {
    return formatObject(arg);
  }

  return String(arg);
}

/**
 * 배열 포맷
 */
export function formatArray(arr: any[]): string {
  if (arr.length === 0) {
    return '[]';
  }

  if (arr.length > 5) {
    return `[${arr.slice(0, 5).map(formatArgument).join(', ')}, ... ${arr.length - 5} more]`;
  }

  return `[${arr.map(formatArgument).join(', ')}]`;
}

/**
 * 객체 포맷
 */
export function formatObject(obj: any): string {
  try {
    // 순환 참조 방지
    const cache = new Set();

    const replacer = (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    };

    const json = JSON.stringify(obj, replacer, 2);

    // 너무 길면 축약
    if (json.length > 200) {
      return `${json.slice(0, 200)}...`;
    }

    return json;
  } catch (e) {
    return '[Object]';
  }
}

/**
 * 인자 파싱 (저장용)
 */
export function parseArguments(args: any[]): any[] {
  return args.map((arg) => parseArgument(arg));
}

/**
 * 단일 인자 파싱
 */
export function parseArgument(arg: any): any {
  if (arg === null || arg === undefined) {
    return arg;
  }

  if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
    return arg;
  }

  if (arg instanceof Error) {
    return {
      _type: 'Error',
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  if (arg instanceof Date) {
    return {
      _type: 'Date',
      value: arg.toISOString(),
    };
  }

  if (Array.isArray(arg)) {
    return {
      _type: 'Array',
      value: arg.map(parseArgument),
    };
  }

  if (typeof arg === 'object') {
    try {
      const cache = new Set();

      const replacer = (key: string, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          cache.add(value);
        }
        return value;
      };

      return JSON.parse(JSON.stringify(arg, replacer));
    } catch (e) {
      return {
        _type: 'Object',
        value: '[Non-serializable]',
      };
    }
  }

  return String(arg);
}

/**
 * 파싱된 인자를 원본 형태로 복원
 */
export function restoreArgument(parsed: any): any {
  if (!parsed || typeof parsed !== 'object') {
    return parsed;
  }

  if (parsed._type === 'Error') {
    const error = new Error(parsed.message);
    error.name = parsed.name;
    error.stack = parsed.stack;
    return error;
  }

  if (parsed._type === 'Date') {
    return new Date(parsed.value);
  }

  if (parsed._type === 'Array') {
    return parsed.value.map(restoreArgument);
  }

  if (parsed._type === 'Object') {
    return parsed.value;
  }

  return parsed;
}
```
- **완료 조건**: 모든 데이터 타입 정상 포맷

---

### Task #8.8: 로그 그룹화 유틸리티

- **파일**: `src/utils/console/grouping.ts`
- **시간**: 30분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { ConsoleLog } from '../../types/console';

/**
 * 유사 로그 감지
 */
export function areSimilarLogs(log1: ConsoleLog, log2: ConsoleLog): boolean {
  // 레벨이 다르면 다른 로그
  if (log1.level !== log2.level) {
    return false;
  }

  // 메시지가 같으면 같은 로그
  if (log1.message === log2.message) {
    return true;
  }

  // 패턴 기반 유사도 체크
  const similarity = calculateMessageSimilarity(log1.message, log2.message);
  return similarity > 0.8;
}

/**
 * 메시지 유사도 계산
 */
export function calculateMessageSimilarity(msg1: string, msg2: string): number {
  // 간단한 Levenshtein 거리 기반 유사도
  const distance = levenshteinDistance(msg1, msg2);
  const maxLength = Math.max(msg1.length, msg2.length);

  if (maxLength === 0) {
    return 1;
  }

  return 1 - distance / maxLength;
}

/**
 * Levenshtein 거리 계산
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 삭제
        matrix[i][j - 1] + 1,      // 삽입
        matrix[i - 1][j - 1] + cost // 교체
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 로그 그룹화
 */
export function groupLogs(logs: ConsoleLog[]): ConsoleLog[] {
  const grouped: ConsoleLog[] = [];
  const seen = new Set<string>();

  for (const log of logs) {
    if (seen.has(log.id)) {
      continue;
    }

    // 유사한 로그 찾기
    const similarLogs = logs.filter(
      (otherLog) =>
        otherLog.id !== log.id &&
        !seen.has(otherLog.id) &&
        areSimilarLogs(log, otherLog)
    );

    if (similarLogs.length > 0) {
      // 그룹화된 로그 생성
      const groupedLog: ConsoleLog = {
        ...log,
        count: similarLogs.length + 1,
      };

      grouped.push(groupedLog);

      // 처리된 로그 표시
      seen.add(log.id);
      similarLogs.forEach((similarLog) => seen.add(similarLog.id));
    } else {
      grouped.push(log);
      seen.add(log.id);
    }
  }

  return grouped;
}
```
- **완료 조건**: 유사 로그 정확하게 그룹화

---

### Task #8.9: 로그 필터링 유틸리티

- **파일**: `src/utils/console/filtering.ts`
- **시간**: 20분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { ConsoleLog, ConsoleFilter, LogLevel } from '../../types/console';

/**
 * 로그 필터링
 */
export function filterLogs(logs: ConsoleLog[], filter: ConsoleFilter): ConsoleLog[] {
  return logs.filter((log) => {
    // 레벨 필터
    if (filter.levels.length > 0 && !filter.levels.includes(log.level)) {
      return false;
    }

    // 검색 키워드 필터
    if (filter.search && !matchesSearch(log, filter.search)) {
      return false;
    }

    // 날짜 범위 필터
    if (filter.dateRange) {
      if (
        log.timestamp < filter.dateRange.start ||
        log.timestamp > filter.dateRange.end
      ) {
        return false;
      }
    }

    // 스택 트레이스 필터
    if (filter.hasStackTrace !== undefined) {
      if (filter.hasStackTrace && !log.stackTrace) {
        return false;
      }
      if (!filter.hasStackTrace && log.stackTrace) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 검색 매칭
 */
function matchesSearch(log: ConsoleLog, search: string): boolean {
  const searchLower = search.toLowerCase();

  // 메시지에서 검색
  if (log.message.toLowerCase().includes(searchLower)) {
    return true;
  }

  // 스택 트레이스에서 검색
  if (log.stackTrace && log.stackTrace.toLowerCase().includes(searchLower)) {
    return true;
  }

  // 소스 파일에서 검색
  if (log.source && log.source.file.toLowerCase().includes(searchLower)) {
    return true;
  }

  return false;
}

/**
 * 로그 정렬
 */
export function sortLogs(
  logs: ConsoleLog[],
  sortBy: 'timestamp' | 'level',
  order: 'asc' | 'desc' = 'desc'
): ConsoleLog[] {
  const sorted = [...logs];

  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'timestamp') {
      comparison = a.timestamp - b.timestamp;
    } else if (sortBy === 'level') {
      const priorityA = getLogLevelPriority(a.level);
      const priorityB = getLogLevelPriority(b.level);
      comparison = priorityA - priorityB;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * 로그 레벨 우선순위 가져오기
 */
function getLogLevelPriority(level: LogLevel): number {
  const priorities: Record<LogLevel, number> = {
    debug: 0,
    log: 1,
    info: 2,
    warn: 3,
    error: 4,
  };

  return priorities[level] || 0;
}
```
- **완료 조건**: 모든 필터 정상 동작

---

### Task #8.10: 로그 내보내기 유틸리티

- **파일**: `src/utils/console/export.ts`
- **시간**: 35분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { ConsoleLog, ExportFormat, ExportOptions } from '../../types/console';
import { format } from 'date-fns';

/**
 * 로그 내보내기
 */
export function exportLogs(logs: ConsoleLog[], options: ExportOptions): string {
  // 필터 적용
  let filteredLogs = logs;

  if (options.includedLevels && options.includedLevels.length > 0) {
    filteredLogs = filteredLogs.filter((log) =>
      options.includedLevels!.includes(log.level)
    );
  }

  if (options.dateRange) {
    filteredLogs = filteredLogs.filter(
      (log) =>
        log.timestamp >= options.dateRange!.start &&
        log.timestamp <= options.dateRange!.end
    );
  }

  // 포맷에 따라 변환
  switch (options.format) {
    case 'json':
      return exportAsJSON(filteredLogs, options);
    case 'txt':
      return exportAsText(filteredLogs, options);
    case 'csv':
      return exportAsCSV(filteredLogs, options);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

/**
 * JSON 포맷으로 내보내기
 */
function exportAsJSON(logs: ConsoleLog[], options: ExportOptions): string {
  const exportData = logs.map((log) => {
    const data: any = {
      id: log.id,
      timestamp: log.timestamp,
      time: format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS'),
      level: log.level,
      message: log.message,
      args: log.args,
    };

    if (options.includeStackTrace && log.stackTrace) {
      data.stackTrace = log.stackTrace;
    }

    if (options.includeMetadata && log.metadata) {
      data.metadata = log.metadata;
    }

    if (log.source) {
      data.source = log.source;
    }

    if (log.performance) {
      data.performance = log.performance;
    }

    return data;
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * 텍스트 포맷으로 내보내기
 */
function exportAsText(logs: ConsoleLog[], options: ExportOptions): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('Console Logs Export');
  lines.push(`Exported at: ${format(Date.now(), 'yyyy-MM-dd HH:mm:ss')}`);
  lines.push(`Total logs: ${logs.length}`);
  lines.push('='.repeat(80));
  lines.push('');

  for (const log of logs) {
    const time = format(log.timestamp, 'HH:mm:ss.SSS');
    const level = log.level.toUpperCase().padEnd(5);

    lines.push(`[${time}] ${level} ${log.message}`);

    if (log.source) {
      lines.push(`  Source: ${log.source.file}:${log.source.line}:${log.source.column}`);
    }

    if (log.performance) {
      lines.push(`  Performance: ${log.performance.label} - ${log.performance.duration.toFixed(2)}ms`);
    }

    if (options.includeStackTrace && log.stackTrace) {
      lines.push(`  Stack Trace:`);
      log.stackTrace.split('\n').forEach((line) => {
        lines.push(`    ${line}`);
      });
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * CSV 포맷으로 내보내기
 */
function exportAsCSV(logs: ConsoleLog[], options: ExportOptions): string {
  const headers = ['Timestamp', 'Time', 'Level', 'Message'];

  if (options.includeMetadata) {
    headers.push('URL', 'User Agent');
  }

  if (options.includeStackTrace) {
    headers.push('Stack Trace');
  }

  const rows: string[][] = [headers];

  for (const log of logs) {
    const row = [
      log.timestamp.toString(),
      format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS'),
      log.level,
      escapeCSV(log.message),
    ];

    if (options.includeMetadata && log.metadata) {
      row.push(escapeCSV(log.metadata.url), escapeCSV(log.metadata.userAgent));
    }

    if (options.includeStackTrace) {
      row.push(escapeCSV(log.stackTrace || ''));
    }

    rows.push(row);
  }

  return rows.map((row) => row.join(',')).join('\n');
}

/**
 * CSV 이스케이프
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 파일 다운로드
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```
- **완료 조건**: JSON/TXT/CSV 포맷 정상 생성

---

[Phase 3: 로그 관리](./TASK-08-PHASE3.md) 로 계속
