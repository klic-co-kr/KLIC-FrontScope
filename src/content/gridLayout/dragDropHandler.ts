/**
 * Drag and Drop Handler
 *
 * 가이드라인 드래그 앤 드롭 및 스냅 처리
 */

import type { GuideLine } from '../../types/gridLayout';

interface DragDropState {
  isDragging: boolean;
  guideId: string | null;
  element: HTMLElement | null;
  offsetX: number;
  offsetY: number;
  startPosition: number;
  snapThreshold: number;
}

const state: DragDropState = {
  isDragging: false,
  guideId: null,
  element: null,
  offsetX: 0,
  offsetY: 0,
  startPosition: 0,
  snapThreshold: 10,
};

/**
 * 드래그 앤 드롭 설정
 */
export function setupDragDrop(
  getGuides: () => GuideLine[],
  onGuideMove: (guideId: string, newPosition: number) => void,
  snapTargets: number[] = [],
  snapThreshold: number = 10
): () => void {
  state.snapThreshold = snapThreshold;

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    const guideElement = target.closest('.klic-guide-line');

    if (!guideElement) return;

    const guideEl = guideElement as HTMLElement;
    const guideId = guideEl.dataset.guideId;
    if (!guideId) return;

    const guide = getGuides().find(g => g.id === guideId);
    if (!guide || guide.locked) return;

    e.preventDefault();
    e.stopPropagation();

    state.isDragging = true;
    state.guideId = guideId;
    state.element = guideEl;
    state.startPosition = guide.position;

    // 시각적 피드백
    guideEl.style.cursor = 'grabbing';
    guideEl.style.transition = 'none';
    guideEl.classList.add('dragging');

    const rect = guideEl.getBoundingClientRect();
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;
  };

  const handleDrag = (e: DragEvent) => {
    if (!state.isDragging || !state.element) return;

    e.preventDefault();
    e.stopPropagation();

    const guide = getGuides().find(g => g.id === state.guideId);
    if (!guide) return;

    const newPosition = guide.type === 'horizontal'
      ? e.clientY - state.offsetY
      : e.clientX - state.offsetX;

    // 스냅 처리
    const finalPosition = calculateSnapPosition(newPosition, guide.type, snapTargets);

    // DOM 업데이트
    if (guide.type === 'horizontal') {
      state.element.style.top = `${finalPosition}px`;
    } else {
      state.element.style.left = `${finalPosition}px`;
    }

    // 스냅 피드백
    if (finalPosition !== newPosition) {
      state.element.classList.add('snapped');
    } else {
      state.element.classList.remove('snapped');
    }

    // 콜백
    onGuideMove(state.guideId!, finalPosition);
  };

  const handleDragEnd = () => {
    if (state.element) {
      state.element.style.cursor = '';
      state.element.style.transition = 'opacity 0.2s';
      state.element.classList.remove('dragging', 'snapped');
    }

    state.isDragging = false;
    state.guideId = null;
    state.element = null;
  };

  // DragEvent 리스너 등록
  document.addEventListener('dragstart', handleDragStart, true);
  document.addEventListener('drag', handleDrag, true);
  document.addEventListener('dragend', handleDragEnd, true);

  // 정리 함수 반환
  return () => {
    document.removeEventListener('dragstart', handleDragStart, true);
    document.removeEventListener('drag', handleDrag, true);
    document.removeEventListener('dragend', handleDragEnd, true);
  };
}

/**
 * 스냅 위치 계산
 */
function calculateSnapPosition(
  position: number,
  orientation: 'horizontal' | 'vertical',
  snapTargets: number[]
): number {
  let finalPosition = position;

  // 간단한 스냅 로직 (스냅 타겟이 가까운 위치로 스냅)
  for (const target of snapTargets) {
    const distance = Math.abs(target - position);
    if (distance < state.snapThreshold) {
      finalPosition = target;
      break;
    }
  }

  // 센터 스냅 (화면 중앙)
  const centerPosition = orientation === 'horizontal'
    ? window.innerHeight / 2
    : window.innerWidth / 2;
  const centerDistance = Math.abs(centerPosition - position);
  if (centerDistance < state.snapThreshold) {
    finalPosition = centerPosition;
  }

  return Math.max(0, finalPosition);
}

/**
 * 드래그 상태 가져오기
 */
export function getDragDropState(): DragDropState {
  return { ...state };
}

/**
 * 스냅 임계값 설정
 */
export function setSnapThreshold(threshold: number): void {
  state.snapThreshold = threshold;
}

/**
 * 드래그 중인 가이드라인 ID 가져오기
 */
export function getDraggingGuideId(): string | null {
  return state.guideId;
}

/**
 * 드래그 강제 종료
 */
export function endDragDrop(): void {
  if (state.element) {
    state.element.style.cursor = '';
    state.element.style.transition = '';
    state.element.classList.remove('dragging', 'snapped');
  }

  state.isDragging = false;
  state.guideId = null;
  state.element = null;
}
