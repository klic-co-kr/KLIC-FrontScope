/**
 * Storage Migration Utilities
 *
 * Storage 마이그레이션 관련 유틸리티 함수들
 */

import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../constants/defaults';
import type { GridLayoutSettings } from '../../../types/gridLayout';

/**
 * 마이그레이션 버전
 */
export const MIGRATION_VERSION = '1.0.0';

/**
 * 마이그레이션 정보 인터페이스
 */
export interface Migration {
  version: string;
  migrate: () => Promise<void>;
  description: string;
}

/**
 * 버전 정보 인터페이스
 */
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Storage 마이그레이션 실행
 */
export async function runMigrations(): Promise<void> {
  const result = await chrome.storage.local.get('gridLayoutMigrationVersion');
  const currentVersion = (result.gridLayoutMigrationVersion as string) || '0.0.0';

  if (currentVersion === MIGRATION_VERSION) {
    return; // 이미 최신 버전
  }

  console.log(`[Grid Layout Migration] Current: ${currentVersion}, Target: ${MIGRATION_VERSION}`);

  // 버전별 마이그레이션 실행
  const migrations: Migration[] = [
    {
      version: '0.9.0',
      description: 'Add keyboard shortcuts support',
      migrate: migrateFrom090,
    },
    {
      version: '1.0.0',
      description: 'Initial stable release',
      migrate: migrateTo100,
    },
  ];

  for (const { version, migrate, description } of migrations) {
    if (shouldRunMigration(currentVersion, version)) {
      console.log(`[Grid Layout Migration] Running migration to ${version}: ${description}`);
      try {
        await migrate();
        console.log(`[Grid Layout Migration] Completed migration to ${version}`);
      } catch (error) {
        console.error(`[Grid Layout Migration] Failed migration to ${version}:`, error);
        throw error;
      }
    }
  }

  // 마이그레이션 버전 업데이트
  await chrome.storage.local.set({
    gridLayoutMigrationVersion: MIGRATION_VERSION,
  });

  console.log(`[Grid Layout Migration] All migrations completed. Version: ${MIGRATION_VERSION}`);
}

/**
 * 마이그레이션 필요 여부 확인
 */
export async function needsMigration(): Promise<boolean> {
  const result = await chrome.storage.local.get('gridLayoutMigrationVersion');
  const currentVersion = result.gridLayoutMigrationVersion || '0.0.0';
  return currentVersion !== MIGRATION_VERSION;
}

/**
 * 마이그레이션 실행 가능 여부 확인
 */
function shouldRunMigration(currentVersion: string, targetVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const target = parseVersion(targetVersion);

  return (
    current.major < target.major ||
    (current.major === target.major && current.minor < target.minor)
  );
}

/**
 * 버전 파싱
 */
function parseVersion(version: string): VersionInfo {
  const parts = version.split('.').map(Number);

  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * 버전 비교
 */
export function compareVersions(v1: string, v2: string): number {
  const version1 = parseVersion(v1);
  const version2 = parseVersion(v2);

  if (version1.major !== version2.major) {
    return version1.major - version2.major;
  }
  if (version1.minor !== version2.minor) {
    return version1.minor - version2.minor;
  }
  return version1.patch - version2.patch;
}

/**
 * 0.9.0 -> 1.0.0 마이그레이션
 */
async function migrateFrom090(): Promise<void> {
  const result = await chrome.storage.local.get(null) as Record<string, unknown>;

  // 기존 데이터 변환
  if (result.gridLayoutSettings) {
    const oldSettings = result.gridLayoutSettings as Partial<GridLayoutSettings>;

    const newSettings = {
      ...DEFAULT_GRID_LAYOUT_SETTINGS,
      ...oldSettings,
      // 새로운 필드 추가
      keyboardShortcuts: oldSettings.keyboardShortcuts || {
        toggleGrid: 'Ctrl+Shift+G',
        toggleGuides: 'Ctrl+Shift+H',
        clearAll: 'Ctrl+Shift+X',
      },
      // 중첩 객체 병합
      guideLines: {
        ...DEFAULT_GRID_LAYOUT_SETTINGS.guideLines,
        ...(oldSettings.guideLines || {}),
      },
      viewport: {
        ...DEFAULT_GRID_LAYOUT_SETTINGS.viewport,
        ...(oldSettings.viewport || {}),
      },
      gridOverlay: {
        ...DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay,
        ...(oldSettings.gridOverlay || {}),
        breakpoints: {
          ...DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay.breakpoints,
          ...(oldSettings.gridOverlay?.breakpoints || {}),
        },
      },
      whitespace: {
        ...DEFAULT_GRID_LAYOUT_SETTINGS.whitespace,
        ...(oldSettings.whitespace || {}),
      },
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: newSettings,
    });

    // 기존 키 제거
    await chrome.storage.local.remove('gridLayoutSettings');
  }
}

/**
 * 1.0.0 마이그레이션
 */
async function migrateTo100(): Promise<void> {
  // 1.0.0 안정화 마이그레이션
  console.log('[Grid Layout Migration] Migrated to 1.0.0 stable release');
}

/**
 * 마이그레이션 롤백
 */
export async function rollbackMigration(targetVersion: string): Promise<void> {
  const currentVersion = MIGRATION_VERSION;

  if (compareVersions(currentVersion, targetVersion) <= 0) {
    throw new Error(`Cannot rollback to ${targetVersion} (current: ${currentVersion})`);
  }

  console.warn(`[Grid Layout Migration] Rolling back to ${targetVersion}`);

  // 타겟 버전으로 설정
  await chrome.storage.local.set({
    gridLayoutMigrationVersion: targetVersion,
  });
}

/**
 * 마이그레이션 로그 가져오기
 */
export async function getMigrationLog(): Promise<string[]> {
  const result = await chrome.storage.local.get('gridLayoutMigrationLog');
  return (result.gridLayoutMigrationLog as string[]) || [];
}

/**
 * 마이그레이션 로그 추가
 */
export async function logMigration(message: string): Promise<void> {
  const logs = await getMigrationLog();
  logs.push(`[${new Date().toISOString()}] ${message}`);

  // 최대 100개 로그 유지
  const trimmedLogs = logs.slice(-100);

  await chrome.storage.local.set({
    gridLayoutMigrationLog: trimmedLogs,
  });
}

/**
 * Storage 데이터 유효성 검사
 */
export async function validateStorageData(): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
    const settings = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as GridLayoutSettings | undefined;

    if (!settings) {
      errors.push('No settings found');
      return { isValid: false, errors };
    }

    // 필수 필드 확인
    const requiredFields = [
      'guideLines',
      'viewport',
      'gridOverlay',
      'whitespace',
      'keyboardShortcuts',
    ] as const;

    for (const field of requiredFields) {
      if (!settings[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // 타입 검증 (기본적)
    if (settings.guideLines && typeof settings.guideLines !== 'object') {
      errors.push('Invalid guideLines type');
    }

    if (settings.gridOverlay && typeof settings.gridOverlay !== 'object') {
      errors.push('Invalid gridOverlay type');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * 손상된 데이터 복구
 */
export async function repairStorageData(): Promise<boolean> {
  const validation = await validateStorageData();

  if (validation.isValid) {
    return true; // 데이터가 정상임
  }

  console.warn('[Grid Layout Storage] Found corrupted data:', validation.errors);

  try {
    // 백업에서 복구 시도
    const backupResult = await chrome.storage.local.get('gridLayoutBackup');

    if (backupResult.gridLayoutBackup) {
      console.log('[Grid Layout Storage] Restoring from backup');
      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: backupResult.gridLayoutBackup,
      });
      return true;
    }

    // 백업이 없으면 기본값으로 초기화
    console.log('[Grid Layout Storage] Resetting to defaults');
    await chrome.storage.local.set({
      [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: DEFAULT_GRID_LAYOUT_SETTINGS,
    });

    return true;
  } catch (error) {
    console.error('[Grid Layout Storage] Failed to repair data:', error);
    return false;
  }
}

/**
 * 현재 버전 확인
 */
export async function getCurrentVersion(): Promise<string> {
  const result = await chrome.storage.local.get('gridLayoutMigrationVersion');
  return (result.gridLayoutMigrationVersion as string) || '0.0.0';
}
