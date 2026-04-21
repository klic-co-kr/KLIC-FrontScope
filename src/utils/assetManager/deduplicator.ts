import { ImageAsset } from '../../types/assetManager';
import { normalizeURL } from './urlResolver';

/**
 * 에셋 중복 제거
 */
export function deduplicateAssets(assets: ImageAsset[]): ImageAsset[] {
  const seen = new Map<string, ImageAsset>();

  for (const asset of assets) {
    const normalizedUrl = normalizeURL(asset.url, {
      removeQuery: false,
      removeHash: true,
    });

    // 중복 확인
    if (seen.has(normalizedUrl)) {
      const existing = seen.get(normalizedUrl)!;

      // 더 나은 메타데이터를 가진 에셋 선택
      if (isBetterAsset(asset, existing)) {
        seen.set(normalizedUrl, asset);
      }
    } else {
      seen.set(normalizedUrl, asset);
    }
  }

  return Array.from(seen.values());
}

/**
 * 더 나은 에셋인지 비교
 */
function isBetterAsset(a: ImageAsset, b: ImageAsset): boolean {
  // dimensions가 있는 것 우선
  if (a.dimensions && !b.dimensions) {
    return true;
  }

  if (!a.dimensions && b.dimensions) {
    return false;
  }

  // 더 큰 이미지 우선
  if (a.dimensions && b.dimensions) {
    const aArea = a.dimensions.width * a.dimensions.height;
    const bArea = b.dimensions.width * b.dimensions.height;

    if (aArea > bArea) {
      return true;
    }
  }

  // size가 있는 것 우선
  if (a.size && !b.size) {
    return true;
  }

  if (!a.size && b.size) {
    return false;
  }

  // 더 큰 파일 우선
  if (a.size && b.size && a.size > b.size) {
    return true;
  }

  return false;
}

/**
 * 필터링: 최소 크기 이상
 */
export function filterByMinSize(
  assets: ImageAsset[],
  minSize: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.size) {
      return true; // 크기 모르면 포함
    }

    return asset.size >= minSize;
  });
}

/**
 * 필터링: 최소 dimensions 이상
 */
export function filterByMinDimensions(
  assets: ImageAsset[],
  minWidth: number,
  minHeight: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.dimensions) {
      return true; // dimensions 모르면 포함
    }

    return asset.dimensions.width >= minWidth && asset.dimensions.height >= minHeight;
  });
}
