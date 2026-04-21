# Phase 3: 로그 관리

**태스크**: 4개
**예상 시간**: 2시간
**의존성**: Phase 1, Phase 2 완료

---

### Task #8.11: 로그 Storage 훅

- **파일**: `src/hooks/console/useConsoleStorage.ts`
- **시간**: 45분
- **의존성**: Task #8.1, #8.2
- **상세 내용**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { ConsoleLog, ConsoleHistory } from '../../types/console';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';

/**
 * 콘솔 로그 Storage 훅
 */
export function useConsoleStorage() {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [lastLogTime, setLastLogTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadLogs();
  }, []);

  /**
   * 로그 로드
   */
  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_HISTORY);
      const history: ConsoleHistory = result[STORAGE_KEYS.CONSOLE_HISTORY] || {
        logs: [],
        maxSize: STORAGE_LIMITS.CONSOLE_MAX_HISTORY,
        totalLogs: 0,
        lastLogTime: 0,
        counts: {
          log: 0,
          warn: 0,
          error: 0,
          info: 0,
          debug: 0,
        },
      };

      setLogs(history.logs);
      setTotalLogs(history.totalLogs);
      setLastLogTime(history.lastLogTime);
    } catch (error) {
      console.error('Failed to load console logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 로그 추가
   */
  const addLog = useCallback(async (log: ConsoleLog) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_HISTORY);
      const history: ConsoleHistory = result[STORAGE_KEYS.CONSOLE_HISTORY] || {
        logs: [],
        maxSize: STORAGE_LIMITS.CONSOLE_MAX_HISTORY,
        totalLogs: 0,
        lastLogTime: 0,
        counts: {
          log: 0,
          warn: 0,
          error: 0,
          info: 0,
          debug: 0,
        },
      };

      // 로그 추가
      history.logs.unshift(log);

      // 최대 크기 제한
      if (history.logs.length > history.maxSize) {
        history.logs = history.logs.slice(0, history.maxSize);
      }

      // 통계 업데이트
      history.totalLogs++;
      history.lastLogTime = log.timestamp;
      history.counts[log.level]++;

      await chrome.storage.local.set({
        [STORAGE_KEYS.CONSOLE_HISTORY]: history,
      });

      setLogs(history.logs);
      setTotalLogs(history.totalLogs);
      setLastLogTime(history.lastLogTime);
    } catch (error) {
      console.error('Failed to add console log:', error);
    }
  }, []);

  /**
   * 로그 지우기
   */
  const clearLogs = useCallback(async () => {
    try {
      const history: ConsoleHistory = {
        logs: [],
        maxSize: STORAGE_LIMITS.CONSOLE_MAX_HISTORY,
        totalLogs: 0,
        lastLogTime: 0,
        counts: {
          log: 0,
          warn: 0,
          error: 0,
          info: 0,
          debug: 0,
        },
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.CONSOLE_HISTORY]: history,
      });

      setLogs([]);
      setTotalLogs(0);
      setLastLogTime(0);
    } catch (error) {
      console.error('Failed to clear console logs:', error);
    }
  }, []);

  /**
   * 로그 삭제
   */
  const removeLog = useCallback(async (logId: string) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_HISTORY);
      const history: ConsoleHistory = result[STORAGE_KEYS.CONSOLE_HISTORY];

      if (!history) {
        return;
      }

      const removedLog = history.logs.find((log) => log.id === logId);

      if (!removedLog) {
        return;
      }

      history.logs = history.logs.filter((log) => log.id !== logId);
      history.counts[removedLog.level]--;

      await chrome.storage.local.set({
        [STORAGE_KEYS.CONSOLE_HISTORY]: history,
      });

      setLogs(history.logs);
    } catch (error) {
      console.error('Failed to remove console log:', error);
    }
  }, []);

  return {
    logs,
    totalLogs,
    lastLogTime,
    isLoading,
    addLog,
    clearLogs,
    removeLog,
    reload: loadLogs,
  };
}
```
- **완료 조건**: CRUD 동작 정상

---

### Task #8.12: 로그 필터 훅

- **파일**: `src/hooks/console/useConsoleFilter.ts`
- **시간**: 30분
- **의존성**: Task #8.1, #8.9
- **상세 내용**:
```typescript
import { useState, useMemo } from 'react';
import { ConsoleLog, ConsoleFilter, LogLevel } from '../../types/console';
import { filterLogs, sortLogs } from '../../utils/console/filtering';

/**
 * 콘솔 로그 필터 훅
 */
export function useConsoleFilter(logs: ConsoleLog[]) {
  const [filter, setFilter] = useState<ConsoleFilter>({
    levels: ['log', 'warn', 'error', 'info', 'debug'],
  });

  const [sortBy, setSortBy] = useState<'timestamp' | 'level'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /**
   * 필터링 및 정렬된 로그
   */
  const filteredLogs = useMemo(() => {
    let result = filterLogs(logs, filter);
    result = sortLogs(result, sortBy, sortOrder);
    return result;
  }, [logs, filter, sortBy, sortOrder]);

  /**
   * 레벨 토글
   */
  const toggleLevel = (level: LogLevel) => {
    setFilter((prev) => {
      const levels = prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level];

      return {
        ...prev,
        levels,
      };
    });
  };

  /**
   * 검색 설정
   */
  const setSearch = (search: string) => {
    setFilter((prev) => ({
      ...prev,
      search: search || undefined,
    }));
  };

  /**
   * 날짜 범위 설정
   */
  const setDateRange = (start: number, end: number) => {
    setFilter((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  };

  /**
   * 필터 초기화
   */
  const resetFilter = () => {
    setFilter({
      levels: ['log', 'warn', 'error', 'info', 'debug'],
    });
    setSortBy('timestamp');
    setSortOrder('desc');
  };

  return {
    filter,
    filteredLogs,
    sortBy,
    sortOrder,
    toggleLevel,
    setSearch,
    setDateRange,
    setSortBy,
    setSortOrder,
    resetFilter,
  };
}
```
- **완료 조건**: 필터 동작 정상

---

### Task #8.13: 로그 검색 훅

- **파일**: `src/hooks/console/useConsoleSearch.ts`
- **시간**: 20분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { useState, useMemo } from 'react';
import { ConsoleLog } from '../../types/console';

/**
 * 콘솔 로그 검색 훅
 */
export function useConsoleSearch(logs: ConsoleLog[]) {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * 검색 결과
   */
  const searchResults = useMemo(() => {
    if (!searchQuery) {
      return logs;
    }

    const query = searchQuery.toLowerCase();

    return logs.filter((log) => {
      // 메시지 검색
      if (log.message.toLowerCase().includes(query)) {
        return true;
      }

      // 스택 트레이스 검색
      if (log.stackTrace && log.stackTrace.toLowerCase().includes(query)) {
        return true;
      }

      // 소스 파일 검색
      if (log.source && log.source.file.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [logs, searchQuery]);

  /**
   * 하이라이트된 메시지
   */
  const highlightMatch = (text: string): string => {
    if (!searchQuery) {
      return text;
    }

    const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    highlightMatch,
  };
}

/**
 * 정규식 이스케이프
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```
- **완료 조건**: 검색 정상 동작

---

### Task #8.14: 로그 통계 훅

- **파일**: `src/hooks/console/useConsoleStats.ts`
- **시간**: 25분
- **의존성**: Task #8.1
- **상세 내용**:
```typescript
import { useMemo } from 'react';
import { ConsoleLog, ConsoleStats } from '../../types/console';

/**
 * 콘솔 로그 통계 훅
 */
export function useConsoleStats(logs: ConsoleLog[]): ConsoleStats {
  return useMemo(() => {
    const totalLogs = logs.length;

    const byLevel = {
      log: 0,
      warn: 0,
      error: 0,
      info: 0,
      debug: 0,
    };

    const errorMap = new Map<string, { count: number; lastSeen: number }>();

    let firstLogTime = Infinity;
    let lastLogTime = 0;

    for (const log of logs) {
      byLevel[log.level]++;

      if (log.timestamp < firstLogTime) {
        firstLogTime = log.timestamp;
      }

      if (log.timestamp > lastLogTime) {
        lastLogTime = log.timestamp;
      }

      // 에러 집계
      if (log.level === 'error') {
        const existing = errorMap.get(log.message);

        if (existing) {
          existing.count++;
          existing.lastSeen = Math.max(existing.lastSeen, log.timestamp);
        } else {
          errorMap.set(log.message, {
            count: 1,
            lastSeen: log.timestamp,
          });
        }
      }
    }

    // 상위 에러
    const topErrors = Array.from(errorMap.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 분당 평균 로그
    const timeRangeMs = lastLogTime - firstLogTime;
    const timeRangeMinutes = timeRangeMs / 60000;
    const averageLogsPerMinute =
      timeRangeMinutes > 0 ? totalLogs / timeRangeMinutes : 0;

    return {
      totalLogs,
      byLevel,
      topErrors,
      averageLogsPerMinute,
      firstLogTime: firstLogTime === Infinity ? 0 : firstLogTime,
      lastLogTime,
    };
  }, [logs]);
}
```
- **완료 조건**: 통계 정확하게 계산

---

[Phase 4: React 컴포넌트](./TASK-08-PHASE4.md) 로 계속
