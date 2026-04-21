/**
 * 이미지 실제 크기 가져오기
 */
export async function getImageSize(url: string): Promise<number> {
  try {
    // Data URI인 경우
    if (url.startsWith('data:')) {
      return getDataUriSize(url);
    }

    // HTTP 요청으로 크기 확인
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('Content-Length');

    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Content-Length 없으면 전체 다운로드
    const fullResponse = await fetch(url);
    const blob = await fullResponse.blob();
    return blob.size;
  } catch (error) {
    console.error('Failed to get image size:', url, error);
    return 0;
  }
}

/**
 * Data URI 크기 계산
 */
export function getDataUriSize(dataUri: string): number {
  try {
    // data:image/png;base64,... 형식
    const base64 = dataUri.split(',')[1];
    if (!base64) {
      return 0;
    }

    // Base64 디코딩된 크기 추정
    const padding = (base64.match(/=/g) || []).length;
    return Math.floor((base64.length * 3) / 4) - padding;
  } catch {
    return 0;
  }
}

/**
 * 이미지 실제 크기 (dimensions) 가져오기
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * 여러 이미지 크기 배치 측정
 */
export async function batchGetImageSizes(urls: string[]): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();

  const promises = urls.map(async (url) => {
    const size = await getImageSize(url);
    sizes.set(url, size);
  });

  await Promise.allSettled(promises);

  return sizes;
}

/**
 * 바이트를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
