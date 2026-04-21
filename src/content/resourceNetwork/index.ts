/**
 * Resource Network Content Script
 *
 * 리소스 및 네트워크 최적화 도구 콘텐츠 스크립트
 */

import { RESOURCE_NETWORK_MESSAGES } from '../../constants/messages';
import { safeSendMessage } from '../utils/safeMessage';
import type {
  StorageStats,
  AnimationInfo,
  CacheEntry,
  CacheStats,
  NetworkRequest,
  PerformanceMetrics,
} from '../../types/resourceNetwork';
import { guessResourceTypeFromUrl } from '../../utils/resourceNetwork/helpers';

let isActive = false;
let animationObserver: MutationObserver | null = null;
let performanceObserver: PerformanceObserver | null = null;
let storagePatched = false;

const originalStorageMethods = {
  setItem: Storage.prototype.setItem,
  removeItem: Storage.prototype.removeItem,
};

/**
 * Initialize resource network monitoring
 */
function initializeResourceNetwork() {
  setupPerformanceMonitoring();
  setupStorageMonitoring();
  setupAnimationMonitoring();
  setupCacheMonitoring();
}

/**
 * Setup performance API monitoring for network data
 */
function setupPerformanceMonitoring() {
  // Collect existing performance entries
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const requests = convertPerformanceEntriesToRequests(entries);

  // Send initial network data
  safeSendMessage({
    action: RESOURCE_NETWORK_MESSAGES.NETWORK_COLLECT,
    data: { requests },
  });

  // Set up PerformanceObserver for new entries
  if (typeof PerformanceObserver !== 'undefined') {
    performanceObserver = new PerformanceObserver((list) => {
      const newEntries = list.getEntries() as PerformanceResourceTiming[];
      const newRequests = convertPerformanceEntriesToRequests(newEntries);

      safeSendMessage({
        action: RESOURCE_NETWORK_MESSAGES.NETWORK_UPDATE,
        data: { requests: newRequests },
      });
    });

    try {
      performanceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // entryTypes may not be supported
      console.warn('PerformanceObserver entryTypes not supported:', e);
    }
  }
}

async function collectCacheEntries(limit = 500): Promise<CacheEntry[]> {
  if (typeof caches === 'undefined') {
    return [];
  }

  const entries: CacheEntry[] = [];
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      if (entries.length >= limit) {
        return entries;
      }

      try {
        const response = await cache.match(request);
        if (!response) {
          continue;
        }

        const contentLength = response.headers.get('content-length');
        const lastModified = response.headers.get('last-modified');
        const expires = response.headers.get('expires');
        const etag = response.headers.get('etag');

        const parsedSize = contentLength ? Number.parseInt(contentLength, 10) : 0;
        const parsedLastModified = lastModified ? new Date(lastModified).getTime() : undefined;
        const parsedExpires = expires ? new Date(expires).getTime() : undefined;

        entries.push({
          url: request.url,
          type: guessResourceTypeFromUrl(request.url),
          size: Number.isFinite(parsedSize) ? parsedSize : 0,
          lastModified: Number.isFinite(parsedLastModified) ? parsedLastModified : undefined,
          expires: Number.isFinite(parsedExpires) ? parsedExpires : undefined,
          etag: etag || undefined,
          cacheName,
          timestamp: Date.now(),
        });
      } catch {
        continue;
      }
    }
  }

  return entries;
}

function getCacheHitRate(): number {
  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (resources.length === 0) {
      return 0;
    }

    const cacheHits = resources.filter((r) => r.transferSize === 0 && r.decodedBodySize > 0).length;
    return cacheHits / resources.length;
  } catch {
    return 0;
  }
}

async function collectCacheStats(): Promise<CacheStats> {
  const entries = await collectCacheEntries();
  const cacheNames = typeof caches === 'undefined' ? [] : await caches.keys();
  const expiredEntries = entries.filter((entry) => {
    return typeof entry.expires === 'number' && entry.expires < Date.now();
  });

  return {
    totalEntries: entries.length,
    totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
    hitRate: getCacheHitRate(),
    entries,
    expiredEntries,
    cacheNames,
    timestamp: Date.now(),
  };
}

async function estimateResponseSize(response: Response): Promise<number> {
  const contentLength = response.headers.get('content-length');
  const parsed = contentLength ? Number.parseInt(contentLength, 10) : 0;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  try {
    return (await response.clone().blob()).size;
  } catch {
    return 0;
  }
}

async function clearCaches(options: {
  mode?: 'all' | 'expired' | 'domain' | 'large';
  threshold?: number;
  domain?: string;
  cacheName?: string;
}): Promise<number> {
  if (typeof caches === 'undefined') {
    return 0;
  }

  const mode = options.mode || 'all';
  const threshold = typeof options.threshold === 'number' ? options.threshold : 0;
  const cacheNames = options.cacheName ? [options.cacheName] : await caches.keys();
  let clearedCount = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    if (mode === 'all') {
      if (options.cacheName) {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          clearedCount += requests.length;
        }
      } else {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          clearedCount += requests.length;
        }
      }
      continue;
    }

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) {
        continue;
      }

      let shouldDelete = false;

      if (mode === 'expired') {
        const expires = response.headers.get('expires');
        const expiresAt = expires ? new Date(expires).getTime() : NaN;
        shouldDelete = Number.isFinite(expiresAt) && expiresAt < Date.now();
      } else if (mode === 'domain') {
        if (!options.domain) {
          continue;
        }
        try {
          const hostname = new URL(request.url).hostname;
          shouldDelete = hostname === options.domain || hostname.endsWith(`.${options.domain}`);
        } catch {
          shouldDelete = false;
        }
      } else if (mode === 'large') {
        const size = await estimateResponseSize(response);
        shouldDelete = size > threshold;
      }

      if (!shouldDelete) {
        continue;
      }

      const deleted = await cache.delete(request);
      if (deleted) {
        clearedCount += 1;
      }
    }
  }

  return clearedCount;
}

function clearCookieVariants(name: string, domain?: string, path?: string): void {
  const encodedName = encodeURIComponent(name);
  const paths = new Set<string>(['/', path || '/']);
  const host = window.location.hostname;
  const candidateDomains = new Set<string>();

  if (domain) {
    candidateDomains.add(domain);
    candidateDomains.add(domain.startsWith('.') ? domain : `.${domain}`);
  }

  candidateDomains.add(host);
  candidateDomains.add(host.startsWith('.') ? host : `.${host}`);

  const hostParts = host.split('.');
  if (hostParts.length >= 2) {
    const rootDomain = hostParts.slice(-2).join('.');
    candidateDomains.add(rootDomain);
    candidateDomains.add(`.${rootDomain}`);
  }

  for (const targetPath of paths) {
    document.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${targetPath}`;

    for (const targetDomain of candidateDomains) {
      document.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${targetPath}; domain=${targetDomain}`;
    }
  }
}

/**
 * Convert PerformanceResourceTiming entries to NetworkRequest format
 */
function convertPerformanceEntriesToRequests(
  entries: PerformanceResourceTiming[]
): NetworkRequest[] {
  return entries.map((entry) => {
    const initiatorType = entry.initiatorType || 'other';
    let type: NetworkRequest['type'] = 'other';

    // Map initiator type to resource type
    if (initiatorType === 'script') type = 'script';
    else if (initiatorType === 'link') {
      if (entry.name.includes('.css')) type = 'stylesheet';
      else type = 'other';
    }
    else if (initiatorType === 'img') type = 'image';
    else if (initiatorType === 'css') type = 'stylesheet';
    else if (initiatorType === 'fetch' || initiatorType === 'xmlhttprequest') type = 'xhr';
    else if (initiatorType === 'navigation') type = 'document';

    // Calculate transfer size
    const transferSize = entry.transferSize > 0 ? entry.transferSize : 0;

    return {
      id: `${entry.name}-${entry.startTime}`,
      url: entry.name,
      method: 'GET', // Performance API doesn't provide method
      type,
      status: 200, // Performance API entries are successful
      size: transferSize,
      duration: entry.duration,
      timestamp: entry.startTime,
      timing: {
        dns: entry.domainLookupEnd - entry.domainLookupStart,
        tcp: entry.connectEnd - entry.connectStart,
        tls: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
        ttfb: entry.responseStart - entry.requestStart,
        download: entry.responseEnd - entry.responseStart,
        total: entry.duration,
      },
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      headers: {},
    };
  });
}

/**
 * Setup storage monitoring
 */
function setupStorageMonitoring() {
  if (storagePatched) {
    return;
  }

  // Monitor localStorage changes
  Storage.prototype.setItem = function (key: string, value: string) {
    originalStorageMethods.setItem.call(this, key, value);
    if (this === localStorage || this === sessionStorage) {
      safeSendMessage({
        action: RESOURCE_NETWORK_MESSAGES.STORAGE_UPDATE,
        data: { type: this === localStorage ? 'localStorage' : 'sessionStorage', key, value },
      });
    }
  };

  Storage.prototype.removeItem = function (key: string) {
    originalStorageMethods.removeItem.call(this, key);
    if (this === localStorage || this === sessionStorage) {
      safeSendMessage({
        action: RESOURCE_NETWORK_MESSAGES.STORAGE_UPDATE,
        data: { type: this === localStorage ? 'localStorage' : 'sessionStorage', key, value: null },
      });
    }
  };

  storagePatched = true;
}

/**
 * Setup animation monitoring
 */
function setupAnimationMonitoring() {
  // Monitor for new animated elements
  if (typeof MutationObserver !== 'undefined') {
    animationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check added nodes for animations
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              checkElementForAnimations(node);
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          if (mutation.target instanceof HTMLElement) {
            checkElementForAnimations(mutation.target);
          }
        }
      }
    });

    animationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  // Scan existing animations
  scanPageAnimations();
}

/**
 * Check element for CSS animations or transitions
 */
function checkElementForAnimations(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  const animations = styles.animationName !== 'none' ? styles.animationName : '';
  const transitions = styles.transitionProperty !== 'all' && styles.transitionProperty !== 'none'
    ? styles.transitionProperty
    : '';

  if (animations || transitions) {
    const animationData: Partial<AnimationInfo> = {
      id: `anim-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: animations ? 'css' : 'transition',
      element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
      property: animations ? 'animation' : transitions,
      duration: animations
        ? parseFloat(styles.animationDuration) * 1000
        : parseFloat(styles.transitionDuration) * 1000,
      delay: animations
        ? parseFloat(styles.animationDelay) * 1000
        : parseFloat(styles.transitionDelay) * 1000,
      iterations: animations ? parseInt(styles.animationIterationCount) || 1 : 1,
      easing: animations ? styles.animationTimingFunction : styles.transitionTimingFunction,
      affectsPerformance: calculatePerformanceImpact(styles),
    };

    safeSendMessage({
      action: RESOURCE_NETWORK_MESSAGES.ANIMATION_DETECTED,
      data: animationData,
    });
  }
}

/**
 * Calculate performance impact of an animation
 */
function calculatePerformanceImpact(
  styles: CSSStyleDeclaration
): 'low' | 'medium' | 'high' {
  const duration = parseFloat(styles.animationDuration) || parseFloat(styles.transitionDuration) || 0;
  const willChange = styles.willChange !== 'auto';

  // Check for animating expensive properties
  const expensiveProps = ['width', 'height', 'top', 'left', 'margin', 'padding'];
  const animatingExpensive = expensiveProps.some((prop) =>
    styles.transitionProperty?.includes(prop) || styles.animationName?.includes(prop)
  );

  if (duration > 1 || (willChange && animatingExpensive)) {
    return 'high';
  }
  if (duration > 0.3 || animatingExpensive) {
    return 'medium';
  }
  return 'low';
}

/**
 * Scan all animations on the page
 */
function scanPageAnimations() {
  const animations: AnimationInfo[] = [];

  // Find all elements with animations
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const styles = window.getComputedStyle(el);
      const hasAnimation = styles.animationName !== 'none';
      const hasTransition = styles.transitionProperty !== 'all' && styles.transitionProperty !== 'none';

      if (hasAnimation || hasTransition) {
        animations.push({
          id: `anim-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: hasAnimation ? 'css' : 'transition',
          element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
          property: hasAnimation ? 'animation' : styles.transitionProperty,
          duration: hasAnimation
            ? parseFloat(styles.animationDuration) * 1000
            : parseFloat(styles.transitionDuration) * 1000,
          delay: hasAnimation
            ? parseFloat(styles.animationDelay) * 1000
            : parseFloat(styles.transitionDelay) * 1000,
          iterations: hasAnimation ? parseInt(styles.animationIterationCount) || 1 : 1,
          easing: hasAnimation ? styles.animationTimingFunction : styles.transitionTimingFunction,
          affectsPerformance: calculatePerformanceImpact(styles),
        });
      }
    }
  });

  // Detect JS animations via requestAnimationFrame
  detectJSAnimations(animations);

  safeSendMessage({
    action: RESOURCE_NETWORK_MESSAGES.ANIMATION_SCAN_COMPLETE,
    data: { animations },
  });
}

/**
 * Detect JavaScript-based animations
 */
function detectJSAnimations(animations: AnimationInfo[]) {
  // Check for common animation libraries
  const libs = ['GSAP', 'Anime', 'Motion', 'Framer Motion', 'Velocity'];
  const globalWindow = window as unknown as Window & Record<string, unknown>;
  const hasAnimationLibrary = libs.some((lib) => globalWindow[lib] !== undefined);

  if (hasAnimationLibrary) {
    animations.push({
      id: `anim-js-${Date.now()}`,
      type: 'js',
      element: 'window',
      property: 'requestAnimationFrame',
      duration: 0,
      delay: 0,
      iterations: -1, // Infinite
      easing: 'linear',
      affectsPerformance: 'medium',
      library: (libs.find((lib) => globalWindow[lib] !== undefined) || 'unknown') as string,
    });
  }
}

/**
 * Setup cache monitoring
 */
function setupCacheMonitoring() {
  // Collect cache info when requested
  if (typeof caches !== 'undefined') {
    caches.keys().then((cacheNames) => {
      safeSendMessage({
        action: RESOURCE_NETWORK_MESSAGES.CACHE_LIST,
        data: { cacheNames },
      });
    });
  }
}

/**
 * Get current performance metrics
 */
function getPerformanceMetrics(): PerformanceMetrics {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  return {
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
    firstPaint: 0, // Not available in navigation timing
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    totalBlockingTime: 0,
  };
}

/**
 * Activate resource network monitoring
 */
function activate() {
  if (isActive) return;
  isActive = true;
  initializeResourceNetwork();
}

/**
 * Deactivate resource network monitoring
 */
function deactivate() {
  if (!isActive) return;
  isActive = false;

  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }

  if (performanceObserver) {
    performanceObserver.disconnect();
    performanceObserver = null;
  }

  if (storagePatched) {
    Storage.prototype.setItem = originalStorageMethods.setItem;
    Storage.prototype.removeItem = originalStorageMethods.removeItem;
    storagePatched = false;
  }
}

/**
 * Handle messages from side panel
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === RESOURCE_NETWORK_MESSAGES.ACTIVATE) {
    activate();
    sendResponse({ success: true });
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.DEACTIVATE) {
    deactivate();
    sendResponse({ success: true });
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.STORAGE_SCAN) {
    const storageStats = collectStorageStats();
    sendResponse({ success: true, data: storageStats });
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.NETWORK_COLLECT) {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const requests = convertPerformanceEntriesToRequests(entries);
    sendResponse({ success: true, data: { requests } });
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.ANIMATION_SCAN) {
    scanPageAnimations();
    sendResponse({ success: true });
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.CACHE_SCAN) {
    collectCacheStats()
      .then((stats) => sendResponse({ success: true, data: stats }))
      .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
    return true;
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.CACHE_GET_ENTRIES) {
    collectCacheEntries()
      .then((entries) => sendResponse({ success: true, data: entries }))
      .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
    return true;
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.CACHE_CLEAR) {
    const {
      mode,
      threshold,
      domain,
      cacheName,
    } = message.data || {};

    clearCaches({
      mode,
      threshold,
      domain,
      cacheName,
    })
      .then((clearedCount) => sendResponse({ success: true, data: { clearedCount } }))
      .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
    return true;
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.GET_PERFORMANCE_METRICS) {
    const metrics = getPerformanceMetrics();
    sendResponse({ success: true, data: metrics });
  }
  else if (message.action === RESOURCE_NETWORK_MESSAGES.CLEAR_STORAGE) {
    const { type, key, domain, path } = message.data || {};
    if (type === 'localStorage' && key) {
      localStorage.removeItem(key);
    }
    else if (type === 'localStorage') {
      localStorage.clear();
    }
    else if (type === 'sessionStorage' && key) {
      sessionStorage.removeItem(key);
    }
    else if (type === 'sessionStorage') {
      sessionStorage.clear();
    }
    else if (type === 'cookies') {
      const currentHost = window.location.hostname;
      const domainMatch = typeof domain !== 'string'
        || domain.length === 0
        || currentHost === domain
        || currentHost.endsWith(`.${domain}`)
        || domain.endsWith(`.${currentHost}`);

      if (typeof key === 'string' && key.length > 0) {
        if (domainMatch) {
          clearCookieVariants(key, domain, path);
        }
      } else {
        if (domainMatch) {
          const cookieNames = document.cookie
            .split(';')
            .map((pair) => pair.trim())
            .filter(Boolean)
            .map((pair) => pair.split('=')[0]?.trim())
            .filter((name): name is string => Boolean(name));

          cookieNames.forEach((name) => clearCookieVariants(name, domain, path));
        }
      }
    }
    sendResponse({ success: true });
  }

  return false;
});

/**
 * Collect storage statistics
 */
function collectStorageStats(): StorageStats {
  const localStorageItems: Array<{ key: string; value: string; size: number }> = [];
  let localStorageSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      const size = (key.length + value.length) * 2; // UTF-16
      localStorageItems.push({ key, value, size });
      localStorageSize += size;
    }
  }

  const sessionStorageItems: Array<{ key: string; value: string; size: number }> = [];
  let sessionStorageSize = 0;

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      const value = sessionStorage.getItem(key) || '';
      const size = (key.length + value.length) * 2;
      sessionStorageItems.push({ key, value, size });
      sessionStorageSize += size;
    }
  }

  const cookies = document.cookie.split(';').map((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    return {
      name: name.trim(),
      value,
      domain: window.location.hostname,
      path: '/',
      size: (name.length + value.length) * 2,
    };
  });

  const cookiesSize = cookies.reduce((sum, c) => sum + c.size, 0);

  return {
    localStorage: {
      count: localStorageItems.length,
      totalSize: localStorageSize,
      items: localStorageItems,
      usagePercentage: (localStorageSize / (5 * 1024 * 1024)) * 100, // 5MB estimate
    },
    sessionStorage: {
      count: sessionStorageItems.length,
      totalSize: sessionStorageSize,
      items: sessionStorageItems,
      usagePercentage: (sessionStorageSize / (5 * 1024 * 1024)) * 100,
    },
    cookies: {
      count: cookies.length,
      totalSize: cookiesSize,
      items: cookies,
      usagePercentage: (cookiesSize / (4 * 1024)) * 100, // 4KB per cookie limit
    },
    indexedDB: {
      count: 0,
      totalSize: 0,
      databases: [],
    },
    totalSize: localStorageSize + sessionStorageSize + cookiesSize,
    timestamp: Date.now(),
  };
}

// Export for external use if needed
export const resourceNetworkContentScript = {
  activate,
  deactivate,
  scanPageAnimations,
  collectStorageStats,
  getPerformanceMetrics,
};
