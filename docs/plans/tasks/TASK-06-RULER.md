# 도구 #6: 자/측정 (Ruler) - 완전 태스크 분해

**총 태스크**: 30개
**예상 시간**: 12-15시간 (1.5-2일)
**작성일**: 2026-02-09

---

## 📑 목차

- [Phase 1: 기반 설정 (6개 태스크, 2시간)](#phase-1-기반-설정)
- [Phase 2: 측정 유틸리티 (10개 태스크, 5시간)](#phase-2-측정-유틸리티)
- [Phase 3: 시각화 유틸리티 (5개 태스크, 2시간)](#phase-3-시각화-유틸리티)
- [Phase 4: Storage 및 상태 관리 (3개 태스크, 1.5시간)](#phase-4-storage-및-상태-관리)
- [Phase 5: React 컴포넌트 (4개 태스크, 2시간)](#phase-5-react-컴포넌트)
- [Phase 6: Content Script 통합 (2개 태스크, 1.5시간)](#phase-6-content-script-통합)
- [Phase 7: 테스트 및 최적화 (1개 태스크, 1시간)](#phase-7-테스트-및-최적화)

---

## Phase 1: 기반 설정 (6개 태스크, 2시간)

### Task #6.1: 타입 정의 - 기본 인터페이스
- **파일**: `src/types/ruler.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 요소 크기 정보
 */
export interface ElementDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * 두 점 간 거리
 */
export interface Distance {
  horizontal: number;      // X축 거리
  vertical: number;        // Y축 거리
  diagonal: number;        // 유클리드 거리
  angle: number;           // 각도 (라디안)
}

/**
 * Box Model 정보
 */
export interface BoxModel {
  content: DOMRect;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  border: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  total: {
    width: number;
    height: number;
  };
}

/**
 * 측정 결과
 */
export interface Measurement {
  id: string;                    // UUID
  timestamp: number;             // Date.now()
  type: 'element' | 'distance' | 'gap';

  // 요소 측정인 경우
  element?: {
    selector: string;
    dimensions: ElementDimensions;
    boxModel: BoxModel;
    position: {
      x: number;
      y: number;
    };
  };

  // 거리 측정인 경우
  distance?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    result: Distance;
  };

  // 간격 측정인 경우
  gap?: {
    element1: string;           // CSS selector
    element2: string;
    direction: 'horizontal' | 'vertical' | 'both';
    value: number | { horizontal: number; vertical: number };
  };

  metadata?: {
    pageUrl: string;
    pageTitle: string;
    viewport: {
      width: number;
      height: number;
    };
    devicePixelRatio: number;
  };
}

/**
 * 측정 히스토리
 */
export interface MeasurementHistory {
  measurements: Measurement[];
  maxSize: number;              // 기본 20
  totalMeasurements: number;
  lastMeasurementTime: number;
}

/**
 * 측정 설정
 */
export interface RulerSettings {
  maxHistorySize: number;       // 기본 20
  unit: 'px' | 'rem' | 'em';    // 표시 단위
  showBoxModel: boolean;        // Box Model 표시
  lineColor: string;            // 측정선 색상
  labelColor: string;           // 라벨 색상
  lineWidth: number;            // 선 굵기
  snapToPixel: boolean;         // 픽셀 스냅 (레티나 대응)
  showAngle: boolean;           // 각도 표시
  showAspectRatio: boolean;     // 종횡비 표시
}

/**
 * 측정 통계
 */
export interface MeasurementStats {
  totalMeasurements: number;
  byType: {
    element: number;
    distance: number;
    gap: number;
  };
  averageDimensions: {
    width: number;
    height: number;
  };
  lastMeasurementTime: number;
}

/**
 * 드래그 상태
 */
export interface DragState {
  isDragging: boolean;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  element: HTMLElement | null;
}

/**
 * 측정 오버레이 옵션
 */
export interface OverlayOptions {
  showDimensions: boolean;
  showDistance: boolean;
  showBoxModel: boolean;
  color: string;
  opacity: number;
  fontSize: number;
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

### Task #6.2: Storage 상수 정의
- **파일**: `src/constants/storage.ts` (기존 파일 확장)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // ... 기존 키들

  // Ruler
  RULER_HISTORY: 'ruler:history',
  RULER_SETTINGS: 'ruler:settings',
  RULER_TEMP: 'ruler:temp',
  RULER_STATS: 'ruler:stats',
} as const;

export const STORAGE_LIMITS = {
  // ... 기존 제한들

  RULER_MAX_HISTORY: 20,
} as const;
```

### Task #6.3: 메시지 액션 상수
- **파일**: `src/constants/messages.ts` (기존 파일 확장)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // Ruler
  RULER_TOGGLE: 'RULER_TOGGLE',
  RULER_MEASURE_ELEMENT: 'RULER_MEASURE_ELEMENT',
  RULER_MEASURE_DISTANCE: 'RULER_MEASURE_DISTANCE',
  RULER_MEASURE_GAP: 'RULER_MEASURE_GAP',
  RULER_SAVE_MEASUREMENT: 'RULER_SAVE_MEASUREMENT',
  RULER_CLEAR_OVERLAY: 'RULER_CLEAR_OVERLAY',
  RULER_GET_STATS: 'RULER_GET_STATS',
  RULER_START_DRAG: 'RULER_START_DRAG',
  RULER_END_DRAG: 'RULER_END_DRAG',
} as const;
```

### Task #6.4: CSS 클래스 상수
- **파일**: `src/constants/classes.ts` (기존 파일 확장)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const RULER_CLASSES = {
  HOVER: 'klic-ruler-hover',
  MEASURING: 'klic-ruler-measuring',
  MEASURED: 'klic-ruler-measured',
  OVERLAY: 'klic-ruler-overlay',
  LINE: 'klic-ruler-line',
  LABEL: 'klic-ruler-label',
  BOX_MODEL: 'klic-ruler-box-model',
  DISABLED: 'klic-ruler-disabled',
} as const;
```

### Task #6.5: 에러 메시지 상수
- **파일**: `src/constants/errors.ts` (기존 파일 확장)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  RULER: {
    ELEMENT_NOT_FOUND: '측정할 요소를 찾을 수 없습니다',
    INVALID_COORDINATES: '좌표가 유효하지 않습니다',
    MEASUREMENT_FAILED: '측정에 실패했습니다',
    STORAGE_FULL: '저장 공간이 부족합니다',
    INVALID_UNIT: '단위가 유효하지 않습니다',
    CANVAS_ERROR: '캔버스 렌더링 오류',
  },
} as const;
```

### Task #6.6: 기본 설정 값
- **파일**: `src/constants/defaults.ts` (기존 파일 확장)
- **시간**: 15분
- **의존성**: Task #6.1
- **상세 내용**:
```typescript
import { RulerSettings } from '../types/ruler';

export const DEFAULT_RULER_SETTINGS: RulerSettings = {
  maxHistorySize: 20,
  unit: 'px',
  showBoxModel: true,
  lineColor: '#3b82f6',
  labelColor: '#ffffff',
  lineWidth: 2,
  snapToPixel: true,
  showAngle: true,
  showAspectRatio: true,
};

export const RULER_COLORS = {
  PRIMARY: '#3b82f6',
  CONTENT: '#22c55e',
  PADDING: '#f59e0b',
  BORDER: '#ef4444',
  MARGIN: '#a855f7',
} as const;
```

---

## Phase 2: 측정 유틸리티 (10개 태스크, 5시간)

### Task #6.7: 요소 크기 측정
- **파일**: `src/utils/ruler/measureElement.ts`
- **시간**: 30분
- **의존성**: Task #6.1
- **상세 내용**:
```typescript
import { ElementDimensions } from '../../types/ruler';

/**
 * 요소의 크기를 측정
 */
export function measureElement(element: HTMLElement): ElementDimensions {
  const rect = element.getBoundingClientRect();

  const width = rect.width;
  const height = rect.height;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
  };
}

/**
 * 요소의 실제 크기 측정 (스크롤 포함)
 */
export function measureElementFull(element: HTMLElement): ElementDimensions {
  const width = element.scrollWidth;
  const height = element.scrollHeight;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
  };
}

/**
 * 요소의 오프셋 크기 측정
 */
export function measureElementOffset(element: HTMLElement): ElementDimensions {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
  };
}
```
- **테스트 케이스**:
  - 일반 div 요소
  - 스크롤이 있는 요소
  - transform이 적용된 요소
  - 레티나 디스플레이
- **완료 조건**: 모든 테스트 통과, 정확한 크기 반환

### Task #6.8: 두 점 간 거리 측정
- **파일**: `src/utils/ruler/measureDistance.ts`
- **시간**: 30분
- **의존성**: Task #6.1
- **상세 내용**:
```typescript
import { Distance } from '../../types/ruler';

/**
 * 두 점 간 거리 계산
 */
export function measureDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): Distance {
  const horizontal = Math.abs(point2.x - point1.x);
  const vertical = Math.abs(point2.y - point1.y);
  const diagonal = calculateEuclideanDistance(point1, point2);
  const angle = calculateAngle(point1, point2);

  return {
    horizontal,
    vertical,
    diagonal,
    angle,
  };
}

/**
 * 유클리드 거리 계산
 */
export function calculateEuclideanDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 각도 계산 (라디안)
 */
export function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  return Math.atan2(dy, dx);
}

/**
 * 라디안을 도로 변환
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 맨해튼 거리 계산
 */
export function calculateManhattanDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y);
}
```
- **테스트 케이스**:
  - 수평 거리
  - 수직 거리
  - 대각선 거리
  - 각도 계산
  - 음수 좌표
- **완료 조건**: 정확한 거리 계산

### Task #6.9: 두 요소 간 간격 측정
- **파일**: `src/utils/ruler/measureGap.ts`
- **시간**: 30분
- **의존성**: Task #6.1
- **상세 내용**:
```typescript
/**
 * 두 요소 간 간격 측정
 */
export function measureGap(
  element1: HTMLElement,
  element2: HTMLElement,
  direction: 'horizontal' | 'vertical' | 'both' = 'both'
): number | { horizontal: number; vertical: number } {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  if (direction === 'horizontal') {
    return calculateHorizontalGap(rect1, rect2);
  }

  if (direction === 'vertical') {
    return calculateVerticalGap(rect1, rect2);
  }

  return {
    horizontal: calculateHorizontalGap(rect1, rect2),
    vertical: calculateVerticalGap(rect1, rect2),
  };
}

/**
 * 수평 간격 계산
 */
function calculateHorizontalGap(rect1: DOMRect, rect2: DOMRect): number {
  // rect1이 왼쪽에 있는 경우
  if (rect1.right <= rect2.left) {
    return rect2.left - rect1.right;
  }

  // rect2가 왼쪽에 있는 경우
  if (rect2.right <= rect1.left) {
    return rect1.left - rect2.right;
  }

  // 겹치는 경우
  return 0;
}

/**
 * 수직 간격 계산
 */
function calculateVerticalGap(rect1: DOMRect, rect2: DOMRect): number {
  // rect1이 위에 있는 경우
  if (rect1.bottom <= rect2.top) {
    return rect2.top - rect1.bottom;
  }

  // rect2가 위에 있는 경우
  if (rect2.bottom <= rect1.top) {
    return rect1.top - rect2.bottom;
  }

  // 겹치는 경우
  return 0;
}

/**
 * 요소가 겹치는지 확인
 */
export function isOverlapping(element1: HTMLElement, element2: HTMLElement): boolean {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}
```
- **완료 조건**: 정확한 간격 계산

### Task #6.10: 종횡비 계산
- **파일**: `src/utils/ruler/aspectRatio.ts`
- **시간**: 20분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 종횡비 계산 및 간소화
 */
export function calculateAspectRatio(width: number, height: number): {
  decimal: number;
  ratio: string;
  common?: string;
} {
  const decimal = width / height;
  const gcd = getGCD(Math.round(width), Math.round(height));
  const simplifiedWidth = Math.round(width) / gcd;
  const simplifiedHeight = Math.round(height) / gcd;
  const ratio = `${simplifiedWidth}:${simplifiedHeight}`;
  const common = getCommonAspectRatio(decimal);

  return {
    decimal,
    ratio,
    common,
  };
}

/**
 * 최대공약수 계산
 */
function getGCD(a: number, b: number): number {
  return b === 0 ? a : getGCD(b, a % b);
}

/**
 * 일반적인 종횡비 이름 반환
 */
function getCommonAspectRatio(decimal: number): string | undefined {
  const ratios: Record<string, number> = {
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '16:10': 16 / 10,
    '21:9': 21 / 9,
    '3:2': 3 / 2,
    '5:4': 5 / 4,
  };

  const tolerance = 0.01;

  for (const [name, value] of Object.entries(ratios)) {
    if (Math.abs(decimal - value) < tolerance) {
      return name;
    }
  }

  return undefined;
}

/**
 * 비율 유지하며 크기 조정
 */
export function scaleToAspectRatio(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  if (targetWidth && !targetHeight) {
    return {
      width: targetWidth,
      height: targetWidth / aspectRatio,
    };
  }

  if (targetHeight && !targetWidth) {
    return {
      width: targetHeight * aspectRatio,
      height: targetHeight,
    };
  }

  return {
    width: originalWidth,
    height: originalHeight,
  };
}
```
- **완료 조건**: 정확한 종횡비 계산 및 간소화

### Task #6.11: Box Model 측정
- **파일**: `src/utils/ruler/boxModel.ts`
- **시간**: 45분
- **의존성**: Task #6.1
- **상세 내용**:
```typescript
import { BoxModel } from '../../types/ruler';

/**
 * Box Model 정보 추출
 */
export function getBoxModel(element: HTMLElement): BoxModel {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  const padding = {
    top: parseFloat(computedStyle.paddingTop),
    right: parseFloat(computedStyle.paddingRight),
    bottom: parseFloat(computedStyle.paddingBottom),
    left: parseFloat(computedStyle.paddingLeft),
  };

  const border = {
    top: parseFloat(computedStyle.borderTopWidth),
    right: parseFloat(computedStyle.borderRightWidth),
    bottom: parseFloat(computedStyle.borderBottomWidth),
    left: parseFloat(computedStyle.borderLeftWidth),
  };

  const margin = {
    top: parseFloat(computedStyle.marginTop),
    right: parseFloat(computedStyle.marginRight),
    bottom: parseFloat(computedStyle.marginBottom),
    left: parseFloat(computedStyle.marginLeft),
  };

  const contentWidth = rect.width - padding.left - padding.right - border.left - border.right;
  const contentHeight = rect.height - padding.top - padding.bottom - border.top - border.bottom;

  const content = new DOMRect(
    rect.left + border.left + padding.left,
    rect.top + border.top + padding.top,
    contentWidth,
    contentHeight
  );

  const total = {
    width: rect.width + margin.left + margin.right,
    height: rect.height + margin.top + margin.bottom,
  };

  return {
    content,
    padding,
    border,
    margin,
    total,
  };
}

/**
 * Box Model 영역별 DOMRect 반환
 */
export function getBoxModelRects(element: HTMLElement): {
  content: DOMRect;
  padding: DOMRect;
  border: DOMRect;
  margin: DOMRect;
} {
  const rect = element.getBoundingClientRect();
  const boxModel = getBoxModel(element);

  const { padding, border, margin } = boxModel;

  // Padding box
  const paddingRect = new DOMRect(
    rect.left + border.left,
    rect.top + border.top,
    rect.width - border.left - border.right,
    rect.height - border.top - border.bottom
  );

  // Border box (= element rect)
  const borderRect = rect;

  // Margin box
  const marginRect = new DOMRect(
    rect.left - margin.left,
    rect.top - margin.top,
    rect.width + margin.left + margin.right,
    rect.height + margin.top + margin.bottom
  );

  return {
    content: boxModel.content,
    padding: paddingRect,
    border: borderRect,
    margin: marginRect,
  };
}
```
- **완료 조건**: 정확한 Box Model 정보 추출

### Task #6.12: Viewport 기준 위치 계산
- **파일**: `src/utils/ruler/position.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Viewport 기준 위치 반환
 */
export function getBoundingRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Document 기준 절대 위치 반환
 */
export function getAbsolutePosition(element: HTMLElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * 요소의 중심점 반환
 */
export function getCenterPoint(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * 요소가 Viewport 내에 있는지 확인
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * 요소가 Viewport와 겹치는지 확인
 */
export function intersectsViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}
```
- **완료 조건**: 정확한 위치 계산

### Task #6.13: 단위 변환 유틸리티
- **파일**: `src/utils/ruler/units.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 픽셀을 다른 단위로 변환
 */
export function convertFromPixels(
  pixels: number,
  targetUnit: 'px' | 'rem' | 'em',
  context?: HTMLElement
): number {
  if (targetUnit === 'px') {
    return pixels;
  }

  if (targetUnit === 'rem') {
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    return pixels / rootFontSize;
  }

  if (targetUnit === 'em') {
    const contextElement = context || document.documentElement;
    const fontSize = parseFloat(getComputedStyle(contextElement).fontSize);
    return pixels / fontSize;
  }

  return pixels;
}

/**
 * 다른 단위를 픽셀로 변환
 */
export function convertToPixels(
  value: number,
  unit: 'px' | 'rem' | 'em',
  context?: HTMLElement
): number {
  if (unit === 'px') {
    return value;
  }

  if (unit === 'rem') {
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    return value * rootFontSize;
  }

  if (unit === 'em') {
    const contextElement = context || document.documentElement;
    const fontSize = parseFloat(getComputedStyle(contextElement).fontSize);
    return value * fontSize;
  }

  return value;
}

/**
 * 값을 포맷하여 단위와 함께 반환
 */
export function formatWithUnit(
  pixels: number,
  unit: 'px' | 'rem' | 'em',
  precision: number = 2,
  context?: HTMLElement
): string {
  const value = convertFromPixels(pixels, unit, context);
  return `${value.toFixed(precision)}${unit}`;
}

/**
 * CSS 값에서 숫자와 단위 파싱
 */
export function parseCSSValue(cssValue: string): {
  value: number;
  unit: string;
} {
  const match = cssValue.match(/^([-\d.]+)([a-z%]*)$/i);

  if (!match) {
    return { value: 0, unit: 'px' };
  }

  return {
    value: parseFloat(match[1]),
    unit: match[2] || 'px',
  };
}
```
- **완료 조건**: 정확한 단위 변환

### Task #6.14: 레티나 디스플레이 대응
- **파일**: `src/utils/ruler/retina.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Device Pixel Ratio 반환
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * 픽셀 스냅 (레티나 대응)
 */
export function snapToPixel(value: number): number {
  const dpr = getDevicePixelRatio();
  return Math.round(value * dpr) / dpr;
}

/**
 * 좌표 스냅
 */
export function snapPoint(point: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: snapToPixel(point.x),
    y: snapToPixel(point.y),
  };
}

/**
 * DOMRect 스냅
 */
export function snapRect(rect: DOMRect): DOMRect {
  return new DOMRect(
    snapToPixel(rect.x),
    snapToPixel(rect.y),
    snapToPixel(rect.width),
    snapToPixel(rect.height)
  );
}

/**
 * 물리적 픽셀 크기 계산
 */
export function getPhysicalPixels(cssPixels: number): number {
  return cssPixels * getDevicePixelRatio();
}

/**
 * CSS 픽셀 크기 계산
 */
export function getCSSPixels(physicalPixels: number): number {
  return physicalPixels / getDevicePixelRatio();
}

/**
 * 레티나 디스플레이 여부 확인
 */
export function isRetina(): boolean {
  return getDevicePixelRatio() > 1;
}
```
- **완료 조건**: 레티나 디스플레이에서 정확한 측정

### Task #6.15: 반올림 및 정밀도 유틸리티
- **파일**: `src/utils/ruler/precision.ts`
- **시간**: 20분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 지정된 정밀도로 반올림
 */
export function roundToPrecision(value: number, precision: number = 2): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 거리 객체의 모든 값 반올림
 */
export function roundDistance(distance: {
  horizontal: number;
  vertical: number;
  diagonal: number;
  angle: number;
}, precision: number = 2): typeof distance {
  return {
    horizontal: roundToPrecision(distance.horizontal, precision),
    vertical: roundToPrecision(distance.vertical, precision),
    diagonal: roundToPrecision(distance.diagonal, precision),
    angle: roundToPrecision(distance.angle, precision),
  };
}

/**
 * 크기 객체의 모든 값 반올림
 */
export function roundDimensions(dimensions: {
  width: number;
  height: number;
  aspectRatio: number;
}, precision: number = 2): typeof dimensions {
  return {
    width: roundToPrecision(dimensions.width, precision),
    height: roundToPrecision(dimensions.height, precision),
    aspectRatio: roundToPrecision(dimensions.aspectRatio, precision),
  };
}

/**
 * 정수로 반올림
 */
export function roundToInteger(value: number): number {
  return Math.round(value);
}

/**
 * 가장 가까운 배수로 반올림
 */
export function roundToMultiple(value: number, multiple: number): number {
  return Math.round(value / multiple) * multiple;
}
```
- **완료 조건**: 정확한 반올림

### Task #6.16: 측정 유효성 검증
- **파일**: `src/utils/ruler/validation.ts`
- **시간**: 20분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 좌표 유효성 검증
 */
export function isValidCoordinate(point: { x: number; y: number }): boolean {
  return (
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    !isNaN(point.x) &&
    !isNaN(point.y) &&
    isFinite(point.x) &&
    isFinite(point.y)
  );
}

/**
 * 요소 유효성 검증
 */
export function isValidElement(element: any): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    element.offsetParent !== null
  );
}

/**
 * 크기 유효성 검증
 */
export function isValidDimension(value: number): boolean {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    value >= 0
  );
}

/**
 * 측정 결과 유효성 검증
 */
export function isValidMeasurement(measurement: any): boolean {
  if (!measurement || typeof measurement !== 'object') {
    return false;
  }

  if (!measurement.id || !measurement.timestamp || !measurement.type) {
    return false;
  }

  if (measurement.type === 'element' && !measurement.element) {
    return false;
  }

  if (measurement.type === 'distance' && !measurement.distance) {
    return false;
  }

  if (measurement.type === 'gap' && !measurement.gap) {
    return false;
  }

  return true;
}

/**
 * 단위 유효성 검증
 */
export function isValidUnit(unit: string): unit is 'px' | 'rem' | 'em' {
  return unit === 'px' || unit === 'rem' || unit === 'em';
}
```
- **완료 조건**: 안전한 유효성 검증

---

## Phase 3: 시각화 유틸리티 (5개 태스크, 2시간)

### Task #6.17: 측정선 그리기
- **파일**: `src/utils/ruler/drawLine.ts`
- **시간**: 30분
- **의존성**: Task #6.1, #6.4
- **상세 내용**:
```typescript
import { RULER_CLASSES } from '../../constants/classes';

/**
 * 측정선 SVG 생성
 */
export function createMeasurementLine(
  start: { x: number; y: number },
  end: { x: number; y: number },
  options: {
    color?: string;
    width?: number;
    dashed?: boolean;
    showArrows?: boolean;
  } = {}
): SVGSVGElement {
  const {
    color = '#3b82f6',
    width = 2,
    dashed = false,
    showArrows = true,
  } = options;

  // SVG 컨테이너
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add(RULER_CLASSES.LINE);

  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);

  const svgWidth = maxX - minX + 40;
  const svgHeight = maxY - minY + 40;

  svg.setAttribute('width', svgWidth.toString());
  svg.setAttribute('height', svgHeight.toString());
  svg.style.position = 'absolute';
  svg.style.left = `${minX - 20}px`;
  svg.style.top = `${minY - 20}px`;
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '10000';

  // 선
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', (start.x - minX + 20).toString());
  line.setAttribute('y1', (start.y - minY + 20).toString());
  line.setAttribute('x2', (end.x - minX + 20).toString());
  line.setAttribute('y2', (end.y - minY + 20).toString());
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', width.toString());

  if (dashed) {
    line.setAttribute('stroke-dasharray', '4 2');
  }

  svg.appendChild(line);

  // 화살표
  if (showArrows) {
    const arrow1 = createArrow(
      start.x - minX + 20,
      start.y - minY + 20,
      end.x - minX + 20,
      end.y - minY + 20,
      color,
      true
    );
    const arrow2 = createArrow(
      start.x - minX + 20,
      start.y - minY + 20,
      end.x - minX + 20,
      end.y - minY + 20,
      color,
      false
    );

    svg.appendChild(arrow1);
    svg.appendChild(arrow2);
  }

  return svg;
}

/**
 * 화살표 생성
 */
function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  atStart: boolean
): SVGPathElement {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLength = 8;
  const arrowAngle = Math.PI / 6;

  const [px, py] = atStart ? [x1, y1] : [x2, y2];
  const direction = atStart ? -1 : 1;

  const x3 = px - direction * arrowLength * Math.cos(angle - arrowAngle);
  const y3 = py - direction * arrowLength * Math.sin(angle - arrowAngle);
  const x4 = px - direction * arrowLength * Math.cos(angle + arrowAngle);
  const y4 = py - direction * arrowLength * Math.sin(angle + arrowAngle);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x3} ${y3} L ${px} ${py} L ${x4} ${y4}`);
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');

  return path;
}

/**
 * 측정선 제거
 */
export function removeMeasurementLine(line: SVGSVGElement) {
  line.remove();
}

/**
 * 모든 측정선 제거
 */
export function removeAllMeasurementLines() {
  const lines = document.querySelectorAll(`.${RULER_CLASSES.LINE}`);
  lines.forEach((line) => line.remove());
}
```
- **완료 조건**: 측정선 정상 렌더링

### Task #6.18: 크기 라벨 그리기
- **파일**: `src/utils/ruler/drawLabel.ts`
- **시간**: 30분
- **의존성**: Task #6.4, #6.13
- **상세 내용**:
```typescript
import { RULER_CLASSES } from '../../constants/classes';
import { formatWithUnit } from './units';

/**
 * 측정값 라벨 생성
 */
export function createDimensionLabel(
  text: string,
  position: { x: number; y: number },
  options: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  } = {}
): HTMLDivElement {
  const {
    backgroundColor = '#3b82f6',
    textColor = '#ffffff',
    fontSize = 12,
  } = options;

  const label = document.createElement('div');
  label.classList.add(RULER_CLASSES.LABEL);
  label.textContent = text;

  label.style.position = 'absolute';
  label.style.left = `${position.x}px`;
  label.style.top = `${position.y}px`;
  label.style.backgroundColor = backgroundColor;
  label.style.color = textColor;
  label.style.fontSize = `${fontSize}px`;
  label.style.padding = '4px 8px';
  label.style.borderRadius = '4px';
  label.style.fontFamily = 'monospace';
  label.style.fontWeight = 'bold';
  label.style.whiteSpace = 'nowrap';
  label.style.pointerEvents = 'none';
  label.style.zIndex = '10001';
  label.style.transform = 'translate(-50%, -50%)';
  label.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

  return label;
}

/**
 * 크기 라벨 (width × height)
 */
export function createSizeLabel(
  width: number,
  height: number,
  position: { x: number; y: number },
  unit: 'px' | 'rem' | 'em' = 'px'
): HTMLDivElement {
  const widthText = formatWithUnit(width, unit, 1);
  const heightText = formatWithUnit(height, unit, 1);
  const text = `${widthText} × ${heightText}`;

  return createDimensionLabel(text, position);
}

/**
 * 거리 라벨
 */
export function createDistanceLabel(
  distance: number,
  position: { x: number; y: number },
  unit: 'px' | 'rem' | 'em' = 'px'
): HTMLDivElement {
  const text = formatWithUnit(distance, unit, 1);

  return createDimensionLabel(text, position);
}

/**
 * 각도 라벨
 */
export function createAngleLabel(
  angleRadians: number,
  position: { x: number; y: number }
): HTMLDivElement {
  const degrees = angleRadians * (180 / Math.PI);
  const text = `${degrees.toFixed(1)}°`;

  return createDimensionLabel(text, position, {
    backgroundColor: '#a855f7',
  });
}

/**
 * 종횡비 라벨
 */
export function createAspectRatioLabel(
  aspectRatio: { ratio: string; common?: string },
  position: { x: number; y: number }
): HTMLDivElement {
  const text = aspectRatio.common || aspectRatio.ratio;

  return createDimensionLabel(text, position, {
    backgroundColor: '#10b981',
  });
}

/**
 * 라벨 제거
 */
export function removeLabel(label: HTMLDivElement) {
  label.remove();
}

/**
 * 모든 라벨 제거
 */
export function removeAllLabels() {
  const labels = document.querySelectorAll(`.${RULER_CLASSES.LABEL}`);
  labels.forEach((label) => label.remove());
}
```
- **완료 조건**: 라벨 정상 렌더링

### Task #6.19: Box Model 오버레이
- **파일**: `src/utils/ruler/drawBoxModel.ts`
- **시간**: 45분
- **의존성**: Task #6.4, #6.11, #6.6
- **상세 내용**:
```typescript
import { RULER_CLASSES, RULER_COLORS } from '../../constants';
import { BoxModel } from '../../types/ruler';
import { getBoxModelRects } from './boxModel';

/**
 * Box Model 오버레이 생성
 */
export function createBoxModelOverlay(element: HTMLElement): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.classList.add(RULER_CLASSES.BOX_MODEL);
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '9999';

  const rects = getBoxModelRects(element);

  // Margin
  const marginBox = createBoxLayer(rects.margin, RULER_COLORS.MARGIN, 0.2);
  overlay.appendChild(marginBox);

  // Border
  const borderBox = createBoxLayer(rects.border, RULER_COLORS.BORDER, 0.2);
  overlay.appendChild(borderBox);

  // Padding
  const paddingBox = createBoxLayer(rects.padding, RULER_COLORS.PADDING, 0.2);
  overlay.appendChild(paddingBox);

  // Content
  const contentBox = createBoxLayer(rects.content, RULER_COLORS.CONTENT, 0.2);
  overlay.appendChild(contentBox);

  // 라벨
  const labels = createBoxModelLabels(element, rects);
  labels.forEach((label) => overlay.appendChild(label));

  return overlay;
}

/**
 * Box Model 레이어 생성
 */
function createBoxLayer(
  rect: DOMRect,
  color: string,
  opacity: number
): HTMLDivElement {
  const layer = document.createElement('div');
  layer.style.position = 'absolute';
  layer.style.left = `${rect.left}px`;
  layer.style.top = `${rect.top}px`;
  layer.style.width = `${rect.width}px`;
  layer.style.height = `${rect.height}px`;
  layer.style.backgroundColor = color;
  layer.style.opacity = opacity.toString();
  layer.style.border = `1px solid ${color}`;

  return layer;
}

/**
 * Box Model 라벨 생성
 */
function createBoxModelLabels(
  element: HTMLElement,
  rects: ReturnType<typeof getBoxModelRects>
): HTMLDivElement[] {
  const boxModel = getBoxModel(element);
  const labels: HTMLDivElement[] = [];

  // Content 크기
  const contentLabel = createLabel(
    `${Math.round(rects.content.width)} × ${Math.round(rects.content.height)}`,
    {
      x: rects.content.left + rects.content.width / 2,
      y: rects.content.top + rects.content.height / 2,
    },
    RULER_COLORS.CONTENT
  );
  labels.push(contentLabel);

  // Padding
  if (boxModel.padding.top > 0) {
    const paddingTopLabel = createLabel(
      `padding: ${boxModel.padding.top}px`,
      {
        x: rects.padding.left + rects.padding.width / 2,
        y: rects.padding.top + boxModel.padding.top / 2,
      },
      RULER_COLORS.PADDING
    );
    labels.push(paddingTopLabel);
  }

  // Border
  if (boxModel.border.top > 0) {
    const borderTopLabel = createLabel(
      `border: ${boxModel.border.top}px`,
      {
        x: rects.border.left + rects.border.width / 2,
        y: rects.border.top + boxModel.border.top / 2,
      },
      RULER_COLORS.BORDER
    );
    labels.push(borderTopLabel);
  }

  // Margin
  if (boxModel.margin.top > 0) {
    const marginTopLabel = createLabel(
      `margin: ${boxModel.margin.top}px`,
      {
        x: rects.margin.left + rects.margin.width / 2,
        y: rects.margin.top + boxModel.margin.top / 2,
      },
      RULER_COLORS.MARGIN
    );
    labels.push(marginTopLabel);
  }

  return labels;
}

/**
 * 라벨 헬퍼
 */
function createLabel(
  text: string,
  position: { x: number; y: number },
  color: string
): HTMLDivElement {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.position = 'absolute';
  label.style.left = `${position.x}px`;
  label.style.top = `${position.y}px`;
  label.style.transform = 'translate(-50%, -50%)';
  label.style.backgroundColor = color;
  label.style.color = '#ffffff';
  label.style.padding = '2px 6px';
  label.style.borderRadius = '3px';
  label.style.fontSize = '11px';
  label.style.fontFamily = 'monospace';
  label.style.whiteSpace = 'nowrap';
  label.style.pointerEvents = 'none';

  return label;
}

/**
 * Box Model 오버레이 제거
 */
export function removeBoxModelOverlay() {
  const overlays = document.querySelectorAll(`.${RULER_CLASSES.BOX_MODEL}`);
  overlays.forEach((overlay) => overlay.remove());
}
```
- **완료 조건**: Box Model 오버레이 정상 렌더링

### Task #6.20: 요소 하이라이트
- **파일**: `src/utils/ruler/highlight.ts`
- **시간**: 20분
- **의존성**: Task #6.4
- **상세 내용**:
```typescript
import { RULER_CLASSES } from '../../constants/classes';

/**
 * 요소 하이라이트 (측정 가능 표시)
 */
export function highlightElement(
  element: HTMLElement,
  type: 'hover' | 'measuring' | 'measured' = 'hover'
): void {
  const className = type === 'hover'
    ? RULER_CLASSES.HOVER
    : type === 'measuring'
    ? RULER_CLASSES.MEASURING
    : RULER_CLASSES.MEASURED;

  element.classList.add(className);
}

/**
 * 하이라이트 제거
 */
export function removeHighlight(
  element: HTMLElement,
  type?: 'hover' | 'measuring' | 'measured'
): void {
  if (type) {
    const className = type === 'hover'
      ? RULER_CLASSES.HOVER
      : type === 'measuring'
      ? RULER_CLASSES.MEASURING
      : RULER_CLASSES.MEASURED;

    element.classList.remove(className);
  } else {
    element.classList.remove(
      RULER_CLASSES.HOVER,
      RULER_CLASSES.MEASURING,
      RULER_CLASSES.MEASURED
    );
  }
}

/**
 * 모든 하이라이트 제거
 */
export function removeAllHighlights(): void {
  const elements = document.querySelectorAll(
    `.${RULER_CLASSES.HOVER}, .${RULER_CLASSES.MEASURING}, .${RULER_CLASSES.MEASURED}`
  );

  elements.forEach((element) => {
    element.classList.remove(
      RULER_CLASSES.HOVER,
      RULER_CLASSES.MEASURING,
      RULER_CLASSES.MEASURED
    );
  });
}

/**
 * 선택자로 요소 하이라이트
 */
export function highlightElementBySelector(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement;

  if (element) {
    highlightElement(element, 'measured');

    // 3초 후 자동 제거
    setTimeout(() => {
      removeHighlight(element, 'measured');
    }, 3000);
  }
}
```
- **완료 조건**: 하이라이트 정상 동작

### Task #6.21: 오버레이 관리
- **파일**: `src/utils/ruler/overlay.ts`
- **시간**: 15분
- **의존성**: Task #6.17-#6.20
- **상세 내용**:
```typescript
import { removeAllMeasurementLines } from './drawLine';
import { removeAllLabels } from './drawLabel';
import { removeBoxModelOverlay } from './drawBoxModel';
import { removeAllHighlights } from './highlight';

/**
 * 모든 오버레이 제거
 */
export function clearAllOverlays(): void {
  removeAllMeasurementLines();
  removeAllLabels();
  removeBoxModelOverlay();
  removeAllHighlights();
}

/**
 * 측정 오버레이만 제거
 */
export function clearMeasurementOverlays(): void {
  removeAllMeasurementLines();
  removeAllLabels();
}

/**
 * Box Model 오버레이만 제거
 */
export function clearBoxModelOverlays(): void {
  removeBoxModelOverlay();
}

/**
 * 오버레이 컨테이너 생성
 */
export function createOverlayContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'klic-ruler-overlay-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9998';

  document.body.appendChild(container);

  return container;
}

/**
 * 오버레이 컨테이너 제거
 */
export function removeOverlayContainer(): void {
  const container = document.getElementById('klic-ruler-overlay-container');

  if (container) {
    container.remove();
  }
}
```
- **완료 조건**: 오버레이 관리 정상 동작

---

## Phase 4: Storage 및 상태 관리 (3개 태스크, 1.5시간)

### Task #6.22: Storage 기본 CRUD 훅
- **파일**: `src/hooks/ruler/useRulerStorage.ts`
- **시간**: 45분
- **의존성**: Task #6.1, #6.2
- **상세 내용**:
```typescript
import { useState, useEffect } from 'react';
import { Measurement, RulerSettings } from '../../types/ruler';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { DEFAULT_RULER_SETTINGS } from '../../constants/defaults';

export function useRulerStorage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [settings, setSettings] = useState<RulerSettings>(DEFAULT_RULER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    try {
      setIsLoading(true);

      const result = await chrome.storage.local.get([
        STORAGE_KEYS.RULER_HISTORY,
        STORAGE_KEYS.RULER_SETTINGS,
      ]);

      if (result[STORAGE_KEYS.RULER_HISTORY]) {
        setMeasurements(result[STORAGE_KEYS.RULER_HISTORY].measurements || []);
      }

      if (result[STORAGE_KEYS.RULER_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.RULER_SETTINGS]);
      }
    } catch (error) {
      console.error('Failed to load ruler data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 측정 저장
   */
  const saveMeasurement = async (measurement: Measurement): Promise<boolean> => {
    try {
      const newMeasurements = [measurement, ...measurements].slice(
        0,
        settings.maxHistorySize
      );

      await chrome.storage.local.set({
        [STORAGE_KEYS.RULER_HISTORY]: {
          measurements: newMeasurements,
          maxSize: settings.maxHistorySize,
          totalMeasurements: measurements.length + 1,
          lastMeasurementTime: Date.now(),
        },
      });

      setMeasurements(newMeasurements);

      return true;
    } catch (error) {
      console.error('Failed to save measurement:', error);
      return false;
    }
  };

  /**
   * 측정 삭제
   */
  const deleteMeasurement = async (id: string): Promise<boolean> => {
    try {
      const newMeasurements = measurements.filter((m) => m.id !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.RULER_HISTORY]: {
          measurements: newMeasurements,
          maxSize: settings.maxHistorySize,
          totalMeasurements: measurements.length,
          lastMeasurementTime: Date.now(),
        },
      });

      setMeasurements(newMeasurements);

      return true;
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      return false;
    }
  };

  /**
   * 모든 측정 삭제
   */
  const clearMeasurements = async (): Promise<boolean> => {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.RULER_HISTORY);
      setMeasurements([]);

      return true;
    } catch (error) {
      console.error('Failed to clear measurements:', error);
      return false;
    }
  };

  /**
   * 설정 업데이트
   */
  const updateSettings = async (newSettings: Partial<RulerSettings>): Promise<boolean> => {
    try {
      const updated = {
        ...settings,
        ...newSettings,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.RULER_SETTINGS]: updated,
      });

      setSettings(updated);

      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  };

  return {
    measurements,
    settings,
    isLoading,
    saveMeasurement,
    deleteMeasurement,
    clearMeasurements,
    updateSettings,
    reload: loadData,
  };
}
```
- **완료 조건**: CRUD 동작 정상

### Task #6.23: 측정 히스토리 관리
- **파일**: `src/hooks/ruler/useMeasurementHistory.ts`
- **시간**: 30분
- **의존성**: Task #6.1, #6.22
- **상세 내용**:
```typescript
import { useMemo } from 'react';
import { useRulerStorage } from './useRulerStorage';
import { Measurement, MeasurementStats } from '../../types/ruler';

export function useMeasurementHistory() {
  const {
    measurements,
    saveMeasurement,
    deleteMeasurement,
    clearMeasurements,
  } = useRulerStorage();

  /**
   * 타입별 필터링
   */
  const byType = useMemo(() => {
    return {
      element: measurements.filter((m) => m.type === 'element'),
      distance: measurements.filter((m) => m.type === 'distance'),
      gap: measurements.filter((m) => m.type === 'gap'),
    };
  }, [measurements]);

  /**
   * 통계 계산
   */
  const stats: MeasurementStats = useMemo(() => {
    const elementMeasurements = byType.element;

    let totalWidth = 0;
    let totalHeight = 0;

    elementMeasurements.forEach((m) => {
      if (m.element) {
        totalWidth += m.element.dimensions.width;
        totalHeight += m.element.dimensions.height;
      }
    });

    const avgWidth = elementMeasurements.length > 0
      ? totalWidth / elementMeasurements.length
      : 0;
    const avgHeight = elementMeasurements.length > 0
      ? totalHeight / elementMeasurements.length
      : 0;

    const lastMeasurement = measurements[0];

    return {
      totalMeasurements: measurements.length,
      byType: {
        element: byType.element.length,
        distance: byType.distance.length,
        gap: byType.gap.length,
      },
      averageDimensions: {
        width: avgWidth,
        height: avgHeight,
      },
      lastMeasurementTime: lastMeasurement?.timestamp || 0,
    };
  }, [measurements, byType]);

  /**
   * 최근 측정 가져오기
   */
  const getRecentMeasurements = (count: number = 5): Measurement[] => {
    return measurements.slice(0, count);
  };

  /**
   * 특정 측정 찾기
   */
  const findMeasurement = (id: string): Measurement | undefined => {
    return measurements.find((m) => m.id === id);
  };

  return {
    measurements,
    byType,
    stats,
    getRecentMeasurements,
    findMeasurement,
    saveMeasurement,
    deleteMeasurement,
    clearMeasurements,
  };
}
```
- **완료 조건**: 히스토리 관리 정상 동작

### Task #6.24: 드래그 상태 관리
- **파일**: `src/hooks/ruler/useDragState.ts`
- **시간**: 15분
- **의존성**: Task #6.1
- **상세 내용**:
```typescript
import { useState } from 'react';
import { DragState } from '../../types/ruler';

export function useDragState() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPoint: null,
    currentPoint: null,
    element: null,
  });

  /**
   * 드래그 시작
   */
  const startDrag = (point: { x: number; y: number }, element?: HTMLElement) => {
    setDragState({
      isDragging: true,
      startPoint: point,
      currentPoint: point,
      element: element || null,
    });
  };

  /**
   * 드래그 업데이트
   */
  const updateDrag = (point: { x: number; y: number }) => {
    setDragState((prev) => ({
      ...prev,
      currentPoint: point,
    }));
  };

  /**
   * 드래그 종료
   */
  const endDrag = () => {
    const finalState = { ...dragState };

    setDragState({
      isDragging: false,
      startPoint: null,
      currentPoint: null,
      element: null,
    });

    return finalState;
  };

  /**
   * 드래그 취소
   */
  const cancelDrag = () => {
    setDragState({
      isDragging: false,
      startPoint: null,
      currentPoint: null,
      element: null,
    });
  };

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };
}
```
- **완료 조건**: 드래그 상태 관리 정상 동작

---

## Phase 5: React 컴포넌트 (4개 태스크, 2시간)

### Task #6.25: RulerPanel 메인 컴포넌트
- **파일**: `src/sidepanel/components/Ruler/RulerPanel.tsx`
- **시간**: 45분
- **의존성**: Task #6.22, #6.23
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { useMeasurementHistory } from '../../../hooks/ruler/useMeasurementHistory';
import { useRulerStorage } from '../../../hooks/ruler/useRulerStorage';
import { MeasurementList } from './MeasurementList';
import { MeasurementStats } from './MeasurementStats';
import { RulerSettings } from './RulerSettings';
import { MESSAGE_ACTIONS } from '../../../constants/messages';

interface RulerPanelProps {
  isActive: boolean;
  onToggle: () => void;
}

export function RulerPanel({ isActive, onToggle }: RulerPanelProps) {
  const {
    measurements,
    byType,
    stats,
    deleteMeasurement,
    clearMeasurements,
  } = useMeasurementHistory();

  const { settings, updateSettings } = useRulerStorage();

  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'settings'>('history');
  const [filterType, setFilterType] = useState<'all' | 'element' | 'distance' | 'gap'>('all');

  /**
   * 측정 모드 토글
   */
  const handleToggleMeasureMode = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: MESSAGE_ACTIONS.RULER_TOGGLE,
          data: { enabled: !isActive },
        });

        onToggle();
      }
    } catch (error) {
      console.error('Failed to toggle measure mode:', error);
    }
  };

  /**
   * 오버레이 클리어
   */
  const handleClearOverlay = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: MESSAGE_ACTIONS.RULER_CLEAR_OVERLAY,
        });
      }
    } catch (error) {
      console.error('Failed to clear overlay:', error);
    }
  };

  /**
   * 측정 삭제
   */
  const handleDeleteMeasurement = async (id: string) => {
    await deleteMeasurement(id);
  };

  /**
   * 모든 측정 삭제
   */
  const handleClearAll = async () => {
    if (!confirm('모든 측정을 삭제하시겠습니까?')) {
      return;
    }

    await clearMeasurements();
  };

  /**
   * 필터링된 측정
   */
  const filteredMeasurements = filterType === 'all'
    ? measurements
    : byType[filterType];

  return (
    <div className="ruler-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>자/측정</h2>

        <div className="header-actions">
          <button
            onClick={handleToggleMeasureMode}
            className={`toggle-btn ${isActive ? 'active' : ''}`}
          >
            {isActive ? '측정 모드 OFF' : '측정 모드 ON'}
          </button>

          {isActive && (
            <button
              onClick={handleClearOverlay}
              className="clear-overlay-btn"
            >
              오버레이 지우기
            </button>
          )}

          {measurements.length > 0 && (
            <button
              onClick={handleClearAll}
              className="clear-all-btn"
            >
              모두 삭제
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'active' : ''}
        >
          히스토리 ({measurements.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={activeTab === 'stats' ? 'active' : ''}
        >
          통계
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'history' && (
          <>
            {/* 필터 */}
            <div className="filter-bar">
              <button
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'active' : ''}
              >
                전체 ({measurements.length})
              </button>
              <button
                onClick={() => setFilterType('element')}
                className={filterType === 'element' ? 'active' : ''}
              >
                요소 ({byType.element.length})
              </button>
              <button
                onClick={() => setFilterType('distance')}
                className={filterType === 'distance' ? 'active' : ''}
              >
                거리 ({byType.distance.length})
              </button>
              <button
                onClick={() => setFilterType('gap')}
                className={filterType === 'gap' ? 'active' : ''}
              >
                간격 ({byType.gap.length})
              </button>
            </div>

            <MeasurementList
              measurements={filteredMeasurements}
              onDelete={handleDeleteMeasurement}
              unit={settings.unit}
            />
          </>
        )}

        {activeTab === 'stats' && (
          <MeasurementStats stats={stats} unit={settings.unit} />
        )}

        {activeTab === 'settings' && (
          <RulerSettings
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        )}
      </div>

      {/* 안내 메시지 */}
      {!isActive && measurements.length === 0 && (
        <div className="empty-state">
          <p>측정 모드를 활성화하고</p>
          <p>요소를 클릭하거나 드래그하여 측정하세요.</p>
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: 메인 패널 정상 동작

### Task #6.26: MeasurementCard 컴포넌트
- **파일**: `src/sidepanel/components/Ruler/MeasurementCard.tsx`
- **시간**: 30분
- **의존성**: Task #6.1, #6.13
- **상세 내용**:
```typescript
import React from 'react';
import { Measurement } from '../../../types/ruler';
import { formatWithUnit } from '../../../utils/ruler/units';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MeasurementCardProps {
  measurement: Measurement;
  onDelete: (id: string) => void;
  unit: 'px' | 'rem' | 'em';
}

export function MeasurementCard({ measurement, onDelete, unit }: MeasurementCardProps) {
  const timeAgo = formatDistanceToNow(measurement.timestamp, {
    addSuffix: true,
    locale: ko,
  });

  /**
   * 타입별 렌더링
   */
  const renderContent = () => {
    if (measurement.type === 'element' && measurement.element) {
      const { dimensions, selector } = measurement.element;

      return (
        <div className="measurement-content">
          <div className="measurement-type">요소 크기</div>
          <div className="measurement-value">
            {formatWithUnit(dimensions.width, unit, 1)} × {formatWithUnit(dimensions.height, unit, 1)}
          </div>
          <div className="measurement-detail">
            종횡비: {dimensions.aspectRatio.toFixed(2)}
          </div>
          <div className="measurement-selector">{selector}</div>
        </div>
      );
    }

    if (measurement.type === 'distance' && measurement.distance) {
      const { result } = measurement.distance;

      return (
        <div className="measurement-content">
          <div className="measurement-type">거리</div>
          <div className="measurement-value">
            {formatWithUnit(result.diagonal, unit, 1)}
          </div>
          <div className="measurement-detail">
            수평: {formatWithUnit(result.horizontal, unit, 1)},
            수직: {formatWithUnit(result.vertical, unit, 1)}
          </div>
          <div className="measurement-detail">
            각도: {(result.angle * 180 / Math.PI).toFixed(1)}°
          </div>
        </div>
      );
    }

    if (measurement.type === 'gap' && measurement.gap) {
      const { element1, element2, value, direction } = measurement.gap;

      return (
        <div className="measurement-content">
          <div className="measurement-type">간격 ({direction})</div>
          <div className="measurement-value">
            {typeof value === 'number'
              ? formatWithUnit(value, unit, 1)
              : `H: ${formatWithUnit(value.horizontal, unit, 1)}, V: ${formatWithUnit(value.vertical, unit, 1)}`}
          </div>
          <div className="measurement-selector">
            {element1} ↔ {element2}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="measurement-card">
      <div className="card-header">
        <span className="time-ago">{timeAgo}</span>
        <button
          onClick={() => onDelete(measurement.id)}
          className="delete-btn"
        >
          삭제
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
```
- **완료 조건**: 측정 카드 정상 렌더링

### Task #6.27: MeasurementHistory 컴포넌트
- **파일**: `src/sidepanel/components/Ruler/MeasurementList.tsx`
- **시간**: 15분
- **의존성**: Task #6.26
- **상세 내용**:
```typescript
import React from 'react';
import { Measurement } from '../../../types/ruler';
import { MeasurementCard } from './MeasurementCard';

interface MeasurementListProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  unit: 'px' | 'rem' | 'em';
}

export function MeasurementList({ measurements, onDelete, unit }: MeasurementListProps) {
  if (measurements.length === 0) {
    return (
      <div className="empty-list">
        <p>측정 히스토리가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="measurement-list">
      {measurements.map((measurement) => (
        <MeasurementCard
          key={measurement.id}
          measurement={measurement}
          onDelete={onDelete}
          unit={unit}
        />
      ))}
    </div>
  );
}
```
- **완료 조건**: 리스트 렌더링 정상

### Task #6.28: MeasurementStats 및 Settings 컴포넌트
- **파일**: `src/sidepanel/components/Ruler/MeasurementStats.tsx`, `RulerSettings.tsx`
- **시간**: 30분
- **의존성**: Task #6.1
- **상세 내용**: (TASK-01-TEXT-EDIT.md의 TextEditStats, SettingsPanel과 유사한 구조)
- **완료 조건**: 통계 및 설정 정상 동작

---

## Phase 6: Content Script 통합 (2개 태스크, 1.5시간)

### Task #6.29: 드래그 측정 오버레이
- **파일**: `src/content/ruler/dragMeasurement.ts`
- **시간**: 1시간
- **의존성**: Task #6.8, #6.17, #6.18, #6.24
- **상세 내용**:
```typescript
import { measureDistance } from '../../utils/ruler/measureDistance';
import { createMeasurementLine } from '../../utils/ruler/drawLine';
import { createDistanceLabel } from '../../utils/ruler/drawLabel';
import { snapPoint } from '../../utils/ruler/retina';

let isDragging = false;
let startPoint: { x: number; y: number } | null = null;
let currentLine: SVGSVGElement | null = null;
let currentLabel: HTMLDivElement | null = null;

/**
 * 드래그 측정 초기화
 */
export function initDragMeasurement() {
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

/**
 * 드래그 측정 정리
 */
export function cleanupDragMeasurement() {
  document.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  clearCurrentMeasurement();
}

/**
 * 마우스 다운 핸들러
 */
function handleMouseDown(event: MouseEvent) {
  if (event.button !== 0) return; // 좌클릭만

  startPoint = snapPoint({
    x: event.clientX,
    y: event.clientY,
  });

  isDragging = true;
}

/**
 * 마우스 이동 핸들러
 */
function handleMouseMove(event: MouseEvent) {
  if (!isDragging || !startPoint) return;

  const currentPoint = snapPoint({
    x: event.clientX,
    y: event.clientY,
  });

  updateMeasurement(startPoint, currentPoint);
}

/**
 * 마우스 업 핸들러
 */
function handleMouseUp(event: MouseEvent) {
  if (!isDragging || !startPoint) return;

  const endPoint = snapPoint({
    x: event.clientX,
    y: event.clientY,
  });

  finalizeMeasurement(startPoint, endPoint);

  isDragging = false;
  startPoint = null;
}

/**
 * 측정 업데이트 (실시간)
 */
function updateMeasurement(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  // 이전 측정 제거
  clearCurrentMeasurement();

  // 거리 계산
  const distance = measureDistance(start, end);

  // 선 그리기
  currentLine = createMeasurementLine(start, end, {
    color: '#3b82f6',
    width: 2,
    showArrows: true,
  });
  document.body.appendChild(currentLine);

  // 라벨 그리기
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  currentLabel = createDistanceLabel(distance.diagonal, midPoint);
  document.body.appendChild(currentLabel);
}

/**
 * 측정 확정
 */
function finalizeMeasurement(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const distance = measureDistance(start, end);

  // Side Panel에 저장
  chrome.runtime.sendMessage({
    action: 'RULER_SAVE_MEASUREMENT',
    data: {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'distance',
      distance: {
        start,
        end,
        result: distance,
      },
      metadata: {
        pageUrl: window.location.href,
        pageTitle: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        devicePixelRatio: window.devicePixelRatio,
      },
    },
  });
}

/**
 * 현재 측정 클리어
 */
function clearCurrentMeasurement() {
  if (currentLine) {
    currentLine.remove();
    currentLine = null;
  }

  if (currentLabel) {
    currentLabel.remove();
    currentLabel = null;
  }
}
```
- **완료 조건**: 드래그 측정 정상 동작

### Task #6.30: 요소 선택 및 측정
- **파일**: `src/content/ruler/elementMeasurement.ts`
- **시간**: 30분
- **의존성**: Task #6.7, #6.11, #6.18, #6.19
- **상세 내용**:
```typescript
import { measureElement } from '../../utils/ruler/measureElement';
import { getBoxModel } from '../../utils/ruler/boxModel';
import { createSizeLabel } from '../../utils/ruler/drawLabel';
import { createBoxModelOverlay } from '../../utils/ruler/drawBoxModel';
import { highlightElement, removeHighlight } from '../../utils/ruler/highlight';
import { getSelector } from '../../utils/dom/selectorGenerator';

/**
 * 요소 선택 및 측정
 */
export function measureElementOnClick(element: HTMLElement) {
  // 측정
  const dimensions = measureElement(element);
  const boxModel = getBoxModel(element);
  const rect = element.getBoundingClientRect();
  const selector = getSelector(element);

  // 하이라이트
  highlightElement(element, 'measured');

  // 크기 라벨
  const label = createSizeLabel(
    dimensions.width,
    dimensions.height,
    {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  );
  document.body.appendChild(label);

  // Box Model 오버레이
  const overlay = createBoxModelOverlay(element);
  document.body.appendChild(overlay);

  // Side Panel에 저장
  chrome.runtime.sendMessage({
    action: 'RULER_SAVE_MEASUREMENT',
    data: {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'element',
      element: {
        selector,
        dimensions,
        boxModel,
        position: {
          x: rect.left,
          y: rect.top,
        },
      },
      metadata: {
        pageUrl: window.location.href,
        pageTitle: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        devicePixelRatio: window.devicePixelRatio,
      },
    },
  });

  // 3초 후 하이라이트 제거
  setTimeout(() => {
    removeHighlight(element, 'measured');
  }, 3000);
}
```
- **완료 조건**: 요소 측정 정상 동작

---

## Phase 7: 테스트 및 최적화 (1개 태스크, 1시간)

### Task #6.31: 단위 및 통합 테스트
- **파일**: `src/utils/ruler/__tests__/ruler.test.ts`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { measureElement } from '../measureElement';
import { measureDistance, calculateEuclideanDistance } from '../measureDistance';
import { measureGap } from '../measureGap';
import { calculateAspectRatio } from '../aspectRatio';
import { getBoxModel } from '../boxModel';
import { convertFromPixels, convertToPixels } from '../units';
import { snapToPixel, getDevicePixelRatio } from '../retina';

describe('measureElement', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-element" style="width: 100px; height: 50px;">Test</div>
    `;
  });

  it('should measure element dimensions', () => {
    const element = document.getElementById('test-element') as HTMLElement;
    const dimensions = measureElement(element);

    expect(dimensions.width).toBe(100);
    expect(dimensions.height).toBe(50);
    expect(dimensions.aspectRatio).toBe(2);
  });
});

describe('measureDistance', () => {
  it('should calculate distance between two points', () => {
    const distance = measureDistance(
      { x: 0, y: 0 },
      { x: 3, y: 4 }
    );

    expect(distance.horizontal).toBe(3);
    expect(distance.vertical).toBe(4);
    expect(distance.diagonal).toBe(5);
  });

  it('should calculate angle', () => {
    const distance = measureDistance(
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    );

    expect(distance.angle).toBeCloseTo(Math.PI / 4, 5);
  });
});

describe('aspectRatio', () => {
  it('should calculate and simplify aspect ratio', () => {
    const ratio = calculateAspectRatio(1920, 1080);

    expect(ratio.ratio).toBe('16:9');
    expect(ratio.common).toBe('16:9');
  });
});

describe('units', () => {
  it('should convert pixels to rem', () => {
    const rem = convertFromPixels(16, 'rem');
    expect(rem).toBe(1);
  });

  it('should convert rem to pixels', () => {
    const pixels = convertToPixels(1, 'rem');
    expect(pixels).toBe(16);
  });
});

// ... 더 많은 테스트
```
- **완료 조건**: 80% 이상 테스트 커버리지

---

## ✅ 완료 체크리스트

- [ ] Phase 1: 기반 설정 (6개 태스크)
  - [ ] Task #6.1: 타입 정의
  - [ ] Task #6.2: Storage 상수
  - [ ] Task #6.3: 메시지 액션
  - [ ] Task #6.4: CSS 클래스
  - [ ] Task #6.5: 에러 메시지
  - [ ] Task #6.6: 기본 설정

- [ ] Phase 2: 측정 유틸리티 (10개 태스크)
  - [ ] Task #6.7: 요소 크기 측정
  - [ ] Task #6.8: 거리 측정
  - [ ] Task #6.9: 간격 측정
  - [ ] Task #6.10: 종횡비
  - [ ] Task #6.11: Box Model
  - [ ] Task #6.12: 위치 계산
  - [ ] Task #6.13: 단위 변환
  - [ ] Task #6.14: 레티나 대응
  - [ ] Task #6.15: 정밀도
  - [ ] Task #6.16: 유효성 검증

- [ ] Phase 3: 시각화 유틸리티 (5개 태스크)
  - [ ] Task #6.17: 측정선
  - [ ] Task #6.18: 라벨
  - [ ] Task #6.19: Box Model 오버레이
  - [ ] Task #6.20: 하이라이트
  - [ ] Task #6.21: 오버레이 관리

- [ ] Phase 4: Storage 및 상태 관리 (3개 태스크)
  - [ ] Task #6.22: Storage CRUD
  - [ ] Task #6.23: 히스토리 관리
  - [ ] Task #6.24: 드래그 상태

- [ ] Phase 5: React 컴포넌트 (4개 태스크)
  - [ ] Task #6.25: RulerPanel
  - [ ] Task #6.26: MeasurementCard
  - [ ] Task #6.27: MeasurementList
  - [ ] Task #6.28: Stats & Settings

- [ ] Phase 6: Content Script 통합 (2개 태스크)
  - [ ] Task #6.29: 드래그 측정
  - [ ] Task #6.30: 요소 측정

- [ ] Phase 7: 테스트 및 최적화 (1개 태스크)
  - [ ] Task #6.31: 테스트

---

**다음 단계**: 다른 도구 구현 또는 통합 테스트
