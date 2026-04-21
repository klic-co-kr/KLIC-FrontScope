/**
 * Network Analyzer
 *
 * 네트워크 요청 분석 기능 제공
 */

import { NetworkRequest, ResourceType } from '../../../types/resourceNetwork';
import { extractDomain } from '../helpers';

/**
 * 네트워크 분석 리포트
 */
export interface NetworkAnalysisReport {
  summary: {
    totalRequests: number;
    totalSize: number;
    totalDuration: number;
    avgDuration: number;
  };
  byType: Record<
    ResourceType,
    { count: number; totalSize: number; avgDuration: number }
  >;
  byDomain: Record<string, { count: number; totalSize: number }>;
  issues: NetworkIssue[];
  recommendations: string[];
}

/**
 * 네트워크 이슈
 */
export interface NetworkIssue {
  type: 'slow' | 'failed' | 'large' | 'redirect' | 'not-compressed' | 'no-cache';
  severity: 'low' | 'medium' | 'high';
  request: NetworkRequest;
  message: string;
}

/**
 * 네트워크 요청 분석
 */
export function analyzeNetworkRequests(
  requests: NetworkRequest[]
): NetworkAnalysisReport {
  const issues: NetworkIssue[] = [];
  const recommendations: string[] = [];
  const byType: Record<
    string,
    { count: number; totalSize: number; avgDuration: number }
  > = {};
  const byDomain: Record<string, { count: number; totalSize: number }> = {};

  let totalSize = 0;
  let totalDuration = 0;

  for (const req of requests) {
    // 타입별 집계
    if (!byType[req.type]) {
      byType[req.type] = { count: 0, totalSize: 0, avgDuration: 0 };
    }
    byType[req.type].count++;
    byType[req.type].totalSize += req.size;

    // 도메인별 집계
    const domain = extractDomain(req.url);
    if (!byDomain[domain]) {
      byDomain[domain] = { count: 0, totalSize: 0 };
    }
    byDomain[domain].count++;
    byDomain[domain].totalSize += req.size;

    totalSize += req.size;
    totalDuration += req.duration;

    // 이슈 감지
    if (req.status >= 400 || req.status === 0) {
      issues.push({
        type: 'failed',
        severity: req.status >= 500 || req.status === 0 ? 'high' : 'medium',
        request: req,
        message: `요청 실패: ${req.status} ${req.statusText}`,
      });
    }

    if (req.duration > 3000) {
      issues.push({
        type: 'slow',
        severity: req.duration > 5000 ? 'high' : 'medium',
        request: req,
        message: `느린 응답: ${Math.round(req.duration)}ms`,
      });
    }

    if (req.size > 1024 * 1024) {
      // 1MB 이상
      issues.push({
        type: 'large',
        severity: req.size > 5 * 1024 * 1024 ? 'high' : 'medium',
        request: req,
        message: `대용량 리소스: ${formatBytes(req.size)}`,
      });
    }

    if (req.status >= 300 && req.status < 400) {
      issues.push({
        type: 'redirect',
        severity: 'low',
        request: req,
        message: `리다이렉트: ${req.status}`,
      });
    }

    // 압축 확인 (추정) - size 필드가 단순화되어 스킵
    // 실제 압축 확인은 헤더 분석이 필요하지만 간소화됨

    // 캐시 확인

    // 캐시 확인
    if (!req.cached && req.type !== 'document') {
      const responseHeaders = typeof req.headers === 'object' && req.headers !== null && !Array.isArray(req.headers)
        ? (req.headers as { response?: Record<string, string> }).response
        : undefined;
      const hasCacheHeader = responseHeaders
        ? Object.values(responseHeaders).some((v) => v.toLowerCase().includes('cache-control'))
        : false;
      if (!hasCacheHeader) {
        issues.push({
          type: 'no-cache',
          severity: 'low',
          request: req,
          message: '캐시 헤더 없음',
        });
      }
    }
  }

  // 평균 계산
  for (const type in byType) {
    if (byType[type].count > 0) {
      byType[type].avgDuration =
        requests
          .filter((r) => r.type === type)
          .reduce((sum, r) => sum + r.duration, 0) / byType[type].count;
    }
  }

  // 권장사항 생성
  if (issues.some((i) => i.type === 'not-compressed')) {
    recommendations.push(
      '텍스트 리소스 (JS, CSS, JSON)의 압축을 활성화하세요 (gzip, brotli)'
    );
  }

  if (issues.some((i) => i.type === 'large' && i.request.type === 'image')) {
    recommendations.push(
      '이미지를 WebP 형식으로 변환하거나 적절한 크기로 최적화하세요'
    );
  }

  if (issues.some((i) => i.type === 'slow')) {
    recommendations.push(
      '느린 요청의 CDN 사용 또는 캐싱 전략을 고려하세요'
    );
  }

  if (issues.filter((i) => i.type === 'failed').length > 5) {
    recommendations.push(
      '실패한 요청이 많습니다. 서버 상태를 확인하거나 재시도 로직을 추가하세요'
    );
  }

  if (requests.length > 100) {
    recommendations.push(
      '요청 수가 많습니다. 리소스 병합, 코드 스플리팅, 지연 로딩을 고려하세요'
    );
  }

  const avgDuration = requests.length > 0 ? totalDuration / requests.length : 0;

  return {
    summary: {
      totalRequests: requests.length,
      totalSize,
      totalDuration,
      avgDuration,
    },
    byType: byType as Record<
      ResourceType,
      { count: number; totalSize: number; avgDuration: number }
    >,
    byDomain,
    issues,
    recommendations,
  };
}

/**
 * 도메인별 요청 그룹화
 */
export function groupRequestsByDomain(
  requests: NetworkRequest[]
): Record<string, NetworkRequest[]> {
  const grouped: Record<string, NetworkRequest[]> = {};

  for (const req of requests) {
    const domain = extractDomain(req.url);
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(req);
  }

  return grouped;
}

/**
 * 타입별 요청 그룹화
 */
export function groupRequestsByType(
  requests: NetworkRequest[]
): Record<ResourceType, NetworkRequest[]> {
  const grouped: Partial<Record<ResourceType, NetworkRequest[]>> = {};

  for (const req of requests) {
    if (!grouped[req.type]) {
      grouped[req.type] = [];
    }
    grouped[req.type]!.push(req);
  }

  return grouped as Record<ResourceType, NetworkRequest[]>;
}

/**
 * 타임라인 생성
 */
export function createTimeline(
  requests: NetworkRequest[]
): Array<{ time: number; request: NetworkRequest }> {
  return requests
    .filter((req) => (req.timing?.start ?? 0) >= 0)
    .map((req) => ({
      time: req.timing?.start ?? 0,
      request: req,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * 워터폴 생성 (차트용)
 */
export interface WaterfallEntry {
  id: string;
  url: string;
  type: ResourceType;
  start: number;
  duration: number;
  dns: number;
  tcp: number;
  ttfb: number;
  download: number;
  color: string;
}

export function createWaterfall(requests: NetworkRequest[]): WaterfallEntry[] {
  return requests
    .filter((req) => req.duration > 0)
    .map((req) => ({
      id: req.id,
      url: req.url,
      type: req.type,
      start: req.timing?.start ?? 0,
      duration: req.duration,
      dns: req.timing?.dns ?? 0,
      tcp: req.timing?.tcp ?? 0,
      ttfb: req.timing?.ttfb ?? 0,
      download: req.timing?.download ?? 0,
      color: getTypeColor(req.type),
    }))
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
}

/**
 * 리소스 타입별 색상
 */
function getTypeColor(type: ResourceType): string {
  const colors: Record<ResourceType, string> = {
    document: '#3B82F6',
    stylesheet: '#EC4899',
    script: '#F59E0B',
    image: '#10B981',
    font: '#8B5CF6',
    xhr: '#06B6D4',
    fetch: '#0EA5E9',
    websocket: '#6366F1',
    other: '#6B7280',
  };
  return colors[type];
}

/**
 * 필터링
 */
export function filterRequests(
  requests: NetworkRequest[],
  filters: {
    type?: ResourceType;
    status?: number;
    minDuration?: number;
    maxDuration?: number;
    failed?: boolean;
    searchQuery?: string;
  }
): NetworkRequest[] {
  return requests.filter((req) => {
    if (filters.type && req.type !== filters.type) return false;
    if (filters.status && req.status !== filters.status) return false;
    if (filters.minDuration && req.duration < filters.minDuration) return false;
    if (filters.maxDuration && req.duration > filters.maxDuration) return false;
    if (filters.failed && req.status >= 200 && req.status < 300) return false;
    if (
      filters.searchQuery &&
      !req.url.toLowerCase().includes(filters.searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

/**
 * 느린 요청 식별
 */
export function getSlowRequests(
  requests: NetworkRequest[],
  threshold: number = 2000
): NetworkRequest[] {
  return requests.filter((req) => req.duration > threshold);
}

/**
 * 실패한 요청 식별
 */
export function getFailedRequests(requests: NetworkRequest[]): NetworkRequest[] {
  return requests.filter((req) => req.status >= 400 || req.status === 0);
}

/**
 * 대용량 요청 식별
 */
export function getLargeRequests(
  requests: NetworkRequest[],
  threshold: number = 1024 * 1024 // 1MB
): NetworkRequest[] {
  return requests.filter((req) => req.size > threshold);
}

/**
 * 캐시 미스 요청 식별
 */
export function getCacheMisses(requests: NetworkRequest[]): NetworkRequest[] {
  return requests.filter((req) => !req.cached);
}

/**
 * 요청 크기 포맷
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 성능 점수 계산
 */
export function calculatePerformanceScore(
  report: NetworkAnalysisReport
): {
  score: number;
  grade: string;
  color: string;
} {
  let score = 100;

  // 실패한 요청 감점
  const failedCount = report.issues.filter((i) => i.type === 'failed').length;
  score -= failedCount * 10;

  // 느린 요청 감점
  const slowCount = report.issues.filter((i) => i.type === 'slow').length;
  score -= slowCount * 5;

  // 대용량 요청 감점
  const largeCount = report.issues.filter((i) => i.type === 'large').length;
  score -= largeCount * 3;

  // 압축 안된 리소스 감점
  const noCompressionCount = report.issues.filter(
    (i) => i.type === 'not-compressed'
  ).length;
  score -= noCompressionCount * 2;

  // 요청 수 감점
  if (report.summary.totalRequests > 100) {
    score -= (report.summary.totalRequests - 100) * 0.5;
  }

  score = Math.max(0, Math.min(100, score));

  let grade = 'A';
  let color = '#10B981';

  if (score < 60) {
    grade = 'F';
    color = '#DC2626';
  } else if (score < 70) {
    grade = 'D';
    color = '#EF4444';
  } else if (score < 80) {
    grade = 'C';
    color = '#F59E0B';
  } else if (score < 90) {
    grade = 'B';
    color = '#3B82F6';
  }

  return { score, grade, color };
}
