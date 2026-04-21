/**
 * Resource Network Storage Hook
 *
 * 통합 리소스 네트워크 설정 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { ResourceNetworkSettings } from '../../types/resourceNetwork';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_RESOURCE_NETWORK_SETTINGS } from '../../constants/defaults';

export function useResourceNetworkStorage() {
  const [settings, setSettings] = useState<ResourceNetworkSettings>(
    DEFAULT_RESOURCE_NETWORK_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
        ]);
        if (result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]) {
          setSettings(result[STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS] as ResourceNetworkSettings);
        }
      }
    } catch (error) {
      console.error('Failed to load resource network settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: ResourceNetworkSettings) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS]: newSettings,
        });
      }
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save resource network settings:', error);
      throw error;
    }
  };

  // 설정 업데이트 (중첩 객체 병합 지원)
  const updateSettings = useCallback(
    async (updates: Partial<ResourceNetworkSettings>) => {
      const newSettings = {
        ...settings,
        ...updates,
        // 중첩 객체 병합
        storage: updates.storage
          ? { ...settings.storage, ...updates.storage }
          : settings.storage,
        animation: updates.animation
          ? { ...settings.animation, ...updates.animation }
          : settings.animation,
        network: updates.network
          ? { ...settings.network, ...updates.network }
          : settings.network,
        cache: updates.cache
          ? { ...settings.cache, ...updates.cache }
          : settings.cache,
      };

      await saveSettings(newSettings);
    },
    [settings]
  );

  // 스토리지 설정 업데이트
  const updateStorageSettings = useCallback(
    async (storageUpdates: Partial<ResourceNetworkSettings['storage']>) => {
      await updateSettings({
        storage: { ...settings.storage, ...storageUpdates },
      });
    },
    [settings.storage, updateSettings]
  );

  // 애니메이션 설정 업데이트
  const updateAnimationSettings = useCallback(
    async (animationUpdates: Partial<ResourceNetworkSettings['animation']>) => {
      await updateSettings({
        animation: { ...settings.animation, ...animationUpdates },
      });
    },
    [settings.animation, updateSettings]
  );

  // 네트워크 설정 업데이트
  const updateNetworkSettings = useCallback(
    async (networkUpdates: Partial<ResourceNetworkSettings['network']>) => {
      await updateSettings({
        network: { ...settings.network, ...networkUpdates },
      });
    },
    [settings.network, updateSettings]
  );

  // 캐시 설정 업데이트
  const updateCacheSettings = useCallback(
    async (cacheUpdates: Partial<ResourceNetworkSettings['cache']>) => {
      await updateSettings({
        cache: { ...settings.cache, ...cacheUpdates },
      });
    },
    [settings.cache, updateSettings]
  );

  // 초기화
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_RESOURCE_NETWORK_SETTINGS);
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    updateStorageSettings,
    updateAnimationSettings,
    updateNetworkSettings,
    updateCacheSettings,
    resetSettings,
  };
}
