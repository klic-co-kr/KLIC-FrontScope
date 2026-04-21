# Phase 3: 뷰포트 체커

**태스크 범위**: Task #11.16 ~ #11.21 (6개)
**예상 시간**: 2.5시간
**의존성**: Phase 1 완료

---

## Task #11.16: 뷰포트 크기 계산 유틸리티

- **파일**: `src/utils/gridLayout/viewport/viewportCalculator.ts`
- **시간**: 20분
- **의존성**: Task #11.1, #11.4
- **상세 내용**:
```typescript
import { ViewportPreset, ViewportState } from '../../../types/gridLayout';
import { VIEWPORT_PRESETS } from '../../../constants/viewportPresets';

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
export function createCustomViewportState(width: number, height: number): ViewportState {
  return {
    preset: null,
    customWidth: width,
    customHeight: height,
    orientation: height > width ? 'portrait' : 'landscape',
    zoom: 1,
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
 * 뷰포트 크기 조정
 */
export function resizeViewport(state: ViewportState, width: number, height: number): ViewportState {
  const newSize = {
    width: Math.max(320, width),
    height: Math.max(480, height),
  };

  return {
    ...state,
    customWidth: newSize.width,
    customHeight: newSize.height,
    orientation: newSize.height > newSize.width ? 'portrait' : 'landscape',
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
  windowHeight: number
): number {
  const widthRatio = windowWidth / viewportWidth;
  const heightRatio = windowHeight / viewportHeight;
  return Math.min(widthRatio, heightRatio, 1.5); // 최대 1.5배
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
```

---

## Task #11.17: 브레이크포인트 감지

- **파일**: `src/utils/gridLayout/viewport/breakpointDetector.ts`
- **시간**: 20분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { TAILWIND_BREAKPOINTS } from '../../../constants/viewportPresets';

/**
 * 현재 브레이크포인트 감지
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width < TAILWIND_BREAKPOINTS.sm) return 'sm';
  if (width < TAILWIND_BREAKPOINTS.md) return 'md';
  if (width < TAILWIND_BREAKPOINTS.lg) return 'lg';
  if (width < TAILWIND_BREAKPOINTS.xl) return 'xl';
  return '2xl';
}

/**
 * 브레이크포인트 정보
 */
export interface BreakpointInfo {
  current: Breakpoint;
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function getBreakpointInfo(width: number): BreakpointInfo {
  const current = getCurrentBreakpoint(width);

  return {
    current,
    width,
    isMobile: current === 'sm',
    isTablet: current === 'md' || current === 'lg',
    isDesktop: current === 'xl' || current === '2xl',
  };
}

/**
 * 브레이크포인트 변경 감지 (useCallback용)
 */
export function hasBreakpointChanged(oldWidth: number, newWidth: number): boolean {
  return getCurrentBreakpoint(oldWidth) !== getCurrentBreakpoint(newWidth);
}

/**
 * 다음 브레이크포인트 계산
 */
export function getNextBreakpoint(current: Breakpoint, direction: 'up' | 'down'): Breakpoint {
  const breakpoints: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(current);

  if (direction === 'up') {
    return breakpoints[Math.min(currentIndex + 1, breakpoints.length - 1)];
  } else {
    return breakpoints[Math.max(currentIndex - 1, 0)];
  }
}

/**
 * 브레이크포인트별 컬럼 수 가져오기
 */
export function getColumnsForBreakpoint(
  settings: Record<string, { enabled: boolean; columns: number }>,
  breakpoint: Breakpoint
): number {
  const breakpointSettings = settings[breakpoint];
  return breakpointSettings?.enabled ? breakpointSettings.columns : 12;
}
```

---

## Task #11.18: 뷰포트 관리 훅

- **파일**: `src/hooks/gridLayout/useViewport.ts`
- **시간**: 40분
- **의존성**: Task #11.1, #11.2, #11.16, #11.17
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { ViewportState, ViewportPreset } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS, VIEWPORT_PRESETS } from '../../constants/defaults';
import { createViewportStateFromPreset, createCustomViewportState, rotateViewport, setViewportZoom, resizeViewport } from '../../utils/gridLayout/viewport/viewportCalculator';
import { getCurrentBreakpoint, getBreakpointInfo } from '../../utils/gridLayout/viewport/breakpointDetector';

export function useViewport() {
  const [viewport, setViewportState] = useState<ViewportState>(DEFAULT_GRID_LAYOUT_SETTINGS.viewport);

  // 초기 데이터 로드
  useEffect(() => {
    loadViewport();
  }, []);

  const loadViewport = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_VIEWPORT);
      if (result[STORAGE_KEYS.GRID_LAYOUT_VIEWPORT]) {
        setViewportState(result[STORAGE_KEYS.GRID_LAYOUT_VIEWPORT]);
      }
    } catch (error) {
      console.error('Failed to load viewport:', error);
    }
  };

  const saveViewport = async (newViewport: ViewportState) => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_VIEWPORT]: newViewport,
      });
      setViewportState(newViewport);
    } catch (error) {
      console.error('Failed to save viewport:', error);
    }
  };

  // 프리셋 선택
  const selectPreset = useCallback(async (preset: ViewportPreset) => {
    const newViewport = createViewportStateFromPreset(preset);
    await saveViewport(newViewport);
  }, []);

  // 사용자 정의 크기 설정
  const setCustomSize = useCallback(async (width: number, height: number) => {
    const newViewport = createCustomViewportState(width, height);
    await saveViewport(newViewport);
  }, []);

  // 회전
  const rotate = useCallback(async () => {
    const newViewport = rotateViewport(viewport);
    await saveViewport(newViewport);
  }, [viewport]);

  // 줌
  const setZoom = useCallback(async (zoom: number) => {
    const newViewport = setViewportZoom(viewport, zoom);
    await saveViewport(newViewport);
  }, [viewport]);

  // 크기 조정
  const resize = useCallback(async (width: number, height: number) => {
    const newViewport = resizeViewport(viewport, width, height);
    await saveViewport(newViewport);
  }, [viewport]);

  // 현재 브레이크포인트
  const currentBreakpoint = getCurrentBreakpoint(viewport.customWidth);
  const breakpointInfo = getBreakpointInfo(viewport.customWidth);

  return {
    viewport,
    currentBreakpoint,
    breakpointInfo,
    selectPreset,
    setCustomSize,
    rotate,
    setZoom,
    resize,
  };
}
```
- **완료 조건**: 뷰포트 CRUD 동작 검증

---

## Task #11.19: 뷰포트 오버레이 생성

- **파일**: `src/utils/gridLayout/viewport/viewportOverlay.ts`
- **시간**: 25분
- **의존성**: Task #11.1, #11.16
- **상세 내용**:
```typescript
import { ViewportState } from '../../../types/gridLayout';

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
  };
}

/**
 * 뷰포트 정보 오버레이 스타일
 */
export function createViewportInfoStyle(state: ViewportState): React.CSSProperties {
  return {
    position: 'fixed',
    top: '10px',
    right: '10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 9999,
    pointerEvents: 'none',
  };
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
 * 뷰포트 크기 표시 컴포넌트용 데이터
 */
export interface ViewportDisplayData {
  text: string;
  presetName: string;
  resolution: string;
  orientation: string;
  zoom: number;
}

export function getViewportDisplayData(state: ViewportState): ViewportDisplayData {
  return {
    text: createViewportInfoText(state),
    presetName: state.preset?.name || 'Custom',
    resolution: `${state.customWidth}×${state.customHeight}`,
    orientation: state.orientation,
    zoom: state.zoom,
  };
}
```

---

## Task #11.20: 뷰포트 리사이저

- **파일**: `src/utils/gridLayout/viewport/viewportResizer.ts`
- **시간**: 25분
- **의존성**: Task #11.1, #11.16
- **상세 내용**:
```typescript
import { ViewportState } from '../../../types/gridLayout';

/**
 * 리사이저 핸들 위치
 */
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * 리사이저 상태
 */
export interface ResizerState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

/**
 * 리사이징 시작
 */
export function startResize(
  handle: ResizeHandle,
  mouseX: number,
  mouseY: number,
  currentWidth: number,
  currentHeight: number
): ResizerState {
  return {
    isResizing: true,
    handle,
    startX: mouseX,
    startY: mouseY,
    startWidth: currentWidth,
    startHeight: currentHeight,
  };
}

/**
 * 리사이징 중 크기 계산
 */
export function calculateResize(
  state: ResizerState,
  mouseX: number,
  mouseY: number,
  minWidth: number = 320,
  minHeight: number = 480
): { width: number; height: number } {
  if (!state.isResizing || !state.handle) {
    return { width: state.startWidth, height: state.startHeight };
  }

  let newWidth = state.startWidth;
  let newHeight = state.startHeight;

  const deltaX = mouseX - state.startX;
  const deltaY = mouseY - state.startY;

  // 동쪽 핸들 (우측)
  if (state.handle.includes('e')) {
    newWidth = Math.max(minWidth, state.startWidth + deltaX);
  }

  // 서쪽 핸들 (좌측)
  if (state.handle.includes('w')) {
    newWidth = Math.max(minWidth, state.startWidth - deltaX);
  }

  // 남쪽 핸들 (하단)
  if (state.handle.includes('s')) {
    newHeight = Math.max(minHeight, state.startHeight + deltaY);
  }

  // 북쪽 핸들 (상단)
  if (state.handle.includes('n')) {
    newHeight = Math.max(minHeight, state.startHeight - deltaY);
  }

  return { width: newWidth, height: newHeight };
}

/**
 * 리사이징 종료
 */
export function endResize(): Partial<ResizerState> {
  return {
    isResizing: false,
    handle: null,
  };
}

/**
 * 핸들 커서 스타일
 */
export function getHandleCursor(handle: ResizeHandle): string {
  const cursorMap: Record<ResizeHandle, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
    sw: 'nesw-resize',
  };
  return cursorMap[handle];
}

/**
 * 핸들 위치 계산
 */
export function getHandlePosition(
  handle: ResizeHandle,
  width: number,
  height: number,
  handleSize: number = 10
): { top: number; left: number } {
  const half = handleSize / 2;

  switch (handle) {
    case 'n':
      return { top: -half, left: width / 2 - half };
    case 's':
      return { top: height - half, left: width / 2 - half };
    case 'e':
      return { top: height / 2 - half, left: width - half };
    case 'w':
      return { top: height / 2 - half, left: -half };
    case 'ne':
      return { top: -half, left: width - half };
    case 'nw':
      return { top: -half, left: -half };
    case 'se':
      return { top: height - half, left: width - half };
    case 'sw':
      return { top: height - half, left: -half };
    default:
      return { top: 0, left: 0 };
  }
}
```

---

## Task #11.21: 뷰포트 프리셋 선택기

- **파일**: `src/utils/gridLayout/viewport/presetSelector.ts`
- **시간**: 20분
- **의존성**: Task #11.1, #11.4
- **상세 내용**:
```typescript
import { ViewportPreset, DeviceCategory } from '../../../types/gridLayout';
import { VIEWPORT_PRESETS_BY_CATEGORY } from '../../../constants/viewportPresets';

/**
 * 카테고리별 프리셋 그룹화
 */
export function groupPresetsByCategory(presets: readonly ViewportPreset[]): Record<DeviceCategory, ViewportPreset[]> {
  return {
    mobile: presets.filter(p => p.category === 'mobile'),
    tablet: presets.filter(p => p.category === 'tablet'),
    desktop: presets.filter(p => p.category === 'desktop'),
    custom: [],
  };
}

/**
 * 프리셋 검색
 */
export function searchPresets(presets: readonly ViewportPreset[], query: string): ViewportPreset[] {
  const lowerQuery = query.toLowerCase();
  return presets.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 해상도로 프리셋 찾기
 */
export function findPresetByResolution(presets: readonly ViewportPreset[], width: number, height: number): ViewportPreset | undefined {
  return presets.find(p => p.width === width && p.height === height);
}

/**
 * 유사한 해상도의 프리셋 찾기
 */
export function findSimilarPreset(presets: readonly ViewportPreset[], width: number, height: number, tolerance: number = 50): ViewportPreset | undefined {
  return presets.find(p =>
    Math.abs(p.width - width) <= tolerance &&
    Math.abs(p.height - height) <= tolerance
  );
}

/**
 * 프리셋 정렬
 */
export function sortPresets(presets: readonly ViewportPreset[], sortBy: 'name' | 'resolution' | 'category'): ViewportPreset[] {
  const sorted = [...presets];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'resolution':
      return sorted.sort((a, b) => (a.width * a.height) - (b.width * b.height));
    case 'category':
      return sorted.sort((a, b) => {
        const categoryOrder = { mobile: 0, tablet: 1, desktop: 2, custom: 3 };
        return categoryOrder[a.category] - categoryOrder[b.category];
      });
    default:
      return sorted;
  }
}
```

---

**완료 후 다음 단계**: [Phase 4: 그리드 오버레이](./TASK-11-phase-04-grid-overlay.md)
