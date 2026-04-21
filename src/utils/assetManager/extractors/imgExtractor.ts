import { ImageAsset } from '../../../types/assetManager';
import { resolveURL } from '../urlResolver';
import { getImageType, classifyImageType, determineImageSource } from '../imageDetector';
import { generateUUID } from '../../common/uuid';
import { getSelector } from '../../dom/selectorGenerator';

/**
 * IMG 태그에서 에셋 추출
 */
export function createAssetFromImg(img: HTMLImageElement): ImageAsset | null {
  try {
    // src 속성 확인
    let url = img.currentSrc || img.src;

    if (!url) {
      // 레이지 로딩 체크
      url = img.dataset.src || img.dataset.lazySrc || '';
    }

    if (!url) {
      return null;
    }

    // URL 절대 경로로 변환
    url = resolveURL(url);

    // srcset에서 최적 이미지 선택
    const bestSrc = getBestSrcFromSrcset(img.srcset);
    if (bestSrc) {
      url = resolveURL(bestSrc);
    }

    const asset: ImageAsset = {
      id: generateUUID(),
      url,
      type: classifyImageType(img, url),
      source: determineImageSource(img),
      dimensions: {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      },
      format: getImageType(url),
      element: {
        tagName: 'IMG',
        selector: getSelector(img),
        alt: img.alt,
        srcset: img.srcset,
        dataSrc: img.dataset.src,
      },
      metadata: {
        isLazyLoaded: !!(img.loading === 'lazy' || img.dataset.src),
        isBackgroundImage: false,
        isDataUri: url.startsWith('data:'),
        isOptimized: false,
        aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
      },
    };

    return asset;
  } catch (error) {
    console.error('Failed to create asset from img:', error);
    return null;
  }
}

/**
 * srcset에서 최적 이미지 선택
 */
export function getBestSrcFromSrcset(srcset: string): string | null {
  if (!srcset) {
    return null;
  }

  const sources = srcset.split(',').map(src => {
    const parts = src.trim().split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '1x';

    // 픽셀 밀도 (2x, 3x) 또는 너비 (300w)
    let value = 1;
    if (descriptor.endsWith('x')) {
      value = parseFloat(descriptor);
    } else if (descriptor.endsWith('w')) {
      value = parseInt(descriptor);
    }

    return { url, value, descriptor };
  });

  // 가장 높은 해상도 선택
  sources.sort((a, b) => b.value - a.value);

  return sources[0]?.url || null;
}
