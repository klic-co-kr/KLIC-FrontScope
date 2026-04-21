import { useState, useEffect } from 'react';
import { Measurement, RulerSettings } from '../../types/ruler';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_RULER_SETTINGS } from '../../constants/defaults';

export function useRulerStorage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [settings, setSettings] = useState<RulerSettings>(DEFAULT_RULER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    try {
      setIsLoading(true);

      const result = await chrome.storage.local.get([
        STORAGE_KEYS.RULER_HISTORY,
        STORAGE_KEYS.RULER_SETTINGS,
      ]);

      if (result[STORAGE_KEYS.RULER_HISTORY]) {
        const history = result[STORAGE_KEYS.RULER_HISTORY] as { measurements?: Measurement[] };
        setMeasurements(history.measurements || []);
      }

      if (result[STORAGE_KEYS.RULER_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.RULER_SETTINGS] as RulerSettings);
      }
    } catch (error) {
      console.error('Failed to load ruler data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 측정 저장
   */
  const saveMeasurement = async (measurement: Measurement): Promise<boolean> => {
    try {
      const newMeasurements = [measurement, ...measurements].slice(
        0,
        settings.maxHistorySize
      );

      await chrome.storage.local.set({
        [STORAGE_KEYS.RULER_HISTORY]: {
          measurements: newMeasurements,
          maxSize: settings.maxHistorySize,
          totalMeasurements: measurements.length + 1,
          lastMeasurementTime: Date.now(),
        },
      });

      setMeasurements(newMeasurements);

      return true;
    } catch (error) {
      console.error('Failed to save measurement:', error);
      return false;
    }
  };

  /**
   * 측정 삭제
   */
  const deleteMeasurement = async (id: string): Promise<boolean> => {
    try {
      const newMeasurements = measurements.filter((m) => m.id !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.RULER_HISTORY]: {
          measurements: newMeasurements,
          maxSize: settings.maxHistorySize,
          totalMeasurements: measurements.length,
          lastMeasurementTime: Date.now(),
        },
      });

      setMeasurements(newMeasurements);

      return true;
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      return false;
    }
  };

  /**
   * 모든 측정 삭제
   */
  const clearMeasurements = async (): Promise<boolean> => {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.RULER_HISTORY);
      setMeasurements([]);

      return true;
    } catch (error) {
      console.error('Failed to clear measurements:', error);
      return false;
    }
  };

  /**
   * 설정 업데이트
   */
  const updateSettings = async (newSettings: Partial<RulerSettings>): Promise<boolean> => {
    try {
      const updated = {
        ...settings,
        ...newSettings,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.RULER_SETTINGS]: updated,
      });

      setSettings(updated);

      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  };

  return {
    measurements,
    settings,
    isLoading,
    saveMeasurement,
    deleteMeasurement,
    clearMeasurements,
    updateSettings,
    reload: loadData,
  };
}
