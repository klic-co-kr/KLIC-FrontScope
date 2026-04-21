/**
 * Cache Export
 *
 * 캐시 데이터 내보내기/가져오기
 */

import { CacheEntry, CacheStats } from '../../../types/resourceNetwork';

/**
 * 캐시 내보내기 데이터
 */
export interface CacheExport {
  version: string;
  timestamp: number;
  url: string;
  cacheName: string;
  entries: Array<{
    url: string;
    type: string;
    size: number;
    lastModified: number;
    expires?: number;
    etag?: string;
    content?: string; // 선택적: 실제 콘텐츠 (BASE64)
  }>;
}

/**
 * 캐시 내보내기
 */
export async function exportCache(
  stats: CacheStats,
  includeContent: boolean = false
): Promise<CacheExport> {
  const entries: CacheExport['entries'] = [];

  for (const entry of stats.entries) {
    const exportEntry: CacheExport['entries'][number] = {
      url: entry.url,
      type: entry.type,
      size: entry.size,
      lastModified: entry.lastModified ?? Date.now(),
      expires: entry.expires,
      etag: entry.etag,
    };

    // 선택적: 콘텐츠 포함
    if (includeContent) {
      try {
        const response = await fetch(entry.url);
        if (response.ok) {
          const blob = await response.blob();
          exportEntry.content = await blobToBase64(blob);
        }
      } catch {
        // 콘텐츠 가져오기 실패 시 무시
      }
    }

    entries.push(exportEntry);
  }

  return {
    version: '1.0.0',
    timestamp: Date.now(),
    url: window.location.href,
    cacheName: 'exported-cache',
    entries,
  };
}

/**
 * Blob을 Base64로 변환
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * JSON 파일 다운로드
 */
export function downloadCacheExport(data: CacheExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cache-export-${new Date(data.timestamp).toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV로 내보내기
 */
export function exportCacheToCsv(stats: CacheStats): void {
  const headers = ['URL', 'Type', 'Size', 'Last Modified', 'Expires', 'ETag'];

  const rows = stats.entries.map((entry) => [
    entry.url,
    entry.type,
    entry.size.toString(),
    entry.lastModified ? new Date(entry.lastModified).toISOString() : '',
    entry.expires ? new Date(entry.expires).toISOString() : '',
    entry.etag || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cache-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV 이스케이프
 */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * HTML 보고서 생성
 */
export function generateCacheReport(stats: CacheStats): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>캐시 분석 보고서</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
    h1 { color: #1f2937; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .summary-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card .value { font-size: 32px; font-weight: 700; color: #3b82f6; }
    .summary-card .label { color: #6b7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .expired { background: #fef3c7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>캐시 분석 보고서</h1>
    <p><strong>생성일:</strong> ${new Date().toLocaleString('ko-KR')}</p>

    <div class="summary">
      <div class="summary-card">
        <div class="value">${stats.totalEntries}</div>
        <div class="label">전체 항목</div>
      </div>
      <div class="summary-card">
        <div class="value">${formatBytes(stats.totalSize)}</div>
        <div class="label">전체 크기</div>
      </div>
      <div class="summary-card">
        <div class="value">${Math.round((stats.hitRate ?? 0) * 100)}%</div>
        <div class="label">캐시 히트율</div>
      </div>
      <div class="summary-card">
        <div class="value">${stats.expiredEntries.length}</div>
        <div class="label">만료된 항목</div>
      </div>
    </div>

    <h2>캐시 항목 목록</h2>
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>타입</th>
          <th>크기</th>
          <th>마지막 수정</th>
          <th>만료일</th>
        </tr>
      </thead>
      <tbody>
        ${stats.entries
          .slice(0, 100)
          .map(
            (entry) => `
          <tr class="${isEntryExpired(entry) ? 'expired' : ''}">
            <td><a href="${entry.url}" target="_blank">${truncateUrl(entry.url, 60)}</a></td>
            <td>${entry.type}</td>
            <td>${formatBytes(entry.size)}</td>
            <td>${formatDate(entry.lastModified ?? Date.now())}</td>
            <td>${entry.expires ? formatDate(entry.expires) : '없음'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

/**
 * 항목 만료 여부 확인
 */
function isEntryExpired(entry: CacheEntry): boolean {
  if (!entry.expires) return false;
  return entry.expires < Date.now();
}

/**
 * URL 줄이기
 */
function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength) + '...';
}

/**
 * 날짜 포맷
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ko-KR');
}

/**
 * 바이트 포맷
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * HTML 보고서 다운로드
 */
export function downloadCacheReport(stats: CacheStats): void {
  const html = generateCacheReport(stats);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cache-report-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 클립보드에 복사
 */
export async function copyCacheToClipboard(
  stats: CacheStats,
  format: 'json' | 'csv' = 'json'
): Promise<boolean> {
  try {
    let text = '';

    if (format === 'json') {
      const data = await exportCache(stats, false);
      text = JSON.stringify(data, null, 2);
    } else {
      // CSV
      const headers = ['URL', 'Type', 'Size', 'Last Modified'];
      const rows = stats.entries.map((entry) => [
        entry.url,
        entry.type,
        entry.size.toString(),
        (entry.lastModified ?? Date.now()).toString(),
      ]);
      text = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
