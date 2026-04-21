/**
 * Network Monitor
 *
 * 네트워크 요청 모니터링 기능 제공
 */

/* eslint-disable @typescript-eslint/no-this-alias */
import { NetworkRequest, ResourceType, NetworkStats } from '../../../types/resourceNetwork';
import { guessResourceTypeFromUrl } from '../helpers';

/**
 * 네트워크 요청 모니터
 */
export class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private requestCallback?: (request: NetworkRequest) => void;
  private originalXHR = {
    open: XMLHttpRequest.prototype.open,
    send: XMLHttpRequest.prototype.send,
  };
  private originalFetch = window.fetch.bind(window);

  /**
   * 모니터링 시작
   */
  start(onRequest?: (request: NetworkRequest) => void): void {
    if (this.isMonitoring) return;

    this.requestCallback = onRequest;

    // Performance Observer 사용
    if ('PerformanceObserver' in window) {
      try {
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
      } catch (e) {
        console.error('Failed to start PerformanceObserver:', e);
      }
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

    // XHR 복구
    XMLHttpRequest.prototype.open = this.originalXHR.open;
    XMLHttpRequest.prototype.send = this.originalXHR.send;

    // Fetch 복구
    window.fetch = this.originalFetch;

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
      size: entry.transferSize,
      timestamp: entry.startTime,
      timing: {
        start: entry.startTime,
        dns: Math.max(0, entry.domainLookupEnd - entry.domainLookupStart),
        tcp: Math.max(0, entry.connectEnd - entry.connectStart),
        ttfb: Math.max(0, entry.responseStart - entry.requestStart),
        download: Math.max(0, entry.responseEnd - entry.responseStart),
        total: entry.duration,
      },
      headers: {},
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    };

    this.addRequest(request);
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
      size: entry.transferSize,
      timestamp: entry.fetchStart,
      timing: {
        start: entry.fetchStart,
        dns: Math.max(0, entry.domainLookupEnd - entry.domainLookupStart),
        tcp: Math.max(0, entry.connectEnd - entry.connectStart),
        ttfb: Math.max(0, entry.responseStart - entry.requestStart),
        download: Math.max(0, entry.responseEnd - entry.responseStart),
        total: entry.loadEventEnd - entry.fetchStart,
      },
      headers: {},
      cached: false,
    };

    this.addRequest(request);
  }

  /**
   * 요청 추가
   */
  private addRequest(request: NetworkRequest): void {
    this.requests.push(request);
    if (this.requestCallback) {
      this.requestCallback(request);
    }
  }

  /**
   * 리소스 타입 결정
   */
  private getResourceType(url: string): ResourceType {
    return guessResourceTypeFromUrl(url);
  }

  /**
   * XMLHttpRequest 오버라이드
   */
  private overrideXHR(): void {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (...args: unknown[]) {
      (this as XMLHttpRequest & { _method?: string; _url?: string; _startTime?: number })._method = args[0] as string;
      (this as XMLHttpRequest & { _method?: string; _url?: string; _startTime?: number })._url = args[1] as string;
      (this as XMLHttpRequest & { _method?: string; _url?: string; _startTime?: number })._startTime = performance.now();
      // Ensure async parameter exists (default to true if not provided)
      const openArgs: [string, string | URL, boolean, (string | null)?, (string | null)?] = [
        args[0] as string,
        args[1] as string | URL,
        args[2] as boolean ?? true,
        args[3] as string | null ?? null,
        args[4] as string | null ?? null,
      ];
      return originalOpen.apply(this, openArgs);
    };

    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: unknown[]) {
      this.addEventListener('loadend', () => {
        const xhr = this as XMLHttpRequest & { _method?: string; _url?: string; _startTime?: number };
        const timing = performance.now() - (xhr._startTime || 0);
        const method = xhr._method || 'GET';
        const url = xhr._url || '';

        const request: NetworkRequest = {
          id: `xhr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
          type: url.includes('/api/') ? 'xhr' : self.getResourceType(url),
          status: this.status,
          statusText: this.statusText || '',
          duration: timing,
          size: 0,
          timestamp: xhr._startTime || 0,
          timing: {
            start: xhr._startTime || 0,
            dns: 0,
            tcp: 0,
            ttfb: timing * 0.3,
            download: timing * 0.7,
            total: timing,
          },
          headers: {},
          cached: false,
        };

        self.addRequest(request);
      });

      return originalSend.apply(this, args as [body?: Document | XMLHttpRequestBodyInit | null]);
    };
  }

  /**
   * Fetch API 오버라이드
   */
  private overrideFetch(): void {
    const self = this;

    window.fetch = async function (...args: unknown[]) {
      const startTime = performance.now();
      const input = args[0] as RequestInfo | URL;
      const url = typeof input === 'string' ? input : (input as Request).url;
      const init = args[1] as RequestInit | undefined;
      const method =
        typeof input === 'string' && init?.method
          ? init.method
          : typeof input === 'object' && (input as Request).method
          ? (input as Request).method
          : 'GET';

      try {
        const response = await (self.originalFetch as typeof fetch).apply(window, args as [input: string | URL | Request, init?: RequestInit]);
        const duration = performance.now() - startTime;
        const clonedResponse = response.clone();

        let responseSize = 0;
        try {
          const blob = await clonedResponse.blob();
          responseSize = blob.size;
        } catch {
          // Response body를 읽을 수 없는 경우
        }

        const request: NetworkRequest = {
          id: `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
          type: url.includes('/api/') ? 'fetch' : self.getResourceType(url),
          status: response.status,
          statusText: response.statusText || '',
          duration,
          size: responseSize,
          timestamp: startTime,
          timing: {
            start: startTime,
            dns: 0,
            tcp: 0,
            ttfb: duration * 0.4,
            download: duration * 0.6,
            total: duration,
          },
          headers: {},
          cached: false,
        };

        self.addRequest(request);

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        const request: NetworkRequest = {
          id: `fetch-error-${Date.now()}`,
          url,
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
          type: 'fetch',
          status: 0,
          statusText: 'Network Error',
          duration,
          size: 0,
          timestamp: startTime,
          timing: {
            start: startTime,
            dns: 0,
            tcp: 0,
            ttfb: 0,
            download: 0,
            total: 0,
          },
          headers: {},
          cached: false,
        };

        self.addRequest(request);

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
   * 필터링된 요청 가져오기
   */
  getFilteredRequests(filters: {
    type?: ResourceType;
    minDuration?: number;
    maxDuration?: number;
    failed?: boolean;
  }): NetworkRequest[] {
    return this.requests.filter((req) => {
      if (filters.type && req.type !== filters.type) return false;
      if (filters.minDuration && req.duration < filters.minDuration) return false;
      if (filters.maxDuration && req.duration > filters.maxDuration) return false;
      if (filters.failed && req.status >= 200 && req.status < 300) return false;
      return true;
    });
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
    const byType: Record<
      ResourceType,
      { count: number; totalSize: number; avgDuration: number }
    > = {
      document: { count: 0, totalSize: 0, avgDuration: 0 },
      stylesheet: { count: 0, totalSize: 0, avgDuration: 0 },
      script: { count: 0, totalSize: 0, avgDuration: 0 },
      image: { count: 0, totalSize: 0, avgDuration: 0 },
      font: { count: 0, totalSize: 0, avgDuration: 0 },
      xhr: { count: 0, totalSize: 0, avgDuration: 0 },
      fetch: { count: 0, totalSize: 0, avgDuration: 0 },
      websocket: { count: 0, totalSize: 0, avgDuration: 0 },
      other: { count: 0, totalSize: 0, avgDuration: 0 },
    };

    const failedRequests: NetworkRequest[] = [];
    const slowRequests: NetworkRequest[] = [];

    let totalSize = 0;
    let totalDuration = 0;
    let cacheHits = 0;

    for (const req of this.requests) {
      byType[req.type].count++;
      byType[req.type].totalSize += req.size;

      if (req.status >= 400 || req.status === 0) failedRequests.push(req);
      if (req.duration > 2000) slowRequests.push(req);

      totalSize += req.size;
      totalDuration += req.duration;
      if (req.cached) cacheHits++;
    }

    // 평균 계산
    for (const type in byType) {
      if (byType[type as ResourceType].count > 0) {
        byType[type as ResourceType].avgDuration =
          totalDuration / byType[type as ResourceType].count;
      }
    }

    return {
      totalRequests: this.requests.length,
      totalSize,
      totalDuration,
      byType,
      failedRequests,
      slowRequests,
      cacheHits,
      cacheMisses: this.requests.length - cacheHits,
    };
  }

  /**
   * 모니터링 중인지 확인
   */
  isActive(): boolean {
    return this.isMonitoring;
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

/**
 * 네트워크 요청 기록에서 Performance API로 이미 완료된 요청 가져오기
 */
export function getExistingPerformanceEntries(): NetworkRequest[] {
  const requests: NetworkRequest[] = [];

  if ('performance' in window) {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    for (const entry of entries) {
      requests.push({
        id: `existing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: entry.name,
        method: 'GET',
        type: guessResourceTypeFromUrl(entry.name),
        status: 200,
        statusText: 'OK',
        duration: entry.duration,
        size: entry.transferSize,
        timestamp: entry.startTime,
        timing: {
          start: entry.startTime,
          dns: Math.max(0, entry.domainLookupEnd - entry.domainLookupStart),
          tcp: Math.max(0, entry.connectEnd - entry.connectStart),
          ttfb: Math.max(0, entry.responseStart - entry.requestStart),
          download: Math.max(0, entry.responseEnd - entry.responseStart),
          total: entry.duration,
        },
        headers: {},
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      });
    }
  }

  return requests;
}
