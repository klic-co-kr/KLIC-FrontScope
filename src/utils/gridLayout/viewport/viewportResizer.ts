/**
 * Viewport Resizer Utilities
 *
 * 뷰포트 리사이징 관련 유틸리티 함수들
 */

import type { ViewportState } from '../../../types/gridLayout';

/**
 * 리사이저 핸들 타입
 */
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * 리사이저 상태
 */
export interface ResizerState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  minWidth: number;
  minHeight: number;
}

/**
 * 리사이징 시작
 */
export function startResize(
  handle: ResizeHandle,
  mouseX: number,
  mouseY: number,
  currentWidth: number,
  currentHeight: number,
  options: {
    minWidth?: number;
    minHeight?: number;
  } = {}
): ResizerState {
  return {
    isResizing: true,
    handle,
    startX: mouseX,
    startY: mouseY,
    startWidth: currentWidth,
    startHeight: currentHeight,
    minWidth: options.minWidth ?? 320,
    minHeight: options.minHeight ?? 480,
  };
}

/**
 * 리사이징 중 크기 계산
 */
export function calculateResize(
  state: ResizerState,
  mouseX: number,
  mouseY: number
): { width: number; height: number } {
  if (!state.isResizing || !state.handle) {
    return { width: state.startWidth, height: state.startHeight };
  }

  let newWidth = state.startWidth;
  let newHeight = state.startHeight;

  const deltaX = mouseX - state.startX;
  const deltaY = mouseY - state.startY;

  // 동쪽 핸들 (우측)
  if (state.handle.includes('e')) {
    newWidth = Math.max(state.minWidth, state.startWidth + deltaX);
  }

  // 서쪽 핸들 (좌측)
  if (state.handle.includes('w')) {
    newWidth = Math.max(state.minWidth, state.startWidth - deltaX);
  }

  // 남쪽 핸들 (하단)
  if (state.handle.includes('s')) {
    newHeight = Math.max(state.minHeight, state.startHeight + deltaY);
  }

  // 북쪽 핸들 (상단)
  if (state.handle.includes('n')) {
    newHeight = Math.max(state.minHeight, state.startHeight - deltaY);
  }

  return { width: newWidth, height: newHeight };
}

/**
 * 비율 유지하면서 리사이징
 */
export function calculateResizeWithAspectRatio(
  state: ResizerState,
  mouseX: number,
  mouseY: number,
  aspectRatio: number
): { width: number; height: number } {
  if (!state.isResizing || !state.handle) {
    return { width: state.startWidth, height: state.startHeight };
  }

  const deltaX = mouseX - state.startX;
  const deltaY = mouseY - state.startY;

  let newWidth = state.startWidth;
  let newHeight = state.startHeight;

  // 주요 방향 결정 (더 많이 움직인 축)
  const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

  if (state.handle.includes('e') || state.handle.includes('w')) {
    if (isHorizontal || state.handle === 'ne' || state.handle === 'se') {
      newWidth = Math.max(state.minWidth, state.startWidth + deltaX);
      newHeight = newWidth / aspectRatio;
    } else {
      newHeight = Math.max(state.minHeight, state.startHeight + deltaY);
      newWidth = newHeight * aspectRatio;
    }
  } else if (state.handle.includes('n') || state.handle.includes('s')) {
    newHeight = Math.max(state.minHeight, state.startHeight + deltaY);
    newWidth = newHeight * aspectRatio;
  }

  // 최소 크기 확인
  if (newWidth < state.minWidth) {
    newWidth = state.minWidth;
    newHeight = newWidth / aspectRatio;
  }
  if (newHeight < state.minHeight) {
    newHeight = state.minHeight;
    newWidth = newHeight * aspectRatio;
  }

  return { width: newWidth, height: newHeight };
}

/**
 * 리사이징 종료
 */
export function endResize(): Partial<ResizerState> {
  return {
    isResizing: false,
    handle: null,
  };
}

/**
 * 핸들 커서 스타일
 */
export function getHandleCursor(handle: ResizeHandle): string {
  const cursorMap: Record<ResizeHandle, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
    sw: 'nesw-resize',
  };
  return cursorMap[handle];
}

/**
 * 핸들 위치 계산
 */
export function getHandlePosition(
  handle: ResizeHandle,
  width: number,
  height: number,
  handleSize: number = 10
): { top: number; left: number } {
  const half = handleSize / 2;

  switch (handle) {
    case 'n':
      return { top: -half, left: width / 2 - half };
    case 's':
      return { top: height - half, left: width / 2 - half };
    case 'e':
      return { top: height / 2 - half, left: width - half };
    case 'w':
      return { top: height / 2 - half, left: -half };
    case 'ne':
      return { top: -half, left: width - half };
    case 'nw':
      return { top: -half, left: -half };
    case 'se':
      return { top: height - half, left: width - half };
    case 'sw':
      return { top: height - half, left: -half };
    default:
      return { top: 0, left: 0 };
  }
}

/**
 * 모든 핸들 위치 계산
 */
export function getAllHandlePositions(
  width: number,
  height: number,
  handleSize: number = 10
): Record<ResizeHandle, { top: number; left: number }> {
  const handles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  const positions: Record<ResizeHandle, { top: number; left: number }> = {} as Record<ResizeHandle, { top: number; left: number }>;

  for (const handle of handles) {
    positions[handle] = getHandlePosition(handle, width, height, handleSize);
  }

  return positions;
}

/**
 * 핸들 스타일 생성
 */
export function createHandleStyle(
  handle: ResizeHandle,
  width: number,
  height: number,
  options: {
    size?: number;
    color?: string;
    border?: string;
  } = {}
): React.CSSProperties {
  const position = getHandlePosition(handle, width, height, options.size || 10);

  return {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${options.size || 10}px`,
    height: `${options.size || 10}px`,
    backgroundColor: options.color || '#3B82F6',
    border: options.border || '2px solid #fff',
    borderRadius: '2px',
    cursor: getHandleCursor(handle),
    zIndex: 10000,
  };
}

/**
 * 모서리 핸들만 생성
 */
export function getCornerHandles(): ResizeHandle[] {
  return ['nw', 'ne', 'sw', 'se'];
}

/**
 * 모서리 핸들인지 확인
 */
export function isCornerHandle(handle: ResizeHandle): boolean {
  return getCornerHandles().includes(handle);
}

/**
 * 엣지 핸들만 생성
 */
export function getEdgeHandles(): ResizeHandle[] {
  return ['n', 's', 'e', 'w'];
}

/**
 * 엣지 핸들인지 확인
 */
export function isEdgeHandle(handle: ResizeHandle): boolean {
  return getEdgeHandles().includes(handle);
}

/**
 * 뷰포트 상태에서 리사이징된 상태 생성
 */
export function createResizedViewportState(
  state: ViewportState,
  width: number,
  height: number
): ViewportState {
  return {
    ...state,
    customWidth: Math.max(320, Math.min(width, 7680)),
    customHeight: Math.max(480, Math.min(height, 7680)),
    orientation: height > width ? 'portrait' : 'landscape',
    preset: null,
  };
}
