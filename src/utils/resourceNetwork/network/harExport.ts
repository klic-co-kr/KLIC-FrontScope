/**
 * HAR (HTTP Archive) Export
 *
 * 네트워크 요청을 HAR 형식으로 내보내기
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
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
      pageTimings: {
        onContentLoad: number;
        onLoad: number;
      };
    }>;
    entries: HAREntry[];
  };
}

export interface HAREntry {
  pageref: string;
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: {
    beforeRequest: Record<string, unknown>;
    afterRequest: Record<string, unknown>;
  };
  timings: {
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
    ssl: number;
  };
}

/**
 * NetworkRequest를 HAR로 변환
 */
export function convertToHAR(requests: NetworkRequest[]): HAR {
  const pageId = 'page_1';
  const pageTimings = calculatePageTimings();

  return {
    log: {
      version: '1.2',
      creator: {
        name: 'KLIC Extension',
        version: '1.0.0',
      },
      pages: [
        {
          startedDateTime: new Date().toISOString(),
          id: pageId,
          title: document.title,
          pageTimings,
        },
      ],
      entries: requests.map((req) => convertToHAREntry(req, pageId)),
    },
  };
}

/**
 * NetworkRequest를 HAREntry로 변환
 */
function convertToHAREntry(
  request: NetworkRequest,
  pageId: string
): HAREntry {
  // URL에서 쿼리 파라미터 추출
  const queryString = extractQueryString(request.url);

  // 요청 헤더
  const requestHeaders = request.headers?.request
    ? Object.entries(request.headers.request).map(
        ([name, value]) => ({ name, value })
      )
    : [];

  // 응답 헤더
  const responseHeaders = request.headers?.response
    ? Object.entries(request.headers.response).map(
        ([name, value]) => ({ name, value })
      )
    : [];

  return {
    pageref: pageId,
    startedDateTime: new Date(Date.now() - request.duration).toISOString(),
    time: Math.round(request.duration),
    request: {
      method: request.method,
      url: request.url,
      httpVersion: 'HTTP/1.1',
      headers: requestHeaders,
      queryString,
      headersSize: -1,
      bodySize: request.size,
    },
    response: {
      status: request.status,
      statusText: request.statusText ?? '',
      httpVersion: 'HTTP/1.1',
      headers: responseHeaders,
      content: {
        size: request.size,
        mimeType: getMimeType(request.url),
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: request.size,
    },
    cache: {
      beforeRequest: {},
      afterRequest: {},
    },
    timings: {
      dns: Math.round(request.timing?.dns ?? 0),
      connect: Math.round(request.timing?.tcp ?? 0),
      send: 0,
      wait: Math.round(request.timing?.ttfb ?? 0),
      receive: Math.round(request.timing?.download ?? 0),
      ssl: -1,
    },
  };
}

/**
 * URL에서 쿼리 파라미터 추출
 */
function extractQueryString(url: string): Array<{ name: string; value: string }> {
  try {
    const urlObj = new URL(url);
    return Array.from(urlObj.searchParams.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  } catch {
    return [];
  }
}

/**
 * URL에서 MIME 타입 추론
 */
function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    css: 'text/css',
    js: 'application/javascript',
    mjs: 'application/javascript',
    json: 'application/json',
    html: 'text/html',
    htm: 'text/html',
    xml: 'text/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * 페이지 타이밍 계산
 */
function calculatePageTimings(): {
  onContentLoad: number;
  onLoad: number;
} {
  // DOMContentLoaded 및 Load 이벤트 시간은 Performance API에서 가져올 수 있음
  let onContentLoad = -1;
  let onLoad = -1;

  if ('performance' in window && (performance as Performance & { timing?: { domContentLoadedEventEnd: number; navigationStart: number; loadEventEnd: number } }).timing) {
    const timing = (performance as Performance & { timing: { domContentLoadedEventEnd: number; navigationStart: number; loadEventEnd: number } }).timing;
    onContentLoad = timing.domContentLoadedEventEnd - timing.navigationStart;
    onLoad = timing.loadEventEnd - timing.navigationStart;
  }

  return {
    onContentLoad: Math.max(0, onContentLoad),
    onLoad: Math.max(0, onLoad),
  };
}

/**
 * HAR 파일 다운로드
 */
export function downloadHAR(requests: NetworkRequest[]): void {
  const har = convertToHAR(requests);
  const blob = new Blob([JSON.stringify(har, null, 2)], {
    type: 'application/json',
  });
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

  return har.log.entries.map((entry, idx) => ({
    id: `har-${Date.now()}-${idx}`,
    url: entry.request.url,
    method: entry.request.method as any,
    type: getTypeFromUrl(entry.request.url),
    status: entry.response.status,
    statusText: entry.response.statusText,
    duration: entry.time,
    size: entry.response.bodySize,
    timestamp: Date.now(),
    timing: {
      start: 0,
      dns: entry.timings.dns,
      tcp: entry.timings.connect,
      ttfb: entry.timings.wait,
      download: entry.timings.receive,
      total: entry.time,
    },
    headers: Object.fromEntries(
      entry.request.headers.map((h) => [h.name, h.value])
    ),
    cached: false,
  }));
}

/**
 * URL에서 리소스 타입 추론
 */
function getTypeFromUrl(url: string): NetworkRequest['type'] {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'stylesheet';
  if (ext === 'js' || ext === 'mjs') return 'script';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext || ''))
    return 'image';
  if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext || '')) return 'font';
  if (url.includes('/api/') || url.includes('/xhr/')) return 'xhr';
  if (url.startsWith('ws://') || url.startsWith('wss://')) return 'websocket';
  return 'other';
}

/**
 * HAR 요약 정보 생성
 */
export interface HARSummary {
  totalRequests: number;
  totalSize: number;
  totalTime: number;
  byType: Record<string, number>;
  byStatus: Record<number, number>;
}

export function summarizeHAR(har: HAR): HARSummary {
  const byType: Record<string, number> = {};
  const byStatus: Record<number, number> = {};
  let totalSize = 0;
  let totalTime = 0;

  for (const entry of har.log.entries) {
    // 타입별 카운트
    const type = getTypeFromUrl(entry.request.url);
    byType[type] = (byType[type] || 0) + 1;

    // 상태별 카운트
    byStatus[entry.response.status] =
      (byStatus[entry.response.status] || 0) + 1;

    totalSize += entry.response.bodySize;
    totalTime += entry.time;
  }

  return {
    totalRequests: har.log.entries.length,
    totalSize,
    totalTime,
    byType,
    byStatus,
  };
}

/**
 * HAR 유효성 검사
 */
export function validateHAR(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid HAR data' };
  }

  const har = data as HAR;

  if (!har.log) {
    return { valid: false, error: 'Missing log property' };
  }

  if (!har.log.version) {
    return { valid: false, error: 'Missing log.version' };
  }

  if (!Array.isArray(har.log.entries)) {
    return { valid: false, error: 'Invalid log.entries' };
  }

  return { valid: true };
}

/**
 * HAR에서 특정 도메인의 요청만 추출
 */
export function filterHARByDomain(har: HAR, domain: string): HAR {
  return {
    ...har,
    log: {
      ...har.log,
      entries: har.log.entries.filter((entry) => {
        try {
          const url = new URL(entry.request.url);
          return url.hostname.includes(domain);
        } catch {
          return false;
        }
      }),
    },
  };
}

/**
 * HAR에서 특정 타입의 요청만 추출
 */
export function filterHARByType(har: HAR, type: string): HAR {
  return {
    ...har,
    log: {
      ...har.log,
      entries: har.log.entries.filter((entry) => {
        const entryType = getTypeFromUrl(entry.request.url);
        return entryType === type;
      }),
    },
  };
}

/**
 * HAR을 CSV로 변환
 */
export function convertHARToCSV(har: HAR): string {
  const headers = [
    'URL',
    'Method',
    'Status',
    'Type',
    'Duration',
    'Size',
    'MIME Type',
  ];

  const rows = har.log.entries.map((entry) => [
    entry.request.url,
    entry.request.method,
    entry.response.status.toString(),
    getTypeFromUrl(entry.request.url),
    entry.time.toString(),
    entry.response.bodySize.toString(),
    entry.response.content.mimeType,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
