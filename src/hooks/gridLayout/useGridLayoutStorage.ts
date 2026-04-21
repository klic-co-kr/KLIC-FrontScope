/**
 * Grid Layout Storage Hook
 *
 * 그리드 레이아웃 전체 설정 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import type { GridLayoutSettings } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { invalidateCache } from '../../utils/gridLayout/storage/cache';

export interface UseGridLayoutStorageOptions {
  autoLoad?: boolean;
  autoSave?: boolean;
  enableCache?: boolean;
}

export function useGridLayoutStorage(options: UseGridLayoutStorageOptions = {}) {
  const {
    autoLoad = true,
    autoSave = true,
    enableCache = true,
  } = options;

  const [settings, setSettings] = useState<GridLayoutSettings>(DEFAULT_GRID_LAYOUT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 설정 로드
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const stored = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as GridLayoutSettings | undefined;

      if (stored) {
        setSettings(stored);
      }

      setIsDirty(false);
    } catch (err) {
      console.error('Failed to load grid layout settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (autoLoad) {
      loadSettings();
    }
  }, [autoLoad, loadSettings]);

  // 설정 저장
  const saveSettings = useCallback(async (newSettings: GridLayoutSettings) => {
    setSettings(newSettings);
    setIsDirty(false);

    if (!autoSave) return newSettings;

    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: newSettings,
      });

      if (enableCache) {
        invalidateCache();
      }
    } catch (err) {
      console.error('Failed to save grid layout settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err;
    }

    return newSettings;
  }, [autoSave, enableCache]);

  // 설정 업데이트 (부분 업데이트 지원)
  const updateSettings = useCallback(async (updates: Partial<GridLayoutSettings>) => {
    const newSettings: GridLayoutSettings = {
      ...settings,
      ...updates,
      // 중첩 객체 병합
      guideLines: updates.guideLines
        ? { ...settings.guideLines, ...updates.guideLines }
        : settings.guideLines,
      viewport: updates.viewport
        ? { ...settings.viewport, ...updates.viewport }
        : settings.viewport,
      gridOverlay: updates.gridOverlay
        ? {
            ...settings.gridOverlay,
            ...updates.gridOverlay,
            breakpoints: updates.gridOverlay.breakpoints
              ? { ...settings.gridOverlay.breakpoints, ...updates.gridOverlay.breakpoints }
              : settings.gridOverlay.breakpoints,
          }
        : settings.gridOverlay,
      whitespace: updates.whitespace
        ? { ...settings.whitespace, ...updates.whitespace }
        : settings.whitespace,
      keyboardShortcuts: updates.keyboardShortcuts
        ? { ...settings.keyboardShortcuts, ...updates.keyboardShortcuts }
        : settings.keyboardShortcuts,
    };

    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 설정 초기화
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_GRID_LAYOUT_SETTINGS);
  }, [saveSettings]);

  // 설정 내보내기
  const exportSettings = useCallback(async () => {
    try {
      const json = JSON.stringify(settings, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `grid-layout-settings-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to export settings');
      throw err;
    }
  }, [settings]);

  // 설정 가져오기
  const importSettings = useCallback(async (json: string) => {
    try {
      const imported = JSON.parse(json) as GridLayoutSettings;

      // 기본 구조 검증
      if (!imported.guideLines || !imported.viewport || !imported.gridOverlay || !imported.whitespace) {
        throw new Error('Invalid settings format: missing required fields');
      }

      await saveSettings(imported);
    } catch (err) {
      console.error('Failed to import settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to import settings');
      throw err;
    }
  }, [saveSettings]);

  // 설정 병합
  const mergeSettings = useCallback(async (newSettings: Partial<GridLayoutSettings>) => {
    const merged: GridLayoutSettings = {
      ...settings,
      ...newSettings,
      guideLines: newSettings.guideLines
        ? { ...settings.guideLines, ...newSettings.guideLines }
        : settings.guideLines,
      viewport: newSettings.viewport
        ? { ...settings.viewport, ...newSettings.viewport }
        : settings.viewport,
      gridOverlay: newSettings.gridOverlay
        ? { ...settings.gridOverlay, ...newSettings.gridOverlay }
        : settings.gridOverlay,
      whitespace: newSettings.whitespace
        ? { ...settings.whitespace, ...newSettings.whitespace }
        : settings.whitespace,
      keyboardShortcuts: newSettings.keyboardShortcuts
        ? { ...settings.keyboardShortcuts, ...newSettings.keyboardShortcuts }
        : settings.keyboardShortcuts,
    };

    await saveSettings(merged);
  }, [settings, saveSettings]);

  // 특정 섹션만 업데이트
  const updateGuideLines = useCallback(async (updates: Partial<GridLayoutSettings['guideLines']>) => {
    await updateSettings({
      guideLines: { ...settings.guideLines, ...updates },
    });
  }, [settings.guideLines, updateSettings]);

  const updateViewport = useCallback(async (updates: Partial<GridLayoutSettings['viewport']>) => {
    await updateSettings({
      viewport: { ...settings.viewport, ...updates },
    });
  }, [settings.viewport, updateSettings]);

  const updateGridOverlay = useCallback(async (updates: Partial<GridLayoutSettings['gridOverlay']>) => {
    await updateSettings({
      gridOverlay: { ...settings.gridOverlay, ...updates },
    });
  }, [settings.gridOverlay, updateSettings]);

  const updateWhitespace = useCallback(async (updates: Partial<GridLayoutSettings['whitespace']>) => {
    await updateSettings({
      whitespace: { ...settings.whitespace, ...updates },
    });
  }, [settings.whitespace, updateSettings]);

  // 변경 여부 확인
  const hasChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(DEFAULT_GRID_LAYOUT_SETTINGS);
  }, [settings]);

  return {
    // 상태
    settings,
    isLoading,
    error,
    isDirty,

    // 작업
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    mergeSettings,

    // 섹션별 업데이트
    updateGuideLines,
    updateViewport,
    updateGridOverlay,
    updateWhitespace,

    // 유틸리티
    hasChanges,
  };
}
