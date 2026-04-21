import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

type RuntimeMessage = {
  action: string;
  tool?: string;
  nonce?: string;
  tabId?: number;
  data?: unknown;
};

type IncomingMessageResult = {
  success: boolean;
  response?: unknown;
  via?: 'sync' | 'sendResponse' | 'timeout';
  listenerCount?: number;
  error?: string;
};

const contentScriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist/assets/content.js'
);

const TEST_TIMEOUT_MS = 75;
const MODAL_ROOT_ID = 'klic-context-menu-modal';
const MODAL_IFRAME_ID = 'klic-context-menu-modal-frame';
const MODAL_CONTAINER_ID = 'klic-context-menu-modal-container';
const MODAL_MINIMIZE_ID = 'klic-context-menu-modal-minimize';
const MODAL_CLOSE_ID = 'klic-context-menu-modal-close';
const MODAL_MINIMIZED_ID = 'klic-context-menu-modal-minimized';
const MODAL_READY_TYPE = 'klic:modal-ready';
const MODAL_CLOSE_REQUEST_TYPE = 'klic:modal-close-request';

const EVIDENCE_DIR = path.resolve(process.cwd(), '.sisyphus/evidence');
const FINAL_QA_DIR = path.resolve(EVIDENCE_DIR, 'final-qa');

async function captureEvidence(page: Page, fileName: string): Promise<void> {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const primaryPath = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: primaryPath });
  await fs.mkdir(FINAL_QA_DIR, { recursive: true });
  await fs.copyFile(primaryPath, path.join(FINAL_QA_DIR, fileName));
}

async function loadContentScript(page: Page) {
  await page.goto('https://example.com');
  await page.addScriptTag({ path: contentScriptPath });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const win = window as Window & {
          __klicChromeMock?: {
            getListenerCount: () => number;
          };
        };
        return win.__klicChromeMock?.getListenerCount() ?? 0;
      });
    })
    .toBeGreaterThan(0);
}

async function simulateRuntimeMessage(
  page: Page,
  payload: RuntimeMessage,
  timeoutMs = TEST_TIMEOUT_MS
): Promise<IncomingMessageResult> {
  return page.evaluate(
    async ({ message, waitMs }) => {
      const win = window as Window & {
        __klicChromeMock?: {
          dispatchIncomingMessage: (request: RuntimeMessage, timeout: number) => Promise<IncomingMessageResult>;
        };
      };

      if (!win.__klicChromeMock) {
        throw new Error('Chrome mock is not initialized');
      }

      return win.__klicChromeMock.dispatchIncomingMessage(message, waitMs);
    },
    { message: payload, waitMs: timeoutMs }
  );
}

async function openModalAndResolveReady(
  page: Page,
  payload: RuntimeMessage,
  timeoutMs = 600
): Promise<IncomingMessageResult> {
  if (!payload.nonce) {
    throw new Error('Expected nonce for modal open test message');
  }

  const openPromise = simulateRuntimeMessage(page, payload, timeoutMs);

  await expect
    .poll(async () => {
      return page.evaluate((iframeId) => {
        return document.getElementById(iframeId) !== null;
      }, MODAL_IFRAME_ID);
    })
    .toBeTruthy();

  const dispatched = await page.evaluate(
    ({ iframeId, nonce, type }) => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      if (!iframe?.contentWindow) {
        return false;
      }

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type, nonce },
          origin: window.location.origin,
          source: iframe.contentWindow,
        })
      );

      return true;
    },
    { iframeId: MODAL_IFRAME_ID, nonce: payload.nonce, type: MODAL_READY_TYPE }
  );

  expect(dispatched).toBeTruthy();

  return openPromise;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type RuntimeRequest = {
      action?: string;
      tool?: string;
      active?: boolean;
      data?: unknown;
      nonce?: string;
      tabId?: number;
    };

    type RuntimeMessage = {
      action: string;
      tool?: string;
      nonce?: string;
      tabId?: number;
      data?: unknown;
    };

    type RuntimeSender = {
      id?: string;
      tab?: {
        id?: number;
      };
    };

    type RuntimeListener = (
      request: RuntimeMessage,
      sender: RuntimeSender,
      sendResponse: (response?: unknown) => void
    ) => boolean | void;

    interface MockRuntime {
      id: string;
      sendMessage(request: RuntimeRequest, callback?: (response: unknown) => void): boolean | void;
      onMessage: {
        addListener(listener: RuntimeListener): void;
        removeListener(listener: RuntimeListener): void;
      };
      getURL(assetPath: string): string;
    }

    interface MockStorageArea {
      set(items: Record<string, unknown>, callback?: () => void): void;
      get(
        keys: string | string[] | Record<string, unknown> | null | undefined,
        callback: (result: Record<string, unknown>) => void
      ): void;
    }

    interface MockStorageOnChanged {
      addListener(listener: (...args: unknown[]) => void): void;
      removeListener(listener: (...args: unknown[]) => void): void;
    }

    interface WindowWithChromeMock extends Window {
      __klicChromeMockInitialized?: boolean;
      __klicChromeMock?: {
        dispatchIncomingMessage(request: RuntimeMessage, timeoutMs?: number): Promise<{
          success: boolean;
          response?: unknown;
          via?: 'sync' | 'sendResponse' | 'timeout';
          listenerCount: number;
          error?: string;
        }>;
        getListenerCount(): number;
      };
    }

    const win = window as WindowWithChromeMock;

    if (win.__klicChromeMockInitialized) {
      return;
    }

    win.__klicChromeMockInitialized = true;

    const listeners = new Set<RuntimeListener>();
    const localState: Record<string, unknown> = {};
    const sessionState: Record<string, unknown> = {};

    const makeStorageArea = (state: Record<string, unknown>): MockStorageArea => ({
      set(items, callback) {
        for (const [key, value] of Object.entries(items)) {
          state[key] = value;
        }
        callback?.();
      },
      get(keys, callback) {
        if (keys == null) {
          callback({ ...state });
          return;
        }

        if (typeof keys === 'string') {
          callback({ [keys]: state[keys] });
          return;
        }

        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            result[key] = state[key];
          }
          callback(result);
          return;
        }

        const result: Record<string, unknown> = {};
        for (const [key, fallback] of Object.entries(keys)) {
          result[key] = key in state ? state[key] : fallback;
        }
        callback(result);
      },
    });

    const dispatchIncomingMessage = (request: RuntimeMessage, timeoutMs = 500) => {
      return new Promise<{
        success: boolean;
        response?: unknown;
        via?: 'sync' | 'sendResponse' | 'timeout';
        listenerCount: number;
        error?: string;
      }>((resolve) => {
        let settled = false;
        const timeoutRef: { id?: number } = {};

        const finish = (result: {
          success: boolean;
          response?: unknown;
          via?: 'sync' | 'sendResponse' | 'timeout';
          listenerCount: number;
          error?: string;
        }) => {
          if (settled) {
            return;
          }
          settled = true;
          if (timeoutRef.id !== undefined) {
            window.clearTimeout(timeoutRef.id);
          }
          resolve(result);
        };

        const sender: RuntimeSender = {
          id: 'mock-extension-id',
          tab: { id: request.tabId },
        };

        const sendResponse = (response?: unknown) => {
          finish({
            success: true,
            response,
            via: 'sendResponse',
            listenerCount: listeners.size,
          });
        };

        let hasAsyncListener = false;
        try {
          for (const listener of listeners) {
            const keepChannelOpen = listener(request, sender, sendResponse);
            if (keepChannelOpen === true) {
              hasAsyncListener = true;
            }
          }
        } catch (error) {
          finish({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            listenerCount: listeners.size,
          });
          return;
        }

        if (!hasAsyncListener) {
          finish({
            success: true,
            via: 'sync',
            listenerCount: listeners.size,
          });
          return;
        }

        timeoutRef.id = window.setTimeout(() => {
          finish({
            success: true,
            via: 'timeout',
            listenerCount: listeners.size,
          });
        }, timeoutMs);
      });
    };

    const runtime: MockRuntime = {
      id: 'mock-extension-id',
      sendMessage(request, callback) {
        if (request.action === 'SIMULATE_INCOMING_MESSAGE') {
          dispatchIncomingMessage(request.data as RuntimeMessage).then((result) => {
            callback?.(result);
          });
          return true;
        }

        callback?.({ success: true });
      },
      onMessage: {
        addListener(listener: RuntimeListener) {
          listeners.add(listener);
        },
        removeListener(listener: RuntimeListener) {
          listeners.delete(listener);
        },
      },
      getURL(assetPath: string) {
        const normalizedPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
        return `${window.location.origin}/${normalizedPath}`;
      },
    };

    const existingChrome = win.chrome as unknown as {
      runtime?: MockRuntime;
      storage?: {
        local?: MockStorageArea;
        session?: MockStorageArea;
        onChanged?: MockStorageOnChanged;
      };
    };

    const storageChangeListeners = new Set<(...args: unknown[]) => void>();

    const nextChrome = {
      ...existingChrome,
      runtime,
      storage: {
        ...(existingChrome.storage ?? {}),
        local: makeStorageArea(localState),
        session: makeStorageArea(sessionState),
        onChanged: {
          addListener(listener: (...args: unknown[]) => void) {
            storageChangeListeners.add(listener);
          },
          removeListener(listener: (...args: unknown[]) => void) {
            storageChangeListeners.delete(listener);
          },
        },
      },
    };

    (win as Window & { chrome: typeof chrome }).chrome = nextChrome as unknown as typeof chrome;
    win.__klicChromeMock = {
      dispatchIncomingMessage,
      getListenerCount() {
        return listeners.size;
      },
    };
  });
});

test.describe('Modal Interaction (Task 8)', () => {
  test('should open context menu modal when receiving message', async ({ page }) => {
    await loadContentScript(page);

    const result = await openModalAndResolveReady(page, {
      action: 'OPEN_CONTEXT_MENU_MODAL',
      tool: 'textEdit',
      nonce: 'test-nonce',
      tabId: 123,
    });

    expect(result.success).toBeTruthy();
    expect(result.via).toBe('sendResponse');
    expect(result.response).toEqual({ success: true, opened: true });

    const modalExists = await page.evaluate((rootId) => {
      return document.getElementById(rootId) !== null;
    }, MODAL_ROOT_ID);
    expect(modalExists).toBeTruthy();

    const iframeSrc = await page.evaluate((iframeId) => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      return iframe?.src ?? '';
    }, MODAL_IFRAME_ID);

    expect(iframeSrc).toContain('mode=modal');
    expect(iframeSrc).toContain('nonce=test-nonce');
    expect(iframeSrc).toContain('tool=textEdit');
    expect(iframeSrc).toContain('tabId=123');

    await captureEvidence(page, 'task-3-target-tab.png');
    await captureEvidence(page, 'task-8-e2e-modal-open-close.png');
  });

  test('should ignore spoofed modal close request with wrong nonce', async ({ page }) => {
    await loadContentScript(page);

    const openResult = await openModalAndResolveReady(page, {
      action: 'OPEN_CONTEXT_MENU_MODAL',
      tool: 'textEdit',
      nonce: 'test-nonce',
      tabId: 123,
    });

    expect(openResult.success).toBeTruthy();
    expect(openResult.response).toEqual({ success: true, opened: true });

    const dispatched = await page.evaluate(
      ({ iframeId, type }) => {
        const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
        if (!iframe?.contentWindow) {
          return false;
        }

        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type, nonce: 'wrong-nonce' },
            origin: window.location.origin,
            source: iframe.contentWindow,
          })
        );

        return true;
      },
      { iframeId: MODAL_IFRAME_ID, type: MODAL_CLOSE_REQUEST_TYPE }
    );

    expect(dispatched).toBeTruthy();

    const modalStillExists = await page.evaluate((rootId) => {
      return document.getElementById(rootId) !== null;
    }, MODAL_ROOT_ID);
    expect(modalStillExists).toBeTruthy();

    await captureEvidence(page, 'task-7-spoof-ignored.png');
  });

  test('should close context menu modal via Escape key', async ({ page }) => {
    await loadContentScript(page);

    const openResult = await openModalAndResolveReady(page, {
      action: 'OPEN_CONTEXT_MENU_MODAL',
      tool: 'textEdit',
      nonce: 'test-nonce',
      tabId: 123,
    });

    expect(openResult.success).toBeTruthy();
    expect(openResult.response).toEqual({ success: true, opened: true });

    await captureEvidence(page, 'task-4-open-close.png');

    await page.keyboard.press('Escape');

    await expect
      .poll(async () => {
        return page.evaluate((rootId) => document.getElementById(rootId) !== null, MODAL_ROOT_ID);
      })
      .toBeFalsy();
  });

  test('should minimize and restore context menu modal', async ({ page }) => {
    await loadContentScript(page);

    const openResult = await openModalAndResolveReady(page, {
      action: 'OPEN_CONTEXT_MENU_MODAL',
      tool: 'textEdit',
      nonce: 'test-nonce',
      tabId: 123,
    });

    expect(openResult.success).toBeTruthy();
    expect(openResult.response).toEqual({ success: true, opened: true });

    await captureEvidence(page, 'task-10-ux.png');

    await page.click(`#${MODAL_MINIMIZE_ID}`);

    await expect
      .poll(async () => {
        return page.evaluate((containerId) => {
          const el = document.getElementById(containerId);
          return el ? window.getComputedStyle(el).display : 'missing';
        }, MODAL_CONTAINER_ID);
      })
      .toBe('none');

    const minimizedVisible = await page.evaluate((minimizedId) => {
      const el = document.getElementById(minimizedId);
      return Boolean(el) && window.getComputedStyle(el!).display !== 'none';
    }, MODAL_MINIMIZED_ID);
    expect(minimizedVisible).toBeTruthy();

    await page.click(`#${MODAL_MINIMIZED_ID}`);

    await expect
      .poll(async () => {
        return page.evaluate((containerId) => {
          const el = document.getElementById(containerId);
          return el ? window.getComputedStyle(el).display : 'missing';
        }, MODAL_CONTAINER_ID);
      })
      .toBe('flex');

    const minimizedHidden = await page.evaluate((minimizedId) => {
      const el = document.getElementById(minimizedId);
      return Boolean(el) && window.getComputedStyle(el!).display === 'none';
    }, MODAL_MINIMIZED_ID);
    expect(minimizedHidden).toBeTruthy();
  });

  test('should close context menu modal via close button', async ({ page }) => {
    await loadContentScript(page);

    const openResult = await openModalAndResolveReady(page, {
      action: 'OPEN_CONTEXT_MENU_MODAL',
      tool: 'textEdit',
      nonce: 'test-nonce',
      tabId: 123,
    });

    expect(openResult.success).toBeTruthy();
    expect(openResult.response).toEqual({ success: true, opened: true });

    await page.click(`#${MODAL_CLOSE_ID}`);

    await expect
      .poll(async () => {
        return page.evaluate((rootId) => document.getElementById(rootId) !== null, MODAL_ROOT_ID);
      })
      .toBeFalsy();
  });
});

test.describe('CSP Fallback (Task 9)', () => {
  test('should report opened=false and cleanup when iframe open fails', async ({ page }) => {
    await loadContentScript(page);

    const openPromise = simulateRuntimeMessage(
      page,
      {
        action: 'OPEN_CONTEXT_MENU_MODAL',
        tool: 'textEdit',
        nonce: 'test-nonce',
        tabId: 123,
      },
      600
    );

    await expect
      .poll(async () => {
        return page.evaluate((iframeId) => document.getElementById(iframeId) !== null, MODAL_IFRAME_ID);
      })
      .toBeTruthy();

    const dispatchedError = await page.evaluate((iframeId) => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      if (!iframe) {
        return false;
      }

      iframe.dispatchEvent(new Event('error'));
      return true;
    }, MODAL_IFRAME_ID);

    expect(dispatchedError).toBeTruthy();

    const result = await openPromise;

    expect(result.success).toBeTruthy();
    expect(result.via).toBe('sendResponse');
    expect(result.response).toEqual({ success: true, opened: false });

    const modalExists = await page.evaluate((rootId) => {
      return document.getElementById(rootId) !== null;
    }, MODAL_ROOT_ID);
    expect(modalExists).toBeFalsy();

    await captureEvidence(page, 'task-5-modal-fallback.png');
    await captureEvidence(page, 'task-9-e2e-csp-fallback.png');
  });
});
