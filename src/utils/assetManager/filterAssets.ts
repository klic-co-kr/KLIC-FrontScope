/**
 * Asset Filter
 * Filters assets based on various criteria
 */

import type { ImageAsset, AssetFilter, ImageType } from '../../types/assetManager';
import { getAssetFormatKey, normalizeAssetFormat } from './assetFormat';

/**
 * Filters assets based on the provided filter criteria
 */
export function filterAssets(assets: ImageAsset[], filter: AssetFilter): ImageAsset[] {
  return assets.filter((asset) => matchesFilter(asset, filter));
}

/**
 * Checks if an asset matches the filter criteria
 */
export function matchesFilter(asset: ImageAsset, filter: AssetFilter): boolean {
  // Type filter
  if (filter.type && filter.type.length > 0) {
    if (!filter.type.includes(asset.type)) {
      return false;
    }
  }

  // Source filter
  if (filter.source && filter.source.length > 0) {
    if (!filter.source.includes(asset.source)) {
      return false;
    }
  }

  // Size filter
  if (filter.minSize !== undefined && asset.size !== undefined) {
    if (asset.size < filter.minSize) {
      return false;
    }
  }

  if (filter.maxSize !== undefined && asset.size !== undefined) {
    if (asset.size > filter.maxSize) {
      return false;
    }
  }

  // Dimension filters
  if (asset.dimensions) {
    if (filter.minWidth !== undefined && asset.dimensions.width < filter.minWidth) {
      return false;
    }

    if (filter.maxWidth !== undefined && asset.dimensions.width > filter.maxWidth) {
      return false;
    }

    if (filter.minHeight !== undefined && asset.dimensions.height < filter.minHeight) {
      return false;
    }

    if (filter.maxHeight !== undefined && asset.dimensions.height > filter.maxHeight) {
      return false;
    }
  }

  // Format filter
  if (filter.format && filter.format.length > 0) {
    const selectedFormats = filter.format
      .map((format) => normalizeAssetFormat(format) ?? format.toLowerCase())
      .filter((format): format is string => format.length > 0);

    const assetFormat = getAssetFormatKey(asset);

    if (!selectedFormats.includes(assetFormat)) {
      return false;
    }
  }

  // Search query filter
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    const searchableText = [
      asset.url,
      asset.element?.selector,
      asset.element?.alt,
      asset.format,
    ].join(' ').toLowerCase();

    if (!searchableText.includes(query)) {
      return false;
    }
  }

  return true;
}

/**
 * Sorts assets based on criteria
 */
export function sortAssets(
  assets: ImageAsset[],
  sortBy: 'size' | 'dimensions' | 'format' | 'source' | 'url',
  order: 'asc' | 'desc'
): ImageAsset[] {
  const sorted = [...assets];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;

      case 'dimensions': {
        const aPixels = (a.dimensions?.width || 0) * (a.dimensions?.height || 0);
        const bPixels = (b.dimensions?.width || 0) * (b.dimensions?.height || 0);
        comparison = aPixels - bPixels;
        break;
      }

      case 'format':
        comparison = (a.format || '').localeCompare(b.format || '');
        break;

      case 'source':
        comparison = a.source.localeCompare(b.source);
        break;

      case 'url':
        comparison = a.url.localeCompare(b.url);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Groups assets by type
 */
export function groupByType(assets: ImageAsset[]): Record<ImageType, ImageAsset[]> {
  const groups = {} as Record<ImageType, ImageAsset[]>;

  for (const asset of assets) {
    if (!groups[asset.type]) {
      groups[asset.type] = [];
    }
    groups[asset.type].push(asset);
  }

  return groups;
}

/**
 * Groups assets by format
 */
export function groupByFormat(assets: ImageAsset[]): Record<string, ImageAsset[]> {
  const groups: Record<string, ImageAsset[]> = {};

  for (const asset of assets) {
    const format = getAssetFormatKey(asset);
    if (!groups[format]) {
      groups[format] = [];
    }
    groups[format].push(asset);
  }

  return groups;
}
