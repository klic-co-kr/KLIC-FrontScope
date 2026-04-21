/**
 * Console Filter Hook
 *
 * 콘솔 로그 필터링
 */

import { useState, useMemo } from 'react';
import { ConsoleLog, ConsoleFilter, LogLevel } from '../../types/console';
import { filterLogs, sortLogs } from '../../utils/console/filtering';

/**
 * 콘솔 로그 필터 훅
 */
export function useConsoleFilter(logs: ConsoleLog[]) {
  const [filter, setFilter] = useState<ConsoleFilter>({
    levels: ['warn', 'error', 'info'],
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

  const setLevels = (levels: LogLevel[]) => {
    setFilter((prev) => ({
      ...prev,
      levels,
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
      levels: ['warn', 'error', 'info'],
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
    setLevels,
    setSearch,
    setDateRange,
    setSortBy,
    setSortOrder,
    resetFilter,
  };
}
