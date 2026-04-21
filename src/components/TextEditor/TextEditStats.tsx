/**
 * Text Edit Stats Component
 *
 * 텍스트 편집 통계를 표시하는 컴포넌트
 */

import type { TextEditStats as Stats } from '../../types/textEdit';

interface TextEditStatsProps {
  stats: Stats;
}

export function TextEditStatsDisplay({ stats }: TextEditStatsProps) {
  return (
    <div className="text-edit-stats">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 총 편집 횟수 */}
        <div className="stat-item">
          <div className="text-xs text-gray-500 dark:text-gray-400">총 편집</div>
          <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            {stats.totalEdits}
          </div>
        </div>

        {/* 변경된 글자 수 */}
        <div className="stat-item">
          <div className="text-xs text-gray-500 dark:text-gray-400">변경된 글자</div>
          <div className="text-xl font-semibold">
            <span className="text-green-600 dark:text-green-400">
              +{stats.totalCharsAdded}
            </span>
            {' '}
            <span className="text-red-600 dark:text-red-400">
              -{stats.totalCharsRemoved}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            총 {stats.totalCharsChanged}자
          </div>
        </div>

        {/* 편집된 요소 수 */}
        <div className="stat-item">
          <div className="text-xs text-gray-500 dark:text-gray-400">편집된 요소</div>
          <div className="text-xl font-semibold text-purple-600 dark:text-purple-400">
            {stats.editedElements}
          </div>
        </div>

        {/* 평균 편집 시간 */}
        <div className="stat-item">
          <div className="text-xs text-gray-500 dark:text-gray-400">평균 시간</div>
          <div className="text-xl font-semibold text-orange-600 dark:text-orange-400">
            {stats.averageEditDuration > 0
              ? `${Math.round(stats.averageEditDuration / 1000)}초`
              : '-'}
          </div>
        </div>
      </div>

      {/* 마지막 편집 시간 */}
      {stats.lastEditTime > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          마지막 편집: {new Date(stats.lastEditTime).toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  );
}
