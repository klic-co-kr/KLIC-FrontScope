/**
 * Download Helper Utilities
 *
 * 다운로드 및 클립보드 관련 유틸리티
 */

import type { ImageFormat } from '../../types/screenshot';
import { getFileExtension } from './imageFormat';

/**
 * 이미지를 클립보드에 복사
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = await dataUrlToBlob(dataUrl);
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Data URL을 Blob으로 변환
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Data URL 다운로드
 */
export function downloadDataUrl(
  dataUrl: string,
  filename: string
): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Blob 다운로드
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}

/**
 * 다운로드 파일명 생성
 */
export function generateDownloadFilename(
  format: ImageFormat,
  prefix: string = 'screenshot',
  timestamp?: number
): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '-');
  const extension = getFileExtension(format);

  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
}

/**
 * Data URL 크기 계산 (bytes)
 */
export function calculateDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor(base64.length * 0.75);
}

/**
 * 크기를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 다운로드 권한 확인
 */
export function checkDownloadPermission(): boolean {
  return typeof document.createElement('a').download !== 'undefined';
}

/**
 * 클립보드 권한 확인
 */
export async function checkClipboardPermission(): Promise<boolean> {
  try {
    const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
    return permission.state === 'granted' || permission.state === 'prompt';
  } catch {
    // clipboard-write 권한이 지원되지 않는 경우
    return navigator.clipboard !== undefined;
  }
}

/**
 * 여러 이미지 다운로드 (zip)
 */
export async function downloadMultipleImages(
  images: Array<{ dataUrl: string; filename: string }>
): Promise<void> {
  // 개별 다운로드 (zip 라이브러리가 없는 경우)
  for (let i = 0; i < images.length; i++) {
    setTimeout(() => {
      downloadDataUrl(images[i].dataUrl, images[i].filename);
    }, i * 300); // 순차적 다운로드 방지
  }
}

/**
 * Base64를 Uint8Array로 변환
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Blob을 Data URL로 변환
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
