/**
 * Message Relay System
 *
 * Content Script <-> Side Panel <-> Background 간 메시지 중계
 */

interface MessageRelayTarget {
  from: 'content' | 'sidepanel' | 'background';
  to: 'content' | 'sidepanel' | 'background' | 'all';
  message: unknown;
}

interface RelayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RelayData {
  responseChannel: string;
  response: { success: boolean; data?: unknown; error?: string };
}

/**
 * Message Relay System
 *
 * 다양한 컨텍스트 간 메시지 전달을 처리
 */
class MessageRelaySystem {
  private messageQueue = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private RESPONSE_TIMEOUT = 5000;

  constructor() {
    this.setupStorageListener();
  }

  /**
   * Storage를 통한 Side Panel 통신 리스너 설정
   */
  private setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes._relay) {
        const { newValue } = changes._relay;
        if (
          newValue !== null &&
          typeof newValue === 'object' &&
          'responseChannel' in newValue &&
          'response' in newValue &&
          typeof (newValue as Record<string, unknown>).responseChannel === 'string'
        ) {
          this.handleRelayResponse(newValue as RelayData);
        }
      }
    });
  }

  /**
   * 릴레이 응답 처리
   */
  private handleRelayResponse(data: RelayData) {
    const { responseChannel, response } = data;
    const pending = this.messageQueue.get(responseChannel);

    if (pending) {
      clearTimeout(pending.timeout);
      this.messageQueue.delete(responseChannel);

      if (response.success) {
        pending.resolve(response.data);
      } else {
        pending.reject(new Error(response.error || 'Relay failed'));
      }
    }
  }

  /**
   * Content Script로 메시지 전송
   */
  async sendToContentScript<T = unknown>(
    tabId: number,
    action: string,
    data?: unknown
  ): Promise<RelayResponse<T>> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action, data });
      return { success: true, data: response as T };
    } catch (error) {
      console.error('Send to content script error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 모든 탭의 Content Script로 메시지 브로드캐스트
   */
  async broadcastToContentScripts<T = unknown>(
    action: string,
    data?: unknown
  ): Promise<RelayResponse<T>[]> {
    const tabs = await chrome.tabs.query({});
    const results: RelayResponse<T>[] = [];

    for (const tab of tabs) {
      if (tab.id) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action, data });
          results.push({ success: true, data: response as T });
        } catch (error) {
          // 일부 탭은 Content Script가 주입되지 않을 수 있음
          console.debug(`Failed to send to tab ${tab.id}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Side Panel로 메시지 전송 (Storage 기반)
   */
  async sendToSidePanel<T = unknown>(
    action: string,
    data?: unknown
  ): Promise<RelayResponse<T>> {
    const responseChannel = `relay-${Date.now()}-${Math.random()}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageQueue.delete(responseChannel);
        reject(new Error('Side panel timeout'));
      }, this.RESPONSE_TIMEOUT);

      this.messageQueue.set(responseChannel, { resolve: resolve as (value: unknown) => void, reject, timeout });

      // Storage를 통해 신호 전송
      chrome.storage.local.set({
        _relay: {
          action,
          data,
          responseChannel,
          timestamp: Date.now(),
        },
      });
    });
  }

  /**
   * 메시지 라우팅
   */
  async routeMessage(target: MessageRelayTarget['to'], action: string, data?: unknown, tabId?: number): Promise<RelayResponse<unknown> | { success: boolean; error: string }> {
    switch (target) {
      case 'content':
        if (!tabId) {
          throw new Error('Tab ID required for content script messaging');
        }
        return await this.sendToContentScript(tabId, action, data);

      case 'sidepanel':
        return await this.sendToSidePanel(action, data);

      case 'all':
        return { success: true, data: await this.broadcastToContentScripts(action, data) } as RelayResponse<unknown>;

      case 'background':
        // Background에서 처리할 메시지는 별도 핸들러로 전달
        return { success: false, error: 'Use background handlers directly' };

      default:
        return { success: false, error: 'Unknown target' };
    }
  }

  /**
   * 특정 탭에서 메시지를 보내고 응답 대기
   */
  async sendAndReceive<T = unknown>(
    tabId: number,
    message: { action: string; data?: unknown }
  ): Promise<RelayResponse<T>> {
    return await this.sendToContentScript<T>(tabId, message.action, message.data);
  }

  /**
   * 활성 탭에 메시지 전송
   */
  async sendToActiveTab<T = unknown>(
    action: string,
    data?: unknown
  ): Promise<RelayResponse<T>> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      return {
        success: false,
        error: 'No active tab found',
      };
    }

    return await this.sendToContentScript<T>(tab.id, action, data);
  }
}

export const messageRelay = new MessageRelaySystem();

interface RelayMessage {
  action?: string;
  data?: unknown;
  target?: string;
  relay?: boolean;
}

/**
 * Chrome 메시지 리스너 (Background Script용)
 *
 * Content Script나 Side Panel에서 보낸 메시지를 처리하고
 * 필요한 경우 다른 컨텍스트로 중계
 */
export function setupMessageRelayListener() {
  chrome.runtime.onMessage.addListener((message: RelayMessage, sender, sendResponse) => {
    const { action, relay } = message;

    // 메시지 중계 요청
    if (relay) {
      handleRelayMessage(message, sender)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // 비동기 응답
    }

    // Side Panel로부터의 릴레이 응답 처리
    if (action === '_RELAY_RESPONSE') {
      handleRelayResponseFromSidePanel();
      return false;
    }

    return false; // 다른 리스너에게 위임
  });
}

/**
 * 메시지 중계 처리
 */
async function handleRelayMessage(
  message: RelayMessage,
  sender: chrome.runtime.MessageSender
): Promise<RelayResponse<unknown> | { success: boolean; error: string }> {
  const { target, action, data } = message;

  if (target === 'sidepanel') {
    // Side Panel으로 전송
    return await messageRelay.sendToSidePanel(action || '', data);
  }

  if (target === 'content') {
    // Content Script로 전송
    if (sender.tab?.id) {
      return await messageRelay.sendToContentScript(sender.tab.id, action || '', data);
    }
  }

  if (target === 'all') {
    // 모든 Content Script로 브로드캐스트
    return { success: true, data: await messageRelay.broadcastToContentScripts(action || '', data) } as RelayResponse<unknown>;
  }

  return { success: false, error: 'Invalid relay target' };
}

/**
 * Side Panel 응답 처리
 */
function handleRelayResponseFromSidePanel() {
  // Storage 리스너가 처리하므로 여기서는 아무것도 하지 않음
  // Storage 변화를 통해 응답이 전달됨
}
