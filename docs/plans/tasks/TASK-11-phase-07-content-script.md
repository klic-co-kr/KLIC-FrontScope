# Phase 7: Content Script 통합

**태스크 범위**: Task #11.44 ~ #11.49 (6개)
**예상 시간**: 3시간
**의존성**: Phase 1-6 완료

---

## Task #11.44: Content Script 메인 파일

- **파일**: `src/content/gridLayout/index.ts`
- **시간**: 30분
- **의존성**: Task #11.29
- **상세 내용**:
```typescript
import { GridOverlaySettings, WhitespaceSettings, GuideLine } from '../../types/gridLayout';
import { injectGridOverlay, injectWhitespaceOverlay, removeAllOverlays, setupResizeHandler } from './overlayInjector';
import { MESSAGE_ACTIONS } from '../../constants/messages';

let currentGridSettings: GridOverlaySettings | null = null;
let currentWhitespaceSettings: WhitespaceSettings | null = null;
let currentGuides: GuideLine[] = [];

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY:
      handleToggleGrid(message.payload);
      break;
    case MESSAGE_ACTIONS.GRID_LAYOUT_SET_VIEWPORT:
      handleSetViewport(message.payload);
      break;
    case MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_WHITESPACE:
      handleToggleWhitespace(message.payload);
      break;
  }
  sendResponse({ success: true });
});

function handleToggleGrid(settings: GridOverlaySettings) {
  currentGridSettings = settings;
  injectGridOverlay(settings);
}

function handleSetViewport(payload: { width: number; height: number }) {
  // 뷰포트 변경 처리
  if (currentGridSettings) {
    injectGridOverlay(currentGridSettings);
  }
}

function handleToggleWhitespace(settings: WhitespaceSettings) {
  currentWhitespaceSettings = settings;
  injectWhitespaceOverlay(settings);
}

// 초기화
function initialize() {
  console.log('Grid Layout content script initialized');
}

initialize();
```

---

## Task #11.45: 가이드라인 오버레이 주입

- **파일**: `src/content/gridLayout/guideLineOverlay.ts`
- **시간**: 30분
- **의존성**: Task #11.9, #11.10
- **상세 내용**:
```typescript
import { GuideLine } from '../../types/gridLayout';
import { generateGuideLineStyle } from '../../utils/gridLayout/helpers';

const containerId = 'guide-lines-container';

/**
 * 가이드라인 컨테이너 생성
 */
function createContainer(): HTMLElement {
  const existing = document.getElementById(containerId);
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = containerId;
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9998;
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * 가이드라인 요소 생성
 */
function createGuideLineElement(guide: GuideLine): HTMLElement {
  const element = document.createElement('div');
  element.id = `guide-${guide.id}`;
  element.className = `guide-line guide-line-${guide.type}`;
  element.dataset.guideId = guide.id;

  const styles = generateGuideLineStyle(guide);
  Object.assign(element.style, styles);

  // 잠금 상태 표시
  if (guide.locked) {
    element.classList.add('locked');
  }

  // 표시 여부
  if (!guide.visible) {
    element.style.display = 'none';
  }

  return element;
}

/**
 * 모든 가이드라인 주입
 */
export function injectGuideLines(guides: GuideLine[]): void {
  const container = createContainer();

  for (const guide of guides) {
    const element = createGuideLineElement(guide);
    container.appendChild(element);
  }
}

/**
 * 가이드라인 업데이트
 */
export function updateGuideLine(guide: GuideLine): void {
  const element = document.getElementById(`guide-${guide.id}`);
  if (element) {
    const styles = generateGuideLineStyle(guide);
    Object.assign(element.style, styles);

    element.style.display = guide.visible ? '' : 'none';
    element.classList.toggle('locked', guide.locked);
  }
}

/**
 * 모든 가이드라인 제거
 */
export function removeGuideLines(): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.remove();
  }
}

/**
 * 특정 가이드라인 제거
 */
export function removeGuideLine(guideId: string): void {
  const element = document.getElementById(`guide-${guideId}`);
  if (element) {
    element.remove();
  }
}
```

---

## Task #11.46: 마우스 이벤트 핸들러

- **파일**: `src/content/gridLayout/mouseHandler.ts`
- **시간**: 30분
- **의존성**: Task #11.10, #11.45
- **상세 내용**:
```typescript
import { GuideLine } from '../../types/gridLayout';
import { startGuideDrag, updateGuideDrag } from '../../utils/gridLayout/guideLines/positionGuide';

interface MouseHandlerState {
  isDragging: boolean;
  guideId: string | null;
  offset: number;
  startX: number;
  startY: number;
}

const state: MouseHandlerState = {
  isDragging: false,
  guideId: null,
  offset: 0,
  startX: 0,
  startY: 0,
};

/**
 * 마우스 이벤트 설정
 */
export function setupMouseHandlers(
  guides: GuideLine[],
  onGuideUpdate: (guideId: string, newPosition: number) => void
): () => void {
  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const guideElement = target.closest('.guide-line');

    if (!guideElement) return;

    const guideId = guideElement?.dataset.guideId;
    if (!guideId) return;

    const guide = guides.find(g => g.id === guideId);
    if (!guide || guide.locked) return;

    const isHorizontal = guide.type === 'horizontal';
    const mousePos = isHorizontal ? e.clientY : e.clientX;

    // 드래그 시작
    state.isDragging = true;
    state.guideId = guideId;
    state.offset = mousePos - guide.position;
    state.startX = e.clientX;
    state.startY = e.clientY;

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isDragging || !state.guideId) return;

    const mousePos = e.type.includes('touch') ? (e as TouchEvent).touches[0].clientX : e.clientX;
    const newPosition = mousePos - state.offset;

    onGuideUpdate(state.guideId, newPosition);
  };

  const handleMouseUp = () => {
    if (state.isDragging) {
      state.isDragging = false;
      state.guideId = null;
    }
  };

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // 터치 이벤트
  document.addEventListener('touchstart', handleMouseDown as any);
  document.addEventListener('touchmove', handleMouseMove as any);
  document.addEventListener('touchend', handleMouseUp);

  return () => {
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}
```

---

## Task #11.47: 드래그 앤 드롭 처리

- **파일**: `src/content/gridLayout/dragDropHandler.ts`
- **시간**: 30분
- **의존성**: Task #11.10, #11.46
- **상세 내용**:
```typescript
import { GuideLine } from '../../types/gridLayout';
import { snapGuideToPosition } from '../../utils/gridLayout/grid/snapSystem';

interface DragDropState {
  isDragging: boolean;
  guideId: string | null;
  element: HTMLElement | null;
  clone: HTMLElement | null;
  offsetX: number;
  offsetY: number;
}

const state: DragDropState = {
  isDragging: false,
  guideId: null,
  element: null,
  clone: null,
  offsetX: 0,
  offsetY: 0,
};

/**
 * 드래그 앤 드롭 설정
 */
export function setupDragDrop(
  guides: GuideLine[],
  onGuideMove: (guideId: string, newPosition: number) => void,
  snapTargets: number[] = [],
  snapThreshold: number = 10
): () => void {
  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    const guideElement = target.closest('.guide-line');

    if (!guideElement) return;

    const guideId = guideElement?.dataset.guideId;
    if (!guideId) return;

    const guide = guides.find(g => g.id === guideId);
    if (!guide || guide.locked) return;

    e.preventDefault();

    state.isDragging = true;
    state.guideId = guideId;
    state.element = guideElement as HTMLElement;

    // 시각적 피드백
    guideElement.style.cursor = 'grabbing';
    guideElement.style.transition = 'none';

    const rect = guideElement.getBoundingClientRect();
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;
  };

  const handleDrag = (e: DragEvent) => {
    if (!state.isDragging || !state.element) return;

    e.preventDefault();

    const guide = guides.find(g => g.id === state.guideId);
    if (!guide) return;

    const newPosition = guide.type === 'horizontal'
      ? e.clientY - state.offsetY
      : e.clientX - state.offsetX;

    // 스냅 처리
    const snapResult = snapGuideToPosition(newPosition, snapTargets, snapThreshold);
    const finalPosition = snapResult.snapped ? snapResult.position : newPosition;

    onGuideMove(state.guideId!, finalPosition);

    // 스냅 피드백
    if (snapResult.snapped) {
      state.element.classList.add('snapped');
    } else {
      state.element.classList.remove('snapped');
    }
  };

  const handleDragEnd = () => {
    if (state.element) {
      state.element.style.cursor = '';
      state.element.style.transition = '';
      state.element.classList.remove('snapped');
    }

    state.isDragging = false;
    state.guideId = null;
    state.element = null;
  };

  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('drag', handleDrag);
  document.addEventListener('dragend', handleDragEnd);

  return () => {
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('drag', handleDrag);
    document.removeEventListener('dragend', handleDragEnd);
  };
}
```

---

## Task #11.48: 리사이즈 핸들러

- **파일**: `src/content/gridLayout/resizeHandler.ts`
- **시간**: 30분
- **의존성**: Task #11.23, #11.24
- **상세 내용**:
```typescript
import { GridOverlaySettings, WhitespaceSettings } from '../../types/gridLayout';
import { generateGridHTML } from '../../utils/gridLayout/grid/gridRenderer';
import { createWhitespaceCSS } from '../../utils/gridLayout/grid/whitespacePattern';

/**
 * 윈도우 리사이즈 핸들러 설정
 */
export function setupResizeHandler(
  gridSettings: GridOverlaySettings,
  whitespaceSettings: WhitespaceSettings,
  onGridUpdate: () => void,
  onWhitespaceUpdate: () => void
): () => void {
  let resizeTimer: NodeJS.Timeout | null = null;

  const handleResize = () => {
    // 디바운스
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }

    resizeTimer = setTimeout(() => {
      // 그리드 오버레이 업데이트
      if (gridSettings.enabled) {
        updateGridOverlay(gridSettings);
        onGridUpdate();
      }

      // 화이트스페이스 업데이트
      if (whitespaceSettings.enabled) {
        updateWhitespaceOverlay(whitespaceSettings);
        onWhitespaceUpdate();
      }
    }, 100); // 100ms 디바운스
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
  };
}

/**
 * 그리드 오버레이 업데이트
 */
function updateGridOverlay(settings: GridOverlaySettings): void {
  const container = document.getElementById('grid-overlay-container');
  if (!container) return;

  container.innerHTML = generateGridHTML(settings, window.innerWidth);
}

/**
 * 화이트스페이스 오버레이 업데이트
 */
function updateWhitespaceOverlay(settings: WhitespaceSettings): void {
  const overlay = document.getElementById('whitespace-overlay');
  if (!overlay) return;

  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9995;
    ${createWhitespaceCSS(settings)}
  `;
}
```

---

## Task #11.49: 키보드 단축키 핸들러

- **파일**: `src/content/gridLayout/keyboardHandler.ts`
- **시간**: 30분
- **의존성**: Task #11.27
- **상세 내용**:
```typescript
import { parseKeyCombo, matchKeyCombo } from '../../utils/gridLayout/grid/keyboardShortcuts';
import { MESSAGE_ACTIONS } from '../../constants/messages';

interface ShortcutAction {
  key: string;
  action: () => void;
}

/**
 * 키보드 단축키 설정
 */
export function setupKeyboardHandler(shortcuts: Record<string, () => void>): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 입력 필드에서는 무시
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // 단축키 체크
    for (const [shortcut, action] of Object.entries(shortcuts)) {
      const combo = parseKeyCombo(shortcut);

      if (matchKeyCombo(e, combo)) {
        e.preventDefault();
        e.stopPropagation();
        action();
        break;
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * 기본 단축키 등록
 */
export function registerDefaultShortcuts(): () => void {
  const shortcuts: Record<string, () => void> = {
    'Ctrl+G': () => {
      chrome.runtime.sendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY,
      });
    },
    'Ctrl+Shift+G': () => {
      chrome.runtime.sendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_GUIDES,
      });
    },
    'Ctrl+Shift+X': () => {
      chrome.runtime.sendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_CLEAR_ALL,
      });
    },
    'Escape': () => {
      // 현재 활성화된 도구 비활성화
      removeAllOverlays();
    },
  };

  return setupKeyboardHandler(shortcuts);
}

/**
 * 모든 오버레이 제거
 */
function removeAllOverlays(): void {
  const gridContainer = document.getElementById('grid-overlay-container');
  const whitespaceOverlay = document.getElementById('whitespace-overlay');
  const guideLinesContainer = document.getElementById('guide-lines-container');

  gridContainer?.remove();
  whitespaceOverlay?.remove();
  guideLinesContainer?.remove();
}
```

---

**완료 후 다음 단계**: [Phase 8: 테스트](./TASK-11-phase-08-testing.md)
