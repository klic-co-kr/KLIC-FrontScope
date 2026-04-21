/**
 * Storage Cleaner Hook
 *
 * 스토리지 클리너 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import {
  StorageStats,
  StorageItem,
  StorageType,
  CookieInfo,
} from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { RESOURCE_NETWORK_MESSAGES } from '../../constants/messages';
import { DEFAULT_RESOURCE_NETWORK_SETTINGS } from '../../constants/defaults';
import { sendMessageToActiveTab } from './activeTabMessaging';
import {
  sortItemsBySize,
  sortItemsByName,
  getLargestItems,
  filterStorageItems,
  filterCookies,
} from '../../utils/resourceNetwork/storage/storageAnalyzer';
import { exportStorage, downloadStorageExport } from '../../utils/resourceNetwork/storage/storageExport';

export function useStorageCleaner() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [preserveDomains, setPreserveDomains] = useState<string[]>(
    DEFAULT_RESOURCE_NETWORK_SETTINGS.storage.preserveDomains
  );
  const [autoClean, setAutoClean] = useState(false);
  const [cleanOnClose, setCleanOnClose] = useState(false);

  // 초기 스캔
  useEffect(() => {
    loadSettings();
    scanStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 설정 불러오기
  const loadSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
        ]);
        const settings = result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] as typeof import('../../constants/defaults').DEFAULT_RESOURCE_NETWORK_SETTINGS | undefined;
        if (settings?.storage) {
          setAutoClean(settings.storage?.autoClean || false);
          setCleanOnClose(settings.storage?.cleanOnClose || false);
          setPreserveDomains(settings.storage?.preserveDomains || []);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const settings = {
          storage: {
            autoClean,
            cleanOnClose,
            preserveDomains,
          },
        };
        await chrome.storage.local.set({
          [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: settings,
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // 스토리지 스캔
  const scanStorage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sendMessageToActiveTab<{ success?: boolean; data?: StorageStats; error?: string }>({
        action: RESOURCE_NETWORK_MESSAGES.STORAGE_SCAN,
      });

      if (!response?.success || !response.data) {
        throw new Error(response?.error || 'Storage scan failed');
      }

      setStats(response.data);
    } catch (error) {
      console.error('Failed to scan storage:', error);
      setError((error as Error)?.message || 'Failed to scan storage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 도메인 선택/해제
  const toggleDomain = useCallback((domain: string) => {
    const newSelected = new Set(selectedDomains);
    if (newSelected.has(domain)) {
      newSelected.delete(domain);
    } else {
      newSelected.add(domain);
    }
    setSelectedDomains(newSelected);
  }, [selectedDomains]);

  // 전체 도메인 선택
  const selectAllDomains = useCallback(() => {
    if (!stats) return;
    const allDomains = new Set([
      ...new Set(stats.cookies.items.map((cookie) => cookie.domain)),
    ]);
    setSelectedDomains(allDomains);
  }, [stats]);

  // 도메인 선택 초기화
  const clearDomainSelection = useCallback(() => {
    setSelectedDomains(new Set());
  }, []);

  // 스토리지 타입별 전체 삭제
  const clearStorage = useCallback(async (type: StorageType) => {
    try {
      const response = await sendMessageToActiveTab<{ success?: boolean; error?: string }>({
        action: RESOURCE_NETWORK_MESSAGES.CLEAR_STORAGE,
        data: { type },
      });

      if (!response?.success) {
        throw new Error(response?.error || `Failed to clear ${type}`);
      }

      await scanStorage();
      return true;
    } catch (error) {
      console.error(`Failed to clear ${type}:`, error);
      throw error;
    }
  }, [scanStorage]);

  // 선택한 도메인의 쿠키 삭제
  const clearSelectedDomains = useCallback(async () => {
    try {
      for (const domain of selectedDomains) {
        const response = await sendMessageToActiveTab<{ success?: boolean; error?: string }>({
          action: RESOURCE_NETWORK_MESSAGES.CLEAR_STORAGE,
          data: { type: 'cookies', domain },
        });

        if (!response?.success) {
          throw new Error(response?.error || `Failed to clear cookies for domain: ${domain}`);
        }
      }
      await scanStorage();
      setSelectedDomains(new Set());
      return true;
    } catch (error) {
      console.error('Failed to clear selected domains:', error);
      throw error;
    }
  }, [scanStorage, selectedDomains]);

  // 특정 항목들 삭제
  const clearItems = useCallback(
    async (type: 'localStorage' | 'sessionStorage', items: StorageItem[]) => {
      try {
        const keys = items.map((item) => item.key);

        for (const key of keys) {
          const response = await sendMessageToActiveTab<{ success?: boolean; error?: string }>({
            action: RESOURCE_NETWORK_MESSAGES.CLEAR_STORAGE,
            data: { type, key },
          });

          if (!response?.success) {
            throw new Error(response?.error || `Failed to clear ${type} item: ${key}`);
          }
        }

        await scanStorage();
        return true;
      } catch (error) {
        console.error('Failed to clear items:', error);
        throw error;
      }
    },
    [scanStorage]
  );

  // 쿠키 항목들 삭제
  const clearCookieItems = useCallback(async (cookies: CookieInfo[]) => {
    try {
      for (const cookie of cookies) {
        const response = await sendMessageToActiveTab<{ success?: boolean; error?: string }>({
          action: RESOURCE_NETWORK_MESSAGES.CLEAR_STORAGE,
          data: {
            type: 'cookies',
            key: cookie.name,
            domain: cookie.domain,
            path: cookie.path,
          },
        });

        if (!response?.success) {
          throw new Error(response?.error || `Failed to clear cookie: ${cookie.name}`);
        }
      }
      await scanStorage();
      return true;
    } catch (error) {
      console.error('Failed to clear cookie items:', error);
      throw error;
    }
  }, [scanStorage]);

  // 보존 도메인 설정
  const addPreserveDomain = useCallback(
    (domain: string) => {
      if (!preserveDomains.includes(domain)) {
        const newDomains = [...preserveDomains, domain];
        setPreserveDomains(newDomains);
      }
    },
    [preserveDomains]
  );

  const removePreserveDomain = useCallback(
    (domain: string) => {
      const newDomains = preserveDomains.filter((d) => d !== domain);
      setPreserveDomains(newDomains);
    },
    [preserveDomains]
  );

  // 설정 변경 시 저장
  useEffect(() => {
    saveSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoClean, cleanOnClose, preserveDomains]);

  // 정렬 헬퍼
  const sortStorageItems = useCallback(
    (items: StorageItem[], sortBy: 'size' | 'name', descending = true) => {
      if (sortBy === 'size') {
        return sortItemsBySize(items, descending);
      }
      return sortItemsByName(items);
    },
    []
  );

  // 대용량 항목 가져오기
  const getLargestStorageItems = useCallback((count = 10) => {
    if (!stats) return [];
    return getLargestItems(
      [...stats.localStorage.items, ...stats.sessionStorage.items],
      count
    );
  }, [stats]);

  // 필터링
  const filterItems = useCallback(
    (filters: {
      type?: StorageType;
      keyPattern?: RegExp;
      minSize?: number;
    }) => {
      if (!stats) return [];

      const items: StorageItem[] = [
        ...(!filters.type || filters.type === 'localStorage' ? stats.localStorage.items : []),
        ...(!filters.type || filters.type === 'sessionStorage' ? stats.sessionStorage.items : []),
      ];

      return filterStorageItems(items, {
        keyPattern: filters.keyPattern,
        minSize: filters.minSize,
      });
    },
    [stats]
  );

  // 쿠키 필터링
  const filterCookieItems = useCallback(
    (filters: {
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
    }) => {
      if (!stats) return [];
      return filterCookies(stats.cookies.items, filters);
    },
    [stats]
  );

  // 내보내기
  const exportData = useCallback(() => {
    if (!stats) return false;
    const exportData = exportStorage(stats);
    downloadStorageExport(exportData);
    return true;
  }, [stats]);

  return {
    // 상태
    stats,
    isLoading,
    error,
    selectedDomains,
    preserveDomains,
    autoClean,
    cleanOnClose,

    // 설정
    setAutoClean,
    setCleanOnClose,
    addPreserveDomain,
    removePreserveDomain,

    // 액션
    scanStorage,
    toggleDomain,
    selectAllDomains,
    clearDomainSelection,
    clearStorage,
    clearSelectedDomains,
    clearItems,
    clearCookieItems,

    // 헬퍼
    sortStorageItems,
    getLargestStorageItems,
    filterItems,
    filterCookieItems,
    exportData,
  };
}
