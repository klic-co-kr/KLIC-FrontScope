# Phase 7: React 컴포넌트

**태스크**: 9개
**예상 시간**: 4.5시간
**의존성**: Phase 1-6 완료

---

### Task #12.39: ResourceNetworkPanel 메인 컴포넌트

- **파일**: `src/components/ResourceNetwork/ResourceNetworkPanel.tsx`
- **시간**: 35분
- **의존성**: 이전 Phase들
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { useStorageCleaner } from '../../hooks/resourceNetwork/useStorageCleaner';
import { useAnimationInspector } from '../../hooks/resourceNetwork/useAnimationInspector';
import { useNetworkMonitor } from '../../hooks/resourceNetwork/useNetworkMonitor';
import { useCacheManager } from '../../hooks/resourceNetwork/useCacheManager';
import { StorageCleanerPanel } from './StorageCleanerPanel';
import { AnimationInspectorPanel } from './AnimationInspectorPanel';
import { NetworkMonitorPanel } from './NetworkMonitorPanel';
import { CacheManagerPanel } from './CacheManagerPanel';

type TabType = 'storage' | 'animation' | 'network' | 'cache';

export function ResourceNetworkPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('storage');

  const storage = useStorageCleaner();
  const animation = useAnimationInspector();
  const network = useNetworkMonitor();
  const cache = useCacheManager();

  return (
    <div className="resource-network-panel">
      <div className="panel-header">
        <h2>리소스 & 네트워크</h2>
        <div className="summary-badges">
          <div className="badge">
            📦 스토리지: {storage.stats?.totalSize ? formatBytes(storage.stats.totalSize) : '-'}
          </div>
          <div className="badge">
            🎬 애니메이션: {animation.animations.length}
          </div>
          <div className="badge">
            🌐 요청: {network.stats.totalRequests}
          </div>
          <div className="badge">
            💾 캐시: {cache.stats ? formatBytes(cache.stats.totalSize) : '-'}
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('storage')}
          className={activeTab === 'storage' ? 'active' : ''}
        >
          🗑️ 스토리지
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={activeTab === 'animation' ? 'active' : ''}
        >
          🎬 애니메이션
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={activeTab === 'network' ? 'active' : ''}
        >
          🌐 네트워크
        </button>
        <button
          onClick={() => setActiveTab('cache')}
          className={activeTab === 'cache' ? 'active' : ''}
        >
          💾 캐시
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'storage' && <StorageCleanerPanel storage={storage} />}
        {activeTab === 'animation' && <AnimationInspectorPanel animation={animation} />}
        {activeTab === 'network' && <NetworkMonitorPanel network={network} />}
        {activeTab === 'cache' && <CacheManagerPanel cache={cache} />}
      </div>
    </div>
  );
}
```

---

### Task #12.40: StorageCleanerPanel 컴포넌트

- **파일**: `src/components/ResourceNetwork/StorageCleanerPanel.tsx`
- **시간**: 25분
- **의존성**: Task #12.11
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { StorageType } from '../../types/resourceNetwork';

interface StorageCleanerPanelProps {
  storage: ReturnType<typeof useStorageCleaner>;
}

export function StorageCleanerPanel({ storage }: StorageCleanerPanelProps) {
  const [selectedType, setSelectedType] = useState<StorageType | 'all'>('all');

  return (
    <div className="storage-cleaner-panel">
      <div className="panel-section">
        <h3>스토리지 현황</h3>
        {storage.stats && (
          <div className="storage-summary">
            <div className="summary-card">
              <div className="card-label">LocalStorage</div>
              <div className="card-value">{storage.stats.localStorage.count}개</div>
              <div className="card-size">{formatBytes(storage.stats.localStorage.totalSize)}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">SessionStorage</div>
              <div className="card-value">{storage.stats.sessionStorage.count}개</div>
              <div className="card-size">{formatBytes(storage.stats.sessionStorage.totalSize)}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Cookies</div>
              <div className="card-value">{storage.stats.cookies.count}개</div>
              <div className="card-size">{formatBytes(storage.stats.cookies.totalSize)}</div>
            </div>
          </div>
        )}
        <button onClick={() => storage.scanStorage()}>🔄 다시 스캔</button>
      </div>

      <div className="panel-section">
        <h3>빠른 정리</h3>
        <div className="quick-actions">
          <button onClick={() => storage.clearStorage('localStorage')}>
            LocalStorage 비우기
          </button>
          <button onClick={() => storage.clearStorage('sessionStorage')}>
            SessionStorage 비우기
          </button>
          <button onClick={() => storage.clearStorage('cookies')}>
            쿠키 모두 삭제
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>항목 목록</h3>
        {/* 스토리지 항목 리스트 */}
      </div>
    </div>
  );
}
```

---

### Task #12.41: AnimationInspectorPanel 컴포넌트

- **파일**: `src/components/ResourceNetwork/AnimationInspectorPanel.tsx`
- **시간**: 25분
- **의존성**: Task #12.17
- **상세 내용**:
```typescript
import React from 'react';

interface AnimationInspectorPanelProps {
  animation: ReturnType<typeof useAnimationInspector>;
}

export function AnimationInspectorPanel({ animation }: AnimationInspectorPanelProps) {
  return (
    <div className="animation-inspector-panel">
      <div className="panel-section">
        <h3>애니메이션 스캔</h3>
        <button onClick={() => animation.scanAnimations()}>
          🔍 애니메이션 스캔
        </button>
      </div>

      <div className="panel-section">
        <h3>제어</h3>
        <div className="control-buttons">
          <button
            onClick={() => animation.isPaused ? animation.resumeAll() : animation.pauseAll()}
          >
            {animation.isPaused ? '▶️ 재생' : '⏸️ 일시정지'}
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>성능 영향</h3>
        {animation.performanceReport && (
          <div className="impact-summary">
            <div>높음: {animation.performanceReport.byImpact.high}</div>
            <div>중간: {animation.performanceReport.byImpact.medium}</div>
            <div>낮음: {animation.performanceReport.byImpact.low}</div>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>애니메이션 목록</h3>
        {/* 애니메이션 리스트 */}
      </div>
    </div>
  );
}
```

---

### Task #12.42: NetworkMonitorPanel 컴포넌트

- **파일**: `src/components/ResourceNetwork/NetworkMonitorPanel.tsx`
- **시간**: 30분
- **의존성**: Task #12.23
- **상세 내용**:
```typescript
import React from 'react';

interface NetworkMonitorPanelProps {
  network: ReturnType<typeof useNetworkMonitor>;
}

export function NetworkMonitorPanel({ network }: NetworkMonitorPanelProps) {
  return (
    <div className="network-monitor-panel">
      <div className="panel-section">
        <h3>네트워크 모니터링</h3>
        <button
          onClick={() => network.isMonitoring ? network.stopMonitoring() : network.startMonitoring()}
          className={network.isMonitoring ? 'active' : ''}
        >
          {network.isMonitoring ? '⏹️ 중지' : '▶️ 시작'}
        </button>
      </div>

      <div className="panel-section">
        <h3>통계</h3>
        <div className="network-stats">
          <div>요청: {network.stats.totalRequests}</div>
          <div>크기: {formatBytes(network.stats.totalSize)}</div>
          <div>시간: {formatDuration(network.stats.totalDuration)}</div>
          <div>캐시 적중: {network.stats.cacheHits}</div>
        </div>
      </div>

      <div className="panel-section">
        <h3>필터</h3>
        {/* 타입 필터, 도메인 필터 */}
      </div>

      <div className="panel-section">
        <h3>요청 목록</h3>
        {/* 네트워크 요청 리스트 */}
      </div>
    </div>
  );
}
```

---

### Task #12.43: CacheManagerPanel 컴포넌트

- **파일**: `src/components/ResourceNetwork/CacheManagerPanel.tsx`
- **시간**: 20분
- **의존성**: Task #12.30
- **상세 내용**:
```typescript
import React from 'react';

interface CacheManagerPanelProps {
  cache: ReturnType<typeof useCacheManager>;
}

export function CacheManagerPanel({ cache }: CacheManagerPanelProps) {
  return (
    <div className="cache-manager-panel">
      <div className="panel-section">
        <h3>캐시 현황</h3>
        {cache.stats && (
          <div className="cache-summary">
            <div>항목: {cache.stats.totalEntries}</div>
            <div>크기: {formatBytes(cache.stats.totalSize)}</div>
            <div>히트율: {Math.round(cache.stats.hitRate * 100)}%</div>
          </div>
        )}
        <button onClick={() => cache.refreshCache()}>🔄 새로고침</button>
      </div>

      <div className="panel-section">
        <h3>캐시 정리</h3>
        <div className="cleanup-actions">
          <button onClick={() => cache.clearExpired()}>
            만료된 항목 삭제 ({cache.stats?.expiredEntries.length || 0})
          </button>
          <button onClick={() => cache.clearAll()}>
            전체 캐시 삭제
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>최적화 제안</h3>
        <ul>
          {cache.getOptimizationSuggestions().map((suggestion, i) => (
            <li key={i}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

### Task #12.44~#12.47: (추가 컴포넌트 태스크)

### Task #12.44: 스토리지 항목 리스트 컴포넌트

- **파일**: `src/components/ResourceNetwork/StorageItemList.tsx`
- **시간**: 25분
- **의존성**: Task #12.11

### Task #12.45: 애니메이션 리스트 컴포넌트

- **파일**: `src/components/ResourceNetwork/AnimationList.tsx`
- **시간**: 25분
- **의존성**: Task #12.17

### Task #12.46: 네트워크 요청 리스트 컴포넌트

- **파일**: `src/components/ResourceNetwork/NetworkRequestList.tsx`
- **시간**: 30분
- **의존성**: Task #12.23

### Task #12.47: 캐시 항목 리스트 컴포넌트

- **파일**: `src/components/ResourceNetwork/CacheItemList.tsx`
- **시간**: 20분
- **의존성**: Task #12.30

---

[Phase 8: Content Script 통합](./TASK-12-PHASE8.md) 로 계속
