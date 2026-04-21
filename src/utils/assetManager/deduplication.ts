/**
 * Asset Deduplication
 * Removes duplicate assets from collections
 */

import { normalizeURL } from './urlResolver';
import type { ImageAsset } from '../../types/assetManager';

/**
 * Groups assets by their normalized URL
 */
export function groupAssetsByUrl(assets: ImageAsset[]): Map<string, ImageAsset[]> {
  const groups = new Map<string, ImageAsset[]>();

  for (const asset of assets) {
    const normalized = normalizeURL(asset.url);
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(asset);
  }

  return groups;
}

/**
 * Removes duplicate assets, keeping the first occurrence
 */
export function removeDuplicates(assets: ImageAsset[]): ImageAsset[] {
  const seen = new Set<string>();
  const result: ImageAsset[] = [];

  for (const asset of assets) {
    const key = normalizeURL(asset.url);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(asset);
    }
  }

  return result;
}

/**
 * Merges duplicate assets, combining their metadata
 */
export function mergeDuplicates(assets: ImageAsset[]): ImageAsset[] {
  const groups = groupAssetsByUrl(assets);
  const result: ImageAsset[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Merge all occurrences into one
      const merged: ImageAsset = {
        ...group[0],
        url: group[0].url, // Keep original URL, not normalized
        metadata: {
          isLazyLoaded: group.some((a) => a.metadata?.isLazyLoaded) || false,
          isBackgroundImage: group.some((a) => a.metadata?.isBackgroundImage) || false,
          isDataUri: group.some((a) => a.metadata?.isDataUri) || false,
          isOptimized: group.some((a) => a.metadata?.isOptimized) || false,
          aspectRatio: group[0].metadata?.aspectRatio || 0,
        },
      };

      // Collect all selectors
      const selectors = group.map((a) => a.element?.selector).filter(Boolean);
      if (selectors.length > 0) {
        merged.element = {
          ...merged.element!,
          selector: selectors[0]!,
        };
      }

      result.push(merged);
    }
  }

  return result;
}

/**
 * Finds assets that appear multiple times on the page
 */
export function findDuplicates(assets: ImageAsset[]): Map<string, ImageAsset[]> {
  const groups = groupAssetsByUrl(assets);
  const duplicates = new Map<string, ImageAsset[]>();

  for (const [normalizedUrl, group] of groups) {
    if (group.length > 1) {
      duplicates.set(normalizedUrl, group);
    }
  }

  return duplicates;
}
