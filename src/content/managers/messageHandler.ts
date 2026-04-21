/**
 * Message Handler
 *
 * 모든 도구의 메시지를 통합 처리
 */

import { ToolType } from '../../sidepanel/constants/tools';
import { overlayManager } from './overlayManager';
import { eventManager } from './eventListeners';

type MessageHandler = (data: unknown) => Promise<unknown> | unknown;

class IntegratedMessageHandler {
  private handlers = new Map<string, MessageHandler>();

  register(action: string, handler: MessageHandler) {
    this.handlers.set(action, handler);
  }

  registerTool(toolId: ToolType, handlers: Record<string, MessageHandler>) {
    Object.entries(handlers).forEach(([action, handler]) => {
      this.register(`${toolId.toUpperCase()}_${action}`, handler);
    });
  }

  async handleMessage(
    message: { action?: string; data?: unknown; toolId?: string }
  ): Promise<unknown> {
    const { action, data, toolId } = message;

    try {
      // PING for connection check
      if (action === 'PING') {
        return { success: true, message: 'PONG' };
      }

      // Tool Toggle
      if (action === 'TOGGLE_TOOL') {
        if (!toolId) return { success: false, error: 'toolId is required' };
        return await this.handleToggleTool(toolId as ToolType, data as { active: boolean });
      }

      // 도구별 메시지 처리
      if (toolId) {
        return await this.handleToolMessage(toolId as ToolType, action ?? '', data);
      }

      // 전역 메시지 처리
      return await this.handleGlobalMessage(action ?? '', data);
    } catch (error) {
      console.error('Message handling error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async handleToggleTool(toolId: ToolType, data: { active: boolean }) {
    const { active } = data;

    if (active) {
      eventManager.enable(toolId);
      overlayManager.show(toolId);
    } else {
      eventManager.disable(toolId);
      overlayManager.hide(toolId);
    }

    return { success: true, enabled: active };
  }

  private async handleToolMessage(toolId: ToolType, action: string, data: unknown) {
    const fullAction = `${toolId.toUpperCase()}_${action}`;

    switch (action) {
      case 'ENABLE':
        eventManager.enable(toolId);
        overlayManager.show(toolId);
        return { success: true };

      case 'DISABLE':
        eventManager.disable(toolId);
        overlayManager.hide(toolId);
        return { success: true };

      case 'TOGGLE': {
        const isEnabled = eventManager.isEnabled(toolId);
        if (isEnabled) {
          eventManager.disable(toolId);
          overlayManager.hide(toolId);
        } else {
          eventManager.enable(toolId);
          overlayManager.show(toolId);
        }
        return { success: true, enabled: !isEnabled };
      }

      default: {
        const handler = this.handlers.get(fullAction);
        if (handler) {
          return await handler(data);
        }
        return { success: false, error: 'Unknown action' };
      }
    }
  }

  private async handleGlobalMessage(action: string, data: unknown) {
    const handler = this.handlers.get(action);
    if (handler) {
      return await handler(data);
    }
    return { success: false, error: 'Unknown action' };
  }
}

export const messageHandler = new IntegratedMessageHandler();

// Chrome 메시지 리스너 등록
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const result = messageHandler.handleMessage(message);

  // 비동기 응답 처리
  if (result instanceof Promise) {
    result.then(sendResponse).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  return false;
});
