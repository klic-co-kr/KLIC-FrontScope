# Phase 4: 그리드 오버레이

**태스크 범위**: Task #11.22 ~ #11.29 (8개)
**예상 시간**: 3.5시간
**의존성**: Phase 1 완료

---

## Task #11.22: 그리드 계산 유틸리티

- **파일**: `src/utils/gridLayout/grid/gridCalculator.ts`
- **시간**: 25분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { GridOverlaySettings } from '../../../types/gridLayout';
import { TAILWIND_BREAKPOINTS } from '../../../constants/viewportPresets';

/**
 * 그리드 컬럼 너비 계산
 */
export function calculateColumnWidths(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): number[] {
  const availableWidth = containerWidth - (margin * 2) - (gap * (columns - 1));
  const columnWidth = availableWidth / columns;

  return Array(columns).fill(columnWidth);
}

/**
 * 그리드 컬럼 위치 계산
 */
export interface ColumnPosition {
  index: number;
  startX: number;
  endX: number;
  width: number;
}

export function calculateColumnPositions(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): ColumnPosition[] {
  const positions: ColumnPosition[] = [];
  const columnWidths = calculateColumnWidths(containerWidth, columns, gap, margin);

  let currentX = margin;

  columnWidths.forEach((width, index) => {
    positions.push({
      index,
      startX: currentX,
      endX: currentX + width,
      width,
    });
    currentX += width + gap;
  });

  return positions;
}

/**
 * 반응형 컬럼 수 계산
 */
export function calculateResponsiveColumns(
  settings: GridOverlaySettings,
  viewportWidth: number
): number {
  const { breakpoints } = settings;

  if (viewportWidth < TAILWIND_BREAKPOINTS.sm) {
    return breakpoints.sm.enabled ? breakpoints.sm.columns : settings.columns;
  }
  if (viewportWidth < TAILWIND_BREAKPOINTS.md) {
    return breakpoints.md.enabled ? breakpoints.md.columns : settings.columns;
  }
  if (viewportWidth < TAILWIND_BREAKPOINTS.lg) {
    return breakpoints.lg.enabled ? breakpoints.lg.columns : settings.columns;
  }
  if (viewportWidth < TAILWIND_BREAKPOINTS.xl) {
    return breakpoints.xl.enabled ? breakpoints.xl.columns : settings.columns;
  }
  return breakpoints['2xl'].enabled ? breakpoints['2xl'].columns : settings.columns;
}

/**
 * 그리드 오프셋 계산 (중앙 정렬용)
 */
export function calculateGridOffset(
  containerWidth: number,
  gridWidth: number
): number {
  return (containerWidth - gridWidth) / 2;
}

/**
 * 그리드 CSS 생성
 */
export interface GridCSS {
  container: React.CSSProperties;
  columns: React.CSSProperties[];
  gaps: React.CSSProperties[];
}

export function generateGridCSS(
  settings: GridOverlaySettings,
  containerWidth: number
): GridCSS {
  const columns = calculateResponsiveColumns(settings, containerWidth);
  const positions = calculateColumnPositions(
    containerWidth,
    columns,
    settings.gap,
    parseFloat(settings.margin)
  );

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9996,
  };

  const columnStyles = positions.map(pos => ({
    position: 'absolute',
    top: 0,
    left: `${pos.startX}px`,
    width: `${pos.width}px`,
    height: '100%',
    backgroundColor: settings.color,
    opacity: settings.opacity,
  }));

  const gapStyles = positions.slice(0, -1).map(pos => ({
    position: 'absolute',
    top: 0,
    left: `${pos.endX}px`,
    width: `${settings.gap}px`,
    height: '100%',
    backgroundColor: settings.color,
    opacity: settings.opacity * 0.3,
  }));

  return {
    container: containerStyle,
    columns: columnStyles,
    gaps: gapStyles,
  };
}
```

---

## Task #11.23: 그리드 오버레이 렌더러

- **파일**: `src/utils/gridLayout/grid/gridRenderer.ts`
- **시간**: 30분
- **의존성**: Task #11.1, #11.22
- **상세 내용**:
```typescript
import { GridOverlaySettings } from '../../../types/gridLayout';
import { generateGridCSS, calculateResponsiveColumns, calculateColumnPositions } from './gridCalculator';

/**
 * 그리드 HTML 생성
 */
export function generateGridHTML(settings: GridOverlaySettings, containerWidth: number): string {
  const columns = calculateResponsiveColumns(settings, containerWidth);
  const positions = calculateColumnPositions(
    containerWidth,
    columns,
    settings.gap,
    parseFloat(settings.margin)
  );

  let html = `
    <div id="grid-overlay-container" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9996;
    ">
  `;

  // 컬럼 렌더링
  positions.forEach((pos, index) => {
    const numberLabel = settings.showColumnNumbers
      ? `<span style="position: absolute; top: 5px; left: 5px; font-size: 10px; color: ${settings.color}; opacity: 0.7;">${index + 1}</span>`
      : '';

    html += `
      <div class="grid-column" data-column="${index}" style="
        position: absolute;
        top: 0;
        left: ${pos.startX}px;
        width: ${pos.width}px;
        height: 100%;
        background-color: ${settings.color};
        opacity: ${settings.opacity};
        ${settings.style === 'dashed' ? 'background-image: linear-gradient(to bottom, ' + settings.color + ' 50%, transparent 50%); background-size: 1px 10px;' : ''}
        ${settings.style === 'dotted' ? 'background-image: radial-gradient(' + settings.color + ' 1px, transparent 1px); background-size: 10px 10px;' : ''}
      ">
        ${numberLabel}
      </div>
    `;
  });

  html += '</div>';

  return html;
}

/**
 * 그리드 오버레이 생성 (DOM)
 */
export function createGridOverlay(settings: GridOverlaySettings): HTMLElement | null {
  const container = document.getElementById('grid-overlay-container');
  if (container) {
    container.remove();
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'grid-overlay-container';
  wrapper.innerHTML = generateGridHTML(settings, window.innerWidth);

  document.body.appendChild(wrapper);

  return wrapper;
}

/**
 * 그리드 오버레이 제거
 */
export function removeGridOverlay(): void {
  const container = document.getElementById('grid-overlay-container');
  if (container) {
    container.remove();
  }
}

/**
 * 그리드 오버레이 업데이트
 */
export function updateGridOverlay(settings: GridOverlaySettings): void {
  removeGridOverlay();
  if (settings.enabled) {
    createGridOverlay(settings);
  }
}
```

---

## Task #11.24: 화이트스페이스 패턴 생성

- **파일**: `src/utils/gridLayout/grid/whitespacePattern.ts`
- **시간**: 25분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { WhitespaceSettings, WhitespacePattern } from '../../../types/gridLayout';

/**
 * 화이트스페이스 SVG 패턴 생성
 */
export function createWhitespaceSVG(settings: WhitespaceSettings): string {
  const size = settings.size;
  const color = settings.color;

  switch (settings.pattern) {
    case 'diagonal':
      return `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="whitespace-diagonal" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
              <path d="M-1,1 l2,-2 M0,${size} l${size},-${size} M${size - 1},${size} l2,-2" stroke="${color}" stroke-width="1" opacity="${settings.opacity}"/>
            </pattern>
          </defs>
        </svg>
      `;

    case 'crosshatch':
      return `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="whitespace-crosshatch" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
              <path d="M${size / 2},0 L${size / 2},${size} M0,${size / 2} L${size},${size / 2}" stroke="${color}" stroke-width="1" opacity="${settings.opacity}"/>
            </pattern>
          </defs>
        </svg>
      `;

    case 'solid':
    default:
      return `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}" opacity="${settings.opacity}"/>
        </svg>
      `;
  }
}

/**
 * 화이트스페이스 CSS 생성
 */
export function createWhitespaceCSS(settings: WhitespaceSettings): string {
  const size = settings.size;
  const color = settings.color;

  switch (settings.pattern) {
    case 'diagonal':
      return `
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent ${size / 2}px,
          ${color} ${size / 2}px,
          ${color} ${size}px
        );
        background-opacity: ${settings.opacity};
      `;

    case 'crosshatch':
      return `
        background-image:
          linear-gradient(${color} ${settings.opacity}, ${color} ${settings.opacity}),
          linear-gradient(90deg, ${color} ${settings.opacity}, ${color} ${settings.opacity});
        background-size: ${size}px ${size}px;
        background-position: 0 0, ${size / 2}px ${size / 2}px;
      `;

    case 'solid':
    default:
      return `
        background-color: ${color};
        opacity: ${settings.opacity};
      `;
  }
}

/**
 * 화이트스페이스 오버레이 생성
 */
export function createWhitespaceOverlay(settings: WhitespaceSettings): HTMLElement | null {
  const existing = document.getElementById('whitespace-overlay');
  if (existing) {
    existing.remove();
  }

  if (!settings.enabled) {
    return null;
  }

  const overlay = document.createElement('div');
  overlay.id = 'whitespace-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9995;
    ${createWhitespaceCSS(settings)}
  `;

  document.body.appendChild(overlay);

  return overlay;
}

/**
 * 화이트스페이스 오버레이 제거
 */
export function removeWhitespaceOverlay(): void {
  const overlay = document.getElementById('whitespace-overlay');
  if (overlay) {
    overlay.remove();
  }
}
```

---

## Task #11.25: 그리드 관리 훅

- **파일**: `src/hooks/gridLayout/useGridOverlay.ts`
- **시간**: 30분
- **의존성**: Task #11.1, #11.2, #11.22, #11.23
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { GridOverlaySettings } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';
import { calculateResponsiveColumns } from '../../utils/gridLayout/grid/gridCalculator';

export function useGridOverlay() {
  const [settings, setSettings] = useState<GridOverlaySettings>(DEFAULT_GRID_LAYOUT_SETTINGS.gridOverlay);

  // 초기 데이터 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      if (result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS]?.gridOverlay) {
        setSettings(result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS].gridOverlay);
      }
    } catch (error) {
      console.error('Failed to load grid settings:', error);
    }
  };

  const saveSettings = async (newSettings: GridOverlaySettings) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const current = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] || DEFAULT_GRID_LAYOUT_SETTINGS;

      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: {
          ...current,
          gridOverlay: newSettings,
        },
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save grid settings:', error);
    }
  };

  // 토글
  const toggle = useCallback(async () => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    await saveSettings(newSettings);
  }, [settings]);

  // 컬럼 수 변경
  const setColumns = useCallback(async (columns: number) => {
    const newSettings = { ...settings, columns };
    await saveSettings(newSettings);
  }, [settings]);

  // 갭 변경
  const setGap = useCallback(async (gap: number) => {
    const newSettings = { ...settings, gap };
    await saveSettings(newSettings);
  }, [settings]);

  // 색상 변경
  const setColor = useCallback(async (color: string) => {
    const newSettings = { ...settings, color };
    await saveSettings(newSettings);
  }, [settings]);

  // 불투명도 변경
  const setOpacity = useCallback(async (opacity: number) => {
    const newSettings = { ...settings, opacity: Math.max(0, Math.min(opacity, 1)) };
    await saveSettings(newSettings);
  }, [settings]);

  // 스타일 변경
  const setStyle = useCallback(async (style: 'solid' | 'dashed' | 'dotted') => {
    const newSettings = { ...settings, style };
    await saveSettings(newSettings);
  }, [settings]);

  // 컬럼 번호 표시 토글
  const toggleColumnNumbers = useCallback(async () => {
    const newSettings = { ...settings, showColumnNumbers: !settings.showColumnNumbers };
    await saveSettings(newSettings);
  }, [settings]);

  // 브레이크포인트 설정 변경
  const updateBreakpoint = useCallback(async (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl', enabled: boolean, columns: number) => {
    const newSettings = {
      ...settings,
      breakpoints: {
        ...settings.breakpoints,
        [breakpoint]: { enabled, columns },
      },
    };
    await saveSettings(newSettings);
  }, [settings]);

  // 현재 뷰포트에 대한 컬럼 수 계산
  const getCurrentColumns = useCallback((viewportWidth: number) => {
    return calculateResponsiveColumns(settings, viewportWidth);
  }, [settings]);

  return {
    settings,
    toggle,
    setColumns,
    setGap,
    setColor,
    setOpacity,
    setStyle,
    toggleColumnNumbers,
    updateBreakpoint,
    getCurrentColumns,
  };
}
```
- **완료 조건**: 그리드 설정 CRUD 검증

---

## Task #11.26: 가이드라인 스냅 시스템

- **파일**: `src/utils/gridLayout/grid/snapSystem.ts`
- **시간**: 20분
- **의존성**: Task #11.1, #11.22
- **상세 내용**:
```typescript
import { GuideLine } from '../../../types/gridLayout';
import { calculateColumnPositions } from './gridCalculator';

/**
 * 스냅 타겟 계산 (그리드 기반)
 */
export function calculateSnapTargets(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): number[] {
  const positions = calculateColumnPositions(containerWidth, columns, gap, margin);
  const targets: number[] = [];

  // 각 컬럼의 시작과 끝
  positions.forEach(pos => {
    targets.push(pos.startX);
    targets.push(pos.endX);
  });

  // 중앙값도 추가
  positions.forEach(pos => {
    targets.push((pos.startX + pos.endX) / 2);
  });

  return targets;
}

/**
 * 가이드라인 스냅 위치 계산
 */
export interface SnapResult {
  position: number;
  snapped: boolean;
  target?: number;
  distance?: number;
}

export function snapToGrid(
  position: number,
  snapTargets: number[],
  threshold: number = 10
): SnapResult {
  let closestTarget: number | undefined;
  let closestDistance = Infinity;

  for (const target of snapTargets) {
    const distance = Math.abs(position - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestTarget = target;
    }
  }

  if (closestDistance <= threshold && closestTarget !== undefined) {
    return {
      position: closestTarget,
      snapped: true,
      target: closestTarget,
      distance: closestDistance,
    };
  }

  return {
    position,
    snapped: false,
  };
}

/**
 * 가이드라인 그리드에 스냅
 */
export function snapGuideLinesToGrid(
  guides: GuideLine[],
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number,
  threshold: number = 10
): GuideLine[] {
  const snapTargets = calculateSnapTargets(containerWidth, columns, gap, margin);

  return guides.map(guide => {
    if (guide.type === 'vertical') {
      const result = snapToGrid(guide.position, snapTargets, threshold);
      return result.snapped
        ? { ...guide, position: result.position }
        : guide;
    }
    return guide;
  });
}

/**
 * 모든 가이드라인 스냅 토글
 */
export function snapAllGuidesToGrid(
  guides: GuideLine[],
  snapTargets: number[],
  threshold: number = 10
): GuideLine[] {
  return guides.map(guide => {
    const result = snapToGrid(guide.position, snapTargets, threshold);
    return result.snapped
      ? { ...guide, position: result.position }
      : guide;
  });
}
```

---

## Task #11.27: 그리드 단축키

- **파일**: `src/utils/gridLayout/grid/keyboardShortcuts.ts`
- **시간**: 15분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
/**
 * 키 조합 파싱
 */
export interface KeyCombo {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export function parseKeyCombo(shortcut: string): KeyCombo {
  const parts = shortcut.toLowerCase().split('+');
  const combo: KeyCombo = {
    key: '',
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  };

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        combo.ctrl = true;
        break;
      case 'shift':
        combo.shift = true;
        break;
      case 'alt':
        combo.alt = true;
        break;
      case 'meta':
      case 'cmd':
      case 'win':
        combo.meta = true;
        break;
      default:
        combo.key = part;
    }
  }

  return combo;
}

/**
 * 키보드 이벤트가 단축키와 매칭되는지 확인
 */
export function matchKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  return (
    event.key.toLowerCase() === combo.key &&
    event.ctrlKey === combo.ctrl &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt &&
    event.metaKey === combo.meta
  );
}

/**
 * 단축키 문자열 생성 (표시용)
 */
export function formatShortcut(shortcut: string): string {
  const combo = parseKeyCombo(shortcut);
  const parts: string[] = [];

  if (combo.ctrl) parts.push('Ctrl');
  if (combo.shift) parts.push('Shift');
  if (combo.alt) parts.push('Alt');
  if (combo.meta) parts.push('Cmd');

  parts.push(combo.key.toUpperCase());

  return parts.join('+');
}
```

---

## Task #11.28: 화이트스페이스 관리 훅

- **파일**: `src/hooks/gridLayout/useWhitespace.ts`
- **시간**: 20분
- **의존성**: Task #11.1, #11.2, #11.24
- **상세 내용**:
```typescript
import { useState, useCallback, useEffect } from 'react';
import { WhitespaceSettings, WhitespacePattern } from '../../types/gridLayout';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_GRID_LAYOUT_SETTINGS } from '../../constants/defaults';

export function useWhitespace() {
  const [settings, setSettings] = useState<WhitespaceSettings>(DEFAULT_GRID_LAYOUT_SETTINGS.whitespace);

  // 초기 데이터 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      if (result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS]?.whitespace) {
        setSettings(result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS].whitespace);
      }
    } catch (error) {
      console.error('Failed to load whitespace settings:', error);
    }
  };

  const saveSettings = async (newSettings: WhitespaceSettings) => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.GRID_LAYOUT_SETTINGS);
      const current = result[STORAGE_KEYS.GRID_LAYOUT_SETTINGS] || DEFAULT_GRID_LAYOUT_SETTINGS;

      await chrome.storage.local.set({
        [STORAGE_KEYS.GRID_LAYOUT_SETTINGS]: {
          ...current,
          whitespace: newSettings,
        },
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save whitespace settings:', error);
    }
  };

  // 토글
  const toggle = useCallback(async () => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    await saveSettings(newSettings);
  }, [settings]);

  // 패턴 변경
  const setPattern = useCallback(async (pattern: WhitespacePattern) => {
    const newSettings = { ...settings, pattern };
    await saveSettings(newSettings);
  }, [settings]);

  // 색상 변경
  const setColor = useCallback(async (color: string) => {
    const newSettings = { ...settings, color };
    await saveSettings(newSettings);
  }, [settings]);

  // 불투명도 변경
  const setOpacity = useCallback(async (opacity: number) => {
    const newSettings = { ...settings, opacity: Math.max(0, Math.min(opacity, 1)) };
    await saveSettings(newSettings);
  }, [settings]);

  // 크기 변경
  const setSize = useCallback(async (size: number) => {
    const newSettings = { ...settings, size: Math.max(5, Math.min(size, 100)) };
    await saveSettings(newSettings);
  }, [settings]);

  return {
    settings,
    toggle,
    setPattern,
    setColor,
    setOpacity,
    setSize,
  };
}
```
- **완료 조건**: 화이트스페이스 설정 CRUD 검증

---

## Task #11.29: 그리드 오버레이 Content Script

- **파일**: `src/content/gridLayout/overlayInjector.ts`
- **시간**: 30분
- **의존성**: Task #11.23, #11.24
- **상세 내용**:
```typescript
import { GridOverlaySettings, WhitespaceSettings } from '../../types/gridLayout';
import { generateGridHTML, updateGridOverlay, removeGridOverlay } from '../../utils/gridLayout/grid/gridRenderer';
import { createWhitespaceOverlay, removeWhitespaceOverlay } from '../../utils/gridLayout/grid/whitespacePattern';

/**
 * 그리드 오버레이 주입
 */
export function injectGridOverlay(settings: GridOverlaySettings): void {
  if (settings.enabled) {
    const html = generateGridHTML(settings, window.innerWidth);

    // 기존 오버레이 제거
    removeGridOverlay();

    // 새 오버레이 주입
    const wrapper = document.createElement('div');
    wrapper.id = 'grid-overlay-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  } else {
    removeGridOverlay();
  }
}

/**
 * 화이트스페이스 오버레이 주입
 */
export function injectWhitespaceOverlay(settings: WhitespaceSettings): void {
  if (settings.enabled) {
    createWhitespaceOverlay(settings);
  } else {
    removeWhitespaceOverlay();
  }
}

/**
 * 모든 오버레이 제거
 */
export function removeAllOverlays(): void {
  removeGridOverlay();
  removeWhitespaceOverlay();
}

/**
 * 오버레이 상태 확인
 */
export function isOverlayActive(): boolean {
  return (
    document.getElementById('grid-overlay-container') !== null ||
    document.getElementById('whitespace-overlay') !== null
  );
}

/**
 * 윈도우 리사이즈 이벤트 핸들러
 */
export function setupResizeHandler(callback: () => void): () => void {
  const handler = () => {
    callback();
  };

  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
  };
}
```

---

**완료 후 다음 단계**: [Phase 5: Storage 관리](./TASK-11-phase-05-storage.md)
