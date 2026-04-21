/**
 * Edit History Item Component
 *
 * 개별 편집 기록 아이템 컴포넌트
 */

import { useState } from 'react';
import type { TextEdit } from '../../types/textEdit';
import { formatTimeAgo } from '../../utils/dateFormat';

interface EditHistoryItemProps {
  edit: TextEdit;
  onUndo: (editId: string) => Promise<boolean>;
}

export function EditHistoryItem({ edit, onUndo }: EditHistoryItemProps) {
  const [isUndoing, setIsUndoing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      const success = await onUndo(edit.id);
      if (success) {
        console.log('되돌리기 성공');
      }
    } finally {
      setIsUndoing(false);
    }
  };

  const charDiffColor = edit.changes.charDiff > 0 ? 'text-green-600' : 'text-red-600';
  const charDiffSign = edit.changes.charDiff > 0 ? '+' : '';

  return (
    <div className="edit-history-item bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* 요소 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {edit.element.tagName}
            </span>
            {edit.element.id && (
              <span className="text-xs text-gray-500">
                #{edit.element.id}
              </span>
            )}
          </div>

          {/* 변경 텍스트 */}
          <div className="mb-2">
            {isExpanded ? (
              <div className="text-sm space-y-1">
                <div className="text-red-600 dark:text-red-400 line-through opacity-70">
                  {edit.changes.before}
                </div>
                <div className="text-green-600 dark:text-green-400">
                  {edit.changes.after}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <span className="text-red-600 dark:text-red-400 line-through opacity-70 mr-2">
                  {edit.changes.before.substring(0, 50)}
                  {edit.changes.before.length > 50 ? '...' : ''}
                </span>
                <span className="text-gray-500">→</span>
                <span className="text-green-600 dark:text-green-400 ml-2">
                  {edit.changes.after.substring(0, 50)}
                  {edit.changes.after.length > 50 ? '...' : ''}
                </span>
              </div>
            )}

            {edit.changes.before.length > 50 || edit.changes.after.length > 50 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {isExpanded ? '접기' : '더보기'}
              </button>
            )}
          </div>

          {/* 메타데이터 */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>{formatTimeAgo(edit.timestamp)}</span>
            <span className={charDiffColor}>
              {charDiffSign}{edit.changes.charDiff}자
            </span>
            {edit.metadata?.wordCount && (
              <span>
                {edit.metadata.wordCount.before} → {edit.metadata.wordCount.after} 단어
              </span>
            )}
            {edit.metadata?.language && (
              <span className="uppercase">{edit.metadata.language}</span>
            )}
          </div>
        </div>

        {/* 작업 버튼 */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleUndo}
            disabled={isUndoing}
            className="px-3 py-1.5 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isUndoing ? '되돌리는 중...' : '되돌리기'}
          </button>
        </div>
      </div>

      {/* 선택자 (툴팁) */}
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <code className="text-xs text-gray-500 break-all">
          {edit.element.selector}
        </code>
      </div>
    </div>
  );
}
