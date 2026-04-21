/**
 * Ruler Overlay Factory
 *
 * 인터랙티브 룰러 오버레이 DOM 생성 전담 (순수 함수, 상태 없음)
 */

import type { InteractiveRulerOverlay, OverlayBounds, RulerResizeDirection } from '../../types/ruler';

const HANDLE_SIZE = 8;
const HANDLE_OFFSET = -4; // inset from edge

const CURSOR_MAP: Record<RulerResizeDirection, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

const HANDLE_POSITIONS: Record<RulerResizeDirection, { top?: string; bottom?: string; left?: string; right?: string; transform?: string }> = {
  n:  { top: `${HANDLE_OFFSET}px`, left: '50%', transform: 'translateX(-50%)' },
  s:  { bottom: `${HANDLE_OFFSET}px`, left: '50%', transform: 'translateX(-50%)' },
  e:  { top: '50%', right: `${HANDLE_OFFSET}px`, transform: 'translateY(-50%)' },
  w:  { top: '50%', left: `${HANDLE_OFFSET}px`, transform: 'translateY(-50%)' },
  ne: { top: `${HANDLE_OFFSET}px`, right: `${HANDLE_OFFSET}px` },
  nw: { top: `${HANDLE_OFFSET}px`, left: `${HANDLE_OFFSET}px` },
  se: { bottom: `${HANDLE_OFFSET}px`, right: `${HANDLE_OFFSET}px` },
  sw: { bottom: `${HANDLE_OFFSET}px`, left: `${HANDLE_OFFSET}px` },
};

const DIRECTIONS: RulerResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

function createHandle(dir: RulerResizeDirection): HTMLElement {
  const handle = document.createElement('div');
  handle.className = 'klic-ruler-handle';
  handle.dataset.dir = dir;
  Object.assign(handle.style, {
    position: 'absolute',
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    background: '#EF4444',
    border: '1px solid #fff',
    borderRadius: '1px',
    cursor: CURSOR_MAP[dir],
    pointerEvents: 'auto',
    zIndex: '1',
    boxSizing: 'border-box',
    ...HANDLE_POSITIONS[dir],
  });
  return handle;
}

/**
 * 인터랙티브 오버레이 DOM 구조 생성
 */
export function createInteractiveOverlay(id: string): InteractiveRulerOverlay {
  const element = document.createElement('div');
  element.className = 'klic-ruler-overlay';
  element.dataset.overlayId = id;
  Object.assign(element.style, {
    position: 'fixed',
    border: '2px dashed #EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  });

  // Label
  const label = document.createElement('div');
  label.className = 'klic-ruler-label';
  Object.assign(label.style, {
    position: 'absolute',
    top: '-28px',
    left: '0',
    background: '#EF4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pointerEvents: 'none',
    userSelect: 'none',
    lineHeight: '20px',
  });
  label.textContent = '0×0 px';

  // Body (clickable area for move)
  const body = document.createElement('div');
  body.className = 'klic-ruler-body';
  Object.assign(body.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'auto',
    cursor: 'move',
  });

  // Handle container
  const handleContainer = document.createElement('div');
  handleContainer.className = 'klic-ruler-handles';
  Object.assign(handleContainer.style, {
    position: 'absolute',
    inset: `${HANDLE_OFFSET}px`,
    display: 'none',
    pointerEvents: 'none',
  });

  for (const dir of DIRECTIONS) {
    handleContainer.appendChild(createHandle(dir));
  }

  element.appendChild(label);
  element.appendChild(body);
  element.appendChild(handleContainer);
  document.body.appendChild(element);

  return {
    id,
    element,
    label,
    body,
    handleContainer,
    bounds: { left: 0, top: 0, width: 0, height: 0 },
  };
}

/**
 * 오버레이 바운드 업데이트 + 라벨 갱신
 */
export function updateOverlayBounds(overlay: InteractiveRulerOverlay, bounds: OverlayBounds): void {
  const updated = { ...bounds };
  overlay.bounds = updated;

  Object.assign(overlay.element.style, {
    left: `${updated.left}px`,
    top: `${updated.top}px`,
    width: `${updated.width}px`,
    height: `${updated.height}px`,
  });

  overlay.label.textContent = `${Math.round(updated.width)}×${Math.round(updated.height)} px`;
}

/**
 * 핸들 표시
 */
export function showHandles(overlay: InteractiveRulerOverlay): void {
  overlay.handleContainer.style.display = 'block';
}

/**
 * 핸들 숨김
 */
export function hideHandles(overlay: InteractiveRulerOverlay): void {
  overlay.handleContainer.style.display = 'none';
}

/**
 * 선택 상태 스타일 적용
 */
export function setOverlaySelected(overlay: InteractiveRulerOverlay, selected: boolean): void {
  if (selected) {
    overlay.element.style.borderColor = '#3B82F6';
    overlay.element.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    overlay.label.style.background = '#3B82F6';
    showHandles(overlay);
  } else {
    overlay.element.style.borderColor = '#EF4444';
    overlay.element.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    overlay.label.style.background = '#EF4444';
    hideHandles(overlay);
  }
}

/**
 * 오버레이 DOM 제거
 */
export function removeOverlayElement(overlay: InteractiveRulerOverlay): void {
  overlay.element.remove();
}
