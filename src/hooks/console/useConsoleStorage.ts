/**
 * Console Storage Hook
 *
 * 콘솔 로그 Storage 관리
 */

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
   * 로그 로드
   */
  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_LOGS);
      const history: ConsoleHistory = (result[STORAGE_KEYS.CONSOLE_LOGS] as ConsoleHistory) || {
        logs: [],
        maxSize: STORAGE_LIMITS.CONSOLE_MAX_LOGS,
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
   * 초기 로드
   */
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local') return;
      if (!changes[STORAGE_KEYS.CONSOLE_LOGS]) return;

      const next = changes[STORAGE_KEYS.CONSOLE_LOGS].newValue as ConsoleHistory | undefined;
      if (!next) {
        setLogs([]);
        setTotalLogs(0);
        setLastLogTime(0);
        return;
      }

      setLogs(next.logs ?? []);
      setTotalLogs(next.totalLogs ?? 0);
      setLastLogTime(next.lastLogTime ?? 0);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  /**
   * 로그 추가
   */
  const addLog = useCallback(async (log: ConsoleLog) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_LOGS);
      const history: ConsoleHistory = (result[STORAGE_KEYS.CONSOLE_LOGS] as ConsoleHistory) || {
        logs: [],
        maxSize: STORAGE_LIMITS.CONSOLE_MAX_LOGS,
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
        [STORAGE_KEYS.CONSOLE_LOGS]: history,
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
        maxSize: STORAGE_LIMITS.CONSOLE_MAX_LOGS,
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
        [STORAGE_KEYS.CONSOLE_LOGS]: history,
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
      const result = await chrome.storage.local.get(STORAGE_KEYS.CONSOLE_LOGS);
      const history: ConsoleHistory = result[STORAGE_KEYS.CONSOLE_LOGS] as ConsoleHistory;

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
        [STORAGE_KEYS.CONSOLE_LOGS]: history,
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
