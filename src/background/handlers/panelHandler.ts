/**
 * Panel Handler
 *
 * Side Panel 열기/닫기 관련 기능 처리
 */

/**
 * Side Panel 열기
 */
export async function openSidePanel(): Promise<boolean> {
  try {
    // 현재 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      console.warn('No active tab found');
      return false;
    }

    // Side Panel 오픈
    await chrome.sidePanel.open({ tabId: tab.id });

    // Content Script 주입 확인
    await ensureContentScriptInjected(tab.id);

    return true;
  } catch (error) {
    console.error('Failed to open side panel:', error);
    return false;
  }
}

/**
 * Content Script가 주입되었는지 확인하고 필요시 주입
 */
async function ensureContentScriptInjected(tabId: number): Promise<void> {
  try {
    // PING 메시지로 Content Script 확인
    await chrome.tabs.sendMessage(tabId, { action: 'PING' });
  } catch {
    // Content Script가 주입되지 않은 경우 주입
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['assets/content.js'],
      });
      console.log('Content script injected for tab:', tabId);
    } catch (injectError) {
      console.warn('Could not inject content script:', injectError);
    }
  }
}

/**
 * 현재 포커스된 탭에 Side Panel 열기
 */
export async function openSidePanelInCurrentWindow(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      return false;
    }

    await chrome.sidePanel.open({ tabId: tab.id });
    await ensureContentScriptInjected(tab.id);

    return true;
  } catch (error) {
    console.error('Failed to open side panel in current window:', error);
    return false;
  }
}

/**
 * Side Panel 토글 (열기만 가능 - Chrome API 제약)
 *
 * Note: Chrome Extension API는 Side Panel을 프로그래밍으로 닫는 기능을 제공하지 않음
 * 따라서 toggle은 항상 열기 시도로 동작
 */
export async function toggleSidePanel(): Promise<boolean> {
  return await openSidePanel();
}

/**
 * 특정 탭에 Side Panel 열기
 */
export async function openSidePanelForTab(tabId: number): Promise<boolean> {
  try {
    await chrome.sidePanel.open({ tabId });
    await ensureContentScriptInjected(tabId);
    return true;
  } catch (error) {
    console.error(`Failed to open side panel for tab ${tabId}:`, error);
    return false;
  }
}

/**
 * Side Panel 동작 설정 (Action 클릭 시 열림)
 */
export async function setPanelBehavior(): Promise<void> {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error('Failed to set panel behavior:', error);
  }
}

/**
 * Panel Handler 등록
 */
export function registerPanelHandlers() {
  // Action 아이콘 클릭 시 Side Panel 열기 (설정됨)
  setPanelBehavior();

  // 커맨드 (Ctrl+Shift+K 등) - manifest.json에 commands 설정 필요
  if (chrome.commands) {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === 'open-side-panel') {
        await openSidePanel();
      }
    });
  }
}

// 내보내기 for testing
export { ensureContentScriptInjected };
