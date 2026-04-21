/**
 * Text Edit History Hook
 *
 * 텍스트 편집 히스토리를 관리하는 React 훅
 */

import { useCallback } from 'react';
import type { TextEdit, TextEditHistory } from '../../types/textEdit';
import { useTextEditStorage } from './useTextEditStorage';

/**
 * 텍스트 편집 히스토리 관리 훅
 */
export function useTextEditHistory() {
  const { history, saveHistory } = useTextEditStorage();

  /**
   * 새 편집 추가
   *
   * @param edit - 편집 정보
   */
  const addEdit = useCallback(
    async (edit: TextEdit) => {
      try {
        const newEdits = [edit, ...history.edits];

        // maxSize 초과 시 오래된 항목 제거
        if (newEdits.length > history.maxSize) {
          newEdits.length = history.maxSize;
        }

        const newHistory: TextEditHistory = {
          ...history,
          edits: newEdits,
          totalEdits: history.totalEdits + 1,
          lastEditTime: Date.now(),
        };

        await saveHistory(newHistory);
      } catch (err) {
        console.error('Failed to add edit:', err);
        throw err;
      }
    },
    [history, saveHistory]
  );

  /**
   * 특정 편집 제거
   *
   * @param editId - 편집 ID
   */
  const removeEdit = useCallback(
    async (editId: string) => {
      try {
        const newEdits = history.edits.filter(e => e.id !== editId);

        const newHistory: TextEditHistory = {
          ...history,
          edits: newEdits,
        };

        await saveHistory(newHistory);
      } catch (err) {
        console.error('Failed to remove edit:', err);
        throw err;
      }
    },
    [history, saveHistory]
  );

  /**
   * 특정 편집 되돌리기
   *
   * @param editId - 편집 ID
   * @returns 성공 여부
   */
  const undoEdit = useCallback(
    async (editId: string): Promise<boolean> => {
      const edit = history.edits.find(e => e.id === editId);
      if (!edit) return false;

      try {
        // Content Script에 메시지 전송하여 DOM 업데이트
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tabs[0]?.id) {
          await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'TEXT_EDIT_UNDO',
            data: edit,
          });

          // 히스토리에서 제거
          await removeEdit(editId);

          return true;
        }

        return false;
      } catch (err) {
        console.error('Failed to undo edit:', err);
        return false;
      }
    },
    [history.edits, removeEdit]
  );

  /**
   * 모든 편집 되돌리기
   *
   * @returns 완료된 개수
   */
  const undoAll = useCallback(async (): Promise<number> => {
    let count = 0;

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tabs[0]?.id) return 0;

      // 모든 편집을 역순으로 되돌리기
      for (const edit of [...history.edits].reverse()) {
        try {
          await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'TEXT_EDIT_UNDO',
            data: edit,
          });
          count++;
        } catch (err) {
          console.error('Failed to undo edit:', edit.id, err);
        }
      }

      // 히스토리 초기화
      const newHistory: TextEditHistory = {
        ...history,
        edits: [],
        lastEditTime: Date.now(),
      };

      await saveHistory(newHistory);

      return count;
    } catch (err) {
      console.error('Failed to undo all:', err);
      return count;
    }
  }, [history, saveHistory]);

  /**
   * ID로 편집 찾기
   *
   * @param editId - 편집 ID
   * @returns 편집 정보
   */
  const findEdit = useCallback(
    (editId: string): TextEdit | undefined => {
      return history.edits.find(e => e.id === editId);
    },
    [history.edits]
  );

  /**
   * 요소 선택자로 편집 찾기
   *
   * @param selector - CSS 선택자
   * @returns 편집 배열
   */
  const findEditsBySelector = useCallback(
    (selector: string): TextEdit[] => {
      return history.edits.filter(e => e.element.selector === selector);
    },
    [history.edits]
  );

  /**
   * 최근 N개 편집 가져오기
   *
   * @param count - 개수
   * @returns 편집 배열
   */
  const getRecentEdits = useCallback(
    (count: number): TextEdit[] => {
      return history.edits.slice(0, count);
    },
    [history.edits]
  );

  return {
    edits: history.edits,
    totalEdits: history.totalEdits,
    lastEditTime: history.lastEditTime,
    addEdit,
    removeEdit,
    undoEdit,
    undoAll,
    findEdit,
    findEditsBySelector,
    getRecentEdits,
  };
}
