import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const CHUNK_LOAD_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
];

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => lowered.includes(pattern.toLowerCase()));
}

export function lazyWithRetry<TProps>(
  importer: () => Promise<{ default: ComponentType<TProps> }>,
  retryKey: string,
): LazyExoticComponent<ComponentType<TProps>> {
  return lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(retryKey);
      return module;
    } catch (error) {
      const hasRetried = sessionStorage.getItem(retryKey) === '1';

      if (!hasRetried && isChunkLoadError(error)) {
        sessionStorage.setItem(retryKey, '1');
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.reload === 'function') {
          chrome.runtime.reload();
        } else {
          window.location.reload();
        }
        throw error;
      }

      sessionStorage.removeItem(retryKey);
      throw error;
    }
  });
}
