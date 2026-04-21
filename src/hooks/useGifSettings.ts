// src/hooks/useGifSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_GIF_SETTINGS } from '../types/recording';
import type { GIFSettings } from '../types/recording';

const STORAGE_KEY = 'gif:settings';

export function useGifSettings() {
  const [settings, setSettings] = useState<GIFSettings>(DEFAULT_GIF_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY]).then((result) => {
      if (result[STORAGE_KEY]) {
        // Merge with defaults to handle missing fields from older stored settings
        setSettings({ ...DEFAULT_GIF_SETTINGS, ...(result[STORAGE_KEY] as Partial<GIFSettings>) });
      }
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<GIFSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      chrome.storage.local.set({ [STORAGE_KEY]: next });
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
