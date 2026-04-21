/**
 * 상대 URL을 절대 URL로 변환
 */
export function resolveURL(url: string, baseUrl: string = window.location.href): string {
  try {
    // 이미 절대 URL이면 그대로 반환
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Data URI면 그대로 반환
    if (url.startsWith('data:')) {
      return url;
    }

    // 프로토콜 상대 URL (//example.com/image.jpg)
    if (url.startsWith('//')) {
      const protocol = new URL(baseUrl).protocol;
      return `${protocol}${url}`;
    }

    // 절대 경로 (/images/photo.jpg)
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }

    // 상대 경로 (../images/photo.jpg, images/photo.jpg)
    const base = new URL(baseUrl);
    const resolved = new URL(url, base.href);
    return resolved.href;
  } catch (error) {
    console.error('Failed to resolve URL:', url, error);
    return url;
  }
}

/**
 * CSS url() 함수에서 URL 추출
 */
export function extractURLsFromCSS(cssValue: string): string[] {
  const urls: string[] = [];

  // url("...") 또는 url('...') 또는 url(...)
  const urlRegex = /url\(['"]?(.*?)['"]?\)/gi;
  let match;

  while ((match = urlRegex.exec(cssValue)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  return urls;
}

/**
 * URL 정규화 (쿼리 파라미터 제거 등)
 */
export function normalizeURL(url: string, options: {
  removeQuery?: boolean;
  removeHash?: boolean;
} = {}): string {
  try {
    const parsed = new URL(url);

    if (options.removeQuery) {
      parsed.search = '';
    }

    if (options.removeHash) {
      parsed.hash = '';
    }

    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * URL 중복 제거
 */
export function deduplicateURLs(urls: string[]): string[] {
  return Array.from(new Set(urls.map(url => normalizeURL(url, { removeHash: true }))));
}
