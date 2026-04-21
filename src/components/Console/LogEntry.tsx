/**
 * LogEntry Component
 *
 * 개별 로그 항목 컴포넌트
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { ConsoleLog } from '../../types/console';
import { StackTrace } from './StackTrace';
import { LOG_LEVEL_COLORS, LOG_LEVEL_ICONS } from '../../constants/console';

interface LogEntryProps {
  log: ConsoleLog;
}

export function LogEntry({ log }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasObjectPayload = log.args.some((arg) => arg !== null && typeof arg === 'object');

  const time = new Date(log.timestamp);
  const timeStr = time.toLocaleTimeString('ko-KR', { hour12: false }) +
    '.' +
    String(time.getMilliseconds()).padStart(3, '0');
  const color = LOG_LEVEL_COLORS[log.level];
  const icon = hasObjectPayload ? '📦' : LOG_LEVEL_ICONS[log.level];
  const containerClassName = hasObjectPayload
    ? 'bg-orange-50 border-l-4 border-l-orange-400'
    : log.level === 'error'
      ? 'bg-red-50 border-l-4 border-l-red-500'
      : log.level === 'warn'
        ? 'bg-amber-50 border-l-4 border-l-amber-500'
        : log.level === 'info'
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'bg-white';

  return (
    <div
      className={`log-entry group hover:bg-gray-50 transition-colors ${containerClassName}`}
    >
      <div
        className="entry-header flex items-center gap-2 px-4 py-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 확장 아이콘 */}
        {(log.stackTrace || log.source || log.args.length > 1) && (
          <span className="expand-icon text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}

        {/* 시간 */}
        <span className="log-time text-xs text-gray-500 font-mono min-w-[70px]">
          {timeStr}
        </span>

        {/* 레벨 아이콘 */}
        <span className="log-icon text-sm" style={{ color }}>
          {icon}
        </span>

        {/* 메시지 */}
        <span
          className="log-message text-sm flex-1 font-mono truncate"
          style={{ color }}
          title={log.message}
        >
          {log.message}
        </span>

        {hasObjectPayload && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
            object
          </span>
        )}

        {/* 카운트 */}
        {log.count && log.count > 1 && (
          <span className="log-count px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {log.count}
          </span>
        )}

        {/* 성능 정보 */}
        {log.performance && (
          <span className="log-performance px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
            {log.performance.label}: {log.performance.duration.toFixed(2)}ms
          </span>
        )}
      </div>

      {/* 상세 내용 */}
      {isExpanded && (
        <div className="entry-details px-4 pb-3 bg-gray-50 border-t border-gray-100">
          {/* 원본 인자 */}
          {log.args.length > 0 && (
            <div className="log-args mb-2">
              <label className="text-xs font-medium text-gray-600">Arguments:</label>
              <pre className="mt-1 p-2 bg-white border border-gray-200 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(log.args, null, 2)}
              </pre>
            </div>
          )}

          {/* 소스 위치 */}
          {log.source && (
            <div className="log-source mb-2 flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Source:</label>
              <span className="text-xs text-gray-900 font-mono">
                {log.source.file}:{log.source.line}:{log.source.column}
              </span>
            </div>
          )}

          {/* 메타데이터 */}
          {log.metadata && (
            <div className="log-meta mb-2">
              <label className="text-xs font-medium text-gray-600">Metadata:</label>
              <div className="mt-1 space-y-1">
                {log.metadata.url && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{log.metadata.url}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 스택 트레이스 */}
          {log.stackTrace && <StackTrace stack={log.stackTrace} />}
        </div>
      )}
    </div>
  );
}

export default LogEntry;
