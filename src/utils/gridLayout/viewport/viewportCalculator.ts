/**
 * Viewport Calculator Utilities
 *
 * 뷰포트 크기 계산 및 조작 관련 유틸리티 함수들
 */

import type { ViewportPreset, ViewportState } from '../../../types/gridLayout';

/**
 * 현재 윈도우 크기 가져오기
 */
export function getWindowSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * 현재 뷰포트 크기 가져오기
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}

/**
 * 프리셋으로 뷰포트 상태 생성
 */
export function createViewportStateFromPreset(preset: ViewportPreset): ViewportState {
  const isPortrait = preset.height > preset.width;

  return {
    preset,
    customWidth: preset.width,
    customHeight: preset.height,
    orientation: isPortrait ? 'portrait' : 'landscape',
    zoom: 1,
  };
}

/**
 * 사용자 정의 뷰포트 상태 생성
 */
export function createCustomViewportState(
  width: number,
  height: number,
  zoom: number = 1
): ViewportState {
  return {
    preset: null,
    customWidth: Math.max(320, width),
    customHeight: Math.max(480, height),
    orientation: height > width ? 'portrait' : 'landscape',
    zoom: Math.max(0.1, Math.min(zoom, 2.0)),
  };
}

/**
 * 뷰포트 회전 (가로 ↔ 세로)
 */
export function rotateViewport(state: ViewportState): ViewportState {
  return {
    ...state,
    customWidth: state.customHeight,
    customHeight: state.customWidth,
    orientation: state.orientation === 'portrait' ? 'landscape' : 'portrait',
  };
}

/**
 * 뷰포트 줌 변경
 */
export function setViewportZoom(state: ViewportState, zoom: number): ViewportState {
  const clampedZoom = Math.max(0.1, Math.min(zoom, 2.0));
  return {
    ...state,
    zoom: clampedZoom,
  };
}

/**
 * 뷰포트 줌 증가/감소
 */
export function adjustViewportZoom(
  state: ViewportState,
  delta: number,
  step: number = 0.1
): ViewportState {
  const newZoom = Math.round((state.zoom + delta * step) * 10) / 10;
  return setViewportZoom(state, newZoom);
}

/**
 * 뷰포트 크기 조정
 */
export function resizeViewport(
  state: ViewportState,
  width: number,
  height: number
): ViewportState {
  const newWidth = Math.max(320, Math.min(width, 7680));
  const newHeight = Math.max(480, Math.min(height, 7680));

  return {
    ...state,
    customWidth: newWidth,
    customHeight: newHeight,
    orientation: newHeight > newWidth ? 'portrait' : 'landscape',
    preset: null, // 사용자 정의 크기는 프리셋 연결 해제
  };
}

/**
 * 화면에 맞는 줌 레벨 계산
 */
export function calculateFitZoom(
  viewportWidth: number,
  viewportHeight: number,
  windowWidth: number,
  windowHeight: number,
  padding: number = 40
): number {
  const availableWidth = windowWidth - padding;
  const availableHeight = windowHeight - padding;

  const widthRatio = availableWidth / viewportWidth;
  const heightRatio = availableHeight / viewportHeight;

  const fitZoom = Math.min(widthRatio, heightRatio);
  return Math.max(0.1, Math.min(fitZoom, 2.0));
}

/**
 * DPI 스케일링 계산
 */
export function getDPIScale(): number {
  return window.devicePixelRatio || 1;
}

/**
 * CSS 픽셀을 장치 픽셀로 변환
 */
export function cssToDevicePixels(cssPixels: number): number {
  return cssPixels * getDPIScale();
}

/**
 * 장치 픽셀을 CSS 픽셀로 변환
 */
export function deviceToCssPixels(devicePixels: number): number {
  return devicePixels / getDPIScale();
}

/**
 * 뷰포트 상태 복제
 */
export function cloneViewportState(state: ViewportState): ViewportState {
  return {
    ...state,
    preset: state.preset ? { ...state.preset } : null,
  };
}

/**
 * 뷰포트 비율 계산
 */
export function getViewportAspectRatio(state: ViewportState): number {
  return state.customWidth / state.customHeight;
}

/**
 * 뷰포트 넓이 계산 (px²)
 */
export function getViewportArea(state: ViewportState): number {
  return state.customWidth * state.customHeight;
}

/**
 * 뷰포트가 유효한지 확인
 */
export function isValidViewportSize(width: number, height: number): boolean {
  return (
    width >= 320 &&
    width <= 7680 &&
    height >= 480 &&
    height <= 7680
  );
}

/**
 * 줌 레벨이 유효한지 확인
 */
export function isValidZoomLevel(zoom: number): boolean {
  return zoom >= 0.1 && zoom <= 2.0;
}

/**
 * 뷰포트 방향이 세로인지 확인
 */
export function isPortrait(state: ViewportState): boolean {
  return state.orientation === 'portrait';
}

/**
 * 뷰포트 방향이 가로인지 확인
 */
export function isLandscape(state: ViewportState): boolean {
  return state.orientation === 'landscape';
}
