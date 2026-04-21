/**
 * Console Stats Hook
 *
 * 콘솔 로그 통계
 */

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
