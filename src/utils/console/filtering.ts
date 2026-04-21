/**
 * Log Filtering Utilities
 *
 * 로그 필터링 및 정렬
 */

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
