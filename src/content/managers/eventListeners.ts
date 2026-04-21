/**
 * Event Listeners Manager
 *
 * 모든 도구의 이벤트 리스너를 중앙 관리하고 충돌 방지
 */

import { ToolType } from '../../sidepanel/constants/tools';

interface ToolEventHandler {
  toolId: ToolType;
  events: string[];
  handlers: Map<string, EventListener>;
  enabled: boolean;
}

class IntegratedEventManager {
  private toolHandlers = new Map<ToolType, ToolEventHandler>();

  register(toolId: ToolType, events: string[], handlers: Record<string, EventListener>) {
    const handlerMap = new Map(Object.entries(handlers));

    this.toolHandlers.set(toolId, {
      toolId,
      events,
      handlers: handlerMap,
      enabled: false,
    });
  }

  enable(toolId: ToolType) {
    const handler = this.toolHandlers.get(toolId);
    if (!handler || handler.enabled) return;

    handler.events.forEach((event) => {
      const eventHandler = handler.handlers.get(event);
      if (eventHandler) {
        document.addEventListener(event, eventHandler, true);
      }
    });

    handler.enabled = true;
  }

  disable(toolId: ToolType) {
    const handler = this.toolHandlers.get(toolId);
    if (!handler || !handler.enabled) return;

    handler.events.forEach((event) => {
      const eventHandler = handler.handlers.get(event);
      if (eventHandler) {
        document.removeEventListener(event, eventHandler, true);
      }
    });

    handler.enabled = false;
  }

  enableAll() {
    this.toolHandlers.forEach((_, toolId) => {
      this.enable(toolId);
    });
  }

  disableAll() {
    this.toolHandlers.forEach((_, toolId) => {
      this.disable(toolId);
    });
  }

  isEnabled(toolId: ToolType): boolean {
    const handler = this.toolHandlers.get(toolId);
    return handler ? handler.enabled : false;
  }

  destroy() {
    this.disableAll();
    this.toolHandlers.clear();
  }

  getEnabledTools(): ToolType[] {
    return Array.from(this.toolHandlers.entries())
      .filter(([, handler]) => handler.enabled)
      .map(([toolId]) => toolId);
  }
}

export const eventManager = new IntegratedEventManager();
