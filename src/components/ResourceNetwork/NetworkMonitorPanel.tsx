/**
 * Network Monitor Panel Component
 *
 * 네트워크 모니터링 패널
 */

import React, { useState, useMemo } from 'react';
import { NetworkMonitorPanelProps } from './types';
import { formatBytes, formatDuration, extractDomain } from '../../utils/resourceNetwork/helpers';
import { RESOURCE_TYPE_COLORS } from '../../constants/resourceTypes';

export function NetworkMonitorPanel({ network }: NetworkMonitorPanelProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique domains from requests
  const domains = useMemo(() => {
    const domainSet = new Set<string>();
    network.requests.forEach((req) => domainSet.add(extractDomain(req.url)));
    return Array.from(domainSet).sort();
  }, [network.requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return network.filteredRequests.filter((req) => {
      if (selectedType !== 'all' && req.type !== selectedType) return false;
      if (searchQuery && !req.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [network.filteredRequests, selectedType, searchQuery]);

  return (
    <div className="network-monitor-panel p-4 space-y-6">
      {/* Monitoring Control */}
      <div className="panel-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">네트워크 모니터링</h3>
          <button
            onClick={() =>
              network.isMonitoring ? network.stopMonitoring() : network.startMonitoring()
            }
            className={`px-3 py-1 text-sm rounded transition-colors ${
              network.isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {network.isMonitoring ? '⏹️ 중지' : '▶️ 시작'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">통계</h3>
        <div className="network-stats grid grid-cols-4 gap-2">
          <div className="stat-item bg-card rounded p-2 text-center">
            <div className="text-xs text-muted-foreground mb-1">요청</div>
            <div className="text-lg font-semibold text-foreground">{network.stats.totalRequests}</div>
          </div>
          <div className="stat-item bg-card rounded p-2 text-center">
            <div className="text-xs text-muted-foreground mb-1">크기</div>
            <div className="text-sm font-semibold text-foreground">{formatBytes(network.stats.totalSize)}</div>
          </div>
          <div className="stat-item bg-card rounded p-2 text-center">
            <div className="text-xs text-muted-foreground mb-1">시간</div>
            <div className="text-sm font-semibold text-foreground">{formatDuration(network.stats.totalDuration)}</div>
          </div>
          <div className="stat-item bg-card rounded p-2 text-center">
            <div className="text-xs text-muted-foreground mb-1">캐시</div>
            <div className="text-sm font-semibold text-foreground">{network.stats.cacheHits}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">필터</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-muted text-foreground text-sm rounded px-3 py-2 border border-border"
          >
            <option value="all">전체 타입</option>
            <option value="document">문서</option>
            <option value="stylesheet">스타일시트</option>
            <option value="script">스크립트</option>
            <option value="image">이미지</option>
            <option value="font">폰트</option>
            <option value="xhr">XHR</option>
            <option value="fetch">Fetch</option>
            <option value="other">기타</option>
          </select>
          <select
            value={network.selectedDomain}
            onChange={(e) => network.setSelectedDomain(e.target.value)}
            className="bg-muted text-foreground text-sm rounded px-3 py-2 border border-border"
          >
            <option value="all">전체 도메인</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="URL 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted text-foreground text-sm rounded px-3 py-2 flex-1 border border-border placeholder:text-muted-foreground"
          />
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {filteredRequests.length}개 요청
        </div>
      </div>

      {/* Request List */}
      <div className="panel-section">
        <h3 className="text-sm font-medium text-foreground mb-3">요청 목록</h3>
        <div className="requests-list space-y-2 max-h-64 overflow-y-auto">
          {filteredRequests.slice(0, 50).map((req) => (
            <div
              key={req.id}
              className="request-item bg-card rounded p-3 flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs px-1 rounded"
                    style={{ backgroundColor: RESOURCE_TYPE_COLORS[req.type] }}
                    title={req.type}
                  >
                    {req.type}
                  </span>
                  <span
                    className={`text-xs px-1 rounded ${
                      req.status >= 200 && req.status < 300
                        ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                        : req.status >= 300 && req.status < 400
                        ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                        : req.status >= 400
                        ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate" title={req.method}>
                    {req.method}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate" title={req.url}>
                  {req.url}
                </div>
              </div>
              <div className="text-xs text-muted-foreground ml-3">
                {formatDuration(req.duration)}
              </div>
            </div>
          ))}
          {filteredRequests.length > 50 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              그 외 {filteredRequests.length - 50}개 요청...
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="panel-section">
        <button
          onClick={() => {
            // HAR export functionality
          }}
          className="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded transition-colors border border-border"
        >
          📤 HAR 내보내기
        </button>
      </div>
    </div>
  );
}
