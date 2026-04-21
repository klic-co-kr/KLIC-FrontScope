/**
 * Messaging Utilities
 *
 * Chrome Extension 메시지 통신을 위한 헬퍼 함수들
 */

import { type MessageAction } from '../constants/messages';

/**
 * 메시지 인터페이스
 */
export interface Message<T = unknown> {
  action: string | MessageAction;
  data?: T;
  target?: 'content' | 'sidepanel' | 'background' | 'all';
  timestamp: number;
  relay?: boolean;
}

/**
 * 메시지 응답 인터페이스
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 메시지 전송 (Runtime)
 */
export async function sendMessage<T = unknown, R = unknown>(
  action: string | MessageAction,
  data?: T,
  target?: string
): Promise<MessageResponse<R>> {
  const validTarget = target as 'content' | 'sidepanel' | 'background' | 'all' | undefined;
  const message: Message<T> = {
    action: typeof action === 'string' ? action : action,
    data,
    target: validTarget,
    timestamp: Date.now(),
    relay: !!target,
  };

  try {
    const response = await chrome.runtime.sendMessage(message);
    return response as MessageResponse<R>;
  } catch (error) {
    console.error('Send message error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 특정 탭에 메시지 전송
 */
export async function sendToTab<T = unknown, R = unknown>(
  tabId: number,
  action: string | MessageAction,
  data?: T
): Promise<MessageResponse<R>> {
  const message: Message<T> = {
    action: typeof action === 'string' ? action : action,
    data,
    timestamp: Date.now(),
  };

  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response as MessageResponse<R>;
  } catch (error) {
    console.error('Send to tab error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 활성 탭에 메시지 전송
 */
export async function sendToActiveTab<T = unknown, R = unknown>(
  action: string | MessageAction,
  data?: T
): Promise<MessageResponse<R>> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      return {
        success: false,
        error: 'No active tab found',
      };
    }

    return await sendToTab<T, R>(tab.id, action, data);
  } catch (error) {
    console.error('Send to active tab error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 모든 탭에 메시지 브로드캐스트
 */
export async function broadcastToAllTabs<T = unknown>(
  action: string | MessageAction,
  data?: T
): Promise<MessageResponse<void>[]> {
  try {
    const tabs = await chrome.tabs.query({});
    const results: MessageResponse<void>[] = [];

    for (const tab of tabs) {
      if (tab.id) {
        const response = await sendToTab<T, void>(tab.id, action, data);
        results.push(response);
      }
    }

    return results;
  } catch (error) {
    console.error('Broadcast error:', error);
    return [
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    ];
  }
}

/**
 * 메시지 리스너 등록
 */
export function onMessage<T = unknown>(
  action: string | MessageAction,
  handler: (data: T, sender?: chrome.runtime.MessageSender) => unknown | Promise<unknown>
): () => void {
  const actionStr = typeof action === 'string' ? action : action;

  const listener = (
    message: { action: string; data: T },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    if (message.action === actionStr) {
      const result = handler(message.data, sender);

      if (result instanceof Promise) {
        result
          .then(sendResponse)
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // 비동기 응답
      }

      sendResponse({ success: true, data: result });
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  // 정리 함수 반환
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * 메시지 훅 생성
 */
export function createMessageHook<T = unknown, R = unknown>(action: string | MessageAction) {
  return async (data?: T): Promise<MessageResponse<R>> => {
    return sendMessage<T, R>(action, data);
  };
}

/**
 * 탭별 메시지 훅 생성
 */
export function createTabMessageHook<T = unknown, R = unknown>(action: string | MessageAction) {
  return async (tabId: number, data?: T): Promise<MessageResponse<R>> => {
    return sendToTab<T, R>(tabId, action, data);
  };
}

/**
 * 일회용 메시지 리스너
 */
export function onceMessage<T = unknown>(
  action: string | MessageAction,
  handler: (data: T, sender?: chrome.runtime.MessageSender) => unknown | Promise<unknown>
): () => void {
  const cleanup = onMessage<T>(action, (data, sender) => {
    cleanup();
    return handler(data, sender);
  });

  return cleanup;
}

/**
 * 메시지 타임아웃 래퍼
 */
export function withMessageTimeout<T>(
  promise: Promise<MessageResponse<T>>,
  timeout = 5000
): Promise<MessageResponse<T>> {
  return Promise.race([
    promise,
    new Promise<MessageResponse<T>>((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: false,
            error: 'Message timeout',
          }),
        timeout
      )
    ),
  ]);
}

/**
 * 메시지 큐 (순차 처리)
 */
class MessageQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private processing = false;

  async add<T>(fn: () => Promise<MessageResponse<T>>): Promise<MessageResponse<T>> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }

    this.processing = false;
  }
}

export const messageQueue = new MessageQueue();
