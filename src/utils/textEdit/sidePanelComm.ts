/**
 * Side Panel Communication Utilities
 *
 * Side Panel과 Content Script 간 통신을 위한 유틸리티 함수들
 */

import type { TextEdit, TextEditMessage, MessageResponse } from '../../types/textEdit';

/**
 * Side Panel로 메시지 전송
 */
export async function sendToSidePanel(
  action: string,
  data?: unknown
): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action,
        data,
        timestamp: Date.now(),
      } as TextEditMessage,
      (response) => {
        if (response) {
          resolve(response as MessageResponse);
        } else {
          reject(new Error('No response from side panel'));
        }
      }
    );
  });
}

/**
 * Content Script로 메시지 전송
 */
export async function sendToContentScript(
  tabId: number,
  action: string,
  data?: unknown
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        action,
        data,
        timestamp: Date.now(),
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      }
    );
  });
}

/**
 * 활성 탭 ID 가져오기
 */
export async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0]?.id || null;
}

/**
 * 현재 페이지 URL 가져오기
 */
export async function getCurrentPageUrl(): Promise<string> {
  const tabId = await getActiveTabId();

  if (!tabId) {
    throw new Error('No active tab');
  }

  const tab = await chrome.tabs.get(tabId);
  return tab.url || '';
}

/**
 * 페이지가 편집 가능한지 확인
 */
export async function isPageEditable(): Promise<boolean> {
  try {
    const url = await getCurrentPageUrl();

    // 제외된 URL 패턴
    const excludedPatterns = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'file://',
    ];

    return !excludedPatterns.some(pattern => url.startsWith(pattern));
  } catch {
    return false;
  }
}

/**
 * Side Panel이 열려있는지 확인
 */
export async function isSidePanelOpen(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'GET_SIDE_PANEL_STATE' },
      (response) => {
        resolve(response?.isOpen ?? false);
      }
    );
  });
}

/**
 * 편집 저장 요청
 */
export async function saveEdit(edit: TextEdit): Promise<boolean> {
  try {
    const response = await sendToSidePanel('TEXT_EDIT_SAVE', { edit });
    return response.success;
  } catch {
    console.error('Failed to save edit:', edit);
    return false;
  }
}

/**
 * 편집 되돌리기 요청
 */
export async function requestUndo(editId: string): Promise<boolean> {
  try {
    const response = await sendToSidePanel('TEXT_EDIT_UNDO', { editId });
    return response.success;
  } catch {
    console.error('Failed to undo edit:', editId);
    return false;
  }
}

/**
 * 모든 편집 되돌리기 요청
 */
export async function requestUndoAll(): Promise<number> {
  try {
    const response = await sendToSidePanel('TEXT_EDIT_UNDO_ALL', {});
    return response?.count || 0;
  } catch {
    console.error('Failed to undo all edits');
    return 0;
  }
}

/**
 * 통계 업데이트 요청
 */
export async function updateStats(): Promise<void> {
  try {
    await sendToSidePanel('TEXT_EDIT_UPDATE_STATS');
  } catch {
    console.error('Failed to update stats');
  }
}

/**
 * 도구 활성화 상태 변경
 */
export async function setToolActive(active: boolean): Promise<void> {
  try {
    const tabId = await getActiveTabId();
    if (tabId) {
      await sendToContentScript(tabId, 'TEXT_EDIT_TOGGLE', { active });
    }
  } catch {
    console.error('Failed to set tool active state');
  }
}
