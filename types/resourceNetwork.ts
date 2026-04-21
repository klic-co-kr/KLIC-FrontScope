/**
 * Resource & Network Optimization Tool Types
 *
 * 리소스 및 네트워크 최적화 도구 타입 정의
 */

/**
 * 쿠키 정보
 */
export interface CookieInfo {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expiration?: number;            // Unix timestamp
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  size: number;                   // bytes
}

/**
 * 스토리지 타입
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies';

/**
 * 스토리지 항목
 */
export interface StorageItem {
  key: string;
  value: string;
  size: number;                   // bytes
  type?: StorageType;
  domain?: string;                // cookies only
  path?: string;                  // cookies only
}

/**
 * 스토리지 통계
 */
export interface StorageStats {
  localStorage: {
    count: number;
    totalSize: number;            // bytes
    items: StorageItem[];
    usagePercentage?: number;
  };
  sessionStorage: {
    count: number;
    totalSize: number;
    items: StorageItem[];
    usagePercentage?: number;
  };
  cookies: {
    count: number;
    totalSize: number;
    items: CookieInfo[];
    usagePercentage?: number;
  };
  indexedDB?: {
    count: number;
    totalSize: number;
    databases: Array<{ name: string; size: number }>;
  };
  totalSize: number;
  timestamp?: number;
}

/**
 * 애니메이션 타입
 */
export type AnimationType = 'css' | 'js' | 'web-animation' | 'transition';

/**
 * CSS 애니메이션 정보
 */
export interface CSSAnimation {
  id: string;
  type: 'css' | 'transition';
  element: string;                // selector
  property: string;               // 'transform', 'opacity', etc
  duration: number;               // ms
  delay: number;                  // ms
  iterationCount?: number | 'infinite';
  iterations?: number;
  timingFunction?: string;
  easing?: string;
  keyframes?: string[];
  affectsPerformance: 'low' | 'medium' | 'high';
  library?: string;
}

/**
 * JS 애니메이션 정보
 */
export interface JSAnimation {
  id: string;
  type: 'js';
  library?: 'requestAnimationFrame' | 'css-transition' | 'web-animation' | 'unknown' | string;
  frameCount?: number;
  estimatedFPS?: number;
  affectsPerformance: 'low' | 'medium' | 'high';
  element?: string;
  property?: string;
  duration?: number;
  delay?: number;
  iterations?: number;
  easing?: string;
}

/**
 * 애니메이션 정보 (통합)
 */
export type AnimationInfo = CSSAnimation | JSAnimation;

/**
 * 애니메이션 통계
 */
export interface AnimationStats {
  totalAnimations: number;
  cssCount: number;
  jsCount: number;
  highImpactCount: number;
  animations: AnimationInfo[];
}

/**
 * 네트워크 요청 타입
 */
export type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'script'
  | 'image'
  | 'font'
  | 'xhr'
  | 'fetch'
  | 'websocket'
  | 'other';

/**
 * 네트워크 요청 정보
 */
export interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | string;
  type: ResourceType;
  status: number;
  statusText?: string;
  duration: number;               // ms
  size: number;
  timestamp: number;
  timing?: {
    dns: number;                  // ms
    tcp: number;                  // ms
    tls?: number;                 // ms
    ttfb: number;                 // Time to First Byte
    download: number;             // ms
    total: number;                // ms
    start?: number;
  };
  cached?: boolean;
  headers?: {
    request?: Record<string, string>;
    response?: Record<string, string>;
  } | Record<string, string>;
  cacheHit?: boolean;
  fromCache?: boolean;
}

/**
 * 네트워크 통계
 */
export interface NetworkStats {
  totalRequests: number;
  totalSize: number;              // bytes
  totalDuration: number;          // ms
  byType: Record<ResourceType, {
    count: number;
    totalSize: number;
    avgDuration: number;
  }>;
  failedRequests: NetworkRequest[];
  slowRequests: NetworkRequest[];
  cacheHits: number;
  cacheMisses: number;
}

/**
 * 캐시 항목
 */
export interface CacheEntry {
  url: string;
  type: ResourceType;
  size: number;                   // bytes
  lastModified?: number;           // Unix timestamp
  expires?: number;               // Unix timestamp
  etag?: string;
  timestamp?: number;             // Unix timestamp
  cacheName?: string;
  cached?: boolean;
}

/**
 * 캐시 통계
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;              // bytes
  hitRate?: number;                // 0-1
  entries: CacheEntry[];
  expiredEntries: CacheEntry[];
  cacheNames?: string[];
  timestamp?: number;
}

/**
 * 통합 리소스 설정
 */
export interface ResourceNetworkSettings {
  storage: {
    autoClean: boolean;
    cleanOnClose: boolean;
    preserveDomains: string[];
  };
  animation: {
    highlightOnHover: boolean;
    showPerformanceImpact: boolean;
    pauseAll: boolean;
  };
  network: {
    captureRequests: boolean;
  };
  cache: {
    showExpired: boolean;
    autoCleanExpired: boolean;
  };
}

/**
 * 스토리지 사용량 분석
 */
export interface StorageUsageAnalysis {
  totalItems: number;
  totalSize: number;
  averageItemSize: number;
  largestItem: StorageItem | null;
  sizeDistribution: {
    small: number;  // < 1KB
    medium: number; // 1KB - 10KB
    large: number;  // > 10KB
  };
}

/**
 * 스토리지 내보내기 형식
 */
export interface StorageExport {
  timestamp: number;
  url: string;
  localStorage: Array<{ key: string; value: string }>;
  sessionStorage: Array<{ key: string; value: string }>;
  cookies: Array<{ name: string; value: string; domain: string }>;
}

/**
 * 예약어드 클린 설정
 */
export interface ScheduledCleanConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly';
  lastRun: number;
  types: ('localStorage' | 'sessionStorage' | 'cookies')[];
  preserveDomains: string[];
}

/**
 * 네트워크 필터 옵션
 */
export interface NetworkFilterOptions {
  type?: ResourceType;
  status?: number;
  minDuration?: number;
  failed?: boolean;
  searchQuery?: string;
}

/**
 * HAR (HTTP Archive) 형식
 */
export interface HarEntry {
  startedDateTime: string;
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
    };
  };
  timing: {
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
  };
}

/**
 * HAR 형식 전체
 */
export interface HarData {
  log: {
    version: string;
    creator: { name: string; version: string };
    entries: HarEntry[];
  };
}

/**
 * Performance Metrics (Web Vitals)
 */
export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
}

/**
 * Waterfall Entry
 */
export interface WaterfallEntry {
  id: string;
  url: string;
  type: ResourceType;
  startTime: number;
  duration: number;
  timing: {
    queued: number;
    dns: number;
    tcp: number;
    tls: number;
    request: number;
    response: number;
  };
}

/**
 * Cache Snapshot
 */
export interface CacheSnapshot {
  timestamp: number;
  totalEntries: number;
  totalSize: number;
  entries: CacheEntry[];
  expiredEntries: CacheEntry[];
}

/**
 * Cache Comparison
 */
export interface CacheComparison {
  added: CacheEntry[];
  removed: CacheEntry[];
  changed: Array<{ before: CacheEntry; after: CacheEntry }>;
  totalChanges: number;
}
