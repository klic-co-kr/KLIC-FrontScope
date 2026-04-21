/**
 * Grid Layout Content Script
 *
 * 그리드 레이아웃 도구의 Content Script 메인 파일
 * 메시지 수신, 오버레이 주입, 이벤트 핸들링을 담당
 */

import type { GridOverlaySettings, WhitespaceSettings, GuideLine, ViewportState } from '../../types/gridLayout';
import { injectGridOverlay, injectWhitespaceOverlay, removeAllOverlays } from './overlayInjector';
import { injectViewportOverlay, removeViewportOverlay } from './viewportOverlay';
import { injectSingleGuideLine, updateGuideLine, removeGuideLine, removeGuideLines } from './guideLineOverlay';
import { setupMouseHandlers } from './mouseHandler';
import { setupDragDrop } from './dragDropHandler';
import { setupResizeHandler } from './resizeHandler';
import { registerDefaultShortcuts } from './keyboardHandler';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { safeSendMessage } from '../utils/safeMessage';

// 현재 상태
let currentGridSettings: GridOverlaySettings | null = null;
let currentWhitespaceSettings: WhitespaceSettings | null = null;
let currentViewportState: ViewportState | null = null;
let currentGuides: GuideLine[] = [];

// 이벤트 핸들러 정리 함수들
const cleanupFunctions: (() => void)[] = [];

/**
 * 메시지 리스너
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.action) {
      case MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY:
        handleToggleGrid(message.payload);
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_SET_VIEWPORT:
        handleSetViewport(message.payload as ViewportState);
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_WHITESPACE:
        handleToggleWhitespace(message.payload);
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE:
        handleAddGuide(message.payload);
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_UPDATE_GUIDE:
        handleUpdateGuide(message.payload);
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_REMOVE_GUIDE:
        handleRemoveGuide(message.payload);
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_CLEAR_ALL:
        handleClearAll();
        break;

      case MESSAGE_ACTIONS.GRID_LAYOUT_GET_INFO:
        handleGetInfo();
        break;

      default:
        return false;
    }

    sendResponse({ success: true });
    return true;
  } catch (error) {
    console.error('Grid Layout content script error:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    return true;
  }
});

/**
 * 그리드 토글 처리
 */
function handleToggleGrid(settings: GridOverlaySettings) {
  currentGridSettings = settings;

  if (settings.enabled) {
    injectGridOverlay(settings);
  } else {
    removeGridOverlay();
  }
}

/**
 * 뷰포트 설정 처리
 */
function handleSetViewport(viewportState: ViewportState) {
  currentViewportState = viewportState;
  injectViewportOverlay(viewportState);

  // 그리드 오버레이 업데이트
  if (currentGridSettings?.enabled) {
    injectGridOverlay(currentGridSettings);
  }

  // 화이트스페이스 업데이트
  if (currentWhitespaceSettings?.enabled) {
    injectWhitespaceOverlay(currentWhitespaceSettings);
  }
}

/**
 * 화이트스페이스 토글 처리
 */
function handleToggleWhitespace(settings: WhitespaceSettings) {
  currentWhitespaceSettings = settings;

  if (settings.enabled) {
    injectWhitespaceOverlay(settings);
  } else {
    removeWhitespaceOverlay();
  }
}

/**
 * 가이드라인 추가 처리
 */
function handleAddGuide(guide: GuideLine) {
  currentGuides = [...currentGuides, guide];
  injectSingleGuideLine(guide);
}

/**
 * 가이드라인 업데이트 처리
 */
function handleUpdateGuide(guide: GuideLine) {
  const exists = currentGuides.some(g => g.id === guide.id);
  if (!exists) return;

  currentGuides = currentGuides.map(g => g.id === guide.id ? guide : g);
  updateGuideLine(guide);
}

/**
 * 가이드라인 제거 처리
 */
function handleRemoveGuide(guideId: string) {
  currentGuides = currentGuides.filter(g => g.id !== guideId);
  removeGuideLine(guideId);
}

/**
 * 모두 제거 처리
 */
function handleClearAll() {
  currentGuides = [];
  currentViewportState = null;
  removeGuideLines();
  removeGridOverlay();
  removeWhitespaceOverlay();
  removeViewportOverlay();
}

/**
 * 정보 요청 처리
 */
function handleGetInfo() {
  const info = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      state: currentViewportState,
    },
    grid: currentGridSettings,
    whitespace: currentWhitespaceSettings,
    guides: currentGuides,
  };

  safeSendMessage({
    action: MESSAGE_ACTIONS.GRID_LAYOUT_INFO_RESPONSE,
    payload: info,
  });
}

/**
 * 그리드 오버레이 제거
 */
function removeGridOverlay() {
  const container = document.getElementById('grid-overlay-container');
  const wrapper = document.getElementById('grid-overlay-wrapper');
  container?.remove();
  wrapper?.remove();
}

/**
 * 화이트스페이스 오버레이 제거
 */
function removeWhitespaceOverlay() {
  const overlay = document.getElementById('whitespace-overlay');
  overlay?.remove();
}

/**
 * 이벤트 핸들러 설정
 */
function setupEventHandlers() {
  // 마우스 핸들러
  const cleanupMouse = setupMouseHandlers(
    () => currentGuides,
    (guideId, newPosition) => {
      const guide = currentGuides.find(g => g.id === guideId);
      if (guide && !guide.locked) {
        const updatedGuide = { ...guide, position: newPosition };
        currentGuides = currentGuides.map(g => g.id === guideId ? updatedGuide : g);
        updateGuideLine(updatedGuide);

        // Side Panel에 변경 알림
        safeSendMessage({
          action: MESSAGE_ACTIONS.GRID_LAYOUT_GUIDE_MOVED,
          payload: { guideId, position: newPosition },
        });
      }
    }
  );
  cleanupFunctions.push(cleanupMouse);

  // 드래그 앤 드롭 핸들러
  const cleanupDragDrop = setupDragDrop(
    () => currentGuides,
    (guideId, newPosition) => {
      const guide = currentGuides.find(g => g.id === guideId);
      if (guide && !guide.locked) {
        const updatedGuide = { ...guide, position: newPosition };
        currentGuides = currentGuides.map(g => g.id === guideId ? updatedGuide : g);
        updateGuideLine(updatedGuide);
      }
    }
  );
  cleanupFunctions.push(cleanupDragDrop);

  // 리사이즈 핸들러
  if (currentGridSettings || currentWhitespaceSettings) {
    const cleanupResize = setupResizeHandler(
      currentGridSettings ?? DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay,
      currentWhitespaceSettings ?? DEFAULT_GRID_LAYOUT_SETTINGS.whitespace,
      () => {
        if (currentGridSettings?.enabled) {
          injectGridOverlay(currentGridSettings);
        }
      },
      () => {
        if (currentWhitespaceSettings?.enabled) {
          injectWhitespaceOverlay(currentWhitespaceSettings);
        }
      }
    );
    cleanupFunctions.push(cleanupResize);
  }

  // 키보드 핸들러
  const cleanupKeyboard = registerDefaultShortcuts();
  cleanupFunctions.push(cleanupKeyboard);
}

/**
 * 초기화
 */
function initialize() {
  // 설정 로드
  loadSettings();

  // 이벤트 핸들러 설정
  setupEventHandlers();
}

/**
 * 설정 로드
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('gridLayoutSettings');
    const stored = result.gridLayoutSettings as {
      gridOverlay?: GridOverlaySettings;
      whitespace?: WhitespaceSettings;
      guideLines?: { items?: GuideLine[] };
    } | null;

    if (stored) {
      if (stored.gridOverlay) {
        currentGridSettings = stored.gridOverlay;
      }
      if (stored.whitespace) {
        currentWhitespaceSettings = stored.whitespace;
      }
      if (stored.guideLines?.items) {
        currentGuides = stored.guideLines.items;
      }
    }
  } catch (error) {
    console.error('Failed to load grid layout settings:', error);
  }
}

/**
 * 정리
 */
function cleanup() {
  removeAllOverlays();
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions.length = 0;
}

// 메시지 리스너는 모듈 로드 시 등록되지만, 이벤트 핸들러는 activate 시에만 설정
export { initialize, cleanup };
