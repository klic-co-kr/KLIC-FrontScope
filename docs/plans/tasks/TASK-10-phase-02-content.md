# Phase 2: 전체 통합 - Content Script 통합

**태스크 범위**: Task #10.9 ~ #10.16 (8개)
**예상 시간**: 4시간
**의존성**: 모든 도구 오버레이

---

## Task #10.9: 모든 오버레이 통합 관리자

- **파일**: `src/content/overlayManager.ts`
- **시간**: 45분
- **의존성**: 모든 도구 오버레이

```typescript
import { ToolType } from '../sidepanel/constants/tools';

interface OverlayManager {
  overlays: Map<ToolType, OverlayController>;
  zIndexes: Map<ToolType, number>;
  baseZIndex: number;
}

interface OverlayController {
  show: () => void;
  hide: () => void;
  isVisible: () => boolean;
  getZIndex: () => number;
  setZIndex: (zIndex: number) => void;
  destroy: () => void;
}

class OverlayManagerImpl implements OverlayManager {
  overlays = new Map<ToolType, OverlayController>();
  zIndexes = new Map<ToolType, number>();
  baseZIndex = 10000;

  register(toolId: ToolType, controller: OverlayController) {
    this.overlays.set(toolId, controller);
    this.zIndexes.set(toolId, this.baseZIndex + this.overlays.size);
  }

  unregister(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.destroy();
      this.overlays.delete(toolId);
      this.zIndexes.delete(toolId);
    }
  }

  show(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.show();
      this.bringToFront(toolId);
    }
  }

  hide(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.hide();
    }
  }

  hideAll() {
    this.overlays.forEach((controller, toolId) => {
      controller.hide();
    });
  }

  bringToFront(toolId: ToolType) {
    const maxZIndex = Math.max(...this.zIndexes.values());
    const newZIndex = maxZIndex + 1;

    this.zIndexes.set(toolId, newZIndex);

    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.setZIndex(newZIndex);
    }
  }

  sendToBack(toolId: ToolType) {
    const controller = this.overlays.get(toolId);
    if (controller) {
      controller.setZIndex(this.baseZIndex);
      this.zIndexes.set(toolId, this.baseZIndex);
    }
  }

  isVisible(toolId: ToolType): boolean {
    const controller = this.overlays.get(toolId);
    return controller ? controller.isVisible() : false;
  }

  getVisibleOverlays(): ToolType[] {
    return Array.from(this.overlays.entries())
      .filter(([_, controller]) => controller.isVisible())
      .map(([toolId, _]) => toolId);
  }

  destroyAll() {
    this.overlays.forEach((controller) => {
      controller.destroy();
    });
    this.overlays.clear();
    this.zIndexes.clear();
  }
}

export const overlayManager = new OverlayManagerImpl();
```

**완료 조건**: 모든 오버레이 충돌 없이 동작

---

## Task #10.10: 통합 이벤트 리스너

- **파일**: `src/content/eventListeners.ts`
- **시간**: 30분
- **의존성**: 모든 도구 이벤트

```typescript
import { ToolType } from '../sidepanel/constants/tools';
import { overlayManager } from './overlayManager';

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
        document.addEventListener(event, eventHandler);
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
        document.removeEventListener(event, eventHandler);
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
}

export const eventManager = new IntegratedEventManager();
```

**완료 조건**: 모든 이벤트 충돌 없이 동작

---

## Task #10.11: 통합 메시지 핸들러

- **파일**: `src/content/messageHandler.ts`
- **시간**: 30분
- **의존성**: 모든 도구 메시지 핸들러

```typescript
import { ToolType } from '../sidepanel/constants/tools';
import { MESSAGE_ACTIONS } from '../constants/messages';
import { overlayManager } from './overlayManager';
import { eventManager } from './eventListeners';

interface MessageHandler {
  (data: any): Promise<any> | any;
}

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
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    const { action, data, toolId } = message;

    try {
      // 도구별 메시지 처리
      if (toolId) {
        return await this.handleToolMessage(toolId, action, data);
      }

      // 전역 메시지 처리
      return await this.handleGlobalMessage(action, data);
    } catch (error) {
      console.error('Message handling error:', error);
      return { success: false, error: error.message };
    }
  }

  private async handleToolMessage(toolId: ToolType, action: string, data: any) {
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

      case 'TOGGLE':
        const isEnabled = eventManager.isEnabled(toolId);
        if (isEnabled) {
          eventManager.disable(toolId);
          overlayManager.hide(toolId);
        } else {
          eventManager.enable(toolId);
          overlayManager.show(toolId);
        }
        return { success: true, enabled: !isEnabled };

      default:
        const handler = this.handlers.get(fullAction);
        if (handler) {
          return await handler(data);
        }
        return { success: false, error: 'Unknown action' };
    }
  }

  private async handleGlobalMessage(action: string, data: any) {
    const handler = this.handlers.get(action);
    if (handler) {
      return await handler(data);
    }
    return { success: false, error: 'Unknown action' };
  }
}

export const messageHandler = new IntegratedMessageHandler();

// Chrome 메시지 리스너 등록
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const result = messageHandler.handleMessage(message, sender, sendResponse);

  // 비동기 응답 처리
  if (result instanceof Promise) {
    result.then(sendResponse).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  return false;
});
```

**완료 조건**: 모든 메시지 정상 처리

---

## Task #10.12: 통합 CSS 주입 시스템

- **파일**: `src/content/styles.ts`
- **시간**: 30분
- **의존성**: 모든 도구 스타일

```typescript
import { ToolType } from '../sidepanel/constants/tools';

interface StyleBundle {
  toolId: ToolType;
  styles: string;
  styleId: string;
  injected: boolean;
}

class StyleInjector {
  private bundles = new Map<ToolType, StyleBundle>();
  private shadowRoot: ShadowRoot | null = null;

  constructor() {
    this.createShadowRoot();
  }

  private createShadowRoot() {
    const host = document.createElement('div');
    host.id = 'klic-style-host';
    host.style.display = 'none';
    document.documentElement.appendChild(host);

    this.shadowRoot = host.attachShadow({ mode: 'open' });
  }

  register(toolId: ToolType, styles: string) {
    const styleId = `klic-${toolId}-styles`;

    this.bundles.set(toolId, {
      toolId,
      styles,
      styleId,
      injected: false,
    });
  }

  inject(toolId: ToolType) {
    const bundle = this.bundles.get(toolId);
    if (!bundle || bundle.injected) return;

    const style = document.createElement('style');
    style.id = bundle.styleId;
    style.textContent = bundle.styles;

    if (this.shadowRoot) {
      this.shadowRoot.appendChild(style);
    }

    bundle.injected = true;
  }

  injectAll() {
    this.bundles.forEach((_, toolId) => {
      this.inject(toolId);
    });
  }

  remove(toolId: ToolType) {
    const bundle = this.bundles.get(toolId);
    if (!bundle || !bundle.injected) return;

    const style = this.shadowRoot?.getElementById(bundle.styleId);
    if (style) {
      style.remove();
    }

    bundle.injected = false;
  }

  removeAll() {
    this.bundles.forEach((_, toolId) => {
      this.remove(toolId);
    });
  }

  update(toolId: ToolType, styles: string) {
    this.remove(toolId);

    const bundle = this.bundles.get(toolId);
    if (bundle) {
      bundle.styles = styles;
      this.inject(toolId);
    }
  }

  destroy() {
    this.removeAll();
    if (this.shadowRoot) {
      this.shadowRoot.host.remove();
      this.shadowRoot = null;
    }
  }
}

export const styleInjector = new StyleInjector();
```

**완료 조건**: 모든 스타일 충돌 없이 적용

---

## Task #10.13: Cleanup 로직 통합

- **파일**: `src/content/cleanup.ts`
- **시간**: 30분
- **의존성**: 모든 도구

```typescript
import { overlayManager } from './overlayManager';
import { eventManager } from './eventListeners';
import { styleInjector } from './styles';

class CleanupManager {
  private cleanupTasks = new Map<string, () => void>();

  register(taskId: string, cleanupFn: () => void) {
    this.cleanupTasks.set(taskId, cleanupFn);
  }

  unregister(taskId: string) {
    this.cleanupTasks.delete(taskId);
  }

  cleanup(toolId?: string) {
    if (toolId) {
      // 특정 도구만 cleanup
      const task = this.cleanupTasks.get(toolId);
      if (task) {
        task();
      }
    } else {
      // 모든 도구 cleanup
      this.cleanupTasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
    }
  }

  cleanupAll() {
    // 오버레이 정리
    overlayManager.destroyAll();

    // 이벤트 리스너 정리
    eventManager.destroy();

    // 스타일 정리
    styleInjector.destroy();

    // 등록된 cleanup 태스크 실행
    this.cleanup();

    // 맵 비우기
    this.cleanupTasks.clear();
  }

  destroy() {
    this.cleanupAll();
  }
}

export const cleanupManager = new CleanupManager();

// 페이지 언로드 시 자동 cleanup
window.addEventListener('beforeunload', () => {
  cleanupManager.destroy();
});

// 탭 변경 시 cleanup
chrome.tabs.onActivated.addListener(() => {
  cleanupManager.cleanupAll();
});
```

**완료 조건**: 모든 리소스 정확하게 정리

---

## Task #10.14: 충돌 방지 시스템

- **파일**: `src/content/conflictPrevention.ts`
- **시간**: 30분
- **의존성**: 모든 도구

```typescript
import { ToolType, isExclusiveTool } from '../sidepanel/constants/tools';

interface ConflictRule {
  tool1: ToolType;
  tool2: ToolType;
  resolution: 'disable1' | 'disable2' | 'coexist' | 'priority1' | 'priority2';
}

class ConflictPrevention {
  private rules: ConflictRule[] = [
    // 독점 도구들은 서로 충돌
    { tool1: 'textEdit', tool2: 'screenshot', resolution: 'priority1' },
    { tool1: 'textEdit', tool2: 'colorPicker', resolution: 'priority1' },
    // ... 나머지 충돌 규칙
  ];

  checkConflict(toolId: ToolType, activeTools: ToolType[]): {
    hasConflict: boolean;
    conflictingTools: ToolType[];
    resolution?: ConflictRule['resolution'];
  } {
    const conflicts: ConflictRule[] = [];

    for (const activeTool of activeTools) {
      if (activeTool === toolId) continue;

      const rule = this.findRule(toolId, activeTool);
      if (rule && rule.resolution !== 'coexist') {
        conflicts.push(rule);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictingTools: conflicts.map(c => c.tool1 === toolId ? c.tool2 : c.tool1),
      resolution: conflicts[0]?.resolution,
    };
  }

  private findRule(tool1: ToolType, tool2: ToolType): ConflictRule | undefined {
    return this.rules.find(rule =>
      (rule.tool1 === tool1 && rule.tool2 === tool2) ||
      (rule.tool1 === tool2 && rule.tool2 === tool1)
    );
  }

  resolveConflict(toolId: ToolType, activeTools: ToolType[]): ToolType[] {
    const conflict = this.checkConflict(toolId, activeTools);

    if (!conflict.hasConflict) {
      return activeTools;
    }

    const toDisable: ToolType[] = [];

    switch (conflict.resolution) {
      case 'disable1':
        toDisable.push(conflict.conflictingTools[0]);
        break;
      case 'disable2':
        toDisable.push(toolId);
        break;
      case 'priority1':
        if (conflict.conflictingTools.includes(toolId)) {
          toDisable.push(...conflict.conflictingTools.filter(t => t !== toolId));
        } else {
          toDisable.push(...conflict.conflictingTools);
        }
        break;
      case 'priority2':
        // tool2 우선
        break;
    }

    return activeTools.filter(tool => !toDisable.includes(tool));
  }

  canCoexist(tool1: ToolType, tool2: ToolType): boolean {
    // 독점 도구들은 공존 불가
    if (isExclusiveTool(tool1) && isExclusiveTool(tool2)) {
      return false;
    }

    const rule = this.findRule(tool1, tool2);
    return rule?.resolution === 'coexist' || !rule;
  }
}

export const conflictPrevention = new ConflictPrevention();
```

**완료 조건**: 모든 충돌 상황 적절히 처리

---

## Task #10.15: 전역 단축키 관리자

- **파일**: `src/content/shortcuts.ts`
- **시간**: 30분
- **의존성**: 모든 도구

```typescript
import { ToolType } from '../sidepanel/constants/tools';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  toolId?: ToolType;
  enabled: boolean;
}

class ShortcutManager {
  private shortcuts = new Map<string, Shortcut>();

  register(shortcut: Omit<Shortcut, 'enabled'>) {
    const key = this.formatKey(shortcut);
    this.shortcuts.set(key, { ...shortcut, enabled: true });
  }

  unregister(key: string) {
    this.shortcuts.delete(key);
  }

  enable(toolId: ToolType) {
    this.shortcuts.forEach((shortcut) => {
      if (shortcut.toolId === toolId) {
        shortcut.enabled = true;
      }
    });
  }

  disable(toolId: ToolType) {
    this.shortcuts.forEach((shortcut) => {
      if (shortcut.toolId === toolId) {
        shortcut.enabled = false;
      }
    });
  }

  handleKeyPress(event: KeyboardEvent) {
    const key = this.formatEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut && shortcut.enabled) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  private formatKey(shortcut: Omit<Shortcut, 'enabled'>): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');

    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  private formatEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  destroy() {
    this.shortcuts.clear();
  }
}

export const shortcutManager = new ShortcutManager();

// 전역 키보드 이벤트 리스너
document.addEventListener('keydown', (event) => {
  shortcutManager.handleKeyPress(event);
}, true);
```

**완료 조건**: 모든 단축키 정상 동작

---

## Task #10.16: Z-index 관리자

- **파일**: `src/content/zIndexManager.ts`
- **시간**: 15분
- **의존성**: 없음

```typescript
import { ToolType } from '../sidepanel/constants/tools';

class ZIndexManager {
  private baseZIndex = 10000;
  private zIndexes = new Map<ToolType, number>();
  private currentZIndex = this.baseZIndex;

  getZIndex(toolId: ToolType): number {
    return this.zIndexes.get(toolId) ?? this.baseZIndex;
  }

  setZIndex(toolId: ToolType, zIndex?: number): number {
    const newZIndex = zIndex ?? ++this.currentZIndex;
    this.zIndexes.set(toolId, newZIndex);
    return newZIndex;
  }

  bringToFront(toolId: ToolType): number {
    return this.setZIndex(toolId);
  }

  sendToBack(toolId: ToolType): number {
    const zIndex = this.baseZIndex;
    this.zIndexes.set(toolId, zIndex);
    return zIndex;
  }

  reset() {
    this.zIndexes.clear();
    this.currentZIndex = this.baseZIndex;
  }

  getHighestZIndex(): number {
    return Math.max(0, ...Array.from(this.zIndexes.values()));
  }

  getLowestZIndex(): number {
    const values = Array.from(this.zIndexes.values());
    return values.length > 0 ? Math.min(...values) : this.baseZIndex;
  }
}

export const zIndexManager = new ZIndexManager();
```

**완료 조건**: 모든 요소 올바른 z-index

---

**완료 후 다음 단계**: [Phase 3: Background Script](./TASK-10-phase-03-background.md)
