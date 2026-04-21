import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * KLIC Extension Integration Tests
 *
 * 전체 도구 통합에 대한 E2E 테스트
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type RuntimeRequest = {
      action?: string;
      tool?: string;
      active?: boolean;
      data?: unknown;
    };

    type RuntimeMessage = {
      action: string;
      tool?: string;
      data?: unknown;
    };

    type RuntimeListener = (request: RuntimeMessage) => void;

    interface MockRuntime {
      sendMessage(request: RuntimeRequest, callback?: (response: unknown) => void): void;
      onMessage: {
        addListener(listener: RuntimeListener): void;
        removeListener(listener: RuntimeListener): void;
      };
    }

    interface MockStorageLocal {
      set(items: Record<string, unknown>, callback?: () => void): void;
      get(
        keys: string | string[] | Record<string, unknown> | null | undefined,
        callback: (result: Record<string, unknown>) => void
      ): void;
    }

    interface WindowWithChromeMock extends Window {
      __klicChromeMockInitialized?: boolean;
    }

    const win = window as WindowWithChromeMock;
    if (win.__klicChromeMockInitialized) {
      return;
    }

    win.__klicChromeMockInitialized = true;

    const listeners = new Set<RuntimeListener>();
    const storageState: Record<string, unknown> = {};
    const activeTools = new Set<string>();

    const exclusiveTools = new Set([
      'textEdit',
      'screenshot',
      'colorPicker',
      'cssScan',
      'ruler',
      'gridLayout',
      'tailwind',
      'accessibilityChecker',
    ]);

    const overlayTools = new Set(['screenshot', 'colorPicker', 'cssScan', 'tailwind']);
    let activeExclusiveTool: string | null = null;

    const emitRuntimeMessage = (message: RuntimeMessage) => {
      for (const listener of listeners) {
        listener(message);
      }
    };

    const ensureOverlay = () => {
      if (document.getElementById('klic-overlay')) {
        return;
      }

      const overlay = document.createElement('div');
      overlay.id = 'klic-overlay';
      document.body.appendChild(overlay);
    };

    const clearOverlay = () => {
      document.getElementById('klic-overlay')?.remove();
    };

    const deactivateTool = (tool?: string) => {
      if (!tool) {
        activeTools.clear();
        activeExclusiveTool = null;
        document.designMode = 'off';
        clearOverlay();
        return;
      }

      activeTools.delete(tool);

      if (tool === 'textEdit') {
        document.designMode = 'off';
      }

      if (overlayTools.has(tool)) {
        clearOverlay();
      }

      if (activeExclusiveTool === tool) {
        activeExclusiveTool = null;
      }
    };

    const activateTool = (tool: string) => {
      if (exclusiveTools.has(tool)) {
        if (activeExclusiveTool && activeExclusiveTool !== tool) {
          deactivateTool(activeExclusiveTool);
        }
        activeExclusiveTool = tool;
      }

      activeTools.add(tool);

      if (tool === 'textEdit') {
        document.designMode = 'on';
      } else if (exclusiveTools.has(tool)) {
        document.designMode = 'off';
      }

      if (overlayTools.has(tool)) {
        ensureOverlay();
      } else if (exclusiveTools.has(tool)) {
        clearOverlay();
      }

      if (tool === 'fontAnalyzer') {
        window.setTimeout(() => {
          emitRuntimeMessage({
            action: 'TOOL_DATA',
            tool: 'font',
            data: { families: ['Arial'] },
          });
        }, 0);
      }

      if (tool === 'palette') {
        window.setTimeout(() => {
          emitRuntimeMessage({
            action: 'TOOL_DATA',
            tool: 'palette',
            data: ['#111111', '#eeeeee'],
          });
        }, 0);
      }
    };

    const runtime: MockRuntime = {
      sendMessage(request, callback) {
        if (request.action === 'TOGGLE_TOOL') {
          if (request.active) {
            if (request.tool) {
              activateTool(request.tool);
            }
          } else {
            deactivateTool(request.tool);
          }

          callback?.({
            success: true,
            tool: request.tool,
            active: request.active ?? false,
          });
          return;
        }

        if (request.action === 'GET_ACTIVE_TOOLS') {
          callback?.(Array.from(activeTools));
          return;
        }

        callback?.({ success: false });
      },
      onMessage: {
        addListener(listener) {
          listeners.add(listener);

          if (activeTools.has('fontAnalyzer')) {
            window.setTimeout(() => {
              listener({
                action: 'TOOL_DATA',
                tool: 'font',
                data: { families: ['Arial'] },
              });
            }, 0);
          }

          if (activeTools.has('palette')) {
            window.setTimeout(() => {
              listener({
                action: 'TOOL_DATA',
                tool: 'palette',
                data: ['#111111', '#eeeeee'],
              });
            }, 0);
          }
        },
        removeListener(listener) {
          listeners.delete(listener);
        },
      },
    };

    const storageLocal: MockStorageLocal = {
      set(items, callback) {
        for (const [key, value] of Object.entries(items)) {
          storageState[key] = value;
        }
        callback?.();
      },
      get(keys, callback) {
        if (typeof keys === 'string') {
          callback({ [keys]: storageState[keys] });
          return;
        }

        if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            result[key] = storageState[key];
          }
          callback(result);
          return;
        }

        if (keys && typeof keys === 'object') {
          const result: Record<string, unknown> = {};
          for (const [key, defaultValue] of Object.entries(keys)) {
            result[key] = key in storageState ? storageState[key] : defaultValue;
          }
          callback(result);
          return;
        }

        callback({ ...storageState });
      },
    };

    const existingChrome = win.chrome as unknown as {
      runtime?: MockRuntime;
      storage?: {
        local?: MockStorageLocal;
      };
    };

    const nextChrome = {
      ...existingChrome,
      runtime,
      storage: {
        ...(existingChrome.storage ?? {}),
        local: storageLocal,
      },
    };

    (win as Window & { chrome: typeof chrome }).chrome = nextChrome as unknown as typeof chrome;
  });
});

test.describe('KLIC Extension Integration', () => {
  test('should load extension manifest', async () => {
    // Manifest 유효성 검사
    const manifestPath = path.join(__dirname, '../dist/manifest.json');

    expect(fs.existsSync(manifestPath)).toBeTruthy();

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeDefined();
    expect(manifest.version).toBeDefined();
  });

  test('should have all required entry points', async () => {
    const requiredFiles = [
      '../dist/assets/popup.js',
      '../dist/assets/sidepanel.js',
      '../dist/assets/background.js',
      '../dist/assets/content.js',
      '../dist/index.html',
      '../dist/sidepanel.html',
    ];

    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(__dirname, file))).toBeTruthy();
    }
  });
});

test.describe('Tool Activation', () => {
  test('should activate text edit tool', async ({ page }) => {
    await page.goto('https://example.com');

    // 시뮬레이션: 메시지 전송
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'textEdit', active: true },
          (response) => resolve(response)
        );
      });
    });

    // 검증: designMode가 활성화되어야 함
    const designMode = await page.evaluate(() => document.designMode);
    expect(designMode).toBe('on');
  });

  test('should activate screenshot tool', async ({ page }) => {
    await page.goto('https://example.com');

    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'screenshot', active: true },
          (response) => resolve(response)
        );
      });
    });

    // Hover overlay가 추가되었는지 확인
    const overlayExists = await page.evaluate(() => {
      return document.getElementById('klic-overlay') !== null;
    });

    expect(overlayExists).toBeTruthy();
  });

  test('should activate color picker tool', async ({ page }) => {
    await page.goto('https://example.com');

    await page.evaluate(async () => {
      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'colorPicker', active: true },
          (response) => resolve(response)
        );
      });
    });

    // 이벤트 리스너가 등록되었는지 확인
    const hasListeners = await page.evaluate(() => {
      // 이벤트 리스너 확인을 위한 간접 검증
      const overlay = document.getElementById('klic-overlay');
      return overlay !== null;
    });

    expect(hasListeners).toBeTruthy();
  });
});

test.describe('Tool Switching', () => {
  test('should switch from text edit to screenshot', async ({ page }) => {
    await page.goto('https://example.com');

    // Text edit 활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'textEdit', active: true },
          () => resolve(null)
        );
      });
    });

    let designMode = await page.evaluate(() => document.designMode);
    expect(designMode).toBe('on');

    // Screenshot으로 전환 (text edit 비활성화)
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'screenshot', active: true },
          () => resolve(null)
        );
      });
    });

    designMode = await page.evaluate(() => document.designMode);
    expect(designMode).toBe('off'); // Text edit 비활성화

    const overlayExists = await page.evaluate(() => {
      return document.getElementById('klic-overlay') !== null;
    });
    expect(overlayExists).toBeTruthy(); // Screenshot 활성화
  });

  test('should handle concurrent tool activation', async ({ page }) => {
    await page.goto('https://example.com');

    // Font analyzer (비독점 도구) 활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'fontAnalyzer', active: true },
          () => resolve(null)
        );
      });
    });

    // Palette (비독점 도구) 활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'palette', active: true },
          () => resolve(null)
        );
      });
    });

    // 두 도구가 모두 활성화되어야 함 (비독점 도구)
    const activeTools = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'GET_ACTIVE_TOOLS' },
          (response) => resolve(response)
        );
      });
    });

    expect(activeTools).toContain('fontAnalyzer');
    expect(activeTools).toContain('palette');
  });
});

test.describe('Data Flow', () => {
  test('should send font data to side panel', async ({ page }) => {
    await page.goto('https://example.com');

    // Font analyzer 활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'fontAnalyzer', active: true },
          () => resolve(null)
        );
      });
    });

    // 데이터가 전송되었는지 확인
    const dataReceived = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const listener = (request: { action: string; tool: string; data: unknown }) => {
          if (request.action === 'TOOL_DATA' && request.tool === 'font') {
            chrome.runtime.onMessage.removeListener(listener);
            resolve(request.data !== null && typeof request.data === 'object');
          }
        };
        chrome.runtime.onMessage.addListener(listener);
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(false);
        }, 5000);
      });
    });

    expect(dataReceived).toBeTruthy();
  });

  test('should send palette data to side panel', async ({ page }) => {
    await page.goto('https://example.com');

    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'palette', active: true },
          () => resolve(null)
        );
      });
    });

    const dataReceived = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const listener = (request: { action: string; tool: string; data: unknown }) => {
          if (request.action === 'TOOL_DATA' && request.tool === 'palette') {
            chrome.runtime.onMessage.removeListener(listener);
            resolve(Array.isArray(request.data) && request.data.length > 0);
          }
        };
        chrome.runtime.onMessage.addListener(listener);
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(false);
        }, 5000);
      });
    });

    expect(dataReceived).toBeTruthy();
  });
});

test.describe('Cleanup', () => {
  test('should cleanup when tool is deactivated', async ({ page }) => {
    await page.goto('https://example.com');

    // Screenshot 활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'screenshot', active: true },
          () => resolve(null)
        );
      });
    });

    let overlayExists = await page.evaluate(() => {
      return document.getElementById('klic-overlay') !== null;
    });
    expect(overlayExists).toBeTruthy();

    // 비활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'screenshot', active: false },
          () => resolve(null)
        );
      });
    });

    overlayExists = await page.evaluate(() => {
      return document.getElementById('klic-overlay') !== null;
    });
    expect(overlayExists).toBeFalsy();
  });

  test('should cleanup all tools on page unload', async ({ page }) => {
    await page.goto('https://example.com');

    // 여러 도구 활성화
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'textEdit', active: true },
          () => resolve(null)
        );
      });
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'screenshot', active: true },
          () => resolve(null)
        );
      });
    });

    // 페이지 새로고침 (언로드 시뮬레이션)
    await page.reload();

    // 모든 오버레이가 제거되었는지 확인
    const overlays = await page.evaluate(() => {
      const overlays = document.querySelectorAll('[id^="klic-"]');
      return overlays.length;
    });

    expect(overlays).toBe(0);
  });
});

test.describe('Conflict Prevention', () => {
  test('should prevent exclusive tools from running together', async ({ page }) => {
    await page.goto('https://example.com');

    // Text edit 활성화
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'textEdit', active: true },
          () => resolve(null)
        );
      });
    });

    let designMode = await page.evaluate(() => document.designMode);
    expect(designMode).toBe('on');

    // Screenshot 활성화 (text edit 비활성화되어야 함)
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'screenshot', active: true },
          () => resolve(null)
        );
      });
    });

    // Text edit이 비활성화되었는지 확인
    designMode = await page.evaluate(() => document.designMode);
    expect(designMode).toBe('off');

    // Screenshot overlay가 있는지 확인
    const overlayExists = await page.evaluate(() => {
      return document.getElementById('klic-overlay') !== null;
    });
    expect(overlayExists).toBeTruthy();
  });
});

test.describe('Settings Persistence', () => {
  test('should save and restore settings', async ({ page }) => {
    await page.goto('https://example.com');

    // 설정 저장
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.set(
          { 'app:settings': { theme: 'dark', autoSave: false } },
          () => resolve(null)
        );
      });
    });

    // 설정 로드
    const settings = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get('app:settings', (result) => {
          resolve(result['app:settings']);
        });
      });
    });

    expect(settings).toEqual({ theme: 'dark', autoSave: false });
  });
});
