/**
 * Grid Overlay Display Component
 *
 * 그리드 오버레이를 실제로 렌더링하는 컴포넌트
 */

import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import type { GridOverlaySettings, WhitespaceSettings } from '../../types/gridLayout';
import { generateColumnGridLines } from '../../utils/gridLayout/grid/gridRenderer';
import { getCurrentBreakpoint } from '../../utils/gridLayout/viewport/breakpointDetector';

interface GridOverlayDisplayProps {
  settings: GridOverlaySettings;
  whitespace?: WhitespaceSettings;
  containerWidth?: number;
  containerHeight?: number;
  onColumnClick?: (columnIndex: number) => void;
  className?: string;
}

export function GridOverlayDisplay({
  settings,
  whitespace,
  containerWidth = window.innerWidth,
  containerHeight = window.innerHeight,
  onColumnClick,
  className = '',
}: GridOverlayDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // margin 파싱
  const parseMargin = useCallback((margin: string | number): number => {
    if (typeof margin === 'number') return margin;
    const parsed = parseInt(margin);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // 현재 브레이크포인트에 따른 컬럼 수 계산
  const currentBreakpoint = getCurrentBreakpoint(containerWidth);
  const currentColumns = settings.breakpoints[currentBreakpoint]?.enabled
    ? settings.breakpoints[currentBreakpoint].columns
    : settings.columns;

  // 컬럼 너비 계산
  const marginTotal = (parseMargin(settings.margin) || 0) * 2;
  const gapTotal = (settings.gap || 0) * (currentColumns - 1);
  const columnWidth = Math.max(0, (containerWidth - marginTotal - gapTotal) / currentColumns);

  // 그리드 오버레이 스타일 생성
  const gridOverlayStyle = useMemo(() => {
    if (!settings.enabled) return null;

    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      zIndex: settings.zIndex ?? 9998,
      opacity: settings.opacity,
      display: 'flex',
      justifyContent: 'center',
      gap: `${settings.gap}px`,
      padding: `0 ${settings.margin}px`,
    };
  }, [settings.enabled, settings.gap, settings.margin, settings.opacity, settings.zIndex]);

  // 컬럼 스타일 생성
  const columnStyle = useMemo(() => {
    if (!settings.enabled) return null;

    const lineWidth = settings.lineWidth ?? 1;

    return {
      flex: '0 0 auto',
      width: `${columnWidth}px`,
      height: '100%',
      borderLeft: `${lineWidth}px ${settings.style} ${settings.color}`,
      borderRight: `${lineWidth}px ${settings.style} ${settings.color}`,
      backgroundColor: settings.showColumnBackgrounds ? `${settings.color}10` : 'transparent',
      cursor: onColumnClick ? ('pointer' as const) : ('default' as const),
      pointerEvents: onColumnClick ? ('auto' as const) : ('none' as const),
    };
  }, [settings.enabled, settings.lineWidth, settings.style, settings.color, settings.showColumnBackgrounds, columnWidth, onColumnClick]);

  // 화이트스페이스 오버레이 스타일
  const whitespaceStyle = useMemo(() => {
    if (!whitespace?.enabled) return null;

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: (settings.zIndex ?? 9998) - 1,
      opacity: whitespace.opacity,
    } as React.CSSProperties;

    switch (whitespace.pattern) {
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: whitespace.color,
        };
      case 'diagonal':
        return {
          ...baseStyle,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent ${whitespace.size / 2}px,
            ${whitespace.color} ${whitespace.size / 2}px,
            ${whitespace.color} ${whitespace.size}px
          )`,
          backgroundSize: `${whitespace.size}px ${whitespace.size}px`,
        };
      case 'crosshatch':
        return {
          ...baseStyle,
          backgroundImage: `
            linear-gradient(${whitespace.color} 1px, transparent 1px),
            linear-gradient(90deg, ${whitespace.color} 1px, transparent 1px)
          `,
          backgroundSize: `${whitespace.size}px ${whitespace.size}px`,
        };
      default:
        return baseStyle;
    }
  }, [whitespace, settings.zIndex]);

  // 컬럼 렌더링
  const renderColumns = () => {
    if (!settings.enabled) return null;

    const columns: React.ReactNode[] = [];

    for (let i = 0; i < currentColumns; i++) {
      const showNumber = settings.showColumnNumbers;
      columns.push(
        <div
          key={`column-${i}`}
          className="grid-column"
          style={columnStyle ?? undefined}
          onClick={() => onColumnClick?.(i)}
        >
          {showNumber && (
            <div className="column-number absolute top-2 left-1/2 -translate-x-1/2 text-xs font-mono bg-black/50 text-white px-1 rounded">
              {i + 1}
            </div>
          )}
        </div>
      );
    }
    return columns;
  };

  // 컬럼 그리드 선 (SVG)
  const renderGridLines = () => {
    if (!settings.enabled) return null;

    const lines = generateColumnGridLines(
      currentColumns,
      containerWidth,
      containerHeight,
      parseMargin(settings.margin),
      settings.gap,
      settings.color,
      settings.lineWidth ?? 1,
      settings.style
    );

    return (
      <svg
        className="grid-lines-svg absolute inset-0 w-full h-full"
        style={{ zIndex: (settings.zIndex ?? 9998) + 1 }}
      >
        {lines.map((line, index) => (
          <line
            key={`grid-line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.stroke}
            strokeWidth={line.strokeWidth}
            strokeDasharray={line.strokeDasharray}
          />
        ))}
      </svg>
    );
  };

  // 컨테이너 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      // 크기 변경 시 재렌더링은 자동으로 처리됨
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!settings.enabled && !whitespace?.enabled) {
    return null;
  }

  return (
    <div ref={containerRef} className={`grid-overlay-display ${className}`}>
      {/* 화이트스페이스 오버레이 */}
      {whitespace?.enabled && (
        <div className="whitespace-overlay" style={whitespaceStyle ?? undefined} />
      )}

      {/* 그리드 컬럼 오버레이 */}
      {settings.enabled && (
        <div className="grid-columns-container" style={gridOverlayStyle ?? undefined}>
          {renderColumns()}
        </div>
      )}

      {/* 그리드 선 SVG */}
      {settings.enabled && renderGridLines()}

      {/* 컬럼 정보 표시 */}
      {settings.enabled && settings.showInfo && (
        <div
          className="grid-info fixed bottom-4 right-4 bg-gray-900/90 text-white px-3 py-2 rounded-lg text-xs"
          style={{ zIndex: (settings.zIndex ?? 9998) + 10 }}
        >
          <div>컬럼: {currentColumns}</div>
          <div>간격: {settings.gap}px</div>
          <div>여백: {settings.margin}px</div>
          <div>너비: {containerWidth}px</div>
          <div>브레이크포인트: {currentBreakpoint.toUpperCase()}</div>
        </div>
      )}
    </div>
  );
}

/**
 * 캔버스 기반 그리드 오버레이
 *
 * Canvas API를 사용한 고성능 그리드 렌더링
 */
interface CanvasGridOverlayProps {
  settings: GridOverlaySettings;
  width: number;
  height: number;
  className?: string;
}

export function CanvasGridOverlay({
  settings,
  width,
  height,
  className = '',
}: CanvasGridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // margin 파싱
  const parseMargin = useCallback((margin: string | number): number => {
    if (typeof margin === 'number') return margin;
    const parsed = parseInt(margin);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !settings.enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = width;
    canvas.height = height;

    // 클리어
    ctx.clearRect(0, 0, width, height);

    // 스타일 설정
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = settings.lineWidth ?? 1;
    ctx.globalAlpha = settings.opacity;

    // 대시 패턴 설정
    if (settings.style === 'dashed') {
      ctx.setLineDash([10, 5]);
    } else if (settings.style === 'dotted') {
      ctx.setLineDash([2, 4]);
    } else {
      ctx.setLineDash([]);
    }

    // 컬럼 수 계산
    const currentBreakpoint = getCurrentBreakpoint(width);
    const currentColumns = settings.breakpoints[currentBreakpoint]?.enabled
      ? settings.breakpoints[currentBreakpoint].columns
      : settings.columns;

    // 컬럼 그리기
    const numMargin = parseMargin(settings.margin);
    const columnWidth = (width - numMargin * 2 - settings.gap * (currentColumns - 1)) / currentColumns;
    const startX = numMargin;

    for (let i = 0; i <= currentColumns; i++) {
      const x = startX + i * (columnWidth + settings.gap);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // 컬럼 번호 표시
      if (settings.showColumnNumbers && i < currentColumns) {
        ctx.fillStyle = settings.color;
        ctx.font = '12px monospace';
        ctx.fillText(`${i + 1}`, x + 5, 20);
      }
    }

    // 상하단 가로선
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(width - startX, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, height);
    ctx.lineTo(width - startX, height);
    ctx.stroke();

  }, [settings, width, height, parseMargin]);

  if (!settings.enabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`canvas-grid-overlay ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        zIndex: settings.zIndex ?? 9998,
      }}
    />
  );
}

/**
 * 미리보기 그리드 컴포넌트
 *
 * 설정을 미리볼 수 있는 작은 그리드 프리뷰
 */
interface GridPreviewProps {
  settings: GridOverlaySettings;
  size?: number;
  className?: string;
}

export function GridPreview({
  settings,
  size = 200,
  className = '',
}: GridPreviewProps) {
  const previewColumns = Math.min(settings.columns, 12);

  // margin 파싱
  const parseMargin = (margin: string | number): number => {
    if (typeof margin === 'number') return margin;
    const parsed = parseInt(margin);
    return isNaN(parsed) ? 0 : parsed;
  };

  const numMargin = parseMargin(settings.margin);

  return (
    <div
      className={`grid-preview ${className}`}
      style={{
        width: `${size}px`,
        height: `${size * 0.6}px`,
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 컬럼들 */}
      <div
        className="flex h-full"
        style={{
          gap: `${Math.max(2, settings.gap / 10)}px`,
          padding: `0 ${Math.max(4, numMargin / 10)}px`,
        }}
      >
        {Array.from({ length: previewColumns }).map((_, i) => (
          <div
            key={`preview-column-${i}`}
            className="flex-1 bg-blue-500/30"
            style={{
              borderLeft: `1px ${settings.style} ${settings.color}`,
              borderRight: `1px ${settings.style} ${settings.color}`,
              opacity: settings.opacity,
            }}
          />
        ))}
      </div>

      {/* 컬럼 수 표시 */}
      <div className="absolute bottom-1 right-2 text-xs text-gray-400">
        {settings.columns} cols
      </div>
    </div>
  );
}
