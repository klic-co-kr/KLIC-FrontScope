/**
 * Grid Overlay Management Hook
 *
 * 그리드 오버레이 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import type { GridOverlaySettings } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { calculateResponsiveColumns } from '../../utils/gridLayout/grid/gridCalculator';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { sendGridMessage } from './sendGridMessage';

export interface UseGridOverlayOptions {
  autoLoad?: boolean;
  autoSave?: boolean;
}

export function useGridOverlay(options: UseGridOverlayOptions = {}) {
  const { autoLoad = true, autoSave = true } = options;

  const [settings, setSettings] = useState<GridOverlaySettings>(
    DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 설정 로드
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const stored = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as unknown;

      if (stored && typeof stored === 'object' && 'gridOverlay' in stored) {
        const gridOverlay = (stored as { gridOverlay?: GridOverlaySettings }).gridOverlay;
        if (gridOverlay) {
          setSettings(gridOverlay);
        }
      }
    } catch (err) {
      console.error('Failed to load grid overlay settings:', err);
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

  // 설정 저장 + Content Script에 메시지 전송
  const saveSettings = useCallback(async (newSettings: GridOverlaySettings) => {
    setSettings(newSettings);

    if (!autoSave) return;

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const current = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] || DEFAULT_GRID_LAYOUT_SETTINGS;

      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: {
          ...current,
          gridOverlay: newSettings,
        },
      });

      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY, newSettings);
    } catch (err) {
      console.error('Failed to save grid overlay settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  }, [autoSave]);

  // 토글
  const toggle = useCallback(async () => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 활성화
  const enable = useCallback(async () => {
    await saveSettings({ ...settings, enabled: true });
  }, [settings, saveSettings]);

  // 비활성화
  const disable = useCallback(async () => {
    await saveSettings({ ...settings, enabled: false });
  }, [settings, saveSettings]);

  // 컬럼 수 변경
  const setColumns = useCallback(async (columns: number) => {
    const clampedColumns = Math.max(1, Math.min(columns, 16));
    await saveSettings({ ...settings, columns: clampedColumns });
  }, [settings, saveSettings]);

  // 갭 변경
  const setGap = useCallback(async (gap: number) => {
    const clampedGap = Math.max(0, Math.min(gap, 100));
    await saveSettings({ ...settings, gap: clampedGap });
  }, [settings, saveSettings]);

  // 마진 변경
  const setMargin = useCallback(async (margin: string) => {
    await saveSettings({ ...settings, margin });
  }, [settings, saveSettings]);

  // 최대 너비 변경
  const setMaxWidth = useCallback(async (maxWidth: string) => {
    await saveSettings({ ...settings, maxWidth });
  }, [settings, saveSettings]);

  // 색상 변경
  const setColor = useCallback(async (color: string) => {
    await saveSettings({ ...settings, color });
  }, [settings, saveSettings]);

  // 불투명도 변경
  const setOpacity = useCallback(async (opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(opacity, 1));
    await saveSettings({ ...settings, opacity: clampedOpacity });
  }, [settings, saveSettings]);

  // 스타일 변경
  const setStyle = useCallback(async (style: 'solid' | 'dashed' | 'dotted') => {
    await saveSettings({ ...settings, style });
  }, [settings, saveSettings]);

  // 컬럼 번호 표시 토글
  const toggleColumnNumbers = useCallback(async () => {
    await saveSettings({ ...settings, showColumnNumbers: !settings.showColumnNumbers });
  }, [settings, saveSettings]);

  // 컬럼 번호 표시 설정
  const setShowColumnNumbers = useCallback(async (show: boolean) => {
    await saveSettings({ ...settings, showColumnNumbers: show });
  }, [settings, saveSettings]);

  // 브레이크포인트 설정 변경
  const updateBreakpoint = useCallback(async (
    breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl',
    enabled: boolean,
    columns: number
  ) => {
    const clampedColumns = Math.max(1, Math.min(columns, 16));

    await saveSettings({
      ...settings,
      breakpoints: {
        ...settings.breakpoints,
        [breakpoint]: { enabled, columns: clampedColumns },
      },
    });
  }, [settings, saveSettings]);

  // 모든 브레이크포인트 일괄 설정
  const setAllBreakpoints = useCallback(async (
    enabled: boolean,
    columns: number
  ) => {
    const clampedColumns = Math.max(1, Math.min(columns, 16));

    await saveSettings({
      ...settings,
      breakpoints: {
        sm: { enabled, columns: clampedColumns },
        md: { enabled, columns: clampedColumns },
        lg: { enabled, columns: clampedColumns },
        xl: { enabled, columns: clampedColumns },
        '2xl': { enabled, columns: clampedColumns },
      },
    });
  }, [settings, saveSettings]);

  // 현재 뷰포트에 대한 컬럼 수 계산
  const getCurrentColumns = useCallback((viewportWidth: number) => {
    return calculateResponsiveColumns(settings, viewportWidth);
  }, [settings]);

  // 활성화된 브레이크포인트 목록
  const getActiveBreakpoints = useCallback(() => {
    return Object.entries(settings.breakpoints)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name) as Array<'sm' | 'md' | 'lg' | 'xl' | '2xl'>;
  }, [settings.breakpoints]);

  return {
    // 상태
    settings,
    isLoading,
    error,

    // 작업
    loadSettings,
    toggle,
    enable,
    disable,
    setColumns,
    setGap,
    setMargin,
    setMaxWidth,
    setColor,
    setOpacity,
    setStyle,
    toggleColumnNumbers,
    setShowColumnNumbers,
    updateBreakpoint,
    setAllBreakpoints,
    getCurrentColumns,
    getActiveBreakpoints,
  };
}
