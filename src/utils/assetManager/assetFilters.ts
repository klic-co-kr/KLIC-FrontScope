import { ImageAsset, ImageType } from '../../types/assetManager';

/**
 * 타입별 필터
 */
export function filterByType(assets: ImageAsset[], type: ImageType): ImageAsset[] {
  return assets.filter(asset => asset.type === type);
}

/**
 * 포맷별 필터
 */
export function filterByFormat(assets: ImageAsset[], format: string): ImageAsset[] {
  return assets.filter(asset => asset.format === format);
}

/**
 * 크기 범위 필터
 */
export function filterBySizeRange(
  assets: ImageAsset[],
  minSize?: number,
  maxSize?: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.size) {
      return true;
    }

    if (minSize && asset.size < minSize) {
      return false;
    }

    if (maxSize && asset.size > maxSize) {
      return false;
    }

    return true;
  });
}

/**
 * dimensions 범위 필터
 */
export function filterByDimensionsRange(
  assets: ImageAsset[],
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.dimensions) {
      return true;
    }

    const { width, height } = asset.dimensions;

    if (minWidth && width < minWidth) {
      return false;
    }

    if (minHeight && height < minHeight) {
      return false;
    }

    if (maxWidth && width > maxWidth) {
      return false;
    }

    if (maxHeight && height > maxHeight) {
      return false;
    }

    return true;
  });
}

/**
 * 검색어 필터
 */
export function filterBySearch(assets: ImageAsset[], query: string): ImageAsset[] {
  const lowerQuery = query.toLowerCase();

  return assets.filter(asset => {
    const url = asset.url.toLowerCase();
    const alt = asset.element?.alt?.toLowerCase() || '';

    return url.includes(lowerQuery) || alt.includes(lowerQuery);
  });
}

/**
 * 정렬
 */
export type SortField = 'size' | 'width' | 'height' | 'url' | 'type';
export type SortOrder = 'asc' | 'desc';

export function sortAssets(
  assets: ImageAsset[],
  field: SortField,
  order: SortOrder = 'asc'
): ImageAsset[] {
  const sorted = [...assets];

  sorted.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;

      case 'width':
        aValue = a.dimensions?.width || 0;
        bValue = b.dimensions?.width || 0;
        break;

      case 'height':
        aValue = a.dimensions?.height || 0;
        bValue = b.dimensions?.height || 0;
        break;

      case 'url':
        aValue = a.url;
        bValue = b.url;
        break;

      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;

      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  return sorted;
}
