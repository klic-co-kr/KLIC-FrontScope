# Phase 5: UI Components (Tasks 14-20)

React hooks, GifRecordingTab, ScreenshotTab, CapturePanel, ToolRouter update, barrel exports.

---

## Task 14: Create useGifSettings Hook

**Files:**
- Create: `src/hooks/useGifSettings.ts`
- Test: `src/hooks/__tests__/useGifSettings.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useGifSettings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGifSettings } from '../useGifSettings';
import { DEFAULT_GIF_SETTINGS } from '../../types/recording';

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};

beforeEach(() => {
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn((keys: string[]) =>
          Promise.resolve(
            Object.fromEntries(keys.map((k) => [k, mockStorage[k]]))
          )
        ),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(mockStorage, items);
          return Promise.resolve();
        }),
      },
    },
  });
  // Clear storage
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
});

describe('useGifSettings', () => {
  it('returns default settings initially', () => {
    const { result } = renderHook(() => useGifSettings());
    expect(result.current.settings).toEqual(DEFAULT_GIF_SETTINGS);
  });

  it('updateSettings merges partial settings', () => {
    const { result } = renderHook(() => useGifSettings());

    act(() => {
      result.current.updateSettings({ fps: 5 });
    });

    expect(result.current.settings.fps).toBe(5);
    expect(result.current.settings.duration).toBe(DEFAULT_GIF_SETTINGS.duration);
  });

  it('persists settings to chrome.storage', () => {
    const { result } = renderHook(() => useGifSettings());

    act(() => {
      result.current.updateSettings({ duration: 20 });
    });

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      'gif:settings': expect.objectContaining({ duration: 20 }),
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useGifSettings.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useGifSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_GIF_SETTINGS } from '../types/recording';
import type { GIFSettings } from '../types/recording';

const STORAGE_KEY = 'gif:settings';

export function useGifSettings() {
  const [settings, setSettings] = useState<GIFSettings>(DEFAULT_GIF_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY]).then((result) => {
      if (result[STORAGE_KEY]) {
        setSettings(result[STORAGE_KEY] as GIFSettings);
      }
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<GIFSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      chrome.storage.local.set({ [STORAGE_KEY]: next });
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useGifSettings.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/hooks/useGifSettings.ts src/hooks/__tests__/useGifSettings.test.ts
git commit -m "feat(gif): create useGifSettings hook with chrome.storage persistence"
```

---

## Task 15: Create useGifRecording Hook

**Files:**
- Create: `src/hooks/useGifRecording.ts`

**Step 1: Write the hook**

```typescript
// src/hooks/useGifRecording.ts
import { useState, useEffect, useCallback } from 'react';
import type { GIFSettings, RecordingState, RecordingConfig } from '../types/recording';
import { GIF_QUALITY_COLORS } from '../types/recording';

const INITIAL_STATE: RecordingState = {
  isRecording: false,
  isEncoding: false,
  elapsed: 0,
  frameCount: 0,
  encodingProgress: 0,
};

export function useGifRecording() {
  const [state, setState] = useState<RecordingState>(INITIAL_STATE);

  // Sync recording state on mount (handles side panel close/reopen during recording)
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'GIF_RECORDING_STATUS' })
      .then((res: { success?: boolean; isRecording?: boolean; isEncoding?: boolean }) => {
        if (res?.isRecording) {
          setState((prev) => ({ ...prev, isRecording: true }));
        } else if (res?.isEncoding) {
          setState((prev) => ({ ...prev, isEncoding: true }));
        }
      })
      .catch(() => { /* background not ready or no recording in progress */ });
  }, []);

  useEffect(() => {
    const handleMessage = (message: { action: string; [key: string]: unknown }) => {
      if (message.action === 'GIF_RECORDING_PROGRESS') {
        setState((prev) => ({
          ...prev,
          elapsed: message.elapsed as number,
          frameCount: message.frameCount as number,
        }));
      }

      if (message.action === 'GIF_ENCODING_PROGRESS') {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          isEncoding: true,
          encodingProgress: message.percent as number,
        }));
      }

      if (message.action === 'GIF_ENCODE_COMPLETE') {
        setState(INITIAL_STATE);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const startRecording = useCallback(async (settings: GIFSettings) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.windowId) return;

    // Query actual viewport dimensions from content script
    // (content/index.ts already has GET_PAGE_DIMENSIONS handler)
    let aspectRatio = 9 / 16; // fallback: 16:9
    try {
      const dimRes = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_DIMENSIONS' });
      if (dimRes?.dimensions?.viewportWidth && dimRes?.dimensions?.viewportHeight) {
        aspectRatio = dimRes.dimensions.viewportHeight / dimRes.dimensions.viewportWidth;
      }
    } catch { /* use fallback */ }

    const config: RecordingConfig = {
      tabId: tab.id,
      windowId: tab.windowId,
      width: settings.width,
      height: Math.round(settings.width * aspectRatio),
      fps: settings.fps,
      maxDuration: settings.duration,
      maxColors: GIF_QUALITY_COLORS[settings.quality],
    };

    setState({
      isRecording: true,
      isEncoding: false,
      elapsed: 0,
      frameCount: 0,
      encodingProgress: 0,
    });

    await chrome.runtime.sendMessage({
      action: 'GIF_RECORDING_START',
      config,
    });
  }, []);

  const stopRecording = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isRecording: false,
      isEncoding: true,
      encodingProgress: 0,
    }));

    await chrome.runtime.sendMessage({ action: 'GIF_RECORDING_STOP' });
  }, []);

  return { state, startRecording, stopRecording };
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useGifRecording.ts
git commit -m "feat(gif): create useGifRecording hook for recording state management"
```

---

## Task 16: Create GifRecordingTab Component

**Files:**
- Create: `src/components/Screenshot/GifRecordingTab.tsx`

**Step 1: Write the component**

```tsx
// src/components/Screenshot/GifRecordingTab.tsx
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useGifSettings } from '@/hooks/useGifSettings';
import { useGifRecording } from '@/hooks/useGifRecording';
import { estimateGifSize } from '@/utils/gif/estimateGifSize';

export function GifRecordingTab() {
  const { settings, updateSettings } = useGifSettings();
  const { state, startRecording, stopRecording } = useGifRecording();

  return (
    <div className="p-4 space-y-4">
      {/* Record Button */}
      {!state.isRecording && !state.isEncoding && (
        <Button
          className="w-full h-12 text-base gap-2"
          variant="destructive"
          onClick={() => startRecording(settings)}
        >
          <span className="w-3 h-3 rounded-full bg-white" />
          Record Viewport
        </Button>
      )}

      {/* Recording Status Bar */}
      {state.isRecording && (
        <div className="flex items-center gap-3 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="font-medium">Recording...</span>
          <span className="tabular-nums">
            {Math.floor(state.elapsed)}s / {settings.duration}s
          </span>
          <span className="text-xs opacity-75">{state.frameCount} frames</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopRecording}
            className="ml-auto text-destructive-foreground hover:bg-white/20"
          >
            ■ Stop
          </Button>
        </div>
      )}

      {/* Encoding Progress Bar */}
      {state.isEncoding && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Encoding GIF... {state.encodingProgress}%</span>
          </div>
          <Progress value={state.encodingProgress} />
        </div>
      )}

      {/* Settings (always visible when not recording) */}
      {!state.isRecording && !state.isEncoding && (
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Recording Settings
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Duration</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {settings.duration}s
              </span>
            </div>
            <Slider
              min={3}
              max={30}
              step={1}
              value={[settings.duration]}
              onValueChange={([v]) => {
                if (v !== undefined) updateSettings({ duration: v });
              }}
            />
          </div>

          {/* FPS */}
          <div className="space-y-1">
            <Label className="text-xs">Frame Rate</Label>
            <Select
              value={String(settings.fps)}
              onValueChange={(v) => updateSettings({ fps: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 FPS — Smaller file</SelectItem>
                <SelectItem value="10">10 FPS — Balanced</SelectItem>
                <SelectItem value="15">15 FPS — Smooth (default)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality */}
          <div className="space-y-1">
            <Label className="text-xs">Quality</Label>
            <Select
              value={settings.quality}
              onValueChange={(v) =>
                updateSettings({ quality: v as 'low' | 'medium' | 'high' })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — 64 colors, fast</SelectItem>
                <SelectItem value="medium">Medium — 128 colors</SelectItem>
                <SelectItem value="high">High — 256 colors, best</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Width */}
          <div className="space-y-1">
            <Label className="text-xs">Output Width</Label>
            <Select
              value={String(settings.width)}
              onValueChange={(v) => updateSettings({ width: Number(v) as 320 | 640 | 800 })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="320">320px</SelectItem>
                <SelectItem value="640">640px (default)</SelectItem>
                <SelectItem value="800">800px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated file size hint */}
          <div className="text-[10px] text-muted-foreground text-center pt-2">
            Estimated: ~{estimateGifSize(settings)}MB
            {' '}· {settings.duration * settings.fps} frames
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/Screenshot/GifRecordingTab.tsx
git commit -m "feat(gif): create GifRecordingTab component with settings UI"
```

---

## Task 17: Create ScreenshotTab Component (Refactored from ScreenshotPanel)

**Files:**
- Create: `src/components/Screenshot/ScreenshotTab.tsx`

**Step 1: Extract ScreenshotPanel content into ScreenshotTab**

Copy the logic from `ScreenshotPanel.tsx` but remove the outer header (since CapturePanel provides it). Use shadcn/ui Tabs for the Gallery/Settings sub-tabs:

```tsx
// src/components/Screenshot/ScreenshotTab.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CaptureMode,
  Screenshot,
  ScreenshotSettings,
} from '../../types/screenshot';
import {
  SCREENSHOT_MESSAGE_ACTIONS,
  ScreenshotMessage,
} from '../../constants/screenshotMessages';
// These components use `export default` — must use default imports (not named)
import ScreenshotGallery from './ScreenshotGallery';
import ScreenshotSettingsComponent from './ScreenshotSettings';
import CaptureButton from './CaptureButton';

export function ScreenshotTab() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [settings, setSettings] = useState<ScreenshotSettings>({
    defaultFormat: 'png',
    quality: 0.92,
    captureMode: 'element',
    enableAnnotations: true,
    autoDownload: false,
    includeCursor: false,
  } as ScreenshotSettings);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureComplete = useCallback((screenshot: Screenshot) => {
    setScreenshots((prev) => [screenshot, ...prev]);
    setSelectedScreenshot(screenshot);
    setIsCapturing(false);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      const [screenshotsResult, settingsResult] = await Promise.all([
        chrome.storage.local.get('screenshots'),
        chrome.storage.local.get('screenshot-settings'),
      ]);
      setScreenshots((screenshotsResult.screenshots as Screenshot[]) || []);
      if (settingsResult['screenshot-settings']) {
        setSettings(settingsResult['screenshot-settings'] as ScreenshotSettings);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const handleMessage = (message: ScreenshotMessage) => {
      if (message.action === SCREENSHOT_MESSAGE_ACTIONS.CAPTURE_COMPLETE) {
        handleCaptureComplete(message.screenshot as Screenshot);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleCaptureComplete]);

  const handleCapture = useCallback(
    async (mode: CaptureMode) => {
      setIsCapturing(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: SCREENSHOT_MESSAGE_ACTIONS.START_CAPTURE,
          mode,
          format: settings.defaultFormat,
          quality: settings.quality,
          enableAnnotations: settings.enableAnnotations,
        } as ScreenshotMessage);
      }
    },
    [settings],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const updated = screenshots.filter((s) => s.id !== id);
      setScreenshots(updated);
      await chrome.storage.local.set({ screenshots: updated });
      if (selectedScreenshot?.id === id) {
        setSelectedScreenshot(null);
      }
    },
    [screenshots, selectedScreenshot],
  );

  const handleDownload = useCallback(async (screenshot: Screenshot) => {
    const link = document.createElement('a');
    link.href = screenshot.dataUrl;
    link.download = `screenshot-${screenshot.id}.${screenshot.format}`;
    link.click();
  }, []);

  const handleCopyToClipboard = useCallback(async (screenshot: Screenshot) => {
    try {
      const blob = await fetch(screenshot.dataUrl).then((r) => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const handleSettingsChange = useCallback(async (newSettings: ScreenshotSettings) => {
    setSettings(newSettings);
    await chrome.storage.local.set({ 'screenshot-settings': newSettings });
  }, []);

  return (
    <div className="flex flex-col">
      {/* Capture Buttons */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <CaptureButton mode="element" isCapturing={isCapturing} onCapture={handleCapture} disabled={isCapturing} />
        <CaptureButton mode="area" isCapturing={isCapturing} onCapture={handleCapture} disabled={isCapturing} />
        <CaptureButton mode="full-page" isCapturing={isCapturing} onCapture={handleCapture} disabled={isCapturing} />
      </div>

      {/* Sub-tabs: Gallery | Settings */}
      <Tabs defaultValue="gallery" className="flex-1">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="gallery" className="flex-1 text-xs">
              Gallery
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="gallery" className="p-4">
          <ScreenshotGallery
            screenshots={screenshots}
            selected={selectedScreenshot}
            onSelect={setSelectedScreenshot}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onCopyToClipboard={handleCopyToClipboard}
          />
        </TabsContent>
        <TabsContent value="settings" className="p-4">
          <ScreenshotSettingsComponent settings={settings} onChange={handleSettingsChange} />
        </TabsContent>
      </Tabs>

      {/* Capturing Status */}
      {isCapturing && (
        <div className="flex items-center justify-center px-4 py-2 bg-muted text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Capturing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/Screenshot/ScreenshotTab.tsx
git commit -m "feat(gif): create ScreenshotTab (refactored from ScreenshotPanel)"
```

---

## Task 18: Create CapturePanel (Top-level Tab Container)

**Files:**
- Create: `src/components/Screenshot/CapturePanel.tsx`

**Step 1: Write the component**

```tsx
// src/components/Screenshot/CapturePanel.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ScreenshotTab } from './ScreenshotTab';
import { GifRecordingTab } from './GifRecordingTab';

interface CapturePanelProps {
  onToggle: () => void;
}

export function CapturePanel({ onToggle }: CapturePanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Capture
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
          비활성화
        </Button>
      </div>

      {/* Top-level Tabs: Screenshot | GIF Recording */}
      <Tabs defaultValue="screenshot" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="screenshot" className="flex-1 text-xs">
              Screenshot
            </TabsTrigger>
            <TabsTrigger value="gif" className="flex-1 text-xs">
              GIF Recording
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="screenshot" className="mt-0 flex-1">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <ScreenshotTab />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="gif" className="mt-0 flex-1">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <GifRecordingTab />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/Screenshot/CapturePanel.tsx
git commit -m "feat(gif): create CapturePanel with Screenshot/GIF tabs"
```

---

## Task 19: Update ToolRouter to Use CapturePanel

**Files:**
- Modify: `src/sidepanel/components/ToolRouter.tsx`

**Step 1: Add import**

At the top of `ToolRouter.tsx`, add:

```typescript
import { CapturePanel } from '../../components/Screenshot/CapturePanel';
```

**Step 2: Replace screenshot case**

Replace the existing `ScreenshotPanel` function definition (lines ~138-158) — it will no longer be needed. Then replace the case:

```tsx
    case 'screenshot':
      return (
        <div className="mt-6 -m-4">
          <CapturePanel onToggle={toolProps.onToggle} />
        </div>
      );
```

**Step 3: Remove the unused inline ScreenshotPanel function**

Delete the `function ScreenshotPanel(...)` block (lines 139-158 in current code) since it's replaced by CapturePanel.

**Step 4: Type check**

Run: `tsc -b`
Expected: No errors

**Step 5: Build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/sidepanel/components/ToolRouter.tsx
git commit -m "feat(gif): replace screenshot mini-card with CapturePanel in ToolRouter"
```

---

## Task 20: Update Barrel Exports

**Files:**
- Modify: `src/components/Screenshot/index.ts`

**Step 1: Add new exports and handle dead code**

Update `src/components/Screenshot/index.ts`:

```typescript
/**
 * Screenshot Components Index
 */

/** @deprecated Use CapturePanel + ScreenshotTab instead */
export { default as ScreenshotPanel } from './ScreenshotPanel';
export { default as CaptureButton } from './CaptureButton';
export { default as ScreenshotGallery } from './ScreenshotGallery';
export { default as ScreenshotSettings } from './ScreenshotSettings';
export { default as ScreenshotEditor } from './ScreenshotEditor';
export { CapturePanel } from './CapturePanel';
export { ScreenshotTab } from './ScreenshotTab';
export { GifRecordingTab } from './GifRecordingTab';

// NOTE: RecordingPanel.tsx is NOT exported — it is superseded by
// GifRecordingTab which provides richer state (recording + encoding + settings).
// RecordingPanel.tsx can be deleted in a follow-up cleanup.
```

**Step 1b: Mark RecordingPanel.tsx as deprecated**

Add a deprecation notice at the top of `src/components/Screenshot/RecordingPanel.tsx`:

```typescript
/**
 * @deprecated Superseded by GifRecordingTab which integrates
 * recording status, encoding progress, and settings in one component.
 * This file can be safely deleted — it has no importers.
 */
```

**Step 2: Type check**

Run: `tsc -b`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/Screenshot/index.ts
git commit -m "feat(gif): update barrel exports with new capture components"
```
