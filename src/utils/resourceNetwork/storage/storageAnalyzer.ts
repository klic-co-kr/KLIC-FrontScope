/**
 * Storage Analyzer
 *
 * 스토리지 데이터 분석 및 정렬 기능 제공
 */

import { StorageStats, StorageItem, CookieInfo, StorageUsageAnalysis } from '../../../types/resourceNetwork';

/**
 * 크기 기준 정렬
 */
export function sortItemsBySize(items: StorageItem[], descending: boolean = true): StorageItem[] {
  return [...items].sort((a, b) => (descending ? b.size - a.size : a.size - b.size));
}

/**
 * 이름 기준 정렬
 */
export function sortItemsByName(items: StorageItem[]): StorageItem[] {
  return [...items].sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * 도메인 기준 정렬
 */
export function sortItemsByDomain(items: StorageItem[]): StorageItem[] {
  return [...items].sort((a, b) => {
    const domainA = a.domain || '';
    const domainB = b.domain || '';
    return domainA.localeCompare(domainB);
  });
}

/**
 * 대용량 항목 식별 (상위 N개)
 */
export function getLargestItems(items: StorageItem[], count: number = 10): StorageItem[] {
  return sortItemsBySize(items).slice(0, count);
}

/**
 * 중복 키 찾기
 */
export function findDuplicateKeys(items: StorageItem[]): Map<string, StorageItem[]> {
  const duplicates = new Map<string, StorageItem[]>();
  const seen = new Map<string, StorageItem[]>();

  for (const item of items) {
    const existing = seen.get(item.key);
    if (existing) {
      existing.push(item);
      duplicates.set(item.key, existing);
    } else {
      seen.set(item.key, [item]);
    }
  }

  return duplicates;
}

/**
 * 만료된 쿠키 찾기
 */
export function findExpiredCookies(cookies: CookieInfo[]): CookieInfo[] {
  const now = Date.now();
  return cookies.filter((cookie) => cookie.expiration && cookie.expiration < now);
}

/**
 * 곧 만료될 쿠키 찾기 (지정된 시간 이내)
 */
export function findExpiringSoonCookies(
  cookies: CookieInfo[],
  withinMs: number = 7 * 24 * 60 * 60 * 1000 // 기본 7일
): CookieInfo[] {
  const now = Date.now();
  const threshold = now + withinMs;

  return cookies.filter(
    (cookie) => cookie.expiration && cookie.expiration > now && cookie.expiration < threshold
  );
}

/**
 * 보안 관련 쿠키 식별
 */
export function findSecuritySensitiveCookies(cookies: CookieInfo[]): {
  secure: CookieInfo[];
  httpOnly: CookieInfo[];
  sameSite: CookieInfo[];
} {
  return {
    secure: cookies.filter((c) => c.secure),
    httpOnly: cookies.filter((c) => c.httpOnly),
    sameSite: cookies.filter((c) => c.sameSite === 'strict' || c.sameSite === 'lax'),
  };
}

/**
 * 스토리지 사용량 분석
 */
export function analyzeStorageUsage(items: StorageItem[]): StorageUsageAnalysis {
  if (items.length === 0) {
    return {
      totalItems: 0,
      totalSize: 0,
      averageItemSize: 0,
      largestItem: null,
      sizeDistribution: { small: 0, medium: 0, large: 0 },
    };
  }

  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const averageItemSize = totalSize / items.length;
  const largestItem = items.reduce((max, item) => (item.size > max.size ? item : max), items[0]);

  const sizeDistribution = {
    small: items.filter((item) => item.size < 1024).length, // < 1KB
    medium: items.filter((item) => item.size >= 1024 && item.size < 10240).length, // 1KB - 10KB
    large: items.filter((item) => item.size >= 10240).length, // > 10KB
  };

  return {
    totalItems: items.length,
    totalSize,
    averageItemSize,
    largestItem,
    sizeDistribution,
  };
}

/**
 * 전체 스토리지 통계 분석
 */
export function analyzeFullStorageStats(stats: StorageStats): {
  localStorage: StorageUsageAnalysis;
  sessionStorage: StorageUsageAnalysis;
  cookies: StorageUsageAnalysis;
  overall: {
    totalItems: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  };
} {
  const localStorageAnalysis = analyzeStorageUsage(stats.localStorage.items);
  const sessionStorageAnalysis = analyzeStorageUsage(stats.sessionStorage.items);

  // 쿠키는 StorageItem이 아니므로 별도 처리
  const cookieItems = stats.cookies.items.map((cookie) => ({
    key: cookie.name,
    value: cookie.value,
    size: cookie.size,
    type: 'cookies' as const,
    domain: cookie.domain,
  }));
  const cookiesAnalysis = analyzeStorageUsage(cookieItems);

  const totalItems =
    stats.localStorage.count + stats.sessionStorage.count + stats.cookies.count;

  const overall = {
    totalItems,
    totalSize: stats.totalSize,
    byType: {
      localStorage: { count: stats.localStorage.count, size: stats.localStorage.totalSize },
      sessionStorage: { count: stats.sessionStorage.count, size: stats.sessionStorage.totalSize },
      cookies: { count: stats.cookies.count, size: stats.cookies.totalSize },
    },
  };

  return {
    localStorage: localStorageAnalysis,
    sessionStorage: sessionStorageAnalysis,
    cookies: cookiesAnalysis,
    overall,
  };
}

/**
 * 키 패턴 분석
 */
export function analyzeKeyPatterns(items: StorageItem[]): {
  commonPrefixes: Array<{ prefix: string; count: number }>;
  commonSuffixes: Array<{ suffix: string; count: number }>;
  bySeparator: Record<string, number>;
} {
  const prefixes = new Map<string, number>();
  const suffixes = new Map<string, number>();
  const separators: Record<string, number> = {};

  for (const item of items) {
    const key = item.key;

    // 접두사 추출 (첫 번째 : 또는 - 이전)
    const colonIndex = key.indexOf(':');
    const dashIndex = key.indexOf('-');
    const prefixEnd =
      colonIndex > 0 && (dashIndex < 0 || colonIndex < dashIndex) ? colonIndex : dashIndex;

    if (prefixEnd > 0) {
      const prefix = key.slice(0, prefixEnd);
      prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
    }

    // 접미사 추출 (마지막 : 또는 - 이후)
    const lastColonIndex = key.lastIndexOf(':');
    const lastDashIndex = key.lastIndexOf('-');
    const suffixStart =
      lastColonIndex > 0 && lastColonIndex > lastDashIndex ? lastColonIndex : lastDashIndex;

    if (suffixStart >= 0 && suffixStart < key.length - 1) {
      const suffix = key.slice(suffixStart + 1);
      suffixes.set(suffix, (suffixes.get(suffix) || 0) + 1);
    }

    // 구분자 카운트
    for (const char of [':', '-', '_', '.', '/']) {
      if (key.includes(char)) {
        separators[char] = (separators[char] || 0) + 1;
      }
    }
  }

  // 상위 10개 추출
  const topPrefixes = Array.from(prefixes.entries())
    .map(([prefix, count]) => ({ prefix, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topSuffixes = Array.from(suffixes.entries())
    .map(([suffix, count]) => ({ suffix, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    commonPrefixes: topPrefixes,
    commonSuffixes: topSuffixes,
    bySeparator: separators,
  };
}

/**
 * 쿠키 도메인 분석
 */
export function analyzeCookieDomains(cookies: CookieInfo[]): {
  byDomain: Record<string, { count: number; totalSize: number }>;
  uniqueDomains: string[];
  largestByDomain: Array<{ domain: string; size: number }>;
} {
  const byDomain: Record<string, { count: number; totalSize: number }> = {};

  for (const cookie of cookies) {
    if (!byDomain[cookie.domain]) {
      byDomain[cookie.domain] = { count: 0, totalSize: 0 };
    }
    byDomain[cookie.domain].count++;
    byDomain[cookie.domain].totalSize += cookie.size;
  }

  const uniqueDomains = Object.keys(byDomain);

  const largestByDomain = Object.entries(byDomain)
    .map(([domain, data]) => ({ domain, size: data.totalSize }))
    .sort((a, b) => b.size - a.size);

  return {
    byDomain,
    uniqueDomains,
    largestByDomain,
  };
}

/**
 * 스토리지 항목 필터링
 */
export function filterStorageItems(
  items: StorageItem[],
  filters: {
    keyPattern?: RegExp;
    minSize?: number;
    maxSize?: number;
    valuePattern?: RegExp;
  } = {}
): StorageItem[] {
  return items.filter((item) => {
    if (filters.keyPattern && !filters.keyPattern.test(item.key)) {
      return false;
    }
    if (filters.minSize && item.size < filters.minSize) {
      return false;
    }
    if (filters.maxSize && item.size > filters.maxSize) {
      return false;
    }
    if (filters.valuePattern && !filters.valuePattern.test(item.value)) {
      return false;
    }
    return true;
  });
}

/**
 * 쿠키 필터링
 */
export function filterCookies(
  cookies: CookieInfo[],
  filters: {
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    expired?: boolean;
  } = {}
): CookieInfo[] {
  const now = Date.now();

  return cookies.filter((cookie) => {
    if (filters.domain && !cookie.domain.includes(filters.domain)) {
      return false;
    }
    if (filters.secure !== undefined && cookie.secure !== filters.secure) {
      return false;
    }
    if (filters.httpOnly !== undefined && cookie.httpOnly !== filters.httpOnly) {
      return false;
    }
    if (filters.sameSite && cookie.sameSite !== filters.sameSite) {
      return false;
    }
    if (filters.expired !== undefined) {
      const isExpired = cookie.expiration && cookie.expiration < now;
      if (filters.expired !== isExpired) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 스토리지 변화 감지
 */
export function detectStorageChanges(
  oldStats: StorageStats,
  newStats: StorageStats
): {
  added: StorageItem[];
  removed: StorageItem[];
  modified: Array<{ key: string; oldValue: string; newValue: string }>;
  sizeChange: number;
} {
  const added: StorageItem[] = [];
  const removed: StorageItem[] = [];
  const modified: Array<{ key: string; oldValue: string; newValue: string }> = [];

  // LocalStorage 변화 감지
  const oldKeys = new Set(oldStats.localStorage.items.map((i) => i.key));
  const newKeys = new Set(newStats.localStorage.items.map((i) => i.key));
  const oldItems = new Map(oldStats.localStorage.items.map((i) => [i.key, i]));
  const newItems = new Map(newStats.localStorage.items.map((i) => [i.key, i]));

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      added.push(newItems.get(key)!);
    } else if (oldItems.get(key)?.value !== newItems.get(key)?.value) {
      modified.push({
        key,
        oldValue: oldItems.get(key)!.value,
        newValue: newItems.get(key)!.value,
      });
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      removed.push(oldItems.get(key)!);
    }
  }

  const sizeChange = newStats.totalSize - oldStats.totalSize;

  return { added, removed, modified, sizeChange };
}
