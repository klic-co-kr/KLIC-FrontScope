/**
 * Grid Layout Message Sender
 *
 * Content script에 그리드 레이아웃 관련 메시지를 전송하는 유틸리티
 * Content script는 { action, payload } 형식을 기대합니다.
 */

async function getActiveTabId(): Promise<number | null> {
  try {
    const currentWindow = await chrome.windows.getCurrent();
    const [tab] = await chrome.tabs.query({
      active: true,
      windowId: currentWindow.id,
    });
    return tab?.id ?? null;
  } catch {
    return null;
  }
}

export async function sendGridMessage<T = unknown>(
  action: string,
  payload?: T
): Promise<void> {
  const tabId = await getActiveTabId();
  if (!tabId) return;

  try {
    await chrome.tabs.sendMessage(tabId, { action, payload });
  } catch {
    // Content script may not be loaded yet
  }
}

/**
 * 여러 메시지를 배치로 전송 (탭 ID를 한 번만 조회)
 */
export async function sendGridMessages(
  messages: Array<{ action: string; payload?: unknown }>
): Promise<void> {
  if (messages.length === 0) return;

  const tabId = await getActiveTabId();
  if (!tabId) return;

  await Promise.allSettled(
    messages.map(({ action, payload }) =>
      chrome.tabs.sendMessage(tabId, { action, payload })
    )
  );
}
