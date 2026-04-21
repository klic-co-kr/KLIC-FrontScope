# Phase 4: 네트워크 요청 분석

**태스크**: 8개
**예상 시간**: 3.5시간
**의존성**: Phase 1-3 완료

---

### Task #12.21: 네트워크 모니터링 시작

- **파일**: `src/utils/resourceNetwork/network/networkMonitor.ts`
- **시간**: 30분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { NetworkRequest, ResourceType, NetworkStats } from '../../../types/resourceNetwork';
import { extractDomain } from '../helpers';

/**
 * 네트워크 요청 모니터
 */
export class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  /**
   * 모니터링 시작
   */
  start(): void {
    if (this.isMonitoring) return;

    // Performance Observer 사용
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.handleResourceEntry(entry as PerformanceResourceTiming);
          } else if (entry.entryType === 'navigation') {
            this.handleNavigationEntry(entry as PerformanceNavigationTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['resource', 'navigation'] });
      this.observers.push(observer);
    }

    // XMLHttpRequest 오버라이드
    this.overrideXHR();

    // Fetch API 오버라이드
    this.overrideFetch();

    this.isMonitoring = true;
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    this.isMonitoring = false;
  }

  /**
   * 리소스 엔트리 처리
   */
  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const request: NetworkRequest = {
      id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: entry.name,
      method: 'GET',
      type: this.getResourceType(entry.name),
      status: 200,
      statusText: 'OK',
      duration: entry.duration,
      size: {
        transferred: entry.transferSize,
        uncompressed: entry.decodedBodySize,
      },
      timing: {
        start: entry.startTime,
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ttfb: entry.responseStart - entry.requestStart,
        download: entry.responseEnd - entry.responseStart,
      },
      headers: {
        request: {},
        response: {},
      },
      cacheHit: entry.transferSize === 0,
      fromCache: entry.transferSize === 0,
    };

    this.requests.push(request);
  }

  /**
   * 네비게이션 엔트리 처리
   */
  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const request: NetworkRequest = {
      id: `navigation-${Date.now()}`,
      url: window.location.href,
      method: 'GET',
      type: 'document',
      status: 200,
      statusText: 'OK',
      duration: entry.loadEventEnd - entry.fetchStart,
      size: {
        transferred: entry.transferSize,
        uncompressed: entry.decodedBodySize,
      },
      timing: {
        start: entry.fetchStart,
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        ttfb: entry.responseStart - entry.requestStart,
        download: entry.responseEnd - entry.responseStart,
      },
      headers: {
        request: {},
        response: {},
      },
      cacheHit: false,
      fromCache: false,
    };

    this.requests.push(request);
  }

  /**
   * 리소스 타입 결정
   */
  private getResourceType(url: string): ResourceType {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'css': return 'stylesheet';
      case 'js':
      case 'mjs': return 'script';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'ico': return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
      case 'eot': return 'font';
      default:
        if (url.includes('/api/') || url.includes('/xhr/')) return 'xhr';
        if (url.startsWith('ws://') || url.startsWith('wss://')) return 'websocket';
        return 'other';
    }
  }

  /**
   * XMLHttpRequest 오버라이드
   */
  private overrideXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(...args) {
      (this as any)._method = args[0];
      (this as any)._url = args[1];
      (this as any)._startTime = performance.now();
      return originalOpen.apply(this, args as any);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('loadend', () => {
        const timing = performance.now() - ((this as any)._startTime || 0);
        // XHR 요청 기록
      });
      return originalSend.apply(this, args as any);
    };
  }

  /**
   * Fetch API 오버라이드
   */
  private overrideFetch(): void {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;

      try {
        const response = await originalFetch.apply(this, args as any);
        const duration = performance.now() - startTime;
        // Fetch 요청 기록
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  /**
   * 모든 요청 가져오기
   */
  getRequests(): NetworkRequest[] {
    return [...this.requests];
  }

  /**
   * 요청 초기화
   */
  clear(): void {
    this.requests = [];
  }

  /**
   * 통계 생성
   */
  getStats(): NetworkStats {
    const byType: Record<string, { count: number; totalSize: number; avgDuration: number }> = {};
    const failedRequests: NetworkRequest[] = [];
    const slowRequests: NetworkRequest[] = [];

    let totalSize = 0;
    let totalDuration = 0;
    let cacheHits = 0;

    for (const req of this.requests) {
      if (!byType[req.type]) {
        byType[req.type] = { count: 0, totalSize: 0, avgDuration: 0 };
      }
      byType[req.type].count++;
      byType[req.type].totalSize += req.size.transferred;

      if (req.status >= 400) failedRequests.push(req);
      if (req.duration > 2000) slowRequests.push(req);

      totalSize += req.size.transferred;
      totalDuration += req.duration;
      if (req.cacheHit) cacheHits++;
    }

    for (const type in byType) {
      byType[type].avgDuration = totalDuration / byType[type].count;
    }

    return {
      totalRequests: this.requests.length,
      totalSize,
      totalDuration,
      byType: byType as any,
      failedRequests,
      slowRequests,
      cacheHits,
      cacheMisses: this.requests.length - cacheHits,
    };
  }
}

// 싱글톤 인스턴스
let monitorInstance: NetworkMonitor | null = null;

export function getNetworkMonitor(): NetworkMonitor {
  if (!monitorInstance) {
    monitorInstance = new NetworkMonitor();
  }
  return monitorInstance;
}
```

---

### Task #12.22: 네트워크 분석기

- **파일**: `src/utils/resourceNetwork/network/networkAnalyzer.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.21
- **상세 내용**:
```typescript
import { NetworkRequest, ResourceType } from '../../../types/resourceNetwork';

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
  byType: Record<ResourceType, {
    count: number;
    totalSize: number;
    avgDuration: number;
  }>;
  issues: NetworkIssue[];
  recommendations: string[];
}

/**
 * 네트워크 이슈
 */
export interface NetworkIssue {
  type: 'slow' | 'failed' | 'large' | 'redirect' | 'not-compressed';
  severity: 'low' | 'medium' | 'high';
  request: NetworkRequest;
  message: string;
}

/**
 * 네트워크 요청 분석
 */
export function analyzeNetworkRequests(requests: NetworkRequest[]): NetworkAnalysisReport {
  const issues: NetworkIssue[] = [];
  const recommendations: string[] = [];
  const byType: Record<string, { count: number; totalSize: number; avgDuration: number }> = {};

  let totalSize = 0;
  let totalDuration = 0;

  for (const req of requests) {
    if (!byType[req.type]) {
      byType[req.type] = { count: 0, totalSize: 0, avgDuration: 0 };
    }
    byType[req.type].count++;
    byType[req.type].totalSize += req.size.transferred;

    totalSize += req.size.transferred;
    totalDuration += req.duration;

    // 이슈 감지
    if (req.status >= 400) {
      issues.push({
        type: 'failed',
        severity: req.status >= 500 ? 'high' : 'medium',
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

    if (req.size.transferred > 1024 * 1024) {
      issues.push({
        type: 'large',
        severity: req.size.transferred > 5 * 1024 * 1024 ? 'high' : 'medium',
        request: req,
        message: `대용량 리소스: ${Math.round(req.size.transferred / 1024)}KB`,
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
  }

  for (const type in byType) {
    byType[type].avgDuration = byType[type].count > 0
      ? totalDuration / byType[type].count
      : 0;
  }

  if (issues.some(i => i.type === 'not-compressed')) {
    recommendations.push('텍스트 리소스 (JS, CSS)의 압축을 활성화하세요 (gzip, brotli)');
  }

  if (issues.some(i => i.type === 'large' && i.request.type === 'image')) {
    recommendations.push('이미지를 WebP 형식으로 변환하거나 적절한 크기로 최적화하세요');
  }

  if (issues.some(i => i.type === 'slow')) {
    recommendations.push('느린 요청의 CDN 사용 또는 캐싱 전략을 고려하세요');
  }

  const avgDuration = requests.length > 0 ? totalDuration / requests.length : 0;

  return {
    summary: {
      totalRequests: requests.length,
      totalSize,
      totalDuration,
      avgDuration,
    },
    byType: byType as any,
    issues,
    recommendations,
  };
}

/**
 * 도메인별 요청 그룹화
 */
export function groupRequestsByDomain(requests: NetworkRequest[]): Record<string, NetworkRequest[]> {
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
 * 타임라인 생성
 */
export function createTimeline(requests: NetworkRequest[]): Array<{ time: number; request: NetworkRequest }> {
  return requests
    .filter(req => req.timing.start >= 0)
    .map(req => ({
      time: req.timing.start,
      request: req,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * 워터폴 생성 (차트용)
 */
export interface WaterfallEntry {
  url: string;
  type: ResourceType;
  start: number;
  duration: number;
  dns: number;
  tcp: number;
  ttfb: number;
  download: number;
}

export function createWaterfall(requests: NetworkRequest[]): WaterfallEntry[] {
  return requests
    .filter(req => req.duration > 0)
    .map(req => ({
      url: req.url,
      type: req.type,
      start: req.timing.start,
      duration: req.duration,
      dns: req.timing.dns,
      tcp: req.timing.tcp,
      ttfb: req.timing.ttfb,
      download: req.timing.download,
    }))
    .sort((a, b) => a.start - b.start);
}
```

---

### Task #12.23: 네트워크 관리 훅

- **파일**: `src/hooks/resourceNetwork/useNetworkMonitor.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.2, #12.21, #12.22
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { NetworkRequest, ResourceType } from '../../types/resourceNetwork';
import { getNetworkMonitor } from '../../utils/resourceNetwork/network/networkMonitor';
import { analyzeNetworkRequests, createWaterfall, groupRequestsByDomain } from '../../utils/resourceNetwork/network/networkAnalyzer';
import { extractDomain } from '../../utils/resourceNetwork/helpers';

export function useNetworkMonitor() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string | 'all'>('all');

  // 모니터링 시작/중지
  const startMonitoring = useCallback(() => {
    const monitor = getNetworkMonitor();
    monitor.clear();
    monitor.start();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    const monitor = getNetworkMonitor();
    monitor.stop();
    setIsMonitoring(false);
  }, []);

  // 요청 새로고침
  const refreshRequests = useCallback(() => {
    const monitor = getNetworkMonitor();
    const allRequests = monitor.getRequests();
    setRequests(allRequests);
  }, []);

  // 주기적 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMonitoring) {
        refreshRequests();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshRequests]);

  // 필터링된 요청
  const filteredRequests = requests.filter(req => {
    if (selectedType !== 'all' && req.type !== selectedType) return false;
    if (selectedDomain !== 'all' && extractDomain(req.url) !== selectedDomain) return false;
    return true;
  });

  // 통계
  const stats = getNetworkMonitor().getStats();

  // 분석 리포트
  const analysis = analyzeNetworkRequests(requests);

  // 워터폴
  const waterfall = createWaterfall(requests);

  // 도메인 목록
  const domains = Array.from(new Set(requests.map(req => extractDomain(req.url))));

  return {
    requests,
    filteredRequests,
    isMonitoring,
    stats,
    analysis,
    waterfall,
    domains,
    selectedType,
    selectedDomain,
    startMonitoring,
    stopMonitoring,
    refreshRequests,
    setSelectedType,
    setSelectedDomain,
  };
}
```
- **완료 조건**: 네트워크 모니터링 및 분석 동작 검증

---

### Task #12.24: HAR 파일 내보내기

- **파일**: `src/utils/resourceNetwork/network/harExport.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.21
- **상세 내용**:
```typescript
import { NetworkRequest } from '../../../types/resourceNetwork';

/**
 * HAR (HTTP Archive) 형식
 */
export interface HAR {
  log: {
    version: string;
    creator: { name: string; version: string };
    pages: Array<{
      startedDateTime: string;
      id: string;
      title: string;
    }>;
    entries: HAREntry[];
  };
}

export interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: {};
  timings: {
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
  };
}

/**
 * NetworkRequest를 HAR로 변환
 */
export function convertToHAR(requests: NetworkRequest[]): HAR {
  return {
    log: {
      version: '1.2',
      creator: { name: 'KLIC Extension', version: '1.0.0' },
      pages: [{
        startedDateTime: new Date().toISOString(),
        id: 'page_1',
        title: document.title,
      }],
      entries: requests.map(req => ({
        startedDateTime: new Date(Date.now() - req.duration).toISOString(),
        time: req.duration,
        request: {
          method: req.method,
          url: req.url,
          headers: Object.entries(req.headers.request).map(([name, value]) => ({ name, value })),
          queryString: [],
          headersSize: 0,
          bodySize: req.size.transferred,
        },
        response: {
          status: req.status,
          statusText: req.statusText,
          headers: Object.entries(req.headers.response).map(([name, value]) => ({ name, value })),
          content: {
            size: req.size.transferred,
            mimeType: getMimeType(req.url),
          },
          redirectURL: '',
          headersSize: 0,
          bodySize: req.size.transferred,
        },
        cache: {},
        timings: {
          dns: req.timing.dns,
          connect: req.timing.tcp,
          send: 0,
          wait: req.timing.ttfb,
          receive: req.timing.download,
        },
      })),
    },
  };
}

/**
 * URL에서 MIME 타입 추론
 */
function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    html: 'text/html',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * HAR 파일 다운로드
 */
export function downloadHAR(requests: NetworkRequest[]): void {
  const har = convertToHAR(requests);
  const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `network-export-${Date.now()}.har`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * HAR 파일 불러오기
 */
export async function loadHAR(file: File): Promise<NetworkRequest[]> {
  const text = await file.text();
  const har: HAR = JSON.parse(text);

  return har.log.entries.map(entry => ({
    id: `har-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: entry.request.url,
    method: entry.request.method as any,
    type: getTypeFromUrl(entry.request.url),
    status: entry.response.status,
    statusText: entry.response.statusText,
    duration: entry.time,
    size: {
      transferred: entry.response.bodySize,
      uncompressed: entry.response.content.size,
    },
    timing: {
      start: 0,
      dns: entry.timings.dns,
      tcp: entry.timings.connect,
      ttfb: entry.timings.wait,
      download: entry.timings.receive,
    },
    headers: {
      request: Object.fromEntries(entry.request.headers.map(h => [h.name, h.value])),
      response: Object.fromEntries(entry.response.headers.map(h => [h.name, h.value])),
    },
    cacheHit: false,
    fromCache: false,
  }));
}

function getTypeFromUrl(url: string): NetworkRequest['type'] {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'stylesheet';
  if (ext === 'js') return 'script';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return 'image';
  if (['woff', 'woff2', 'ttf'].includes(ext || '')) return 'font';
  return 'other';
}
```

---

### Task #12.25~#12.28: (추가 네트워크 관련 태스크)

### Task #12.25: 네트워크 요청 재생

- **파일**: `src/utils/resourceNetwork/network/requestReplayer.ts`
- **상세 내용**: 네트워크 요청 재생 기능

### Task #12.26: 헤더 뷰어

- **파일**: `src/components/ResourceNetwork/HeaderViewer.tsx`
- **상세 내용**: 요청/응답 헤더 표시 컴포넌트

### Task #12.27: 캐시 분석 연동

- **파일**: `src/utils/resourceNetwork/network/cacheIntegration.ts`
- **상세 내용**: 네트워크와 캐시 데이터 연동

### Task #12.28: 네트워크 필터

- **파일**: `src/components/ResourceNetwork/NetworkFilters.tsx`
- **상세 내용**: 네트워크 요청 필터링 UI

---

[Phase 5: 캐시 분석 및 관리](./TASK-12-PHASE5.md) 로 계속
