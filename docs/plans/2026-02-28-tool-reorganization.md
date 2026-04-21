# 도구 메뉴 재구성 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 컬러피커를 팔레트에 통합하고, 새로운 컴포넌트 인스펙터 도구를 추가한다.

**Architecture:** 기존 colorPicker 도구를 palette로 통합하여 피커 모드를 추가하고, 새로운 componentInspector 도구를 만들어 React/Vue/Angular/Svelte/HTML 요소를 감지한다.

**Tech Stack:** React 19, TypeScript 5.9, Chrome Extension MV3

---

## Phase 1: 컬러피커 → 팔레트 통합

> **중요**: 참조를 먼저 정리한 후 tools.ts에서 colorPicker를 삭제해야 빌드가 깨지지 않는다.

### Task 1: ToolRouter에서 colorPicker 라우트 삭제

**Files:**
- Modify: `src/sidepanel/components/ToolRouter.tsx`

**Step 1: colorPicker case 삭제**

```typescript
// 다음 case 블록 삭제 (약 119번 라인):
case 'colorPicker':
  return <ColorPickerPanel ... />;
```

**Step 2: palette case에 피커 모드 props 추가**

```typescript
case 'palette':
  return (
    <PalettePanel
      data={toolData.paletteResult}
      onCopy={onCopy}
      isPickerActive={isPickerActive}
      onTogglePicker={handleTogglePicker}
    />
  );
```

**Step 3: Commit**

```bash
git add src/sidepanel/components/ToolRouter.tsx
git commit -m "refactor: remove colorPicker route, add picker props to palette"
```

---

### Task 2: Content Script colorPicker 핸들러를 palette로 통합

**Files:**
- Modify: `src/content/index.ts`

**Step 1: activateTool의 colorPicker case를 palette로 병합**

```typescript
case 'palette':
  // 기존 scanPalette() 호출 유지
  scanPalette();
  if (request.pickerMode) {
    addColorPickerListeners();
    showTranslatedToast('content.colorPickerHint', 'Click anywhere to pick a color.', '#EC4899');
  }
  break;
```

**Step 2: colorPicker case 삭제**

```typescript
// case 'colorPicker' 블록 전체 삭제
```

**Step 3: colorPickerClick 함수를 palettePickerClick으로 수정**

```typescript
async function palettePickerClick(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  const color = window.getComputedStyle(target).backgroundColor;

  // 클립보드에 복사
  await navigator.clipboard.writeText(color);

  // 팔레트에 색상 추가 메시지 전송
  safeSendMessage({
    action: 'TOOL_DATA',
    tool: 'palette',
    data: { type: 'ADD_COLOR', color }
  });

  showTranslatedToast('content.colorCopiedValue', `Color picked: ${color}`, color, { color });
}
```

**Step 4: Commit**

```bash
git add src/content/index.ts
git commit -m "refactor: merge colorPicker handler into palette"
```

---

### Task 3: App.tsx에서 colorPicker 관련 코드 정리

**Files:**
- Modify: `src/sidepanel/App.tsx`

**Step 1: colorPicker 관련 상태/핸들러 제거 또는 palette로 통합**

**Step 2: handleToolClick에서 colorPicker 분기 제거**

**Step 3: 피커 모드 활성화 시 다른 exclusive 도구 비활성화 로직 추가**

```typescript
const handleTogglePicker = async () => {
  if (!isPickerActive) {
    // 피커 활성화 전에 다른 exclusive 도구 비활성화
    // (palette 자체는 exclusive: false지만 피커 모드는 exclusive하게 동작)
    const exclusiveTools = ['textEdit', 'screenshot', 'cssScan', 'tailwind', 'ruler', 'jsInspector', 'gridLayout'];
    for (const tool of exclusiveTools) {
      if (activeTools.includes(tool)) {
        await sendToolMessage(tool, false);
      }
    }
  }
  setIsPickerActive(!isPickerActive);
  await sendToolMessage('palette', true, { pickerMode: !isPickerActive });
};
```

**Step 4: Commit**

```bash
git add src/sidepanel/App.tsx
git commit -m "refactor: remove colorPicker, add picker mode logic to palette"
```

---

### Task 4: conflictPrevention에서 colorPicker 제거

**Files:**
- Modify: `src/content/managers/conflictPrevention.ts`

**Step 1: colorPicker 관련 충돌 규칙 제거 또는 palette로 변경**

```typescript
// colorPicker → palette로 변경
// 참고: palette는 exclusive: false 유지, 피커 모드는 런타임에서 처리
// 충돌 규칙은 그대로 두되, colorPicker를 palette로 이름만 변경하거나
// 아예 제거 (palette는 concurrent 도구이므로)

// 다음 규칙들을 제거 (colorPicker는 더 이상 별도 도구가 아님):
// { tool1: 'textEdit', tool2: 'colorPicker', ... },
// { tool1: 'screenshot', tool2: 'colorPicker', ... },
// { tool1: 'colorPicker', tool2: 'cssScan', ... },
// { tool1: 'colorPicker', tool2: 'tailwind', ... },
// { tool1: 'colorPicker', tool2: 'ruler', ... },
```

**Step 2: Commit**

```bash
git add src/content/managers/conflictPrevention.ts
git commit -m "refactor: remove colorPicker conflict rules"
```

---

### Task 5: hoverHandler에서 colorPicker 제거

**Files:**
- Modify: `src/content/hover/hoverHandler.ts`

**Step 1: colorPickerLabel 등 관련 코드 제거**

- `colorPickerLabel: string;` (약 41번 라인)
- `colorPickerLabel: 'Color Picker',` (약 62번 라인)
- `messages.colorPickerLabel = ...` (약 95번 라인)
- `colorPicker: { label: messages.colorPickerLabel }` (약 126-130번 라인)
- `} else if (activeTool === 'colorPicker') {` (약 473, 718번 라인)
- `safeSendMessage({ action: 'TOOL_DATA', tool: 'colorPicker', ... })` (약 721번 라인)

**Step 2: Commit**

```bash
git add src/content/hover/hoverHandler.ts
git commit -m "refactor: remove colorPicker from hoverHandler"
```

---

### Task 6: 메시지 액션 정리

**Files:**
- Modify: `src/constants/messages.ts`

**Step 1: COLOR_PICKER_* 액션을 PALETTE_*로 변경 (또는 그대로 사용하되 주석 추가)**

```typescript
// 팔레트 (컬러피커 통합)
// 기존 COLOR_PICKER_* 액션은 palette 도구에서 사용
PALETTE_TOGGLE_PICKER: 'PALETTE_TOGGLE_PICKER',
PALETTE_PICK_COLOR: 'PALETTE_PICK_COLOR',
PALETTE_ADD_COLOR: 'PALETTE_ADD_COLOR',
PALETTE_SCAN: 'PALETTE_SCAN',
```

**Step 2: 기존 COLOR_PICKER_* 액션은 deprecated 표시 또는 삭제**

```typescript
// @deprecated - PALETTE_* 액션 사용 권장
COLOR_PICKER_PICK: 'COLOR_PICKER_PICK',
// ...
```

**Step 3: Commit**

```bash
git add src/constants/messages.ts
git commit -m "refactor: migrate COLOR_PICKER actions to PALETTE"
```

---

### Task 7: tools.ts에서 colorPicker 삭제 (마지막)

**Files:**
- Modify: `src/sidepanel/constants/tools.ts`

**Step 1: ToolType에서 colorPicker 제거**

```typescript
// src/sidepanel/constants/tools.ts
export type ToolType =
  | 'textEdit'
  | 'screenshot'
  // | 'colorPicker'  // 삭제
  | 'cssScan'
  // ...
```

**Step 2: ALL_TOOLS에서 colorPicker 항목 삭제**

```typescript
// 다음 항목 삭제 (약 85-92번 라인):
{
  id: 'colorPicker',
  name: '색상 추출',
  description: '색상 선택',
  icon: PaintBucket,
  category: 'analyze',
  exclusive: true,
  shortcut: 'Ctrl+Shift+C',
},
```

**Step 3: palette 도구 description 수정**

```typescript
{
  id: 'palette',
  name: '팔레트',
  description: '페이지 색상 + 색상 피커',  // 수정
  icon: Palette,
  category: 'analyze',
  exclusive: false,  // 변경 없음! 피커 모드는 런타임에서 처리
},
```

**Step 4: Commit**

```bash
git add src/sidepanel/constants/tools.ts
git commit -m "refactor: remove colorPicker tool definition"
```

---

### Task 8: PalettePanel에 피커 모드 UI 추가

**Files:**
- Modify: `src/sidepanel/components/ToolRouter.tsx` (PalettePanel 함수)

**Step 1: PalettePanel Props 확장**

```typescript
function PalettePanel({
  data,
  onCopy,
  isPickerActive,
  onTogglePicker,
}: {
  data: string[];
  onCopy: (text: string) => Promise<void> | void;
  isPickerActive: boolean;
  onTogglePicker: () => void;
}) {
```

**Step 2: 툴바 UI 추가**

```tsx
// CardContent 시작 부분에 추가:
<div className="flex items-center gap-2 mb-3">
  <Button
    variant={isPickerActive ? 'default' : 'outline'}
    size="sm"
    onClick={onTogglePicker}
    className="gap-1"
  >
    <PaintBucket className="w-4 h-4" />
    {isPickerActive ? '피커 끄기' : '피커 모드'}
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => {/* 스캔 요청 */}}
    className="gap-1"
  >
    <RefreshCw className="w-4 h-4" />
    스캔
  </Button>
</div>
```

**Step 3: Commit**

```bash
git add src/sidepanel/components/ToolRouter.tsx
git commit -m "feat: add picker mode toolbar to PalettePanel"
```

---

### Task 9: i18n 번역 정리

**Files:**
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

**Step 1: tools.colorPicker 번역 키 처리**

- `tools.colorPicker.*` 키를 `tools.palette.*`로 병합하거나 삭제
- 피커 관련 키는 `tools.palette.picker.*`로 이동

**Step 2: Commit**

```bash
git add src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "refactor: migrate colorPicker i18n keys to palette"
```

---

## Phase 2: 컴포넌트 인스펙터 추가

### Task 10: 컴포넌트 타입 정의

**Files:**
- Create: `src/types/component.ts`

**Step 1: 타입 정의 파일 생성**

```typescript
// src/types/component.ts

export type ComponentType = 'react' | 'vue' | 'angular' | 'svelte' | 'web-component' | 'html';

export type FrameworkType = 'react' | 'vue' | 'angular' | 'svelte' | 'next' | 'nuxt' | 'sveltekit' | 'unknown';

export interface ComponentInfo {
  id: string;
  type: ComponentType;
  name: string;
  selector: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  source?: string;
  tagName: string;
  className?: string;
  elementId?: string;
  children: number;
  depth: number;
}

export interface ComponentScanResult {
  framework: FrameworkType;
  metaFramework?: 'next' | 'nuxt' | 'sveltekit';
  components: ComponentInfo[];
  totalElements: number;
  scannedAt: number;
}

export interface ComponentPickerData {
  component: ComponentInfo;
  x: number;
  y: number;
}
```

**Step 2: Commit**

```bash
git add src/types/component.ts
git commit -m "feat: add component inspector types"
```

---

### Task 11: 컴포넌트 인스펙터 메시지 액션 추가

**Files:**
- Modify: `src/constants/messages.ts`

**Step 1: 액션 추가**

```typescript
// 컴포넌트 인스펙터
COMPONENT_TOGGLE_PICKER: 'COMPONENT_TOGGLE_PICKER',
COMPONENT_SCAN: 'COMPONENT_SCAN',
COMPONENT_DATA: 'COMPONENT_DATA',
COMPONENT_PICKER_HOVER: 'COMPONENT_PICKER_HOVER',
```

**Step 2: Commit**

```bash
git add src/constants/messages.ts
git commit -m "feat: add component inspector message actions"
```

---

### Task 12: 프레임워크 감지기 구현

**Files:**
- Create: `src/content/componentInspector/detector.ts`

**Step 1: React 감지 함수**

```typescript
// src/content/componentInspector/detector.ts
import type { ComponentInfo, ComponentType } from '@/types/component';

export function detectReact(element: HTMLElement): ComponentInfo | null {
  // React 18+ 및 17 호환
  const fiberKey = Object.keys(element).find(k =>
    k.startsWith('__reactFiber$') ||
    k.startsWith('__reactInternalInstance$')
  );
  if (!fiberKey) return null;

  const fiber = (element as any)[fiberKey];
  if (!fiber) return null;

  const name = fiber.type?.name || fiber.type?.displayName ||
               (typeof fiber.type === 'string' ? fiber.type : 'Anonymous');

  return {
    id: `react-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'react' as ComponentType,
    name,
    selector: generateSelector(element),
    props: fiber.memoizedProps,
    state: fiber.memoizedState,
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}
```

**Step 2: Vue 감지 함수 (Vue 2/3)**

```typescript
export function detectVue(element: HTMLElement): ComponentInfo | null {
  // Vue 3
  const vueKey = Object.keys(element).find(k => k.startsWith('__vueApp__'));
  if (vueKey) {
    const app = (element as any)[vueKey];
    // Vue 3 컴포넌트 정보 추출
  }

  // Vue 2
  const vue = (element as any).__vue__;
  if (!vue) return null;

  const name = vue.$options?.name || vue.$options?._componentTag || 'Anonymous';

  return {
    id: `vue-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'vue' as ComponentType,
    name,
    selector: generateSelector(element),
    props: vue.$props,
    state: vue.$data,
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}
```

**Step 3: Angular 감지 함수**

```typescript
export function detectAngular(element: HTMLElement): ComponentInfo | null {
  // Angular 버전 속성 확인
  const ngVersion = (document.documentElement as any).getAttribute('ng-version');
  if (!ngVersion) return null;

  // Angular 컴포넌트는 ng-reflect-* 속성을 가짐
  const ngAttributes = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('ng-reflect-'));

  if (ngAttributes.length === 0) return null;

  // 컴포넌트 이름 추출
  const tagName = element.tagName.toLowerCase();
  const name = tagName.includes('-')
    ? tagName
    : element.getAttribute('ng-reflect-name') || 'AngularComponent';

  return {
    id: `angular-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'angular' as ComponentType,
    name,
    selector: generateSelector(element),
    props: ngAttributes.reduce((acc, attr) => {
      acc[attr.name.replace('ng-reflect-', '')] = attr.value;
      return acc;
    }, {} as Record<string, unknown>),
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}
```

**Step 4: Svelte 감지 함수**

```typescript
export function detectSvelte(element: HTMLElement): ComponentInfo | null {
  // Svelte는 svelte-xxx 클래스를 가짐
  const svelteClass = Array.from(element.classList)
    .find(cls => cls.startsWith('svelte-'));

  if (!svelteClass) return null;

  // Svelte 5: __svelte_meta
  const meta = (element as any).__svelte_meta;
  const name = meta?.component?.name || 'SvelteComponent';

  return {
    id: `svelte-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'svelte' as ComponentType,
    name,
    selector: generateSelector(element),
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}
```

**Step 5: Web Components 감지 함수**

```typescript
export function detectWebComponent(element: HTMLElement): ComponentInfo | null {
  // 사용자 정의 엘리먼트인지 확인
  const isCustomElement = element.tagName.includes('-') ||
                          (element as any).shadowRoot !== undefined;

  if (!isCustomElement) return null;

  // 등록된 커스텀 엘리먼트인지 확인
  const tagName = element.tagName.toLowerCase();
  const isRegistered = customElements.get(tagName) !== undefined;

  return {
    id: `web-component-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'web-component' as ComponentType,
    name: tagName,
    selector: generateSelector(element),
    hasShadow: !!(element as any).shadowRoot,
    tagName,
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}
```

**Step 6: HTML 기본 감지 함수 및 통합**

```typescript
export function detectHtml(element: HTMLElement): ComponentInfo {
  return {
    id: `html-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'html' as ComponentType,
    name: element.tagName.toLowerCase(),
    selector: generateSelector(element),
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}

export function detectComponent(element: HTMLElement): ComponentInfo {
  // 우선순위: React > Vue > Angular > Svelte > Web Components > HTML
  return detectReact(element) ||
         detectVue(element) ||
         detectAngular(element) ||
         detectSvelte(element) ||
         detectWebComponent(element) ||
         detectHtml(element);
}

function generateSelector(element: HTMLElement): string {
  if (element.id) return `#${element.id}`;
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(Boolean).join('.');
    if (classes) return `${element.tagName.toLowerCase()}.${classes}`;
  }
  return element.tagName.toLowerCase();
}

function getDepth(element: HTMLElement): number {
  let depth = 0;
  let parent = element.parentElement;
  while (parent) {
    depth++;
    parent = parent.parentElement;
  }
  return depth;
}
```

**Step 7: Commit**

```bash
git add src/content/componentInspector/detector.ts
git commit -m "feat: add framework detector (React, Vue, Angular, Svelte, Web Components)"
```

---

### Task 13: 메타 프레임워크 감지기 구현

**Files:**
- Create: `src/content/componentInspector/metaDetector.ts`

**Step 1: Next.js/Nuxt/SvelteKit 감지**

```typescript
// src/content/componentInspector/metaDetector.ts
import type { FrameworkType } from '@/types/component';

export function detectMetaFramework(): { framework: FrameworkType; metaFramework?: 'next' | 'nuxt' | 'sveltekit' } {
  // Next.js 감지
  if ((window as any).__NEXT_DATA__) {
    return { framework: 'react', metaFramework: 'next' };
  }

  // Nuxt 감지
  if ((window as any).__NUXT__ || (window as any).__VUE_APP__) {
    return { framework: 'vue', metaFramework: 'nuxt' };
  }

  // SvelteKit 감지
  if (document.querySelector('[data-sveltekit]') || (window as any).__sveltekit__) {
    return { framework: 'svelte', metaFramework: 'sveltekit' };
  }

  // Angular 감지
  const ngVersion = (document.documentElement as any).getAttribute('ng-version');
  if (ngVersion) {
    return { framework: 'angular' };
  }

  // React 감지 (기본)
  if (document.querySelector('[data-reactroot], [data-reactid]') ||
      document.querySelector('[id^="react-"], [class*="react-"]')) {
    return { framework: 'react' };
  }

  // Vue 감지 (기본)
  if ((window as any).__VUE__ || document.querySelector('[data-v-]')) {
    return { framework: 'vue' };
  }

  // Svelte 감지 (기본)
  if (document.querySelector('[class*="svelte-"]')) {
    return { framework: 'svelte' };
  }

  return { framework: 'unknown' };
}
```

**Step 2: Commit**

```bash
git add src/content/componentInspector/metaDetector.ts
git commit -m "feat: add meta framework detector (Next.js, Nuxt, SvelteKit)"
```

---

### Task 14: 컴포넌트 스캐너 구현

**Files:**
- Create: `src/content/componentInspector/scanner.ts`

**Step 1: 전체 스캔 함수**

```typescript
// src/content/componentInspector/scanner.ts
import type { ComponentScanResult, ComponentInfo } from '@/types/component';
import { detectComponent } from './detector';
import { detectMetaFramework } from './metaDetector';

export function scanComponents(): ComponentScanResult {
  const { framework, metaFramework } = detectMetaFramework();
  const components: ComponentInfo[] = [];

  // 모든 요소 스캔
  const allElements = document.querySelectorAll('*');
  const seenComponents = new Set<string>();

  allElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;

    const component = detectComponent(el);

    // 중복 제거
    const key = `${component.type}:${component.selector}`;
    if (seenComponents.has(key)) return;
    seenComponents.add(key);

    components.push(component);
  });

  return {
    framework,
    metaFramework,
    components,
    totalElements: allElements.length,
    scannedAt: Date.now(),
  };
}
```

**Step 2: Commit**

```bash
git add src/content/componentInspector/scanner.ts
git commit -m "feat: add component scanner"
```

---

### Task 15: 컴포넌트 인스펙터 Content Script 메인 핸들러

**Files:**
- Create: `src/content/componentInspector/index.ts`

**Step 1: 메인 핸들러 구현**

```typescript
// src/content/componentInspector/index.ts
import { scanComponents } from './scanner';
import { detectComponent } from './detector';
import type { ComponentInfo } from '@/types/component';
import { showTranslatedToast } from '../utils/toast';

let isPickerActive = false;
let hoverOverlay: HTMLDivElement | null = null;

export function activate() {
  isPickerActive = true;
  createOverlay();
  document.addEventListener('mousemove', handleHover, true);
  document.addEventListener('click', handleClick, true);
}

export function deactivate() {
  isPickerActive = false;
  removeOverlay();
  document.removeEventListener('mousemove', handleHover, true);
  document.removeEventListener('click', handleClick, true);
}

export function scan(): ReturnType<typeof scanComponents> {
  return scanComponents();
}

function createOverlay() {
  hoverOverlay = document.createElement('div');
  hoverOverlay.id = 'klic-component-overlay';
  hoverOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #3B82F6;
    background: rgba(59, 130, 246, 0.1);
    z-index: 2147483647;
    transition: all 0.1s ease;
  `;
  document.body.appendChild(hoverOverlay);
}

function removeOverlay() {
  hoverOverlay?.remove();
  hoverOverlay = null;
}

function handleHover(e: MouseEvent) {
  if (!hoverOverlay) return;

  const target = e.target as HTMLElement;
  const rect = target.getBoundingClientRect();

  hoverOverlay.style.top = `${rect.top}px`;
  hoverOverlay.style.left = `${rect.left}px`;
  hoverOverlay.style.width = `${rect.width}px`;
  hoverOverlay.style.height = `${rect.height}px`;
}

function handleClick(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  const component = detectComponent(target);

  // Side Panel로 전송
  chrome.runtime.sendMessage({
    action: 'COMPONENT_DATA',
    data: component,
  });

  showTranslatedToast('content.componentPicked', `Component: ${component.name}`, '#3B82F6');
}

export const componentInspector = {
  activate,
  deactivate,
  scan,
};
```

**Step 2: Commit**

```bash
git add src/content/componentInspector/index.ts
git commit -m "feat: add component inspector content script"
```

---

### Task 16: componentInspector 도구 등록

**Files:**
- Modify: `src/sidepanel/constants/tools.ts`

**Step 1: ToolType에 추가**

```typescript
export type ToolType =
  // ...
  | 'resourceNetwork'
  | 'accessibilityChecker'
  | 'componentInspector';  // 추가
```

**Step 2: ALL_TOOLS에 항목 추가**

```typescript
{
  id: 'componentInspector',
  name: '컴포넌트',
  description: '컴포넌트 구조 분석',
  icon: Boxes,  // lucide-react에서 import
  category: 'analyze',
  exclusive: true,
  shortcut: 'Ctrl+Shift+M',
},
```

**Step 3: lucide-react import 추가**

```typescript
import {
  // ...
  Boxes,  // 추가
} from 'lucide-react';
```

**Step 4: Commit**

```bash
git add src/sidepanel/constants/tools.ts
git commit -m "feat: register componentInspector tool"
```

---

### Task 17: ComponentPanel UI 구현

**Files:**
- Create: `src/components/ComponentInspector/ComponentPanel.tsx`

**Step 1: 메인 패널 컴포넌트**

```typescript
// src/components/ComponentInspector/ComponentPanel.tsx
import { useState } from 'react';
import { Button, Card, CardContent, Badge, ScrollArea } from '@/components/ui';
import { PaintBucket, RefreshCw } from 'lucide-react';
import type { ComponentScanResult, ComponentInfo, ComponentType } from '@/types/component';
import { ComponentItem } from './ComponentItem';

interface ComponentPanelProps {
  data: ComponentScanResult | null;
  isPickerActive: boolean;
  onTogglePicker: () => void;
  onScan: () => void;
  onCopy: (text: string) => Promise<void>;
}

const FRAMEWORK_LABELS: Record<string, string> = {
  react: 'React',
  vue: 'Vue',
  angular: 'Angular',
  svelte: 'Svelte',
  next: 'Next.js',
  nuxt: 'Nuxt',
  sveltekit: 'SvelteKit',
  unknown: 'Unknown',
};

const TYPE_FILTERS: { value: ComponentType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'web-component', label: 'Web' },
  { value: 'html', label: 'HTML' },
];

export function ComponentPanel({
  data,
  isPickerActive,
  onTogglePicker,
  onScan,
  onCopy,
}: ComponentPanelProps) {
  const [filter, setFilter] = useState<ComponentType | 'all'>('all');

  const filteredComponents = data?.components.filter(
    (c) => filter === 'all' || c.type === filter
  );

  return (
    <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4">
        {/* 툴바 */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant={isPickerActive ? 'default' : 'outline'}
            size="sm"
            onClick={onTogglePicker}
          >
            <PaintBucket className="w-4 h-4 mr-1" />
            {isPickerActive ? '피커 끄기' : '피커'}
          </Button>
          <Button variant="outline" size="sm" onClick={onScan}>
            <RefreshCw className="w-4 h-4 mr-1" />
            스캔
          </Button>
        </div>

        {/* 필터 */}
        <div className="flex gap-1 mb-3 flex-wrap">
          {TYPE_FILTERS.map((type) => (
            <Badge
              key={type.value}
              variant={filter === type.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter(type.value)}
            >
              {type.label}
            </Badge>
          ))}
        </div>

        {/* 스캔 결과 요약 */}
        {data && (
          <div className="text-xs text-muted-foreground mb-3">
            {data.framework !== 'unknown' && (
              <>
                감지된 프레임워크: <strong>{FRAMEWORK_LABELS[data.framework]}</strong>
                {data.metaFramework && ` (${FRAMEWORK_LABELS[data.metaFramework]})`}
              </>
            )}
            <span className="ml-2">컴포넌트: {data.components.length}개</span>
          </div>
        )}

        {/* 컴포넌트 목록 */}
        <ScrollArea className="h-[300px] pr-4">
          {filteredComponents?.map((component) => (
            <ComponentItem
              key={component.id}
              component={component}
              onCopy={onCopy}
            />
          ))}
          {!data && (
            <div className="text-muted-foreground text-xs">
              스캔 버튼을 클릭하여 컴포넌트를 분석하세요.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ComponentInspector/ComponentPanel.tsx
git commit -m "feat: add ComponentPanel UI"
```

---

### Task 18: ComponentItem UI 구현

**Files:**
- Create: `src/components/ComponentInspector/ComponentItem.tsx`

**Step 1: 개별 아이템 컴포넌트**

```typescript
// src/components/ComponentInspector/ComponentItem.tsx
import { Badge } from '@/components/ui';
import type { ComponentInfo } from '@/types/component';

const typeIcons: Record<string, string> = {
  react: '⚛️',
  vue: '🟢',
  angular: '🅰️',
  svelte: '🔶',
  'web-component': '🌐',
  html: '📄',
};

const typeColors: Record<string, string> = {
  react: 'text-cyan-500',
  vue: 'text-green-500',
  angular: 'text-red-500',
  svelte: 'text-orange-500',
  'web-component': 'text-blue-500',
  html: 'text-gray-500',
};

interface ComponentItemProps {
  component: ComponentInfo;
  onCopy: (text: string) => Promise<void>;
}

export function ComponentItem({ component, onCopy }: ComponentItemProps) {
  const icon = typeIcons[component.type] || '📄';
  const colorClass = typeColors[component.type] || '';

  return (
    <div
      className="border rounded-lg p-3 mb-2 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onCopy(component.selector)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={colorClass}>{icon}</span>
        <span className="font-medium text-sm truncate">{component.name}</span>
        <Badge variant="outline" className="text-[10px] ml-auto">
          {component.type}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground font-mono truncate">
        {component.selector}
      </div>

      {component.props && Object.keys(component.props).length > 0 && (
        <div className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
          <div className="font-medium mb-1">props:</div>
          <pre className="text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(component.props, null, 2).slice(0, 200)}
            {JSON.stringify(component.props, null, 2).length > 200 && '...'}
          </pre>
        </div>
      )}

      {component.className && (
        <div className="mt-1 text-xs text-muted-foreground truncate">
          <span className="font-medium">class:</span> {component.className}
        </div>
      )}

      <div className="mt-1 text-[10px] text-muted-foreground">
        children: {component.children} | depth: {component.depth}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ComponentInspector/ComponentItem.tsx
git commit -m "feat: add ComponentItem UI"
```

---

### Task 19: ToolRouter에 componentInspector 라우트 추가

**Files:**
- Modify: `src/sidepanel/components/ToolRouter.tsx`

**Step 1: import 추가**

```typescript
import { ComponentPanel } from '@/components/ComponentInspector/ComponentPanel';
```

**Step 2: case 추가**

```typescript
case 'componentInspector':
  return (
    <ComponentPanel
      data={toolData.componentResult}
      isPickerActive={isComponentPickerActive}
      onTogglePicker={handleToggleComponentPicker}
      onScan={handleComponentScan}
      onCopy={onCopy}
    />
  );
```

**Step 3: Commit**

```bash
git add src/sidepanel/components/ToolRouter.tsx
git commit -m "feat: add componentInspector route to ToolRouter"
```

---

### Task 20: Content Script에 componentInspector 핸들러 추가

**Files:**
- Modify: `src/content/index.ts`

**Step 1: import 추가**

```typescript
import { componentInspector } from './componentInspector';
```

**Step 2: activateTool switch에 case 추가**

```typescript
case 'componentInspector':
  if (request.pickerMode) {
    componentInspector.activate();
    showTranslatedToast('content.componentPickerHint', 'Click an element to inspect.', '#3B82F6');
  } else {
    const result = componentInspector.scan();
    safeSendMessage({ action: 'TOOL_DATA', tool: 'componentInspector', data: result });
  }
  break;
```

**Step 3: deactivateTool에 cleanup 추가**

```typescript
if (activeTool === 'componentInspector') {
  componentInspector.deactivate();
}
```

**Step 4: Commit**

```bash
git add src/content/index.ts
git commit -m "feat: add componentInspector handler to content script"
```

---

### Task 21: i18n 번역 추가

**Files:**
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

**Step 1: 한국어 번역 추가**

```json
{
  "tools": {
    "componentInspector": {
      "name": "컴포넌트",
      "description": "컴포넌트 구조 분석"
    }
  },
  "content": {
    "componentPickerHint": "요소를 클릭하여 컴포넌트 정보를 확인하세요.",
    "componentPicked": "컴포넌트: {{name}}"
  }
}
```

**Step 2: 영어 번역 추가**

```json
{
  "tools": {
    "componentInspector": {
      "name": "Component",
      "description": "Analyze component structure"
    }
  },
  "content": {
    "componentPickerHint": "Click an element to inspect component info.",
    "componentPicked": "Component: {{name}}"
  }
}
```

**Step 3: Commit**

```bash
git add src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat: add i18n translations for componentInspector"
```

---

## Phase 3: 테스트 및 정리

### Task 22: 빌드 테스트

**Step 1: TypeScript 컴파일 확인**

```bash
npm run build
```

Expected: No errors

**Step 2: Lint 확인**

```bash
npm run lint
```

Expected: No errors

---

### Task 23: 최종 정리 및 문서 업데이트

**Files:**
- Modify: `CLAUDE.md` (필요시)

**Step 1: 불필요한 파일/코드 삭제 확인**

```bash
# colorPicker 관련 파일이 남아있는지 확인
ls src/content/colorPicker/ 2>/dev/null || echo "colorPicker directory removed"

# 모든 colorPicker 참조가 제거되었는지 확인
grep -r "colorPicker" src/ --include="*.ts" --include="*.tsx"
```

**Step 2: conflictPrevention에 새 도구 충돌 규칙 추가**

```typescript
// componentInspector가 다른 exclusive 도구들과 충돌하도록 규칙 추가
{ tool1: 'componentInspector', tool2: 'textEdit', resolution: 'priority1' },
{ tool1: 'componentInspector', tool2: 'screenshot', resolution: 'priority1' },
{ tool1: 'componentInspector', tool2: 'cssScan', resolution: 'priority1' },
{ tool1: 'componentInspector', tool2: 'tailwind', resolution: 'priority1' },
{ tool1: 'componentInspector', tool2: 'ruler', resolution: 'priority1' },
{ tool1: 'componentInspector', tool2: 'jsInspector', resolution: 'priority1' },
{ tool1: 'componentInspector', tool2: 'gridLayout', resolution: 'priority1' },
```

**Step 3: 최종 커밋**

```bash
git add .
git commit -m "chore: final cleanup for tool reorganization"
```

---

## Summary

| Phase | Tasks | 주요 변경 사항 |
|-------|-------|----------------|
| Phase 1 | 9 tasks | colorPicker → palette 통합, 피커 모드는 런타임 처리 |
| Phase 2 | 12 tasks | componentInspector 추가 (React/Vue/Angular/Svelte/Web Components 지원) |
| Phase 3 | 2 tasks | 빌드 테스트, 최종 정리 |
| **Total** | **23 tasks** | |

## 주요 변경 사항 (수정됨)

1. **작업 순서 조정**: 참조 정리 후 tools.ts 삭제
2. **palette exclusive 유지**: `exclusive: false` 유지, 피커 모드는 런타임에서 처리
3. **프레임워크 감지 보완**: Angular, Svelte, Web Components 추가
4. **메타 프레임워크 지원**: Next.js, Nuxt, SvelteKit 감지
5. **충돌 규칙 업데이트**: jsInspector, gridLayout, componentInspector 추가
