/**
 * Storage Cleaner Panel Component
 *
 * 스토리지 청소 관리 패널
 */

import { useState, useMemo } from 'react';
import { StorageType } from '../../types/resourceNetwork';
import { StorageCleanerPanelProps } from './types';
import { formatBytes } from '../../utils/resourceNetwork/helpers';

export function StorageCleanerPanel({ storage }: StorageCleanerPanelProps) {
  const [selectedType, setSelectedType] = useState<StorageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!storage.stats) return [];

    let items: Array<{ type: StorageType; key: string; value: string; size: number }> = [];

    if (selectedType === 'all' || selectedType === 'localStorage') {
      items = items.concat(
        storage.stats.localStorage.items.map((item) => ({
          type: 'localStorage' as const,
          key: item.key,
          value: item.value,
          size: item.size,
        }))
      );
    }

    if (selectedType === 'all' || selectedType === 'sessionStorage') {
      items = items.concat(
        storage.stats.sessionStorage.items.map((item) => ({
          type: 'sessionStorage' as const,
          key: item.key,
          value: item.value,
          size: item.size,
        }))
      );
    }

    if (selectedType === 'all' || selectedType === 'cookies') {
      items = items.concat(
        storage.stats.cookies.items.map((item) => ({
          type: 'cookies' as const,
          key: item.name,
          value: item.value,
          size: item.size,
        }))
      );
    }

    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items.sort((a, b) => b.size - a.size);
  }, [storage.stats, selectedType, searchQuery]);

  const totalSize = filteredItems.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="storage-cleaner-panel p-4 space-y-6">
      {storage.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {storage.error}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Active tab page storage is scanned via content script (LocalStorage / SessionStorage).
      </div>

      {/* Storage Summary */}
      <div className="panel-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">스토리지 현황</h3>
          <button
            onClick={() => storage.scanStorage()}
            disabled={storage.isLoading}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            🔄 다시 스캔
          </button>
        </div>

        {storage.stats && (
          <div className="storage-summary grid grid-cols-3 gap-3">
            <div className="summary-card bg-card rounded-lg p-3 text-center">
              <div className="card-label text-xs text-muted-foreground mb-1">LocalStorage</div>
              <div className="card-value text-lg font-semibold text-foreground">
                {storage.stats.localStorage.count}개
              </div>
              <div className="card-size text-xs text-muted-foreground">
                {formatBytes(storage.stats.localStorage.totalSize)}
              </div>
            </div>
            <div className="summary-card bg-card rounded-lg p-3 text-center">
              <div className="card-label text-xs text-muted-foreground mb-1">SessionStorage</div>
              <div className="card-value text-lg font-semibold text-foreground">
                {storage.stats.sessionStorage.count}개
              </div>
              <div className="card-size text-xs text-muted-foreground">
                {formatBytes(storage.stats.sessionStorage.totalSize)}
              </div>
            </div>
            <div className="summary-card bg-card rounded-lg p-3 text-center">
              <div className="card-label text-xs text-muted-foreground mb-1">Cookies</div>
              <div className="card-value text-lg font-semibold text-foreground">
                {storage.stats.cookies.count}개
              </div>
              <div className="card-size text-xs text-muted-foreground">
                {formatBytes(storage.stats.cookies.totalSize)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">빠른 정리</h3>
        <div className="quick-actions flex flex-wrap gap-2">
          <button
            onClick={() => storage.clearStorage('localStorage')}
            className="px-3 py-2 text-sm bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 rounded transition-colors"
          >
            LocalStorage 비우기
          </button>
          <button
            onClick={() => storage.clearStorage('sessionStorage')}
            className="px-3 py-2 text-sm bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-950/50 rounded transition-colors"
          >
            SessionStorage 비우기
          </button>
          <button
            onClick={() => storage.clearStorage('cookies')}
            className="px-3 py-2 text-sm bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-950/50 rounded transition-colors"
          >
            쿠키 모두 삭제
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel-section">
        <div className="flex gap-3 mb-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as StorageType | 'all')}
            className="bg-muted text-foreground text-sm rounded px-3 py-2 border border-border"
          >
            <option value="all">전체</option>
            <option value="localStorage">LocalStorage</option>
            <option value="sessionStorage">SessionStorage</option>
            <option value="cookies">Cookies</option>
          </select>
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted text-foreground text-sm rounded px-3 py-2 flex-1 border border-border placeholder:text-muted-foreground"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredItems.length}개 항목 · {formatBytes(totalSize)}
        </div>
      </div>

      {/* Items List */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">항목 목록</h3>
        <div className="items-list space-y-2 max-h-64 overflow-y-auto">
          {filteredItems.slice(0, 50).map((item, idx) => (
            <div
              key={`${item.type}-${idx}`}
              className="item-row bg-card rounded p-3 flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.type === 'localStorage' ? '💾' : item.type === 'sessionStorage' ? '⏱️' : '🍪'}</span>
                  <span className="font-mono text-sm text-foreground truncate" title={item.key}>
                    {item.key}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate" title={item.value}>
                  {item.value}
                </div>
              </div>
              <div className="text-xs text-muted-foreground ml-3">
                {formatBytes(item.size)}
              </div>
            </div>
          ))}
          {filteredItems.length > 50 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              그 외 {filteredItems.length - 50}개 항목...
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="panel-section">
        <button
          onClick={() => storage.exportData()}
          className="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors border border-border"
        >
          📤 내보내기
        </button>
      </div>
    </div>
  );
}
