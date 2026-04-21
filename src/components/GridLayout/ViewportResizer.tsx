/**
 * Viewport Resizer Component
 *
 * 뷰포트 리사이즈 핸들 컴포넌트 (8방향 리사이즈)
 */

import React, { useRef, useState, useCallback } from 'react';
import type { ViewportState, ResizeDirection } from '../../types/gridLayout';

interface ViewportResizerProps {
  viewport: ViewportState;
  onResizeStart?: () => void;
  onResize?: (width: number, height: number) => void;
  onResizeEnd?: () => void;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  showHandles?: boolean;
  className?: string;
}

const RESIZE_HANDLE_SIZE = 12;
const RESIZE_HANDLE_OFFSET = RESIZE_HANDLE_SIZE / 2;

export function ViewportResizer({
  viewport,
  onResizeStart,
  onResize,
  onResizeEnd,
  minWidth = 320,
  minHeight = 480,
  maxWidth = 7680,
  maxHeight = 4320,
  showHandles = true,
  className = '',
}: ViewportResizerProps) {
  const resizeStateRef = useRef<{
    isResizing: boolean;
    direction: ResizeDirection | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    isResizing: false,
    direction: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const [activeHandle, setActiveHandle] = useState<ResizeDirection | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // 리사이즈 핸들 위치 계산
  const getHandleStyle = (direction: ResizeDirection): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${RESIZE_HANDLE_SIZE}px`,
      height: `${RESIZE_HANDLE_SIZE}px`,
      backgroundColor: 'white',
      border: '2px solid #3B82F6',
      borderRadius: direction === 'n' || direction === 's' ? '4px' : '4px',
      cursor: getCursorForDirection(direction),
      opacity: activeHandle === direction ? 1 : 0.7,
      transition: 'opacity 0.15s, background-color 0.15s',
      zIndex: 1000,
      display: showHandles ? 'block' : 'none',
    };

    // 위치 설정
    switch (direction) {
      case 'n':
        return {
          ...baseStyle,
          left: `calc(50% - ${RESIZE_HANDLE_OFFSET}px)`,
          top: `-${RESIZE_HANDLE_OFFSET}px`,
          cursor: 'ns-resize',
        };
      case 's':
        return {
          ...baseStyle,
          left: `calc(50% - ${RESIZE_HANDLE_OFFSET}px)`,
          bottom: `-${RESIZE_HANDLE_OFFSET}px`,
          cursor: 'ns-resize',
        };
      case 'e':
        return {
          ...baseStyle,
          right: `-${RESIZE_HANDLE_OFFSET}px`,
          top: `calc(50% - ${RESIZE_HANDLE_OFFSET}px)`,
          cursor: 'ew-resize',
        };
      case 'w':
        return {
          ...baseStyle,
          left: `-${RESIZE_HANDLE_OFFSET}px`,
          top: `calc(50% - ${RESIZE_HANDLE_OFFSET}px)`,
          cursor: 'ew-resize',
        };
      case 'ne':
        return {
          ...baseStyle,
          right: `-${RESIZE_HANDLE_OFFSET}px`,
          top: `-${RESIZE_HANDLE_OFFSET}px`,
          cursor: 'nesw-resize',
        };
      case 'nw':
        return {
          ...baseStyle,
          left: `-${RESIZE_HANDLE_OFFSET}px`,
          top: `-${RESIZE_HANDLE_OFFSET}px`,
          cursor: 'nwse-resize',
        };
      case 'se':
        return {
          ...baseStyle,
          right: `-${RESIZE_HANDLE_OFFSET}px`,
          bottom: `-${RESIZE_HANDLE_OFFSET}px`,
          cursor: 'nwse-resize',
        };
      case 'sw':
        return {
          ...baseStyle,
          left: `-${RESIZE_HANDLE_OFFSET}px`,
          bottom: `-${RESIZE_HANDLE_OFFSET}px`,
          cursor: 'nesw-resize',
        };
      default:
        return baseStyle;
    }
  };

  // 방향에 따른 커서 스타일 반환
  const getCursorForDirection = (direction: ResizeDirection): string => {
    const cursorMap: Record<ResizeDirection, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
    };
    return cursorMap[direction];
  };

  // 새로운 크기 계산
  const calculateNewSize = useCallback((
    direction: ResizeDirection,
    deltaX: number,
    deltaY: number
  ): { width: number; height: number } => {
    let newWidth = viewport.customWidth;
    let newHeight = viewport.customHeight;

    switch (direction) {
      case 'e':
        newWidth = resizeStateRef.current.startWidth + deltaX;
        break;
      case 'w':
        newWidth = resizeStateRef.current.startWidth - deltaX;
        break;
      case 's':
        newHeight = resizeStateRef.current.startHeight + deltaY;
        break;
      case 'n':
        newHeight = resizeStateRef.current.startHeight - deltaY;
        break;
      case 'se':
        newWidth = resizeStateRef.current.startWidth + deltaX;
        newHeight = resizeStateRef.current.startHeight + deltaY;
        break;
      case 'sw':
        newWidth = resizeStateRef.current.startWidth - deltaX;
        newHeight = resizeStateRef.current.startHeight + deltaY;
        break;
      case 'ne':
        newWidth = resizeStateRef.current.startWidth + deltaX;
        newHeight = resizeStateRef.current.startHeight - deltaY;
        break;
      case 'nw':
        newWidth = resizeStateRef.current.startWidth - deltaX;
        newHeight = resizeStateRef.current.startHeight - deltaY;
        break;
    }

    // 크기 제한 적용
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    return { width: newWidth, height: newHeight };
  }, [viewport.customWidth, viewport.customHeight, minWidth, maxWidth, minHeight, maxHeight]);

  // Cleanup function ref
  const cleanupRef = useRef<() => void>(() => {});

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeStateRef.current.isResizing || !resizeStateRef.current.direction) return;

    const deltaX = e.clientX - resizeStateRef.current.startX;
    const deltaY = e.clientY - resizeStateRef.current.startY;

    const { width, height } = calculateNewSize(
      resizeStateRef.current.direction,
      deltaX,
      deltaY
    );

    onResize?.(width, height);
  }, [calculateNewSize, onResize]);

  // 마우스 업 핸들러
  const handleMouseUp = useCallback(() => {
    if (!resizeStateRef.current.isResizing) return;

    resizeStateRef.current.isResizing = false;
    resizeStateRef.current.direction = null;

    setActiveHandle(null);
    setIsResizing(false);
    onResizeEnd?.();

    // Call cleanup function if it exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = () => {};
    }
  }, [onResizeEnd]);

  // 리사이즈 시작 핸들러
  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();

    resizeStateRef.current = {
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: viewport.customWidth,
      startHeight: viewport.customHeight,
    };

    setActiveHandle(direction);
    setIsResizing(true);
    onResizeStart?.();

    // 전역 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Store cleanup function
    cleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  };

  // 컴포넌트 언마운트 시 정리
  React.useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const resizeDirections: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  return (
    <div className={`viewport-resizer ${className}`}>
      {/* 리사이즈 핸들들 */}
      {resizeDirections.map(direction => (
        <div
          key={direction}
          className={`resize-handle resize-handle-${direction}`}
          style={getHandleStyle(direction)}
          onMouseDown={(e) => handleMouseDown(e, direction)}
          onMouseEnter={() => setActiveHandle(direction)}
          onMouseLeave={() => !isResizing && setActiveHandle(null)}
          title={`${direction.toUpperCase()} 방향으로 리사이즈`}
        />
      ))}

      {/* 리사이즈 중일 때 오버레이 */}
      {isResizing && (
        <div
          className="resize-overlay fixed inset-0 bg-blue-500/10 pointer-events-none z-50"
          style={{ cursor: getCursorForDirection(activeHandle || 'e') }}
        />
      )}
    </div>
  );
}

/**
 * 간단한 뷰포트 리사이저 컴포넌트
 *
 * 4개 코너 핸들만 제공하는 경량 버전
 */
interface SimpleViewportResizerProps {
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
  onResizeEnd?: () => void;
  minWidth?: number;
  minHeight?: number;
}

export function SimpleViewportResizer({
  width,
  height,
  onResize,
  onResizeEnd,
  minWidth = 320,
  minHeight = 480,
}: SimpleViewportResizerProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [activeCorner, setActiveCorner] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);

  const handleMouseDown = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setIsResizing(true);
    setActiveCorner(corner);
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    });

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !activeCorner) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    let newWidth = startPos.width;
    let newHeight = startPos.height;

    switch (activeCorner) {
      case 'se':
        newWidth = startPos.width + deltaX;
        newHeight = startPos.height + deltaY;
        break;
      case 'sw':
        newWidth = startPos.width - deltaX;
        newHeight = startPos.height + deltaY;
        break;
      case 'ne':
        newWidth = startPos.width + deltaX;
        newHeight = startPos.height - deltaY;
        break;
      case 'nw':
        newWidth = startPos.width - deltaX;
        newHeight = startPos.height - deltaY;
        break;
    }

    newWidth = Math.max(minWidth, newWidth);
    newHeight = Math.max(minHeight, newHeight);

    onResize(newWidth, newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setActiveCorner(null);
    onResizeEnd?.();

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const corners = [
    { pos: 'se', label: '↘', style: { bottom: -6, right: -6, cursor: 'nwse-resize' } },
    { pos: 'sw', label: '↙', style: { bottom: -6, left: -6, cursor: 'nesw-resize' } },
    { pos: 'ne', label: '↗', style: { top: -6, right: -6, cursor: 'nesw-resize' } },
    { pos: 'nw', label: '↖', style: { top: -6, left: -6, cursor: 'nwse-resize' } },
  ] as const;

  return (
    <>
      {corners.map(corner => (
        <div
          key={corner.pos}
          className={`resize-corner absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white ${
            isResizing && activeCorner === corner.pos ? 'scale-125' : ''
          } transition-transform`}
          style={corner.style}
          onMouseDown={(e) => handleMouseDown(e, corner.pos)}
          title="드래그하여 리사이즈"
        />
      ))}
      {isResizing && (
        <div
          className="fixed inset-0 bg-blue-500/5 pointer-events-none"
          style={{ cursor: corners.find(c => c.pos === activeCorner)?.style.cursor }}
        />
      )}
    </>
  );
}
