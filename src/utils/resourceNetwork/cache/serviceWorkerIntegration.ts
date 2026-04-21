/**
 * Service Worker Integration
 *
 * Service Worker 캐시 관리 연동
 */

/**
 * Service Worker에 메시지 전송
 */
export async function sendToServiceWorker(
  message: {
    type: 'CLEAR_CACHE' | 'GET_CACHE_STATS' | 'SKIP_WAITING';
    data?: unknown;
  }
): Promise<unknown> {
  if (
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  ) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        reject(new Error('No active Service Worker'));
        return;
      }

      controller.postMessage(
        {
          ...message,
          port: messageChannel.port2,
        },
        [messageChannel.port2]
      );

      // 타임아웃
      setTimeout(() => {
        reject(new Error('Service Worker response timeout'));
      }, 5000);
    });
  }

  throw new Error('Service Worker not available');
}

/**
 * Service Worker 캐시 정리 요청
 */
export async function requestCacheClear(): Promise<{ success: boolean; cleared: number }> {
  try {
    const response = await sendToServiceWorker({ type: 'CLEAR_CACHE' });
    return response as { success: boolean; cleared: number };
  } catch (error) {
    console.error('Failed to request cache clear:', error);
    return { success: false, cleared: 0 };
  }
}

/**
 * Service Worker 통계 요청
 */
export async function requestCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
} | null> {
  try {
    const response = await sendToServiceWorker({ type: 'GET_CACHE_STATS' });
    return response as { totalEntries: number; totalSize: number } | null;
  } catch (error) {
    console.error('Failed to request cache stats:', error);
    return null;
  }
}

/**
 * Service Worker 업데이트 요청
 */
export async function requestServiceWorkerUpdate(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to request service worker update:', error);
    return false;
  }
}

/**
 * Service Worker 대기 중 상태 건너뛰기
 */
export async function skipServiceWorkerWaiting(): Promise<boolean> {
  try {
    const response = await sendToServiceWorker({ type: 'SKIP_WAITING' });
    return (response as { success?: boolean }).success || false;
  } catch (error) {
    console.error('Failed to skip waiting:', error);
    return false;
  }
}

/**
 * Service Worker 상태 확인
 */
export async function getServiceWorkerStatus(): Promise<{
  active: boolean;
  waiting: boolean;
  controlled: boolean;
  url?: string;
}> {
  const status = {
    active: false,
    waiting: false,
    controlled: false,
    url: undefined as string | undefined,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        status.active = !!registration.active;
        status.waiting = !!registration.waiting;
        status.controlled = !!navigator.serviceWorker.controller;
        status.url = registration.active?.scriptURL;
      }
    }
  } catch (error) {
    console.error('Failed to get service worker status:', error);
  }

  return status;
}

/**
 * Service Worker 등록 해제
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Service Worker 메시지 리스너 설정 (Content Script용)
 */
export function setupServiceWorkerMessageListener(
  onCacheCleared?: (cleared: number) => void,
  onStatsUpdate?: (stats: { totalEntries: number; totalSize: number }) => void
): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CACHE_CLEARED') {
      if (onCacheCleared) {
        onCacheCleared(event.data.cleared || 0);
      }
    } else if (event.data && event.data.type === 'CACHE_STATS') {
      if (onStatsUpdate) {
        onStatsUpdate(event.data.stats);
      }
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  // 정리 함수 반환
  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
}

/**
 * PWA 캐시 전략 설정 도우미
 */
export interface CacheStrategyConfig {
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxEntries?: number;
  maxAgeSeconds?: number;
  patterns?: string[];
}

/**
 * 캐시 전략 코드 생성
 */
export function generateCacheStrategyCode(config: CacheStrategyConfig): string {
  const { strategy, patterns = [] } = config;

  const patternMatch =
    patterns.length > 0
      ? `const patterns = ${JSON.stringify(patterns).replace(/"/g, "'")};\n  const shouldCache = patterns.some(p => new URL(request.url).pathname.match(p));\n  if (!shouldCache) return fetch(request);\n`
      : '';

  const strategies: Record<string, string> = {
    'cache-first': `// Cache First Strategy
${patternMatch}  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open('v1');
    cache.put(request, response.clone());
  }
  return response;`,

    'network-first': `// Network First Strategy
${patternMatch}  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open('v1');
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Network request failed');
  }`,

    'stale-while-revalidate': `// Stale While Revalidate Strategy
${patternMatch}  const cache = await caches.open('v1');
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  return cached || (await fetchPromise);`,

    'network-only': `// Network Only Strategy
  return fetch(request);`,

    'cache-only': `// Cache Only Strategy
${patternMatch}  const cached = await caches.match(request);
  if (cached) return cached;
  throw new Error('No cached response found');`,
  };

  return strategies[strategy] || strategies['network-first'];
}

/**
 * Workbox 스크립트 생성 (도구용)
 */
export function generateWorkboxConfig(options: {
  cacheName?: string;
  runtimeCaching?: Array<{
    urlPattern: string;
    handler: string;
    options?: {
      maxEntries?: number;
      maxAgeSeconds?: number;
    };
  }>;
}): string {
  const { cacheName = 'klic-cache', runtimeCaching = [] } = options;

  const config = {
    globDirectory: '.',
    globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,woff,woff2}'],
    swDest: 'sw.js',
    cacheId: cacheName,
    runtimeCaching: runtimeCaching.map(rc => ({
      urlPattern: rc.urlPattern,
      handler: rc.handler,
      options: {
        cacheName: cacheName,
        expiration: {
          maxEntries: rc.options?.maxEntries || 100,
          maxAgeSeconds: rc.options?.maxAgeSeconds || 86400,
        },
      },
    })),
  };

  return `module.exports = ${JSON.stringify(config, null, 2)};`;
}
