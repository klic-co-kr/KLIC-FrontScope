/**
 * Resize Handler
 *
 * 윈도우 리사이즈 시 그리드/화이트스페이스 오버레이 업데이트
 */

import type { GridOverlaySettings, WhitespaceSettings } from '../../types/gridLayout';
import { updateGridOverlay } from '../../utils/gridLayout/grid/gridRenderer';
import { updateWhitespaceOverlay } from '../../utils/gridLayout/grid/whitespacePattern';

/**
 * 윈도우 리사이즈 핸들러 설정
 */
export function setupResizeHandler(
  gridSettings: GridOverlaySettings,
  whitespaceSettings: WhitespaceSettings,
  onGridUpdate?: () => void,
  onWhitespaceUpdate?: () => void
): () => void {
  let resizeTimer: NodeJS.Timeout | undefined;

  const handleResize = () => {
    // 디바운스
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }

    resizeTimer = setTimeout(() => {
      // 그리드 오버레이 업데이트
      if (gridSettings.enabled) {
        updateGridOverlay(gridSettings);
        onGridUpdate?.();
      }

      // 화이트스페이스 업데이트
      if (whitespaceSettings.enabled) {
        updateWhitespaceOverlay(whitespaceSettings);
        onWhitespaceUpdate?.();
      }
    }, 100); // 100ms 디바운스
  };

  // ResizeObserver 사용 (더 정확한 감지)
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === document.body) {
        handleResize();
      }
    }
  });

  // body 요소 관찰 시작
  if (document.body) {
    resizeObserver.observe(document.body);
  }

  // fallback: 윈도우 리사이즈 이벤트도 리스닝
  window.addEventListener('resize', handleResize);

  // 정리 함수 반환
  return () => {
    clearTimeout(resizeTimer);
    resizeObserver.disconnect();
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * 뷰포트 변경 핸들러
 */
export function setupViewportHandler(
  onViewportChange: (width: number, height: number) => void
): () => void {
  let viewportTimer: NodeJS.Timeout | undefined;

  const handleViewportChange = () => {
    if (viewportTimer) {
      clearTimeout(viewportTimer);
    }

    viewportTimer = setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      onViewportChange(width, height);
    }, 50);
  };

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);

  return () => {
    clearTimeout(viewportTimer);
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('orientationchange', handleViewportChange);
  };
}

/**
 * 오리엔테이션 변경 감지
 */
export function setupOrientationHandler(
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void
): () => void {
  const checkOrientation = () => {
    const orientation = window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
    onOrientationChange(orientation);
  };

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);

  // 초기 호출
  checkOrientation();

  return () => {
    window.removeEventListener('resize', checkOrientation);
    window.removeEventListener('orientationchange', checkOrientation);
  };
}

/**
 * 브레이크포인트 변경 감지
 */
export function setupBreakpointHandler(
  onBreakpointChange: (breakpoint: string, width: number) => void,
  breakpoints: Record<string, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  }
): () => void {
  let currentBreakpoint = '';
  let currentWidth = 0;

  const checkBreakpoint = () => {
    const width = window.innerWidth;
    let newBreakpoint = 'sm';

    for (const [name, minWidth] of Object.entries(breakpoints)) {
      if (width >= minWidth) {
        newBreakpoint = name;
      }
    }

    if (newBreakpoint !== currentBreakpoint || width !== currentWidth) {
      currentBreakpoint = newBreakpoint;
      currentWidth = width;
      onBreakpointChange(newBreakpoint, width);
    }
  };

  window.addEventListener('resize', checkBreakpoint);

  // 초기 호출
  checkBreakpoint();

  return () => {
    window.removeEventListener('resize', checkBreakpoint);
  };
}

/**
 * 디바운스 함수
 */
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * 쓰로틀 이벤트 핸들러 (디바운스된)
 */
export function createScrollHandler(
  onScroll: () => void,
  delay: number = 100
): () => void {
  const debouncedScroll = debounce(onScroll, delay);

  window.addEventListener('scroll', debouncedScroll, true);

  return () => {
    window.removeEventListener('scroll', debouncedScroll, true);
  };
}

/**
 * 윈도우 크기 가져오기
 */
export function getWindowSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * 디바이스 픽셀 비율 가져오기
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * 유효한 뷰포트 크기 계산
 */
export function getEffectiveViewportSize(): {
  width: number;
  height: number;
  dpr: number;
} {
  const dpr = getDevicePixelRatio();
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    dpr,
  };
}
