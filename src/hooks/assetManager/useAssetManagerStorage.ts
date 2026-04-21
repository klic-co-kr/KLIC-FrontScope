/**
 * Asset Manager Storage Hook
 * Manages Chrome storage for Asset Manager
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_ASSET_MANAGER_SETTINGS } from '../../constants/defaults';
import type { AssetCollection, AssetManagerSettings, AssetManagerStats } from '../../types/assetManager';

export interface AssetManagerStorageData {
  collections: AssetCollection[];
  settings: AssetManagerSettings;
  stats: AssetManagerStats | null;
  loading: boolean;
  error: string | null;
}

export function useAssetManagerStorage(): AssetManagerStorageData & {
  refresh: () => Promise<void>;
  saveCollection: (collection: AssetCollection) => Promise<void>;
  deleteCollection: (id: string | number) => Promise<void>;
  clearCollections: () => Promise<void>;
  updateSettings: (settings: Partial<AssetManagerSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loadAllData: () => Promise<void>;
} {
  const [collections, setCollections] = useState<AssetCollection[]>([]);
  const [settings, setSettings] = useState<AssetManagerSettings>(DEFAULT_ASSET_MANAGER_SETTINGS);
  const [stats, setStats] = useState<AssetManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Chrome storage
  const loadFromStorage = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await chrome.storage.local.get([
        STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS,
        STORAGE_KEYS.ASSET_MANAGER_SETTINGS,
        STORAGE_KEYS.ASSET_MANAGER_STATS,
      ]);

      setCollections((result[STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS] as AssetCollection[]) || []);
      setSettings(
        (result[STORAGE_KEYS.ASSET_MANAGER_SETTINGS] as AssetManagerSettings) ||
          DEFAULT_ASSET_MANAGER_SETTINGS
      );
      setStats((result[STORAGE_KEYS.ASSET_MANAGER_STATS] as AssetManagerStats) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load from storage');
      console.error('Failed to load Asset Manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 초기 데이터 로드
   */
  const loadAllData = async () => {
    try {
      setLoading(true);

      const result = await chrome.storage.local.get([
        STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS,
        STORAGE_KEYS.ASSET_MANAGER_SETTINGS,
        STORAGE_KEYS.ASSET_MANAGER_STATS,
      ]);

      setCollections((result[STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS] as AssetCollection[]) || []);
      setSettings((result[STORAGE_KEYS.ASSET_MANAGER_SETTINGS] as AssetManagerSettings) || DEFAULT_ASSET_MANAGER_SETTINGS);
      setStats((result[STORAGE_KEYS.ASSET_MANAGER_STATS] as AssetManagerStats) || null);
    } catch (error) {
      console.error('Failed to load asset manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save a collection
  const saveCollection = async (collection: AssetCollection) => {
    try {
      const updated = [...collections, collection];

      // Keep only recent collections
      const maxCollections = 50;
      const trimmed =
        updated.length > maxCollections ? updated.slice(-maxCollections) : updated;

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS]: trimmed,
      });

      setCollections(trimmed);

      // 통계 업데이트
      await updateStats(collection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
      console.error('Failed to save collection:', err);
      throw err;
    }
  };

  // Delete a collection
  const deleteCollection = async (id: string | number) => {
    try {
      const updated = collections.filter((c) => c.id !== id && c.extractedAt !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS]: updated,
      });

      setCollections(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      console.error('Failed to delete collection:', err);
      throw err;
    }
  };

  /**
   * 모든 컬렉션 삭제
   */
  const clearCollections = useCallback(async () => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS]: [],
      });

      setCollections([]);
    } catch (error) {
      console.error('Failed to clear collections:', error);
    }
  }, []);

  // Update settings
  const updateSettings = async (newSettings: Partial<AssetManagerSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_SETTINGS]: updated,
      });

      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      console.error('Failed to update settings:', err);
      throw err;
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_SETTINGS]: DEFAULT_ASSET_MANAGER_SETTINGS,
      });

      setSettings(DEFAULT_ASSET_MANAGER_SETTINGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      console.error('Failed to reset settings:', err);
      throw err;
    }
  };

  /**
   * 통계 업데이트
   */
  const updateStats = useCallback(async (collection: AssetCollection) => {
    try {
      const currentStats = stats || {
        totalExtracted: 0,
        totalDownloaded: 0,
        totalSize: 0,
        byType: { img: 0, background: 0, picture: 0, svg: 0, icon: 0, other: 0 },
        byFormat: {} as Record<string, number>,
        averageSize: 0,
        lastExtractedAt: 0,
      };

      const images = collection.images || collection.assets || [];
      const newStats: AssetManagerStats = {
        totalExtracted: currentStats.totalExtracted + images.length,
        totalDownloaded: currentStats.totalDownloaded,
        totalSize: currentStats.totalSize + (collection.totalSize || 0),
        byType: { ...currentStats.byType },
        byFormat: { ...currentStats.byFormat },
        averageSize: 0,
        largestAsset: {
          url: images[0]?.url || '',
          size: images[0]?.size || 0,
        },
        mostCommonFormat: Object.keys(currentStats.byFormat)[0] || 'unknown',
        lastExtraction: collection.extractedAt || collection.timestamp || Date.now(),
        lastExtractedAt: collection.extractedAt || collection.timestamp || Date.now(),
      };

      // 타입별 집계
      images.forEach((image) => {
        newStats.byType[image.type] = (newStats.byType[image.type] || 0) + 1;

        if (image.format) {
          newStats.byFormat[image.format] = (newStats.byFormat[image.format] || 0) + 1;
        }
      });

      // 평균 크기
      newStats.averageSize = newStats.totalExtracted > 0
        ? newStats.totalSize / newStats.totalExtracted
        : 0;

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_STATS]: newStats,
      });

      setStats(newStats);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }, [stats]);

  // Initial load
  useEffect(() => {
    loadFromStorage();
  }, []);

  return {
    collections,
    settings,
    stats,
    loading,
    error,
    refresh: loadFromStorage,
    saveCollection,
    deleteCollection,
    clearCollections,
    updateSettings,
    resetSettings,
    loadAllData,
  };
}
