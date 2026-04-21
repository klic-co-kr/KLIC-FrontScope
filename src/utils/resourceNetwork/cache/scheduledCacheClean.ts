/**
 * Scheduled Cache Cleaner
 *
 * 주기적 캐시 정리 스케줄링
 */

import { clearExpiredCache } from './cacheAnalyzer';

/**
 * 예약어드 캐시 정리 설정
 */
export interface ScheduledCacheCleanConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly';
  lastRun: number;
  preservePatterns: string[];
  autoCleanExpired: boolean;
}

/**
 * 기본 설정
 */
const DEFAULT_CONFIG: ScheduledCacheCleanConfig = {
  enabled: false,
  schedule: 'daily',
  lastRun: 0,
  preservePatterns: [],
  autoCleanExpired: false,
};

/**
 * 설정 저장
 */
export async function saveScheduledCacheCleanConfig(
  config: ScheduledCacheCleanConfig
): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        scheduledCacheClean: config,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save scheduled cache clean config:', error);
    return false;
  }
}

/**
 * 설정 불러오기
 */
export async function getScheduledCacheCleanConfig(): Promise<ScheduledCacheCleanConfig> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('scheduledCacheClean');
      return (result.scheduledCacheClean as ScheduledCacheCleanConfig | undefined) || DEFAULT_CONFIG;
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Failed to load scheduled cache clean config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 예약어드 캐시 정리 실행
 */
export async function runScheduledCacheClean(): Promise<{
  success: boolean;
  clearedCount: number;
  details: string;
}> {
  try {
    const config = await getScheduledCacheCleanConfig();

    if (!config.enabled) {
      return {
        success: false,
        clearedCount: 0,
        details: '예약어드 정리가 비활성화되어 있습니다',
      };
    }

    let clearedCount = 0;

    // 만료된 항목 정리
    if (config.autoCleanExpired) {
      clearedCount += await clearExpiredCache();
    }

    // 설정 업데이트
    config.lastRun = Date.now();
    await saveScheduledCacheCleanConfig(config);

    return {
      success: true,
      clearedCount,
      details: `${clearedCount}개의 캐시 항목이 정리되었습니다`,
    };
  } catch (error) {
    console.error('Failed to run scheduled cache clean:', error);
    return {
      success: false,
      clearedCount: 0,
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 다음 실행 시간 계산
 */
export function getNextRunTime(config: ScheduledCacheCleanConfig): number {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  switch (config.schedule) {
    case 'daily':
      return now + dayMs;
    case 'weekly':
      return now + dayMs * 7;
    case 'monthly':
      return now + dayMs * 30;
    default:
      return now + dayMs;
  }
}

/**
 * 실행이 필요한지 확인
 */
export async function shouldRunScheduledClean(): Promise<boolean> {
  const config = await getScheduledCacheCleanConfig();

  if (!config.enabled) {
    return false;
  }

  const nextRun = getNextRunTime(config);
  return Date.now() >= nextRun || config.lastRun === 0;
}

/**
 * 알람 설정 (Chrome Extension Alarms API)
 */
export async function setupScheduledAlarm(): Promise<void> {
  try {
    const config = await getScheduledCacheCleanConfig();

    if (typeof chrome !== 'undefined' && chrome.alarms) {
      // 기존 알람 제거
      await chrome.alarms.clear('scheduledCacheClean');

      if (config.enabled) {
        // 알람 주기 계산 (분 단위)
        let periodInMinutes: number;
        switch (config.schedule) {
          case 'daily':
            periodInMinutes = 24 * 60;
            break;
          case 'weekly':
            periodInMinutes = 7 * 24 * 60;
            break;
          case 'monthly':
            periodInMinutes = 30 * 24 * 60;
            break;
          default:
            periodInMinutes = 24 * 60;
        }

        await chrome.alarms.create('scheduledCacheClean', {
          periodInMinutes,
        });
      }
    }
  } catch (error) {
    console.error('Failed to setup scheduled alarm:', error);
  }
}

/**
 * 알람 리스너 설정 (Background Script용)
 */
export function setupScheduledAlarmListener(
  callback: () => void | Promise<void>
): void {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'scheduledCacheClean') {
        callback();
      }
    });
  }
}

/**
 * 예약어드 정리 상태 정보
 */
export async function getScheduledCleanStatus(): Promise<{
  enabled: boolean;
  schedule: string;
  lastRun: string;
  nextRun: string;
  preservePatterns: string[];
  autoCleanExpired: boolean;
}> {
  const config = await getScheduledCacheCleanConfig();

  return {
    enabled: config.enabled,
    schedule: config.schedule,
    lastRun: config.lastRun
      ? new Date(config.lastRun).toLocaleString('ko-KR')
      : '실행된 적 없음',
    nextRun: config.enabled
      ? new Date(getNextRunTime(config)).toLocaleString('ko-KR')
      : '비활성화됨',
    preservePatterns: config.preservePatterns,
    autoCleanExpired: config.autoCleanExpired,
  };
}

/**
 * 설정 업데이트
 */
export async function updateScheduledCacheCleanConfig(
  updates: Partial<ScheduledCacheCleanConfig>
): Promise<boolean> {
  const config = await getScheduledCacheCleanConfig();
  const newConfig = { ...config, ...updates };
  const saved = await saveScheduledCacheCleanConfig(newConfig);

  if (saved) {
    // 알람 재설정
    await setupScheduledAlarm();
  }

  return saved;
}
