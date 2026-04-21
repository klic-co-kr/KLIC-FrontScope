import { useState, useEffect } from 'react';
import { ColorPickerSettings } from '../../types/colorPicker';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_COLOR_PICKER_SETTINGS } from '../../constants/defaults';

/**
 * 컬러피커 설정 관리 훅
 */
export function useColorPickerSettings() {
  const [settings, setSettings] = useState<ColorPickerSettings>(
    DEFAULT_COLOR_PICKER_SETTINGS
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_SETTINGS);

        if (result[STORAGE_KEYS.COLOR_PICKER_SETTINGS]) {
          setSettings(result[STORAGE_KEYS.COLOR_PICKER_SETTINGS] as ColorPickerSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  /**
   * 설정 업데이트
   */
  const updateSettings = async (
    newSettings: Partial<ColorPickerSettings>
  ): Promise<boolean> => {
    try {
      const updated = {
        ...settings,
        ...newSettings,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_SETTINGS]: updated,
      });

      setSettings(updated);

      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  };

  return {
    settings,
    updateSettings,
  };
}
