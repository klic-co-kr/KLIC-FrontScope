/**
 * Text Editor Panel Component
 *
 * 텍스트 편집 도구의 메인 패널 컴포넌트
 */

import { useState, useMemo } from 'react';
import type { TextEditStats } from '../../types/textEdit';
import { useTextEditHistory } from '../../hooks/textEdit/useTextEditHistory';
import { EditHistoryList } from './EditHistoryList';
import { TextEditStatsDisplay } from './TextEditStats';
import { SettingsPanel } from './SettingsPanel';

interface TextEditorPanelProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

export function TextEditorPanel({
  isActive,
  onActivate,
  onDeactivate,
}: TextEditorPanelProps) {
  const {
    edits,
    undoEdit,
    undoAll,
  } = useTextEditHistory();

  const [showSettings, setShowSettings] = useState(false);

  // 통계 계산
  const stats = useMemo<TextEditStats>(() => {
    if (edits.length === 0) {
      return {
        totalEdits: 0,
        totalCharsAdded: 0,
        totalCharsRemoved: 0,
        totalCharsChanged: 0,
        totalWordsChanged: 0,
        editedElements: 0,
        averageEditDuration: 0,
        lastEditTime: 0,
      };
    }

    const totalCharsAdded = edits.reduce(
      (sum, edit) =>
        sum + Math.max(0, edit.changes.charDiff),
      0
    );
    const totalCharsRemoved = edits.reduce(
      (sum, edit) =>
        sum + Math.max(0, -edit.changes.charDiff),
      0
    );

    const uniqueElements = new Set(
      edits.map(e => e.element.selector)
    ).size;

    return {
      totalEdits: edits.length,
      totalCharsAdded,
      totalCharsRemoved,
      totalCharsChanged: totalCharsAdded + totalCharsRemoved,
      totalWordsChanged: edits.reduce(
        (sum, e) =>
          sum +
          (e.metadata?.wordCount.after || 0) -
          (e.metadata?.wordCount.before || 0),
        0
      ),
      editedElements: uniqueElements,
      averageEditDuration:
        edits.reduce(
          (sum, e) => sum + (e.metadata?.editDuration || 0),
          0
        ) / edits.length,
      lastEditTime: edits[0]?.timestamp || 0,
    };
  }, [edits]);

  // 도구 활성화/비활성화
  const handleToggle = () => {
    if (isActive) {
      onDeactivate();
    } else {
      onActivate();
    }
  };

  // 모두 되돌리기
  const handleUndoAll = async () => {
    const count = await undoAll();
    if (count > 0) {
      console.log(`${count}개의 편집을 되돌렸습니다.`);
    }
  };

  return (
    <div className="text-editor-panel flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">📝 텍스트 편집</span>
          <span className={`px-2 py-1 rounded text-xs ${
            isActive
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {isActive ? '활성화됨' : '비활성'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            className="px-3 py-1.5 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            {isActive ? '비활성화' : '활성화'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TextEditStatsDisplay stats={stats} />
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}

      {/* 히스토리 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {edits.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>편집 기록이 없습니다</p>
            <p className="text-sm mt-2">
              페이지에서 텍스트를 편집하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">🕐 편집 히스토리 ({edits.length}개)</h3>
              <button
                onClick={handleUndoAll}
                className="px-3 py-1.5 rounded text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={edits.length === 0}
              >
                ⎌ 모두 되돌리기
              </button>
            </div>
            <EditHistoryList
              edits={edits}
              onUndo={undoEdit}
            />
          </>
        )}
      </div>
    </div>
  );
}
