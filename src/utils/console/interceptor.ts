/**
 * Console Interceptor
 *
 * console.* 메서드 인터셉트 및 캡처
 */

import { ConsoleLog, LogLevel } from '../../types/console';
import { generateUUID } from '../common/uuid';
import { captureStackTrace } from './stackTrace';
import { formatLogMessage, parseArguments } from './formatter';

/**
 * 원본 콘솔 메서드 저장
 */
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
  time: console.time.bind(console),
  timeEnd: console.time.bind(console),
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
export function interceptConsole(callback: (log: ConsoleLog) => void): void {
  if (isIntercepting) {
    return;
  }

  onLogCaptured = callback;
  isIntercepting = true;

  // console.log 오버라이드
  console.log = function (...args: unknown[]) {
    captureLog('log', args);
    originalConsole.log(...args);
  };

  // console.warn 오버라이드
  console.warn = function (...args: unknown[]) {
    captureLog('warn', args);
    originalConsole.warn(...args);
  };

  // console.error 오버라이드
  console.error = function (...args: unknown[]) {
    captureLog('error', args);
    originalConsole.error(...args);
  };

  // console.info 오버라이드
  console.info = function (...args: unknown[]) {
    captureLog('info', args);
    originalConsole.info(...args);
  };

  // console.debug 오버라이드
  console.debug = function (...args: unknown[]) {
    captureLog('debug', args);
    originalConsole.debug(...args);
  };

  // console.time 오버라이드
  console.time = function (label: string = 'default') {
    timers.set(label, performance.now());
    originalConsole.time(label);
  };

  // console.timeEnd 오버라이드
  console.timeEnd = function (label: string = 'default') {
    const startTime = timers.get(label);

    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      timers.delete(label);
      capturePerformanceLog(label, duration);
    }

    originalConsole.timeEnd(label);
  };
}

/**
 * 콘솔 인터셉터 복원
 */
export function restoreConsole(): void {
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
function captureLog(level: LogLevel, args: unknown[]): void {
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
function capturePerformanceLog(label: string, duration: number): void {
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
