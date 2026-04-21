# Phase 5: 컬러피커 - Storage 및 컬렉션

**태스크 범위**: Task #5.31 ~ #5.34 (4개)
**예상 시간**: 2시간
**의존성**: Phase 1 완료

---

## Task #5.31: Color Storage 훅

- **파일**: `src/hooks/colorPicker/useColorStorage.ts`
- **시간**: 45분
- **의존성**: Task #5.1, #5.2

```typescript
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
    loadHistory();
  }, []);

  /**
   * 히스토리 로드
   */
  const loadHistory = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_HISTORY);

      if (result[STORAGE_KEYS.COLOR_PICKER_HISTORY]) {
        setHistory(result[STORAGE_KEYS.COLOR_PICKER_HISTORY]);
      }
    } catch (error) {
      console.error('Failed to load color history:', error);
    }
  };

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
```

**완료 조건**: CRUD 동작 검증

---

## Task #5.32: Collection 관리 훅

- **파일**: `src/hooks/colorPicker/useColorCollections.ts`
- **시간**: 45분
- **의존성**: Task #5.1, #5.2

```typescript
import { useState, useEffect } from 'react';
import { ColorCollection, Color } from '../../types/colorPicker';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { generateUUID } from '../../utils/common/uuid';

/**
 * 색상 컬렉션 관리 훅
 */
export function useColorCollections() {
  const [collections, setCollections] = useState<ColorCollection[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_COLLECTIONS);

      if (result[STORAGE_KEYS.COLOR_PICKER_COLLECTIONS]) {
        setCollections(result[STORAGE_KEYS.COLOR_PICKER_COLLECTIONS]);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  /**
   * 컬렉션 생성
   */
  const createCollection = async (
    name: string,
    description?: string
  ): Promise<ColorCollection | null> => {
    try {
      if (collections.length >= STORAGE_LIMITS.COLOR_PICKER_MAX_COLLECTIONS) {
        throw new Error('컬렉션 최대 개수 초과');
      }

      const newCollection: ColorCollection = {
        id: generateUUID(),
        name,
        description,
        colors: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newCollections = [...collections, newCollection];

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_COLLECTIONS]: newCollections,
      });

      setCollections(newCollections);

      return newCollection;
    } catch (error) {
      console.error('Failed to create collection:', error);
      return null;
    }
  };

  /**
   * 컬렉션에 색상 추가
   */
  const addColorToCollection = async (
    collectionId: string,
    color: Color
  ): Promise<boolean> => {
    try {
      const newCollections = collections.map((collection) => {
        if (collection.id === collectionId) {
          if (collection.colors.length >= STORAGE_LIMITS.COLOR_PICKER_MAX_COLORS_PER_COLLECTION) {
            throw new Error('컬렉션의 색상 최대 개수 초과');
          }

          return {
            ...collection,
            colors: [...collection.colors, { ...color, collectionId }],
            updatedAt: Date.now(),
          };
        }

        return collection;
      });

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_COLLECTIONS]: newCollections,
      });

      setCollections(newCollections);

      return true;
    } catch (error) {
      console.error('Failed to add color to collection:', error);
      return false;
    }
  };

  /**
   * 컬렉션에서 색상 제거
   */
  const removeColorFromCollection = async (
    collectionId: string,
    colorId: string
  ): Promise<boolean> => {
    try {
      const newCollections = collections.map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            colors: collection.colors.filter((c) => c.id !== colorId),
            updatedAt: Date.now(),
          };
        }

        return collection;
      });

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_COLLECTIONS]: newCollections,
      });

      setCollections(newCollections);

      return true;
    } catch (error) {
      console.error('Failed to remove color from collection:', error);
      return false;
    }
  };

  /**
   * 컬렉션 삭제
   */
  const deleteCollection = async (collectionId: string): Promise<boolean> => {
    try {
      const newCollections = collections.filter((c) => c.id !== collectionId);

      await chrome.storage.local.set({
        [STORAGE_KEYS.COLOR_PICKER_COLLECTIONS]: newCollections,
      });

      setCollections(newCollections);

      return true;
    } catch (error) {
      console.error('Failed to delete collection:', error);
      return false;
    }
  };

  return {
    collections,
    createCollection,
    addColorToCollection,
    removeColorFromCollection,
    deleteCollection,
  };
}
```

**완료 조건**: 컬렉션 관리 검증

---

## Task #5.33: Favorites 관리 훅

- **파일**: `src/hooks/colorPicker/useFavoriteColors.ts`
- **시간**: 15분
- **의존성**: Task #5.1, #5.2

```typescript
import { useState, useEffect } from 'react';
import { Color } from '../../types/colorPicker';
import { STORAGE_KEYS } from '../../constants/storage';

/**
 * 즐겨찾기 색상 관리 훅
 */
export function useFavoriteColors() {
  const [favorites, setFavorites] = useState<Color[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_FAVORITES);

      if (result[STORAGE_KEYS.COLOR_PICKER_FAVORITES]) {
        setFavorites(result[STORAGE_KEYS.COLOR_PICKER_FAVORITES]);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

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
```

**완료 조건**: 즐겨찾기 관리 검증

---

## Task #5.34: Settings 관리 훅

- **파일**: `src/hooks/colorPicker/useColorPickerSettings.ts`
- **시간**: 15분
- **의존성**: Task #5.1, #5.2, #5.6

```typescript
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
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.COLOR_PICKER_SETTINGS);

      if (result[STORAGE_KEYS.COLOR_PICKER_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.COLOR_PICKER_SETTINGS]);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

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
```

**완료 조건**: 설정 관리 검증

---

**완료 후 다음 단계**: [Phase 6: React 컴포넌트](./TASK-05-phase-06-components.md)
