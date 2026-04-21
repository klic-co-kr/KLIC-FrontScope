import { useState, useEffect } from 'react';
import { Color } from '../../types/colorPicker';
import { STORAGE_KEYS } from '../../constants/storage';

/**
 * 즐겨찾기 색상 관리 훅
 */
export function useFavoriteColors() {
  const [favorites, setFavorites] = useState<Color[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_FAVORITES);

        if (result[STORAGE_KEYS.COLOR_PICKER_FAVORITES]) {
          setFavorites(result[STORAGE_KEYS.COLOR_PICKER_FAVORITES] as Color[]);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  /**
   * 즐겨찾기 추가
   */
  const addFavorite = async (color: Color): Promise<boolean> => {
    try {
      const newFavorites = [...favorites, { ...color, isFavorite: true }];

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);

      return true;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  };

  /**
   * 즐겨찾기 제거
   */
  const removeFavorite = async (colorId: string): Promise<boolean> => {
    try {
      const newFavorites = favorites.filter((c) => c.id !== colorId);

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);

      return true;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  };

  /**
   * 즐겨찾기 토글
   */
  const toggleFavorite = async (color: Color): Promise<boolean> => {
    const isFavorite = favorites.some((c) => c.id === color.id);

    if (isFavorite) {
      return removeFavorite(color.id);
    } else {
      return addFavorite(color);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
