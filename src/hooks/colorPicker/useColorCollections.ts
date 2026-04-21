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
        setCollections(result[STORAGE_KEYS.COLOR_PICKER_COLLECTIONS] as ColorCollection[]);
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
