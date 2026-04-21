/**
 * Edit History List Component
 *
 * 편집 히스토리 목록을 표시하는 컴포넌트
 */

import { useState, useMemo } from 'react';
import type { TextEdit } from '../../types/textEdit';
import { EditHistoryItem } from './EditHistoryItem';

interface EditHistoryListProps {
  edits: TextEdit[];
  onUndo: (editId: string) => Promise<boolean>;
}

// Helper function to get current time (outside render)
function getCurrentTime(): number {
  return Date.now();
}

export function EditHistoryList({ edits, onUndo }: EditHistoryListProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  // Time constants
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;

  // 필터링 - For time-based filters, compute time when filter/edits change
  const filteredEdits = useMemo(() => {
    if (filter === 'all') return edits;

    // Call function outside of render context
    const now = getCurrentTime();
    return edits.filter(edit => {
      if (filter === 'today') {
        return now - edit.timestamp < day;
      }
      if (filter === 'week') {
        return now - edit.timestamp < week;
      }
      return true;
    });
  }, [edits, filter, day, week]);

  return (
    <div className="edit-history-list">
      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            filter === 'today'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          오늘
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            filter === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          이번 주
        </button>
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {filteredEdits.map(edit => (
          <EditHistoryItem
            key={edit.id}
            edit={edit}
            onUndo={onUndo}
          />
        ))}
      </div>

      {filteredEdits.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          필터링된 편집 기록이 없습니다
        </div>
      )}
    </div>
  );
}
