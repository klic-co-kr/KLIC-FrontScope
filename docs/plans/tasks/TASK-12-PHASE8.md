# Phase 8: Content Script 통합

**태스크**: 3개
**예상 시간**: 1.5시간
**의존성**: Phase 1-7 완료

---

### Task #12.48: Content Script 메인 파일

- **파일**: `src/content/resourceNetwork/index.ts`
- **시간**: 30분
- **의존성**: 이전 Phase들
- **상세 내용**:
```typescript
import { MESSAGE_ACTIONS } from '../../constants/messages';

// 네트워크 모니터링 자동 시작
import { getNetworkMonitor } from '../../utils/resourceNetwork/network/networkMonitor';

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case MESSAGE_ACTIONS.RESOURCE_STORAGE_GET_ALL:
      handleGetAllStorage();
      break;
    case MESSAGE_ACTIONS.RESOURCE_STORAGE_CLEAR:
      handleClearStorage(message.payload);
      break;
    case MESSAGE_ACTIONS.RESOURCE_ANIMATION_SCAN:
      handleScanAnimations();
      break;
    case MESSAGE_ACTIONS.RESOURCE_ANIMATION_PAUSE:
      handlePauseAnimations();
      break;
    case MESSAGE_ACTIONS.RESOURCE_ANIMATION_RESUME:
      handleResumeAnimations();
      break;
    case MESSAGE_ACTIONS.RESOURCE_NETWORK_GET_STATS:
      handleGetNetworkStats();
      break;
    case MESSAGE_ACTIONS.RESOURCE_CACHE_GET_STATS:
      handleGetCacheStats();
      break;
    case MESSAGE_ACTIONS.RESOURCE_CACHE_CLEAR:
      handleClearCache();
      break;
  }
  sendResponse({ success: true });
});

function handleGetAllStorage() {
  // Storage 스캔 및 전송
}

function handleClearStorage(payload: { type: string }) {
  // Storage 삭제
}

function handleScanAnimations() {
  // 애니메이션 스캔
}

function handlePauseAnimations() {
  // 애니메이션 일시정지
}

function handleResumeAnimations() {
  // 애니메이션 재개
}

function handleGetNetworkStats() {
  const monitor = getNetworkMonitor();
  const stats = monitor.getStats();
  // 통계 전송
}

function handleGetCacheStats() {
  // 캐시 통계 전송
}

function handleClearCache() {
  // 캐시 삭제
}

// 초기화
function initialize() {
  console.log('Resource Network content script initialized');

  // 네트워크 모니터링 자동 시작
  const monitor = getNetworkMonitor();
  monitor.start();
}

initialize();
```

---

### Task #12.49: 퍼포먼스 API 통합

- **파일**: `src/content/resourceNetwork/performanceIntegration.ts`
- **시간**: 30분
- **의존성**: Task #12.1, #12.21
- **상세 내용**:
```typescript
import { NetworkRequest } from '../../types/resourceNetwork';

/**
 * Performance API에서 네트워크 데이터 추출
 */
export function extractPerformanceData(): NetworkRequest[] {
  const requests: NetworkRequest[] = [];

  // 리소스 타이밍 데이터
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  for (const entry of resources) {
    requests.push({
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: entry.name,
      method: 'GET',
      type: getResourceTypeFromUrl(entry.name),
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
    });
  }

  // 네비게이션 타이밍
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (navigation) {
    requests.push({
      id: `nav-${Date.now()}`,
      url: window.location.href,
      method: 'GET',
      type: 'document',
      status: 200,
      statusText: 'OK',
      duration: navigation.loadEventEnd - navigation.fetchStart,
      size: {
        transferred: navigation.transferSize,
        uncompressed: navigation.decodedBodySize,
      },
      timing: {
        start: navigation.fetchStart,
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
      },
      headers: {
        request: {},
        response: {},
      },
      cacheHit: false,
      fromCache: false,
    });
  }

  return requests;
}

function getResourceTypeFromUrl(url: string): NetworkRequest['type'] {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'stylesheet';
  if (ext === 'js') return 'script';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
  if (['woff', 'woff2', 'ttf'].includes(ext || '')) return 'font';
  return 'other';
}

/**
 * Core Web Vitals 측정
 */
export interface CoreWebVitals {
  LCP: number | null;  // Largest Contentful Paint
  FID: number | null;  // First Input Delay
  CLS: number | null;  // Cumulative Layout Shift
}

export function measureCoreWebVitals(): Promise<CoreWebVitals> {
  return new Promise((resolve) => {
    const vitals: CoreWebVitals = {
      LCP: null,
      FID: null,
      CLS: null,
    };

    // LCP 측정
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP 지원 안함
      }

      // FID 측정
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.FID = entries[0].processingStart - entries[0].startTime;
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID 지원 안함
      }

      // CLS 측정
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS 지원 안함
      }
    }

    // 3초 후 결과 반환
    setTimeout(() => resolve(vitals), 3000);
  });
}

/**
 * 메모리 정보 (Chrome 전용)
 */
export function getMemoryInfo(): { used: number; total: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
    };
  }
  return null;
}
```

---

### Task #12.50: Service Worker 통합

- **파일**: `src/content/resourceNetwork/serviceWorkerIntegration.ts`
- **시간**: 30분
- **의존성**: Task #12.1, #12.29
- **상세 내용**:
```typescript
/**
 * Service Worker 메시징
 */
export function sendMessageToServiceWorker(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
    } else {
      reject(new Error('Service Worker not active'));
    }
  });
}

/**
 * 캐시 정리 요청
 */
export async function requestCacheClear(): Promise<boolean> {
  try {
    const result = await sendMessageToServiceWorker({ type: 'CLEAR_CACHE' });
    return result.success;
  } catch (error) {
    console.error('Failed to request cache clear:', error);
    return false;
  }
}

/**
 * 캐시 목록 요청
 */
export async function requestCacheList(): Promise<string[]> {
  try {
    const result = await sendMessageToServiceWorker({ type: 'GET_CACHE_LIST' });
    return result.caches || [];
  } catch (error) {
    console.error('Failed to request cache list:', error);
    return [];
  }
}

/**
 * Service Worker 등록 상태 확인
 */
export function getServiceWorkerStatus(): {
  registered: boolean;
    active: boolean;
    controlled: boolean;
} {
  return {
    registered: 'serviceWorker' in navigator,
    active: navigator.serviceWorker.ready !== undefined,
    controlled: !!navigator.serviceWorker.controller,
  };
}

/**
 * Service Worker 업데이트 요청
 */
export async function updateServiceWorker(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update service worker:', error);
    return false;
  }
}

/**
 * Service Worker 등록 해제
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    return true;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
}
```

---

## ✅ 최종 완료 체크리스트

Phase 1-8의 모든 태스크 완료 후:

- [ ] 모든 파일이 생성됨
- [ ] TypeScript 컴파일 성공
- [ ] 스토리지 스캔 및 정리 정상 동작
- [ ] 애니메이션 감지 및 제어 정상 작동
- [ ] 네트워크 모니터링 실시간 업데이트
- [ ] 캐시 분석 및 관리 기능 동작
- [ ] React 컴포넌트 UI 정상 렌더링
- [ ] Content Script 통합 완료

---

**다음 단계**: 도구 #13 구현

[메인 문서](./TASK-12-RESOURCE-NETWORK.md)로 돌아가기
