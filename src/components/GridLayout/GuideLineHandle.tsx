/**
 * Guide Line Handle Component
 *
 * 드래그 가능한 가이드라인 핸들 컴포넌트
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { GuideLine } from '../../types/gridLayout';

interface GuideLineHandleProps {
  guide: GuideLine;
  onDragStart: (guideId: string) => void;
  onDrag: (guideId: string, newPosition: number) => void;
  onDragEnd: (guideId: string) => void;
  onDoubleClick: (guideId: string) => void;
}

export function GuideLineHandle({
  guide,
  onDragStart,
  onDrag,
  onDragEnd,
  onDoubleClick,
}: GuideLineHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStateRef = useRef<{
    startX: number;
    startPosition: number;
  }>({
    startX: 0,
    startPosition: 0,
  });

  // 가이드라인 스타일 계산
  const getLineStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: guide.color,
      zIndex: guide.visible ? 1000 : -1,
      pointerEvents: guide.locked ? 'none' : 'auto',
      cursor: guide.locked ? 'default' : 'move',
      opacity: guide.visible ? (guide.opacity ?? 1) : 0,
      transition: isDragging ? 'none' : 'opacity 0.2s',
    };

    if (guide.type === 'horizontal') {
      return {
        ...baseStyle,
        left: '0',
        top: `${guide.position}px`,
        width: '100%',
        height: `${guide.width}px`,
        borderTopStyle: guide.style === 'dashed' ? 'dashed' as const : guide.style === 'dotted' ? 'dotted' as const : 'solid' as const,
      };
    } else {
      return {
        ...baseStyle,
        left: `${guide.position}px`,
        top: '0',
        width: `${guide.width}px`,
        height: '100%',
        borderLeftStyle: guide.style === 'dashed' ? 'dashed' as const : guide.style === 'dotted' ? 'dotted' as const : 'solid' as const,
      };
    }
  };

  // 핸들 스타일 계산
  const getHandleStyle = (): React.CSSProperties => {
    const size = 12;
    const offset = size / 2;

    if (guide.type === 'horizontal') {
      return {
        position: 'absolute',
        left: `calc(50% - ${offset}px)`,
        top: `${guide.position - offset}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: guide.color,
        borderRadius: '50%',
        cursor: guide.locked ? 'not-allowed' : 'ns-resize',
        opacity: guide.visible ? 1 : 0,
        pointerEvents: guide.locked ? 'none' : 'auto',
        zIndex: 1001,
        transition: 'transform 0.1s, opacity 0.2s',
        border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      };
    } else {
      return {
        position: 'absolute',
        left: `${guide.position - offset}px`,
        top: `calc(50% - ${offset}px)`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: guide.color,
        borderRadius: '50%',
        cursor: guide.locked ? 'not-allowed' : 'ew-resize',
        opacity: guide.visible ? 1 : 0,
        pointerEvents: guide.locked ? 'none' : 'auto',
        zIndex: 1001,
        transition: 'transform 0.1s, opacity 0.2s',
        border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      };
    }
  };

  // Cleanup function ref
  const cleanupRef = useRef<() => void>(() => {});

  // 마우스 이동 이벤트 핸들러
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const currentPos = guide.type === 'horizontal' ? e.clientY : e.clientX;
    const delta = currentPos - dragStateRef.current.startX;
    const newPosition = Math.max(0, dragStateRef.current.startPosition + delta);

    onDrag(guide.id, newPosition);
  }, [guide.type, guide.id, onDrag]);

  // 마우스 업 이벤트 핸들러
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);
    onDragEnd(guide.id);

    // Call cleanup function if it exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = () => {};
    }
  }, [onDragEnd, guide.id]);

  // 마우스 다운 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (guide.locked || !guide.visible) return;

    e.stopPropagation();
    e.preventDefault();

    dragStateRef.current = {
      startX: guide.type === 'horizontal' ? e.clientY : e.clientX,
      startPosition: guide.position,
    };

    isDraggingRef.current = true;
    setIsDragging(true);
    onDragStart(guide.id);

    // 전역 마우스 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Store cleanup function
    cleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  };

  // 더블클릭 이벤트 핸들러
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(guide.id);
  };

  // 핸들 호버 효과
  const handleMouseEnter = () => {
    if (handleRef.current && !guide.locked && guide.visible) {
      handleRef.current.style.transform = 'scale(1.2)';
    }
  };

  const handleMouseLeave = () => {
    if (handleRef.current && !isDraggingRef.current) {
      handleRef.current.style.transform = 'scale(1)';
    }
  };

  // 컴포넌트 언마운트 시 이벤트 정리
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <>
      {/* 가이드라인 */}
      <div style={getLineStyle()} className="guide-line" data-guide-id={guide.id} />

      {/* 드래그 핸들 */}
      <div
        ref={handleRef}
        className="guide-handle"
        style={getHandleStyle()}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={guide.locked ? '잠긴 가이드라인' : '드래그하여 이동 (더블클릭: 잠금)'}
      />
    </>
  );
}

/**
 * 가이드라인 레이어 컴포넌트
 *
 * 모든 가이드라인을 렌더링하는 컨테이너
 */
interface GuideLinesLayerProps {
  guides: GuideLine[];
  onDragStart: (guideId: string) => void;
  onDrag: (guideId: string, newPosition: number) => void;
  onDragEnd: (guideId: string) => void;
  onDoubleClick: (guideId: string) => void;
}

export function GuideLinesLayer({
  guides,
  onDragStart,
  onDrag,
  onDragEnd,
  onDoubleClick,
}: GuideLinesLayerProps) {
  return (
    <div className="guide-lines-layer fixed inset-0 pointer-events-none">
      {guides.map(guide => (
        <GuideLineHandle
          key={guide.id}
          guide={guide}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onDoubleClick={onDoubleClick}
        />
      ))}
    </div>
  );
}
