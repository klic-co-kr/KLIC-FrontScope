/**
 * Scan Results Component
 *
 * Tailwind 스캔 결과 표시
 */

import React, { useState } from 'react';
import { Clock, Trash2, ChevronRight, ChevronDown, Download } from 'lucide-react';
import type { TailwindScanResult, ScanHistoryItem } from '../../types/tailwindScanner';
import { formatDistanceToNow } from '../../utils/dateFormat';

interface ScanResultsProps {
  scan: TailwindScanResult | null;
  isScanning: boolean;
  error: string | null;
  history: ScanHistoryItem[];
  maxHistory: number;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onExport: () => void;
}

export function ScanResults({
  scan,
  isScanning,
  error,
  history,
  maxHistory,
  onDeleteHistoryItem,
  onClearHistory,
  onExport,
}: ScanResultsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          페이지 스캔 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-16 h-16 text-red-500" />
        <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          스캔을 시작하려면 상단의 스캔 버튼을 클릭하세요
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Current Scan Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          현재 페이지 스캔 결과
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">감지됨</p>
            <p className={`text-lg font-semibold ${
              scan.isTailwindDetected
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {scan.isTailwindDetected ? '예' : '아니오'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">버전</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {scan.version}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">JIT 모드</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {scan.isJITMode ? '예' : '아니오'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">클래스 수</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {scan.totalClasses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">카테고리별</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scan.classesByCategory)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <span
                  key={category}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                >
                  {category}: {count}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Classes by Category */}
      {scan.classes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            발견된 클래스 ({scan.classes.length}개)
          </h3>

          <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex flex-wrap gap-2">
              {scan.classes.slice(0, 100).map((cls, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs font-mono rounded ${
                    cls.isArbitrary
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      : cls.isCustom
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}
                  title={`카테고리: ${cls.category}\n사용: ${cls.usageCount || 1}회`}
                >
                  {cls.full}
                </span>
              ))}
              {scan.classes.length > 100 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  외 {scan.classes.length - 100}개...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arbitrary Values */}
      {scan.arbitraryValues.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            임의 값 ({scan.arbitraryValues.length}개)
          </h3>

          <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2">속성</th>
                  <th className="pb-2">값</th>
                  <th className="pb-2">클래스</th>
                </tr>
              </thead>
              <tbody>
                {scan.arbitraryValues.slice(0, 20).map((value, index) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-1.5 font-mono text-purple-600 dark:text-purple-400">
                      {value.property}
                    </td>
                    <td className="py-1.5 font-mono">{value.value}</td>
                    <td className="py-1.5 font-mono text-gray-600 dark:text-gray-400">
                      {value.class}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scan.arbitraryValues.length > 20 && (
              <p className="mt-2 text-xs text-gray-500">
                외 {scan.arbitraryValues.length - 20}개...
              </p>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              스캔 히스토리 ({history.length}/{maxHistory})
            </h3>

            <div className="flex gap-2">
              <button
                onClick={onExport}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="내보내기"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearHistory}
                className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                title="히스토리 지우기"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {expandedItems.has(item.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.timestamp))}
                      </div>

                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {item.totalClasses.toLocaleString()}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </button>

                {expandedItems.has(item.id) && (
                  <div className="mt-3 pl-7 text-xs text-gray-600 dark:text-gray-400">
                    <p>버전: {item.result.version}</p>
                    <p>JIT: {item.result.isJITMode ? '예' : '아니오'}</p>
                    <p>카테고리: {Object.keys(item.result.classesByCategory).join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanResults;
