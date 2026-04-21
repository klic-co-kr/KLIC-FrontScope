/**
 * Storage Helper Utilities
 *
 * Chrome Storage Local을 위한 헬퍼 함수들
 */

/**
 * Storage에서 값 가져오기
 */
export async function getStorage<T = unknown>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  } catch (error) {
    console.error(`Failed to get storage key "${key}":`, error);
    return null;
  }
}

/**
 * Storage에 값 저장하기
 */
export async function setStorage<T = unknown>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Failed to set storage key "${key}":`, error);
    return false;
  }
}

/**
 * Storage에서 값 삭제하기
 */
export async function removeStorage(key: string): Promise<boolean> {
  try {
    await chrome.storage.local.remove(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove storage key "${key}":`, error);
    return false;
  }
}

/**
 * Storage 전체 비우기
 */
export async function clearStorage(): Promise<boolean> {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
}

/**
 * 여러 키 한번에 가져오기
 */
export async function getMultipleStorage<T = unknown>(keys: string[]): Promise<Record<string, T>> {
  try {
    const result = await chrome.storage.local.get(keys);
    return result as Record<string, T>;
  } catch (error) {
    console.error('Failed to get multiple storage keys:', error);
    return {};
  }
}

/**
 * 여러 값 한번에 저장하기
 */
export async function setMultipleStorage<T = unknown>(
  items: Record<string, T>
): Promise<boolean> {
  try {
    await chrome.storage.local.set(items);
    return true;
  } catch (error) {
    console.error('Failed to set multiple storage keys:', error);
    return false;
  }
}

/**
 * Storage 크기 확인 (bytes)
 */
export async function getStorageSize(): Promise<number> {
  try {
    const allData = await chrome.storage.local.get(null);
    const json = JSON.stringify(allData);
    return new Blob([json]).size;
  } catch (error) {
    console.error('Failed to get storage size:', error);
    return 0;
  }
}

/**
 * Storage 변경 감지 리스너
 */
export function onStorageChanged(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local') {
      callback(changes, areaName);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  // 정리 함수 반환
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Storage Hook 생성 헬퍼
 */
export function createStorageHook<T>(key: string, defaultValue: T) {
  return async function(): Promise<T> {
    const value = await getStorage<T>(key);
    return value ?? defaultValue;
  };
}

/**
 * Storage에 있는 모든 키 가져오기
 */
export async function getAllStorageKeys(): Promise<string[]> {
  try {
    const allData = await chrome.storage.local.get(null);
    return Object.keys(allData);
  } catch (error) {
    console.error('Failed to get all storage keys:', error);
    return [];
  }
}
