/**
 * Console Constants
 *
 * 콘솔 로그 관련 상수 정의
 */

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
 * 로그 레벨 배경색
 */
export const LOG_LEVEL_BG_COLORS: Record<LogLevel, string> = {
  debug: 'bg-gray-100 text-gray-700',
  log: 'bg-gray-800 text-white',
  info: 'bg-blue-100 text-blue-700',
  warn: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
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

/**
 * 로그 레벨 Lucide 아이콘
 */
export const LOG_LEVEL_LUCIDE_ICONS: Record<LogLevel, string> = {
  debug: 'Bug',
  log: 'FileText',
  info: 'Info',
  warn: 'AlertTriangle',
  error: 'XCircle',
};
