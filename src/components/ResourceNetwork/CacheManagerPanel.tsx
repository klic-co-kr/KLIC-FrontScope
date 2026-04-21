/**
 * Cache Manager Panel Component
 *
 * 캐시 관리 패널
 */

import React, { useState, useMemo } from 'react';
import type { CacheManagerPanelProps } from './types';
import { formatBytes } from '../../utils/resourceNetwork/helpers';

export function CacheManagerPanel({ cache }: CacheManagerPanelProps) {
  const [selectedType] = useState<string>('all');
  const [showExpired, setShowExpired] = useState(cache.settings.showExpired);

  const allEntries = useMemo(() => {
    if (!cache.stats) return [];
    const stats = cache.stats;
    const entries = showExpired
      ? [...stats.entries, ...stats.expiredEntries]
      : stats.entries.filter((e) => !stats.expiredEntries.includes(e));

    const filtered = selectedType !== 'all'
      ? entries.filter((e) => e.type === selectedType)
      : entries;

    return [...filtered].sort((a, b) => b.size - a.size);
  }, [cache.stats, showExpired, selectedType]);

  const suggestions = cache.getOptimizationSuggestions();

  return (
    <div className="cache-manager-panel p-4 space-y-6">
      {/* Cache Status */}
      <div className="panel-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">캐시 현황</h3>
          <button
            onClick={() => cache.refreshCache()}
            disabled={cache.isLoading}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            🔄 새로고침
          </button>
        </div>

        {cache.stats && (
          <div className="cache-summary grid grid-cols-3 gap-3">
            <div className="summary-card bg-card rounded-lg p-3 text-center">
              <div className="card-label text-xs text-muted-foreground mb-1">전체 항목</div>
              <div className="card-value text-lg font-semibold text-foreground">
                {cache.stats.totalEntries}
              </div>
            </div>
            <div className="summary-card bg-card rounded-lg p-3 text-center">
              <div className="card-label text-xs text-muted-foreground mb-1">전체 크기</div>
              <div className="card-value text-lg font-semibold text-foreground">
                {formatBytes(cache.stats.totalSize)}
              </div>
            </div>
            <div className="summary-card bg-card rounded-lg p-3 text-center">
              <div className="card-label text-xs text-muted-foreground mb-1">히트율</div>
              <div
                className={`card-value text-lg font-semibold ${
                  (cache.stats.hitRate ?? 0) >= 0.8
                    ? 'text-green-700 dark:text-green-400'
                    : (cache.stats.hitRate ?? 0) >= 0.5
                    ? 'text-yellow-700 dark:text-yellow-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {Math.round((cache.stats.hitRate ?? 0) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">설정</h3>
        <div className="settings-list space-y-2">
          <label className="flex items-center justify-between text-sm text-foreground">
            <span>만료된 항목 표시</span>
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => {
                setShowExpired(e.target.checked);
                cache.toggleShowExpired();
              }}
              className="w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between text-sm text-foreground">
            <span>자동 정리</span>
            <input
              type="checkbox"
              checked={cache.settings.autoCleanExpired}
              onChange={() => cache.toggleAutoClean()}
              className="w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Cleanup Actions */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">캐시 정리</h3>
        <div className="cleanup-actions flex flex-wrap gap-2">
          <button
            onClick={() => cache.clearExpired()}
            className="px-3 py-2 text-sm bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-950/50 rounded transition-colors"
          >
            만료된 항목 삭제 ({cache.stats?.expiredEntries.length || 0})
          </button>
          <button
            onClick={() => cache.clearAll()}
            className="px-3 py-2 text-sm bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 rounded transition-colors"
          >
            전체 캐시 삭제
          </button>
        </div>
      </div>

      {/* Cache Entries */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">캐시 항목 ({allEntries.length})</h3>
        <div className="cache-entries-list space-y-2 max-h-64 overflow-y-auto">
          {allEntries.slice(0, 50).map((entry, idx) => (
            <div
              key={`${entry.url}-${idx}`}
              className="cache-entry bg-card rounded p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs px-1 rounded"
                    style={{ backgroundColor: getResourceTypeColor(entry.type) }}
                  >
                    {entry.type}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate" title={entry.url}>
                  {entry.url}
                </div>
              </div>
              <div className="text-xs text-muted-foreground ml-3">
                {formatBytes(entry.size)}
              </div>
            </div>
          ))}
          {allEntries.length > 50 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              그 외 {allEntries.length - 50}개 항목...
            </div>
          )}
        </div>
      </div>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <div className="panel-section">
          <h3 className="text-sm font-medium text-foreground mb-3">최적화 제안</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>💡</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export */}
      <div className="panel-section">
        <button
          onClick={() => {
            // Export functionality
          }}
          className="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors border border-border"
        >
          📤 내보내기
        </button>
      </div>
    </div>
  );
}

function getResourceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    document: '#3B82F6',
    stylesheet: '#EC4899',
    script: '#F59E0B',
    image: '#10B981',
    font: '#8B5CF6',
    xhr: '#06B6D4',
    fetch: '#0EA5E9',
    websocket: '#6366F1',
    other: '#6B7280',
  };
  return colors[type] || colors.other;
}
