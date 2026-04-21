/**
 * LogFilter Component
 *
 * 로그 필터 컴포넌트
 */

import React from 'react';
import { X, Filter } from 'lucide-react';
import { ConsoleFilter, LogLevel } from '../../types/console';
import { LOG_LEVEL_LABELS, LOG_LEVEL_ICONS, LOG_LEVEL_COLORS } from '../../constants/console';

interface LogFilterProps {
  filter: ConsoleFilter;
  onToggleLevel: (level: LogLevel) => void;
  onReset: () => void;
}

export function LogFilter({ filter, onToggleLevel, onReset }: LogFilterProps) {
  const levels: LogLevel[] = ['error', 'warn', 'info', 'log', 'debug'];

  const allSelected = filter.levels.length === levels.length;
  const someSelected = filter.levels.length > 0 && !allSelected;

  const handleToggleAll = () => {
    if (allSelected || someSelected) {
      // Deselect all
      for (const level of levels) {
        if (filter.levels.includes(level)) {
          onToggleLevel(level);
        }
      }
    } else {
      // Select all
      for (const level of levels) {
        if (!filter.levels.includes(level)) {
          onToggleLevel(level);
        }
      }
    }
  };

  return (
    <div className="log-filter">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">로그 레벨 필터</span>
        </div>
        <button
          onClick={handleToggleAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {allSelected ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {levels.map((level) => {
          const isSelected = filter.levels.includes(level);
          return (
            <button
              key={level}
              onClick={() => onToggleLevel(level)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                isSelected
                  ? 'ring-2 ring-offset-1'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: LOG_LEVEL_COLORS[level],
                      color: 'white',
                      outline: `2px solid ${LOG_LEVEL_COLORS[level]}`,
                      outlineOffset: '2px',
                    }
                  : undefined
              }
            >
              <span className="mr-1">{LOG_LEVEL_ICONS[level]}</span>
              {LOG_LEVEL_LABELS[level]}
            </button>
          );
        })}
      </div>

      {someSelected && (
        <button
          onClick={onReset}
          className="mt-2 flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-3 h-3" />
          필터 초기화
        </button>
      )}
    </div>
  );
}

export default LogFilter;
