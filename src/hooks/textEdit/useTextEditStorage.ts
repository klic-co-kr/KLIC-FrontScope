/**
 * Text Edit Storage Hook
 *
 * Chrome Storage와 텍스트 편집 데이터를 동기화하는 React 훅
 */

import { useState, useEffect, useCallback } from 'react';
import type { TextEditHistory } from '../../types/textEdit';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { KlicError } from '../../constants/errors';

/**
 * 텍스트 편집 Storage 훅
 */
export function useTextEditStorage() {
  const [history, setHistory] = useState<TextEditHistory>({
    edits: [],
    maxSize: STORAGE_LIMITS.TEXT_EDIT_MAX_HISTORY,
    totalEdits: 0,
    lastEditTime: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<KlicError | null>(null);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Storage에서 히스토리 로드
   */
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await chrome.storage.local.get(
        STORAGE_KEYS.TEXT_EDIT_HISTORY
      );

      const loaded = result[STORAGE_KEYS.TEXT_EDIT_HISTORY];

      if (loaded) {
        // 데이터 검증
        if (isValidHistory(loaded)) {
          setHistory(loaded);
        } else {
          throw new KlicError(
            'INVALID_DATA',
            'Invalid history data format'
          );
        }
      }
    } catch (err) {
      const error =
        err instanceof KlicError
          ? err
          : new KlicError(
              'LOAD_FAILED',
              'Failed to load history',
              err
            );
      setError(error);
      console.error('Failed to load text edit history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Storage에 히스토리 저장
   */
  const saveHistory = useCallback(
    async (newHistory: TextEditHistory) => {
      try {
        setError(null);

        // 용량 체크
        const size = estimateSize(newHistory as unknown as Record<string, unknown>);
        if (size > STORAGE_LIMITS.TOTAL_QUOTA_MB * 1024 * 1024) {
          throw new KlicError(
            'QUOTA_EXCEEDED',
            '저장 공간이 부족합니다'
          );
        }

        await chrome.storage.local.set({
          [STORAGE_KEYS.TEXT_EDIT_HISTORY]: newHistory,
        });

        setHistory(newHistory);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes('QUOTA_BYTES')
        ) {
          // 용량 초과 시 오래된 항목 삭제
          const trimmed: TextEditHistory = {
            ...newHistory,
            edits: newHistory.edits.slice(
              0,
              Math.floor(newHistory.maxSize / 2)
            ),
          };

          try {
            await chrome.storage.local.set({
              [STORAGE_KEYS.TEXT_EDIT_HISTORY]: trimmed,
            });
            setHistory(trimmed);
          } catch (e) {
            const error = new KlicError(
              'SAVE_FAILED',
              '저장 공간이 부족합니다',
              e
            );
            setError(error);
            throw error;
          }
        } else {
          const error =
            err instanceof KlicError
              ? err
              : new KlicError('SAVE_FAILED', '저장 실패', err);
          setError(error);
          throw error;
        }
      }
    },
    []
  );

  /**
   * 히스토리 초기화
   */
  const clearHistory = useCallback(async () => {
    try {
      const emptyHistory: TextEditHistory = {
        edits: [],
        maxSize: STORAGE_LIMITS.TEXT_EDIT_MAX_HISTORY,
        totalEdits: history.totalEdits, // 총 편집 수는 유지
        lastEditTime: 0,
      };

      await saveHistory(emptyHistory);
    } catch (err) {
      console.error('Failed to clear history:', err);
      throw err;
    }
  }, [history.totalEdits, saveHistory]);

  /**
   * Storage 사용량 가져오기
   */
  const getStorageUsage = useCallback(async () => {
    try {
      const bytes = await chrome.storage.local.getBytesInUse(
        STORAGE_KEYS.TEXT_EDIT_HISTORY
      );
      const mb = bytes / (1024 * 1024);
      const percentage =
        (bytes / (STORAGE_LIMITS.TOTAL_QUOTA_MB * 1024 * 1024)) * 100;

      return {
        bytes,
        mb: Math.round(mb * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      };
    } catch {
      return { bytes: 0, mb: 0, percentage: 0 };
    }
  }, []);

  return {
    history,
    isLoading,
    error,
    loadHistory,
    saveHistory,
    clearHistory,
    getStorageUsage,
  };
}

/**
 * 히스토리 데이터 유효성 검증
 */
function isValidHistory(data: unknown): data is TextEditHistory {
  return (
    data !== null &&
    typeof data === 'object' &&
    'edits' in data &&
    Array.isArray(data.edits) &&
    'maxSize' in data &&
    typeof data.maxSize === 'number' &&
    'totalEdits' in data &&
    typeof data.totalEdits === 'number' &&
    'lastEditTime' in data &&
    typeof data.lastEditTime === 'number'
  );
}

/**
 * 객체 크기 추정 (bytes)
 */
function estimateSize(obj: Record<string, unknown>): number {
  const json = JSON.stringify(obj);
  return new Blob([json]).size;
}
