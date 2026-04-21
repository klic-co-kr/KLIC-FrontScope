# Phase 4: 전체 통합 - 공통 유틸리티

**태스크 범위**: Task #10.21 ~ #10.25 (5개)
**예상 시간**: 2시간
**의존성**: 없음

---

## Task #10.21: Toast 알림 시스템

- **파일**: `src/utils/toast.tsx`
- **시간**: 30분
- **의존성**: 없음

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => void;
  hide: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // 자동 제거
    const duration = toast.duration ?? 3000;
    setTimeout(() => {
      hide(id);
    }, duration);
  }, []);

  const hide = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, show, hide, clear }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { hide } = useToast();

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && (
          <div className="toast-message">{toast.message}</div>
        )}
      </div>
      <button
        className="toast-close"
        onClick={() => hide(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

// 유틸리티 함수
export function toast(type: ToastType, title: string, message?: string) {
  // 글로벌 인스턴스에서 show 호출 (구현 필요)
}
```

**완료 조건**: 모든 토스트 정상 표시/제거

---

## Task #10.22: Storage 헬퍼

- **파일**: `src/utils/storage.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
import { STORAGE_KEYS } from '../constants/storage';

export async function getStorage<T = any>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  } catch (error) {
    console.error(`Failed to get storage key "${key}":`, error);
    return null;
  }
}

export async function setStorage<T = any>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Failed to set storage key "${key}":`, error);
    return false;
  }
}

export async function removeStorage(key: string): Promise<boolean> {
  try {
    await chrome.storage.local.remove(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove storage key "${key}":`, error);
    return false;
  }
}

export async function clearStorage(): Promise<boolean> {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
}

export async function getMultipleStorage<T = any>(keys: string[]): Promise<Record<string, T>> {
  try {
    const result = await chrome.storage.local.get(keys);
    return result;
  } catch (error) {
    console.error('Failed to get multiple storage keys:', error);
    return {};
  }
}

export async function setMultipleStorage<T = any>(
  items: Record<string, T>
): Promise<boolean> {
  try {
    await chrome.storage.local.set(items);
    return true;
  } catch (error) {
    console.error('Failed to set multiple storage keys:', error);
    return false;
  }
}

export async function getStorageSize(): Promise<number> {
  try {
    const allData = await chrome.storage.local.get(null);
    const json = JSON.stringify(allData);
    return new Blob([json]).size;
  } catch (error) {
    console.error('Failed to get storage size:', error);
    return 0;
  }
}

export function createStorageHook<T>(key: string, defaultValue: T) {
  return async function(): Promise<T> {
    const value = await getStorage<T>(key);
    return value ?? defaultValue;
  };
}
```

**완료 조건**: 모든 Storage 작업 정상 동작

---

## Task #10.23: 메시지 통신 유틸리티

- **파일**: `src/utils/messaging.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
import { MESSAGE_ACTIONS } from '../constants/messages';

interface Message<T = any> {
  action: string;
  data?: T;
  target?: 'content' | 'sidepanel' | 'background';
  timestamp: number;
}

interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function sendMessage<T = any, R = any>(
  action: string,
  data?: T,
  target?: string
): Promise<MessageResponse<R>> {
  const message: Message<T> = {
    action,
    data,
    target,
    timestamp: Date.now(),
  };

  try {
    const response = await chrome.runtime.sendMessage(message);
    return response;
  } catch (error) {
    console.error('Send message error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendToTab<T = any, R = any>(
  tabId: number,
  action: string,
  data?: T
): Promise<MessageResponse<R>> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action, data });
    return response;
  } catch (error) {
    console.error('Send to tab error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function onMessage<T = any>(
  action: string,
  handler: (data: T) => any | Promise<any>
): () => void {
  const listener = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    if (message.action === action) {
      const result = handler(message.data);

      if (result instanceof Promise) {
        result.then(sendResponse).catch((error) => {
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

export function createMessageHook<T = any, R = any>(action: string) {
  return async (data?: T): Promise<MessageResponse<R>> => {
    return sendMessage<T, R>(action, data);
  };
}
```

**완료 조건**: 모든 메시지 정상 송수신

---

## Task #10.24: CSS 유틸리티

- **파일**: `src/utils/css.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
export function injectCSS(styles: string, id?: string): HTMLStyleElement {
  const style = document.createElement('style');

  if (id) {
    style.id = id;

    // 이미 존재하면 제거
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }

  style.textContent = styles;
  document.head.appendChild(style);

  return style;
}

export function removeCSS(id: string): boolean {
  const style = document.getElementById(id);
  if (style) {
    style.remove();
    return true;
  }
  return false;
}

export function updateCSS(id: string, styles: string): boolean {
  const style = document.getElementById(id) as HTMLStyleElement;
  if (style) {
    style.textContent = styles;
    return true;
  }
  return false;
}

export function hasCSS(id: string): boolean {
  return !!document.getElementById(id);
}

export function createClassName(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function applyStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.assign(element.style, styles);
}

export function getComputedStyles(
  element: HTMLElement,
  properties: string[]
): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const result: Record<string, string> = {};

  properties.forEach(prop => {
    result[prop] = computed.getPropertyValue(prop);
  });

  return result;
}

export function parseColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} | null {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

  return { r, g, b, a: a / 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
```

**완료 조건**: 모든 CSS 유틸리티 정상 동작

---

## Task #10.25: 에러 처리 통합

- **파일**: `src/utils/errorHandler.ts`
- **시간**: 30분
- **의존성**: Task #10.21

```typescript
import { KlicError, ERROR_MESSAGES } from '../constants/errors';

export class ErrorHandler {
  static handle(error: unknown, context?: string): void {
    console.error('[ErrorHandler]', context, error);

    if (error instanceof KlicError) {
      this.showUserError(error);
    } else if (error instanceof Error) {
      this.showGenericError(error);
    } else {
      this.showUnknownError(error);
    }
  }

  static async wrap<T>(
    fn: () => T | Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  private static showUserError(error: KlicError): void {
    // Toast로 에러 표시
    showToast('error', error.code, error.message);
  }

  private static showGenericError(error: Error): void {
    showToast('error', '오류', error.message);
  }

  private static showUnknownError(error: unknown): void {
    showToast('error', '알 수 없는 오류', '문제가 발생했습니다.');
  }
}

// Toast 표시 함수 (구현 필요)
function showToast(type: string, title: string, message: string) {
  // Toast 시스템 호출
}

export function withErrorHandling<T>(
  fn: () => T | Promise<T>,
  context?: string
): Promise<T | null> {
  return ErrorHandler.wrap(fn, context);
}

export function createErrorHandler(context: string) {
  return (error: unknown) => ErrorHandler.handle(error, context);
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isKlicError(error: unknown): error is KlicError {
  return error instanceof KlicError;
}
```

**완료 조건**: 모든 에러 적절하게 처리 및 표시

---

**완료 후 다음 단계**: [Phase 5: 테스트 및 최적화](./TASK-10-phase-05-testing.md)
