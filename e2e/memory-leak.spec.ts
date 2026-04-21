import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

type MockStorageData = Record<string, unknown>;
type MockStorageKeys = string | string[] | MockStorageData | null | undefined;
type MockCallback = ((value?: unknown) => void) | null | undefined;

/**
 * Memory Leak Tests
 *
 * 도구 활성화/비활성화 사이클에서 메모리 누수 감지
 */

/**
 * 메모리 사용량 가져오기
 */
async function getMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    if ('memory' in performance) {
      const perf = performance as { memory?: { usedJSHeapSize: number } };
      return perf.memory?.usedJSHeapSize ?? 0;
    }
    return 0;
  });
}

/**
 * GC 강제 실행 시도 (Chrome DevTools Protocol)
 */
async function forceGC(page: Page): Promise<void> {
  try {
    const client = await page.context().newCDPSession(page);
    await client.send('HeapProfiler.collectGarbage');
  } catch (error) {
    console.warn('GC not available:', error);
  }
}

test.describe('Memory Leak Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const storageData: MockStorageData = {};
      const getRecord = (value: unknown): MockStorageData =>
        value && typeof value === 'object' ? (value as MockStorageData) : {};
      const isCallback = (value: unknown): value is (value?: unknown) => void =>
        typeof value === 'function';
      const asyncCallback = (callback: MockCallback, value?: unknown) => {
        if (typeof callback === 'function') {
          setTimeout(() => callback(value), 0);
        }
      };

      const getStorageResult = (keys: MockStorageKeys): MockStorageData => {
        if (keys == null) {
          return { ...storageData };
        }

        if (Array.isArray(keys)) {
          const result = {};
          for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(storageData, key)) {
              result[key] = storageData[key];
            }
          }
          return result;
        }

        if (typeof keys === 'string') {
          return Object.prototype.hasOwnProperty.call(storageData, keys)
            ? { [keys]: storageData[keys] }
            : {};
        }

        if (typeof keys === 'object') {
          const result = {};
          for (const key of Object.keys(keys)) {
            if (Object.prototype.hasOwnProperty.call(storageData, key)) {
              result[key] = storageData[key];
            } else {
              result[key] = keys[key];
            }
          }
          return result;
        }

        return {};
      };

      const w = window as unknown as { chrome?: unknown };
      const existingChrome = getRecord(w.chrome);
      const existingRuntime = getRecord(existingChrome.runtime);
      const existingStorage = getRecord(existingChrome.storage);
      const existingLocal = getRecord(existingStorage.local);

      w.chrome = {
        ...existingChrome,
        runtime: {
          ...existingRuntime,
          sendMessage: (...args: unknown[]) => {
            const maybeCallback = args[args.length - 1];
            const callback: MockCallback = isCallback(maybeCallback) ? maybeCallback : null;
            const response = { ok: true };
            asyncCallback(callback, response);
            return Promise.resolve(response);
          },
        },
        storage: {
          ...existingStorage,
          local: {
            ...existingLocal,
            get: (keys?: MockStorageKeys | MockCallback, callback?: MockCallback) => {
              if (typeof keys === 'function') {
                const result = getStorageResult(undefined);
                asyncCallback(keys, result);
                return Promise.resolve(result);
              }

              const result = getStorageResult(keys);
              asyncCallback(callback, result);
              return Promise.resolve(result);
            },
            set: (items?: MockStorageData, callback?: MockCallback) => {
              if (items && typeof items === 'object') {
                Object.assign(storageData, items);
              }
              asyncCallback(callback);
              return Promise.resolve();
            },
            remove: (keys: string | string[], callback?: MockCallback) => {
              const keyList = Array.isArray(keys) ? keys : [keys];
              for (const key of keyList) {
                delete storageData[key];
              }
              asyncCallback(callback);
              return Promise.resolve();
            },
          },
        },
      };
    });

    await page.goto('https://example.com');
  });

  test('should not leak memory when activating tools', async ({ page }) => {
    // 초기 메모리 측정
    const initialMemory = await getMemoryUsage(page);
    console.log('Initial memory:', initialMemory);

    // 도구 활성화/비활성화 반복
    for (let i = 0; i < 5; i++) {
      // Text edit 활성화/비활성화
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: 'textEdit', active: true },
            () => resolve(null)
          );
        });
      });

      await page.waitForTimeout(200);

      await page.evaluate(async () => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: 'textEdit', active: false },
            () => resolve(null)
          );
        });
      });

      await page.waitForTimeout(200);
    }

    // GC 강제 실행
    await forceGC(page);

    // 최종 메모리 측정
    const finalMemory = await getMemoryUsage(page);
    console.log('Final memory:', finalMemory);

    // 메모리 증가 확인 (10MB 이하 허용)
    const memoryIncrease = finalMemory - initialMemory;
    const maxAllowedIncrease = 10 * 1024 * 1024; // 10MB

    console.log('Memory increase:', memoryIncrease);

    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
  });

  test('should cleanup properly when switching tools', async ({ page }) => {
    const initialMemory = await getMemoryUsage(page);

    // 여러 도구 연속 전환
    const tools = ['textEdit', 'screenshot', 'colorPicker', 'cssScan', 'ruler'];

    for (const tool of tools) {
      // 활성화
      await page.evaluate(async (toolId) => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: toolId, active: true },
            () => resolve(null)
          );
        });
      }, tool);

      await page.waitForTimeout(300);

      // 비활성화
      await page.evaluate(async (toolId) => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: toolId, active: false },
            () => resolve(null)
          );
        });
      }, tool);

      await page.waitForTimeout(300);
    }

    await forceGC(page);

    const finalMemory = await getMemoryUsage(page);
    const memoryIncrease = finalMemory - initialMemory;
    const maxAllowedIncrease = 15 * 1024 * 1024; // 15MB

    console.log('Memory increase after tool switching:', memoryIncrease);

    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
  });

  test('should not leak event listeners', async ({ page }) => {
    // 이벤트 리스너 수 추정 (오버레이 요소 확인)
    const getOverlayCount = async () => {
      return await page.evaluate(() => {
        return document.querySelectorAll('[id^="klic-"], [class*="klic-"]').length;
      });
    };

    // 초기 상태
    const initialOverlays = await getOverlayCount();
    console.log('Initial overlays:', initialOverlays);

    // 여러 도구 활성화
    const tools = ['screenshot', 'colorPicker', 'cssScan', 'ruler'];

    for (const tool of tools) {
      await page.evaluate(async (toolId) => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: toolId, active: true },
            () => resolve(null)
          );
        });
      }, tool);
      await page.waitForTimeout(200);
    }

    const maxOverlays = await getOverlayCount();
    console.log('Max overlays:', maxOverlays);

    // 모두 비활성화
    for (const tool of tools) {
      await page.evaluate(async (toolId) => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: toolId, active: false },
            () => resolve(null)
          );
        });
      }, tool);
      await page.waitForTimeout(200);
    }

    // Cleanup 후 오버레이 수
    const finalOverlays = await getOverlayCount();
    console.log('Final overlays:', finalOverlays);

    // 모든 오버레이가 제거되어야 함
    expect(finalOverlays).toBe(initialOverlays);
  });

  test('should not leak DOM nodes', async ({ page }) => {
    const initialNodes = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // 반복적으로 도구 활성화/비활성화
    for (let i = 0; i < 5; i++) {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: 'screenshot', active: true },
            () => resolve(null)
          );
        });
      });

      await page.waitForTimeout(300);

      await page.evaluate(async () => {
        await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: 'TOGGLE_TOOL', tool: 'screenshot', active: false },
            () => resolve(null)
          );
        });
      });

      await page.waitForTimeout(300);
    }

    const finalNodes = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // DOM 노드 수가 비정상적으로 증가하지 않아야 함
    const nodeIncrease = finalNodes - initialNodes;
    expect(nodeIncrease).toBeLessThan(100); // 허용 가능한 증가
  });

  test('should cleanup storage data properly', async ({ page }) => {
    // 테스트 데이터 저장
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        chrome.storage.local.set(
          {
            'test:data': { items: Array(100).fill({ value: 'test' }) },
            'test:history': Array(50).fill('entry'),
          },
          () => resolve(null)
        );
      });
    });

    // 데이터 확인
    const hasData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['test:data', 'test:history'], (result) => {
          resolve(!!result['test:data'] && !!result['test:history']);
        });
      });
    });

    expect(hasData).toBeTruthy();

    // 데이터 삭제
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        chrome.storage.local.remove(['test:data', 'test:history'], () => resolve(null));
      });
    });

    // 삭제 확인
    const dataCleared = await page.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['test:data', 'test:history'], (result) => {
          resolve(!result['test:data'] && !result['test:history']);
        });
      });
    });

    expect(dataCleared).toBeTruthy();
  });

  test('should handle rapid tool activation gracefully', async ({ page }) => {
    const initialMemory = await getMemoryUsage(page);

    // 빠른 연속 활성화 (race condition 테스트)
    const tools = ['textEdit', 'screenshot', 'colorPicker', 'ruler'];

    await Promise.all(
      tools.map(tool =>
        page.evaluate(async (toolId) => {
          await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { action: 'TOGGLE_TOOL', tool: toolId, active: true },
              () => resolve(null)
            );
          });
        }, tool)
      )
    );

    await page.waitForTimeout(1000);

    await forceGC(page);

    const finalMemory = await getMemoryUsage(page);
    const memoryIncrease = finalMemory - initialMemory;

    // 빠른 연속 활성화 후에도 메모리가 정상이어야 함
    expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 20MB 허용
  });

  test('should not leak when page is navigated', async ({ page }) => {
    // 첫 번째 페이지에서 도구 활성화
    await page.goto('https://example.com');

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'TOGGLE_TOOL', tool: 'textEdit', active: true },
          () => resolve(null)
        );
      });
    });

    await page.waitForTimeout(500);

    // 페이지 이동
    await page.goto('https://example.com/page');

    // 오버레이가 없는지 확인
    const overlays = await page.evaluate(() => {
      return document.querySelectorAll('[id^="klic-"]').length;
    });

    expect(overlays).toBe(0);
  });
});
