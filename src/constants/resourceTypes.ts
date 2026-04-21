/**
 * Resource Type Constants
 *
 * 리소스 및 네트워크 도구에서 사용하는 타입 관련 상수
 */

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
 * 리소스 타입 색상
 */
export const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
  document: '#3B82F6',    // blue
  stylesheet: '#EC4899',  // pink
  script: '#F59E0B',      // amber
  image: '#10B981',       // green
  font: '#8B5CF6',        // violet
  xhr: '#06B6D4',         // cyan
  fetch: '#0EA5E9',       // sky
  websocket: '#6366F1',   // indigo
  other: '#6B7280',       // gray
};

/**
 * 애니메이션 타입 라벨
 */
export const ANIMATION_TYPE_LABELS: Record<AnimationType, string> = {
  css: 'CSS 애니메이션',
  js: 'JS 애니메이션',
  'web-animation': 'Web Animation API',
  transition: 'CSS 전이',
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

/**
 * HTTP 상태 코드별 라벨
 */
export const HTTP_STATUS_LABELS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/**
 * 네트워크 요청 메서드 라벨
 */
export const HTTP_METHOD_LABELS: Record<string, string> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
};

/**
 * 네트워크 요청 메서드 색상
 */
export const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: '#10B981',     // green
  POST: '#3B82F6',    // blue
  PUT: '#F59E0B',     // amber
  DELETE: '#EF4444',  // red
  PATCH: '#8B5CF6',   // violet
  HEAD: '#6B7280',    // gray
  OPTIONS: '#6B7280', // gray
};

/**
 * 스토리지 타입 라벨
 */
export const STORAGE_TYPE_LABELS: Record<'localStorage' | 'sessionStorage' | 'cookies', string> = {
  localStorage: 'LocalStorage',
  sessionStorage: 'SessionStorage',
  cookies: '쿠키',
};

/**
 * 스토리지 타입 아이콘
 */
export const STORAGE_TYPE_ICONS: Record<'localStorage' | 'sessionStorage' | 'cookies', string> = {
  localStorage: '💾',
  sessionStorage: '⏱️',
  cookies: '🍪',
};

/**
 * 캐시 상태 라벨
 */
export const CACHE_STATUS_LABELS = {
  HIT: '캐시 적중',
  MISS: '캐시 미스',
  EXPIRED: '만료됨',
  NONE: '없음',
} as const;

/**
 * 캐시 상태 색상
 */
export const CACHE_STATUS_COLORS = {
  HIT: '#10B981',     // green
  MISS: '#EF4444',    // red
  EXPIRED: '#F59E0B', // amber
  NONE: '#6B7280',    // gray
} as const;

/**
 * SameSite 속성 라벨
 */
export const SAME_SITE_LABELS: Record<'strict' | 'lax' | 'none', string> = {
  strict: 'Strict',
  lax: 'Lax',
  none: 'None',
};

/**
 * 예약어드 클린 스케줄 라벨
 */
export const SCHEDULE_LABELS: Record<'daily' | 'weekly' | 'monthly', string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};
