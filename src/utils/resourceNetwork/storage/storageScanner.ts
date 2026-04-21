/**
 * Storage Scanner
 *
 * LocalStorage, SessionStorage, Cookies 스캔 기능 제공
 */

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
 * 쿠키 스캔 (동기 버전 - document.cookie 사용)
 */
export function scanCookiesSync(): CookieInfo[] {
  const cookies: CookieInfo[] = [];

  try {
    const cookiesStr = document.cookie;
    if (cookiesStr) {
      const cookiePairs = cookiesStr.split(';');

      for (const pair of cookiePairs) {
        const trimmed = pair.trim();
        if (!trimmed) continue;

        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;

        const name = trimmed.slice(0, eqIndex);
        const value = trimmed.slice(eqIndex + 1);

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
  } catch (error) {
    console.error('Failed to scan cookies:', error);
  }

  return cookies;
}

/**
 * 쿠키 스캔 (비동기 버전 - Chrome Extension API 사용)
 */
export async function scanCookiesAsync(): Promise<CookieInfo[]> {
  const cookies: CookieInfo[] = [];

  try {
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll) {
      const result = await chrome.cookies.getAll({});

      for (const cookie of result) {
        cookies.push({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expiration: cookie.expirationDate ? Math.floor(cookie.expirationDate * 1000) : undefined,
          httpOnly: cookie.httpOnly || false,
          secure: cookie.secure || false,
          sameSite: (cookie.sameSite as 'strict' | 'lax' | 'none') || 'lax',
          size: getStringSize(cookie.name + cookie.value),
        });
      }
    } else {
      // Fallback to document.cookie
      return scanCookiesSync();
    }
  } catch (error) {
    console.error('Failed to scan cookies with Chrome API:', error);
    // Fallback to document.cookie
    return scanCookiesSync();
  }

  return cookies;
}

/**
 * 전체 스토리지 스캔 (동기 버전 - LocalStorage, SessionStorage만)
 */
export function scanStorageSync(): Omit<StorageStats, 'cookies'> {
  const localStorageItems = scanLocalStorage();
  const sessionStorageItems = scanSessionStorage();

  const localStorageTotalSize = localStorageItems.reduce((sum, item) => sum + item.size, 0);
  const sessionStorageTotalSize = sessionStorageItems.reduce((sum, item) => sum + item.size, 0);

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
    totalSize: localStorageTotalSize + sessionStorageTotalSize,
  };
}

/**
 * 전체 스토리지 스캔 (비동기 버전 - 쿠키 포함)
 */
export async function scanAllStorage(): Promise<StorageStats> {
  const localStorageItems = scanLocalStorage();
  const sessionStorageItems = scanSessionStorage();
  const cookieItems = await scanCookiesAsync();

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

/**
 * 특정 키의 스토리지 항목만 스캔
 */
export function scanStorageByKey(type: 'localStorage' | 'sessionStorage', key: string): StorageItem | null {
  try {
    const storage = type === 'localStorage' ? localStorage : sessionStorage;
    const value = storage.getItem(key);

    if (value === null) return null;

    return {
      key,
      value,
      size: calculateStorageItemSize(key, value),
      type,
    };
  } catch (error) {
    console.error(`Failed to scan ${type} key "${key}":`, error);
    return null;
  }
}

/**
 * 스토리지 사용량 퍼센트 계산 (Chrome Storage Quota 기준)
 */
export function calculateStorageUsagePercentage(stats: StorageStats): number {
  // Chrome Extension Storage Local 제한: 약 10MB (실제로는 더 커질 수 있음)
  const MAX_STORAGE_BYTES = 10 * 1024 * 1024;
  return Math.min(100, Math.round((stats.totalSize / MAX_STORAGE_BYTES) * 100));
}
