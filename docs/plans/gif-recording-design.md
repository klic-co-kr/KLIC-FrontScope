# GIF Recording Feature Design

> Date: 2026-02-11 (revised 2026-02-12)
> Status: Draft v2
> Feature: Screen GIF recording for KLIC-Tool Chrome Extension
> Reference: [ShareX GIF Recording](https://github.com/ShareX/ShareX) architecture analysis

## Overview

현재 스크린샷 기능은 정지 이미지 캡처만 지원합니다. 이 문서는 화면 녹화(GIF) 기능을 추가하기 위한 설계입니다.

### Requirements

- 화면 녹화 시작/정지 기능
- 녹화 설정 (시간, 프레임 레이트, 품질)
- GIF 생성 및 다운로드
- 녹화 중 UI 상태 표시
- Chrome Extension MV3 환경 제약 준수

---

## 1. 기술 제약사항

### Chrome Extension MV3 제약

| 항목 | 제약 | 해결책 |
|------|------|----------|
| Service Worker (Background) | **DOM 접근 불가** — `document.createElement`, `Canvas`, `Image` 등 사용 불가 | Offscreen Document에 DOM 작업 위임 |
| `chrome.tabs.captureVisibleTab()` | data URL(스크린샷) 반환, 스트림이 아님 | `setInterval`로 주기적 호출하여 프레임 수집 |
| Chrome Messaging | **Blob/ArrayBuffer 직렬화 불가** — JSON만 전달 가능 | data URL(base64 문자열)로 프레임 전달 |
| Content Script | `chrome.tabs`/`chrome.downloads` 접근 불가 | Background에 메시지 위임 |
| Offscreen Document | 최대 1개만 생성 가능, reason 필수 | `DOM_PARSER` reason으로 생성, 재사용 |

### 필요한 추가 퍼미션 (현재 manifest에 없음)

```json
{
  "permissions": [
    "offscreen",
    "downloads"
  ]
}
```

> `chrome.tabs.captureVisibleTab()`은 기존 `host_permissions: ["<all_urls>"]`로 커버됨.

### GIF 인코딩 옵션 (재평가)

| 방법 | 번들 크기 | 기능 | 추천 |
|------|-----------|------|------|
| **`gifenc`** (mattdesl) | ~8KB | LZW + Octree 양자화 + 디더링 | **권장** |
| `modern-gif` | ~15KB | Web Worker 지원, 스트리밍 | 대안 |
| `gif.js` | ~200KB | 풀 기능, Web Worker | 번들 과대 |
| 순수 구현 | 0KB | LZW + Octree 직접 구현 필요 (1,000줄+) | 비현실적 |

**결론:** **`gifenc`** (~8KB) 사용. ShareX가 Octree 양자화 + LZW를 사용하는 것과 동일한 알고리즘을 제공하며, 번들 영향 최소.

> ShareX 참고: ShareX는 2-pass 접근 (무손실 녹화 → 후처리 GIF 인코딩)으로 실시간 캡처와 품질 인코딩을 분리. 이 패턴을 Chrome Extension에도 적용 — 프레임 수집 단계와 GIF 인코딩 단계를 분리.

---

## 2. 아키텍처

### ShareX에서 차용한 핵심 패턴

| ShareX 패턴 | Chrome Extension 적용 |
|---|---|
| 2-pass (무손실 MP4 녹화 → FFmpeg GIF 변환) | 프레임 data URL 수집 → Offscreen Document에서 GIF 인코딩 |
| Octree 색상 양자화 (256색) | `gifenc`의 Octree quantize 사용 |
| Producer-Consumer + HardDiskCache | 프레임별 스트리밍 인코딩 (전체 배열 보관 안함) |
| FFmpeg palettegen `stats_mode=full` | 첫 N프레임 샘플링으로 글로벌 팔레트 생성 |
| 기본 15 FPS (GIF 전용) | 동일 적용 |
| Sierra Lite 디더링 기본값 | `gifenc` 디더링 옵션 활용 |

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        Side Panel                           │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Record Btn  │  │  Recording...   │  │  GIF Settings │  │
│  │  (Start)     │  │  ● 3.2s / 10s  │  │  FPS: 15      │  │
│  │              │  │  [Stop]         │  │  Quality: Med  │  │
│  └──────────────┘  └─────────────────┘  └───────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ chrome.runtime.sendMessage
                             ▼
┌────────────────────────────────────────────────────────────┐
│                   Background (Service Worker)               │
│  - GIF_RECORDING_START → setInterval 프레임 캡처 시작       │
│  - chrome.tabs.captureVisibleTab() → data URL 프레임        │
│  - 프레임을 Offscreen Document에 전달                       │
│  - GIF_RECORDING_STOP → 인코딩 완료 대기 → downloads        │
│  - chrome.offscreen.createDocument() 관리                   │
└──────────────┬─────────────────────────────┬───────────────┘
               │                             │
               │ chrome.runtime.sendMessage  │ chrome.tabs.sendMessage
               ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   Offscreen Document      │  │   Content Script              │
│  - Canvas + Image 디코딩  │  │  - 녹화 영역 bounds 수집      │
│  - gifenc 인코딩           │  │  - 녹화 중 indicator 표시     │
│  - 프레임별 스트리밍 처리  │  │  - element hover overlay     │
│  - 완성된 GIF data URL 반환│  └──────────────────────────────┘
└──────────────────────────┘
```

---

## 3. 데이터 흐름

### Phase A: 프레임 수집 (실시간)

```
1. Side Panel → Background: GIF_RECORDING_START { config, tabId }
2. Background → Offscreen Document 생성 (없으면)
3. Background → Content Script: RECORDING_STARTED (indicator 표시)
4. Background: setInterval(1000/fps) 시작
   ├── 매 tick: chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 80 })
   ├── data URL → Offscreen Document: ADD_FRAME { dataUrl, index }
   └── Side Panel: GIF_RECORDING_PROGRESS { elapsed, frameCount }
5. 종료 조건: 사용자 Stop 또는 maxDuration 도달
```

### Phase B: GIF 인코딩 (후처리, ShareX 2-pass 패턴)

```
1. Background → Offscreen Document: ENCODE_GIF { fps, width, height, quality }
2. Offscreen Document:
   ├── Canvas에 각 프레임 data URL → drawImage → getImageData
   ├── gifenc으로 프레임별 양자화 + LZW 인코딩 (스트리밍)
   ├── 인코딩 진행률 → Background → Side Panel: ENCODING_PROGRESS { percent }
   └── 완성된 GIF → Uint8Array → data URL
3. Offscreen Document → Background: ENCODE_COMPLETE { gifDataUrl }
4. Background: chrome.downloads.download({ url: gifDataUrl, filename, saveAs: true })
5. Background → Content Script: RECORDING_ENDED (indicator 제거)
```

### 왜 2-pass인가 (ShareX에서 학습)

ShareX는 녹화 중에는 `ultrafast` + `qp=0` (무손실, CPU 최소) 으로 캡처하고, 녹화 종료 후 `palettegen` + `paletteuse`로 고품질 GIF 변환을 수행. 실시간 캡처와 품질 인코딩을 분리하여:

- 프레임 드랍 최소화 (캡처 중 인코딩 부하 없음)
- 글로벌 팔레트 생성 가능 (모든 프레임 색상 분석)
- 인코딩 시간 제약 없이 최적 품질 달성

---

## 4. UI 설계

### 현재 상태 분석

**ToolRouter.tsx (L47-48, L139-158):** screenshot 도구 선택 시 **미니 상태 카드**만 렌더링. `src/components/Screenshot/ScreenshotPanel.tsx`의 풀 패널은 사이드 패널에서 미사용 상태.

**ScreenshotPanel.tsx:** Gallery/Settings 탭을 수동 `<button>`으로 전환. 3개의 `CaptureButton` (element, area, full-page) 포함.

**기존 패턴:** CssScannerPanel, SettingsPanel에서 shadcn/ui `Tabs` 컴포넌트로 탭 전환 구현됨.

### 탭 기반 통합 아키텍처

Screenshot 도구를 **상위 탭** 2개로 분리하여 기존 스크린샷과 GIF 녹화를 공존:

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────┐ ┌─────────────────────────┐│
│  │  📷 Screenshot  │ │  🔴 GIF Recording       ││
│  │  (active tab)   │ │                         ││
│  └─────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────┤
│                                                 │
│  [Screenshot 탭 콘텐츠]                          │
│  ┌─────────────────────────────────────────┐    │
│  │  [Element] [Area] [Full Page]  ← 캡처버튼│    │
│  └─────────────────────────────────────────┘    │
│  ┌──────────┐ ┌──────────┐                      │
│  │ Gallery  │ │ Settings │  ← 하위 탭            │
│  └──────────┘ └──────────┘                      │
│  ┌─────────────────────────────────────────┐    │
│  │ 갤러리 / 설정 콘텐츠                      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ── OR ──                                       │
│                                                 │
│  [GIF Recording 탭 콘텐츠]                       │
│  ┌─────────────────────────────────────────┐    │
│  │  [▶ Record Viewport]  ← 녹화 시작 버튼   │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  Duration: [━━━━●━━━] 10s               │    │
│  │  FPS:      [15 FPS (Smooth) ▼]          │    │
│  │  Quality:  [Medium — 128 colors ▼]      │    │
│  │  Width:    [640px ▼]                    │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │  ● Recording... 3.2s / 10s  [■ Stop]   │    │← 녹화 중 상태바
│  │  Encoding GIF... 45% ━━━●━━━            │    │← 인코딩 중 상태바
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### ToolRouter 변경

현재 ToolRouter의 미니 카드를 **풀 패널 컴포넌트**로 교체:

```tsx
// src/sidepanel/components/ToolRouter.tsx
// Before:
case 'screenshot':
  return <ScreenshotPanel {...toolProps} />;  // 미니 카드

// After:
case 'screenshot':
  return (
    <div className="mt-6 -m-4">
      <CapturePanel onToggle={toolProps.onToggle} />
    </div>
  );
```

### CapturePanel — 최상위 탭 컴포넌트 (신규)

```tsx
// src/components/Screenshot/CapturePanel.tsx
// CssScannerPanel 패턴 참고 — shadcn/ui Tabs + ScrollArea

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
              📷 Screenshot
            </TabsTrigger>
            <TabsTrigger value="gif" className="flex-1 text-xs">
              🔴 GIF Recording
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

### ScreenshotTab — 기존 스크린샷 기능 (리팩토링)

기존 `ScreenshotPanel.tsx`의 콘텐츠를 탭 내부 컴포넌트로 추출:

```tsx
// src/components/Screenshot/ScreenshotTab.tsx
// 기존 ScreenshotPanel.tsx에서 header 제거, 콘텐츠만 추출

export function ScreenshotTab() {
  // ... 기존 ScreenshotPanel 로직 (state, handlers) 그대로 유지

  return (
    <div className="flex flex-col">
      {/* Capture Buttons — 기존 CaptureButton 3개 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <CaptureButton mode="element" ... />
        <CaptureButton mode="area" ... />
        <CaptureButton mode="full-page" ... />
      </div>

      {/* Sub-tabs: Gallery | Settings */}
      <Tabs defaultValue="gallery" className="flex-1">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="gallery" className="flex-1 text-xs">Gallery</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs">Settings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="gallery" className="p-4">
          <ScreenshotGallery ... />
        </TabsContent>
        <TabsContent value="settings" className="p-4">
          <ScreenshotSettingsComponent ... />
        </TabsContent>
      </Tabs>

      {/* Capturing Status */}
      {isCapturing && <CaptureStatusBar />}
    </div>
  );
}
```

### GifRecordingTab — GIF 녹화 전체 UI (신규)

```tsx
// src/components/Screenshot/GifRecordingTab.tsx

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useGifSettings } from '@/hooks/useGifSettings';
import { useGifRecording } from '@/hooks/useGifRecording';

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
          <span className="tabular-nums">{Math.floor(state.elapsed)}s / {settings.duration}s</span>
          <span className="text-xs opacity-75">{state.frameCount} frames</span>
          <Button variant="ghost" size="sm" onClick={stopRecording} className="ml-auto">
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
              <span className="text-xs font-mono text-muted-foreground">{settings.duration}s</span>
            </div>
            <Slider
              min={3} max={30} step={1}
              value={[settings.duration]}
              onValueChange={([v]) => updateSettings({ duration: v })}
            />
          </div>

          {/* FPS */}
          <div className="space-y-1">
            <Label className="text-xs">Frame Rate</Label>
            <Select value={String(settings.fps)} onValueChange={(v) => updateSettings({ fps: Number(v) })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
            <Select value={settings.quality} onValueChange={(v) => updateSettings({ quality: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
            <Select value={String(settings.width)} onValueChange={(v) => updateSettings({ width: Number(v) })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
            · {settings.duration * settings.fps} frames
          </div>
        </div>
      )}
    </div>
  );
}
```

### Custom Hooks (신규)

```typescript
// src/hooks/useGifSettings.ts
// chrome.storage.local 'gif:settings' 키로 설정 영속화

export function useGifSettings() {
  const [settings, setSettings] = useState<GIFSettings>(DEFAULT_GIF_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get('gif:settings').then(result => {
      if (result['gif:settings']) setSettings(result['gif:settings']);
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<GIFSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      chrome.storage.local.set({ 'gif:settings': next });
      return next;
    });
  }, []);

  return { settings, updateSettings };
}

// src/hooks/useGifRecording.ts
// Background와 메시지 통신으로 녹화 상태 관리

export function useGifRecording() {
  const [state, setState] = useState<RecordingState>({ ... });

  // GIF_RECORDING_PROGRESS / ENCODING_PROGRESS 메시지 수신
  // startRecording → chrome.runtime.sendMessage({ action: 'GIF_RECORDING_START', config })
  // stopRecording → chrome.runtime.sendMessage({ action: 'GIF_RECORDING_STOP' })

  return { state, startRecording, stopRecording };
}
```

---

## 5. 기술 구현

### A. Offscreen Document — GIF 인코딩 처리

```html
<!-- public/offscreen.html -->
<!DOCTYPE html>
<html><head><title>KLIC Offscreen</title></head>
<body><script src="assets/offscreen.js"></script></body>
</html>
```

```typescript
// src/offscreen/index.ts
// Offscreen Document — DOM 접근 가능, gifenc으로 GIF 인코딩

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

interface FrameData {
  dataUrl: string;
  index: number;
}

const frames: FrameData[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ADD_FRAME') {
    frames.push({ dataUrl: message.dataUrl, index: message.index });
    sendResponse({ success: true, frameCount: frames.length });
    return true;
  }

  if (message.action === 'ENCODE_GIF') {
    encodeGif(message.config)
      .then(gifDataUrl => sendResponse({ success: true, gifDataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // async response
  }

  if (message.action === 'CLEAR_FRAMES') {
    frames.length = 0;
    canvas = null;
    ctx = null;
    sendResponse({ success: true });
    return true;
  }
});

async function encodeGif(config: {
  width: number;
  height: number;
  fps: number;
  maxColors: number;
}): Promise<string> {
  const { width, height, fps, maxColors } = config;
  const delay = Math.round(1000 / fps);

  // Setup canvas for decoding data URLs
  canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d')!;

  const gif = GIFEncoder();

  // Sort frames by index
  frames.sort((a, b) => a.index - b.index);

  for (let i = 0; i < frames.length; i++) {
    const imageData = await decodeFrame(frames[i].dataUrl, width, height);
    const palette = quantize(imageData.data, maxColors);
    const index = applyPalette(imageData.data, palette);
    gif.writeFrame(index, width, height, { palette, delay });

    // Report progress
    chrome.runtime.sendMessage({
      action: 'ENCODING_PROGRESS',
      percent: Math.round(((i + 1) / frames.length) * 100),
    });
  }

  gif.finish();
  const bytes = gif.bytes();

  // Convert to data URL for messaging (Blob not transferable via chrome messaging)
  const blob = new Blob([bytes], { type: 'image/gif' });
  return await blobToDataUrl(blob);
}

function decodeFrame(
  dataUrl: string,
  width: number,
  height: number,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx!.drawImage(img, 0, 0, width, height);
      resolve(ctx!.getImageData(0, 0, width, height));
    };
    img.onerror = () => reject(new Error('Failed to decode frame'));
    img.src = dataUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### B. Background Script — 녹화 오케스트레이터

```typescript
// src/background/recording.ts
// Service Worker — DOM 없음. 프레임 캡처 + Offscreen 관리만 담당.

interface RecordingConfig {
  tabId: number;
  windowId: number;
  width: number;
  height: number;
  fps: number;
  maxDuration: number;
  maxColors: number;
}

let recordingInterval: ReturnType<typeof setInterval> | null = null;
let recordingConfig: RecordingConfig | null = null;
let frameIndex = 0;
let startTime = 0;

async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'GIF encoding requires Canvas and Image APIs',
  });
}

async function startRecording(config: RecordingConfig): Promise<void> {
  recordingConfig = config;
  frameIndex = 0;
  startTime = Date.now();

  await ensureOffscreenDocument();

  // Clear previous frames in offscreen
  await chrome.runtime.sendMessage({ action: 'CLEAR_FRAMES' });

  // Notify content script
  chrome.tabs.sendMessage(config.tabId, { action: 'RECORDING_STARTED' });

  // Start periodic frame capture (ShareX 패턴: 캡처와 인코딩 분리)
  const interval = Math.round(1000 / config.fps);
  recordingInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;

    // Duration limit check
    if (elapsed >= config.maxDuration) {
      stopRecording();
      return;
    }

    // Capture frame
    chrome.tabs.captureVisibleTab(
      config.windowId,
      { format: 'jpeg', quality: 80 },
      (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) return;

        // Send frame to offscreen document
        chrome.runtime.sendMessage({
          action: 'ADD_FRAME',
          dataUrl,
          index: frameIndex++,
        });

        // Progress to side panel
        chrome.runtime.sendMessage({
          action: 'GIF_RECORDING_PROGRESS',
          elapsed,
          frameCount: frameIndex,
        });
      },
    );
  }, interval);
}

async function stopRecording(): Promise<void> {
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  if (!recordingConfig) return;

  // Notify content script
  chrome.tabs.sendMessage(recordingConfig.tabId, { action: 'RECORDING_ENDED' });

  // Trigger GIF encoding in offscreen document
  const response = await chrome.runtime.sendMessage({
    action: 'ENCODE_GIF',
    config: {
      width: recordingConfig.width,
      height: recordingConfig.height,
      fps: recordingConfig.fps,
      maxColors: recordingConfig.maxColors,
    },
  });

  if (response?.success && response.gifDataUrl) {
    // Download GIF
    chrome.downloads.download({
      url: response.gifDataUrl,
      filename: `klic-recording-${Date.now()}.gif`,
      saveAs: true,
    });
  }

  // Cleanup
  chrome.runtime.sendMessage({ action: 'CLEAR_FRAMES' });
  recordingConfig = null;
  frameIndex = 0;
}

// Message handler (추가할 부분 — 기존 onMessage.addListener에 통합)
// GIF_RECORDING_START:
//   startRecording(message.config)
//   sendResponse({ success: true })
//   return true;
//
// GIF_RECORDING_STOP:
//   stopRecording().then(() => sendResponse({ success: true }))
//   return true;
```

### C. Content Script — 녹화 Indicator

```typescript
// src/content/recording/recordingIndicator.ts
// 녹화 중 화면에 표시되는 indicator (최소한의 DOM, pointerEvents: none)

let indicatorEl: HTMLElement | null = null;

export function showRecordingIndicator(): void {
  if (indicatorEl) return;

  indicatorEl = document.createElement('div');
  Object.assign(indicatorEl.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  });

  const dot = document.createElement('div');
  Object.assign(dot.style, {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#fff',
    animation: 'klic-rec-pulse 1s ease-in-out infinite',
  });

  const label = document.createElement('span');
  label.textContent = 'REC';

  // Inject keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes klic-rec-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;

  indicatorEl.appendChild(dot);
  indicatorEl.appendChild(label);
  document.head.appendChild(style);
  document.body.appendChild(indicatorEl);
}

export function hideRecordingIndicator(): void {
  indicatorEl?.remove();
  indicatorEl = null;
  document.querySelector('style[data-klic-rec]')?.remove();
}
```

---

## 6. 메시지 프로토콜 (constants/messages.ts에 추가)

```typescript
// GIF Recording — Side Panel ↔ Background
export const GIF_RECORDING_START = 'GIF_RECORDING_START';
export const GIF_RECORDING_STOP = 'GIF_RECORDING_STOP';
export const GIF_RECORDING_PROGRESS = 'GIF_RECORDING_PROGRESS';

// Background ↔ Offscreen Document
export const ADD_FRAME = 'ADD_FRAME';
export const ENCODE_GIF = 'ENCODE_GIF';
export const ENCODING_PROGRESS = 'ENCODING_PROGRESS';
export const ENCODE_COMPLETE = 'ENCODE_COMPLETE';
export const CLEAR_FRAMES = 'CLEAR_FRAMES';

// Background ↔ Content Script
export const RECORDING_STARTED = 'RECORDING_STARTED';
export const RECORDING_ENDED = 'RECORDING_ENDED';
```

---

## 7. Types 정의

```typescript
// src/types/recording.ts

export type GIFQuality = 'low' | 'medium' | 'high';

export const GIF_QUALITY_COLORS: Record<GIFQuality, number> = {
  low: 64,
  medium: 128,
  high: 256,
};

export interface GIFSettings {
  duration: number;                    // 3-30초, 기본 10초
  fps: number;                         // 5, 10, 15, 기본 15 (ShareX 기본값)
  quality: GIFQuality;
  width: 320 | 640 | 800;             // 출력 너비, 기본 640
}

export interface RecordingState {
  isRecording: boolean;
  isEncoding: boolean;
  elapsed: number;                     // 경과 시간 (초)
  frameCount: number;                  // 수집된 프레임 수
  encodingProgress: number;            // 인코딩 진행률 (0-100)
}

export interface RecordingConfig {
  tabId: number;
  windowId: number;
  width: number;
  height: number;
  fps: number;
  maxDuration: number;
  maxColors: number;
}
```

---

## 8. Manifest 변경사항

```diff
  "permissions": [
      "activeTab",
      "scripting",
      "storage",
      "alarms",
      "contextMenus",
-     "sidePanel"
+     "sidePanel",
+     "offscreen",
+     "downloads"
  ],
```

Vite 빌드 설정에 `offscreen.html` 엔트리 포인트 추가 필요:
```typescript
// vite.config.ts — build.rollupOptions.input에 추가
offscreen: resolve(__dirname, 'offscreen.html'),
```

### Screenshot 컴포넌트 마이그레이션

기존 `ScreenshotPanel.tsx`를 탭 기반으로 리팩토링:

```
Before (현재):
  ToolRouter → ScreenshotPanel (미니 카드, ToolRouter 인라인)
  src/components/Screenshot/ScreenshotPanel.tsx (풀 패널, 미사용)

After (변경 후):
  ToolRouter → CapturePanel (풀 패널, 탭 컨테이너)
    ├── ScreenshotTab (기존 ScreenshotPanel 콘텐츠 이동)
    │   ├── CaptureButton ×3 (재사용)
    │   ├── ScreenshotGallery (재사용)
    │   └── ScreenshotSettings (재사용)
    └── GifRecordingTab (신규)
        ├── Record 버튼 + 상태바
        └── GIF 설정 폼
```

| 파일 | 변경 |
|------|------|
| `ScreenshotPanel.tsx` | 삭제 or deprecated — 로직을 `ScreenshotTab.tsx`로 이동 |
| `CapturePanel.tsx` | **신규** — 최상위 탭 컨테이너 |
| `ScreenshotTab.tsx` | **신규** — 기존 스크린샷 UI (로직 이동) |
| `GifRecordingTab.tsx` | **신규** — GIF 녹화 UI |
| `CaptureButton.tsx` | 변경 없음 (재사용) |
| `ScreenshotGallery.tsx` | 변경 없음 (재사용) |
| `ScreenshotSettings.tsx` | 변경 없음 (재사용) |
| `index.ts` (barrel) | `CapturePanel` export 추가 |
| `ToolRouter.tsx` | `ScreenshotPanel` 미니카드 → `CapturePanel` 풀패널 교체 |

---

## 9. 구현 Phase

### Phase 1: Offscreen + 프레임 캡처 인프라 (3일)

| # | 작업 | 파일 | 변경 |
|---|------|------|------|
| 1-1 | Types 정의 | `src/types/recording.ts` | 신규 |
| 1-2 | 메시지 상수 추가 | `src/constants/messages.ts` | 수정 |
| 1-3 | Offscreen Document HTML + 엔트리 | `public/offscreen.html`, `src/offscreen/index.ts` | 신규 |
| 1-4 | gifenc 기반 GIF 인코더 래퍼 | `src/offscreen/gifEncoder.ts` | 신규 |
| 1-5 | Background recording 오케스트레이터 | `src/background/recording.ts` | 신규 |
| 1-6 | Background onMessage 핸들러 통합 | `src/background/index.ts` | 수정 |
| 1-7 | Manifest 퍼미션 추가 | `public/manifest.json` | 수정 |
| 1-8 | Vite 빌드 설정 (offscreen 엔트리) | `vite.config.ts` | 수정 |

### Phase 2: UI + Content Script 연동 (3일)

| # | 작업 | 파일 | 변경 |
|---|------|------|------|
| 2-1 | **CapturePanel** 최상위 탭 컴포넌트 | `src/components/Screenshot/CapturePanel.tsx` | 신규 |
| 2-2 | **ScreenshotTab** — 기존 ScreenshotPanel 콘텐츠 추출 | `src/components/Screenshot/ScreenshotTab.tsx` | 신규 (기존 로직 이동) |
| 2-3 | **GifRecordingTab** — 녹화 UI + 설정 | `src/components/Screenshot/GifRecordingTab.tsx` | 신규 |
| 2-4 | ToolRouter에서 screenshot → CapturePanel 연결 | `src/sidepanel/components/ToolRouter.tsx` | 수정 (미니카드→풀패널) |
| 2-5 | `useGifSettings` hook (chrome.storage 연동) | `src/hooks/useGifSettings.ts` | 신규 |
| 2-6 | `useGifRecording` hook (Background 통신) | `src/hooks/useGifRecording.ts` | 신규 |
| 2-7 | Recording indicator (Content Script) | `src/content/recording/recordingIndicator.ts` | 신규 |
| 2-8 | Content Script 메시지 핸들러 연결 | `src/content/index.ts` | 수정 |
| 2-9 | Screenshot barrel export 업데이트 | `src/components/Screenshot/index.ts` | 수정 |

### Phase 3: 테스트 및 최적화 (2일)

| # | 작업 |
|---|------|
| 3-1 | gifEncoder 단위 테스트 (Offscreen 인코딩 로직) |
| 3-2 | Background recording 오케스트레이터 테스트 |
| 3-3 | 통합 테스트 (전체 녹화 → 인코딩 → 다운로드 플로우) |
| 3-4 | 메모리 프로파일링 (10초/15FPS 기준) |
| 3-5 | 빌드 확인 + Chrome 확장 리로드 검증 |
| 3-6 | FPS 드랍 처리 (ShareX는 미구현, 우리는 타임스탬프 보정) |

**총 예상: 8일** (Phase 2 UI 탭 통합 작업 증가 반영)

---

## 10. 성능 고려사항

### 메모리 계산 (정확한 수치)

```
기본 시나리오: 640×480, 15 FPS, 10초 = 150프레임

프레임 수집 단계 (data URL):
  JPEG data URL ≈ 30-50KB/프레임
  150프레임 × 40KB = ~6MB (Offscreen Document 메모리)

인코딩 단계 (ImageData):
  640×480×4(RGBA) = 1.2MB/프레임 (디코딩 시 순간 사용)
  스트리밍 처리 → 한 번에 1프레임만 메모리에 유지

최대 시나리오: 800×600, 15 FPS, 30초 = 450프레임
  data URL: 450 × 50KB = ~22MB
  출력 GIF: 2-8MB (품질에 따라)
```

### ShareX에서 학습한 메모리 관리 전략

| ShareX 전략 | Chrome Extension 적용 |
|---|---|
| HardDiskCache (디스크 기반 프레임 저장) | data URL 배열 (메모리, 최대 ~22MB) |
| Producer-Consumer BlockingCollection | `setInterval` (producer) + 배열 (buffer) |
| frame 처리 후 즉시 Dispose | 인코딩 후 프레임 data URL 참조 해제 |
| yield return 이터레이터 (1프레임씩 로드) | for 루프에서 1프레임씩 Canvas 디코딩 |

### 제한값

| 항목 | 제한 | 근거 |
|------|------|------|
| 최대 FPS | 15 | `captureVisibleTab()`은 ~60ms 소요, 15FPS(67ms)가 안전 마진 |
| 최대 녹화 시간 | 30초 | 메모리 ~22MB 이내 |
| 최대 출력 너비 | 800px | GIF 파일 크기 적정선 |
| 최대 프레임 수 | 450 (30s × 15fps) | 메모리 + 인코딩 시간 |

### captureVisibleTab 성능 한계

`chrome.tabs.captureVisibleTab()`은 비동기 스크린샷이므로 정확한 FPS 보장 불가. ShareX도 캐시 기반 경로에서 동일 문제가 있으며 (`// Need to handle FPS drops` 주석만 존재, 미구현), 우리는 타임스탬프 기반 프레임 간격 보정을 적용:

```typescript
// 프레임 캡처 시 실제 경과 시간 기록
const actualDelay = Date.now() - lastFrameTime;
const gifDelay = Math.max(Math.round(actualDelay / 10), 2); // GIF delay는 10ms 단위
// gifenc writeFrame에 실제 delay 전달
```

---

## 11. 대안/확장

### Phase 2+ 확장: tabCapture 스트림 방식

현재 설계는 `captureVisibleTab()` (주기적 스크린샷) 기반이지만, 더 부드러운 캡처가 필요할 경우:

```typescript
// Background (Service Worker)
const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });

// Offscreen Document (DOM 접근 가능)
const stream = await navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    mandatory: {
      chromeMediaSource: 'tab',
      chromeMediaSourceId: streamId,
    },
  },
});
// → video element + requestVideoFrameCallback()로 프레임 추출
```

추가 퍼미션 필요: `"tabCapture"`. 구현 복잡도가 높으므로 Phase 2+로 분리.

### WebM 직접 다운로드 옵션

GIF 인코딩 없이 WebM으로 바로 저장하는 옵션도 제공 가능:
- Offscreen Document에서 `MediaRecorder` + `tabCapture` 스트림
- 인코딩 시간 0, 파일 크기 작음
- 단점: GIF처럼 어디서나 재생 불가

---

## References

- [ShareX GIF Recording](https://github.com/ShareX/ShareX) — OctreeQuantizer, AnimatedGifCreator, HardDiskCache 패턴
- [gifenc](https://github.com/mattdesl/gifenc) — ~8KB GIF encoder with quantization
- [Chrome Offscreen Documents](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
- [chrome.tabs.captureVisibleTab()](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab)
- [chrome.tabCapture.getMediaStreamId()](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- [GIF89a Specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt)
