/**
 * Data Migration
 *
 * 데이터 마이그레이션 기능 제공
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
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
            ...data.settings?.cache,
            autoCleanExpired: data.settings?.cache?.autoCleanExpired ?? false,
            showExpired: data.settings?.cache?.showExpired ?? true,
          },
        },
      };
    },
  },
  {
    version: '1.2.0',
    migrate: async (data) => {
      // 버전 1.1.0 -> 1.2.0 마이그레이션 로직
      return {
        ...data,
        settings: {
          ...data.settings,
          network: {
            ...data.settings?.network,
            captureRequests: data.settings?.network?.captureRequests ?? true,
          },
          animation: {
            ...data.settings?.animation,
            pauseAll: data.settings?.animation?.pauseAll ?? false,
          },
        },
      };
    },
  },
];

export async function migrateData(
  currentVersion: string,
  data: any
): Promise<{ data: any; migrationsApplied: string[] }> {
  let migratedData = data;
  const migrationsApplied: string[] = [];
  let startMigration = false;

  for (const migration of migrations) {
    if (!startMigration && migration.version === currentVersion) {
      startMigration = true;
      continue;
    }

    if (startMigration) {
      migratedData = await migration.migrate(migratedData);
      migrationsApplied.push(migration.version);
    }
  }

  return { data: migratedData, migrationsApplied };
}

export function getLatestVersion(): string {
  return migrations[migrations.length - 1].version;
}

export function getAllVersions(): string[] {
  return migrations.map((m) => m.version);
}

/**
 * 데이터 버전 확인
 */
export function getDataVersion(data: any): string {
  if (data.version && typeof data.version === 'string') {
    return data.version;
  }
  return '1.0.0'; // 기본 버전
}

/**
 * 마이그레이션이 필요한지 확인
 */
export function needsMigration(data: any): boolean {
  const currentVersion = getDataVersion(data);
  const latestVersion = getLatestVersion();

  // 버전 비교 (간단 문자열 비교)
  return currentVersion !== latestVersion;
}

/**
 * 마이그레이션 건너뛰기 수 계산
 */
export function countPendingMigrations(currentVersion: string): number {
  let count = 0;
  let foundCurrent = false;

  for (const migration of migrations) {
    if (!foundCurrent && migration.version === currentVersion) {
      foundCurrent = true;
    } else if (foundCurrent) {
      count++;
    }
  }

  return count;
}

/**
 * 롤백 마이그레이션 (미래 호환성)
 */
export async function rollbackData(
  data: any,
  targetVersion: string
): Promise<any> {
  // 현재 버전에서 타겟 버전으로 롤백
  // 이것은 실제로는 데이터의 변화를 추적해야 하므로
  // 여기서는 간단히 현재 데이터를 반환하는 것으로 구현
  // 실제 환경에서는 마이그레이션 히스토리를 저장해야 함

  const targetMigration = migrations.find((m) => m.version === targetVersion);

  if (targetMigration) {
    // 역마이그레이션 로직이 필요하지만 여기서는 단순화
    return {
      ...data,
      version: targetVersion,
    };
  }

  return data;
}

/**
 * 마이그레이션 안전성 검사
 */
export function validateMigrationData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('데이터가 객체가 아닙니다');
    return { valid: false, errors };
  }

  if (!data.settings && !data.storage && !data.cache) {
    errors.push('유효한 데이터 구조가 아닙니다');
  }

  if (data.settings && typeof data.settings !== 'object') {
    errors.push('설정이 객체가 아닙니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
