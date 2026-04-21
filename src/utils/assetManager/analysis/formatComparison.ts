/**
 * Format Comparison
 * Compares image quality and size across formats
 */

import type { ImageAsset } from '../../../types/assetManager';

export interface FormatComparison {
  originalFormat: string;
  originalSize: number;
  webp: { size: number; savings: number; percent: number } | null;
  avif: { size: number; savings: number; percent: number } | null;
}

/**
 * Estimates size savings for different formats
 */
export function estimateFormatSavings(asset: ImageAsset): FormatComparison {
  const size = asset.size || 0;
  const format = asset.format?.toLowerCase() || 'unknown';

  const comparison: FormatComparison = {
    originalFormat: format,
    originalSize: size,
    webp: null,
    avif: null,
  };

  // WebP typically saves 30% over JPEG/PNG
  if (format === 'jpg' || format === 'jpeg' || format === 'png') {
    const webpSavings = size * 0.3;
    comparison.webp = {
      size: size - webpSavings,
      savings: webpSavings,
      percent: 30,
    };
  }

  // AVIF typically saves 50% over JPEG/PNG
  if (format === 'jpg' || format === 'jpeg' || format === 'png') {
    const avifSavings = size * 0.5;
    comparison.avif = {
      size: size - avifSavings,
      savings: avifSavings,
      percent: 50,
    };
  }

  return comparison;
}

/**
 * Gets recommendations for format conversion
 */
export function getFormatRecommendation(asset: ImageAsset): {
  recommendedFormat: string;
  reason: string;
  estimatedSavings: number;
} | null {
  const comparison = estimateFormatSavings(asset);

  // AVIF has best savings
  if (comparison.avif && comparison.avif.savings > 50000) {
    return {
      recommendedFormat: 'avif',
      reason: 'AVIF는 최대 50%의 파일 크기 절약을 제공합니다',
      estimatedSavings: comparison.avif.savings,
    };
  }

  // WebP is next best
  if (comparison.webp && comparison.webp.savings > 30000) {
    return {
      recommendedFormat: 'webp',
      reason: 'WebP는 대부분의 브라우저에서 지원되며 30% 파일 크기 절약을 제공합니다',
      estimatedSavings: comparison.webp.savings,
    };
  }

  return null;
}

/**
 * Compares multiple assets across formats
 */
export function compareMultipleAssets(assets: ImageAsset[]): {
  totalOriginalSize: number;
  totalWebpSize: number;
  totalAvifSize: number;
  webpSavings: number;
  avifSavings: number;
} {
  let totalOriginalSize = 0;
  let totalWebpSize = 0;
  let totalAvifSize = 0;

  for (const asset of assets) {
    const comparison = estimateFormatSavings(asset);
    totalOriginalSize += comparison.originalSize;

    if (comparison.webp) {
      totalWebpSize += comparison.webp.size;
    } else {
      totalWebpSize += comparison.originalSize;
    }

    if (comparison.avif) {
      totalAvifSize += comparison.avif.size;
    } else {
      totalAvifSize += comparison.originalSize;
    }
  }

  return {
    totalOriginalSize,
    totalWebpSize,
    totalAvifSize,
    webpSavings: totalOriginalSize - totalWebpSize,
    avifSavings: totalOriginalSize - totalAvifSize,
  };
}
