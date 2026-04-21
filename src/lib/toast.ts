import { toast } from 'sonner';
import { i18n } from '@/i18n/react';

/**
 * Show success toast with i18n support
 * @param key - Translation key
 * @param values - Optional values for interpolation
 * @example showSuccess('common.save')
 * @example showSuccess('app.activeCount', { count: 5 })
 */
export function showSuccess(key: string, values?: Record<string, unknown>) {
  toast.success(i18n.t(key, values));
}

/**
 * Show error toast with i18n support
 * @param key - Translation key
 * @param values - Optional values for interpolation
 */
export function showError(key: string, values?: Record<string, unknown>) {
  toast.error(i18n.t(key, values));
}

/**
 * Show info toast with i18n support
 * @param key - Translation key
 * @param values - Optional values for interpolation
 */
export function showInfo(key: string, values?: Record<string, unknown>) {
  toast.info(i18n.t(key, values));
}

/**
 * Show warning toast with i18n support
 * @param key - Translation key
 * @param values - Optional values for interpolation
 */
export function showWarning(key: string, values?: Record<string, unknown>) {
  toast.warning(i18n.t(key, values));
}

/**
 * Show loading toast with i18n support
 * @param key - Translation key
 * @param values - Optional values for interpolation
 * @returns Promise that resolves when toast is shown
 */
export function showLoading(key: string, values?: Record<string, unknown>) {
  return toast.loading(i18n.t(key, values));
}

/**
 * Dismiss a toast by ID
 * @param id - Toast ID to dismiss
 */
export function dismissToast(id: string | number) {
  toast.dismiss(id);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}
