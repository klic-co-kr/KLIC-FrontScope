/**
 * Scheduled Cleaner
 *
 * 예약어드 스토리지 클린 기능 제공
 */

import {
  clearAllLocalStorage,
  clearAllSessionStorage,
  clearAllCookies,
} from './storageCleaner';
import { STORAGE_KEYS } from '../../../constants/storage';
import type { ScheduledCleanConfig } from '../../../types/resourceNetwork';

/**
 * 기본 예약어드 클린 설정
 */
export const DEFAULT_SCHEDULED_CLEAN_CONFIG: ScheduledCleanConfig = {
  enabled: false,
  schedule: 'daily',
  lastRun: 0,
  types: [],
  preserveDomains: [],
};

/**
 * 예약어드 클린 실행
 */
export async function runScheduledClean(
  config: ScheduledCleanConfig
): Promise<{ success: boolean; cleaned: { localStorage: boolean; sessionStorage: boolean; cookies: boolean } }> {
  if (!config.enabled) {
    return { success: false, cleaned: { localStorage: false, sessionStorage: false, cookies: false } };
  }

  const result = {
    success: false,
    cleaned: { localStorage: false, sessionStorage: false, cookies: false },
  };

  try {
    for (const type of config.types) {
      switch (type) {
        case 'localStorage':
          result.cleaned.localStorage = clearAllLocalStorage();
          break;
        case 'sessionStorage':
          result.cleaned.sessionStorage = clearAllSessionStorage();
          break;
        case 'cookies':
          result.cleaned.cookies = await clearAllCookies();
          break;
      }
    }

    // Update last run time
    config.lastRun = Date.now();
    await saveScheduledCleanConfig(config);

    result.success = true;
  } catch (error) {
    console.error('Failed to run scheduled clean:', error);
  }

  return result;
}

/**
 * 설정 저장
 */
export async function saveScheduledCleanConfig(
  config: ScheduledCleanConfig
): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.RESOURCE_NETWORK_SCHEDULED_CLEAN]: config,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save scheduled clean config:', error);
    return false;
  }
}

/**
 * 설정 불러오기
 */
export async function getScheduledCleanConfig(): Promise<ScheduledCleanConfig> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(
        STORAGE_KEYS.RESOURCE_NETWORK_SCHEDULED_CLEAN
      );
      return (
        (result[STORAGE_KEYS.RESOURCE_NETWORK_SCHEDULED_CLEAN] as ScheduledCleanConfig) ||
        DEFAULT_SCHEDULED_CLEAN_CONFIG
      );
    }
    return DEFAULT_SCHEDULED_CLEAN_CONFIG;
  } catch (error) {
    console.error('Failed to load scheduled clean config:', error);
    return DEFAULT_SCHEDULED_CLEAN_CONFIG;
  }
}

/**
 * 다음 실행 시간 계산
 */
export function getNextRunTime(config: ScheduledCleanConfig): number {
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
 * 예약어드 클린이 필요한지 확인
 */
export function shouldRunScheduledClean(config: ScheduledCleanConfig): boolean {
  if (!config.enabled) return false;

  const nextRun = getNextRunTime(config);
  const lastRun = config.lastRun || 0;

  // 현재 시간이 다음 실행 시간을 지났는지 확인
  return Date.now() >= nextRun || lastRun === 0;
}

/**
 * 다음 실행까지 남은 시간 계산 (ms)
 */
export function getTimeUntilNextRun(config: ScheduledCleanConfig): number {
  if (!config.enabled) return -1;

  const lastRun = config.lastRun || 0;
  const nextRun = getNextRunTime({ ...config, lastRun });
  const timeUntil = nextRun - Date.now();

  return Math.max(0, timeUntil);
}

/**
 * 예약어드 클린 활성화/비활성화
 */
export async function toggleScheduledClean(enabled: boolean): Promise<boolean> {
  try {
    const config = await getScheduledCleanConfig();
    config.enabled = enabled;

    if (enabled && config.lastRun === 0) {
      // 처음 활성화할 때는 현재 시간을 lastRun으로 설정
      config.lastRun = Date.now();
    }

    return await saveScheduledCleanConfig(config);
  } catch (error) {
    console.error('Failed to toggle scheduled clean:', error);
    return false;
  }
}

/**
 * 스케줄 변경
 */
export async function changeSchedule(
  schedule: 'daily' | 'weekly' | 'monthly'
): Promise<boolean> {
  try {
    const config = await getScheduledCleanConfig();
    config.schedule = schedule;
    return await saveScheduledCleanConfig(config);
  } catch (error) {
    console.error('Failed to change schedule:', error);
    return false;
  }
}

/**
 * 클린할 타입 목록 업데이트
 */
export async function updateCleanTypes(
  types: ('localStorage' | 'sessionStorage' | 'cookies')[]
): Promise<boolean> {
  try {
    const config = await getScheduledCleanConfig();
    config.types = types;
    return await saveScheduledCleanConfig(config);
  } catch (error) {
    console.error('Failed to update clean types:', error);
    return false;
  }
}

/**
 * 보존 도메인 목록 업데이트
 */
export async function updatePreserveDomains(domains: string[]): Promise<boolean> {
  try {
    const config = await getScheduledCleanConfig();
    config.preserveDomains = domains;
    return await saveScheduledCleanConfig(config);
  } catch (error) {
    console.error('Failed to update preserve domains:', error);
    return false;
  }
}

/**
 * 알람 설정 (Chrome Extension Alarms API)
 */
export async function setupScheduledAlarm(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      const config = await getScheduledCleanConfig();

      if (!config.enabled) {
        await chrome.alarms.clear('scheduledClean');
        return;
      }

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

      await chrome.alarms.create('scheduledClean', {
        periodInMinutes,
      });
    }
  } catch (error) {
    console.error('Failed to setup scheduled alarm:', error);
  }
}

/**
 * 알람 제거
 */
export async function clearScheduledAlarm(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      await chrome.alarms.clear('scheduledClean');
    }
  } catch (error) {
    console.error('Failed to clear scheduled alarm:', error);
  }
}

/**
 * 예약어드 클린 상태 확인
 */
export async function getScheduledCleanStatus(): Promise<{
  enabled: boolean;
  schedule: string;
  lastRun: string;
  nextRun: string;
  types: string[];
  preserveDomains: string[];
}> {
  const config = await getScheduledCleanConfig();

  return {
    enabled: config.enabled,
    schedule: config.schedule,
    lastRun: config.lastRun ? new Date(config.lastRun).toLocaleString('ko-KR') : '실행된 적 없음',
    nextRun: config.enabled
      ? new Date(getNextRunTime(config)).toLocaleString('ko-KR')
      : '비활성화됨',
    types: config.types,
    preserveDomains: config.preserveDomains,
  };
}
