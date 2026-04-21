/**
 * Cache Analyzer
 *
 * 캐시 분석 및 관리 기능 제공
 */

import { CacheEntry, CacheStats, ResourceType } from '../../../types/resourceNetwork';
import { isCacheEntryExpired } from '../helpers';
import { guessResourceTypeFromUrl } from '../helpers';

/**
 * 캐시 항목 추출 (Cache API)
 */
export async function extractCacheEntries(): Promise<CacheEntry[]> {
  const entries: CacheEntry[] = [];

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const contentLength = response.headers.get('content-length');
              const lastModified = response.headers.get('last-modified');
              const expires = response.headers.get('expires');
              const etag = response.headers.get('etag');

              entries.push({
                url: request.url,
                type: guessResourceTypeFromUrl(request.url),
                size: contentLength ? parseInt(contentLength) : 0,
                lastModified: lastModified
                  ? new Date(lastModified).getTime()
                  : Date.now(),
                expires: expires ? new Date(expires).getTime() : undefined,
                etag: etag || undefined,
              });
            }
          } catch {
            // 개별 항목 읽기 실패 시 무시
            continue;
          }
        }
      }
    } catch (e) {
      console.error('Failed to extract cache entries:', e);
    }
  }

  return entries;
}

/**
 * 캐시 통계 생성
 */
export function generateCacheStats(entries: CacheEntry[]): CacheStats {
  const totalEntries = entries.length;
  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  const expiredEntries = entries.filter(isCacheEntryExpired);

  // 캐시 히트율 계산 (Resource Timing API 기반)
  let hitRate = 0;
  if ('performance' in window) {
    try {
      const resources = performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      const cacheHits = resources.filter((r) => r.transferSize === 0).length;
      hitRate = resources.length > 0 ? cacheHits / resources.length : 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      // Performance API 실패 시 무시
    }
  }

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
export function getLargestCacheEntries(
  entries: CacheEntry[],
  count: number = 10
): CacheEntry[] {
  return [...entries].sort((a, b) => b.size - a.size).slice(0, count);
}

/**
 * 만료된 캐시 정리
 */
export async function clearExpiredCache(): Promise<number> {
  let cleared = 0;

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          try {
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e) {
            continue;
          }
        }
      }
    } catch (e) {
      console.error('Failed to clear expired cache:', e);
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
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // Service Worker에 캐시 정리 요청
    if (
      'serviceWorker' in navigator &&
      navigator.serviceWorker.controller
    ) {
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
    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          try {
            const url = new URL(request.url);
            if (url.hostname.includes(domain)) {
              await cache.delete(request);
              cleared++;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e) {
            continue;
          }
        }
      }
    } catch (e) {
      console.error('Failed to clear cache for domain:', e);
    }
  }

  return cleared;
}

/**
 * 특정 URL 패턴의 캐시 삭제
 */
export async function clearCacheByPattern(pattern: RegExp): Promise<number> {
  let cleared = 0;

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (pattern.test(request.url)) {
            await cache.delete(request);
            cleared++;
          }
        }
      }
    } catch (e) {
      console.error('Failed to clear cache by pattern:', e);
    }
  }

  return cleared;
}

/**
 * 캐시 이름 목록 가져오기
 */
export async function getCacheNames(): Promise<string[]> {
  if ('caches' in window) {
    return await caches.keys();
  }
  return [];
}

/**
 * 특정 캐시의 항목 수 가져오기
 */
export async function getCacheEntryCount(cacheName: string): Promise<number> {
  if ('caches' in window) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      return keys.length;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return 0;
    }
  }
  return 0;
}

/**
 * 캐시 용량 추정
 */
export async function estimateCacheSize(): Promise<number> {
  const entries = await extractCacheEntries();
  return entries.reduce((sum, entry) => sum + entry.size, 0);
}

/**
 * 타입별 캐시 통계
 */
export async function getCacheStatsByType(): Promise<
  Record<ResourceType, { count: number; totalSize: number }>
> {
  const entries = await extractCacheEntries();
  const stats: Partial<Record<ResourceType, { count: number; totalSize: number }>> = {};

  for (const entry of entries) {
    if (!stats[entry.type]) {
      stats[entry.type] = { count: 0, totalSize: 0 };
    }
    stats[entry.type]!.count++;
    stats[entry.type]!.totalSize += entry.size;
  }

  return stats as Record<ResourceType, { count: number; totalSize: number }>;
}

/**
 * 중복 캐시 항목 찾기 (같은 URL이 여러 캐시에 있는 경우)
 */
export async function findDuplicateCacheEntries(): Promise<
  Record<string, string[]>
> {
  const duplicates: Record<string, string[]> = {};

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const urlToCacheNames: Record<string, string[]> = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        if (!urlToCacheNames[request.url]) {
          urlToCacheNames[request.url] = [];
        }
        urlToCacheNames[request.url].push(cacheName);
      }
    }

    // 여러 캐시에 있는 항목만 추출
    for (const [url, cacheNames] of Object.entries(urlToCacheNames)) {
      if (cacheNames.length > 1) {
        duplicates[url] = cacheNames;
      }
    }
  }

  return duplicates;
}

/**
 * 캐시 만료까지 남은 시간 계산
 */
export function getCacheEntryTTL(entry: CacheEntry): {
  expired: boolean;
  ttl: number; // milliseconds until expiration
  percentage: number; // 0-100, 100 = not expired at all
} {
  if (!entry.expires) {
    return { expired: false, ttl: Infinity, percentage: 100 };
  }

  const now = Date.now();
  const ttl = entry.expires - now;
  const expired = ttl <= 0;

  return {
    expired,
    ttl: Math.max(0, ttl),
    percentage: expired ? 0 : Math.min(100, (ttl / (entry.expires - (entry.lastModified || now))) * 100),
  };
}
