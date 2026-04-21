# Phase 1: 기반 설정

**태스크 범위**: Task #11.1 ~ #11.8 (8개)
**예상 시간**: 2시간
**의존성**: 없음

---

## Task #11.1: 타입 정의 - 그리드 및 레이아웃

- **파일**: `src/types/gridLayout.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 가이드라인 방향
 */
export type GuideLineOrientation = 'horizontal' | 'vertical';

/**
 * 가이드라인 스타일
 */
export type GuideLineStyle = 'solid' | 'dashed' | 'dotted';

/**
 * 가이드라인 객체
 */
export interface GuideLine {
  id: string;                    // UUID
  type: GuideLineOrientation;    // horizontal | vertical
  position: number;              // px (화면 기준)
  color: string;                 // HEX 색상
  width: number;                 // 선 두께 (1-5px)
  style: GuideLineStyle;         // 선 스타일
  locked: boolean;               // 잠금 여부
  visible: boolean;              // 표시 여부
}

/**
 * 디바이스 카테고리
 */
export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'custom';

/**
 * 뷰포트 프리셋
 */
export interface ViewportPreset {
  id: string;
  name: string;
  category: DeviceCategory;
  width: number;                 // px
  height: number;                // px
  devicePixelRatio?: number;     // DPR
  userAgent?: string;            // User Agent
  icon: string;                  // 이모지
}

/**
 * 현재 뷰포트 상태
 */
export interface ViewportState {
  preset: ViewportPreset | null;
  customWidth: number;
  customHeight: number;
  orientation: 'portrait' | 'landscape';
  zoom: number;                  // 0.1 - 2.0
}

/**
 * 그리드 컬럼 설정
 */
export interface GridColumnSettings {
  enabled: boolean;
  columns: number;               // 1-16
  gap: number;                   // px (0-100)
  margin: string;                // CSS margin 값
  maxWidth: string;              // CSS max-width 값
}

/**
 * 브레이크포인트 설정
 */
export interface BreakpointSettings {
  enabled: boolean;
  columns: number;               // 해당 브레이크포인트의 컬럼 수
}

/**
 * 그리드 오버레이 설정
 */
export interface GridOverlaySettings {
  enabled: boolean;
  columns: number;
  gap: number;
  margin: string;
  maxWidth: string;
  color: string;
  opacity: number;               // 0-1
  style: GuideLineStyle;
  showColumnNumbers: boolean;
  breakpoints: {
    sm: BreakpointSettings;      // 640px
    md: BreakpointSettings;      // 768px
    lg: BreakpointSettings;      // 1024px
    xl: BreakpointSettings;      // 1280px
    '2xl': BreakpointSettings;   // 1536px
  };
}

/**
 * 화이트스페이스 패턴
 */
export type WhitespacePattern = 'solid' | 'diagonal' | 'crosshatch';

/**
 * 화이트스페이스 모드 설정
 */
export interface WhitespaceSettings {
  enabled: boolean;
  pattern: WhitespacePattern;
  color: string;
  opacity: number;               // 0-1
  size: number;                  // 패턴 크기 (px)
}

/**
 * 통합 그리드 설정
 */
export interface GridLayoutSettings {
  guideLines: {
    items: GuideLine[];
    showOnHover: boolean;
    snapToLines: boolean;
    snapThreshold: number;       // px
  };
  viewport: ViewportState;
  gridOverlay: GridOverlaySettings;
  whitespace: WhitespaceSettings;
  keyboardShortcuts: {
    toggleGrid: string;          // e.g., 'Ctrl+G'
    toggleGuides: string;        // e.g., 'Ctrl+Shift+G'
    clearAll: string;            // e.g., 'Ctrl+Shift+X'
  };
}
```
- **검증**: TypeScript 컴파일 성공

---

## Task #11.2: Storage 상수 추가

- **파일**: `src/constants/storage.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
// 기존 STORAGE_KEYS에 추가
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 그리드 및 레이아웃
  GRID_LAYOUT_SETTINGS: 'gridLayout:settings',
  GRID_LAYOUT_GUIDELINES: 'gridLayout:guideLines',
  GRID_LAYOUT_VIEWPORT: 'gridLayout:viewport',
} as const;

// 기존 STORAGE_LIMITS에 추가
export const STORAGE_LIMITS = {
  // ... 기존 제한

  GRID_LAYOUT_MAX_GUIDELINES: 50,
} as const;
```

---

## Task #11.3: 메시지 액션 추가

- **파일**: `src/constants/messages.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
// 기존 MESSAGE_ACTIONS에 추가
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 그리드 및 레이아웃
  GRID_LAYOUT_TOGGLE_OVERLAY: 'GRID_LAYOUT_TOGGLE_OVERLAY',
  GRID_LAYOUT_TOGGLE_GUIDES: 'GRID_LAYOUT_TOGGLE_GUIDES',
  GRID_LAYOUT_ADD_GUIDE: 'GRID_LAYOUT_ADD_GUIDE',
  GRID_LAYOUT_REMOVE_GUIDE: 'GRID_LAYOUT_REMOVE_GUIDE',
  GRID_LAYOUT_UPDATE_GUIDE: 'GRID_LAYOUT_UPDATE_GUIDE',
  GRID_LAYOUT_CLEAR_ALL: 'GRID_LAYOUT_CLEAR_ALL',
  GRID_LAYOUT_SET_VIEWPORT: 'GRID_LAYOUT_SET_VIEWPORT',
  GRID_LAYOUT_RESIZE_VIEWPORT: 'GRID_LAYOUT_RESIZE_VIEWPORT',
  GRID_LAYOUT_SET_BREAKPOINT: 'GRID_LAYOUT_SET_BREAKPOINT',
  GRID_LAYOUT_TOGGLE_WHITESPACE: 'GRID_LAYOUT_TOGGLE_WHITESPACE',
} as const;
```

---

## Task #11.4: 뷰포트 프리셋 상수

- **파일**: `src/constants/viewportPresets.ts`
- **시간**: 20분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { ViewportPreset } from '../types/gridLayout';

/**
 * 뷰포트 프리셋 목록
 */
export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  // Mobile
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'mobile',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'iphone-12-pro',
    name: 'iPhone 12 Pro',
    category: 'mobile',
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    icon: '📱',
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'mobile',
    width: 430,
    height: 932,
    devicePixelRatio: 3,
    icon: '📱',
  },
  {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    category: 'mobile',
    width: 412,
    height: 915,
    devicePixelRatio: 2.625,
    icon: '📱',
  },
  {
    id: 'galaxy-s23',
    name: 'Samsung Galaxy S23',
    category: 'mobile',
    width: 360,
    height: 780,
    devicePixelRatio: 3,
    icon: '📱',
  },

  // Tablet
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    category: 'tablet',
    width: 820,
    height: 1180,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'tablet',
    width: 834,
    height: 1194,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'ipad-pro-12-9',
    name: 'iPad Pro 12.9"',
    category: 'tablet',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'surface-pro',
    name: 'Surface Pro 7',
    category: 'tablet',
    width: 912,
    height: 1368,
    devicePixelRatio: 2,
    icon: '💻',
  },

  // Desktop
  {
    id: 'laptop-13',
    name: 'Laptop 13"',
    category: 'desktop',
    width: 1280,
    height: 720,
    icon: '💻',
  },
  {
    id: 'laptop-15',
    name: 'Laptop 15"',
    category: 'desktop',
    width: 1440,
    height: 900,
    icon: '💻',
  },
  {
    id: 'desktop-hd',
    name: 'Desktop HD',
    category: 'desktop',
    width: 1920,
    height: 1080,
    icon: '🖥️',
  },
  {
    id: 'desktop-fhd',
    name: 'Desktop FHD',
    category: 'desktop',
    width: 2560,
    height: 1440,
    icon: '🖥️',
  },
  {
    id: 'desktop-4k',
    name: 'Desktop 4K',
    category: 'desktop',
    width: 3840,
    height: 2160,
    icon: '🖥️',
  },
] as const;

/**
 * 기본 프리셋 ID
 */
export const DEFAULT_VIEWPORT_PRESET = 'laptop-13';

/**
 * 카테고리별 프리셋
 */
export const VIEWPORT_PRESETS_BY_CATEGORY: Record<DeviceCategory, ViewportPreset[]> = {
  mobile: VIEWPORT_PRESETS.filter(p => p.category === 'mobile'),
  tablet: VIEWPORT_PRESETS.filter(p => p.category === 'tablet'),
  desktop: VIEWPORT_PRESETS.filter(p => p.category === 'desktop'),
  custom: [],
};

/**
 * Tailwind 브레이크포인트
 */
export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
```

---

## Task #11.5: 색상 및 스타일 상수

- **파일**: `src/constants/gridStyles.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { GuideLineStyle, WhitespacePattern } from '../types/gridLayout';

/**
 * 기본 가이드라인 색상
 */
export const DEFAULT_GUIDELINE_COLOR = '#FF3366';

/**
 * 지원하는 가이드라인 색상
 */
export const GUIDELINE_COLORS = [
  '#FF3366',  // Red
  '#FF6B6B',  // Light Red
  '#4ECDC4',  // Teal
  '#45B7D1',  // Blue
  '#96CEB4',  // Green
  '#FFEEAD',  // Yellow
  '#D4A5A5',  // Pink
  '#9B59B6',  // Purple
  '#34495E',  // Dark Blue
  '#FFFFFF',  // White
] as const;

/**
 * 기본 그리드 색상
 */
export const DEFAULT_GRID_COLOR = '#3B82F6';

/**
 * 기본 화이트스페이스 색상
 */
export const DEFAULT_WHITESPACE_COLOR = '#E5E7EB';

/**
 * 가이드라인 스타일 라벨
 */
export const GUIDELINE_STYLE_LABELS: Record<GuideLineStyle, string> = {
  solid: '실선',
  dashed: '점선',
  dotted: '점점선',
} as const;

/**
 * 화이트스페이스 패턴 라벨
 */
export const WHITESPACE_PATTERN_LABELS: Record<WhitespacePattern, string> = {
  solid: '단색',
  diagonal: '대각선',
  crosshatch: '십자선',
} as const;

/**
 * 기본 그리드 설정
 */
export const DEFAULT_GRID_COLUMNS = 12;
export const DEFAULT_GRID_GAP = 24;
export const DEFAULT_GRID_MARGIN = '1.5rem';
export const DEFAULT_GRID_MAX_WIDTH = '1280px';
export const DEFAULT_GRID_OPACITY = 0.5;
```

---

## Task #11.6: 에러 메시지 추가

- **파일**: `src/constants/errors.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
// 기존 ERROR_MESSAGES에 추가
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  GRID_LAYOUT: {
    INVALID_PRESET: '유효하지 않은 뷰포트 프리셋입니다',
    INVALID_DIMENSIONS: '유효하지 않은 크기입니다',
    TOO_MANY_GUIDELINES: '가이드라인 최대 개수를 초과했습니다',
    INVALID_POSITION: '유효하지 않은 위치입니다',
    OVERLAY_INJECTION_FAILED: '오버레이 주입에 실패했습니다',
    CONTENT_SCRIPT_NOT_READY: 'Content script가 준비되지 않았습니다',
    STORAGE_SAVE_FAILED: '설정 저장에 실패했습니다',
  },
} as const;
```

---

## Task #11.7: 기본 설정 값

- **파일**: `src/constants/defaults.ts`
- **시간**: 15분
- **의존성**: Task #11.1, #11.4, #11.5
- **상세 내용**:
```typescript
import { GridLayoutSettings } from '../types/gridLayout';
import { DEFAULT_GRID_COLOR, DEFAULT_GRID_COLUMNS, DEFAULT_GRID_GAP, DEFAULT_GRID_MARGIN, DEFAULT_GRID_MAX_WIDTH, DEFAULT_GRID_OPACITY, DEFAULT_GUIDELINE_COLOR, DEFAULT_WHITESPACE_COLOR } from './gridStyles';
import { VIEWPORT_PRESETS, DEFAULT_VIEWPORT_PRESET } from './viewportPresets';

export const DEFAULT_GRID_LAYOUT_SETTINGS: GridLayoutSettings = {
  guideLines: {
    items: [],
    showOnHover: false,
    snapToLines: false,
    snapThreshold: 10,
  },
  viewport: {
    preset: VIEWPORT_PRESETS.find(p => p.id === DEFAULT_VIEWPORT_PRESET) || null,
    customWidth: 1280,
    customHeight: 720,
    orientation: 'landscape',
    zoom: 1,
  },
  gridOverlay: {
    enabled: false,
    columns: DEFAULT_GRID_COLUMNS,
    gap: DEFAULT_GRID_GAP,
    margin: DEFAULT_GRID_MARGIN,
    maxWidth: DEFAULT_GRID_MAX_WIDTH,
    color: DEFAULT_GRID_COLOR,
    opacity: DEFAULT_GRID_OPACITY,
    style: 'solid',
    showColumnNumbers: true,
    breakpoints: {
      sm: { enabled: true, columns: 4 },
      md: { enabled: true, columns: 8 },
      lg: { enabled: true, columns: 12 },
      xl: { enabled: true, columns: 12 },
      '2xl': { enabled: true, columns: 12 },
    },
  },
  whitespace: {
    enabled: false,
    pattern: 'diagonal',
    color: DEFAULT_WHITESPACE_COLOR,
    opacity: 0.3,
    size: 20,
  },
  keyboardShortcuts: {
    toggleGrid: 'Ctrl+G',
    toggleGuides: 'Ctrl+Shift+G',
    clearAll: 'Ctrl+Shift+X',
  },
};
```

---

## Task #11.8: 유틸리티 헬퍼

- **파일**: `src/utils/gridLayout/helpers.ts`
- **시간**: 20분
- **의존성**: Task #11.1
- **상세 내용**:
```typescript
import { GuideLine, ViewportPreset } from '../../types/gridLayout';
import { generateUUID } from '../common/uuid';

/**
 * 가이드라인 ID 생성
 */
export function generateGuideLineId(): string {
  return `guide-${generateUUID()}`;
}

/**
 * 새 가이드라인 생성
 */
export function createGuideLine(
  type: 'horizontal' | 'vertical',
  position: number,
  options?: Partial<Pick<GuideLine, 'color' | 'width' | 'style'>>
): GuideLine {
  return {
    id: generateGuideLineId(),
    type,
    position,
    color: options?.color || '#FF3366',
    width: options?.width || 2,
    style: options?.style || 'dashed',
    locked: false,
    visible: true,
  };
}

/**
 * 가이드라인 복제
 */
export function cloneGuideLine(guide: GuideLine): GuideLine {
  return {
    ...guide,
    id: generateGuideLineId(),
  };
}

/**
 * 가이드라인 위치 유효성 검증
 */
export function isValidGuideLinePosition(position: number, maxDimension: number): boolean {
  return position >= 0 && position <= maxDimension;
}

/**
 * 뷰포트 프리셋 검색
 */
export function findViewportPreset(presets: readonly ViewportPreset[], id: string): ViewportPreset | undefined {
  return presets.find(p => p.id === id);
}

/**
 * px를 rem으로 변환
 */
export function pxToRem(px: number, baseFontSize: number = 16): string {
  return `${px / baseFontSize}rem`;
}

/**
 * 브레이크포인트 감지
 */
export function detectBreakpoint(width: number): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}

/**
 * 컬럼 너비 계산 (gap 포함)
 */
export function calculateColumnWidth(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): number {
  const availableWidth = containerWidth - (margin * 2) - (gap * (columns - 1));
  return availableWidth / columns;
}

/**
 * 가이드라인 CSS 생성
 */
export function generateGuideLineStyle(guide: GuideLine): React.CSSProperties {
  return {
    position: 'fixed',
    [guide.type === 'horizontal' ? 'top' : 'left']: `${guide.position}px`,
    [guide.type === 'horizontal' ? 'left' : 'top']: '0',
    [guide.type === 'horizontal' ? 'width' : 'height']: '100%',
    [guide.type === 'horizontal' ? 'height' : 'width']: `${guide.width}px`,
    backgroundColor: guide.color,
    borderStyle: guide.style,
    zIndex: 9998,
    pointerEvents: 'none',
  };
}
```
- **검증**: 모든 헬퍼 함수 정상 동작

---

**완료 후 다음 단계**: [Phase 2: 가이드라인 시스템](./TASK-11-phase-02-guidelines.md)
