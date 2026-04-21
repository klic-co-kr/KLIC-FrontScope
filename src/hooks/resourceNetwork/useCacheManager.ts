import { useState, useCallback, useEffect } from 'react';
import { CacheEntry, CacheStats, ResourceType } from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_RESOURCE_NETWORK_SETTINGS } from '../../constants/defaults';
import { RESOURCE_NETWORK_MESSAGES } from '../../constants/messages';
import { sendMessageToActiveTab } from './activeTabMessaging';
import { isCacheEntryExpired } from '../../utils/resourceNetwork/helpers';

type CacheScanResponse = {
  success?: boolean;
  data?: CacheStats;
  error?: string;
};

type CacheClearResponse = {
  success?: boolean;
  data?: { clearedCount?: number };
  error?: string;
};

function normalizeCacheStats(stats?: Partial<CacheStats>): CacheStats {
  const entries = Array.isArray(stats?.entries) ? stats?.entries : [];
  const expiredEntries = Array.isArray(stats?.expiredEntries)
    ? stats?.expiredEntries
    : entries.filter(isCacheEntryExpired);

  return {
    totalEntries: typeof stats?.totalEntries === 'number' ? stats.totalEntries : entries.length,
    totalSize: typeof stats?.totalSize === 'number'
      ? stats.totalSize
      : entries.reduce((sum, entry) => sum + entry.size, 0),
    hitRate: typeof stats?.hitRate === 'number' ? stats.hitRate : 0,
    entries,
    expiredEntries,
    cacheNames: Array.isArray(stats?.cacheNames) ? stats.cacheNames : [],
    timestamp: typeof stats?.timestamp === 'number' ? stats.timestamp : Date.now(),
  };
}

function getTypeStatsFromEntries(entries: CacheEntry[]): Record<ResourceType, { count: number; totalSize: number }> {
  const stats: Record<ResourceType, { count: number; totalSize: number }> = {
    document: { count: 0, totalSize: 0 },
    stylesheet: { count: 0, totalSize: 0 },
    script: { count: 0, totalSize: 0 },
    image: { count: 0, totalSize: 0 },
    font: { count: 0, totalSize: 0 },
    xhr: { count: 0, totalSize: 0 },
    fetch: { count: 0, totalSize: 0 },
    websocket: { count: 0, totalSize: 0 },
    other: { count: 0, totalSize: 0 },
  };

  for (const entry of entries) {
    stats[entry.type].count += 1;
    stats[entry.type].totalSize += entry.size;
  }

  return stats;
}

function getDuplicateEntries(entries: CacheEntry[]): Record<string, string[]> {
  const lookup = new Map<string, Set<string>>();

  for (const entry of entries) {
    const existing = lookup.get(entry.url);
    if (existing) {
      existing.add(entry.cacheName || 'default');
    } else {
      lookup.set(entry.url, new Set([entry.cacheName || 'default']));
    }
  }

  const duplicates: Record<string, string[]> = {};
  for (const [url, cacheNames] of lookup.entries()) {
    if (cacheNames.size > 1) {
      duplicates[url] = Array.from(cacheNames);
    }
  }

  return duplicates;
}

export function useCacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [settings, setSettings] = useState(DEFAULT_RESOURCE_NETWORK_SETTINGS.cache);

  const loadSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
        ]);
        const savedSettings = result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] as typeof DEFAULT_RESOURCE_NETWORK_SETTINGS | undefined;
        if (savedSettings?.cache) {
          setSettings(savedSettings.cache);
        }
      }
    } catch (error) {
      console.error('Failed to load cache settings:', error);
    }
  };

  const refreshCache = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await sendMessageToActiveTab<CacheScanResponse>({
        action: RESOURCE_NETWORK_MESSAGES.CACHE_SCAN,
      });

      if (!response?.success || !response.data) {
        throw new Error(response?.error || 'Failed to scan cache');
      }

      const nextStats = normalizeCacheStats(response.data);
      setStats(nextStats);
      setCacheNames(nextStats.cacheNames || []);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      setStats(null);
      setCacheNames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runCacheClear = useCallback(async (data: Record<string, unknown>) => {
    const response = await sendMessageToActiveTab<CacheClearResponse>({
      action: RESOURCE_NETWORK_MESSAGES.CACHE_CLEAR,
      data,
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to clear cache');
    }

    await refreshCache();
    return typeof response.data?.clearedCount === 'number' ? response.data.clearedCount : 0;
  }, [refreshCache]);

  useEffect(() => {
    void loadSettings();
  }, []);

  useEffect(() => {
    void refreshCache();
  }, [refreshCache]);

  const clearExpired = useCallback(async () => {
    return await runCacheClear({ mode: 'expired' });
  }, [runCacheClear]);

  const clearAll = useCallback(async () => {
    await runCacheClear({ mode: 'all' });
    return true;
  }, [runCacheClear]);

  const clearLargeItems = useCallback(async (threshold: number) => {
    return await runCacheClear({ mode: 'large', threshold });
  }, [runCacheClear]);

  const clearForDomain = useCallback(async (domain: string) => {
    return await runCacheClear({ mode: 'domain', domain });
  }, [runCacheClear]);

  const getOptimizationSuggestions = useCallback((): string[] => {
    if (!stats) {
      return [];
    }

    const suggestions: string[] = [];

    if ((stats.hitRate ?? 0) < 0.5) {
      suggestions.push('캐시 히트율이 낮습니다. 캐싱 전략을 재검토하세요');
    }

    if (stats.expiredEntries.length > 10) {
      suggestions.push(
        `만료된 캐시 항목이 ${stats.expiredEntries.length}개 있습니다. 자동 정리를 고려하세요`
      );
    }

    const largeEntries = stats.entries.filter((entry) => entry.size > 1024 * 100);
    if (largeEntries.length > 5) {
      suggestions.push(
        `${largeEntries.length}개의 대용량 캐시 항목이 있습니다. 리소스 최적화를 고려하세요`
      );
    }

    if (stats.totalSize > 10 * 1024 * 1024) {
      suggestions.push(
        `캐시 크기가 ${(stats.totalSize / 1024 / 1024).toFixed(1)}MB입니다. 정기적인 정리를 권장합니다`
      );
    }

    return suggestions;
  }, [stats]);

  const getLargest = useCallback((count: number = 10) => {
    if (!stats) {
      return [];
    }

    return [...stats.entries].sort((a, b) => b.size - a.size).slice(0, count);
  }, [stats]);

  const getTypeStats = useCallback(async () => {
    if (!stats) {
      return getTypeStatsFromEntries([]);
    }

    return getTypeStatsFromEntries(stats.entries);
  }, [stats]);

  const getEstimatedSize = useCallback(async () => {
    return stats?.totalSize || 0;
  }, [stats]);

  const getDuplicates = useCallback(async () => {
    if (!stats) {
      return {};
    }

    return getDuplicateEntries(stats.entries);
  }, [stats]);

  const updateSettings = useCallback(async (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
        ]);
        const existing = result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] || {};

        await chrome.storage.local.set({
          [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: {
            ...existing,
            cache: newSettings,
          },
        });
      }
    } catch (error) {
      console.error('Failed to save cache settings:', error);
    }
  }, [settings]);

  const toggleAutoClean = useCallback(() => {
    void updateSettings({ autoCleanExpired: !settings.autoCleanExpired });
  }, [settings.autoCleanExpired, updateSettings]);

  const toggleShowExpired = useCallback(() => {
    void updateSettings({ showExpired: !settings.showExpired });
  }, [settings.showExpired, updateSettings]);

  return {
    stats,
    isLoading,
    cacheNames,
    settings,
    refreshCache,
    clearExpired,
    clearAll,
    clearLargeItems,
    clearForDomain,
    getOptimizationSuggestions,
    getLargest,
    getTypeStats,
    getEstimatedSize,
    getDuplicates,
    updateSettings,
    toggleAutoClean,
    toggleShowExpired,
  };
}
