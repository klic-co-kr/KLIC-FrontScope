/**
 * Service Worker Integration for Resource Network
 *
 * Service Worker와의 통신 및 캐시 관리 기능
 */

import { RESOURCE_NETWORK_MESSAGES } from '../../constants/messages';
import { safeSendMessageWithCallback } from '../utils/safeMessage';
import type { CacheEntry, CacheStats, CacheSnapshot } from '../../types/resourceNetwork';

/**
 * Message handler for service worker communication
 */
export interface ServiceWorkerMessage {
  action: string;
  data?: unknown;
  tabId?: number;
}

/**
 * Send message to service worker
 */
export async function sendMessageToServiceWorker(
  message: ServiceWorkerMessage
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    safeSendMessageWithCallback(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Request cache scan from service worker
 */
export async function requestCacheScan(): Promise<CacheStats> {
  const response = await sendMessageToServiceWorker({
    action: RESOURCE_NETWORK_MESSAGES.CACHE_SCAN,
  });
  return (response as { data?: CacheStats }).data || createEmptyCacheStats();
}

/**
 * Request cache clear from service worker
 */
export async function requestCacheClear(cacheName?: string): Promise<boolean> {
  const response = await sendMessageToServiceWorker({
    action: RESOURCE_NETWORK_MESSAGES.CACHE_CLEAR,
    data: { cacheName },
  });
  return (response as { success?: boolean }).success || false;
}

/**
 * Request cache entries from service worker
 */
export async function requestCacheEntries(cacheName?: string): Promise<CacheEntry[]> {
  const response = await sendMessageToServiceWorker({
    action: RESOURCE_NETWORK_MESSAGES.CACHE_GET_ENTRIES,
    data: { cacheName },
  });
  return (response as { data?: CacheEntry[] }).data || [];
}

/**
 * Create cache snapshot
 */
export async function createCacheSnapshot(): Promise<CacheSnapshot> {
  const entries = await requestCacheEntries();
  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

  return {
    timestamp: Date.now(),
    totalEntries: entries.length,
    totalSize,
    entries,
    expiredEntries: entries.filter((e) => e.expires && e.expires < Date.now()),
  };
}

/**
 * Compare two cache snapshots
 */
export function compareCacheSnapshots(
  before: CacheSnapshot,
  after: CacheSnapshot
): {
  added: CacheEntry[];
  removed: CacheEntry[];
  changed: Array<{ before: CacheEntry; after: CacheEntry }>;
  stats: {
    addedSize: number;
    removedSize: number;
    sizeDiff: number;
  };
} {
  const beforeMap = new Map(before.entries.map((e) => [e.url, e]));
  const afterMap = new Map(after.entries.map((e) => [e.url, e]));

  const added: CacheEntry[] = [];
  const removed: CacheEntry[] = [];
  const changed: Array<{ before: CacheEntry; after: CacheEntry }> = [];

  // Find added and changed entries
  after.entries.forEach((afterEntry) => {
    const beforeEntry = beforeMap.get(afterEntry.url);
    if (!beforeEntry) {
      added.push(afterEntry);
    } else if (beforeEntry.size !== afterEntry.size || beforeEntry.expires !== afterEntry.expires) {
      changed.push({ before: beforeEntry, after: afterEntry });
    }
  });

  // Find removed entries
  before.entries.forEach((beforeEntry) => {
    if (!afterMap.has(beforeEntry.url)) {
      removed.push(beforeEntry);
    }
  });

  const addedSize = added.reduce((sum, e) => sum + e.size, 0);
  const removedSize = removed.reduce((sum, e) => sum + e.size, 0);

  return {
    added,
    removed,
    changed,
    stats: {
      addedSize,
      removedSize,
      sizeDiff: addedSize - removedSize,
    },
  };
}

/**
 * Generate cache strategy recommendation
 */
export function generateCacheStrategy(entries: CacheEntry[]): {
  strategy: string;
  description: string;
  config: Record<string, number | string[] | boolean>;
} {
  // Analyze entry types and patterns
  const staticAssets = entries.filter(
    (e) => e.type === 'script' || e.type === 'stylesheet' || e.type === 'font'
  );
  const apiResponses = entries.filter(
    (e) => e.type === 'fetch' || e.type === 'xhr'
  );

  if (staticAssets.length > entries.length * 0.5) {
    // Static-heavy: recommend cache-first
    return {
      strategy: 'cacheFirst',
      description: '정적 리소스가 많아 Cache First 전략을 권장합니다.',
      config: {
        patterns: ['/assets/**', '/static/**', '*.js', '*.css'],
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        maxEntries: 100,
      },
    };
  } else if (apiResponses.length > entries.length * 0.3) {
    // API-heavy: recommend network-first or stale-while-revalidate
    return {
      strategy: 'staleWhileRevalidate',
      description: 'API 호출이 많아 Stale While Revalidate 전략을 권장합니다.',
      config: {
        patterns: ['/api/**'],
        maxAgeSeconds: 60, // 1 minute
        networkTimeoutSeconds: 3,
      },
    };
  } else {
    // Balanced: recommend network-first with cache fallback
    return {
      strategy: 'networkFirst',
      description: '네트워크 우선 캐시 전략을 권장합니다.',
      config: {
        maxAgeSeconds: 60 * 60 * 24, // 1 day
        networkTimeoutSeconds: 5,
      },
    };
  }
}

/**
 * Setup periodic cache monitoring
 */
export function setupCacheMonitoring(
  callback: (snapshot: CacheSnapshot) => void,
  interval: number = 60000 // 1 minute
): () => void {
  let timer: number | null = null;

  const checkCache = async () => {
    try {
      const snapshot = await createCacheSnapshot();
      callback(snapshot);
    } catch (error) {
      console.error('Cache monitoring error:', error);
    }
  };

  // Initial check
  checkCache();

  // Periodic checks
  timer = window.setInterval(checkCache, interval) as unknown as number;

  return () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Register periodic cleanup alarm
 */
export async function registerCacheCleanupAlarm(
  intervalMinutes: number = 60
): Promise<void> {
  await chrome.alarms.create('cacheCleanup', {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes,
  });
}

/**
 * Unregister cache cleanup alarm
 */
export async function unregisterCacheCleanupAlarm(): Promise<void> {
  await chrome.alarms.clear('cacheCleanup');
}

/**
 * Get all cache names from current context
 */
export async function getAllCacheNames(): Promise<string[]> {
  if (typeof caches === 'undefined') {
    return [];
  }
  return await caches.keys();
}

/**
 * Get cache size estimate
 */
export async function getCacheSize(): Promise<number> {
  if (typeof caches === 'undefined') {
    return 0;
  }

  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    } catch (e) {
      console.warn(`Failed to calculate size for cache ${cacheName}:`, e);
    }
  }

  return totalSize;
}

/**
 * Clear specific cache
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (typeof caches === 'undefined') {
    return false;
  }

  try {
    const deleted = await caches.delete(cacheName);
    return deleted;
  } catch (e) {
    console.error(`Failed to clear cache ${cacheName}:`, e);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<number> {
  if (typeof caches === 'undefined') {
    return 0;
  }

  const cacheNames = await caches.keys();
  let clearedCount = 0;

  for (const cacheName of cacheNames) {
    const deleted = await caches.delete(cacheName);
    if (deleted) clearedCount++;
  }

  return clearedCount;
}

/**
 * Create empty cache stats
 */
function createEmptyCacheStats(): CacheStats {
  return {
    totalEntries: 0,
    totalSize: 0,
    entries: [],
    expiredEntries: [],
    cacheNames: [],
    timestamp: Date.now(),
  };
}

/**
 * Listen for service worker messages about cache
 */
export function setupCacheMessageListener(
  onUpdate: (data: { type: string; payload: unknown }) => void
): () => void {
  const listener = (message: unknown) => {
    const msg = message as { action?: string; data?: unknown };
    if (msg.action === RESOURCE_NETWORK_MESSAGES.CACHE_UPDATE) {
      onUpdate({ type: 'update', payload: msg.data });
    } else if (msg.action === RESOURCE_NETWORK_MESSAGES.CACHE_CLEARED) {
      onUpdate({ type: 'cleared', payload: msg.data });
    } else if (msg.action === RESOURCE_NETWORK_MESSAGES.CACHE_ERROR) {
      onUpdate({ type: 'error', payload: msg.data });
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * Request cache analysis from service worker
 */
export async function requestCacheAnalysis(): Promise<{
  byType: Record<string, { count: number; size: number; oldest: number; newest: number }>;
  duplicates: Array<{ url: string; caches: string[] }>;
  expired: CacheEntry[];
  largeEntries: Array<{ url: string; size: number; type: string }>;
}> {
  const entries = await requestCacheEntries();

  // Analyze by type
  const byType: Record<string, { count: number; size: number; oldest: number; newest: number }> = {};
  const urlMap = new Map<string, { caches: Set<string>; entry: CacheEntry }>();
  const now = Date.now();
  const expired: CacheEntry[] = [];
  const largeEntries: Array<{ url: string; size: number; type: string }> = [];

  entries.forEach((entry) => {
    // By type analysis
    if (!byType[entry.type]) {
      byType[entry.type] = { count: 0, size: 0, oldest: Infinity, newest: 0 };
    }
    byType[entry.type].count++;
    byType[entry.type].size += entry.size;
    const timestamp = entry.timestamp ?? entry.lastModified ?? Date.now();
    if (timestamp < byType[entry.type].oldest) {
      byType[entry.type].oldest = timestamp;
    }
    if (timestamp > byType[entry.type].newest) {
      byType[entry.type].newest = timestamp;
    }

    // Duplicate detection
    const existing = urlMap.get(entry.url);
    if (existing) {
      existing.caches.add(entry.cacheName || 'default');
    } else {
      urlMap.set(entry.url, {
        caches: new Set([entry.cacheName || 'default']),
        entry,
      });
    }

    // Expired detection
    if (entry.expires && entry.expires < now) {
      expired.push(entry);
    }

    // Large entries (over 1MB)
    if (entry.size > 1024 * 1024) {
      largeEntries.push({ url: entry.url, size: entry.size, type: entry.type });
    }
  });

  // Build duplicates list
  const duplicates: Array<{ url: string; caches: string[] }> = [];
  urlMap.forEach((data, url) => {
    if (data.caches.size > 1) {
      duplicates.push({ url, caches: Array.from(data.caches) });
    }
  });

  return { byType, duplicates, expired, largeEntries };
}
