/**
 * Mouse Event Handler
 *
 * 가이드라인 드래그를 위한 마우스 이벤트 핸들러
 */

import type { GuideLine } from '../../types/gridLayout';

interface MouseHandlerState {
  isDragging: boolean;
  guideId: string | null;
  offset: number;
  startX: number;
  startY: number;
  startPosition: number;
}

const state: MouseHandlerState = {
  isDragging: false,
  guideId: null,
  offset: 0,
  startX: 0,
  startY: 0,
  startPosition: 0,
};

/**
 * 마우스 이벤트 설정
 */
export function setupMouseHandlers(
  getGuides: () => GuideLine[],
  onGuideUpdate: (guideId: string, newPosition: number) => void
): () => void {
  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const guideElement = target.closest('.klic-guide-line');

    if (!guideElement) return;

    const guideEl = guideElement as HTMLElement;
    const guideId = guideEl.dataset.guideId;
    if (!guideId) return;

    const guide = getGuides().find(g => g.id === guideId);
    if (!guide || guide.locked) return;

    const isHorizontal = guide.type === 'horizontal';
    const mousePos = isHorizontal ? e.clientY : e.clientX;

    // 드래그 시작
    state.isDragging = true;
    state.guideId = guideId;
    state.offset = mousePos - guide.position;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startPosition = guide.position;

    // 시각적 피드백
    document.body.style.cursor = isHorizontal ? 'ns-resize' : 'ew-resize';
    guideEl.style.transition = 'none';

    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isDragging || !state.guideId) return;

    const guide = getGuides().find(g => g.id === state.guideId);
    if (!guide) return;

    const isHorizontal = guide.type === 'horizontal';
    const mousePos = isHorizontal ? e.clientY : e.clientX;
    const newPosition = Math.max(0, mousePos - state.offset);

    // 가이드라인 요소 업데이트
    const guideEl = document.getElementById(`guide-${state.guideId}`) as HTMLElement;
    if (guideEl) {
      if (isHorizontal) {
        guideEl.style.top = `${newPosition}px`;
      } else {
        guideEl.style.left = `${newPosition}px`;
      }
    }

    // 콜백 호출
    onGuideUpdate(state.guideId, newPosition);

    e.preventDefault();
  };

  const handleMouseUp = () => {
    if (!state.isDragging) return;

    const guideEl = document.getElementById(`guide-${state.guideId}`) as HTMLElement;
    if (guideEl) {
      guideEl.style.transition = 'opacity 0.2s';
    }

    document.body.style.cursor = '';

    state.isDragging = false;
    state.guideId = null;
  };

  // 마우스 이벤트 리스너 등록
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('mouseup', handleMouseUp, true);

  // 터치 이벤트 리스너 등록
  const touchStartHandler = (e: TouchEvent) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
    });
    handleMouseDown(mouseEvent as unknown as MouseEvent);
  };

  const touchMoveHandler = (e: TouchEvent) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true,
    });
    handleMouseMove(mouseEvent as unknown as MouseEvent);
  };

  const touchEndHandler = () => {
    handleMouseUp();
  };

  document.addEventListener('touchstart', touchStartHandler, { passive: false } as AddEventListenerOptions);
  document.addEventListener('touchmove', touchMoveHandler, { passive: false } as AddEventListenerOptions);
  document.addEventListener('touchend', touchEndHandler);

  // 정리 함수 반환
  return () => {
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('touchstart', touchStartHandler);
    document.removeEventListener('touchmove', touchMoveHandler);
    document.removeEventListener('touchend', touchEndHandler);
  };
}

/**
 * 현재 드래그 상태 가져오기
 */
export function getDragState(): MouseHandlerState {
  return { ...state };
}

/**
 * 드래그 중인지 확인
 */
export function isDragging(): boolean {
  return state.isDragging;
}

/**
 * 드래그 강제 종료
 */
export function endDrag(): void {
  if (state.isDragging) {
    state.isDragging = false;
    state.guideId = null;
    document.body.style.cursor = '';
  }
}
