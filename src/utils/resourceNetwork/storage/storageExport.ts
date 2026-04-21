/**
 * Storage Export/Import
 *
 * 스토리지 데이터 내보내기/가져오기 기능 제공
 */

import { StorageStats, StorageExport } from '../../../types/resourceNetwork';

/**
 * 스토리지 내보내기
 */
export function exportStorage(stats: StorageStats): StorageExport {
  return {
    timestamp: Date.now(),
    url: window.location.href,
    localStorage: stats.localStorage.items.map((item) => ({
      key: item.key,
      value: item.value,
    })),
    sessionStorage: stats.sessionStorage.items.map((item) => ({
      key: item.key,
      value: item.value,
    })),
    cookies: stats.cookies.items.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
    })),
  };
}

/**
 * JSON 파일로 다운로드
 */
export function downloadStorageExport(exp: StorageExport): void {
  const blob = new Blob([JSON.stringify(exp, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${new Date(exp.timestamp).toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 스토리지 가져오기
 */
export function importStorage(exp: StorageExport): {
  success: boolean;
  localStorage: { imported: number; failed: number };
  sessionStorage: { imported: number; failed: number };
  cookies: { imported: number; failed: number };
} {
  const result = {
    success: true,
    localStorage: { imported: 0, failed: 0 },
    sessionStorage: { imported: 0, failed: 0 },
    cookies: { imported: 0, failed: 0 },
  };

  // LocalStorage 복원
  for (const item of exp.localStorage) {
    try {
      localStorage.setItem(item.key, item.value);
      result.localStorage.imported++;
    } catch (error) {
      console.error(`Failed to restore localStorage item "${item.key}":`, error);
      result.localStorage.failed++;
      result.success = false;
    }
  }

  // SessionStorage 복원
  for (const item of exp.sessionStorage) {
    try {
      sessionStorage.setItem(item.key, item.value);
      result.sessionStorage.imported++;
    } catch (error) {
      console.error(`Failed to restore sessionStorage item "${item.key}":`, error);
      result.sessionStorage.failed++;
      result.success = false;
    }
  }

  // 쿠키 복원 (Chrome Extension API 필요)
  if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.set) {
    for (const cookie of exp.cookies) {
      chrome.cookies
        .set({
          url: `https://${cookie.domain}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
        })
        .then(() => {
          result.cookies.imported++;
        })
        .catch((error) => {
          console.error(`Failed to restore cookie "${cookie.name}":`, error);
          result.cookies.failed++;
          result.success = false;
        });
    }
  }

  return result;
}

/**
 * 파일에서 가져오기
 */
export async function importStorageFromFile(file: File): Promise<{
  success: boolean;
  data?: StorageExport;
  error?: string;
}> {
  try {
    const text = await file.text();
    const exp: StorageExport = JSON.parse(text);

    // 유효성 검사
    if (!exp.timestamp || !exp.url) {
      return { success: false, error: '유효하지 않은 파일 형식입니다' };
    }

    return { success: true, data: exp };
  } catch (error) {
    console.error('Failed to import storage from file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 읽기에 실패했습니다',
    };
  }
}

/**
 * CSV 형식으로 내보내기
 */
export function exportStorageAsCsv(stats: StorageStats): void {
  const rows: string[] = [];

  // 헤더
  rows.push('Type,Key/Name,Value,Size,Domain');

  // LocalStorage
  for (const item of stats.localStorage.items) {
    rows.push(
      `localStorage,${escapeCsv(item.key)},${escapeCsv(item.value)},${item.size},`
    );
  }

  // SessionStorage
  for (const item of stats.sessionStorage.items) {
    rows.push(
      `sessionStorage,${escapeCsv(item.key)},${escapeCsv(item.value)},${item.size},`
    );
  }

  // Cookies
  for (const cookie of stats.cookies.items) {
    rows.push(
      `cookies,${escapeCsv(cookie.name)},${escapeCsv(cookie.value)},${cookie.size},${cookie.domain}`
    );
  }

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
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
 * 스토리지 통계 보고서 생성
 */
export function generateStorageReport(stats: StorageStats): string {
  const lines: string[] = [];

  lines.push('# Storage Analysis Report');
  lines.push(`Generated: ${new Date().toLocaleString('ko-KR')}`);
  lines.push(`URL: ${window.location.href}`);
  lines.push('');

  lines.push('## Summary');
  lines.push(`Total Size: ${formatBytes(stats.totalSize)}`);
  lines.push(`Total Items: ${stats.localStorage.count + stats.sessionStorage.count + stats.cookies.count}`);
  lines.push('');

  lines.push('## LocalStorage');
  lines.push(`Count: ${stats.localStorage.count}`);
  lines.push(`Size: ${formatBytes(stats.localStorage.totalSize)}`);
  lines.push('');

  lines.push('## SessionStorage');
  lines.push(`Count: ${stats.sessionStorage.count}`);
  lines.push(`Size: ${formatBytes(stats.sessionStorage.totalSize)}`);
  lines.push('');

  lines.push('## Cookies');
  lines.push(`Count: ${stats.cookies.count}`);
  lines.push(`Size: ${formatBytes(stats.cookies.totalSize)}`);
  lines.push('');

  // 상위 10개 대용량 항목
  lines.push('## Top 10 Largest Items');
  const allItems = [
    ...stats.localStorage.items.map((item) => ({ ...item, storage: 'localStorage' })),
    ...stats.sessionStorage.items.map((item) => ({ ...item, storage: 'sessionStorage' })),
  ].sort((a, b) => b.size - a.size);

  for (const item of allItems.slice(0, 10)) {
    lines.push(
      `- ${item.storage}:${item.key} (${formatBytes(item.size)})`
    );
  }

  return lines.join('\n');
}

/**
 * 보고서 다운로드
 */
export function downloadStorageReport(stats: StorageStats): void {
  const report = generateStorageReport(stats);
  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
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
 * 클립보드에 복사
 */
export async function copyStorageToClipboard(
  stats: StorageStats,
  format: 'json' | 'csv' = 'json'
): Promise<boolean> {
  try {
    let text = '';

    if (format === 'json') {
      text = JSON.stringify(exportStorage(stats), null, 2);
    } else {
      const rows: string[] = [];
      rows.push('Type,Key/Name,Value,Size,Domain');

      for (const item of stats.localStorage.items) {
        rows.push(
          `localStorage,${escapeCsv(item.key)},${escapeCsv(item.value)},${item.size},`
        );
      }
      for (const item of stats.sessionStorage.items) {
        rows.push(
          `sessionStorage,${escapeCsv(item.key)},${escapeCsv(item.value)},${item.size},`
        );
      }
      for (const cookie of stats.cookies.items) {
        rows.push(
          `cookies,${escapeCsv(cookie.name)},${escapeCsv(cookie.value)},${cookie.size},${cookie.domain}`
        );
      }

      text = rows.join('\n');
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
