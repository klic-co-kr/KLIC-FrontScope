/**
 * Resource & Network Utility Helpers
 *
 * 리소스 및 네트워크 도구용 유틸리티 헬퍼 함수들
 */

import {
  StorageItem,
  CookieInfo,
  NetworkRequest,
  CacheEntry,
  ResourceType,
} from '../../types/resourceNetwork';

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
 * URL에서 경로 추출
 */
export function extractPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
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
    searchQuery?: string;
  }
): NetworkRequest[] {
  return requests.filter((req) => {
    if (filters.type && req.type !== filters.type) return false;
    if (filters.status && req.status !== filters.status) return false;
    if (filters.minDuration && req.duration < filters.minDuration) return false;
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
 * 네트워크 요청을 타입별로 그룹화
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

/**
 * 상대 시간 계산 (예: "5분 전", "2시간 전")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return formatTimestamp(timestamp);
}

/**
 * 쿠키 만료 여부 확인
 */
export function isCookieExpired(cookie: CookieInfo): boolean {
  if (!cookie.expiration) return false;
  return cookie.expiration < Date.now();
}

/**
 * HTTP 상태 코드가 성공인지 확인
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * HTTP 상태 코드가 리다이렉트인지 확인
 */
export function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * HTTP 상태 코드가 클라이언트 오류인지 확인
 */
export function isClientErrorStatus(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * HTTP 상태 코드가 서버 오류인지 확인
 */
export function isServerErrorStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * HTTP 상태 코드 카테고리 반환
 */
export function getStatusCategory(status: number): 'info' | 'success' | 'redirect' | 'client_error' | 'server_error' {
  if (status >= 100 && status < 200) return 'info';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client_error';
  return 'server_error';
}

/**
 * 리소스 URL에서 파일 확장자 추출
 */
export function extractFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot > 0) {
      return pathname.slice(lastDot + 1).toLowerCase();
    }
  } catch {
    // URL 파싱 실패 시 무시
  }
  return '';
}

/**
 * URL에서 리소스 타입 추측
 */
export function guessResourceTypeFromUrl(url: string): ResourceType {
  const ext = extractFileExtension(url);
  const path = extractPath(url).toLowerCase();

  // 확장자 기반 판단
  if (['css'].includes(ext)) return 'stylesheet';
  if (['js', 'mjs', 'cjs'].includes(ext)) return 'script';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'avif', 'bmp'].includes(ext)) return 'image';
  if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'font';

  // 경로 기반 판단
  if (path.includes('/api/') || path.includes('/v1/') || path.includes('/v2/')) return 'fetch';
  if (path.endsWith('.css')) return 'stylesheet';
  if (path.endsWith('.js')) return 'script';

  return 'other';
}

/**
 * MIME 타입에서 리소스 타입 추측
 */
export function guessResourceTypeFromMimeType(mimeType: string): ResourceType {
  const type = mimeType.toLowerCase();

  if (type.startsWith('text/css')) return 'stylesheet';
  if (type.startsWith('text/javascript') || type.startsWith('application/javascript')) return 'script';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('font/') || type.includes('woff') || type.includes('ttf')) return 'font';
  if (type.startsWith('text/html')) return 'document';

  return 'other';
}

/**
 * 배열을 지정된 크기로 청크 분할
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 배열에서 지정된 수의 항목을 랜덤하게 선택
 */
export function sampleArray<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * 백분율 계산
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * 평균 계산
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * 중앙값 계산
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * 퍼센타일 계산
 */
export function calculatePercentile(numbers: number[], percentile: number): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * 데이터를 URL 쿼리 문자열로 변환
 */
export function objectToQueryString(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

/**
 * JSON을 안전하게 파싱 (에러 시 기본값 반환)
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}
