# Phase 5: 캐시 분석 및 관리

**태스크**: 6개
**예상 시간**: 2.5시간
**의존성**: Phase 1-4 완료

---

### Task #12.29: 캐시 분석기

- **파일**: `src/utils/resourceNetwork/cache/cacheAnalyzer.ts`
- **시간**: 25분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { CacheEntry, CacheStats, ResourceType } from '../../../types/resourceNetwork';
import { isCacheEntryExpired } from '../helpers';

/**
 * 캐시 항목 추출 (Performance API)
 */
export function extractCacheEntries(): Promise<CacheEntry[]> {
  const entries: CacheEntry[] = [];

  if ('caches' in window) {
    return caches.keys().then(async (cacheNames) => {
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            entries.push({
              url: request.url,
              type: getResourceTypeFromUrl(request.url),
              size: parseInt(response.headers.get('content-length') || '0'),
              lastModified: parseInt(response.headers.get('last-modified') || '0'),
              expires: response.headers.get('expires')
                ? new Date(response.headers.get('expires')!).getTime()
                : undefined,
              etag: response.headers.get('etag') || undefined,
            });
          }
        }
      }
      return entries;
    });
  }

  return Promise.resolve(entries);
}

/**
 * URL에서 리소스 타입 결정
 */
function getResourceTypeFromUrl(url: string): ResourceType {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'stylesheet';
  if (ext === 'js') return 'script';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
  if (['woff', 'woff2', 'ttf'].includes(ext || '')) return 'font';
  return 'other';
}

/**
 * 캐시 통계 생성
 */
export function generateCacheStats(entries: CacheEntry[]): CacheStats {
  const totalEntries = entries.length;
  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  const expiredEntries = entries.filter(isCacheEntryExpired);

  // 캐시 히트율 계산 (Resource Timing API 기반)
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const cacheHits = resources.filter(r => r.transferSize === 0).length;
  const cacheMisses = resources.length - cacheHits;
  const hitRate = resources.length > 0 ? cacheHits / resources.length : 0;

  return {
    totalEntries,
    totalSize,
    hitRate,
    entries,
    expiredEntries,
  };
}

/**
 * 대용량 캐시 항목 식별
 */
export function getLargestCacheEntries(entries: CacheEntry[], count: number = 10): CacheEntry[] {
  return [...entries].sort((a, b) => b.size - a.size).slice(0, count);
}

/**
 * 만료된 캐시 정리
 */
export async function clearExpiredCache(): Promise<number> {
  let cleared = 0;

  if ('caches' in window) {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const expires = response.headers.get('expires');
          if (expires) {
            const expiryDate = new Date(expires);
            if (expiryDate < new Date()) {
              await cache.delete(request);
              cleared++;
            }
          }
        }
      }
    }
  }

  return cleared;
}

/**
 * 전체 캐시 삭제
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }

    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

/**
 * 특정 도메인 캐시 삭제
 */
export async function clearCacheForDomain(domain: string): Promise<number> {
  let cleared = 0;

  if ('caches' in window) {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        if (new URL(request.url).hostname.includes(domain)) {
          await cache.delete(request);
          cleared++;
        }
      }
    }
  }

  return cleared;
}
```

---

### Task #12.30: 캐시 관리 훅

- **파일**: `src/hooks/resourceNetwork/useCacheManager.ts`
- **시간**: 20분
- **의존성**: Task #12.1, #12.2, #12.29
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { CacheStats, CacheEntry } from '../../types/resourceNetwork';
import { generateCacheStats, clearExpiredCache, clearAllCache, clearCacheForDomain, extractCacheEntries } from '../../utils/resourceNetwork/cache/cacheAnalyzer';

export function useCacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 캐시 새로고침
  const refreshCache = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await extractCacheEntries();
      const newStats = generateCacheStats(entries);
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  // 만료된 캐시 정리
  const clearExpired = useCallback(async () => {
    const cleared = await clearExpiredCache();
    await refreshCache();
    return cleared;
  }, [refreshCache]);

  // 전체 캐시 정리
  const clearAll = useCallback(async () => {
    const success = await clearAllCache();
    await refreshCache();
    return success;
  }, [refreshCache]);

  // 대용량 항목 정리
  const clearLargeItems = useCallback(async (threshold: number) => {
    if (!stats) return;

    let cleared = 0;
    for (const entry of stats.entries) {
      if (entry.size > threshold) {
        // TODO: Implement individual cache entry deletion
        cleared++;
      }
    }

    await refreshCache();
    return cleared;
  }, [stats, refreshCache]);

  // 캐시 히트율 개선 제안
  const getOptimizationSuggestions = useCallback((): string[] => {
    if (!stats) return [];

    const suggestions: string[] = [];

    if (stats.hitRate < 0.5) {
      suggestions.push('캐시 히트율이 낮습니다. 캐싱 전략을 재검토하세요');
    }

    if (stats.expiredEntries.length > 10) {
      suggestions.push('만료된 캐시 항목이 많습니다. 자동 정리를 고려하세요');
    }

    const largeEntries = stats.entries.filter(e => e.size > 1024 * 100);
    if (largeEntries.length > 5) {
      suggestions.push('대용량 캐시 항목이 많습니다. 리소스 최적화를 고려하세요');
    }

    return suggestions;
  }, [stats]);

  return {
    stats,
    isLoading,
    refreshCache,
    clearExpired,
    clearAll,
    clearLargeItems,
    getOptimizationSuggestions,
  };
}
```
- **완료 조건**: 캐시 분석 및 관리 동작 검증

---

### Task #12.31~#12.34: (추가 캐시 관련 태스크)

### Task #12.31: 캐시 비교 (전후)

- **파일**: `src/utils/resourceNetwork/cache/cacheComparator.ts`
- **상세 내용**: 캐시 상태 비교 및 변경사항 추적

### Task #12.32: 캐시 예약어드 모드

- **파일**: `src/utils/resourceNetwork/cache/scheduledCacheClean.ts`
- **상세 내용**: 주기적 캐시 정리 스케줄링

### Task #12.33: Service Worker 통합

- **파일**: `src/utils/resourceNetwork/cache/serviceWorkerIntegration.ts`
- **상세 내용**: Service Worker 캐시 관리 연동

### Task #12.34: 캐시 내보내기/가져오기

- **파일**: `src/utils/resourceNetwork/cache/cacheExport.ts`
- **상세 내용**: 캐시 데이터 내보내기/가져오기

---

[Phase 6: Storage 관리](./TASK-12-PHASE6.md) 로 계속
