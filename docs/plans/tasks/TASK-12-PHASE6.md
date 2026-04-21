# Phase 6: Storage 관리

**태스크**: 4개
**예상 시간**: 1.5시간
**의존성**: Phase 1-5 완료

---

### Task #12.35: 통합 Storage 훅

- **파일**: `src/hooks/resourceNetwork/useResourceNetworkStorage.ts`
- **시간**: 30분
- **의존성**: Task #12.1, #12.2
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { ResourceNetworkSettings } from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_RESOURCE_NETWORK_SETTINGS } from '../../constants/defaults';

export function useResourceNetworkStorage() {
  const [settings, setSettings] = useState<ResourceNetworkSettings>(DEFAULT_RESOURCE_NETWORK_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS);
      if (result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]);
      }
    } catch (error) {
      console.error('Failed to load resource network settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: ResourceNetworkSettings) => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: newSettings,
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save resource network settings:', error);
      throw error;
    }
  };

  // 설정 업데이트
  const updateSettings = useCallback(async (updates: Partial<ResourceNetworkSettings>) => {
    const newSettings = {
      ...settings,
      ...updates,
      // 중첩 객체 병합
      storage: updates.storage ? { ...settings.storage, ...updates.storage } : settings.storage,
      animation: updates.animation ? { ...settings.animation, ...updates.animation } : settings.animation,
      network: updates.network ? { ...settings.network, ...updates.network } : settings.network,
      cache: updates.cache ? { ...settings.cache, ...updates.cache } : settings.cache,
    };

    await saveSettings(newSettings);
  }, [settings]);

  // 초기화
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_RESOURCE_NETWORK_SETTINGS);
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  };
}
```

---

### Task #12.36~#12.38: (추가 Storage 관련 태스크)

### Task #12.36: 데이터 내보내기

- **파일**: `src/utils/resourceNetwork/storage/dataExport.ts`
- **시간**: 20분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { ResourceNetworkSettings, StorageStats, CacheStats } from '../../types/resourceNetwork';

export interface ResourceNetworkExport {
  version: string;
  timestamp: number;
  url: string;
  settings: ResourceNetworkSettings;
  storage?: StorageStats;
  cache?: CacheStats;
}

export async function exportAllData(
  settings: ResourceNetworkSettings,
  storage?: StorageStats,
  cache?: CacheStats
): Promise<ResourceNetworkExport> {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    url: window.location.href,
    settings,
    storage,
    cache,
  };
}

export function downloadExport(data: ResourceNetworkExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resource-network-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Task #12.37: 데이터 가져오기

- **파일**: `src/utils/resourceNetwork/storage/dataImport.ts`
- **시간**: 15분
- **의존성**: Task #12.1, #12.36
- **상세 내용**:
```typescript
import { ResourceNetworkExport } from './dataExport';
import { STORAGE_KEYS } from '../../constants/storage';

export async function importData(file: File): Promise<ResourceNetworkExport> {
  const text = await file.text();
  const data: ResourceNetworkExport = JSON.parse(text);

  // 버전 확인
  if (data.version !== '1.0.0') {
    throw new Error('지원하지 않는 파일 형식입니다');
  }

  // 설정 복원
  await chrome.storage.local.set({
    [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: data.settings,
  });

  return data;
}

export async function importSettings(file: File): Promise<void> {
  const data = await importData(file);
  // 설정만 적용
  await chrome.storage.local.set({
    [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: data.settings,
  });
}
```

### Task #12.38: 데이터 마이그레이션

- **파일**: `src/utils/resourceNetwork/storage/dataMigration.ts`
- **시간**: 15분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
export interface Migration {
  version: string;
  migrate: (data: any) => Promise<any>;
}

const migrations: Migration[] = [
  {
    version: '1.0.0',
    migrate: async (data) => data,
  },
  {
    version: '1.1.0',
    migrate: async (data) => {
      // 버전 1.0.0 -> 1.1.0 마이그레이션 로직
      return {
        ...data,
        settings: {
          ...data.settings,
          cache: {
            ...data.settings.cache,
            autoCleanExpired: data.settings.cache?.autoCleanExpired ?? false,
          },
        },
      };
    },
  },
];

export async function migrateData(currentVersion: string, data: any): Promise<any> {
  let migratedData = data;
  let startMigration = false;

  for (const migration of migrations) {
    if (!startMigration && migration.version === currentVersion) {
      startMigration = true;
      continue;
    }

    if (startMigration) {
      migratedData = await migration.migrate(migratedData);
    }
  }

  return migratedData;
}

export function getLatestVersion(): string {
  return migrations[migrations.length - 1].version;
}
```

---

[Phase 7: React 컴포넌트](./TASK-12-PHASE7.md) 로 계속
