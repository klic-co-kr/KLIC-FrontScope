/**
 * Breakpoint Indicator Component
 *
 * 현재 뷰포트의 반응형 브레이크포인트를 시각화하는 컴포넌트
 */

import React from 'react';
import { TAILWIND_BREAKPOINTS } from '../../constants/viewportPresets';
import { getCurrentBreakpoint, getBreakpointInfo } from '../../utils/gridLayout/viewport/breakpointDetector';

interface BreakpointIndicatorProps {
  currentWidth: number;
  variant?: 'compact' | 'detailed' | 'minimal';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  showLabels?: boolean;
  showNextBreakpoint?: boolean;
  className?: string;
}

export function BreakpointIndicator({
  currentWidth,
  variant = 'compact',
  position = 'top-right',
  showLabels = true,
  showNextBreakpoint = true,
  className = '',
}: BreakpointIndicatorProps) {
  const currentBreakpoint = getCurrentBreakpoint(currentWidth);
  const breakpointInfo = getBreakpointInfo(currentWidth);

  // 현재 브레이크포인트에 따른 색상
  const getBreakpointColor = (bp: string): string => {
    const colorMap: Record<string, string> = {
      sm: 'bg-green-500',
      md: 'bg-yellow-500',
      lg: 'bg-orange-500',
      xl: 'bg-red-500',
      '2xl': 'bg-purple-500',
    };
    return colorMap[bp] || 'bg-gray-500';
  };

  // 포지션 스타일
  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyle, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyle, bottom: '10px', left: '10px' };
      case 'bottom-right':
        return { ...baseStyle, bottom: '10px', right: '10px' };
      case 'inline':
        return { ...baseStyle, position: 'relative' };
      default:
        return { ...baseStyle, top: '10px', right: '10px' };
    }
  };

  // 컴팩트 버전
  if (variant === 'compact') {
    return (
      <div
        className={`breakpoint-indicator-compact flex items-center gap-2 px-3 py-1.5 bg-gray-900/95 text-white rounded-lg shadow-lg backdrop-blur-sm ${className}`}
        style={getPositionStyle()}
      >
        <div className={`w-2 h-2 rounded-full ${getBreakpointColor(currentBreakpoint)} animate-pulse`} />
        <span className="text-sm font-bold">{currentBreakpoint.toUpperCase()}</span>
        <span className="text-xs text-gray-400">{currentWidth}px</span>
      </div>
    );
  }

  // 미니멀 버전
  if (variant === 'minimal') {
    return (
      <div
        className={`breakpoint-indicator-minimal ${className}`}
        style={getPositionStyle()}
      >
        <div className={`px-2 py-1 ${getBreakpointColor(currentBreakpoint)} text-white text-xs font-bold rounded shadow-lg`}>
          {currentBreakpoint}
        </div>
      </div>
    );
  }

  // 상세 버전
  return (
    <div
      className={`breakpoint-indicator-detailed bg-gray-900/95 text-white rounded-lg shadow-xl backdrop-blur-sm p-3 ${className}`}
      style={getPositionStyle()}
    >
      {/* 현재 브레이크포인트 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getBreakpointColor(currentBreakpoint)} animate-pulse`} />
        <span className="text-lg font-bold">{currentBreakpoint.toUpperCase()}</span>
        <span className="text-sm text-gray-400">{currentWidth}px</span>
      </div>

      {/* 브레이크포인트 바 */}
      <div className="breakpoint-bar flex gap-0.5 mb-2">
        {(Object.keys(TAILWIND_BREAKPOINTS) as Array<keyof typeof TAILWIND_BREAKPOINTS>).map(bp => {
          const isActive = currentWidth >= TAILWIND_BREAKPOINTS[bp];
          return (
            <div
              key={bp}
              className={`h-1.5 flex-1 rounded transition-all ${
                isActive ? getBreakpointColor(bp) : 'bg-gray-700'
              }`}
              title={`${bp.toUpperCase()}: ${TAILWIND_BREAKPOINTS[bp]}px`}
            />
          );
        })}
      </div>

      {/* 다음 브레이크포인트 정보 */}
      {showNextBreakpoint && breakpointInfo.nextBreakpoint && (
        <div className="next-breakpoint text-xs text-gray-400">
          다음: {breakpointInfo.nextBreakpoint.toUpperCase()} ({breakpointInfo.distanceToNext}px)
        </div>
      )}

      {/* 범위 정보 */}
      {showLabels && (
        <div className="range-info mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
          {breakpointInfo.min}px ~ {breakpointInfo.max}px
        </div>
      )}
    </div>
  );
}

/**
 * 브레이크포인트 바 컴포넌트
 *
 * 모든 브레이크포인트를 시각적으로 표시
 */
interface BreakpointBarProps {
  currentWidth: number;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function BreakpointBar({
  currentWidth,
  showLabels = true,
  orientation = 'horizontal',
  className = '',
}: BreakpointBarProps) {
  const currentBreakpoint = getCurrentBreakpoint(currentWidth);
  const breakpoints = Object.entries(TAILWIND_BREAKPOINTS) as Array<[string, number]>;

  // 현재 브레이크포인트 색상
  const getBreakpointColor = (bp: string): string => {
    const colorMap: Record<string, string> = {
      sm: 'bg-green-500',
      md: 'bg-yellow-500',
      lg: 'bg-orange-500',
      xl: 'bg-red-500',
      '2xl': 'bg-purple-500',
    };
    return colorMap[bp] || 'bg-gray-500';
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={`breakpoint-bar-container ${isHorizontal ? 'flex-row' : 'flex-col'} flex gap-1 ${className}`}
    >
      {breakpoints.map(([bp, minWidth]) => {
        const isActive = currentWidth >= minWidth;
        const isCurrent = bp === currentBreakpoint;

        return (
          <div
            key={bp}
            className={`breakpoint-segment flex-1 relative ${isHorizontal ? 'h-4' : 'w-4'} ${
              isActive ? getBreakpointColor(bp) : 'bg-gray-700'
            } ${isCurrent ? 'ring-2 ring-white' : ''} rounded transition-all`}
            title={`${bp.toUpperCase()}: ${minWidth}px+`}
          >
            {showLabels && isActive && (
              <span
                className={`absolute ${isHorizontal ? 'bottom-full mb-1 left-1/2 -translate-x-1/2' : 'right-full mr-1 top-1/2 -translate-y-1/2'} text-xs font-bold text-white whitespace-nowrap`}
              >
                {bp.toUpperCase()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 브레이크포인트 목록 컴포넌트
 *
 * 모든 브레이크포인트를 목록 형태로 표시
 */
interface BreakpointListProps {
  currentWidth: number;
  className?: string;
}

export function BreakpointList({ currentWidth, className = '' }: BreakpointListProps) {
  const currentBreakpoint = getCurrentBreakpoint(currentWidth);
  const breakpoints = Object.entries(TAILWIND_BREAKPOINTS) as Array<[string, number]>;

  return (
    <div className={`breakpoint-list space-y-1 ${className}`}>
      {breakpoints.map(([bp, minWidth]) => {
        const isActive = currentWidth >= minWidth;
        const isCurrent = bp === currentBreakpoint;

        return (
          <div
            key={bp}
            className={`breakpoint-item flex items-center justify-between px-3 py-2 rounded transition-colors ${
              isCurrent
                ? 'bg-blue-600 text-white'
                : isActive
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-current' : 'bg-gray-600'
                }`}
              />
              <span className="text-sm font-medium">{bp.toUpperCase()}</span>
            </div>
            <span className="text-xs font-mono">{minWidth}px+</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 브레이크포인트 척도 컴포넌트
 *
 * 현재 너비가 브레이크포인트 척도상에서 어디에 위치하는지 시각화
 */
interface BreakpointRulerProps {
  currentWidth: number;
  maxWidth?: number;
  showLabels?: boolean;
  className?: string;
}

export function BreakpointRuler({
  currentWidth,
  maxWidth = 2000,
  showLabels = true,
  className = '',
}: BreakpointRulerProps) {
  const breakpoints = Object.entries(TAILWIND_BREAKPOINTS) as Array<[string, number]>;
  const currentBreakpoint = getCurrentBreakpoint(currentWidth);

  // 현재 위치 퍼센트 계산
  const currentPosition = Math.min((currentWidth / maxWidth) * 100, 100);

  return (
    <div className={`breakpoint-ruler ${className}`}>
      {/* 척도 */}
      <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
        {/* 브레이크포인트 마커 */}
        {breakpoints.map(([bp, minWidth]) => {
          const position = Math.min((minWidth / maxWidth) * 100, 100);
          const isPast = currentWidth >= minWidth;

          return (
            <React.Fragment key={bp}>
              {/* 마커 선 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gray-500"
                style={{ left: `${position}%` }}
              />
              {/* 마커 라벨 */}
              {showLabels && position < 95 && (
                <div
                  className={`absolute top-full mt-1 text-xs font-medium transform -translate-x-1/2 ${
                    isPast ? 'text-blue-400' : 'text-gray-500'
                  }`}
                  style={{ left: `${position}%` }}
                >
                  {bp.toUpperCase()}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* 현재 위치 인디케이터 */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-lg z-10"
          style={{ left: `${currentPosition}%` }}
        >
          {/* 인디케이터 상단 삼각형 */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500" />
        </div>
      </div>

      {/* 현재 값 표시 */}
      <div className="mt-3 text-center">
        <span className="text-sm text-gray-400">현재: </span>
        <span className="text-lg font-bold text-white">{currentWidth}px</span>
        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
          {currentBreakpoint.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
