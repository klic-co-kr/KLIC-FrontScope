/**
 * Screenshot Storage Utilities
 *
 * 스크린샷 저장소 유틸리티
 */

import type { Screenshot, ScreenshotSettings } from '../../../types/screenshot';
import { SCREENSHOT_STORAGE_KEYS } from '../../../constants/screenshot';

/**
 * 저장소 키
 */
const STORAGE_KEYS = SCREENSHOT_STORAGE_KEYS;

/**
 * 스크린샷 저장
 */
export async function saveScreenshot(screenshot: Screenshot): Promise<void> {
  const screenshots = await getScreenshots();
  screenshots.push(screenshot);

  // 최대 개수 제한 (100개)
  if (screenshots.length > 100) {
    screenshots.shift();
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.HISTORY]: screenshots,
  });
}

/**
 * 모든 스크린샷 가져오기
 */
export async function getScreenshots(): Promise<Screenshot[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  return (result[STORAGE_KEYS.HISTORY] as Screenshot[]) || [];
}

/**
 * ID로 스크린샷 가져오기
 */
export async function getScreenshotById(id: string): Promise<Screenshot | null> {
  const screenshots = await getScreenshots();
  return screenshots.find(s => s.id === id) || null;
}

/**
 * 스크린샷 삭제
 */
export async function deleteScreenshot(id: string): Promise<void> {
  const screenshots = await getScreenshots();
  const filtered = screenshots.filter(s => s.id !== id);

  await chrome.storage.local.set({
    [STORAGE_KEYS.HISTORY]: filtered,
  });
}

/**
 * 모든 스크린샷 삭제
 */
export async function clearScreenshots(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.HISTORY]: [],
  });
}

/**
 * 스크린샷 업데이트
 */
export async function updateScreenshot(
  id: string,
  updates: Partial<Screenshot>
): Promise<void> {
  const screenshots = await getScreenshots();
  const index = screenshots.findIndex(s => s.id === id);

  if (index !== -1) {
    screenshots[index] = {
      ...screenshots[index],
      ...updates,
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.HISTORY]: screenshots,
    });
  }
}

/**
 * 스크린샷 설정 저장
 */
export async function saveScreenshotSettings(
  settings: ScreenshotSettings
): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: settings,
  });
}

/**
 * 스크린샷 설정 가져오기
 */
export async function getScreenshotSettings(): Promise<ScreenshotSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return (result[STORAGE_KEYS.SETTINGS] as ScreenshotSettings) || {
    defaultFormat: 'png',
    quality: 0.92,
    captureMode: 'element',
    enableAnnotations: true,
    autoDownload: false,
    includeCursor: false,
  };
}

/**
 * 스크린샷 통계 가져오기
 */
export async function getScreenshotStats(): Promise<{
  totalCount: number;
  totalSize: number;
  byFormat: Record<string, number>;
  byMode: Record<string, number>;
}> {
  const screenshots = await getScreenshots();

  const stats = {
    totalCount: screenshots.length,
    totalSize: screenshots.reduce((sum, s) => sum + (s.size || 0), 0),
    byFormat: {} as Record<string, number>,
    byMode: {} as Record<string, number>,
  };

  for (const screenshot of screenshots) {
    stats.byFormat[screenshot.format] = (stats.byFormat[screenshot.format] || 0) + 1;
    stats.byMode[screenshot.mode] = (stats.byMode[screenshot.mode] || 0) + 1;
  }

  return stats;
}

/**
 * 오래된 스크린샷 정리
 */
export async function cleanupOldScreenshots(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  const screenshots = await getScreenshots();
  const now = Date.now();
  const filtered = screenshots.filter(s => now - s.timestamp < maxAge);

  await chrome.storage.local.set({
    [STORAGE_KEYS.HISTORY]: filtered,
  });
}

/**
 * 스크린샷 검색
 */
export async function searchScreenshots(
  query: string
): Promise<Screenshot[]> {
  const screenshots = await getScreenshots();
  const lowerQuery = query.toLowerCase();

  return screenshots.filter(s =>
    s.title?.toLowerCase().includes(lowerQuery) ||
    s.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 스크린샷 태그 추가
 */
export async function addScreenshotTags(
  id: string,
  tags: string[]
): Promise<void> {
  const screenshot = await getScreenshotById(id);
  if (!screenshot) return;

  const existingTags = screenshot.tags || [];
  const newTags = [...new Set([...existingTags, ...tags])];

  await updateScreenshot(id, { tags: newTags });
}

/**
 * 스크린샷 태그 제거
 */
export async function removeScreenshotTags(
  id: string,
  tags: string[]
): Promise<void> {
  const screenshot = await getScreenshotById(id);
  if (!screenshot) return;

  const filteredTags = (screenshot.tags || []).filter(tag => !tags.includes(tag));

  await updateScreenshot(id, { tags: filteredTags });
}

/**
 * 스크린샷 즐겨찾기 토글
 */
export async function toggleScreenshotFavorite(id: string): Promise<void> {
  const screenshot = await getScreenshotById(id);
  if (!screenshot) return;

  await updateScreenshot(id, {
    isFavorite: !(screenshot.isFavorite || false),
  });
}

/**
 * 즐겨찾기 스크린샷 가져오기
 */
export async function getFavoriteScreenshots(): Promise<Screenshot[]> {
  const screenshots = await getScreenshots();
  return screenshots.filter(s => s.isFavorite);
}

/**
 * 저장소 사용량 확인
 */
export async function getStorageUsage(): Promise<{
  screenshots: number;
  totalBytes: number;
  percentage: number;
}> {
  const usage = await chrome.storage.local.getBytesInUse([STORAGE_KEYS.HISTORY]);
  const screenshots = await getScreenshots();

  // Chrome Extension 저장소 제한: ~5MB
  const maxBytes = 5 * 1024 * 1024;

  return {
    screenshots: screenshots.length,
    totalBytes: usage,
    percentage: (usage / maxBytes) * 100,
  };
}

/**
 * 스크린샷 내보내기 (JSON)
 */
export async function exportScreenshots(): Promise<string> {
  const screenshots = await getScreenshots();
  return JSON.stringify(screenshots, null, 2);
}

/**
 * 스크린샷 가져오기 (JSON)
 */
export async function importScreenshots(json: string): Promise<void> {
  try {
    const screenshots = JSON.parse(json) as Screenshot[];
    await chrome.storage.local.set({
      [STORAGE_KEYS.HISTORY]: screenshots,
    });
  } catch {
    throw new Error('Invalid screenshots data');
  }
}

/**
 * 데이터 URL을 Blob으로 변환하여 저장
 */
export async function saveScreenshotBlob(
  id: string,
  dataUrl: string
): Promise<void> {
  // IndexedDB에 대용량 데이터 저장
  const dbName = 'klic-screenshots';
  const storeName = 'images';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const blobRequest = store.put({ id, dataUrl }, id);

      blobRequest.onerror = () => reject(blobRequest.error);
      blobRequest.onsuccess = () => resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

/**
 * Blob으로 저장된 스크린샷 가져오기
 */
export async function getScreenshotBlob(id: string): Promise<string | null> {
  const dbName = 'klic-screenshots';
  const storeName = 'images';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const blobRequest = store.get(id);

      blobRequest.onerror = () => reject(blobRequest.error);
      blobRequest.onsuccess = () => {
        const result = blobRequest.result;
        resolve(result?.dataUrl || null);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

/**
 * Blob으로 저장된 스크린샷 삭제
 */
export async function deleteScreenshotBlob(id: string): Promise<void> {
  const dbName = 'klic-screenshots';
  const storeName = 'images';

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}
