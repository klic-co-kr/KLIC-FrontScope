/**
 * 레이지 로딩 감지
 */
export interface LazyLoadDetection {
  isLazyLoaded: boolean;
  method?: 'native' | 'intersection-observer' | 'data-src' | 'library';
}

/**
 * 이미지 레이지 로딩 감지
 */
export function detectLazyLoading(img: HTMLImageElement): LazyLoadDetection {
  // Native lazy loading
  if (img.loading === 'lazy') {
    return {
      isLazyLoaded: true,
      method: 'native',
    };
  }

  // data-src 속성 (일반적인 레이지 로딩 라이브러리)
  if (img.dataset.src || img.dataset.lazySrc) {
    return {
      isLazyLoaded: true,
      method: 'data-src',
    };
  }

  // 일반 라이브러리 클래스 체크 (lazyload, lazy 등)
  const classes = img.className.toLowerCase();
  if (classes.includes('lazy') || classes.includes('lazyload')) {
    return {
      isLazyLoaded: true,
      method: 'library',
    };
  }

  // Intersection Observer API 사용 여부 추정
  // (직접 확인 불가, 간접 추정)
  if (!img.src && (img.dataset.src || img.dataset.lazySrc)) {
    return {
      isLazyLoaded: true,
      method: 'intersection-observer',
    };
  }

  return {
    isLazyLoaded: false,
  };
}

/**
 * 레이지 로딩된 이미지 실제 URL 가져오기
 */
export function getLazyLoadedImageUrl(img: HTMLImageElement): string | null {
  // 이미 로드된 경우
  if (img.src && !img.src.startsWith('data:image/svg')) {
    return img.src;
  }

  // data-src 확인
  if (img.dataset.src) {
    return img.dataset.src;
  }

  if (img.dataset.lazySrc) {
    return img.dataset.lazySrc;
  }

  // srcset 확인
  if (img.dataset.srcset) {
    const firstSrc = img.dataset.srcset.split(',')[0].trim().split(/\s+/)[0];
    return firstSrc;
  }

  return null;
}
