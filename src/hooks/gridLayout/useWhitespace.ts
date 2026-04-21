/**
 * Whitespace Management Hook
 *
 * 화이트스페이스 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import type { WhitespaceSettings, WhitespacePattern } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { sendGridMessage } from './sendGridMessage';

export interface UseWhitespaceOptions {
  autoLoad?: boolean;
  autoSave?: boolean;
}

export function useWhitespace(options: UseWhitespaceOptions = {}) {
  const { autoLoad = true, autoSave = true } = options;

  const [settings, setSettings] = useState<WhitespaceSettings>(
    DEFAULT_GRID_LAYOUT_SETTINGS.whitespace
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 설정 로드
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const stored = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as {
        whitespace?: WhitespaceSettings;
      } | undefined;

      if (stored?.whitespace) {
        setSettings(stored.whitespace);
      }
    } catch (err) {
      console.error('Failed to load whitespace settings:', err);
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
  const saveSettings = useCallback(async (newSettings: WhitespaceSettings) => {
    setSettings(newSettings);

    if (!autoSave) return;

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const current = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] || DEFAULT_GRID_LAYOUT_SETTINGS;

      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: {
          ...current,
          whitespace: newSettings,
        },
      });

      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_WHITESPACE, newSettings);
    } catch (err) {
      console.error('Failed to save whitespace settings:', err);
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

  // 패턴 변경
  const setPattern = useCallback(async (pattern: WhitespacePattern) => {
    await saveSettings({ ...settings, pattern });
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

  // 크기 변경
  const setSize = useCallback(async (size: number) => {
    const clampedSize = Math.max(4, Math.min(size, 100));
    await saveSettings({ ...settings, size: clampedSize });
  }, [settings, saveSettings]);

  // 모든 설정 한번에 변경
  const updateAll = useCallback(async (updates: Partial<WhitespaceSettings>) => {
    const newSettings = {
      ...settings,
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.pattern !== undefined && { pattern: updates.pattern }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.opacity !== undefined && { opacity: Math.max(0, Math.min(updates.opacity, 1)) }),
      ...(updates.size !== undefined && { size: Math.max(4, Math.min(updates.size, 100)) }),
    };

    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 프리셋 적용
  const applyPreset = useCallback(async (preset: 'light' | 'medium' | 'heavy') => {
    const presets = {
      light: {
        enabled: true,
        pattern: 'diagonal' as WhitespacePattern,
        color: '#E5E7EB',
        opacity: 0.1,
        size: 8,
      },
      medium: {
        enabled: true,
        pattern: 'crosshatch' as WhitespacePattern,
        color: '#EF4444',
        opacity: 0.15,
        size: 10,
      },
      heavy: {
        enabled: true,
        pattern: 'solid' as WhitespacePattern,
        color: '#EF4444',
        opacity: 0.2,
        size: 12,
      },
    };

    await saveSettings({ ...settings, ...presets[preset] });
  }, [settings, saveSettings]);

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
    setPattern,
    setColor,
    setOpacity,
    setSize,
    updateAll,
    applyPreset,
  };
}
