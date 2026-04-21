/**
 * Area Selection Utilities
 *
 * 드래그로 영역 선택하는 유틸리티
 */

import type { CaptureArea, Dimensions, Point } from '../../types/screenshot';
import { SCREENSHOT_CLASSES } from '../../constants/screenshotClasses';

/**
 * 선택 상태
 */
export interface SelectionState {
  isSelecting: boolean;
  startPoint: Point;
  currentPoint: Point;
  overlay: HTMLElement | null;
}

let selectionState: SelectionState = {
  isSelecting: false,
  startPoint: { x: 0, y: 0 },
  currentPoint: { x: 0, y: 0 },
  overlay: null,
};

/**
 * 영역 선택 시작
 */
export function startSelection(x: number, y: number): HTMLElement {
  const overlay = createSelectionOverlay();
  selectionState = {
    isSelecting: true,
    startPoint: { x, y },
    currentPoint: { x, y },
    overlay,
  };

  updateSelectionOverlay(overlay, x, y, 0, 0);
  document.body.appendChild(overlay);

  return overlay;
}

/**
 * 영역 선택 업데이트
 */
export function updateSelection(x: number, y: number): CaptureArea | null {
  if (!selectionState.isSelecting || !selectionState.overlay) {
    return null;
  }

  selectionState.currentPoint = { x, y };

  const area = calculateSelectionArea();
  updateSelectionOverlay(
    selectionState.overlay,
    area.x,
    area.y,
    area.width,
    area.height
  );

  return area;
}

/**
 * 영역 선택 종료
 */
export function endSelection(): CaptureArea | null {
  if (!selectionState.isSelecting) {
    return null;
  }

  const area = calculateSelectionArea();

  // 유효하지 않은 영역 (너무 작음)
  if (area.width < 10 || area.height < 10) {
    removeOverlay();
    selectionState.isSelecting = false;
    return null;
  }

  selectionState.isSelecting = false;
  return area;
}

/**
 * 선택 취소
 */
export function cancelSelection(): void {
  removeOverlay();
  selectionState = {
    isSelecting: false,
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    overlay: null,
  };
}

/**
 * 선택 영역 계산
 */
function calculateSelectionArea(): CaptureArea {
  const { startPoint, currentPoint } = selectionState;

  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);

  return { x, y, width, height };
}

/**
 * 정규화된 영역 가져오기 (화면 밖으로 나가지 않도록)
 */
export function getNormalizedArea(area: CaptureArea, viewport: Dimensions): CaptureArea {
  return {
    x: Math.max(0, Math.min(area.x, viewport.width - 1)),
    y: Math.max(0, Math.min(area.y, viewport.height - 1)),
    width: Math.min(area.width, viewport.width - area.x),
    height: Math.min(area.height, viewport.height - area.y),
  };
}

/**
 * 선택 오버레이 생성
 */
function createSelectionOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = SCREENSHOT_CLASSES.OVERLAY;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    cursor: crosshair;
    pointer-events: none;
  `;

  const selectionBox = document.createElement('div');
  selectionBox.className = SCREENSHOT_CLASSES.AREA_SELECTED;
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px dashed #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
  `;

  overlay.appendChild(selectionBox);

  // 크기 정보 표시
  const sizeLabel = document.createElement('div');
  sizeLabel.style.cssText = `
    position: absolute;
    background: #3b82f6;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    white-space: nowrap;
    pointer-events: none;
  `;
  sizeLabel.className = 'klic-selection-size-label';
  overlay.appendChild(sizeLabel);

  return overlay;
}

/**
 * 선택 오버레이 업데이트
 */
function updateSelectionOverlay(
  overlay: HTMLElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const selectionBox = overlay.querySelector(`.${SCREENSHOT_CLASSES.AREA_SELECTED}`) as HTMLElement;
  const sizeLabel = overlay.querySelector('.klic-selection-size-label') as HTMLElement;

  if (selectionBox) {
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  }

  if (sizeLabel && width > 0 && height > 0) {
    sizeLabel.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    sizeLabel.style.left = `${x}px`;
    sizeLabel.style.top = `${Math.max(0, y - 30)}px`;
  }
}

/**
 * 오버레이 제거
 */
function removeOverlay(): void {
  if (selectionState.overlay) {
    selectionState.overlay.remove();
    selectionState.overlay = null;
  }
}

/**
 * 요소 하이라이트
 */
export function highlightElement(element: HTMLElement): () => void {
  const highlight = document.createElement('div');
  highlight.className = SCREENSHOT_CLASSES.ELEMENT_HIGHLIGHT;
  const rect = element.getBoundingClientRect();

  highlight.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    z-index: 2147483646;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(highlight);

  return () => highlight.remove();
}

/**
 * 다중 요소 하이라이트
 */
export function highlightElements(elements: HTMLElement[]): () => void {
  const highlights: HTMLElement[] = [];

  for (const element of elements) {
    const highlight = document.createElement('div');
    highlight.className = SCREENSHOT_CLASSES.ELEMENT_HIGHLIGHT;
    const rect = element.getBoundingClientRect();

    highlight.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #10b981;
      background: rgba(16, 185, 129, 0.1);
      pointer-events: none;
      z-index: 2147483646;
    `;

    document.body.appendChild(highlight);
    highlights.push(highlight);
  }

  return () => {
    for (const highlight of highlights) {
      highlight.remove();
    }
  };
}

/**
 * 전체 화면 딤 처리
 */
export function dimScreen(): () => void {
  const overlay = document.createElement('div');
  overlay.className = SCREENSHOT_CLASSES.DIMMED;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2147483645;
    pointer-events: none;
  `;

  document.body.appendChild(overlay);

  return () => overlay.remove();
}

/**
 * 선택 상태 확인
 */
export function isSelecting(): boolean {
  return selectionState.isSelecting;
}

/**
 * 현재 선택 영역 가져오기
 */
export function getCurrentSelection(): CaptureArea | null {
  if (!selectionState.isSelecting) {
    return null;
  }
  return calculateSelectionArea();
}
