/**
 * Storage Sync Utilities
 *
 * Storage 동기화 관련 유틸리티 함수들
 */

import type { GridLayoutSettings } from '../../../types/gridLayout';
import { STORAGE_KEYS } from '../../../constants/storage';

/**
 * Storage 변경 리스너 타입
 */
export type StorageChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
) => void;

/**
 * Storage 변경 감지 리스너 등록
 */
export function onStorageChanged(
  callback: StorageChangeListener
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
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
 * 특정 키 변경 감지 리스너
 */
export function onKeyChanged<T = unknown>(
  key: string,
  callback: (newValue: T, oldValue: T | undefined) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName === 'local' && changes[key]) {
      callback(changes[key].newValue as T, changes[key].oldValue as T | undefined);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * 설정 동기화 (다른 탭과)
 */
export function syncSettings(settings: GridLayoutSettings): Promise<void> {
  return chrome.storage.local.set({
    [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: settings,
  });
}

/**
 * 여러 키 동기화
 */
export function syncMultipleSettings(items: Record<string, unknown>): Promise<void> {
  return chrome.storage.local.set(items);
}

/**
 * 설정 백업 생성
 */
export async function createBackup(): Promise<string> {
  const gridLayoutKeys = [
    STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
    STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
    STORAGE_KEYS.GRID_LAYOUT_OVERLAY,
    STORAGE_KEYS.GRID_LAYOUT_WHITESPACE,
    STORAGE_KEYS.GRID_LAYOUT_SNAPSHOTS,
  ];

  const result = await chrome.storage.local.get(gridLayoutKeys);
  const json = JSON.stringify(result, null, 2);

  // Base64 인코딩
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * 설정 백업 복원
 */
export async function restoreBackup(backupData: string): Promise<void> {
  try {
    const json = decodeURIComponent(escape(atob(backupData)));
    const data = JSON.parse(json);

    // 유효한 키만 복원
    const validData: Record<string, unknown> = {};
    const validKeys = [
      STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
      STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
      STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
      STORAGE_KEYS.GRID_LAYOUT_OVERLAY,
      STORAGE_KEYS.GRID_LAYOUT_WHITESPACE,
      STORAGE_KEYS.GRID_LAYOUT_SNAPSHOTS,
    ];

    for (const key of validKeys) {
      if (data[key] !== undefined) {
        validData[key] = data[key];
      }
    }

    await chrome.storage.local.set(validData);
  } catch {
    throw new Error('Invalid backup data format');
  }
}

/**
 * 설정 초기화 확인
 */
export async function isStorageEmpty(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
  return !result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS];
}

/**
 * Storage 크기 확인 (Grid Layout 관련만)
 */
export async function getGridLayoutStorageSize(): Promise<number> {
  const keys = [
    STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
    STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
    STORAGE_KEYS.GRID_LAYOUT_OVERLAY,
    STORAGE_KEYS.GRID_LAYOUT_WHITESPACE,
    STORAGE_KEYS.GRID_LAYOUT_SNAPSHOTS,
  ];

  const result = await chrome.storage.local.get(keys);
  const json = JSON.stringify(result);

  return new Blob([json]).size;
}

/**
 * Storage 초기화 (Grid Layout만)
 */
export async function clearGridLayoutStorage(): Promise<void> {
  const keys = [
    STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
    STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
    STORAGE_KEYS.GRID_LAYOUT_OVERLAY,
    STORAGE_KEYS.GRID_LAYOUT_WHITESPACE,
    STORAGE_KEYS.GRID_LAYOUT_SNAPSHOTS,
  ];

  await chrome.storage.local.remove(keys);
}

/**
 * 데이터 내보내 (다운로드)
 */
export function downloadBackup(filename?: string): Promise<void> {
  return createBackup().then(backupData => {
    const blob = new Blob([backupData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `grid-layout-backup-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/**
 * 데이터 가져오기 (파일에서)
 */
export function importBackupFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        restoreBackup(content)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * 설정 비교
 */
export interface SettingsDiff {
  added: string[];
  removed: string[];
  changed: Record<string, { oldValue: unknown; newValue: unknown }>;
}

export function compareSettings(
  oldSettings: GridLayoutSettings,
  newSettings: GridLayoutSettings
): SettingsDiff {
  const diff: SettingsDiff = {
    added: [],
    removed: [],
    changed: {},
  };

  // 모든 키 수집
  const allKeys = new Set([
    ...Object.keys(oldSettings),
    ...Object.keys(newSettings),
  ]);

  for (const key of allKeys) {
    const oldValue = (oldSettings as unknown as Record<string, unknown>)[key];
    const newValue = (newSettings as unknown as Record<string, unknown>)[key];

    if (oldValue === undefined && newValue !== undefined) {
      diff.added.push(key);
    } else if (oldValue !== undefined && newValue === undefined) {
      diff.removed.push(key);
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff.changed[key] = { oldValue, newValue };
    }
  }

  return diff;
}

/**
 * 설정 병합 (우선순위 지정)
 */
export function mergeSettingsWithPriority(
  base: GridLayoutSettings,
  override: Partial<GridLayoutSettings>,
  priority: 'base' | 'override' = 'override'
): GridLayoutSettings {
  if (priority === 'override') {
    return {
      ...base,
      ...override,
      guideLines: override.guideLines
        ? { ...base.guideLines, ...override.guideLines }
        : base.guideLines,
      viewport: override.viewport
        ? { ...base.viewport, ...override.viewport }
        : base.viewport,
      gridOverlay: override.gridOverlay
        ? {
            ...base.gridOverlay,
            ...override.gridOverlay,
            breakpoints: override.gridOverlay.breakpoints
              ? { ...base.gridOverlay.breakpoints, ...override.gridOverlay.breakpoints }
              : base.gridOverlay.breakpoints,
          }
        : base.gridOverlay,
      whitespace: override.whitespace
        ? { ...base.whitespace, ...override.whitespace }
        : base.whitespace,
      keyboardShortcuts: override.keyboardShortcuts
        ? { ...base.keyboardShortcuts, ...override.keyboardShortcuts }
        : base.keyboardShortcuts,
    };
  } else {
    return { ...base } as GridLayoutSettings;
  }
}

/**
 * 탭 간 설정 동기화 활성화
 */
export function enableTabSync(callback: (settings: GridLayoutSettings) => void): () => void {
  return onKeyChanged(STORAGE_KEYS.GRID_LAYOUT_SETTINGS, (newValue) => {
    if (newValue) {
      callback(newValue as GridLayoutSettings);
    }
  });
}
