/**
 * Asset History Hook
 * Manages extraction history
 */

import { useMemo } from 'react';
import { useAssetManagerStorage } from './useAssetManagerStorage';
import type { AssetCollection } from '../../types/assetManager';
import { ImageAsset } from '../../types/assetManager';

export function useAssetHistory() {
  const { collections, loading, error, saveCollection, deleteCollection, clearCollections } =
    useAssetManagerStorage();

  // Sort collections by timestamp (newest first)
  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => (b.timestamp || b.extractedAt || 0) - (a.timestamp || a.extractedAt || 0));
  }, [collections]);

  // Get collections from the current page
  const currentPageCollections = useMemo(() => {
    const currentUrl = window.location.href;
    return sortedCollections.filter((c) => (c.url || c.pageUrl) === currentUrl);
  }, [sortedCollections]);

  // Get collection by ID
  const getCollectionById = (id: string): AssetCollection | undefined => {
    return collections.find((c) => c.id === id);
  };

  // Get recent collections (last N)
  const getRecentCollections = (count: number = 10): AssetCollection[] => {
    return sortedCollections.slice(0, count);
  };

  // Get total statistics across all collections
  const totalStats = useMemo(() => {
    return {
      totalExtractions: collections.length,
      totalAssets: collections.reduce((sum, c) => sum + (c.assets?.length || c.images?.length || 0), 0),
      totalSize: collections.reduce((sum, c) => sum + (c.stats?.totalSize || c.totalSize || 0), 0),
      byType: collections.reduce(
        (acc, c) => {
          Object.entries(c.stats?.byType || {}).forEach(([type, count]) => {
            acc[type] = (acc[type] || 0) + (count as number);
          });
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }, [collections]);

  /**
   * 최근 컬렉션
   */
  const recentCollections = useMemo(() => {
    return sortedCollections.slice(0, 10);
  }, [sortedCollections]);

  /**
   * 모든 이미지 (중복 제거)
   */
  const allImages = useMemo(() => {
    const imageMap = new Map<string, ImageAsset>();

    collections.forEach((collection) => {
      const images = collection.assets || collection.images || [];
      images.forEach((image) => {
        if (!imageMap.has(image.url)) {
          imageMap.set(image.url, image);
        }
      });
    });

    return Array.from(imageMap.values());
  }, [collections]);

  /**
   * URL로 이미지 찾기
   */
  const findImageByUrl = (url: string): ImageAsset | undefined => {
    return allImages.find(image => image.url === url);
  };

  /**
   * 특정 페이지의 컬렉션 찾기
   */
  const findCollectionsByPage = (pageUrl: string) => {
    return collections.filter(c => (c.pageUrl || c.url) === pageUrl);
  };

  return {
    collections: sortedCollections,
    currentPageCollections,
    loading,
    error,
    totalStats,
    saveCollection,
    deleteCollection,
    getCollectionById,
    getRecentCollections,
    recentCollections,
    allImages,
    findImageByUrl,
    findCollectionsByPage,
    clearCollections,
  };
}
