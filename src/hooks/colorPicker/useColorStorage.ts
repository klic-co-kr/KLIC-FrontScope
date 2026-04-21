import { useState, useEffect } from 'react';
import { Color, ColorHistory } from '../../types/colorPicker';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';

/**
 * 색상 히스토리 Storage 훅
 */
export function useColorStorage() {
  const [history, setHistory] = useState<ColorHistory>({
    colors: [],
    maxSize: STORAGE_LIMITS.COLOR_PICKER_MAX_HISTORY,
    totalPicked: 0,
  });

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_HISTORY);

        if (result[STORAGE_KEYS.COLOR_PICKER_HISTORY]) {
          setHistory(result[STORAGE_KEYS.COLOR_PICKER_HISTORY] as ColorHistory);
        }
      } catch (error) {
        console.error('Failed to load color history:', error);
      }
    };

    loadHistory();
  }, []);

  /**
   * 색상 추가
   */
  const addColor = async (color: Color): Promise<boolean> => {
    try {
      const newHistory: ColorHistory = {
        ...history,
        colors: [color, ...history.colors],
        totalPicked: history.totalPicked + 1,
      };

      // 최대 크기 제한 (0 = 무제한)
      if (history.maxSize > 0 && newHistory.colors.length > history.maxSize) {
        newHistory.colors = newHistory.colors.slice(0, history.maxSize);
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_HISTORY]: newHistory,
      });

      setHistory(newHistory);

      return true;
    } catch (error) {
      console.error('Failed to add color:', error);
      return false;
    }
  };

  /**
   * 색상 삭제
   */
  const deleteColor = async (colorId: string): Promise<boolean> => {
    try {
      const newHistory: ColorHistory = {
        ...history,
        colors: history.colors.filter((c) => c.id !== colorId),
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_HISTORY]: newHistory,
      });

      setHistory(newHistory);

      return true;
    } catch (error) {
      console.error('Failed to delete color:', error);
      return false;
    }
  };

  /**
   * 전체 히스토리 삭제
   */
  const clearHistory = async (): Promise<boolean> => {
    try {
      const newHistory: ColorHistory = {
        colors: [],
        maxSize: history.maxSize,
        totalPicked: history.totalPicked,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_HISTORY]: newHistory,
      });

      setHistory(newHistory);

      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  };

  return {
    history,
    addColor,
    deleteColor,
    clearHistory,
  };
}
