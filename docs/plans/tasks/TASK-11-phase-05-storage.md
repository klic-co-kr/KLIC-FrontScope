# Phase 5: Storage 관리

**태스크 범위**: Task #11.30 ~ #11.33 (4개)
**예상 시간**: 2시간
**의존성**: Phase 1 완료

---

## Task #11.30: 통합 Storage 훅

- **파일**: `src/hooks/gridLayout/useGridLayoutStorage.ts`
- **시간**: 45분
- **의존성**: Task #11.1, #11.2, #11.7
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { GridLayoutSettings } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';

export function useGridLayoutStorage() {
  const [settings, setSettings] = useState<GridLayoutSettings>(DEFAULT_GRID_LAYOUT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);

      if (result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS]);
      }
    } catch (error) {
      console.error('Failed to load grid layout settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: GridLayoutSettings) => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: newSettings,
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save grid layout settings:', error);
      throw error;
    }
  };

  // 설정 업데이트 (부분 업데이트 지원)
  const updateSettings = useCallback(async (updates: Partial<GridLayoutSettings>) => {
    const newSettings = {
      ...settings,
      ...updates,
      // 중첩 객체 병합
      guideLines: updates.guideLines ? { ...settings.guideLines, ...updates.guideLines } : settings.guideLines,
      viewport: updates.viewport ? { ...settings.viewport, ...updates.viewport } : settings.viewport,
      gridOverlay: updates.gridOverlay ? { ...settings.gridOverlay, ...updates.gridOverlay } : settings.gridOverlay,
      whitespace: updates.whitespace ? { ...settings.whitespace, ...updates.whitespace } : settings.whitespace,
    };

    await saveSettings(newSettings);
  }, [settings]);

  // 설정 초기화
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_GRID_LAYOUT_SETTINGS);
  }, []);

  // 설정 내보내기
  const exportSettings = useCallback(async () => {
    try {
      const json = JSON.stringify(settings, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `grid-layout-settings-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }, [settings]);

  // 설정 가져오기
  const importSettings = useCallback(async (json: string) => {
    try {
      const imported = JSON.parse(json) as GridLayoutSettings;

      // 기본 구조 검증
      if (!imported.guideLines || !imported.viewport || !imported.gridOverlay || !imported.whitespace) {
        throw new Error('Invalid settings format');
      }

      await saveSettings(imported);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    loadSettings,
  };
}
```
- **완료 조건**: Storage CRUD 동작 검증

---

## Task #11.31: Storage 동기화 유틸리티

- **파일**: `src/utils/gridLayout/storage/sync.ts`
- **시간**: 25분
- **의존성**: Task #11.30
- **상세 내용**:
```typescript
import { GridLayoutSettings } from '../../../types/gridLayout';
import { STORAGE_KEYS } from '../../../constants/storage';

/**
 * Storage 변경 감지 리스너
 */
export function onStorageChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName === 'local') {
      callback(changes);
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
 * 설정 백업 생성
 */
export async function createBackup(): Promise<string> {
  const result = await chrome.storage.local.get(null);
  const json = JSON.stringify(result, null, 2);
  return btoa(json); // Base64 인코딩
}

/**
 * 설정 백업 복원
 */
export async function restoreBackup(backupData: string): Promise<void> {
  try {
    const json = atob(backupData);
    const data = JSON.parse(json);

    await chrome.storage.local.clear();
    await chrome.storage.local.set(data);
  } catch (error) {
    throw new Error('Invalid backup data');
  }
}

/**
 * 설정 초기화 확인
 */
export async function isStorageEmpty(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
  return !result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS];
}
```

---

## Task #11.32: Storage 마이그레이션

- **파일**: `src/utils/gridLayout/storage/migration.ts`
- **시간**: 20분
- **의존성**: Task #11.30
- **상세 내용**:
```typescript
import { STORAGE_KEYS } from '../../../constants/storage';

/**
 * 마이그레이션 버전
 */
const MIGRATION_VERSION = '1.0.0';

/**
 * Storage 마이그레이션 실행
 */
export async function runMigrations(): Promise<void> {
  const result = await chrome.storage.local.get('migrationVersion');
  const currentVersion = result.migrationVersion || '0.0.0';

  if (currentVersion === MIGRATION_VERSION) {
    return; // 이미 최신 버전
  }

  // 버전별 마이그레이션 실행
  const migrations = [
    { version: '0.9.0', migrate: migrateFrom090 },
    { version: '1.0.0', migrate: migrateTo100 },
  ];

  for (const { version, migrate } of migrations) {
    if (shouldRunMigration(currentVersion, version)) {
      console.log(`Running migration to ${version}...`);
      await migrate();
    }
  }

  // 마이그레이션 버전 업데이트
  await chrome.storage.local.set({ migrationVersion: MIGRATION_VERSION });
}

function shouldRunMigration(currentVersion: string, targetVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const target = parseVersion(targetVersion);

  return current.major < target.major ||
    (current.major === target.major && current.minor < target.minor);
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

async function migrateFrom090(): Promise<void> {
  // 0.9.0 → 1.0.0 마이그레이션 로직
  const result = await chrome.storage.local.get(null);

  // 기존 데이터 변환
  if (result.gridLayoutSettings) {
    const newSettings = {
      ...result.gridLayoutSettings,
      // 새로운 필드 추가
      keyboardShortcuts: {
        toggleGrid: 'Ctrl+G',
        toggleGuides: 'Ctrl+Shift+G',
        clearAll: 'Ctrl+Shift+X',
      },
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: newSettings,
    });
  }
}

async function migrateTo100(): Promise<void> {
  // 1.0.0 마이그레이션 로직
  console.log('Migrated to 1.0.0');
}
```

---

## Task #11.33: Storage 캐싱 계층

- **파일**: `src/utils/gridLayout/storage/cache.ts`
- **시간**: 30분
- **의존성**: Task #11.30
- **상세 내용**:
```typescript
import { GridLayoutSettings } from '../../../types/gridLayout';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../../constants/defaults';

/**
 * 메모리 캐시
 */
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5분

  set(key: string, value: any): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // TTL 체크
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const cache = new MemoryCache();

/**
 * 캐시된 설정 가져오기
 */
export async function getCachedSettings(): Promise<GridLayoutSettings | null> {
  const cached = cache.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);

  if (cached) {
    return cached;
  }

  // Storage에서 로드
  const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
  const settings = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] || null;

  if (settings) {
    cache.set(STORAGE_KEYS.GRID_LAYOUT_SETTINGS, settings);
  }

  return settings;
}

/**
 * 캐시된 설정 저장
 */
export async function setCachedSettings(settings: GridLayoutSettings): Promise<void> {
  // 캐시 업데이트
  cache.set(STORAGE_KEYS.GRID_LAYOUT_SETTINGS, settings);

  // Storage 저장
  await chrome.storage.local.set({
    [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: settings,
  });
}

/**
 * 캐시 무효화
 */
export function invalidateCache(): void {
  cache.clear();
}

/**
 * 캐시预热 (사전 로드)
 */
export async function warmupCache(): Promise<void> {
  const keys = [
    STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
    STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
  ];

  const result = await chrome.storage.local.get(keys);

  for (const [key, value] of Object.entries(result)) {
    cache.set(key, value);
  }
}
```

---

**완료 후 다음 단계**: [Phase 6: React 컴포넌트](./TASK-11-phase-06-components.md)
