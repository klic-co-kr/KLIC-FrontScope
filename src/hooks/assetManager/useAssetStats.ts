/**
 * Asset Stats Hook
 * Calculates statistics from asset collections
 */

import { useMemo } from 'react';
import { useAssetManagerStorage } from './useAssetManagerStorage';
import type { ImageAsset, ImageType } from '../../types/assetManager';

export interface AssetStatistics {
  totalAssets: number;
  totalSize: number;
  averageSize: number;
  largestAsset: {
    url: string;
    size: number;
  } | null;
  smallestAsset: {
    url: string;
    size: number;
  } | null;
  byType: Record<ImageType, number>;
  byFormat: Record<string, number>;
  typeDistribution: Array<{ type: ImageType; count: number; percentage: number }>;
  formatDistribution: Array<{ format: string; count: number; percentage: number }>;
}

export function useAssetStats(assets: ImageAsset[] = []): AssetStatistics {
  const stats = useMemo(() => {
    if (assets.length === 0) {
      return {
        totalAssets: 0,
        totalSize: 0,
        averageSize: 0,
        largestAsset: null,
        smallestAsset: null,
        byType: {} as Record<ImageType, number>,
        byFormat: {},
        typeDistribution: [],
        formatDistribution: [],
      };
    }

    const totalAssets = assets.length;
    const assetsWithSize = assets.filter((a) => a.size !== undefined);
    const totalSize = assetsWithSize.reduce((sum, a) => sum + (a.size || 0), 0);
    const averageSize = totalSize / Math.max(assetsWithSize.length, 1);

    // Find largest and smallest
    let largestAsset: { url: string; size: number } | null = null;
    let smallestAsset: { url: string; size: number } | null = null;

    for (const asset of assetsWithSize) {
      if (asset.size !== undefined) {
        if (!largestAsset || asset.size > largestAsset.size) {
          largestAsset = { url: asset.url, size: asset.size };
        }
        if (!smallestAsset || asset.size < smallestAsset.size) {
          smallestAsset = { url: asset.url, size: asset.size };
        }
      }
    }

    // Count by type
    const byType: Record<ImageType, number> = {} as Record<ImageType, number>;
    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
    }

    // Count by format
    const byFormat: Record<string, number> = {};
    for (const asset of assets) {
      if (asset.format) {
        byFormat[asset.format] = (byFormat[asset.format] || 0) + 1;
      }
    }

    // Type distribution
    const typeDistribution = Object.entries(byType)
      .map(([type, count]) => ({
        type: type as ImageType,
        count,
        percentage: (count / totalAssets) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Format distribution
    const formatDistribution = Object.entries(byFormat)
      .map(([format, count]) => ({
        format,
        count,
        percentage: (count / totalAssets) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAssets,
      totalSize,
      averageSize,
      largestAsset,
      smallestAsset,
      byType,
      byFormat,
      typeDistribution,
      formatDistribution,
    };
  }, [assets]);

  return stats;
}

/**
 * Hook for getting stats from stored collections
 */
export function useStoredAssetStats() {
  const { collections, loading, stats } = useAssetManagerStorage();

  const calculatedStats = useMemo(() => {
    const allAssets = collections.flatMap((c) => c.assets || c.images || []);

    const totalAssets = allAssets.length;
    const totalSize = collections.reduce((sum, c) => sum + (c.stats?.totalSize || c.totalSize || 0), 0);
    const averageSize = totalSize / Math.max(totalAssets, 1);

    let largestAsset: { url: string; size: number } | null = null;
    let mostCommonFormat = '';

    const byFormat: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const collection of collections) {
      const assets = collection.assets || collection.images || [];
      for (const asset of assets) {
        if (asset.size && (!largestAsset || asset.size > largestAsset.size)) {
          largestAsset = { url: asset.url, size: asset.size };
        }

        if (asset.format) {
          byFormat[asset.format] = (byFormat[asset.format] || 0) + 1;
        }

        byType[asset.type] = (byType[asset.type] || 0) + 1;
      }
    }

    // Find most common format
    const formatEntries = Object.entries(byFormat);
    if (formatEntries.length > 0) {
      mostCommonFormat = formatEntries.sort((a, b) => b[1] - a[1])[0][0];
    }

    return {
      totalExtracted: collections.length,
      totalAssets,
      totalSize,
      averageSize,
      largestAsset,
      mostCommonFormat,
      byFormat,
      byType,
    };
  }, [collections]);

  /**
   * 포맷 분포 차트 데이터
   */
  const formatChartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return Object.entries(stats.byFormat).map(([format, count]) => ({
      format,
      count,
      percentage: (count / stats.totalExtracted) * 100,
    }));
  }, [stats]);

  /**
   * 타입 분포 차트 데이터
   */
  const typeChartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return Object.entries(stats.byType).map(([type, count]) => ({
      type,
      count,
      percentage: (count / stats.totalExtracted) * 100,
    }));
  }, [stats]);

  /**
   * 시간대별 추출 데이터
   */
  const extractionTimeline = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return collections.map((collection) => ({
      date: new Date(collection.extractedAt || collection.timestamp || now),
      count: (collection.images || collection.assets || []).length,
      size: collection.totalSize || 0,
    }));
  }, [collections]);

  return {
    stats: stats || calculatedStats,
    loading,
    collectionCount: collections.length,
    formatChartData,
    typeChartData,
    extractionTimeline,
  };
}
