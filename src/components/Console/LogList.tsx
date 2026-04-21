/**
 * LogList Component
 *
 * 로그 리스트 컴포넌트
 */

import React from 'react';
import { ConsoleLog } from '../../types/console';
import { LogEntry } from './LogEntry';

interface LogListProps {
  logs: ConsoleLog[];
  emptyMessage?: string;
}

export function LogList({ logs, emptyMessage = '표시할 로그가 없습니다.' }: LogListProps) {
  if (logs.length === 0) {
    return (
      <div className="log-list-empty flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="log-list divide-y divide-gray-100">
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
}

export default LogList;
