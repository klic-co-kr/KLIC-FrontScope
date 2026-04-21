/**
 * Data Export
 *
 * 리소스 네트워크 데이터 내보내기
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceNetworkSettings, StorageStats, CacheStats } from '../../../types/resourceNetwork';
import { exportAnimations } from '../animation/animationExport';
import { convertToHAR } from '../network/harExport';
import { exportCache } from '../cache/cacheExport';

export interface ResourceNetworkExport {
  version: string;
  timestamp: number;
  url: string;
  settings: ResourceNetworkSettings;
  storage?: StorageStats;
  cache?: CacheStats;
  network?: {
    totalRequests: number;
    totalSize: number;
  };
  animations?: {
    totalAnimations: number;
    cssCount: number;
    jsCount: number;
  };
}

export async function exportAllData(
  settings: ResourceNetworkSettings,
  storage?: StorageStats,
  cache?: CacheStats,
  networkData?: {
    totalRequests: number;
    totalSize: number;
  },
  animationData?: {
    totalAnimations: number;
    cssCount: number;
    jsCount: number;
  }
): Promise<ResourceNetworkExport> {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    url: window.location.href,
    settings,
    storage,
    cache,
    network: networkData,
    animations: animationData,
  };
}

export function downloadExport(data: ResourceNetworkExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resource-network-export-${new Date(data.timestamp)
    .toISOString()
    .replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 개별 내보내기 함수들
 */
export async function exportStorageData(
  storage: StorageStats
): Promise<void> {
  const data = {
    version: '1.0.0',
    timestamp: Date.now(),
    url: window.location.href,
    type: 'storage',
    data: storage,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCacheData(cache: CacheStats): Promise<void> {
  const data = await exportCache(cache, false);
  downloadExport(data as any);
}

export async function exportNetworkData(
  requests: any[]
): Promise<void> {
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

export async function exportAnimationData(
  animations: any[]
): Promise<void> {
  const data = exportAnimations(animations);
  downloadExport(data as any);
}

/**
 * 전체 리포트 생성
 */
export function generateFullReport(data: {
  settings: ResourceNetworkSettings;
  storage?: StorageStats;
  cache?: CacheStats;
  network?: {
    totalRequests: number;
    totalSize: number;
  };
  animations?: {
    totalAnimations: number;
    cssCount: number;
    jsCount: number;
  };
}): string {
  const sections: string[] = [];

  sections.push('# 리소스 네트워크 분석 리포트');
  sections.push('');
  sections.push(`**생성일시**: ${new Date().toLocaleString('ko-KR')}`);
  sections.push(`**URL**: ${window.location.href}`);
  sections.push('');

  // 설정 섹션
  sections.push('## 설정');
  sections.push(`- 자동 정리: ${data.settings.storage.autoClean ? 'ON' : 'OFF'}`);
  sections.push(`- 애니메이션 하이라이트: ${data.settings.animation.highlightOnHover ? 'ON' : 'OFF'}`);
  sections.push(`- 네트워크 캡처: ${data.settings.network.captureRequests ? 'ON' : 'OFF'}`);
  sections.push('');

  // 스토리지 섹션
  if (data.storage) {
    sections.push('## 스토리지');
    sections.push(`- LocalStorage: ${data.storage.localStorage.count}개 (${formatBytes(data.storage.localStorage.totalSize)})`);
    sections.push(`- SessionStorage: ${data.storage.sessionStorage.count}개 (${formatBytes(data.storage.sessionStorage.totalSize)})`);
    sections.push(`- Cookies: ${data.storage.cookies.count}개 (${formatBytes(data.storage.cookies.totalSize)})`);
    sections.push(`- 전체: ${formatBytes(data.storage.totalSize)}`);
    sections.push('');
  }

  // 캐시 섹션
  if (data.cache) {
    sections.push('## 캐시');
    sections.push(`- 전체 항목: ${data.cache.totalEntries}개`);
    sections.push(`- 전체 크기: ${formatBytes(data.cache.totalSize)}`);
    sections.push(`- 히트율: ${Math.round((data.cache.hitRate ?? 0) * 100)}%`);
    sections.push(`- 만료된 항목: ${data.cache.expiredEntries.length}개`);
    sections.push('');
  }

  // 네트워크 섹션
  if (data.network) {
    sections.push('## 네트워크');
    sections.push(`- 전체 요청: ${data.network.totalRequests}개`);
    sections.push(`- 전체 크기: ${formatBytes(data.network.totalSize)}`);
    sections.push('');
  }

  // 애니메이션 섹션
  if (data.animations) {
    sections.push('## 애니메이션');
    sections.push(`- 전체: ${data.animations.totalAnimations}개`);
    sections.push(`- CSS: ${data.animations.cssCount}개`);
    sections.push(`- JS: ${data.animations.jsCount}개`);
    sections.push('');
  }

  return sections.join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Markdown 리포트 다운로드
 */
export function downloadMarkdownReport(data: {
  settings: ResourceNetworkSettings;
  storage?: StorageStats;
  cache?: CacheStats;
  network?: {
    totalRequests: number;
    totalSize: number;
  };
  animations?: {
    totalAnimations: number;
    cssCount: number;
    jsCount: number;
  };
}): void {
  const markdown = generateFullReport(data);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resource-network-report-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
