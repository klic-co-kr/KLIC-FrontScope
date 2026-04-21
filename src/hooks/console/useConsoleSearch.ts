/**
 * Console Search Hook
 *
 * 콘솔 로그 검색
 */

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
