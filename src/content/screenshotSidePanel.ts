/**
 * Screenshot Side Panel Communication
 *
 * 사이드 패널과의 통신을 담당하는 Content Script
 */

import type { Screenshot } from '../types/screenshot';
import {
  SCREENSHOT_ACTIONS,
  ScreenshotMessage,
} from '../constants/screenshotMessages';
import { safeSendMessage, safeSendMessageWithCallback } from './utils/safeMessage';

/**
 * 사이드 패널에 캡처 요청
 */
export function requestCaptureFromSidePanel(
  mode: 'element' | 'area' | 'full-page',
  format: string = 'png',
  quality: number = 0.92
): void {
  safeSendMessage({
    action: SCREENSHOT_ACTIONS.START_CAPTURE,
    mode,
    format,
    quality,
  } as ScreenshotMessage);
}

/**
 * 사이드 패널에 캡처 완료 알림
 */
export function notifyCaptureComplete(screenshot: Screenshot): void {
  safeSendMessage({
    action: SCREENSHOT_ACTIONS.CAPTURE_COMPLETE,
    screenshot,
  } as ScreenshotMessage);
}

/**
 * 사이드 패널에 캡처 에러 알림
 */
export function notifyCaptureError(error: string): void {
  safeSendMessage({
    action: SCREENSHOT_ACTIONS.CAPTURE_ERROR,
    error,
  } as ScreenshotMessage);
}

/**
 * 사이드 패널에 스크린샷 저장 요청
 */
export function requestSaveScreenshot(screenshot: Screenshot): void {
  safeSendMessage({
    action: SCREENSHOT_ACTIONS.SAVE_SCREENSHOT,
    screenshot,
  } as ScreenshotMessage);
}

/**
 * 사이드 패널에서 스크린샷 목록 요청
 */
export async function requestScreenshots(): Promise<Screenshot[]> {
  return new Promise((resolve) => {
    safeSendMessageWithCallback(
      {
        action: 'GET_SCREENSHOTS',
      },
      (response) => {
        const res = response as { screenshots?: Screenshot[] } | undefined;
        resolve(res?.screenshots || []);
      }
    );
  });
}

/**
 * 사이드 패널에서 스크린샷 삭제 요청
 */
export function requestDeleteScreenshot(id: string): void {
  safeSendMessage({
    action: 'DELETE_SCREENSHOT',
    id,
  });
}

/**
 * 사이드 패널 열기
 */
export async function openSidePanel(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.id) {
    // Chrome Side Panel API (MV3)
    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ tabId: tab.id });
    } else {
      // Fallback: Popup 또는 새 탭으로 열기
      safeSendMessage({ action: 'OPEN_SIDEPANEL_FALLBACK' });
    }
  }
}

/**
 * 사이드 패널 상태 업데이트
 */
export function updateSidePanelState(state: {
  isCapturing: boolean;
  mode?: string;
}): void {
  safeSendMessage({
    action: 'UPDATE_SIDEPANEL_STATE',
    state,
  });
}

/**
 * 사이드 패널에 현재 페이지 정보 전송
 */
export function sendPageInfo(): void {
  safeSendMessage({
    action: 'PAGE_INFO',
    pageInfo: {
      title: document.title,
      url: window.location.href,
      timestamp: Date.now(),
    },
  });
}

/**
 * 사이드 패널 통신 초기화
 */
export function initSidePanelCommunication(): void {
  // 페이지 로드 시 정보 전송
  sendPageInfo();

  // URL 변경 감지
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      sendPageInfo();
    }
  }).observe(document.body, { childList: true, subtree: true });

  // 메시지 리스너
  chrome.runtime.onMessage.addListener((message: ScreenshotMessage) => {
    switch (message.action) {
      case 'GET_PAGE_INFO':
        sendPageInfo();
        break;

      case 'OPEN_SIDEPANEL':
        openSidePanel();
        break;

      default:
        break;
    }
  });
}

// Content script 로드 시 자동 초기화
if (typeof document !== 'undefined') {
  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidePanelCommunication);
  } else {
    initSidePanelCommunication();
  }
}
