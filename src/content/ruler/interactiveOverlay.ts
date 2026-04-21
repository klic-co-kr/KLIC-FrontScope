/**
 * Interactive Ruler Overlay
 *
 * 모듈 레벨 상태 + 이벤트 핸들링으로 동적 리사이즈/이동 지원.
 * mouseHandler.ts 패턴 참고.
 */

import type {
  RulerInteractionState,
  RulerResizeDirection,
  OverlayBounds,
  InteractiveRulerOverlay,
} from '../../types/ruler';
import {
  createInteractiveOverlay,
  updateOverlayBounds,
  setOverlaySelected,
  removeOverlayElement,
} from './overlayFactory';

const MIN_SIZE = 10;

let idCounter = 0;
function generateId(): string {
  return `ruler-${Date.now()}-${++idCounter}`;
}

// --- Module-level state ---
const state: RulerInteractionState = {
  mode: 'idle',
  overlays: [],
  selectedOverlayId: null,
  activeResizeDirection: null,
  drawStartX: 0,
  drawStartY: 0,
  moveOffsetX: 0,
  moveOffsetY: 0,
  resizeStartBounds: null,
  resizeStartX: 0,
  resizeStartY: 0,
};

let activeOverlay: InteractiveRulerOverlay | null = null;
let savedCursor = '';
let horizontalGuide: HTMLDivElement | null = null;
let verticalGuide: HTMLDivElement | null = null;
let centerHorizontalGuide: HTMLDivElement | null = null;
let centerVerticalGuide: HTMLDivElement | null = null;
let moveGuideAnchor: 'left' | 'right' | null = null;
let moveHorizontalGuideAnchor: 'top' | 'bottom' | null = null;

function createGuideLine(
  orientation: 'horizontal' | 'vertical',
  variant: 'primary' | 'center' = 'primary',
): HTMLDivElement {
  const line = document.createElement('div');
  line.className = `klic-ruler-guide-${orientation}${variant === 'center' ? '-center' : ''}`;

  const background = variant === 'center'
    ? orientation === 'horizontal'
      ? 'repeating-linear-gradient(90deg, rgba(16,185,129,0.95) 0 6px, rgba(16,185,129,0.3) 6px 12px)'
      : 'repeating-linear-gradient(180deg, rgba(16,185,129,0.95) 0 6px, rgba(16,185,129,0.3) 6px 12px)'
    : 'linear-gradient(90deg, rgba(59,130,246,0.8), rgba(59,130,246,0.3))';

  Object.assign(line.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483646',
    background,
    display: 'none',
  });

  if (orientation === 'horizontal') {
    Object.assign(line.style, {
      left: '0',
      width: '100vw',
      height: '1px',
    });
  } else {
    Object.assign(line.style, {
      top: '0',
      width: '1px',
      height: '100vh',
    });
  }

  return line;
}

function ensureGuides(): void {
  if (!horizontalGuide) {
    horizontalGuide = createGuideLine('horizontal');
    document.body.appendChild(horizontalGuide);
  }

  if (!verticalGuide) {
    verticalGuide = createGuideLine('vertical');
    document.body.appendChild(verticalGuide);
  }
}

function ensureCenterGuides(): void {
  if (!centerHorizontalGuide) {
    centerHorizontalGuide = createGuideLine('horizontal', 'center');
    document.body.appendChild(centerHorizontalGuide);
  }

  if (!centerVerticalGuide) {
    centerVerticalGuide = createGuideLine('vertical', 'center');
    document.body.appendChild(centerVerticalGuide);
  }
}

function showGuides(): void {
  ensureGuides();
  if (horizontalGuide) horizontalGuide.style.display = 'block';
  if (verticalGuide) verticalGuide.style.display = 'block';
}

function hideGuides(): void {
  if (horizontalGuide) horizontalGuide.style.display = 'none';
  if (verticalGuide) verticalGuide.style.display = 'none';
}

function showCenterGuides(): void {
  ensureCenterGuides();
  if (centerHorizontalGuide) centerHorizontalGuide.style.display = 'block';
  if (centerVerticalGuide) centerVerticalGuide.style.display = 'block';
}

function hideCenterGuides(): void {
  if (centerHorizontalGuide) centerHorizontalGuide.style.display = 'none';
  if (centerVerticalGuide) centerVerticalGuide.style.display = 'none';
}

function updateGuides(x: number, y: number): void {
  ensureGuides();
  if (horizontalGuide) horizontalGuide.style.top = `${Math.round(y)}px`;
  if (verticalGuide) verticalGuide.style.left = `${Math.round(x)}px`;
}

function updateCenterGuides(x: number, y: number): void {
  ensureCenterGuides();
  if (centerHorizontalGuide) centerHorizontalGuide.style.top = `${Math.round(y)}px`;
  if (centerVerticalGuide) centerVerticalGuide.style.left = `${Math.round(x)}px`;
}

function removeGuides(): void {
  horizontalGuide?.remove();
  verticalGuide?.remove();
  horizontalGuide = null;
  verticalGuide = null;
}

function removeCenterGuides(): void {
  centerHorizontalGuide?.remove();
  centerVerticalGuide?.remove();
  centerHorizontalGuide = null;
  centerVerticalGuide = null;
}

// --- Helpers ---
function findOverlayByElement(target: HTMLElement): InteractiveRulerOverlay | null {
  const overlayEl = target.closest('.klic-ruler-overlay') as HTMLElement | null;
  if (!overlayEl) return null;
  const id = overlayEl.dataset.overlayId;
  return state.overlays.find(o => o.id === id) ?? null;
}

function selectOverlay(overlay: InteractiveRulerOverlay | null): void {
  if (state.selectedOverlayId) {
    const prev = state.overlays.find(o => o.id === state.selectedOverlayId);
    if (prev) setOverlaySelected(prev, false);
  }
  state.selectedOverlayId = overlay?.id ?? null;
  if (overlay) setOverlaySelected(overlay, true);
}

function deleteOverlay(overlay: InteractiveRulerOverlay): void {
  removeOverlayElement(overlay);
  const idx = state.overlays.indexOf(overlay);
  if (idx !== -1) state.overlays.splice(idx, 1);
  if (state.selectedOverlayId === overlay.id) {
    state.selectedOverlayId = null;
  }
}

function computeDrawBounds(mouseX: number, mouseY: number): OverlayBounds {
  return {
    left: Math.min(mouseX, state.drawStartX),
    top: Math.min(mouseY, state.drawStartY),
    width: Math.abs(mouseX - state.drawStartX),
    height: Math.abs(mouseY - state.drawStartY),
  };
}

function computeResizeBounds(
  dir: RulerResizeDirection,
  startBounds: OverlayBounds,
  deltaX: number,
  deltaY: number,
): OverlayBounds {
  let { left, top, width, height } = startBounds;

  // Apply deltas per direction
  if (dir.includes('e')) width += deltaX;
  if (dir.includes('w')) { left += deltaX; width -= deltaX; }
  if (dir.includes('s')) height += deltaY;
  if (dir.includes('n')) { top += deltaY; height -= deltaY; }

  // Enforce minimum size with position correction
  if (width < MIN_SIZE) {
    if (dir.includes('w')) left -= (MIN_SIZE - width);
    width = MIN_SIZE;
  }
  if (height < MIN_SIZE) {
    if (dir.includes('n')) top -= (MIN_SIZE - height);
    height = MIN_SIZE;
  }

  return { left, top, width, height };
}

// --- Event Handlers ---
function onMouseDown(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  // Check if clicking a resize handle
  if (target.classList.contains('klic-ruler-handle')) {
    const overlay = findOverlayByElement(target);
    if (!overlay) return;

    e.preventDefault();
    e.stopPropagation();

    const dir = target.dataset.dir as RulerResizeDirection;
    state.mode = 'resizing';
    state.activeResizeDirection = dir;
    state.resizeStartBounds = { ...overlay.bounds };
    state.resizeStartX = e.clientX;
    state.resizeStartY = e.clientY;
    activeOverlay = overlay;
    moveGuideAnchor = null;
    moveHorizontalGuideAnchor = null;

    savedCursor = document.body.style.cursor;
    document.body.style.cursor = target.style.cursor;
    updateGuides(e.clientX, e.clientY);
    showGuides();
    updateCenterGuides(
      overlay.bounds.left + overlay.bounds.width / 2,
      overlay.bounds.top + overlay.bounds.height / 2,
    );
    showCenterGuides();
    return;
  }

  // Check if clicking an overlay body (move)
  if (target.classList.contains('klic-ruler-body')) {
    const overlay = findOverlayByElement(target);
    if (!overlay) return;

    e.preventDefault();
    e.stopPropagation();

    selectOverlay(overlay);
    state.mode = 'moving';
    state.moveOffsetX = e.clientX - overlay.bounds.left;
    state.moveOffsetY = e.clientY - overlay.bounds.top;
    activeOverlay = overlay;
    const centerX = overlay.bounds.left + overlay.bounds.width / 2;
    const centerY = overlay.bounds.top + overlay.bounds.height / 2;
    moveGuideAnchor = e.clientX <= centerX ? 'left' : 'right';
    moveHorizontalGuideAnchor = e.clientY <= centerY ? 'top' : 'bottom';

    savedCursor = document.body.style.cursor;
    document.body.style.cursor = 'move';
    const guideX = moveGuideAnchor === 'left'
      ? overlay.bounds.left
      : overlay.bounds.left + overlay.bounds.width;
    const guideY = moveHorizontalGuideAnchor === 'top'
      ? overlay.bounds.top
      : overlay.bounds.top + overlay.bounds.height;
    updateGuides(guideX, guideY);
    showGuides();
    updateCenterGuides(centerX, centerY);
    showCenterGuides();
    return;
  }

  // Click on empty space → deselect + start drawing
  e.preventDefault();
  e.stopPropagation();

  selectOverlay(null);

  const newOverlay = createInteractiveOverlay(generateId());
  state.overlays.push(newOverlay);
  activeOverlay = newOverlay;
  moveGuideAnchor = null;
  moveHorizontalGuideAnchor = null;

  state.mode = 'drawing';
  state.drawStartX = e.clientX;
  state.drawStartY = e.clientY;

  updateOverlayBounds(newOverlay, {
    left: e.clientX,
    top: e.clientY,
    width: 0,
    height: 0,
  });

  savedCursor = document.body.style.cursor;
  document.body.style.cursor = 'crosshair';
  updateGuides(e.clientX, e.clientY);
  showGuides();
}

function onMouseMove(e: MouseEvent): void {
  if (state.mode === 'idle' || !activeOverlay) return;
  e.preventDefault();

  switch (state.mode) {
    case 'drawing': {
      updateGuides(e.clientX, e.clientY);
      const bounds = computeDrawBounds(e.clientX, e.clientY);
      updateOverlayBounds(activeOverlay, bounds);
      break;
    }
    case 'moving': {
      updateOverlayBounds(activeOverlay, {
        left: e.clientX - state.moveOffsetX,
        top: e.clientY - state.moveOffsetY,
        width: activeOverlay.bounds.width,
        height: activeOverlay.bounds.height,
      });
      const guideX = moveGuideAnchor === 'left'
        ? activeOverlay.bounds.left
        : activeOverlay.bounds.left + activeOverlay.bounds.width;
      const guideY = moveHorizontalGuideAnchor === 'top'
        ? activeOverlay.bounds.top
        : activeOverlay.bounds.top + activeOverlay.bounds.height;
      updateGuides(guideX, guideY);
      updateCenterGuides(
        activeOverlay.bounds.left + activeOverlay.bounds.width / 2,
        activeOverlay.bounds.top + activeOverlay.bounds.height / 2,
      );
      break;
    }
    case 'resizing': {
      if (!state.resizeStartBounds || !state.activeResizeDirection) break;
      updateGuides(e.clientX, e.clientY);
      const deltaX = e.clientX - state.resizeStartX;
      const deltaY = e.clientY - state.resizeStartY;
      const bounds = computeResizeBounds(
        state.activeResizeDirection,
        state.resizeStartBounds,
        deltaX,
        deltaY,
      );
      updateOverlayBounds(activeOverlay, bounds);
      updateCenterGuides(
        activeOverlay.bounds.left + activeOverlay.bounds.width / 2,
        activeOverlay.bounds.top + activeOverlay.bounds.height / 2,
      );
      break;
    }
  }
}

function onMouseUp(): void {
  if (state.mode === 'idle') return;

  if (state.mode === 'drawing' && activeOverlay) {
    // Remove if too small
    if (activeOverlay.bounds.width < MIN_SIZE && activeOverlay.bounds.height < MIN_SIZE) {
      deleteOverlay(activeOverlay);
    } else {
      selectOverlay(activeOverlay);
    }
  }

  // Keep selection for moving/resizing
  state.mode = 'idle';
  state.activeResizeDirection = null;
  state.resizeStartBounds = null;
  moveGuideAnchor = null;
  moveHorizontalGuideAnchor = null;
  activeOverlay = null;
  document.body.style.cursor = savedCursor || 'crosshair';
  hideGuides();
  hideCenterGuides();
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!state.selectedOverlayId) return;
    const overlay = state.overlays.find(o => o.id === state.selectedOverlayId);
    if (!overlay) return;

    e.preventDefault();
    deleteOverlay(overlay);
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    if (state.mode !== 'idle' && activeOverlay) {
      // Cancel in-progress drawing
      if (state.mode === 'drawing') {
        deleteOverlay(activeOverlay);
      }
      state.mode = 'idle';
      activeOverlay = null;
      moveGuideAnchor = null;
      moveHorizontalGuideAnchor = null;
      document.body.style.cursor = 'crosshair';
      hideGuides();
      hideCenterGuides();
    } else {
      selectOverlay(null);
    }
  }
}

function preventDrag(e: Event): void {
  e.preventDefault();
}

// --- Public API ---

/**
 * 인터랙티브 룰러 초기화. cleanup 함수를 반환.
 */
export function initInteractiveRuler(): () => void {
  document.body.style.cursor = 'crosshair';
  ensureGuides();

  document.addEventListener('mousedown', onMouseDown, true);
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('mouseup', onMouseUp, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('dragstart', preventDrag, true);
  document.addEventListener('selectstart', preventDrag, true);

  return () => {
    document.body.style.cursor = '';
    document.removeEventListener('mousedown', onMouseDown, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mouseup', onMouseUp, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('dragstart', preventDrag, true);
    document.removeEventListener('selectstart', preventDrag, true);

    // Reset state
    state.mode = 'idle';
    state.selectedOverlayId = null;
    state.activeResizeDirection = null;
    state.resizeStartBounds = null;
    moveGuideAnchor = null;
    moveHorizontalGuideAnchor = null;
    activeOverlay = null;
    hideGuides();
    hideCenterGuides();
    removeGuides();
    removeCenterGuides();
  };
}

/**
 * 모든 룰러 오버레이 제거
 */
export function clearAllRulerOverlays(): void {
  for (const overlay of state.overlays) {
    removeOverlayElement(overlay);
  }
  state.overlays.length = 0;
  state.selectedOverlayId = null;
  moveGuideAnchor = null;
  moveHorizontalGuideAnchor = null;
  activeOverlay = null;
  hideGuides();
  hideCenterGuides();
}
