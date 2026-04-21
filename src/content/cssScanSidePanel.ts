/**
 * CSS Scan Side Panel Communication
 *
 * 사이드 패널과의 통신을 담당
 */

import type { CSSScanResult } from '../types/cssScan';
import { CSS_SCAN_MESSAGE_ACTIONS } from '../constants/cssScanMessages';
import { safeSendMessage } from './utils/safeMessage';

/**
 * 사이드 패널에 스캔 요청
 */
export function requestCSSScan(options: {
  includeComputed?: boolean;
  includeInherited?: boolean;
}): void {
  safeSendMessage({
    action: CSS_SCAN_MESSAGE_ACTIONS.START_SCAN,
    options,
  });
}

/**
 * 사이드 패널에 요소 스타일 요청
 */
export function requestElementStyle(
  selector: string,
  options?: {
    includeComputed?: boolean;
    includeInherited?: boolean;
  }
): void {
  safeSendMessage({
    action: CSS_SCAN_MESSAGE_ACTIONS.GET_ELEMENT_STYLE,
    selector,
    options,
  });
}

/**
 * 사이드 패널에 내보내기 요청
 */
export function requestExport(
  format: 'css' | 'scss' | 'less' | 'json',
  options?: {
    minify?: boolean;
    includeComputed?: boolean;
  }
): void {
  safeSendMessage({
    action: CSS_SCAN_MESSAGE_ACTIONS.EXPORT_STYLES,
    format,
    options,
  });
}

/**
 * 사이드 패널에서 스캔 결과 가져오기
 */
export async function getScanResults(): Promise<CSSScanResult[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('css-scan-results', (result) => {
      resolve((result['css-scan-results'] as CSSScanResult[]) || []);
    });
  });
}

/**
 * 최신 스캔 결과 가져오기
 */
export async function getLatestScanResult(): Promise<CSSScanResult | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('css-scan-latest', (result) => {
      resolve((result['css-scan-latest'] as CSSScanResult | null) || null);
    });
  });
}

/**
 * 페이지 정보 전송
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
 * 사이드 패널 열기
 */
export async function openSidePanel(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id) {
    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  }
}

/**
 * 요소 하이라이트 요청
 */
export function requestElementHighlight(selector: string): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'HIGHLIGHT_ELEMENT',
        selector,
      });
    }
  });
}

/**
 * 요소 하이라이트 제거 요청
 */
export function requestRemoveHighlight(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'REMOVE_HIGHLIGHT',
      });
    }
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
  chrome.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as { action?: string; [key: string]: unknown };
    switch (msg.action) {
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidePanelCommunication);
  } else {
    initSidePanelCommunication();
  }
}
