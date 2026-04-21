/**
 * Guide Lines Management Hook
 *
 * 가이드라인 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect } from 'react';
import type { GuideLine } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { sendGridMessage, sendGridMessages } from './sendGridMessage';
import {
  createHorizontalGuide,
  createVerticalGuide,
  createCenterGuides,
  createThirdsGuides,
  createGridGuides,
} from '../../utils/gridLayout/guideLines/createGuideLine';
import { moveGuideLine } from '../../utils/gridLayout/guideLines/positionGuide';
import {
  toggleGuideVisibility,
  showAllGuides,
  hideAllGuides,
  getVisibleGuides,
} from '../../utils/gridLayout/guideLines/visibility';
import {
  toggleGuideLock,
  lockAllGuides,
  unlockAllGuides,
  getEditableGuides,
} from '../../utils/gridLayout/guideLines/locking';
import {
  setGuideColor,
  setGuideWidth,
  setGuideStyle,
  setAllGuidesStyle,
  setAllGuidesColor,
} from '../../utils/gridLayout/guideLines/styling';
import {
  removeGuideLine,
  clearGuidesByType,
  clearUnlockedGuides,
} from '../../utils/gridLayout/guideLines/removeGuide';

export interface UseGuideLinesOptions {
  autoLoad?: boolean;
  autoSave?: boolean;
}

export function useGuideLines(options: UseGuideLinesOptions = {}) {
  const { autoLoad = true, autoSave = true } = options;

  const [guides, setGuides] = useState<GuideLine[]>(
    DEFAULT_GRID_LAYOUT_SETTINGS.guideLines.items
  );
  const [showOnHover, setShowOnHover] = useState(
    DEFAULT_GRID_LAYOUT_SETTINGS.guideLines.showOnHover
  );
  const [snapToLines, setSnapToLines] = useState(
    DEFAULT_GRID_LAYOUT_SETTINGS.guideLines.snapToLines
  );
  const [snapThreshold, setSnapThreshold] = useState(
    DEFAULT_GRID_LAYOUT_SETTINGS.guideLines.snapThreshold
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가이드라인 로드
  const loadGuides = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_GUIDELINES);
      const storedGuides = result[STORAGE_KEYS.GRID_LAYOUT_GUIDELINES];

      if (storedGuides && Array.isArray(storedGuides)) {
        setGuides(storedGuides);
      }
    } catch (err) {
      console.error('Failed to load guide lines:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guide lines');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (autoLoad) {
      loadGuides();
    }
  }, [autoLoad, loadGuides]);

  // 가이드라인 저장
  const saveGuides = useCallback(async (newGuides: GuideLine[]) => {
    if (!autoSave) {
      setGuides(newGuides);
      return;
    }

    try {
      // 최대 개수 제한 확인
      const maxGuidelines = 50; // STORAGE_LIMITS.GRID_LAYOUT_MAX_GUIDELINES
      const limitedGuides = newGuides.slice(-maxGuidelines);

      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_GUIDELINES]: limitedGuides,
      });
      setGuides(limitedGuides);
    } catch (err) {
      console.error('Failed to save guide lines:', err);
      setError(err instanceof Error ? err.message : 'Failed to save guide lines');
    }
  }, [autoSave]);

  // 가이드라인 추가
  const addHorizontalGuide = useCallback(async (position: number, options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }) => {
    const newGuide = createHorizontalGuide(position, options);
    await saveGuides([...guides, newGuide]);
    await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, newGuide);
    return newGuide;
  }, [guides, saveGuides]);

  const addVerticalGuide = useCallback(async (position: number, options?: {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  }) => {
    const newGuide = createVerticalGuide(position, options);
    await saveGuides([...guides, newGuide]);
    await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, newGuide);
    return newGuide;
  }, [guides, saveGuides]);

  // 프리셋 가이드라인 추가
  const addCenterGuides = useCallback(async (width: number, height: number) => {
    const newGuides = createCenterGuides(width, height);
    await saveGuides([...guides, ...newGuides]);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, payload: guide }))
    );
    return newGuides;
  }, [guides, saveGuides]);

  const addThirdsGuides = useCallback(async (width: number, height: number) => {
    const newGuides = createThirdsGuides(width, height);
    await saveGuides([...guides, ...newGuides]);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, payload: guide }))
    );
    return newGuides;
  }, [guides, saveGuides]);

  const addGridGuides = useCallback(async (
    width: number,
    height: number,
    columns: number,
    rows: number,
    options?: {
      color?: string;
      width?: number;
      style?: 'solid' | 'dashed' | 'dotted';
    }
  ) => {
    const newGuides = createGridGuides(width, height, columns, rows, options);
    await saveGuides([...guides, ...newGuides]);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE, payload: guide }))
    );
    return newGuides;
  }, [guides, saveGuides]);

  // 가이드라인 이동
  const moveGuide = useCallback(async (guideId: string, newPosition: number) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? moveGuideLine(g, newPosition) : g
    );
    await saveGuides(newGuides);
    const updated = newGuides.find(g => g.id === guideId);
    if (updated) {
      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, updated);
    }
  }, [guides, saveGuides]);

  // 가이드라인 표시/숨김
  const toggleVisibility = useCallback(async (guideId: string) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? toggleGuideVisibility(g) : g
    );
    await saveGuides(newGuides);
    const updated = newGuides.find(g => g.id === guideId);
    if (updated) {
      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, updated);
    }
  }, [guides, saveGuides]);

  const showAll = useCallback(async () => {
    const newGuides = showAllGuides(guides);
    await saveGuides(newGuides);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, payload: guide }))
    );
  }, [guides, saveGuides]);

  const hideAll = useCallback(async () => {
    const newGuides = hideAllGuides(guides);
    await saveGuides(newGuides);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, payload: guide }))
    );
  }, [guides, saveGuides]);

  // 가이드라인 잠금
  const toggleLock = useCallback(async (guideId: string) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? toggleGuideLock(g) : g
    );
    await saveGuides(newGuides);
    const updated = newGuides.find(g => g.id === guideId);
    if (updated) {
      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, updated);
    }
  }, [guides, saveGuides]);

  const lockAll = useCallback(async () => {
    const newGuides = lockAllGuides(guides);
    await saveGuides(newGuides);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, payload: guide }))
    );
  }, [guides, saveGuides]);

  const unlockAll = useCallback(async () => {
    const newGuides = unlockAllGuides(guides);
    await saveGuides(newGuides);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, payload: guide }))
    );
  }, [guides, saveGuides]);

  // 가이드라인 스타일 변경
  const updateGuideColor = useCallback(async (guideId: string, color: string) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? setGuideColor(g, color) : g
    );
    await saveGuides(newGuides);
    const updated = newGuides.find(g => g.id === guideId);
    if (updated) {
      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, updated);
    }
  }, [guides, saveGuides]);

  const updateGuideWidth = useCallback(async (guideId: string, width: number) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? setGuideWidth(g, width) : g
    );
    await saveGuides(newGuides);
    const updated = newGuides.find(g => g.id === guideId);
    if (updated) {
      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, updated);
    }
  }, [guides, saveGuides]);

  const updateGuideStyle = useCallback(async (
    guideId: string,
    style: 'solid' | 'dashed' | 'dotted'
  ) => {
    const newGuides = guides.map(g =>
      g.id === guideId ? setGuideStyle(g, style) : g
    );
    await saveGuides(newGuides);
    const updated = newGuides.find(g => g.id === guideId);
    if (updated) {
      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, updated);
    }
  }, [guides, saveGuides]);

  const setAllStyle = useCallback(async (style: 'solid' | 'dashed' | 'dotted') => {
    const newGuides = setAllGuidesStyle(guides, style);
    await saveGuides(newGuides);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, payload: guide }))
    );
  }, [guides, saveGuides]);

  const setAllColor = useCallback(async (color: string) => {
    const newGuides = setAllGuidesColor(guides, color);
    await saveGuides(newGuides);
    await sendGridMessages(
      newGuides.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE, payload: guide }))
    );
  }, [guides, saveGuides]);

  // 가이드라인 삭제
  const removeGuide = useCallback(async (guideId: string) => {
    const newGuides = removeGuideLine(guides, guideId);
    await saveGuides(newGuides);
    await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_GUIDE, guideId);
  }, [guides, saveGuides]);

  const clearAllGuides = useCallback(async () => {
    await saveGuides([]);
  }, [saveGuides]);

  const clearByType = useCallback(async (type: 'horizontal' | 'vertical') => {
    const removed = guides.filter(g => g.type === type);
    const newGuides = clearGuidesByType(guides, type);
    await saveGuides(newGuides);
    await sendGridMessages(
      removed.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_GUIDE, payload: guide.id }))
    );
  }, [guides, saveGuides]);

  const clearUnlocked = useCallback(async () => {
    const removed = guides.filter(g => !g.locked);
    const newGuides = clearUnlockedGuides(guides);
    await saveGuides(newGuides);
    await sendGridMessages(
      removed.map(guide => ({ action: MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_GUIDE, payload: guide.id }))
    );
  }, [guides, saveGuides]);

  // 통계
  const stats = {
    total: guides.length,
    visible: getVisibleGuides(guides).length,
    horizontal: guides.filter(g => g.type === 'horizontal').length,
    vertical: guides.filter(g => g.type === 'vertical').length,
    locked: guides.filter(g => g.locked).length,
    editable: getEditableGuides(guides).length,
  };

  return {
    // 상태
    guides,
    showOnHover,
    setShowOnHover,
    snapToLines,
    setSnapToLines,
    snapThreshold,
    setSnapThreshold,
    isLoading,
    error,

    // CRUD 작업
    loadGuides,
    addHorizontalGuide,
    addVerticalGuide,
    addCenterGuides,
    addThirdsGuides,
    addGridGuides,
    moveGuide,
    toggleVisibility,
    showAll,
    hideAll,
    toggleLock,
    lockAll,
    unlockAll,
    updateGuideColor,
    updateGuideWidth,
    updateGuideStyle,
    setAllStyle,
    setAllColor,
    removeGuide,
    clearAllGuides,
    clearByType,
    clearUnlocked,

    // 통계
    stats,
  };
}
