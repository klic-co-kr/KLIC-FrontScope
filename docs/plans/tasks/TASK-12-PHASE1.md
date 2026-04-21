# Phase 1: 기반 설정

**태스크**: 7개
**예상 시간**: 1.5시간
**의존성**: 없음

---

### Task #12.1: 타입 정의 - 리소스 및 네트워크

- **파일**: `src/types/resourceNetwork.ts`
- **시간**: 25분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 쿠키 정보
 */
export interface CookieInfo {
  name: string;
  value: string;
  domain: string;
  path: string;
  expiration?: number;            // Unix timestamp
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
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
  type: StorageType;
  domain?: string;                // cookies only
}

/**
 * 스토리지 통계
 */
export interface StorageStats {
  localStorage: {
    count: number;
    totalSize: number;            // bytes
    items: StorageItem[];
  };
  sessionStorage: {
    count: number;
    totalSize: number;
    items: StorageItem[];
  };
  cookies: {
    count: number;
    totalSize: number;
    items: CookieInfo[];
  };
  totalSize: number;
}

/**
 * 애니메이션 타입
 */
export type AnimationType = 'css' | 'js' | 'web-animation';

/**
 * CSS 애니메이션 정보
 */
export interface CSSAnimation {
  id: string;
  type: 'css';
  element: string;                // selector
  property: string;               // 'transform', 'opacity', etc
  duration: number;               // ms
  delay: number;                  // ms
  iterationCount: number | 'infinite';
  timingFunction: string;
  keyframes: string[];
  affectsPerformance: 'low' | 'medium' | 'high';
}

/**
 * JS 애니메이션 정보
 */
export interface JSAnimation {
  id: string;
  type: 'js';
  library: 'requestAnimationFrame' | 'css-transition' | 'web-animation' | 'unknown';
  frameCount: number;
  estimatedFPS: number;
  affectsPerformance: 'low' | 'medium' | 'high';
}

/**
 * 애니메이션 정보 (통합)
 */
export type AnimationInfo = CSSAnimation | JSAnimation;

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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  type: ResourceType;
  status: number;
  statusText: string;
  duration: number;               // ms
  size: {
    transferred: number;          // bytes
    uncompressed?: number;        // bytes
  };
  timing: {
    start: number;                // ms
    dns: number;                  // ms
    tcp: number;                  // ms
    ttfb: number;                 // Time to First Byte
    download: number;             // ms
  };
  headers: {
    request: Record<string, string>;
    response: Record<string, string>;
  };
  cacheHit: boolean;
  fromCache: boolean;
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
  lastModified: number;           // Unix timestamp
  expires?: number;               // Unix timestamp
  etag?: string;
}

/**
 * 캐시 통계
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;              // bytes
  hitRate: number;                // 0-1
  entries: CacheEntry[];
  expiredEntries: CacheEntry[];
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
```
- **검증**: TypeScript 컴파일 성공

---

### Task #12.2: Storage 상수 추가

- **파일**: `src/constants/storage.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
// 기존 STORAGE_KEYS에 추가
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 리소스 및 네트워크
  RESOURCE_NETWORK_SETTINGS: 'resourceNetwork:settings',
  RESOURCE_NETWORK_STATS: 'resourceNetwork:stats',
} as const;

// 기존 STORAGE_LIMITS에 추가
export const STORAGE_LIMITS = {
  // ... 기존 제한

  RESOURCE_MAX_NETWORK_HISTORY: 1000,
} as const;
```

---

### Task #12.3: 메시지 액션 추가

- **파일**: `src/constants/messages.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
// 기존 MESSAGE_ACTIONS에 추가
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 리소스 및 네트워크
  RESOURCE_STORAGE_GET_ALL: 'RESOURCE_STORAGE_GET_ALL',
  RESOURCE_STORAGE_CLEAR: 'RESOURCE_STORAGE_CLEAR',
  RESOURCE_STORAGE_CLEAR_DOMAIN: 'RESOURCE_STORAGE_CLEAR_DOMAIN',
  RESOURCE_ANIMATION_SCAN: 'RESOURCE_ANIMATION_SCAN',
  RESOURCE_ANIMATION_PAUSE: 'RESOURCE_ANIMATION_PAUSE',
  RESOURCE_ANIMATION_RESUME: 'RESOURCE_ANIMATION_RESUME',
  RESOURCE_NETWORK_GET_STATS: 'RESOURCE_NETWORK_GET_STATS',
  RESOURCE_CACHE_GET_STATS: 'RESOURCE_CACHE_GET_STATS',
  RESOURCE_CACHE_CLEAR: 'RESOURCE_CACHE_CLEAR',
} as const;
```

---

### Task #12.4: 리소스 타입 상수

- **파일**: `src/constants/resourceTypes.ts`
- **시간**: 15분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { ResourceType, AnimationType } from '../types/resourceNetwork';

/**
 * 리소스 타입 라벨
 */
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  document: '문서',
  stylesheet: '스타일시트',
  script: '스크립트',
  image: '이미지',
  font: '폰트',
  xhr: 'XHR',
  fetch: 'Fetch',
  websocket: 'WebSocket',
  other: '기타',
};

/**
 * 리소스 타입 아이콘
 */
export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  document: '📄',
  stylesheet: '🎨',
  script: '📜',
  image: '🖼️',
  font: '🔤',
  xhr: '🔄',
  fetch: '📡',
  websocket: '🔌',
  other: '📦',
};

/**
 * 애니메이션 타입 라벨
 */
export const ANIMATION_TYPE_LABELS: Record<AnimationType, string> = {
  css: 'CSS 애니메이션',
  js: 'JS 애니메이션',
  'web-animation': 'Web Animation API',
};

/**
 * 성능 영향 라벨
 */
export const PERFORMANCE_IMPACT_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: '낮음',
  medium: '중간',
  high: '높음',
};

/**
 * 성능 영향 색상
 */
export const PERFORMANCE_IMPACT_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: '#10B981',    // green
  medium: '#F59E0B', // amber
  high: '#EF4444',   // red
};

/**
 * HTTP 상태 코드 분류
 */
export const HTTP_STATUS_CATEGORIES = {
  INFO: { min: 100, max: 199, color: '#3B82F6', label: '정보' },
  SUCCESS: { min: 200, max: 299, color: '#10B981', label: '성공' },
  REDIRECT: { min: 300, max: 399, color: '#F59E0B', label: '리다이렉트' },
  CLIENT_ERROR: { min: 400, max: 499, color: '#EF4444', label: '클라이언트 오류' },
  SERVER_ERROR: { min: 500, max: 599, color: '#DC2626', label: '서버 오류' },
} as const;
```

---

### Task #12.5: 에러 메시지 추가

- **파일**: `src/constants/errors.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
// 기존 ERROR_MESSAGES에 추가
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  RESOURCE_NETWORK: {
    STORAGE_ACCESS_FAILED: '스토리지 접근에 실패했습니다',
    COOKIE_ACCESS_FAILED: '쿠키 접근이 거부되었습니다',
    ANIMATION_SCAN_FAILED: '애니메이션 스캔에 실패했습니다',
    NETWORK_MONITOR_FAILED: '네트워크 모니터링을 시작할 수 없습니다',
    CACHE_ACCESS_FAILED: '캐시 정보를 가져올 수 없습니다',
    PERMISSION_DENIED: '필요한 권한이 거부되었습니다',
  },
} as const;
```

---

### Task #12.6: 기본 설정 값

- **파일**: `src/constants/defaults.ts`
- **시간**: 10분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { ResourceNetworkSettings } from '../types/resourceNetwork';

export const DEFAULT_RESOURCE_NETWORK_SETTINGS: ResourceNetworkSettings = {
  storage: {
    autoClean: false,
    cleanOnClose: false,
    preserveDomains: [],
  },
  animation: {
    highlightOnHover: true,
    showPerformanceImpact: true,
    pauseAll: false,
  },
  network: {
    captureRequests: true,
  },
  cache: {
    showExpired: true,
    autoCleanExpired: false,
  },
};
```

---

### Task #12.7: 유틸리티 헬퍼

- **파일**: `src/utils/resourceNetwork/helpers.ts`
- **시간**: 20분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { StorageItem, CookieInfo, NetworkRequest, CacheEntry } from '../../types/resourceNetwork';

/**
 * 문자열 크기 계산 (bytes)
 */
export function getStringSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * 스토리지 항목 크기 계산
 */
export function calculateStorageItemSize(key: string, value: string): number {
  return getStringSize(key) + getStringSize(value);
}

/**
 * 바이트를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 밀리초를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * URL에서 도메인 추출
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 쿠키를 스토리지 항목으로 변환
 */
export function cookieToStorageItem(cookie: CookieInfo): StorageItem {
  return {
    key: cookie.name,
    value: cookie.value,
    size: cookie.size,
    type: 'cookies',
    domain: cookie.domain,
  };
}

/**
 * 도메인별로 스토리지 항목 그룹화
 */
export function groupItemsByDomain(items: StorageItem[]): Record<string, StorageItem[]> {
  const grouped: Record<string, StorageItem[]> = {};

  for (const item of items) {
    const domain = item.domain || window.location.hostname;
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(item);
  }

  return grouped;
}

/**
 * 네트워크 요청 필터링
 */
export function filterRequests(
  requests: NetworkRequest[],
  filters: {
    type?: ResourceType;
    status?: number;
    minDuration?: number;
    failed?: boolean;
  }
): NetworkRequest[] {
  return requests.filter(req => {
    if (filters.type && req.type !== filters.type) return false;
    if (filters.status && req.status !== filters.status) return false;
    if (filters.minDuration && req.duration < filters.minDuration) return false;
    if (filters.failed && req.status >= 200 && req.status < 300) return false;
    return true;
  });
}

/**
 * 캐시 만료 여부 확인
 */
export function isCacheEntryExpired(entry: CacheEntry): boolean {
  if (!entry.expires) return false;
  return entry.expires < Date.now();
}

/**
 * Unix timestamp를 날짜 문자열로 변환
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ko-KR');
}
```
- **검증**: 모든 헬퍼 함수 정상 동작

---

[Phase 2: 쿠키/스토리지 클리너](./TASK-12-PHASE2.md) 로 계속
