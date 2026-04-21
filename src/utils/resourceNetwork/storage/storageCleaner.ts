/**
 * Storage Cleaner
 *
 * LocalStorage, SessionStorage, Cookies 삭제 기능 제공
 */

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
 * LocalStorage 항목들 일괄 삭제
 */
export function clearLocalStorageItems(keys: string[]): { success: string[]; failed: string[] } {
  const result = { success: [] as string[], failed: [] as string[] };

  for (const key of keys) {
    if (clearLocalStorageItem(key)) {
      result.success.push(key);
    } else {
      result.failed.push(key);
    }
  }

  return result;
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
 * SessionStorage 항목들 일괄 삭제
 */
export function clearSessionStorageItems(keys: string[]): { success: string[]; failed: string[] } {
  const result = { success: [] as string[], failed: [] as string[] };

  for (const key of keys) {
    if (clearSessionStorageItem(key)) {
      result.success.push(key);
    } else {
      result.failed.push(key);
    }
  }

  return result;
}

/**
 * 쿠키 삭제 (Chrome Extension API)
 */
export async function clearCookie(name: string, domain: string, path?: string): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.remove) {
      const url = `https://${domain}${path || '/'}`;
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
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll) {
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
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll) {
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
 * 쿠키 항목들 일괄 삭제
 */
export async function clearCookiesByName(
  cookies: Array<{ name: string; domain: string; path?: string }>
): Promise<{ success: string[]; failed: string[] }> {
  const result = { success: [] as string[], failed: [] as string[] };

  for (const cookie of cookies) {
    const cleared = await clearCookie(cookie.name, cookie.domain, cookie.path);
    if (cleared) {
      result.success.push(cookie.name);
    } else {
      result.failed.push(cookie.name);
    }
  }

  return result;
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

/**
 * 만료된 쿠키 삭제
 */
export async function clearExpiredCookies(): Promise<number> {
  let clearedCount = 0;

  try {
    if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll) {
      const cookies = await chrome.cookies.getAll({});
      const now = Date.now() / 1000; // Chrome API uses seconds

      for (const cookie of cookies) {
        if (cookie.expirationDate && cookie.expirationDate < now) {
          const url = `https://${cookie.domain}${cookie.path}`;
          await chrome.cookies.remove({ url, name: cookie.name });
          clearedCount++;
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear expired cookies:', error);
  }

  return clearedCount;
}

/**
 * 도메인별 스토리지 삭제 (쿠키만 지원)
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
  // 쿠키만 삭제 가능
  results.cookies = await clearAllCookiesForDomain(domain);

  return results;
}

/**
 * 정규식 패턴으로 키 매칭하여 삭제
 */
export function clearStorageByPattern(
  type: 'localStorage' | 'sessionStorage',
  pattern: RegExp
): { matched: string[]; cleared: string[] } {
  const storage = type === 'localStorage' ? localStorage : sessionStorage;
  const matched: string[] = [];
  const cleared: string[] = [];

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && pattern.test(key)) {
        matched.push(key);
        storage.removeItem(key);
        cleared.push(key);
      }
    }
  } catch (error) {
    console.error(`Failed to clear ${type} by pattern:`, error);
  }

  return { matched, cleared };
}

/**
 * 특정 접두사를 가진 항목 삭제
 */
export function clearStorageByPrefix(
  type: 'localStorage' | 'sessionStorage',
  prefix: string
): { cleared: string[] } {
  const result = { cleared: [] as string[] };
  const storage = type === 'localStorage' ? localStorage : sessionStorage;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key);
      result.cleared.push(key);
    }
  } catch (error) {
    console.error(`Failed to clear ${type} by prefix "${prefix}":`, error);
  }

  return result;
}

/**
 * 대용량 항목 삭제 (지정된 크기 이상)
 */
export function clearLargeStorageItems(
  type: 'localStorage' | 'sessionStorage',
  minSizeBytes: number
): { cleared: string[]; totalSizeSaved: number } {
  const result = { cleared: [] as string[], totalSizeSaved: 0 };
  const storage = type === 'localStorage' ? localStorage : sessionStorage;

  try {
    const keysToKeep: Array<{ key: string; value: string }> = [];
    const keysToRemove: string[] = [];

    // 먼저 모든 항목을 수집
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key) || '';
        const size = new Blob([key + value]).size;

        if (size >= minSizeBytes) {
          keysToRemove.push(key);
          result.totalSizeSaved += size;
        } else {
          keysToKeep.push({ key, value });
        }
      }
    }

    // 전체 삭제 후 작은 항목만 복원
    storage.clear();

    for (const item of keysToKeep) {
      storage.setItem(item.key, item.value);
    }

    result.cleared = keysToRemove;
  } catch (error) {
    console.error(`Failed to clear large ${type} items:`, error);
  }

  return result;
}

/**
 * 특정 기간 이전의 항목 삭제 (값에 JSON timestamp가 있는 경우)
 */
export function clearOldStorageItemsByTimestamp(
  type: 'localStorage' | 'sessionStorage',
  timestampKey: string,
  olderThanMs: number
): { cleared: string[] } {
  const result = { cleared: [] as string[] };
  const storage = type === 'localStorage' ? localStorage : sessionStorage;
  const now = Date.now();
  const threshold = now - olderThanMs;

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        try {
          const value = storage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed[timestampKey] && parsed[timestampKey] < threshold) {
              storage.removeItem(key);
              result.cleared.push(key);
            }
          }
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
    }
  } catch (error) {
    console.error(`Failed to clear old ${type} items:`, error);
  }

  return result;
}
