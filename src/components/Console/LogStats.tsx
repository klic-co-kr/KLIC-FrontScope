/**
 * LogStats Component
 *
 * 콘솔 통계 컴포넌트
 */

import React from 'react';
import { ConsoleStats } from '../../types/console';
import { LOG_LEVEL_LABELS, LOG_LEVEL_COLORS } from '../../constants/console';
import { AlertTriangle, Clock } from 'lucide-react';

interface LogStatsProps {
  stats: ConsoleStats;
}

export function LogStats({ stats }: LogStatsProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  return (
    <div className="log-stats p-4 space-y-4">
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">
            {formatNumber(stats.totalLogs)}
          </div>
          <div className="text-xs text-blue-600">전체 로그</div>
        </div>

        <div className="stat-card bg-gray-100 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-700">
            {stats.averageLogsPerMinute.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">분당 평균</div>
        </div>
      </div>

      {/* 레벨별 통계 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">레벨별 통계</h3>
        <div className="space-y-2">
          {(Object.keys(stats.byLevel) as Array<keyof typeof stats.byLevel>).map(
            (level) => (
              <div
                key={level}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
              >
                <span
                  className="w-8 h-8 flex items-center justify-center rounded text-white text-xs font-bold"
                  style={{ backgroundColor: LOG_LEVEL_COLORS[level] }}
                >
                  {stats.byLevel[level]}
                </span>
                <span className="flex-1 text-sm text-gray-700">
                  {LOG_LEVEL_LABELS[level]}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* 상위 에러 */}
      {stats.topErrors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            상위 에러
          </h3>
          <div className="space-y-2">
            {stats.topErrors.map((error, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-red-800">
                    {error.count}회
                  </span>
                  <span className="text-xs text-red-600">
                    {formatTime(error.lastSeen)}
                  </span>
                </div>
                <p className="text-sm text-red-900 font-mono truncate">
                  {error.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시간 정보 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-500" />
          시간 정보
        </h3>
        <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">첫 번째 로그:</span>
            <span className="text-gray-900 font-mono text-xs">
              {stats.firstLogTime ? formatTime(stats.firstLogTime) : '-'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">마지막 로그:</span>
            <span className="text-gray-900 font-mono text-xs">
              {stats.lastLogTime ? formatTime(stats.lastLogTime) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogStats;
