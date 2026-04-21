/**
 * Viewport Management Hook
 *
 * 뷰포트 관리를 위한 React Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ViewportState, ViewportPreset } from '../../types/gridLayout';
import type { ResizeHandle } from '../../utils/gridLayout/viewport/viewportResizer';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { sendGridMessage } from './sendGridMessage';
import {
  createViewportStateFromPreset,
  createCustomViewportState,
  rotateViewport,
  setViewportZoom,
  adjustViewportZoom,
  resizeViewport,
  calculateFitZoom,
  getWindowSize,
} from '../../utils/gridLayout/viewport/viewportCalculator';
import {
  getCurrentBreakpoint,
  getBreakpointInfo,
  getActiveBreakpoints,
} from '../../utils/gridLayout/viewport/breakpointDetector';
import {
  createViewportOverlayStyle,
  getViewportDisplayData,
} from '../../utils/gridLayout/viewport/viewportOverlay';
import {
  startResize,
  calculateResize,
  endResize,
  createResizedViewportState,
} from '../../utils/gridLayout/viewport/viewportResizer';
import {
  findPresetById,
  findClosestPreset,
  createCustomPreset,
  saveCustomPreset,
  addRecentPreset,
  getRecentPresets,
} from '../../utils/gridLayout/viewport/presetSelector';

export interface UseViewportOptions {
  autoLoad?: boolean;
  autoSave?: boolean;
  observeWindowResize?: boolean;
}

export function useViewport(options: UseViewportOptions = {}) {
  const {
    autoLoad = true,
    autoSave = true,
    observeWindowResize = false,
  } = options;

  const [viewport, setViewportState] = useState<ViewportState>(
    DEFAULT_GRID_LAYOUT_SETTINGS.viewport
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resizerState, setResizerState] = useState({
    isResizing: false,
    handle: null as string | null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    minWidth: 320,
    minHeight: 480,
  });

  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 뷰포트 로드
  const loadViewport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const stored = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as {
        viewport?: ViewportState;
      } | null;

      if (stored?.viewport) {
        setViewportState(stored.viewport);
      }
    } catch (err) {
      console.error('Failed to load viewport:', err);
      setError(err instanceof Error ? err.message : 'Failed to load viewport');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (autoLoad) {
      loadViewport();
    }
  }, [autoLoad, loadViewport]);

  // 윈도우 크기 감지
  useEffect(() => {
    if (!observeWindowResize) return;

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        // 윈도우 크기가 변경되면 줌을 다시 계산
        const windowSize = getWindowSize();
        calculateFitZoom(
          viewport.customWidth,
          viewport.customHeight,
          windowSize.width,
          windowSize.height
        );
        // 필요한 경우 줌 조정
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [observeWindowResize, viewport.customWidth, viewport.customHeight]);

  // 뷰포트 저장 + Content Script에 메시지 전송
  const saveViewport = useCallback(async (newViewport: ViewportState) => {
    setViewportState(newViewport);

    if (!autoSave) return;

    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const current = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] || DEFAULT_GRID_LAYOUT_SETTINGS;

      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: {
          ...current,
          viewport: newViewport,
        },
      });

      await sendGridMessage(MESSAGE_ACTIONS.GRID_LAYOUT_SET_VIEWPORT, newViewport);
    } catch (err) {
      console.error('Failed to save viewport:', err);
      setError(err instanceof Error ? err.message : 'Failed to save viewport');
    }
  }, [autoSave]);

  // 프리셋 선택
  const selectPreset = useCallback(async (preset: ViewportPreset) => {
    const newViewport = createViewportStateFromPreset(preset);
    await saveViewport(newViewport);
    addRecentPreset(preset.id);
  }, [saveViewport]);

  // ID로 프리셋 선택
  const selectPresetById = useCallback(async (presetId: string) => {
    const preset = findPresetById(presetId);
    if (preset) {
      await selectPreset(preset);
    }
  }, [selectPreset]);

  // 사용자 정의 크기 설정
  const setCustomSize = useCallback(async (width: number, height: number) => {
    const newViewport = createCustomViewportState(width, height, viewport.zoom);
    await saveViewport(newViewport);
  }, [viewport.zoom, saveViewport]);

  // 회전
  const rotate = useCallback(async () => {
    const newViewport = rotateViewport(viewport);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 줌 설정
  const setZoom = useCallback(async (zoom: number) => {
    const newViewport = setViewportZoom(viewport, zoom);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 줌 증가
  const zoomIn = useCallback(async (step: number = 0.1) => {
    const newViewport = adjustViewportZoom(viewport, 1, step);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 줌 감소
  const zoomOut = useCallback(async (step: number = 0.1) => {
    const newViewport = adjustViewportZoom(viewport, -1, step);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 화면에 맞추기
  const fitToScreen = useCallback(async () => {
    const windowSize = getWindowSize();
    const fitZoom = calculateFitZoom(
      viewport.customWidth,
      viewport.customHeight,
      windowSize.width,
      windowSize.height
    );
    const newViewport = setViewportZoom(viewport, fitZoom);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 줌 리셋
  const resetZoom = useCallback(async () => {
    const newViewport = setViewportZoom(viewport, 1);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 크기 조정
  const resize = useCallback(async (width: number, height: number) => {
    const newViewport = resizeViewport(viewport, width, height);
    await saveViewport(newViewport);
  }, [viewport, saveViewport]);

  // 리사이징 시작
  const startResizing = useCallback((
    handle: string,
    mouseX: number,
    mouseY: number
  ) => {
    const state = startResize(
      handle as ResizeHandle,
      mouseX,
      mouseY,
      viewport.customWidth,
      viewport.customHeight
    );
    setResizerState(state as {
      isResizing: boolean;
      handle: string | null;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      minWidth: number;
      minHeight: number;
    });
  }, [viewport.customWidth, viewport.customHeight]);

  // 리사이징 중
  const updateResizing = useCallback((mouseX: number, mouseY: number) => {
    if (!resizerState.isResizing || !resizerState.handle) {
      return;
    }

    const { width, height } = calculateResize(resizerState as {
      isResizing: boolean;
      handle: ResizeHandle | null;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      minWidth: number;
      minHeight: number;
    }, mouseX, mouseY);
    const newViewport = createResizedViewportState(viewport, width, height);
    setViewportState(newViewport); // 실시간 업데이트 (저장 X)
  }, [resizerState, viewport]);

  // 리사이징 종료
  const stopResizing = useCallback(async () => {
    if (!resizerState.isResizing) return;

    // 현재 상태 저장
    await saveViewport(viewport);

    const newState = endResize();
    setResizerState(prev => ({ ...prev, ...newState }));
  }, [resizerState.isResizing, viewport, saveViewport]);

  // 사용자 정의 프리셋 저장
  const saveAsPreset = useCallback(async (
    name: string,
    options?: {
      devicePixelRatio?: number;
      icon?: string;
    }
  ) => {
    const customPreset = createCustomPreset(
      name,
      viewport.customWidth,
      viewport.customHeight,
      options
    );
    saveCustomPreset(customPreset);
    return customPreset;
  }, [viewport.customWidth, viewport.customHeight]);

  // 현재 브레이크포인트
  const currentBreakpoint = getCurrentBreakpoint(viewport.customWidth);
  const breakpointInfo = getBreakpointInfo(viewport.customWidth);
  const activeBreakpoints = getActiveBreakpoints(viewport.customWidth);

  // 가장 가까운 프리셋 찾기
  const closestPreset = findClosestPreset(
    viewport.customWidth,
    viewport.customHeight
  );

  // 뷰포트 표시 데이터
  const displayData = getViewportDisplayData(viewport);

  // 오버레이 스타일
  const overlayStyle = createViewportOverlayStyle(viewport);

  // 최근 사용한 프리셋
  const recentPresets = getRecentPresets();

  return {
    // 상태
    viewport,
    isLoading,
    error,
    resizerState,

    // 브레이크포인트 정보
    currentBreakpoint,
    breakpointInfo,
    activeBreakpoints,

    // 표시 데이터
    displayData,
    overlayStyle,

    // 프리셋 관련
    closestPreset,
    recentPresets,

    // 작업
    loadViewport,
    selectPreset,
    selectPresetById,
    setCustomSize,
    rotate,
    setZoom,
    zoomIn,
    zoomOut,
    fitToScreen,
    resetZoom,
    resize,
    saveAsPreset,

    // 리사이징
    startResizing,
    updateResizing,
    stopResizing,
  };
}
