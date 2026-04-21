/**
 * Viewport Overlay
 *
 * Content Script에서 뷰포트 프레임 + 박스 섀도 마스킹 오버레이를 관리
 * box-shadow: 0 0 0 9999px 기법으로 프레임 외부를 어둡게 처리
 */

import type { ViewportState } from '../../types/gridLayout';
import { createViewportInfoText } from '../../utils/gridLayout/viewport/viewportOverlay';

const VIEWPORT_CONTAINER_ID = 'viewport-overlay-container';
const VIEWPORT_FRAME_ID = 'viewport-frame';
const VIEWPORT_INFO_ID = 'viewport-info-label';

let viewportOffsetX = 0;
let viewportOffsetY = 0;
let latestViewportState: ViewportState | null = null;

/**
 * 뷰포트 오버레이가 필요한 상태인지 판단
 * 프리셋이 선택되어 있거나 기본값과 다른 커스텀 크기면 표시
 */
function shouldShowOverlay(state: ViewportState): boolean {
  if (state.preset) return true;

  const isDefaultSize = state.customWidth === 1280 && state.customHeight === 720;
  const isDefaultZoom = state.zoom === 1;
  return !(isDefaultSize && isDefaultZoom);
}

/**
 * 프레임에 동적 스타일 속성만 업데이트 (transition 유지)
 */
function applyFrameDynamicStyles(frame: HTMLElement, state: ViewportState): void {
  frame.style.top = `calc(50% + ${viewportOffsetY}px)`;
  frame.style.left = `calc(50% + ${viewportOffsetX}px)`;
  frame.style.width = `${state.customWidth}px`;
  frame.style.height = `${state.customHeight}px`;
  frame.style.transform = `translate(-50%, -50%) scale(${state.zoom})`;
}

/**
 * 프레임 초기 스타일 전체 설정 (최초 생성 시)
 */
function applyFrameInitialStyles(frame: HTMLElement, state: ViewportState): void {
  Object.assign(frame.style, {
    position: 'fixed',
    top: `calc(50% + ${viewportOffsetY}px)`,
    left: `calc(50% + ${viewportOffsetX}px)`,
    transform: `translate(-50%, -50%) scale(${state.zoom})`,
    width: `${state.customWidth}px`,
    height: `${state.customHeight}px`,
    border: '2px solid #3B82F6',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
    pointerEvents: 'none',
    zIndex: '9998',
    borderRadius: '4px',
    transition: 'width 0.3s ease, height 0.3s ease, transform 0.3s ease',
    boxSizing: 'border-box',
  });
}

/**
 * 정보 라벨 초기 스타일 설정
 */
function applyInfoInitialStyles(info: HTMLElement): void {
  Object.assign(info.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: '9999',
    pointerEvents: 'auto',
    whiteSpace: 'nowrap',
    cursor: 'grab',
    userSelect: 'none',
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampOffsets(state: ViewportState) {
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scaledWidth = state.customWidth * state.zoom;
  const scaledHeight = state.customHeight * state.zoom;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  const minOffsetX = margin + scaledWidth / 2 - centerX;
  const maxOffsetX = viewportWidth - margin - scaledWidth / 2 - centerX;
  const minOffsetY = margin + scaledHeight / 2 - centerY;
  const maxOffsetY = viewportHeight - margin - scaledHeight / 2 - centerY;

  viewportOffsetX = clamp(viewportOffsetX, Math.min(minOffsetX, maxOffsetX), Math.max(minOffsetX, maxOffsetX));
  viewportOffsetY = clamp(viewportOffsetY, Math.min(minOffsetY, maxOffsetY), Math.max(minOffsetY, maxOffsetY));
}

function positionInfoNearFrame(info: HTMLElement, frame: HTMLElement) {
  const margin = 10;
  const frameRect = frame.getBoundingClientRect();
  const infoRect = info.getBoundingClientRect();

  let top = frameRect.top - infoRect.height - 8;
  if (top < margin) {
    top = frameRect.bottom + 8;
  }

  let left = frameRect.right - infoRect.width;
  left = clamp(left, margin, Math.max(margin, window.innerWidth - margin - infoRect.width));
  top = clamp(top, margin, Math.max(margin, window.innerHeight - margin - infoRect.height));

  info.style.top = `${Math.round(top)}px`;
  info.style.left = `${Math.round(left)}px`;
}

function attachDragHandlers(info: HTMLElement, frame: HTMLElement) {
  let dragState:
    | {
        pointerId: number;
        startX: number;
        startY: number;
        originOffsetX: number;
        originOffsetY: number;
      }
    | null = null;

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    info.style.cursor = 'grabbing';
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originOffsetX: viewportOffsetX,
      originOffsetY: viewportOffsetY,
    };

    try {
      info.setPointerCapture(event.pointerId);
    } catch {
      void 0;
    }

    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    viewportOffsetX = dragState.originOffsetX + (event.clientX - dragState.startX);
    viewportOffsetY = dragState.originOffsetY + (event.clientY - dragState.startY);

    const state = latestViewportState;
    if (state) {
      clampOffsets(state);
      applyFrameDynamicStyles(frame, state);
      positionInfoNearFrame(info, frame);
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState = null;
    info.style.cursor = 'grab';
    try {
      info.releasePointerCapture(event.pointerId);
    } catch {
      void 0;
    }
  };

  info.addEventListener('pointerdown', handlePointerDown);
  info.addEventListener('pointermove', handlePointerMove);
  info.addEventListener('pointerup', handlePointerUp);
  info.addEventListener('pointercancel', handlePointerUp);
}

/**
 * 뷰포트 오버레이 주입 또는 업데이트
 */
export function injectViewportOverlay(state: ViewportState): void {
  latestViewportState = state;
  if (!shouldShowOverlay(state)) {
    removeViewportOverlay();
    return;
  }

  clampOffsets(state);

  const existing = document.getElementById(VIEWPORT_CONTAINER_ID);

  if (existing) {
    existing.style.pointerEvents = 'auto';
    // 기존 오버레이 업데이트: 동적 속성만 변경해서 transition 유지
    const frame = document.getElementById(VIEWPORT_FRAME_ID);
    const info = document.getElementById(VIEWPORT_INFO_ID);

    if (frame) {
      applyFrameDynamicStyles(frame, state);
    }
    if (info) {
      info.textContent = createViewportInfoText(state);
      if (frame) {
        positionInfoNearFrame(info, frame);
      }
    }
    return;
  }

  // 새 오버레이 생성
  const container = document.createElement('div');
  container.id = VIEWPORT_CONTAINER_ID;
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    pointerEvents: 'auto',
    zIndex: '9998',
  });

  const frame = document.createElement('div');
  frame.id = VIEWPORT_FRAME_ID;
  applyFrameInitialStyles(frame, state);

  const info = document.createElement('div');
  info.id = VIEWPORT_INFO_ID;
  applyInfoInitialStyles(info);
  info.textContent = createViewportInfoText(state);
  positionInfoNearFrame(info, frame);
  attachDragHandlers(info, frame);

  container.appendChild(frame);
  container.appendChild(info);
  document.body.appendChild(container);
}

/**
 * 뷰포트 오버레이 제거
 */
export function removeViewportOverlay(): void {
  const container = document.getElementById(VIEWPORT_CONTAINER_ID);
  container?.remove();

  latestViewportState = null;
  viewportOffsetX = 0;
  viewportOffsetY = 0;
}

/**
 * 정보 라벨만 업데이트
 */
export function updateViewportInfo(state: ViewportState): void {
  const info = document.getElementById(VIEWPORT_INFO_ID);
  if (info) {
    info.textContent = createViewportInfoText(state);
  }
}
