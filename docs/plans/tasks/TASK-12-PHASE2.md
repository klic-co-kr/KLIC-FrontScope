# Phase 2: 쿠키/스토리지 클리너

**태스크**: 6개
**예상 시간**: 2.5시간
**의존성**: Phase 1 완료

---

### Task #12.8: 스토리지 스캐너

- **파일**: `src/utils/resourceNetwork/storage/storageScanner.ts`
- **시간**: 30분
- **의존성**: Task #12.1, #12.7
- **상세 내용**:
```typescript
import { StorageStats, StorageItem, CookieInfo } from '../../../types/resourceNetwork';
import { calculateStorageItemSize, getStringSize } from '../helpers';

/**
 * LocalStorage 스캔
 */
export function scanLocalStorage(): StorageItem[] {
  const items: StorageItem[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        items.push({
          key,
          value,
          size: calculateStorageItemSize(key, value),
          type: 'localStorage',
        });
      }
    }
  } catch (error) {
    console.error('Failed to scan localStorage:', error);
  }

  return items;
}

/**
 * SessionStorage 스캔
 */
export function scanSessionStorage(): StorageItem[] {
  const items: StorageItem[] = [];

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key) || '';
        items.push({
          key,
          value,
          size: calculateStorageItemSize(key, value),
          type: 'sessionStorage',
        });
      }
    }
  } catch (error) {
    console.error('Failed to scan sessionStorage:', error);
  }

  return items;
}

/**
 * 쿠키 스캔
 */
export function scanCookies(): CookieInfo[] {
  const cookies: CookieInfo[] = [];

  try {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      // Chrome Extension API 사용
      chrome.cookies.getAll({}, (result) => {
        for (const cookie of result) {
          cookies.push({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            expiration: cookie.expirationDate ? Math.floor(cookie.expirationDate * 1000) : undefined,
            httpOnly: cookie.httpOnly || false,
            secure: cookie.secure || false,
            sameSite: cookie.sameSite || 'lax',
            size: getStringSize(cookie.name + cookie.value),
          });
        }
      });
    } else {
      // document.cookie 파싱 (fallback)
      const cookiesStr = document.cookie;
      const cookiePairs = cookiesStr.split(';');

      for (const pair of cookiePairs) {
        const [name, ...valueParts] = pair.trim().split('=');
        const value = valueParts.join('=');

        if (name) {
          cookies.push({
            name,
            value,
            domain: window.location.hostname,
            path: '/',
            httpOnly: false,
            secure: window.location.protocol === 'https:',
            sameSite: 'lax',
            size: getStringSize(name + value),
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to scan cookies:', error);
  }

  return cookies;
}

/**
 * 전체 스토리지 스캔
 */
export async function scanAllStorage(): Promise<StorageStats> {
  const localStorageItems = scanLocalStorage();
  const sessionStorageItems = scanSessionStorage();
  const cookieItems = scanCookies();

  const localStorageTotalSize = localStorageItems.reduce((sum, item) => sum + item.size, 0);
  const sessionStorageTotalSize = sessionStorageItems.reduce((sum, item) => sum + item.size, 0);
  const cookiesTotalSize = cookieItems.reduce((sum, cookie) => sum + cookie.size, 0);

  return {
    localStorage: {
      count: localStorageItems.length,
      totalSize: localStorageTotalSize,
      items: localStorageItems,
    },
    sessionStorage: {
      count: sessionStorageItems.length,
      totalSize: sessionStorageTotalSize,
      items: sessionStorageItems,
    },
    cookies: {
      count: cookieItems.length,
      totalSize: cookiesTotalSize,
      items: cookieItems,
    },
    totalSize: localStorageTotalSize + sessionStorageTotalSize + cookiesTotalSize,
  };
}
```

---

### Task #12.9: 스토리지 클리너

- **파일**: `src/utils/resourceNetwork/storage/storageCleaner.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.8
- **상세 내용**:
```typescript
import { StorageType } from '../../../types/resourceNetwork';

/**
 * LocalStorage 항목 삭제
 */
export function clearLocalStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * LocalStorage 전체 삭제
 */
export function clearAllLocalStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * SessionStorage 항목 삭제
 */
export function clearSessionStorageItem(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * SessionStorage 전체 삭제
 */
export function clearAllSessionStorage(): boolean {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear sessionStorage:', error);
    return false;
  }
}

/**
 * 쿠키 삭제 (Chrome Extension API)
 */
export async function clearCookie(name: string, domain: string): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      const url = `https://${domain}`;
      await chrome.cookies.remove({ url, name });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to remove cookie "${name}":`, error);
    return false;
  }
}

/**
 * 도메인별 쿠키 전체 삭제
 */
export async function clearAllCookiesForDomain(domain: string): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      const cookies = await chrome.cookies.getAll({ domain });

      for (const cookie of cookies) {
        const url = `https://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to clear cookies for domain "${domain}":`, error);
    return false;
  }
}

/**
 * 전체 쿠키 삭제
 */
export async function clearAllCookies(): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      const cookies = await chrome.cookies.getAll({});

      for (const cookie of cookies) {
        const url = `https://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to clear all cookies:', error);
    return false;
  }
}

/**
 * 특정 도메인의 모든 스토리지 삭제
 */
export async function clearAllStorageForDomain(domain: string): Promise<{
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
}> {
  const results = {
    localStorage: false,
    sessionStorage: false,
    cookies: false,
  };

  // LocalStorage 및 SessionStorage는 도메인별로 삭제할 수 없음
  // 전체 삭제 후 도메인에 맞는 항목만 복원하는 방식이 필요할 수 있음

  results.cookies = await clearAllCookiesForDomain(domain);

  return results;
}

/**
 * 스토리지 타입별 전체 삭제
 */
export async function clearStorageByType(type: StorageType): Promise<boolean> {
  switch (type) {
    case 'localStorage':
      return clearAllLocalStorage();
    case 'sessionStorage':
      return clearAllSessionStorage();
    case 'cookies':
      return await clearAllCookies();
    default:
      return false;
  }
}
```

---

### Task #12.10: 스토리지 분석기

- **파일**: `src/utils/resourceNetwork/storage/storageAnalyzer.ts`
- **시간**: 20분
- **의존성**: Task #12.1, #12.8
- **상세 내용**:
```typescript
import { StorageStats, StorageItem } from '../../../types/resourceNetwork';

/**
 * 크기 기준 정렬
 */
export function sortItemsBySize(items: StorageItem[], descending: boolean = true): StorageItem[] {
  return [...items].sort((a, b) => descending ? b.size - a.size : a.size - b.size);
}

/**
 * 이름 기준 정렬
 */
export function sortItemsByName(items: StorageItem[]): StorageItem[] {
  return [...items].sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * 대용량 항목 식별 (상위 N개)
 */
export function getLargestItems(items: StorageItem[], count: number = 10): StorageItem[] {
  return sortItemsBySize(items).slice(0, count);
}

/**
 * 중복 항목 찾기
 */
export function findDuplicateKeys(items: StorageItem[]): Map<string, StorageItem[]> {
  const duplicates = new Map<string, StorageItem[]>();
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.key)) {
      const existing = duplicates.get(item.key) || [];
      existing.push(item);
      duplicates.set(item.key, existing);
    } else {
      seen.add(item.key);
    }
  }

  return duplicates;
}

/**
 * 만료된 쿠키 찾기
 */
export function findExpiredCookies(cookies: { expiration?: number }[]): { expiration?: number }[] {
  const now = Date.now();
  return cookies.filter(cookie => cookie.expiration && cookie.expiration < now);
}

/**
 * 스토리지 사용량 분석
 */
export interface StorageUsageAnalysis {
  totalItems: number;
  totalSize: number;
  averageItemSize: number;
  largestItem: StorageItem | null;
  sizeDistribution: {
    small: number;  // < 1KB
    medium: number; // 1KB - 10KB
    large: number;  // > 10KB
  };
}

export function analyzeStorageUsage(items: StorageItem[]): StorageUsageAnalysis {
  if (items.length === 0) {
    return {
      totalItems: 0,
      totalSize: 0,
      averageItemSize: 0,
      largestItem: null,
      sizeDistribution: { small: 0, medium: 0, large: 0 },
    };
  }

  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const averageItemSize = totalSize / items.length;
  const largestItem = items.reduce((max, item) => item.size > max.size ? item : max, items[0]);

  const sizeDistribution = {
    small: items.filter(item => item.size < 1024).length,
    medium: items.filter(item => item.size >= 1024 && item.size < 10240).length,
    large: items.filter(item => item.size >= 10240).length,
  };

  return {
    totalItems: items.length,
    totalSize,
    averageItemSize,
    largestItem,
    sizeDistribution,
  };
}
```

---

### Task #12.11: 스토리지 관리 훅

- **파일**: `src/hooks/resourceNetwork/useStorageCleaner.ts`
- **시간**: 30분
- **의존성**: Task #12.1, #12.2, #12.8, #12.9
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { StorageStats, StorageItem, StorageType } from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_RESOURCE_NETWORK_SETTINGS } from '../../constants/defaults';
import { scanAllStorage } from '../../utils/resourceNetwork/storage/storageScanner';
import { clearStorageByType, clearAllCookies } from '../../utils/resourceNetwork/storage/storageCleaner';

export function useStorageCleaner() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [preserveDomains, setPreserveDomains] = useState<string[]>(DEFAULT_RESOURCE_NETWORK_SETTINGS.storage.preserveDomains);

  // 초기 스캔
  useEffect(() => {
    scanStorage();
  }, []);

  const scanStorage = async () => {
    setIsLoading(true);
    try {
      const newStats = await scanAllStorage();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to scan storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const selectAllDomains = useCallback(() => {
    if (!stats) return;
    const allDomains = new Set([
      ...new Set(stats.localStorage.items.map(item => window.location.hostname)),
      ...new Set(stats.cookies.items.map(cookie => cookie.domain)),
    ]);
    setSelectedDomains(allDomains);
  }, [stats]);

  const clearDomainSelection = useCallback(() => {
    setSelectedDomains(new Set());
  }, []);

  // 스토리지 삭제
  const clearStorage = useCallback(async (type: StorageType) => {
    try {
      if (type === 'cookies') {
        await clearAllCookies();
      } else {
        await clearStorageByType(type);
      }
      await scanStorage();
    } catch (error) {
      console.error(`Failed to clear ${type}:`, error);
      throw error;
    }
  }, []);

  // 선택한 도메인의 스토리지 삭제
  const clearSelectedDomains = useCallback(async () => {
    // TODO: Implement domain-specific clearing
    await scanStorage();
  }, [selectedDomains]);

  // 보존 도메인 설정
  const addPreserveDomain = useCallback((domain: string) => {
    if (!preserveDomains.includes(domain)) {
      const newDomains = [...preserveDomains, domain];
      setPreserveDomains(newDomains);
      // Save to storage
    }
  }, [preserveDomains]);

  const removePreserveDomain = useCallback((domain: string) => {
    const newDomains = preserveDomains.filter(d => d !== domain);
    setPreserveDomains(newDomains);
    // Save to storage
  }, [preserveDomains]);

  return {
    stats,
    isLoading,
    selectedDomains,
    preserveDomains,
    scanStorage,
    toggleDomain,
    selectAllDomains,
    clearDomainSelection,
    clearStorage,
    clearSelectedDomains,
    addPreserveDomain,
    removePreserveDomain,
  };
}
```
- **완료 조건**: CRUD 동작 검증

---

### Task #12.12: 스토리지 내보내기/가져오기

- **파일**: `src/utils/resourceNetwork/storage/storageExport.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.8
- **상세 내용**:
```typescript
import { StorageStats } from '../../../types/resourceNetwork';

export interface StorageExport {
  timestamp: number;
  url: string;
  localStorage: Array<{ key: string; value: string }>;
  sessionStorage: Array<{ key: string; value: string }>;
  cookies: Array<{ name: string; value: string; domain: string }>;
}

/**
 * 스토리지 내보내기
 */
export function exportStorage(stats: StorageStats): StorageExport {
  return {
    timestamp: Date.now(),
    url: window.location.href,
    localStorage: stats.localStorage.items.map(item => ({
      key: item.key,
      value: item.value,
    })),
    sessionStorage: stats.sessionStorage.items.map(item => ({
      key: item.key,
      value: item.value,
    })),
    cookies: stats.cookies.items.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
    })),
  };
}

/**
 * JSON 파일로 다운로드
 */
export function downloadStorageExport(exp: StorageExport): void {
  const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${new Date(exp.timestamp).toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 스토리지 가져오기
 */
export function importStorage(exp: StorageExport): void {
  // LocalStorage 복원
  for (const item of exp.localStorage) {
    try {
      localStorage.setItem(item.key, item.value);
    } catch (error) {
      console.error(`Failed to restore localStorage item "${item.key}":`, error);
    }
  }

  // SessionStorage 복원
  for (const item of exp.sessionStorage) {
    try {
      sessionStorage.setItem(item.key, item.value);
    } catch (error) {
      console.error(`Failed to restore sessionStorage item "${item.key}":`, error);
    }
  }

  // 쿠키 복원 (Chrome Extension API 필요)
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    for (const cookie of exp.cookies) {
      chrome.cookies.set({
        url: `https://${cookie.domain}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
      });
    }
  }
}

/**
 * 파일에서 가져오기
 */
export async function importStorageFromFile(file: File): Promise<void> {
  const text = await file.text();
  const exp: StorageExport = JSON.parse(text);
  importStorage(exp);
}
```

---

### Task #12.13: 스토리지 예약어드 모드

- **파일**: `src/utils/resourceNetwork/storage/scheduledCleaner.ts`
- **시간**: 20분
- **의존성**: Task #12.1, #12.9
- **상세 내용**:
```typescript
import { clearAllLocalStorage, clearAllSessionStorage, clearAllCookies } from './storageCleaner';

export interface ScheduledCleanConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly';
  lastRun: number;
  types: ('localStorage' | 'sessionStorage' | 'cookies')[];
  preserveDomains: string[];
}

/**
 * 예약어드 클린 실행
 */
export async function runScheduledClean(config: ScheduledCleanConfig): Promise<boolean> {
  if (!config.enabled) return false;

  try {
    for (const type of config.types) {
      switch (type) {
        case 'localStorage':
          clearAllLocalStorage();
          break;
        case 'sessionStorage':
          clearAllSessionStorage();
          break;
        case 'cookies':
          await clearAllCookies();
          break;
      }
    }

    // Update last run time
    config.lastRun = Date.now();
    await saveScheduledCleanConfig(config);

    return true;
  } catch (error) {
    console.error('Failed to run scheduled clean:', error);
    return false;
  }
}

/**
 * 설정 저장
 */
async function saveScheduledCleanConfig(config: ScheduledCleanConfig): Promise<void> {
  await chrome.storage.local.set({ scheduledCleanConfig: config });
}

/**
 * 설정 불러오기
 */
export async function getScheduledCleanConfig(): Promise<ScheduledCleanConfig> {
  const result = await chrome.storage.local.get('scheduledCleanConfig');
  return result.scheduledCleanConfig || {
    enabled: false,
    schedule: 'daily',
    lastRun: 0,
    types: [],
    preserveDomains: [],
  };
}

/**
 * 다음 실행 시간 계산
 */
export function getNextRunTime(config: ScheduledCleanConfig): number {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  switch (config.schedule) {
    case 'daily':
      return now + dayMs;
    case 'weekly':
      return now + dayMs * 7;
    case 'monthly':
      return now + dayMs * 30;
    default:
      return now + dayMs;
  }
}
```

---

[Phase 3: 애니메이션 검사기](./TASK-12-PHASE3.md) 로 계속
