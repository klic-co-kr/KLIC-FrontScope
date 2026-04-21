/**
 * Storage Cache Utilities
 *
 * Storage 캐싱 계층 관련 유틸리티 함수들
 */

import type { GridLayoutSettings, GuideLine, ViewportState } from '../../../types/gridLayout';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * 캐시 엔트리 인터페이스
 */
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * 캐시 통계 인터페이스
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  entries: Array<{ key: string; size: number; age: number }>;
}

/**
 * 메모리 캐시 클래스
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * 캐시에 값 저장
   */
  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * 캐시에서 값 가져오기
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTL 체크
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * 캐시에 값이 있는지 확인
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // TTL 체크
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 캐시 비우기
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 특정 키 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 만료된 엔트리 정리
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * 캐시 크기
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 캐시 통계
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      entries,
    };
  }

  /**
   * 모든 키 가져오기
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 모든 값 가져오기
   */
  values(): unknown[] {
    return Array.from(this.cache.values()).map(entry => entry.data);
  }
}

// 전체 캐시 인스턴스
export const cache = new MemoryCache();

/**
 * 캐시된 설정 가져오기
 */
export async function getCachedSettings(): Promise<GridLayoutSettings | null> {
  const cached = cache.get<GridLayoutSettings>(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);

  if (cached) {
    return cached;
  }

  // Storage에서 로드
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
    const settings = (result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as GridLayoutSettings | null) || null;

    if (settings) {
      cache.set(STORAGE_KEYS.GRID_LAYOUT_SETTINGS, settings);
    }

    return settings;
  } catch (error) {
    console.error('[Cache] Failed to load settings:', error);
    return null;
  }
}

/**
 * 캐시된 설정 저장
 */
export async function setCachedSettings(settings: GridLayoutSettings): Promise<void> {
  // 캐시 업데이트
  cache.set(STORAGE_KEYS.GRID_LAYOUT_SETTINGS, settings);

  // Storage 저장
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: settings,
    });
  } catch (error) {
    console.error('[Cache] Failed to save settings:', error);
    throw error;
  }
}

/**
 * 캐시 무효화
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * 캐시 프리히트 (사전 로드)
 */
export async function warmupCache(): Promise<void> {
  const keys = [
    STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
    STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
    STORAGE_KEYS.GRID_LAYOUT_OVERLAY,
    STORAGE_KEYS.GRID_LAYOUT_WHITESPACE,
  ];

  try {
    const result = await chrome.storage.local.get(keys);

    for (const [key, value] of Object.entries(result)) {
      cache.set(key, value, 10 * 60 * 1000); // 10분 TTL
    }

    console.log('[Cache] Cache warmed up with', Object.keys(result).length, 'entries');
  } catch (error) {
    console.error('[Cache] Failed to warm up cache:', error);
  }
}

/**
 * 캐시된 가이드라인 가져오기
 */
export async function getCachedGuidelines(): Promise<GuideLine[] | null> {
  const key = STORAGE_KEYS.GRID_LAYOUT_GUIDELINES;
  const cached = cache.get<GuideLine[]>(key);

  if (cached) {
    return cached;
  }

  try {
    const result = await chrome.storage.local.get(key);
    const guidelines = (result[key] as GuideLine[] | null) || null;

    if (guidelines) {
      cache.set(key, guidelines);
    }

    return guidelines;
  } catch (error) {
    console.error('[Cache] Failed to load guidelines:', error);
    return null;
  }
}

/**
 * 캐시된 뷰포트 상태 가져오기
 */
export async function getCachedViewport(): Promise<ViewportState | null> {
  const key = STORAGE_KEYS.GRID_LAYOUT_VIEWPORT;
  const cached = cache.get<ViewportState>(key);

  if (cached) {
    return cached;
  }

  try {
    const result = await chrome.storage.local.get(key);
    const viewport = result[key] as ViewportState | null;

    if (viewport) {
      cache.set(key, viewport);
    }

    return viewport;
  } catch (error) {
    console.error('[Cache] Failed to load viewport:', error);
    return null;
  }
}

/**
 * 캐시 만료된 항목 정리 (주기적 실행 권장)
 */
export function cleanupExpiredCache(): number {
  return cache.cleanup();
}

/**
 * 주기적 정리 타이머 설정
 */
export function setupCacheCleanup(intervalMs: number = 60 * 1000): () => void {
  const timer = setInterval(() => {
    const removed = cache.cleanup();
    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}

/**
 * 캐시 상태 확인
 */
export function getCacheStatus(): {
  enabled: boolean;
  size: number;
  stats: CacheStats;
} {
  return {
    enabled: true,
    size: cache.size,
    stats: cache.getStats(),
  };
}

/**
 * 캐시 리셋 (통계 포함)
 */
export function resetCache(): void {
  cache.clear();
}

/**
 * 캐시 백업 (localStorage에)
 */
export function backupCacheToLocalStorage(): void {
  try {
    const keys = cache.keys();
    const backup: Record<string, unknown> = {};

    for (const key of keys) {
      backup[key] = cache.get(key);
    }

    localStorage.setItem('gridLayoutCacheBackup', JSON.stringify(backup));
    console.log('[Cache] Cache backed up to localStorage');
  } catch (error) {
    console.error('[Cache] Failed to backup cache:', error);
  }
}

/**
 * 캐시 복원 (localStorage에서)
 */
export function restoreCacheFromLocalStorage(): void {
  try {
    const backup = localStorage.getItem('gridLayoutCacheBackup');

    if (backup) {
      const data = JSON.parse(backup);

      for (const [key, value] of Object.entries(data)) {
        cache.set(key, value);
      }

      console.log('[Cache] Cache restored from localStorage');
    }
  } catch (error) {
    console.error('[Cache] Failed to restore cache:', error);
  }
}

/**
 * 캐시 미리가져기 (여러 키)
 */
export async function prefetchCache(keys: string[]): Promise<void> {
  try {
    const result = await chrome.storage.local.get(keys);

    for (const [key, value] of Object.entries(result)) {
      cache.set(key, value, 5 * 60 * 1000); // 5분 TTL
    }

    console.log('[Cache] Prefetched', Object.keys(result).length, 'entries');
  } catch (error) {
    console.error('[Cache] Failed to prefetch cache:', error);
  }
}
