/**
 * Viewport Overlay Utilities
 *
 * 뷰포트 오버레이 생성 및 스타일 관련 유틸리티 함수들
 */

import type { ViewportState } from '../../../types/gridLayout';

/**
 * 뷰포트 오버레이 스타일 생성
 */
export function createViewportOverlayStyle(state: ViewportState): React.CSSProperties {
  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${state.zoom})`,
    width: `${state.customWidth}px`,
    height: `${state.customHeight}px`,
    border: '2px solid #3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    pointerEvents: 'none',
    zIndex: 9997,
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };
}

/**
 * 뷰포트 오버레이 스타일 생성 (커스텀 색상)
 */
export function createViewportOverlayStyleWithOptions(
  state: ViewportState,
  options: {
    borderColor?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderRadius?: number;
  } = {}
): React.CSSProperties {
  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${state.zoom})`,
    width: `${state.customWidth}px`,
    height: `${state.customHeight}px`,
    border: `${options.borderWidth || 2}px solid ${options.borderColor || '#3B82F6'}`,
    backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.05)',
    pointerEvents: 'none',
    zIndex: 9997,
    borderRadius: `${options.borderRadius || 4}px`,
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };
}

/**
 * 뷰포트 정보 오버레이 스타일
 */
export function createViewportInfoStyle(
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right'
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 9999,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
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
  }
}

/**
 * 뷰포트 정보 텍스트 생성
 */
export function createViewportInfoText(state: ViewportState): string {
  const presetName = state.preset ? state.preset.name : 'Custom';
  const orientation = state.orientation === 'portrait' ? '↕' : '↔';
  const zoom = state.zoom !== 1 ? ` (${Math.round(state.zoom * 100)}%)` : '';

  return `${presetName} ${orientation} • ${state.customWidth}×${state.customHeight}${zoom}`;
}

/**
 * 상세 뷰포트 정보 텍스트 생성
 */
export function createDetailedViewportInfoText(state: ViewportState): string[] {
  const presetName = state.preset ? state.preset.name : 'Custom';
  const orientation = state.orientation === 'portrait' ? 'Portrait' : 'Landscape';
  const zoomPercent = Math.round(state.zoom * 100);
  const dpr = state.preset?.devicePixelRatio || window.devicePixelRatio || 1;

  return [
    `${presetName}`,
    `${state.customWidth} × ${state.customHeight}`,
    `${orientation}`,
    `Zoom: ${zoomPercent}%`,
    `DPR: ${dpr}x`,
  ];
}

/**
 * 뷰포트 크기 표시 컴포넌트용 데이터
 */
export interface ViewportDisplayData {
  text: string;
  presetName: string;
  resolution: string;
  orientation: string;
  zoom: number;
  zoomPercent: number;
  dpr: number;
}

/**
 * 뷰포트 표시 데이터 가져오기
 */
export function getViewportDisplayData(state: ViewportState): ViewportDisplayData {
  return {
    text: createViewportInfoText(state),
    presetName: state.preset?.name || 'Custom',
    resolution: `${state.customWidth}×${state.customHeight}`,
    orientation: state.orientation,
    zoom: state.zoom,
    zoomPercent: Math.round(state.zoom * 100),
    dpr: state.preset?.devicePixelRatio || window.devicePixelRatio || 1,
  };
}

/**
 * 뷰포트 코너 핸들 스타일 (리사이즈용)
 */
export function createCornerHandleStyle(
  corner: 'tl' | 'tr' | 'bl' | 'br',
  size: number = 10
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: '#3B82F6',
    border: '2px solid #fff',
    borderRadius: '2px',
    cursor: 'pointer',
    zIndex: 10000,
  };

  switch (corner) {
    case 'tl':
      return { ...baseStyle, top: `-${size / 2}px`, left: `-${size / 2}px`, cursor: 'nwse-resize' };
    case 'tr':
      return { ...baseStyle, top: `-${size / 2}px`, right: `-${size / 2}px`, cursor: 'nesw-resize' };
    case 'bl':
      return { ...baseStyle, bottom: `-${size / 2}px`, left: `-${size / 2}px`, cursor: 'nesw-resize' };
    case 'br':
      return { ...baseStyle, bottom: `-${size / 2}px`, right: `-${size / 2}px`, cursor: 'nwse-resize' };
  }
}

/**
 * 뷰포트 프레임 스타일 (외부 테두리)
 */
export function createViewportFrameStyle(
  width: number,
  height: number,
  color: string = '#3B82F6'
): React.CSSProperties {
  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${width}px`,
    height: `${height}px`,
    border: `2px dashed ${color}`,
    pointerEvents: 'none',
    zIndex: 9996,
    borderRadius: '4px',
  };
}

/**
 * 뷰포트 측정 표시 스타일
 */
export function createMeasurementLabelStyle(
  x: number,
  y: number
): React.CSSProperties {
  return {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    zIndex: 10001,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };
}
