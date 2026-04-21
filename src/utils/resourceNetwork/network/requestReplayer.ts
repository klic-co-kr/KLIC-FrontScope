/**
 * Request Replayer
 *
 * 네트워크 요청 재생 기능 제공
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkRequest } from '../../../types/resourceNetwork';

/**
 * 재생 결과
 */
export interface ReplayResult {
  id: string;
  url: string;
  success: boolean;
  status?: number;
  duration?: number;
  error?: string;
}

/**
 * 요청 재생
 */
export async function replayRequest(
  request: NetworkRequest
): Promise<ReplayResult> {
  const startTime = performance.now();

  try {
    const requestHeaders = typeof request.headers === 'object' && request.headers !== null && !Array.isArray(request.headers)
      ? (request.headers as { request?: Record<string, string> }).request
      : undefined;

    const options: RequestInit = {
      method: request.method,
      headers: requestHeaders,
    };

    // POST/PUT 등의 경우 body 필요 (실제로는 원본 요청과 다를 수 있음)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // body는 원본 요청에서 복원할 수 없으므로 빈 값 사용
      options.body = '';
    }

    const response = await fetch(request.url, options);
    const duration = performance.now() - startTime;

    return {
      id: request.id,
      url: request.url,
      success: response.ok,
      status: response.status,
      duration,
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    return {
      id: request.id,
      url: request.url,
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 여러 요청 재생
 */
export async function replayRequests(
  requests: NetworkRequest[],
  options: {
    parallel?: boolean;
    delay?: number;
    filter?: (req: NetworkRequest) => boolean;
  } = {}
): Promise<ReplayResult[]> {
  const { delay = 0, filter } = options;

  let filteredRequests = filter ? requests.filter(filter) : requests;

  // GET 요청만 재생 (POST 등은 부작용이 있을 수 있음)
  filteredRequests = filteredRequests.filter((req) => req.method === 'GET');

  if (delay > 0) {
    // 순차적 재생
    const results: ReplayResult[] = [];

    for (const request of filteredRequests) {
      const result = await replayRequest(request);
      results.push(result);

      if (delay > 0) {
        await sleep(delay);
      }
    }

    return results;
  }

  // 병렬 재생
  return Promise.all(filteredRequests.map((req) => replayRequest(req)));
}

/**
 * 대기
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 재생 비교
 */
export interface ReplayComparison {
  original: NetworkRequest;
  replayed: ReplayResult;
  statusMatch: boolean;
  durationDiff: number;
  sizeMatch?: boolean;
}

export function compareReplay(
  original: NetworkRequest,
  replayed: ReplayResult
): ReplayComparison {
  return {
    original,
    replayed,
    statusMatch: original.status === (replayed.status || 0),
    durationDiff: (replayed.duration || 0) - original.duration,
    sizeMatch: replayed.success
      ? original.size === (replayed.status ? 0 : 1)
      : undefined,
  };
}

/**
 * 재생 리포트 생성
 */
export function generateReplayReport(comparisons: ReplayComparison[]): {
  total: number;
  success: number;
  failed: number;
  statusChanged: number;
  slower: number;
  faster: number;
  details: ReplayComparison[];
} {
  const success = comparisons.filter((c) => c.replayed.success).length;
  const failed = comparisons.filter((c) => !c.replayed.success).length;
  const statusChanged = comparisons.filter((c) => !c.statusMatch).length;
  const slower = comparisons.filter((c) => c.durationDiff > 100).length;
  const faster = comparisons.filter((c) => c.durationDiff < -100).length;

  return {
    total: comparisons.length,
    success,
    failed,
    statusChanged,
    slower,
    faster,
    details: comparisons,
  };
}

/**
 * HAR에서 요청 재생
 */
export async function replayFromHAR(
  harFile: File,
  options: {
    parallel?: boolean;
    limit?: number;
  } = {}
): Promise<ReplayResult[]> {
  const text = await harFile.text();
  const har = JSON.parse(text);

  let entries = har.log.entries || [];

  if (options.limit) {
    entries = entries.slice(0, options.limit);
  }

  const requests: NetworkRequest[] = entries.map((entry: any, idx: number) => ({
    id: `har-replay-${Date.now()}-${idx}`,
    url: entry.request.url,
    method: entry.request.method,
    type: 'other',
    status: entry.response.status,
    statusText: entry.response.statusText,
    duration: entry.time,
    size: {
      transferred: entry.response.bodySize,
      uncompressed: entry.response.content.size,
    },
    timing: {
      start: 0,
      dns: entry.timings.dns || 0,
      tcp: entry.timings.connect || 0,
      ttfb: entry.timings.wait || 0,
      download: entry.timings.receive || 0,
    },
    headers: {
      request: Object.fromEntries(
        entry.request.headers.map((h: any) => [h.name, h.value])
      ),
      response: Object.fromEntries(
        entry.response.headers.map((h: any) => [h.name, h.value])
      ),
    },
    cacheHit: false,
    fromCache: false,
  }));

  return replayRequests(requests, options);
}

/**
 * CURL 명령어 생성
 */
export function generateCurlCommand(request: NetworkRequest): string {
  let cmd = `curl -X ${request.method}`;

  // 헤더 추가
  const requestHeaders = typeof request.headers === 'object' && request.headers !== null && !Array.isArray(request.headers)
    ? (request.headers as { request?: Record<string, string> }).request ?? {}
    : {};
  for (const [name, value] of Object.entries(requestHeaders)) {
    cmd += ` -H "${name}: ${value}"`;
  }

  // URL
  cmd += ` "${request.url}"`;

  return cmd;
}

/**
 * 여러 요청에 대한 CURL 명령어 생성
 */
export function generateCurlScript(requests: NetworkRequest[]): string {
  const shebang = '#!/bin/bash\n';
  const commands = requests.map((req) => generateCurlCommand(req)).join('\n');

  return shebang + commands;
}

/**
 * CURL 스크립트 다운로드
 */
export function downloadCurlScript(requests: NetworkRequest[]): void {
  const script = generateCurlScript(requests);
  const blob = new Blob([script], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `replay-requests-${Date.now()}.sh`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Postman 컬렉션 생성
 */
export function generatePostmanCollection(
  requests: NetworkRequest[]
): object {
  const items = requests.map((req) => {
    const requestHeaders = typeof req.headers === 'object' && req.headers !== null && !Array.isArray(req.headers)
      ? (req.headers as { request?: Record<string, string> }).request ?? {}
      : {};

    return {
      name: req.url,
      request: {
        method: req.method,
        header: Object.entries(requestHeaders).map(([key, value]) => ({
          key,
          value,
        })),
        url: {
          raw: req.url,
        },
      },
    };
  });

  return {
    info: {
      name: 'KLIC Export',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: items,
  };
}

/**
 * Postman 컬렉션 다운로드
 */
export function downloadPostmanCollection(requests: NetworkRequest[]): void {
  const collection = generatePostmanCollection(requests);
  const blob = new Blob([JSON.stringify(collection, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `postman-collection-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
