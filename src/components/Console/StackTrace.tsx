/**
 * StackTrace Component
 *
 * 스택 트레이스 표시 컴포넌트
 */

import React from 'react';
import { parseStackTrace } from '../../utils/console/stackTrace';

interface StackTraceProps {
  stack: string;
}

export function StackTrace({ stack }: StackTraceProps) {
  const frames = parseStackTrace(stack);

  if (frames.length === 0) {
    return (
      <div className="stack-trace">
        <label className="text-xs font-medium text-gray-600">Stack Trace:</label>
        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {stack}
        </pre>
      </div>
    );
  }

  return (
    <div className="stack-trace">
      <label className="text-xs font-medium text-gray-600">Stack Trace:</label>
      <div className="stack-frames mt-1 space-y-1">
        {frames.map((frame, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-xs"
          >
            <span className="text-gray-500">{index}.</span>
            <span className="text-purple-700">
              {frame.functionName || '<anonymous>'}
            </span>
            <span className="text-gray-600">at</span>
            <span className="text-blue-600 truncate" title={frame.file}>
              {frame.file}
            </span>
            <span className="text-gray-500">
              :{frame.line}:{frame.column}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StackTrace;
