import { useState } from 'react';
import { DragState } from '../../types/ruler';

export function useDragState() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPoint: null,
    currentPoint: null,
    element: null,
  });

  /**
   * 드래그 시작
   */
  const startDrag = (point: { x: number; y: number }, element?: HTMLElement) => {
    setDragState({
      isDragging: true,
      startPoint: point,
      currentPoint: point,
      element: element || null,
    });
  };

  /**
   * 드래그 업데이트
   */
  const updateDrag = (point: { x: number; y: number }) => {
    setDragState((prev) => ({
      ...prev,
      currentPoint: point,
    }));
  };

  /**
   * 드래그 종료
   */
  const endDrag = () => {
    const finalState = { ...dragState };

    setDragState({
      isDragging: false,
      startPoint: null,
      currentPoint: null,
      element: null,
    });

    return finalState;
  };

  /**
   * 드래그 취소
   */
  const cancelDrag = () => {
    setDragState({
      isDragging: false,
      startPoint: null,
      currentPoint: null,
      element: null,
    });
  };

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };
}
