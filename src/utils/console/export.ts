/**
 * Log Export Utilities
 *
 * 로그 내보내기 (JSON/TXT/CSV)
 */

import { ConsoleLog, ExportOptions } from '../../types/console';

/**
 * 로그 내보내기
 */
export function exportLogs(logs: ConsoleLog[], options: ExportOptions): string {
  // 필터 적용
  let filteredLogs = logs;

  if (options.includedLevels && options.includedLevels.length > 0) {
    filteredLogs = filteredLogs.filter((log) =>
      options.includedLevels!.includes(log.level)
    );
  }

  if (options.dateRange) {
    filteredLogs = filteredLogs.filter(
      (log) =>
        log.timestamp >= options.dateRange!.start &&
        log.timestamp <= options.dateRange!.end
    );
  }

  // 포맷에 따라 변환
  switch (options.format) {
    case 'json':
      return exportAsJSON(filteredLogs, options);
    case 'txt':
      return exportAsText(filteredLogs, options);
    case 'csv':
      return exportAsCSV(filteredLogs, options);
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

/**
 * JSON 포맷으로 내보내기
 */
function exportAsJSON(logs: ConsoleLog[], options: ExportOptions): string {
  const exportData = logs.map((log) => {
    const data: Record<string, unknown> = {
      id: log.id,
      timestamp: log.timestamp,
      time: formatTimestamp(log.timestamp),
      level: log.level,
      message: log.message,
      args: log.args,
    };

    if (options.includeStackTrace && log.stackTrace) {
      data.stackTrace = log.stackTrace;
    }

    if (options.includeMetadata && log.metadata) {
      data.metadata = log.metadata;
    }

    if (log.source) {
      data.source = log.source;
    }

    if (log.performance) {
      data.performance = log.performance;
    }

    return data;
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * 텍스트 포맷으로 내보내기
 */
function exportAsText(logs: ConsoleLog[], options: ExportOptions): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('Console Logs Export');
  lines.push(`Exported at: ${formatTimestamp(Date.now())}`);
  lines.push(`Total logs: ${logs.length}`);
  lines.push('='.repeat(80));
  lines.push('');

  for (const log of logs) {
    const time = formatTimestamp(log.timestamp);
    const level = log.level.toUpperCase().padEnd(5);

    lines.push(`[${time}] ${level} ${log.message}`);

    if (log.source) {
      lines.push(`  Source: ${log.source.file}:${log.source.line}:${log.source.column}`);
    }

    if (log.performance) {
      lines.push(`  Performance: ${log.performance.label} - ${log.performance.duration.toFixed(2)}ms`);
    }

    if (options.includeStackTrace && log.stackTrace) {
      lines.push(`  Stack Trace:`);
      log.stackTrace.split('\n').forEach((line) => {
        lines.push(`    ${line}`);
      });
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * CSV 포맷으로 내보내기
 */
function exportAsCSV(logs: ConsoleLog[], options: ExportOptions): string {
  const headers = ['Timestamp', 'Time', 'Level', 'Message'];

  if (options.includeMetadata) {
    headers.push('URL', 'User Agent');
  }

  if (options.includeStackTrace) {
    headers.push('Stack Trace');
  }

  const rows: string[][] = [headers];

  for (const log of logs) {
    const row = [
      log.timestamp.toString(),
      formatTimestamp(log.timestamp),
      log.level,
      escapeCSV(log.message),
    ];

    if (options.includeMetadata && log.metadata) {
      row.push(escapeCSV(log.metadata.url), escapeCSV(log.metadata.userAgent));
    }

    if (options.includeStackTrace) {
      row.push(escapeCSV(log.stackTrace || ''));
    }

    rows.push(row);
  }

  return rows.map((row) => row.join(',')).join('\n');
}

/**
 * CSV 이스케이프
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 파일 다운로드
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * 타임스탬프 포맷
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}
