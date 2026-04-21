/**
 * CSS Scan Storage Utilities
 *
 * CSS 스캔 저장소 유틸리티
 */

import type { CSSScanResult, CSSScanSettings } from '../../../types/cssScan';
import { CSS_SCAN_STORAGE_KEYS, DEFAULT_CSS_SCAN_SETTINGS } from '../../../constants/cssScanStorage';

/**
 * 스캔 결과 저장
 */
export async function saveScanResult(result: CSSScanResult): Promise<void> {
  const results = await getScanResults();
  results.unshift(result); // 최신 결과가 앞에 오도록

  // 최대 100개 제한
  if (results.length > 100) {
    results.pop();
  }

  await chrome.storage.local.set({
    [CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS]: results,
    [CSS_SCAN_STORAGE_KEYS.LATEST_RESULT]: result,
  });
}

/**
 * 모든 스캔 결과 가져오기
 */
export async function getScanResults(): Promise<CSSScanResult[]> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS);
  return (result[CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS] as CSSScanResult[]) || [];
}

/**
 * 최신 스캔 결과 가져오기
 */
export async function getLatestScanResult(): Promise<CSSScanResult | null> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.LATEST_RESULT);
  return (result[CSS_SCAN_STORAGE_KEYS.LATEST_RESULT] as CSSScanResult) || null;
}

/**
 * ID로 스캔 결과 가져오기
 */
export async function getScanResultById(id: string | number): Promise<CSSScanResult | null> {
  const results = await getScanResults();
  return results.find(r => r.timestamp === id) || null;
}

/**
 * 스캔 결과 삭제
 */
export async function deleteScanResult(timestamp: number): Promise<void> {
  const results = await getScanResults();
  const filtered = results.filter(r => r.timestamp !== timestamp);

  await chrome.storage.local.set({
    [CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS]: filtered,
  });
}

/**
 * 모든 스캔 결과 삭제
 */
export async function clearAllScanResults(): Promise<void> {
  await chrome.storage.local.remove([
    CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS,
    CSS_SCAN_STORAGE_KEYS.LATEST_RESULT,
  ]);
}

/**
 * 설정 저장
 */
export async function saveSettings(settings: CSSScanSettings): Promise<void> {
  await chrome.storage.local.set({
    [CSS_SCAN_STORAGE_KEYS.SETTINGS]: settings,
  });
}

/**
 * 설정 가져오기
 */
export async function getSettings(): Promise<CSSScanSettings> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_CSS_SCAN_SETTINGS, ...(result[CSS_SCAN_STORAGE_KEYS.SETTINGS] || {}) };
}

/**
 * 설정 업데이트
 */
export async function updateSettings(
  updates: Partial<CSSScanSettings>
): Promise<CSSScanSettings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };

  await saveSettings(updated);
  return updated;
}

/**
 * 즐겨찾기 요소 추가
 */
export async function addFavoriteElement(selector: string): Promise<void> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS);
  const favorites = (result[CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS] as string[]) || [];

  if (!favorites.includes(selector)) {
    favorites.push(selector);
    await chrome.storage.local.set({
      [CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS]: favorites,
    });
  }
}

/**
 * 즐겨찾기 요소 제거
 */
export async function removeFavoriteElement(selector: string): Promise<void> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS);
  const favorites = (result[CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS] as string[]) || []
    .filter((s: string) => s !== selector);

  await chrome.storage.local.set({
    [CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS]: favorites,
  });
}

/**
 * 즐겨찾기 요소 가져오기
 */
export async function getFavoriteElements(): Promise<string[]> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS);
  return (result[CSS_SCAN_STORAGE_KEYS.FAVORITED_ELEMENTS] as string[]) || [];
}

/**
 * 내보내기 기록 추가
 */
export async function addExportHistory(record: {
  format: string;
  elementCount: number;
  timestamp: number;
}): Promise<void> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY);
  const history = (result[CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY] as {
    format: string;
    elementCount: number;
    timestamp: number;
  }[]) || [];
  history.unshift(record);

  // 최대 50개 제한
  if (history.length > 50) {
    history.pop();
  }

  await chrome.storage.local.set({
    [CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY]: history,
  });
}

/**
 * 내보내기 기록 가져오기
 */
export async function getExportHistory(): Promise<
  { format: string; elementCount: number; timestamp: number }[]
> {
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY);
  return (result[CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY] as {
    format: string;
    elementCount: number;
    timestamp: number;
  }[]) || [];
}

/**
 * 내보내기 기록 삭제
 */
export async function clearExportHistory(): Promise<void> {
  await chrome.storage.local.remove(CSS_SCAN_STORAGE_KEYS.EXPORT_HISTORY);
}

/**
 * 스토리지 용량 확인
 */
export async function getStorageSize(): Promise<number> {
  const bytes = await chrome.storage.local.getBytesInUse(CSS_SCAN_STORAGE_KEYS.SCAN_RESULTS);
  return bytes;
}

/**
 * 스토리지 초기화
 */
export async function initializeStorage(): Promise<void> {
  // 설정이 없으면 기본값 저장
  const result = await chrome.storage.local.get(CSS_SCAN_STORAGE_KEYS.SETTINGS);
  if (!result[CSS_SCAN_STORAGE_KEYS.SETTINGS]) {
    await saveSettings(DEFAULT_CSS_SCAN_SETTINGS);
  }
}
