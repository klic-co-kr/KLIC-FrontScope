/**
 * Performance API Integration
 *
 * 퍼포먼스 API를 활용한 네트워크 및 메트릭 데이터 추출
 */

import type { NetworkRequest, PerformanceMetrics, WaterfallEntry } from '../../types/resourceNetwork';

/**
 * Collect all performance entries as network requests
 */
export function collectPerformanceEntries(): NetworkRequest[] {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  return convertToNetworkRequests(entries);
}

/**
 * Convert PerformanceResourceTiming entries to NetworkRequest format
 */
export function convertToNetworkRequests(
  entries: PerformanceResourceTiming[]
): NetworkRequest[] {
  return entries.map((entry) => ({
    id: generateRequestId(entry),
    url: entry.name,
    method: extractMethod(),
    type: mapInitiatorType(entry.initiatorType),
    status: 200, // Performance API only captures successful requests
    size: entry.transferSize || 0,
    duration: entry.duration,
    timestamp: entry.startTime,
    timing: extractTimingDetails(entry),
    cached: isCached(entry),
    headers: extractResponseHeaders(entry),
  }));
}

/**
 * Generate unique request ID from performance entry
 */
function generateRequestId(entry: PerformanceResourceTiming): string {
  return `${entry.name}-${entry.startTime}-${entry.duration}`;
}

/**
 * Extract HTTP method from performance entry
 * Note: PerformanceResourceTiming doesn't include method, defaults to GET
 */
function extractMethod(): string {
  // Performance API doesn't provide method, defaults to GET
  return 'GET';
}

/**
 * Map initiator type to resource type
 */
function mapInitiatorType(initiatorType?: string): NetworkRequest['type'] {
  const typeMap: Record<string, NetworkRequest['type']> = {
    script: 'script',
    link: 'stylesheet',
    img: 'image',
    css: 'stylesheet',
    fetch: 'fetch',
    xmlhttprequest: 'xhr',
    navigation: 'document',
    other: 'other',
  };

  return typeMap[initiatorType || ''] || 'other';
}

/**
 * Extract detailed timing information
 */
function extractTimingDetails(entry: PerformanceResourceTiming): NetworkRequest['timing'] {
  return {
    dns: entry.domainLookupEnd - entry.domainLookupStart,
    tcp: entry.connectEnd - entry.connectStart,
    tls: entry.secureConnectionStart > 0
      ? entry.connectEnd - entry.secureConnectionStart
      : 0,
    ttfb: entry.responseStart - entry.requestStart,
    download: entry.responseEnd - entry.responseStart,
    total: entry.duration,
  };
}

/**
 * Check if request was served from cache
 */
function isCached(entry: PerformanceResourceTiming): boolean {
  return entry.transferSize === 0 && entry.decodedBodySize > 0;
}

/**
 * Extract response headers (limited in Performance API)
 */
function extractResponseHeaders(entry: PerformanceResourceTiming): Record<string, string> {
  const headers: Record<string, string> = {};

  // Performance API provides limited header info
  if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
    headers['X-Cache'] = 'HIT';
  }

  // Content type can sometimes be inferred
  const contentType = inferContentType(entry.name);
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
}

/**
 * Infer content type from URL
 */
function inferContentType(url: string): string | null {
  const extension = url.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    js: 'application/javascript',
    css: 'text/css',
    html: 'text/html',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
  };
  return contentTypes[extension || ''] || null;
}

/**
 * Create waterfall data for visualization
 */
export function createWaterfall(entries: PerformanceResourceTiming[]): WaterfallEntry[] {
  const startTime = Math.min(...entries.map((e) => e.startTime));

  return entries.map((entry) => ({
    id: generateRequestId(entry),
    url: entry.name,
    type: mapInitiatorType(entry.initiatorType),
    startTime: entry.startTime - startTime,
    duration: entry.duration,
    timing: {
      queued: 0, // Not available in Performance API
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      tls: entry.secureConnectionStart > 0
        ? entry.connectEnd - entry.secureConnectionStart
        : 0,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
    },
  }));
}

/**
 * Collect Web Vitals metrics
 */
export function collectWebVitals(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      totalBlockingTime: 0,
    };

    // Navigation timing
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
      metrics.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;

      // Calculate Total Blocking Time
      const tbtThreshold = 50;
      let blockingTime = 0;
      const longTasks = performance.getEntriesByType('longtask');
      longTasks.forEach((task: PerformanceEntry & { startTime: number; duration: number }) => {
        if (task.startTime < navEntry.domContentLoadedEventEnd) {
          blockingTime += task.duration - tbtThreshold;
        }
      });
      metrics.totalBlockingTime = Math.max(0, blockingTime);
    }

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry: PerformanceEntry & { name: string; startTime: number }) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Largest Contentful Paint
    observeLCP((lcp) => {
      metrics.largestContentfulPaint = lcp;
      checkResolve(metrics, resolve);
    });

    // Cumulative Layout Shift
    observeCLS((cls) => {
      metrics.cumulativeLayoutShift = cls;
      checkResolve(metrics, resolve);
    });

    // First Input Delay
    observeFID((fid) => {
      metrics.firstInputDelay = fid;
      checkResolve(metrics, resolve);
    });

    // Timeout in case some metrics don't load
    setTimeout(() => resolve(metrics), 5000);
  });
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP(callback: (value: number) => void) {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        callback(lastEntry.startTime);
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
      callback(0);
    }
  } else {
    callback(0);
  }
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS(callback: (value: number) => void) {
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as Array<{ hadRecentInput: boolean; value: number }>) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        callback(clsValue);
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
      callback(0);
    }
  } else {
    callback(0);
  }
}

/**
 * Observe First Input Delay
 */
function observeFID(callback: (value: number) => void) {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as Array<{ hadRecentInput: boolean; value: number; processingStart: number; startTime: number }>) {
          callback(entry.processingStart - entry.startTime);
        }
      });
      observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
      callback(0);
    }
  } else {
    callback(0);
  }
}

/**
 * Check if all metrics are collected and resolve
 */
function checkResolve(metrics: PerformanceMetrics, resolve: (value: PerformanceMetrics) => void) {
  // We consider metrics complete when LCP, CLS, and FID are all non-zero
  // or after a reasonable timeout
  const hasEssentialMetrics =
    metrics.largestContentfulPaint > 0 ||
    metrics.cumulativeLayoutShift > 0 ||
    metrics.firstInputDelay > 0;

  if (hasEssentialMetrics) {
    // Small delay to allow more metrics to accumulate
    setTimeout(() => resolve(metrics), 1000);
  }
}

/**
 * Get resource timing statistics
 */
export function getResourceTimingStats(): {
  totalRequests: number;
  totalSize: number;
  totalDuration: number;
  cachedRequests: number;
  byType: Record<string, { count: number; size: number; duration: number }>;
} {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const stats = {
    totalRequests: entries.length,
    totalSize: 0,
    totalDuration: 0,
    cachedRequests: 0,
    byType: {} as Record<string, { count: number; size: number; duration: number }>,
  };

  entries.forEach((entry) => {
    const type = mapInitiatorType(entry.initiatorType);
    const size = entry.transferSize || 0;
    const cached = isCached(entry);

    stats.totalSize += size;
    stats.totalDuration += entry.duration;
    if (cached) stats.cachedRequests++;

    if (!stats.byType[type]) {
      stats.byType[type] = { count: 0, size: 0, duration: 0 };
    }
    stats.byType[type].count++;
    stats.byType[type].size += size;
    stats.byType[type].duration += entry.duration;
  });

  return stats;
}

/**
 * Monitor new performance entries in real-time
 */
export function monitorPerformanceEntries(
  callback: (requests: NetworkRequest[]) => void
): () => void {
  if (typeof PerformanceObserver === 'undefined') {
    return () => {};
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceResourceTiming[];
    const requests = convertToNetworkRequests(entries);
    callback(requests);
  });

  try {
    observer.observe({ entryTypes: ['resource', 'navigation'] });
  } catch (e) {
    console.warn('PerformanceObserver not supported:', e);
  }

  return () => observer.disconnect();
}

/**
 * Calculate Core Web Vitals score
 */
export function calculateCoreWebVitalsScore(metrics: PerformanceMetrics): {
  score: number;
  category: 'good' | 'needs-improvement' | 'poor';
  details: {
    lcp: { score: number; category: string };
    fid: { score: number; category: string };
    cls: { score: number; category: string };
  };
} {
  // LCP thresholds: good < 2.5s, needs improvement < 4s, poor >= 4s
  let lcpCategory = 'good';
  if (metrics.largestContentfulPaint >= 4000) lcpCategory = 'poor';
  else if (metrics.largestContentfulPaint >= 2500) lcpCategory = 'needs-improvement';

  // FID thresholds: good < 100ms, needs improvement < 300ms, poor >= 300ms
  let fidCategory = 'good';
  if (metrics.firstInputDelay >= 300) fidCategory = 'poor';
  else if (metrics.firstInputDelay >= 100) fidCategory = 'needs-improvement';

  // CLS thresholds: good < 0.1, needs improvement < 0.25, poor >= 0.25
  let clsCategory = 'good';
  if (metrics.cumulativeLayoutShift >= 0.25) clsCategory = 'poor';
  else if (metrics.cumulativeLayoutShift >= 0.1) clsCategory = 'needs-improvement';

  const details = {
    lcp: { score: metrics.largestContentfulPaint, category: lcpCategory },
    fid: { score: metrics.firstInputDelay, category: fidCategory },
    cls: { score: metrics.cumulativeLayoutShift, category: clsCategory },
  };

  // Overall category is the worst of the three
  let category: 'good' | 'needs-improvement' | 'poor' = 'good';
  if (lcpCategory === 'poor' || fidCategory === 'poor' || clsCategory === 'poor') {
    category = 'poor';
  } else if (lcpCategory === 'needs-improvement' || fidCategory === 'needs-improvement' || clsCategory === 'needs-improvement') {
    category = 'needs-improvement';
  }

  // Calculate overall score (0-100)
  const lcpScore = Math.max(0, 100 - (metrics.largestContentfulPaint / 4000) * 100);
  const fidScore = Math.max(0, 100 - (metrics.firstInputDelay / 300) * 100);
  const clsScore = Math.max(0, 100 - (metrics.cumulativeLayoutShift / 0.25) * 100);
  const score = Math.round((lcpScore + fidScore + clsScore) / 3);

  return { score, category, details };
}

/**
 * Export performance data for analysis
 */
export function exportPerformanceData(): {
  metrics: PerformanceMetrics;
  entries: NetworkRequest[];
  stats: ReturnType<typeof getResourceTimingStats>;
  timestamp: number;
} {
  return {
    metrics: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      totalBlockingTime: 0,
    },
    entries: collectPerformanceEntries(),
    stats: getResourceTimingStats(),
    timestamp: Date.now(),
  };
}
