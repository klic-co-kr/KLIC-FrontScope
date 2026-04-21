/**
 * Data Import
 *
 * 리소스 네트워크 데이터 가져오기
 */

import { ResourceNetworkExport } from './dataExport';
import { STORAGE_KEYS } from '../../../constants/storage';
import { importStorage } from '../storage/storageExport';
import { loadHAR } from '../network/harExport';

export async function importData(file: File): Promise<{
  success: boolean;
  data?: ResourceNetworkExport;
  error?: string;
  imported: {
    settings: boolean;
    storage: boolean;
    network: boolean;
    animations: boolean;
  };
}> {
  try {
    const text = await file.text();
    const data: ResourceNetworkExport = JSON.parse(text);

    // 버전 확인
    if (data.version !== '1.0.0') {
      return {
        success: false,
        error: '지원하지 않는 파일 형식입니다',
        imported: { settings: false, storage: false, network: false, animations: false },
      };
    }

    const imported = {
      settings: false,
      storage: false,
      network: false,
      animations: false,
    };

    // 설정 복원
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: data.settings,
      });
      imported.settings = true;
    }

    // 스토리지 복원
    if (data.storage) {
      importStorage({
        timestamp: data.timestamp,
        url: data.url,
        localStorage: data.storage.localStorage.items.map((item: { key: string; value: string }) => ({
          key: item.key,
          value: item.value,
        })),
        sessionStorage: data.storage.sessionStorage.items.map((item: { key: string; value: string }) => ({
          key: item.key,
          value: item.value,
        })),
        cookies: data.storage.cookies.items.map((cookie: { name: string; value: string; domain: string }) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
        })),
      });
      imported.storage = true;
    }

    // 네트워크 데이터는 복원 불가능 (읽기 전용)

    // 애니메이션 데이터도 복원 불가능 (읽기 전용)

    return {
      success: true,
      data,
      imported,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 읽기에 실패했습니다',
      imported: { settings: false, storage: false, network: false, animations: false },
    };
  }
}

export async function importSettings(file: File): Promise<void> {
  const data = await importData(file);
  if (!data.success || !data.data) {
    throw new Error(data.error || '가져오기 실패');
  }

  // 설정만 적용
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: data.data.settings,
    });
  }
}

export async function importStorageOnly(file: File): Promise<void> {
  const data = await importData(file);
  if (!data.success || !data.data?.storage) {
    throw new Error(data.error || '가져오기 실패');
  }

  // 스토리지만 적용
  importStorage({
    timestamp: data.data.timestamp,
    url: data.data.url,
    localStorage: data.data.storage.localStorage.items.map((item: { key: string; value: string }) => ({
      key: item.key,
      value: item.value,
    })),
    sessionStorage: data.data.storage.sessionStorage.items.map((item: { key: string; value: string }) => ({
      key: item.key,
      value: item.value,
    })),
    cookies: data.data.storage.cookies.items.map((cookie: { name: string; value: string; domain: string }) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
    })),
  });
}

export async function importHarFile(file: File): Promise<{
  success: boolean;
  requestCount: number;
  error?: string;
}> {
  try {
    const requests = await loadHAR(file);
    return {
      success: true,
      requestCount: requests.length,
    };
  } catch (error) {
    return {
      success: false,
      requestCount: 0,
      error: error instanceof Error ? error.message : 'HAR 파일 읽기 실패',
    };
  }
}

export async function validateImportFile(file: File): Promise<{
  valid: boolean;
  type?: 'settings' | 'storage' | 'har' | 'unknown';
  error?: string;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // 리소스 네트워크 내보내기 파일 확인
    if (data.version && data.settings) {
      return { valid: true, type: 'settings' };
    }

    // HAR 파일 확인
    if (data.log && data.log.version && data.log.entries) {
      return { valid: true, type: 'har' };
    }

    // 스토리지 내보내기 파일 확인
    if (data.timestamp && (data.localStorage || data.sessionStorage || data.cookies)) {
      return { valid: true, type: 'storage' };
    }

    return {
      valid: false,
      type: 'unknown',
      error: '알 수 없는 파일 형식입니다',
    };
  } catch {
    return {
      valid: false,
      error: 'JSON 파싱 실패',
    };
  }
}

/**
 * 드래그 앤 드롭 처리
 */
export function setupFileDropHandler(
  element: HTMLElement,
  onFileLoaded: (file: File, type: 'settings' | 'storage' | 'har' | 'unknown') => void
): () => void {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validation = await validateImportFile(file);
      onFileLoaded(file, validation.type || 'unknown');
    }
  };

  element.addEventListener('dragover', handleDragOver);
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('drop', handleDrop);

  // 정리 함수 반환
  return () => {
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('drop', handleDrop);
  };
}

/**
 * 파일 선택기 열기
 */
export function openFileSelector(
  accept: string = '.json,.har',
  onSelect: (file: File) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.style.display = 'none';

  input.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      onSelect(target.files[0]);
    }
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}
