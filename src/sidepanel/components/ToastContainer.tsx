import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // 자동 제거
    const duration = toast.duration ?? 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
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
      <ToastContainerInternal />
    </ToastContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastContainer() {
  return <ToastContainerInternal />;
}

function ToastContainerInternal() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-500 border-green-600 text-white',
  error: 'bg-red-500 border-red-600 text-white',
  warning: 'bg-amber-500 border-amber-600 text-white',
  info: 'bg-blue-500 border-blue-600 text-white',
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { hide } = useToast();

  return (
    <div
      className={`toast pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-bottom-4 duration-300 ${TOAST_STYLES[toast.type]}`}
    >
      <span className="text-lg">{TOAST_ICONS[toast.type]}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{toast.title}</div>
        {toast.message && (
          <div className="text-sm opacity-90 mt-0.5">{toast.message}</div>
        )}
      </div>
      <button
        onClick={() => hide(toast.id)}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Convenience functions for showing toasts
 */
export const toast = {
  success: (title: string, message?: string /* duration?: number */) => {
    // This would be used with the global toast instance
    console.log('[Toast Success]', title, message);
  },
  error: (title: string, message?: string /* duration?: number */) => {
    console.error('[Toast Error]', title, message);
  },
  warning: (title: string, message?: string /* duration?: number */) => {
    console.warn('[Toast Warning]', title, message);
  },
  info: (title: string, message?: string /* duration?: number */) => {
    console.info('[Toast Info]', title, message);
  },
};
/* eslint-enable react-refresh/only-export-components */