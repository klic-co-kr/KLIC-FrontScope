import { ImageType, ImageSource } from '../../types/assetManager';

/**
 * URL에서 이미지 타입 추정
 */
export function getImageType(url: string): string {
  const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();

  const typeMap: Record<string, string> = {
    jpg: 'jpg',
    jpeg: 'jpg',
    png: 'png',
    gif: 'gif',
    webp: 'webp',
    svg: 'svg',
    bmp: 'bmp',
    ico: 'ico',
  };

  return typeMap[extension || ''] || 'unknown';
}

/**
 * Data URI 확인
 */
export function isDataUri(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * SVG 확인
 */
export function isSvgUrl(url: string): boolean {
  return url.toLowerCase().includes('.svg') || url.startsWith('data:image/svg+xml');
}

/**
 * 이미지 소스 타입 결정
 */
export function determineImageSource(element: HTMLElement): ImageSource {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'img') {
    return 'img-tag';
  }

  if (tagName === 'picture') {
    return 'picture-tag';
  }

  if (tagName === 'svg') {
    return 'svg-tag';
  }

  // CSS background check
  const style = window.getComputedStyle(element);
  if (style.backgroundImage && style.backgroundImage !== 'none') {
    return 'background-css';
  }

  return 'img-tag';
}

/**
 * 이미지 타입 분류
 */
export function classifyImageType(element: HTMLElement, url: string): ImageType {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'svg' || isSvgUrl(url)) {
    return 'svg';
  }

  if (tagName === 'picture') {
    return 'picture';
  }

  if (tagName === 'img') {
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // 아이콘 크기 (32x32 이하)
    if (width <= 32 && height <= 32) {
      return 'icon';
    }

    return 'img';
  }

  // CSS background
  const style = window.getComputedStyle(element);
  if (style.backgroundImage && style.backgroundImage !== 'none') {
    return 'background';
  }

  return 'other';
}
