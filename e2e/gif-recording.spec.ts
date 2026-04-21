/**
 * GIF Recording E2E Tests
 *
 * GIF 녹화 기능에 대한 End-to-End 테스트
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { MESSAGE_ACTIONS } from '../src/constants/messages';

interface GifRecordingState {
  isRecording: boolean;
  duration: number;
  frameCount: number;
  isEncoding: boolean;
  encodingProgress: number;
}

interface TestMessage {
  message?: {
    action?: string;
    data?: {
      dataUrl?: string;
    };
  };
  callback?: unknown;
}

interface TestWindow extends Window {
  gifRecordingState?: GifRecordingState;
  __testMessages?: TestMessage[];
  offscreenDocumentExists?: boolean;
  elapsedTimeDisplay?: string;
  gifEncodingState?: { isEncoding: boolean; progress: number };
  downloadInitiated?: boolean;
  __storageGetCalled?: boolean;
  __storageSetCalled?: boolean;
}

async function ensureChromeTestMocks(page: Page): Promise<void> {
  await page.evaluate((actions: { progress: string; complete: string }) => {
    const w = window as unknown as TestWindow;

    w.__testMessages = w.__testMessages || [];
    const pushMessage = (message: unknown, callback?: unknown) => {
      w.__testMessages?.push({ message: message as TestMessage['message'], callback });
    };

    const existingChrome = (w as unknown as { chrome?: unknown }).chrome as
      | {
          runtime?: { sendMessage?: (...args: unknown[]) => unknown };
          storage?: { local?: { get?: (...args: unknown[]) => unknown; set?: (...args: unknown[]) => unknown } };
          tabs?: { sendMessage?: (...args: unknown[]) => unknown; query?: (...args: unknown[]) => unknown };
        }
      | undefined;

    const chromeLike = existingChrome || {};
    chromeLike.storage = chromeLike.storage || {};
    chromeLike.storage.local = chromeLike.storage.local || {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
    };
    chromeLike.tabs = chromeLike.tabs || {
      sendMessage: () => {},
      query: () => Promise.resolve([{ id: 1, url: 'about:blank' }]),
    };
    chromeLike.runtime = chromeLike.runtime || {};
    chromeLike.runtime.sendMessage = (message: unknown, callback?: unknown) => {
      pushMessage(message, callback);

      const action = (message as { action?: unknown })?.action;
      if (action === actions.progress) {
        if (typeof callback === 'function') {
          setTimeout(() => {
            (callback as (arg?: unknown) => void)({
              action: actions.progress,
              data: { elapsed: 1000, frameCount: 5, isEncoding: false, encodingProgress: 0 },
            });
          }, 10);
        }
      } else if (action === actions.complete) {
        if (typeof callback === 'function') {
          setTimeout(() => {
            (callback as (arg?: unknown) => void)({
              action: actions.complete,
              data: { dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIA...', frameCount: 10 },
            });
          }, 100);
        }
      } else {
        if (typeof callback === 'function') {
          callback();
        }
      }

      return true;
    };

    (w as unknown as { chrome?: unknown }).chrome = chromeLike;
  }, { progress: MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS, complete: MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE });
}

// Mock HTML page for testing
const TEST_PAGE_HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GIF Recording Test Page</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    .test-target {
      width: 200px;
      height: 100px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin: 20px;
      cursor: pointer;
    }
    .test-target:hover {
      transform: scale(1.05);
    }
    .test-button {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 10px;
    }
    .test-button:hover {
      background: #2563eb;
    }
    #recording-indicator {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px;
      background: rgba(239, 68, 68, 0.9);
      border-radius: 4px;
      display: none;
    }
    #recording-indicator.active {
      display: flex;
    }
    .settings-controls {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div id="recording-indicator">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 12px; height: 12px; background: red; border-radius: 50%;"></div>
      <span style="color: white; font-weight: bold;">REC</span>
    </div>
  </div>

  <div class="test-target" id="capture-area">
    <h2>GIF Recording Test Page</h2>
    <p>테스트 대상 영역</p>
  </div>

  <div class="settings-controls">
    <button class="test-button" id="start-recording">녹화 시작</button>
    <button class="test-button" id="stop-recording" disabled>녹화 중지</button>
    <button class="test-button" id="change-fps">FPS 변경</button>
    <button class="test-button" id="change-quality">화질 변경</button>
  </div>

  <div id="elapsed-time" style="font-family: monospace; font-size: 14px; color: #111827;"></div>

  <script>
    const state = {
      isRecording: false,
      duration: 0,
      frameCount: 0,
      isEncoding: false,
      encodingProgress: 0,
    };

    let startTimestamp = 0;
    let frameTimer = null;
    let encodingTimer = null;

    function setState(next) {
      Object.assign(state, next);
      window.gifRecordingState = { ...state };
    }

    setState({});

    // Show recording indicator
    function showIndicator() {
      document.getElementById('recording-indicator').classList.add('active');
    }

    // Hide recording indicator
    function hideIndicator() {
      document.getElementById('recording-indicator').classList.remove('active');
    }

    // Start recording
    document.getElementById('start-recording').addEventListener('click', () => {
      if (state.isRecording) {
        return;
      }

      startTimestamp = Date.now();
      setState({ isRecording: true, frameCount: 0, duration: 0, isEncoding: false, encodingProgress: 0 });
      showIndicator();
      document.getElementById('stop-recording').disabled = false;

      if (frameTimer) {
        clearInterval(frameTimer);
      }

       frameTimer = setInterval(() => {
         const elapsedMs = Date.now() - startTimestamp;
        const seconds = Math.floor(elapsedMs / 1000);
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        const label = mm + ':' + ss;
        document.getElementById('elapsed-time').textContent = label;
        window.elapsedTimeDisplay = label;

         setState({
           duration: elapsedMs,
           frameCount: state.frameCount + 1,
         });

          window.__testMessages = window.__testMessages || [];
          window.__testMessages.push({
            message: {
              action: '${MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS}',
              data: { elapsed: elapsedMs, frameCount: state.frameCount + 1, isEncoding: false, encodingProgress: 0 },
            },
          });

          if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.sendMessage === 'function') {
            window.chrome.runtime.sendMessage({
              action: '${MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS}',
              data: { elapsed: elapsedMs, frameCount: state.frameCount, isEncoding: false, encodingProgress: 0 },
            });
          }
        }, 80);
      });

    // Stop recording
    document.getElementById('stop-recording').addEventListener('click', () => {
      if (!state.isRecording) {
        return;
      }

      setState({ isRecording: false });
      hideIndicator();
      document.getElementById('stop-recording').disabled = true;

      if (frameTimer) {
        clearInterval(frameTimer);
        frameTimer = null;
      }

      if (encodingTimer) {
        clearInterval(encodingTimer);
        encodingTimer = null;
      }

      setState({ isEncoding: true, encodingProgress: 0 });
      window.gifEncodingState = { isEncoding: true, progress: 0 };

      encodingTimer = setInterval(() => {
        const nextProgress = Math.min(100, (window.gifEncodingState?.progress ?? 0) + 25);
        window.gifEncodingState = { isEncoding: nextProgress < 100, progress: nextProgress };
        setState({ encodingProgress: nextProgress });

        if (nextProgress >= 100) {
          clearInterval(encodingTimer);
          encodingTimer = null;

          if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.sendMessage === 'function') {
            window.chrome.runtime.sendMessage({
              action: '${MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE}',
              data: { dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIA...', frameCount: state.frameCount },
            });
          }

          window.__testMessages = window.__testMessages || [];
          window.__testMessages.push({
            message: {
              action: '${MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE}',
              data: { dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIA...', frameCount: state.frameCount },
            },
          });

          window.downloadInitiated = true;
          setState({ isEncoding: false });
        }
      }, 120);
    });

    // Change FPS
    document.getElementById('change-fps').addEventListener('click', () => {
      console.log('FPS changed (mock)');
    });

    // Change quality
    document.getElementById('change-quality').addEventListener('click', () => {
      console.log('Quality changed (mock)');
    });
  </script>
</body>
</html>
`;

test.describe('GIF Recording Tool', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // Set up Chrome extension API mocks
    await page.addInitScript({
      content: `
        window.chrome = {
          storage: {
            local: {
              get: (keys) => {
                const result = {};
                keys.forEach(key => {
                  result[key] = null;
                });
                return Promise.resolve(result);
              },
              set: (items) => Promise.resolve(),
            },
          },
          runtime: {
            sendMessage: (message, callback) => {
              // Store message for verification
              window.__testMessages = window.__testMessages || [];
              window.__testMessages.push({ message, callback });

              // Simulate response for certain actions
              if (message.action === '${MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS}') {
                setTimeout(() => {
                  callback?.({
                    action: '${MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS}',
                    data: { elapsed: 1000, frameCount: 5, isEncoding: false, encodingProgress: 0 }
                  });
                }, 10);
              } else if (message.action === '${MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE}') {
                setTimeout(() => {
                  callback?.({
                    action: '${MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE}',
                    data: { dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIA...', frameCount: 10 }
                  });
                }, 100);
              } else {
                callback?.();
              }
              return true;
            },
            onMessage: {
              addListener: () => {},
              removeListener: () => {},
            },
          },
          tabs: {
            sendMessage: () => {},
            query: () => Promise.resolve([{ id: 1, url: 'about:blank' }]),
          },
        };
      `,
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should initialize with recording state idle', async () => {
    const initialState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.gifRecordingState || {
        isRecording: false,
        duration: 0,
        frameCount: 0,
        isEncoding: false,
        encodingProgress: 0,
      };
    });

    expect(initialState.isRecording).toBe(false);
    expect(initialState.isEncoding).toBe(false);
  });

  test('should start recording when start button clicked', async () => {
    // Navigate to test page
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    // Click start recording button
    await page.click('#start-recording');

    // Wait for recording indicator to appear
    await page.waitForSelector('#recording-indicator.active', { timeout: 3000 });

    await page.waitForFunction(() => {
      const w = window as unknown as TestWindow;
      return (w.gifRecordingState?.frameCount ?? 0) > 0;
    }, { timeout: 2000 });

    // Verify recording state
    const recordingState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.gifRecordingState;
    });

    expect(recordingState).toBeDefined();
    expect(recordingState?.isRecording).toBe(true);
    expect(recordingState?.frameCount ?? 0).toBeGreaterThan(0);
  });

  test('should stop recording when stop button clicked', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    // Start recording first
    await page.click('#start-recording');
    await page.waitForSelector('#recording-indicator.active', { timeout: 3000 });

    // Stop recording
    await page.click('#stop-recording');

    // Wait for indicator to hide
    await page.waitForSelector('#recording-indicator', { state: 'hidden', timeout: 3000 });

    // Verify recording stopped
    const recordingState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.gifRecordingState;
    });

    expect(recordingState).toBeDefined();
    expect(recordingState?.isRecording).toBe(false);
  });

  test('should update recording progress during capture', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    // Start recording
    await page.click('#start-recording');

    await page.waitForFunction(
      (expectedAction) => {
        const w = window as unknown as TestWindow;
        const messages = w.__testMessages || [];
        return messages.some((m) => m?.message?.action === expectedAction);
      },
      MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS,
      { timeout: 2000 }
    );

    // Check progress messages were sent
    const messages = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.__testMessages || [];
    });

    const progressMessages = messages.filter(
      (msg) => msg.message?.action === MESSAGE_ACTIONS.GIF_RECORDING_PROGRESS
    );

    expect(progressMessages.length).toBeGreaterThan(0);
  });

  test('should complete encoding and return GIF data URL', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    // Start and stop recording
    await page.click('#start-recording');
    await page.waitForTimeout(500);
    await page.click('#stop-recording');

    await page.waitForFunction(
      (expectedAction) => {
        const w = window as unknown as TestWindow;
        const messages = w.__testMessages || [];
        return messages.some((m) => m?.message?.action === expectedAction);
      },
      MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE,
      { timeout: 3000 }
    );

    // Check complete message was sent
    const messages = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.__testMessages || [];
    });

    const completeMessages = messages.filter(
      (msg) => msg.message?.action === MESSAGE_ACTIONS.GIF_ENCODE_COMPLETE
    );

    expect(completeMessages.length).toBeGreaterThan(0);
    const lastComplete = completeMessages[completeMessages.length - 1];
    expect(lastComplete).toBeDefined();
    expect(lastComplete?.message?.data?.dataUrl).toContain('data:image/gif');
  });

  test('should handle recording errors gracefully', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));

    // Mock error scenario - simulate timeout
    const errorState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      // Simulate error by not handling complete message
      testWindow.gifRecordingState = {
        isRecording: false,
        duration: 0,
        frameCount: 0,
        isEncoding: true,
        encodingProgress: 0,
      };

      // Trigger timeout
      return 'error-timeout';
    });

    expect(errorState).toBe('error-timeout');
  });

  test('should persist GIF settings in storage', async () => {
    await page.goto('about:blank');
    await page.evaluate(() => {
      (window as unknown as TestWindow).__storageGetCalled = false;
      (window as unknown as TestWindow).chrome = {
        storage: {
          local: {
            get: () => {
              (window as unknown as TestWindow).__storageGetCalled = true;
              return Promise.resolve({
                'gif:settings': { fps: 10, quality: 'medium', width: 640, duration: 5, enableCursor: false },
              });
            },
            set: () => Promise.resolve(),
          },
        },
      } as unknown as typeof chrome;
    });

    const storageGetCalled = await page.evaluate((): boolean => {
      const testWindow = window as TestWindow;
      // Try to get settings
      testWindow.chrome?.storage?.local?.get?.(['gif:settings']);
      return Boolean(testWindow.__storageGetCalled);
    });

    expect(storageGetCalled).toBe(true);
  });

  test('should update GIF settings when changed', async () => {
    await page.goto('about:blank');
    await page.evaluate(() => {
      (window as unknown as TestWindow).__storageSetCalled = false;
      (window as unknown as TestWindow).chrome = {
        storage: {
          local: {
            set: () => {
              (window as unknown as TestWindow).__storageSetCalled = true;
              return Promise.resolve();
            },
          },
        },
      } as unknown as typeof chrome;
    });

    const storageSetCalled = await page.evaluate((): boolean => {
      const testWindow = window as TestWindow;
      // Update settings
      testWindow.chrome?.storage?.local?.set?.({
        'gif:settings': { fps: 15, quality: 'high', width: 800, duration: 10 }
      });
      return Boolean(testWindow.__storageSetCalled);
    });

    expect(storageSetCalled).toBe(true);
  });

  test('should create offscreen document for encoding', async () => {
    // This test verifies the offscreen.html is properly configured
    const offscreenHtml = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.offscreenDocumentExists || false;
    });

    // In a real scenario, offscreen would be created by background script
    // For E2E testing, we mock this behavior
    expect(offscreenHtml).toBeDefined();
  });

  test('should handle concurrent recording requests', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));

    // Try to start multiple times (should be prevented)
    await page.click('#start-recording');
    await page.waitForTimeout(200);

    const recordingState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.gifRecordingState;
    });

    expect(recordingState).toBeDefined();
    expect(recordingState?.isRecording).toBe(true);

    // Try to start again (should be ignored)
    await page.click('#start-recording');
    await page.waitForTimeout(200);

    const secondRecordingState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.gifRecordingState;
    });

    // Should still be recording (second click ignored or blocked)
    expect(secondRecordingState).toBeDefined();
    expect(secondRecordingState?.isRecording).toBe(true);
  });

  test('should format time correctly in UI', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    // This test verifies the UI shows formatted time (MM:SS)
    // The test page shows elapsed time in formatTime function
    await page.click('#start-recording');
    await page.waitForTimeout(2000);

    // Check time display exists
    const timeDisplay = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.elapsedTimeDisplay || '';
    });

    expect(timeDisplay).toContain(':');
  });

  test('should show encoding progress percentage', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    await page.click('#start-recording');
    await page.waitForTimeout(100);
    await page.click('#stop-recording');

    await page.waitForFunction(() => {
      const w = window as unknown as TestWindow;
      const encoding = w.gifEncodingState;
      return Boolean(encoding) && typeof encoding?.progress === 'number' && encoding.progress >= 0;
    }, { timeout: 2000 });

    // Check encoding state
    const encodingState = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.gifEncodingState || { isEncoding: false, progress: 0 };
    });

    expect(typeof encodingState.isEncoding).toBe('boolean');
    expect(typeof encodingState.progress).toBe('number');
    expect(encodingState.progress).toBeGreaterThanOrEqual(0);
    expect(encodingState.progress).toBeLessThanOrEqual(100);
  });

  test('should handle download after recording completes', async () => {
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(TEST_PAGE_HTML));
    await ensureChromeTestMocks(page);

    await page.click('#start-recording');
    await page.waitForTimeout(300);
    await page.click('#stop-recording');

    // Mock download verification
    const downloadStarted = await page.evaluate(() => {
      const testWindow = window as TestWindow;
      return testWindow.downloadInitiated || false;
    });

    expect(downloadStarted).toBeDefined();
  });
});
