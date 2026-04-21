/**
 * Cache Integration
 *
 * 네트워크와 캐시 데이터 연동 기능
 */

import { NetworkRequest, CacheEntry, CacheStats } from '../../../types/resourceNetwork';
import { extractDomain } from '../helpers';

/**
 * 네트워크 요청을 캐시 엔트리로 변환
 */
export function networkRequestToCacheEntry(
  request: NetworkRequest
): CacheEntry {
  // Cache-Control 헤더에서 max-age 추출
  const responseHeaders = typeof request.headers === 'object' && request.headers !== null && !Array.isArray(request.headers)
    ? (request.headers as { response?: Record<string, string> }).response
    : undefined;

  const cacheControl = responseHeaders?.['cache-control'] || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : undefined;

  // ETag
  const etag = responseHeaders?.['etag'];

  // Last-Modified
  const lastModifiedStr = responseHeaders?.['last-modified'];
  const lastModified = lastModifiedStr
    ? new Date(lastModifiedStr).getTime()
    : undefined;

  return {
    url: request.url,
    type: request.type,
    size: typeof request.size === 'number' ? request.size : (request.size as { transferred?: number }).transferred ?? 0,
    lastModified: lastModified || Date.now(),
    expires: maxAge ? Date.now() + maxAge : undefined,
    etag,
  };
}

/**
 * 여러 네트워크 요청을 캐스 통계로 변환
 */
export function networkRequestsToCacheStats(
  requests: NetworkRequest[]
): CacheStats {
  const cacheEntries = requests
    .filter((req) => req.status >= 200 && req.status < 300)
    .map(networkRequestToCacheEntry);

  const expiredEntries = cacheEntries.filter((entry) => {
    if (!entry.expires) return false;
    return entry.expires < Date.now();
  });

  const cacheHits = requests.filter((req) => req.cacheHit).length;

  return {
    totalEntries: cacheEntries.length,
    totalSize: cacheEntries.reduce((sum, entry) => sum + entry.size, 0),
    hitRate: requests.length > 0 ? cacheHits / requests.length : 0,
    entries: cacheEntries,
    expiredEntries,
  };
}

/**
 * 캐시 가능한 응답 식별
 */
export function isCacheable(request: NetworkRequest): boolean {
  // GET 요청만 캐시 가능
  if (request.method !== 'GET') return false;

  // 성공한 응답만 캐시
  if (request.status < 200 || request.status >= 300) return false;

  // Cache-Control 헤더 확인
  const responseHeaders = typeof request.headers === 'object' && request.headers !== null && !Array.isArray(request.headers)
    ? (request.headers as { response?: Record<string, string> }).response
    : undefined;
  const cacheControl = responseHeaders?.['cache-control'] || '';

  // no-store 또는 private인 경우 캐시하지 않음
  if (
    cacheControl.includes('no-store') ||
    cacheControl.includes('private')
  ) {
    return false;
  }

  // max-age=0인 경우 캐시하지 않음
  if (cacheControl.includes('max-age=0')) {
    return false;
  }

  return true;
}

/**
 * 캐시 가능한 요청 필터링
 */
export function getCacheableRequests(requests: NetworkRequest[]): NetworkRequest[] {
  return requests.filter(isCacheable);
}

/**
 * 캐시 전략 추천
 */
export function recommendCacheStrategy(
  request: NetworkRequest
): {
  strategy: 'aggressive' | 'moderate' | 'minimal' | 'none';
  reason: string;
  suggestedHeaders: Record<string, string>;
} {
  if (request.method !== 'GET') {
    return {
      strategy: 'none',
      reason: 'GET 요청만 캐시 가능',
      suggestedHeaders: {},
    };
  }

  const url = request.url;
  const type = request.type;

  // 정적 리소스 (이미지, 폰트, CSS, JS)
  if (['image', 'font', 'stylesheet', 'script'].includes(type)) {
    return {
      strategy: 'aggressive',
      reason: '정적 리소스는 장기 캐싱 권장',
      suggestedHeaders: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    };
  }

  // API 요청
  if (url.includes('/api/')) {
    return {
      strategy: 'minimal',
      reason: 'API 응답은 단기 캐싱 권장',
      suggestedHeaders: {
        'Cache-Control': 'private, max-age=60',
      },
    };
  }

  // HTML 문서
  if (type === 'document') {
    return {
      strategy: 'moderate',
      reason: 'HTML 문서는 중기 캐싱 권장',
      suggestedHeaders: {
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    };
  }

  // 기본
  return {
    strategy: 'moderate',
    reason: '표준 캐싱 전략',
    suggestedHeaders: {
      'Cache-Control': 'public, max-age=86400',
    },
  };
}

/**
 * 캐시 헤더 생성
 */
export function generateCacheHeaders(
  strategy: 'aggressive' | 'moderate' | 'minimal',
  options: {
    immutable?: boolean;
    mustRevalidate?: boolean;
    staleWhileRevalidate?: number;
  } = {}
): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (strategy) {
    case 'aggressive':
      headers['Cache-Control'] = `public, max-age=31536000${
        options.immutable ? ', immutable' : ''
      }`;
      break;

    case 'moderate':
      headers['Cache-Control'] = `public, max-age=86400${
        options.mustRevalidate ? ', must-revalidate' : ''
      }`;
      if (options.staleWhileRevalidate) {
        headers['Cache-Control'] += `, stale-while-revalidate=${options.staleWhileRevalidate}`;
      }
      break;

    case 'minimal':
      headers['Cache-Control'] = 'private, max-age=60';
      break;
  }

  return headers;
}

/**
 * 캐시 히트율 계산 (도메인별)
 */
export function calculateCacheHitRateByDomain(
  requests: NetworkRequest[]
): Record<string, { hits: number; misses: number; rate: number }> {
  const byDomain: Record<
    string,
    { hits: number; misses: number; rate: number }
  > = {};

  for (const req of requests) {
    const domain = extractDomain(req.url);

    if (!byDomain[domain]) {
      byDomain[domain] = { hits: 0, misses: 0, rate: 0 };
    }

    if (req.cacheHit) {
      byDomain[domain].hits++;
    } else {
      byDomain[domain].misses++;
    }
  }

  // 히트율 계산
  for (const domain in byDomain) {
    const total = byDomain[domain].hits + byDomain[domain].misses;
    byDomain[domain].rate = total > 0 ? byDomain[domain].hits / total : 0;
  }

  return byDomain;
}

/**
 * 캐시 가능성 점수 계산
 */
export function calculateCacheabilityScore(
  requests: NetworkRequest[]
): {
  total: number;
  cacheable: number;
  actuallyCached: number;
  score: number; // 0-100
  recommendations: string[];
} {
  const total = requests.length;
  const cacheable = getCacheableRequests(requests).length;
  const actuallyCached = requests.filter((req) => req.cacheHit).length;

  // 점수 계산
  let score = 0;
  if (total > 0) {
    const cacheableRatio = cacheable / total;
    const cachedRatio = actuallyCached / total;

    score = Math.round(
      (cacheableRatio * 50 + cachedRatio * 50)
    );
  }

  // 권장사항
  const recommendations: string[] = [];

  const uncacheableStatic = requests.filter(
    (req) =>
      ['image', 'font', 'stylesheet', 'script'].includes(req.type) &&
      !isCacheable(req)
  );

  if (uncacheableStatic.length > 0) {
    recommendations.push(
      `${uncacheableStatic.length}개의 정적 리소스가 캐시 불가능합니다. 캐시 헤더를 추가하세요.`
    );
  }

  if (cacheable > 0 && actuallyCached === 0) {
    recommendations.push('캐시 가능한 리소스가 있지만 캐시 히트가 없습니다. 캐시 설정을 확인하세요.');
  }

  if (cacheable / total < 0.5) {
    recommendations.push(
      '대부분의 리소스가 캐시 불가능합니다. 정적 리소스 분리를 고려하세요.'
    );
  }

  return {
    total,
    cacheable,
    actuallyCached,
    score,
    recommendations,
  };
}

/**
 * CDN 캐시 헤더 최적화 제안
 */
export function optimizeForCDN(requests: NetworkRequest[]): {
  optimizedRequests: Array<{ url: string; headers: Record<string, string> }>;
  summary: string;
} {
  const staticRequests = requests.filter((req) =>
    ['image', 'font', 'stylesheet', 'script'].includes(req.type)
  );

  const optimizedRequests = staticRequests.map((req) => {
    const recommendation = recommendCacheStrategy(req);

    return {
      url: req.url,
      headers: recommendation.suggestedHeaders,
    };
  });

  const summary = `${staticRequests.length}개의 정적 리소스에 대한 CDN 캐시 헤더 최적화를 제안합니다.`;

  return {
    optimizedRequests,
    summary,
  };
}

/**
 * 캐시 만료 시간 계산
 */
export function calculateExpirationTime(
  request: NetworkRequest
): Date | null {
  // Cache-Control: max-age
  const responseHeaders = typeof request.headers === 'object' && request.headers !== null && !Array.isArray(request.headers)
    ? (request.headers as { response?: Record<string, string> }).response
    : undefined;

  const cacheControl = responseHeaders?.['cache-control'] || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);

  if (maxAgeMatch) {
    const maxAge = parseInt(maxAgeMatch[1]) * 1000;
    return new Date(Date.now() + maxAge);
  }

  // Expires 헤더
  const expires = responseHeaders?.['expires'];
  if (expires) {
    const expiresDate = new Date(expires);
    if (!isNaN(expiresDate.getTime())) {
      return expiresDate;
    }
  }

  return null;
}

/**
 * 캐시 유효기간 분석
 */
export function analyzeCacheLifetimes(
  requests: NetworkRequest[]
): {
  short: number; // < 1 hour
  medium: number; // 1 hour - 1 day
  long: number; // > 1 day
  unknown: number;
} {
  let short = 0;
  let medium = 0;
  let long = 0;
  let unknown = 0;

  for (const req of requests) {
    const expiration = calculateExpirationTime(req);

    if (!expiration) {
      unknown++;
      continue;
    }

    const ttl = expiration.getTime() - Date.now();

    if (ttl < 60 * 60 * 1000) {
      // < 1 hour
      short++;
    } else if (ttl < 24 * 60 * 60 * 1000) {
      // < 1 day
      medium++;
    } else {
      // >= 1 day
      long++;
    }
  }

  return { short, medium, long, unknown };
}
