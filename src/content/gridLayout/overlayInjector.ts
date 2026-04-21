/**
 * Grid Layout Overlay Injector
 *
 * Content Script에서 그리드/화이트스페이스 오버레이 주입을 담당
 */

import type { GridOverlaySettings, WhitespaceSettings } from '../../types/gridLayout';
import { generateGridHTML, updateGridOverlay, removeGridOverlay } from '../../utils/gridLayout/grid/gridRenderer';
import { createWhitespaceOverlay, removeWhitespaceOverlay } from '../../utils/gridLayout/grid/whitespacePattern';

/**
 * 오버레이 상태
 */
interface OverlayState {
  gridEnabled: boolean;
  whitespaceEnabled: boolean;
  gridSettings: GridOverlaySettings | null;
  whitespaceSettings: WhitespaceSettings | null;
}

let currentState: OverlayState = {
  gridEnabled: false,
  whitespaceEnabled: false,
  gridSettings: null,
  whitespaceSettings: null,
};

/**
 * 그리드 오버레이 주입
 */
export function injectGridOverlay(settings: GridOverlaySettings): void {
  currentState.gridSettings = settings;
  currentState.gridEnabled = settings.enabled;

  if (settings.enabled) {
    const html = generateGridHTML(settings, window.innerWidth);

    // 기존 오버레이 제거
    removeGridOverlay();

    // 새 오버레이 주입
    const wrapper = document.createElement('div');
    wrapper.id = 'grid-overlay-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  } else {
    removeGridOverlay();
  }
}

/**
 * 화이트스페이스 오버레이 주입
 */
export function injectWhitespaceOverlay(settings: WhitespaceSettings): void {
  currentState.whitespaceSettings = settings;
  currentState.whitespaceEnabled = settings.enabled;

  if (settings.enabled) {
    createWhitespaceOverlay(settings);
  } else {
    removeWhitespaceOverlay();
  }
}

/**
 * 모든 오버레이 제거
 */
export function removeAllOverlays(): void {
  removeGridOverlay();
  removeWhitespaceOverlay();

  // 뷰포트 오버레이 제거
  const viewportContainer = document.getElementById(OVERLAY_IDS.viewportContainer);
  viewportContainer?.remove();

  currentState.gridEnabled = false;
  currentState.whitespaceEnabled = false;
}

/**
 * 오버레이 상태 확인
 */
export function isOverlayActive(): boolean {
  return (
    document.getElementById('grid-overlay-container') !== null ||
    document.getElementById('whitespace-overlay') !== null
  );
}

/**
 * 그리드 오버레이 활성 상태 확인
 */
export function isGridOverlayActive(): boolean {
  return document.getElementById('grid-overlay-container') !== null;
}

/**
 * 화이트스페이스 오버레이 활성 상태 확인
 */
export function isWhitespaceOverlayActive(): boolean {
  return document.getElementById('whitespace-overlay') !== null;
}

/**
 * 현재 오버레이 상태 가져오기
 */
export function getOverlayState(): OverlayState {
  return {
    ...currentState,
    gridEnabled: isGridOverlayActive(),
    whitespaceEnabled: isWhitespaceOverlayActive(),
  };
}

/**
 * 윈도우 리사이즈 이벤트 핸들러 설정
 */
export function setupResizeHandler(callback: () => void): () => void {
  let timeoutId: NodeJS.Timeout | null = null;

  const handler = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, 150); // Debounce
  };

  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * 오버레이 자동 리사이즈 설정
 */
export function setupAutoResize(): () => void {
  const handleResize = () => {
    // 그리드 오버레이 업데이트
    if (currentState.gridSettings && currentState.gridEnabled) {
      updateGridOverlay(currentState.gridSettings);
    }

    // 화이트스페이스 오버레이는 크기가 자동으로 조정되므로 별도 처리 필요 없음
  };

  return setupResizeHandler(handleResize);
}

/**
 * 오버레이 초기화 (Storage에서 설정 로드)
 */
export async function initializeOverlays(): Promise<void> {
  try {
    const { STORAGE_KEYS } = await import('../../constants/storage');
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    ]);

    const settings = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] as {
      gridOverlay?: GridOverlaySettings;
      whitespace?: WhitespaceSettings;
    } | null;

    if (settings?.gridOverlay) {
      injectGridOverlay(settings.gridOverlay);
    }

    if (settings?.whitespace) {
      injectWhitespaceOverlay(settings.whitespace);
    }
  } catch (error) {
    console.error('Failed to initialize overlays:', error);
  }
}

/**
 * 오버레이 클린업
 */
export function cleanupOverlays(): void {
  removeAllOverlays();
  currentState = {
    gridEnabled: false,
    whitespaceEnabled: false,
    gridSettings: null,
    whitespaceSettings: null,
  };
}

/**
 * 메시지 핸들러 설정 (Content Script용)
 */
export function setupOverlayMessageHandler(): () => void {
  const handler = (
    message: { action?: string; payload?: unknown; settings?: GridOverlaySettings | WhitespaceSettings },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    switch (message.action) {
      case 'GRID_LAYOUT_TOGGLE_OVERLAY':
        if (message.settings) {
          injectGridOverlay(message.settings as GridOverlaySettings);
        }
        sendResponse({ success: true });
        return true;

      case 'GRID_LAYOUT_TOGGLE_WHITESPACE':
        if (message.settings) {
          injectWhitespaceOverlay(message.settings as WhitespaceSettings);
        }
        sendResponse({ success: true });
        return true;

      case 'GRID_LAYOUT_GET_OVERLAY_STATE':
        sendResponse({ success: true, state: getOverlayState() });
        return true;

      case 'GRID_LAYOUT_CLEAR_OVERLAYS':
        removeAllOverlays();
        sendResponse({ success: true });
        return true;

      default:
        return false;
    }
  };

  chrome.runtime.onMessage.addListener(handler);

  return () => {
    chrome.runtime.onMessage.removeListener(handler);
  };
}

/**
 * 오버레이 컨테이너 ID 목록
 */
export const OVERLAY_IDS = {
  gridContainer: 'grid-overlay-container',
  gridWrapper: 'grid-overlay-wrapper',
  gridStyles: 'grid-overlay-styles',
  whitespace: 'whitespace-overlay',
  viewportContainer: 'viewport-overlay-container',
  viewportFrame: 'viewport-frame',
  viewportInfo: 'viewport-info-label',
} as const;

/**
 * 모든 오버레이 요소 가져오기
 */
export function getAllOverlayElements(): HTMLElement[] {
  const elements: HTMLElement[] = [];

  for (const id of Object.values(OVERLAY_IDS)) {
    const element = document.getElementById(id);
    if (element) {
      elements.push(element);
    }
  }

  return elements;
}

/**
 * 오버레이가 페이지 간섭을 일으키는지 확인
 */
export function checkOverlayInterference(): {
  hasInterference: boolean;
  conflicts: string[];
} {
  const conflicts: string[] = [];
  const allElements = getAllOverlayElements();

  // z-index 충돌 확인
  allElements.forEach((element) => {
    const zIndex = parseInt(window.getComputedStyle(element).zIndex);
    if (zIndex > 10000) {
      conflicts.push(`High z-index on ${element.id}: ${zIndex}`);
    }
  });

  // pointer-events 확인
  allElements.forEach((element) => {
    const pointerEvents = window.getComputedStyle(element).pointerEvents;
    if (pointerEvents !== 'none') {
      conflicts.push(`Non-none pointer-events on ${element.id}: ${pointerEvents}`);
    }
  });

  return {
    hasInterference: conflicts.length > 0,
    conflicts,
  };
}

/**
 * removeGuideLines export (별칭)
 */
export { removeGuideLines } from './guideLineOverlay';

/**
 * removeGridOverlay export (별칭)
 */
export { removeGridOverlay } from '../../utils/gridLayout/grid/gridRenderer';

/**
 * removeWhitespaceOverlay export (별칭)
 */
export { removeWhitespaceOverlay } from '../../utils/gridLayout/grid/whitespacePattern';

/**
 * removeAllOverlays export (별칭)
 * Convenience function to remove all grid layout overlays
 */
export function removeAllOverlays_(): void {
  // Remove guide lines
  const guideContainer = document.getElementById('guide-lines-container');
  guideContainer?.remove();

  // Remove grid overlay
  const gridContainer = document.getElementById('grid-overlay-container');
  const gridWrapper = document.getElementById('grid-overlay-wrapper');
  gridContainer?.remove();
  gridWrapper?.remove();

  // Remove whitespace overlay
  const whitespaceOverlay = document.getElementById('whitespace-overlay');
  whitespaceOverlay?.remove();

  // Remove viewport overlay
  const viewportContainer = document.getElementById(OVERLAY_IDS.viewportContainer);
  viewportContainer?.remove();
}
