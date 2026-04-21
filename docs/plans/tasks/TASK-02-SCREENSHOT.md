# 도구 #2: 스크린샷 - 완전 태스크 분해

**총 태스크**: 35개
**예상 시간**: 14-17시간 (2-2.5일)
**작성일**: 2026-02-09

---

## 📑 목차

- [Phase 1: 기반 설정 (6개 태스크, 2시간)](#phase-1-기반-설정)
- [Phase 2: 캡처 유틸리티 (10개 태스크, 5시간)](#phase-2-캡처-유틸리티)
- [Phase 3: 주석 기능 (7개 태스크, 2.5시간)](#phase-3-주석-기능)
- [Phase 4: Storage (3개 태스크, 1.5시간)](#phase-4-storage)
- [Phase 5: React 컴포넌트 (5개 태스크, 2.5시간)](#phase-5-react-컴포넌트)
- [Phase 6: Content Script (3개 태스크, 1.5시간)](#phase-6-content-script)
- [Phase 7: 테스트 (1개 태스크, 1시간)](#phase-7-테스트)

---

## Phase 1: 기반 설정 (6개 태스크, 2시간)

### Task #2.1: 타입 정의 - 스크린샷 인터페이스
- **파일**: `src/types/screenshot.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 스크린샷 캡처 모드
 */
export type CaptureMode = 'element' | 'area' | 'fullPage' | 'viewport';

/**
 * 이미지 포맷
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/**
 * 주석 도구 타입
 */
export type AnnotationTool = 'arrow' | 'text' | 'rectangle' | 'circle' | 'pen' | 'highlight';

/**
 * 단일 스크린샷 레코드
 */
export interface Screenshot {
  id: string;                     // UUID
  timestamp: number;              // Date.now()
  url: string;                    // 페이지 URL
  title: string;                  // 페이지 제목
  image: {
    dataUrl: string;              // base64 이미지 데이터
    format: ImageFormat;          // 이미지 포맷
    width: number;                // 원본 너비
    height: number;               // 원본 높이
    size: number;                 // 파일 크기 (bytes)
  };
  thumbnail?: {
    dataUrl: string;              // 썸네일 (200x150)
    width: number;
    height: number;
  };
  captureMode: CaptureMode;       // 캡처 모드
  element?: {
    selector: string;             // CSS selector
    xpath: string;                // XPath
    tagName: string;              // 태그명
  };
  annotations: Annotation[];      // 주석 배열
  metadata?: {
    scrollPosition?: {
      x: number;
      y: number;
    };
    viewport?: {
      width: number;
      height: number;
    };
    userAgent?: string;
  };
}

/**
 * 주석 객체
 */
export interface Annotation {
  id: string;                     // UUID
  type: AnnotationTool;           // 주석 타입
  color: string;                  // 색상 (hex)
  strokeWidth: number;            // 선 두께
  data: AnnotationData;           // 타입별 데이터
  timestamp: number;              // 생성 시간
}

/**
 * 주석 데이터 (타입별)
 */
export type AnnotationData =
  | ArrowAnnotation
  | TextAnnotation
  | ShapeAnnotation
  | PenAnnotation;

export interface ArrowAnnotation {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  headSize: number;               // 화살촉 크기
}

export interface TextAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  backgroundColor?: string;       // 배경색 (선택)
}

export interface ShapeAnnotation {
  type: 'rectangle' | 'circle' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  filled: boolean;                // 채우기 여부
  opacity?: number;               // 투명도 (0-1)
}

export interface PenAnnotation {
  type: 'pen';
  points: Array<{ x: number; y: number }>;
  smoothing?: boolean;            // 스무딩 적용
}

/**
 * 스크린샷 설정
 */
export interface ScreenshotSettings {
  defaultFormat: ImageFormat;     // 기본 포맷
  quality: number;                // JPEG/WebP 품질 (0-1)
  captureMode: CaptureMode;       // 기본 캡처 모드
  includeAnnotations: boolean;    // 주석 포함 여부
  autoDownload: boolean;          // 자동 다운로드
  copyToClipboard: boolean;       // 클립보드 복사
  maxWidth?: number;              // 최대 너비 (리사이즈)
  maxHeight?: number;             // 최대 높이 (리사이즈)
  annotationDefaults: {
    color: string;                // 기본 색상
    strokeWidth: number;          // 기본 선 두께
    fontSize: number;             // 기본 폰트 크기
  };
}

/**
 * 스크린샷 히스토리
 */
export interface ScreenshotHistory {
  screenshots: Screenshot[];
  maxSize: number;                // 기본 10
  totalCaptures: number;
  lastCaptureTime: number;
  totalSize: number;              // 총 용량 (bytes)
}

/**
 * 캡처 옵션
 */
export interface CaptureOptions {
  format?: ImageFormat;
  quality?: number;
  mode?: CaptureMode;
  selector?: string;              // element 모드용
  area?: {                        // area 모드용
    x: number;
    y: number;
    width: number;
    height: number;
  };
  includeScrollbars?: boolean;
  delay?: number;                 // 캡처 전 지연 (ms)
}

/**
 * 이미지 처리 옵션
 */
export interface ImageProcessOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;                // 회전 각도
  flip?: 'horizontal' | 'vertical';
  brightness?: number;            // -100 ~ 100
  contrast?: number;              // -100 ~ 100
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

### Task #2.2: Storage 상수 업데이트
- **파일**: `src/constants/storage.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 스크린샷
  SCREENSHOT_HISTORY: 'screenshot:history',
  SCREENSHOT_SETTINGS: 'screenshot:settings',
  SCREENSHOT_TEMP: 'screenshot:temp',
} as const;

export const STORAGE_LIMITS = {
  // ... 기존 제한

  SCREENSHOT_MAX_HISTORY: 10,
  SCREENSHOT_MAX_SIZE_MB: 5,      // 개별 이미지 최대 5MB
  SCREENSHOT_TOTAL_SIZE_MB: 50,   // 총 용량 최대 50MB
} as const;
```

### Task #2.3: 메시지 액션 업데이트
- **파일**: `src/constants/messages.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 스크린샷
  SCREENSHOT_CAPTURE: 'SCREENSHOT_CAPTURE',
  SCREENSHOT_SAVE: 'SCREENSHOT_SAVE',
  SCREENSHOT_DELETE: 'SCREENSHOT_DELETE',
  SCREENSHOT_AREA_SELECT_START: 'SCREENSHOT_AREA_SELECT_START',
  SCREENSHOT_AREA_SELECT_END: 'SCREENSHOT_AREA_SELECT_END',
  SCREENSHOT_ELEMENT_HIGHLIGHT: 'SCREENSHOT_ELEMENT_HIGHLIGHT',
  SCREENSHOT_ADD_ANNOTATION: 'SCREENSHOT_ADD_ANNOTATION',
  SCREENSHOT_UPDATE_ANNOTATION: 'SCREENSHOT_UPDATE_ANNOTATION',
  SCREENSHOT_DELETE_ANNOTATION: 'SCREENSHOT_DELETE_ANNOTATION',
} as const;
```

### Task #2.4: CSS 클래스 업데이트
- **파일**: `src/constants/classes.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
// ... 기존 클래스들

export const SCREENSHOT_CLASSES = {
  OVERLAY: 'klic-screenshot-overlay',
  SELECTION_BOX: 'klic-screenshot-selection',
  ELEMENT_HIGHLIGHT: 'klic-screenshot-highlight',
  CROSSHAIR: 'klic-screenshot-crosshair',
  TOOLBAR: 'klic-screenshot-toolbar',
  PREVIEW: 'klic-screenshot-preview',
} as const;
```

### Task #2.5: 에러 메시지 업데이트
- **파일**: `src/constants/errors.ts`
- **시간**: 10분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  SCREENSHOT: {
    CAPTURE_FAILED: '스크린샷 캡처에 실패했습니다',
    ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
    CLIPBOARD_DENIED: '클립보드 권한이 없습니다',
    SIZE_TOO_LARGE: '이미지 크기가 너무 큽니다 (최대 5MB)',
    STORAGE_FULL: '저장 공간이 부족합니다',
    INVALID_FORMAT: '지원하지 않는 이미지 포맷입니다',
    CANVAS_ERROR: '캔버스 생성에 실패했습니다',
    ANNOTATION_FAILED: '주석 추가에 실패했습니다',
  },
} as const;
```

### Task #2.6: 기본 설정 값
- **파일**: `src/constants/defaults.ts`
- **시간**: 15분
- **의존성**: Task #2.1
- **상세 내용**:
```typescript
import { ScreenshotSettings } from '../types/screenshot';

export const DEFAULT_SCREENSHOT_SETTINGS: ScreenshotSettings = {
  defaultFormat: 'png',
  quality: 0.92,
  captureMode: 'element',
  includeAnnotations: true,
  autoDownload: false,
  copyToClipboard: true,
  annotationDefaults: {
    color: '#ef4444',
    strokeWidth: 3,
    fontSize: 16,
  },
};

export const ANNOTATION_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#000000', // black
  '#ffffff', // white
] as const;

export const STROKE_WIDTHS = [1, 2, 3, 4, 5, 8, 10] as const;

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 32] as const;
```

---

## Phase 2: 캡처 유틸리티 (10개 태스크, 5시간)

### Task #2.7: html2canvas 통합
- **파일**: `src/utils/screenshot/html2canvas.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
import html2canvas from 'html2canvas';
import { CaptureOptions } from '../../types/screenshot';

/**
 * html2canvas로 요소 캡처
 */
export async function captureWithHtml2Canvas(
  element: HTMLElement,
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement> {
  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      imageTimeout: 15000,
      logging: false,
      scale: window.devicePixelRatio || 1,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (el) => {
        // 스크롤바 제외
        if (!options.includeScrollbars) {
          const style = window.getComputedStyle(el);
          if (style.overflow === 'scroll' || style.overflow === 'auto') {
            return false;
          }
        }
        return false;
      },
    });

    return canvas;
  } catch (error) {
    console.error('html2canvas capture failed:', error);
    throw new Error('캡처에 실패했습니다');
  }
}

/**
 * html2canvas 설정 최적화
 */
export function getOptimizedHtml2CanvasOptions(
  element: HTMLElement
): Partial<html2canvas.Options> {
  const rect = element.getBoundingClientRect();

  return {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    scale: Math.min(window.devicePixelRatio || 1, 2), // 최대 2배
    width: rect.width,
    height: rect.height,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
  };
}
```
- **완료 조건**: html2canvas 정상 동작

### Task #2.8: 요소 캡처
- **파일**: `src/utils/screenshot/captureElement.ts`
- **시간**: 45분
- **의존성**: Task #2.7
- **상세 내용**:
```typescript
import { captureWithHtml2Canvas } from './html2canvas';
import { CaptureOptions } from '../../types/screenshot';
import { KlicError, ERROR_MESSAGES } from '../../constants/errors';

/**
 * CSS 선택자로 요소 캡처
 */
export async function captureElementBySelector(
  selector: string,
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement> {
  const element = document.querySelector(selector) as HTMLElement;

  if (!element) {
    throw new KlicError(
      'ELEMENT_NOT_FOUND',
      ERROR_MESSAGES.SCREENSHOT.ELEMENT_NOT_FOUND
    );
  }

  return captureElement(element, options);
}

/**
 * 요소 직접 캡처
 */
export async function captureElement(
  element: HTMLElement,
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement> {
  // 요소가 보이는지 확인
  if (!isElementVisible(element)) {
    throw new KlicError(
      'ELEMENT_NOT_VISIBLE',
      '요소가 화면에 표시되지 않습니다'
    );
  }

  // 요소를 뷰포트로 스크롤
  scrollElementIntoView(element);

  // 지연 시간이 있으면 대기
  if (options.delay) {
    await new Promise(resolve => setTimeout(resolve, options.delay));
  }

  // 캡처
  try {
    const canvas = await captureWithHtml2Canvas(element, options);
    return canvas;
  } catch (error) {
    throw new KlicError(
      'CAPTURE_FAILED',
      ERROR_MESSAGES.SCREENSHOT.CAPTURE_FAILED,
      error
    );
  }
}

/**
 * 요소가 보이는지 확인
 */
function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

/**
 * 요소를 뷰포트로 스크롤
 */
function scrollElementIntoView(element: HTMLElement): void {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });
}

/**
 * 여러 요소 캡처
 */
export async function captureMultipleElements(
  selectors: string[],
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement[]> {
  const canvases: HTMLCanvasElement[] = [];

  for (const selector of selectors) {
    try {
      const canvas = await captureElementBySelector(selector, options);
      canvases.push(canvas);
    } catch (error) {
      console.error(`Failed to capture ${selector}:`, error);
    }
  }

  return canvases;
}
```
- **테스트 케이스**:
  - 단일 요소 캡처
  - 숨겨진 요소 에러 처리
  - 존재하지 않는 요소 에러 처리
  - 지연 시간 적용
- **완료 조건**: 모든 테스트 통과

### Task #2.9: 영역 캡처
- **파일**: `src/utils/screenshot/captureArea.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { CaptureOptions } from '../../types/screenshot';
import { KlicError, ERROR_MESSAGES } from '../../constants/errors';

/**
 * 지정된 영역 캡처
 */
export async function captureArea(
  area: { x: number; y: number; width: number; height: number },
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement> {
  // 영역 유효성 검사
  validateArea(area);

  // 전체 페이지 캡처
  const fullCanvas = await captureFullViewport();

  // 영역 크롭
  const croppedCanvas = cropCanvas(fullCanvas, area);

  return croppedCanvas;
}

/**
 * 뷰포트 캡처 (chrome.tabs API 사용)
 */
async function captureFullViewport(): Promise<HTMLCanvasElement> {
  try {
    // Background script에 캡처 요청
    const response = await chrome.runtime.sendMessage({
      action: 'CAPTURE_VIEWPORT',
    });

    if (!response.success || !response.dataUrl) {
      throw new Error('Viewport capture failed');
    }

    // dataUrl을 Canvas로 변환
    const canvas = await dataUrlToCanvas(response.dataUrl);
    return canvas;
  } catch (error) {
    throw new KlicError(
      'CAPTURE_FAILED',
      ERROR_MESSAGES.SCREENSHOT.CAPTURE_FAILED,
      error
    );
  }
}

/**
 * Canvas 크롭
 */
function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  area: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new KlicError('CANVAS_ERROR', ERROR_MESSAGES.SCREENSHOT.CANVAS_ERROR);
  }

  ctx.drawImage(
    sourceCanvas,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height
  );

  return canvas;
}

/**
 * dataUrl을 Canvas로 변환
 */
async function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * 영역 유효성 검사
 */
function validateArea(area: {
  x: number;
  y: number;
  width: number;
  height: number;
}): void {
  if (area.width <= 0 || area.height <= 0) {
    throw new KlicError('INVALID_AREA', '영역 크기가 유효하지 않습니다');
  }

  if (area.x < 0 || area.y < 0) {
    throw new KlicError('INVALID_AREA', '영역 위치가 유효하지 않습니다');
  }
}
```
- **완료 조건**: 영역 캡처 정상 동작

### Task #2.10: 전체 페이지 캡처 (스크롤)
- **파일**: `src/utils/screenshot/captureFullPage.ts`
- **시간**: 1시간
- **의존성**: Task #2.7
- **상세 내용**:
```typescript
import { captureWithHtml2Canvas } from './html2canvas';
import { mergeCanvases } from './canvasUtils';
import { CaptureOptions } from '../../types/screenshot';

/**
 * 전체 페이지 캡처 (스크롤 포함)
 */
export async function captureFullPage(
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement> {
  const originalScrollY = window.scrollY;
  const originalScrollX = window.scrollX;

  try {
    // 페이지 전체 높이
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    const fullWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth
    );

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // 스크롤 없이 캡처 가능하면 바로 캡처
    if (fullHeight <= viewportHeight) {
      window.scrollTo(0, 0);
      return captureWithHtml2Canvas(document.body, options);
    }

    // 여러 번 스크롤하며 캡처
    const canvases: HTMLCanvasElement[] = [];
    const scrollSteps = Math.ceil(fullHeight / viewportHeight);

    for (let i = 0; i < scrollSteps; i++) {
      const scrollY = i * viewportHeight;
      window.scrollTo(0, scrollY);

      // 스크롤 안정화 대기
      await wait(options.delay || 100);

      // 현재 뷰포트 캡처
      const canvas = await captureCurrentViewport();
      canvases.push(canvas);
    }

    // 모든 캔버스 병합
    const mergedCanvas = mergeCanvases(canvases, 'vertical');

    return mergedCanvas;
  } finally {
    // 원래 스크롤 위치로 복원
    window.scrollTo(originalScrollX, originalScrollY);
  }
}

/**
 * 현재 뷰포트 캡처
 */
async function captureCurrentViewport(): Promise<HTMLCanvasElement> {
  // chrome.tabs.captureVisibleTab 사용
  const response = await chrome.runtime.sendMessage({
    action: 'CAPTURE_VISIBLE_TAB',
  });

  if (!response.success || !response.dataUrl) {
    throw new Error('Failed to capture viewport');
  }

  return dataUrlToCanvas(response.dataUrl);
}

/**
 * dataUrl을 Canvas로 변환
 */
async function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => reject(new Error('Image load error'));
    img.src = dataUrl;
  });
}

/**
 * 대기 유틸리티
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 전체 페이지 캡처 (대안: 단일 캔버스)
 */
export async function captureFullPageSingle(
  options: Partial<CaptureOptions> = {}
): Promise<HTMLCanvasElement> {
  // body 전체를 한 번에 캡처
  const canvas = await captureWithHtml2Canvas(document.body, {
    ...options,
    windowHeight: document.body.scrollHeight,
  });

  return canvas;
}
```
- **완료 조건**: 긴 페이지 스크롤 캡처 성공

### Task #2.11: 캔버스 병합 유틸리티
- **파일**: `src/utils/screenshot/canvasUtils.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 여러 캔버스를 병합
 */
export function mergeCanvases(
  canvases: HTMLCanvasElement[],
  direction: 'horizontal' | 'vertical'
): HTMLCanvasElement {
  if (canvases.length === 0) {
    throw new Error('No canvases to merge');
  }

  if (canvases.length === 1) {
    return canvases[0];
  }

  const merged = document.createElement('canvas');
  const ctx = merged.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  if (direction === 'vertical') {
    // 세로로 병합
    const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
    const maxWidth = Math.max(...canvases.map(c => c.width));

    merged.width = maxWidth;
    merged.height = totalHeight;

    let currentY = 0;
    canvases.forEach(canvas => {
      ctx.drawImage(canvas, 0, currentY);
      currentY += canvas.height;
    });
  } else {
    // 가로로 병합
    const totalWidth = canvases.reduce((sum, c) => sum + c.width, 0);
    const maxHeight = Math.max(...canvases.map(c => c.height));

    merged.width = totalWidth;
    merged.height = maxHeight;

    let currentX = 0;
    canvases.forEach(canvas => {
      ctx.drawImage(canvas, currentX, 0);
      currentX += canvas.width;
    });
  }

  return merged;
}

/**
 * 캔버스 복제
 */
export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const clone = document.createElement('canvas');
  clone.width = source.width;
  clone.height = source.height;

  const ctx = clone.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(source, 0, 0);
  return clone;
}

/**
 * 캔버스를 이미지로 변환
 */
export function canvasToImage(canvas: HTMLCanvasElement): HTMLImageElement {
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

/**
 * 캔버스 크기 가져오기
 */
export function getCanvasSize(canvas: HTMLCanvasElement): {
  width: number;
  height: number;
  bytes: number;
} {
  const dataUrl = canvas.toDataURL();
  const bytes = Math.round((dataUrl.length * 3) / 4); // base64 디코딩 크기

  return {
    width: canvas.width,
    height: canvas.height,
    bytes,
  };
}
```
- **완료 조건**: 캔버스 병합 정상 동작

### Task #2.12: 이미지 포맷 변환
- **파일**: `src/utils/screenshot/formatConverter.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { ImageFormat } from '../../types/screenshot';
import { KlicError, ERROR_MESSAGES } from '../../constants/errors';

/**
 * Canvas를 지정된 포맷으로 변환
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'png',
  quality: number = 0.92
): string {
  const mimeType = getMimeType(format);

  if (format === 'png') {
    return canvas.toDataURL(mimeType);
  } else {
    return canvas.toDataURL(mimeType, quality);
  }
}

/**
 * Canvas를 Blob으로 변환
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'png',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(format);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      format !== 'png' ? quality : undefined
    );
  });
}

/**
 * DataUrl을 Blob으로 변환
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);

  if (!mimeMatch) {
    throw new Error('Invalid data URL');
  }

  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Blob을 DataUrl로 변환
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * MIME 타입 가져오기
 */
function getMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };

  return mimeTypes[format] || 'image/png';
}

/**
 * 파일 확장자 가져오기
 */
export function getFileExtension(format: ImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/**
 * DataUrl에서 포맷 추출
 */
export function getFormatFromDataUrl(dataUrl: string): ImageFormat {
  if (dataUrl.includes('image/png')) return 'png';
  if (dataUrl.includes('image/jpeg')) return 'jpeg';
  if (dataUrl.includes('image/webp')) return 'webp';
  return 'png';
}

/**
 * 이미지 크기 검증
 */
export function validateImageSize(
  dataUrl: string,
  maxSizeMB: number = 5
): boolean {
  const sizeBytes = Math.round((dataUrl.length * 3) / 4);
  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    throw new KlicError(
      'SIZE_TOO_LARGE',
      ERROR_MESSAGES.SCREENSHOT.SIZE_TOO_LARGE
    );
  }

  return true;
}
```
- **완료 조건**: 모든 포맷 변환 성공

### Task #2.13: 이미지 리사이즈
- **파일**: `src/utils/screenshot/imageResize.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Canvas 리사이즈
 */
export function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
  }
): HTMLCanvasElement {
  const { width, height, fit = 'contain' } = options;

  if (!width && !height) {
    return sourceCanvas;
  }

  const sourceWidth = sourceCanvas.width;
  const sourceHeight = sourceCanvas.height;
  const sourceAspect = sourceWidth / sourceHeight;

  let targetWidth: number;
  let targetHeight: number;

  if (fit === 'fill') {
    // 비율 무시하고 강제 크기
    targetWidth = width || sourceWidth;
    targetHeight = height || sourceHeight;
  } else {
    // 비율 유지
    if (width && height) {
      const targetAspect = width / height;

      if (fit === 'contain') {
        if (sourceAspect > targetAspect) {
          targetWidth = width;
          targetHeight = width / sourceAspect;
        } else {
          targetHeight = height;
          targetWidth = height * sourceAspect;
        }
      } else {
        // cover
        if (sourceAspect > targetAspect) {
          targetHeight = height;
          targetWidth = height * sourceAspect;
        } else {
          targetWidth = width;
          targetHeight = width / sourceAspect;
        }
      }
    } else if (width) {
      targetWidth = width;
      targetHeight = width / sourceAspect;
    } else {
      targetHeight = height!;
      targetWidth = height! * sourceAspect;
    }
  }

  // 새 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 고품질 리샘플링
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return canvas;
}

/**
 * 썸네일 생성
 */
export function createThumbnail(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number = 200,
  maxHeight: number = 150
): HTMLCanvasElement {
  return resizeCanvas(sourceCanvas, {
    width: maxWidth,
    height: maxHeight,
    fit: 'contain',
  });
}

/**
 * 최대 크기로 제한
 */
export function constrainSize(
  sourceCanvas: HTMLCanvasElement,
  maxWidth?: number,
  maxHeight?: number
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  let needsResize = false;
  let targetWidth = width;
  let targetHeight = height;

  if (maxWidth && width > maxWidth) {
    needsResize = true;
    targetWidth = maxWidth;
    targetHeight = (maxWidth / width) * height;
  }

  if (maxHeight && targetHeight > maxHeight) {
    needsResize = true;
    targetHeight = maxHeight;
    targetWidth = (maxHeight / height) * width;
  }

  if (!needsResize) {
    return sourceCanvas;
  }

  return resizeCanvas(sourceCanvas, {
    width: targetWidth,
    height: targetHeight,
    fit: 'contain',
  });
}
```
- **완료 조건**: 리사이즈 정상 동작

### Task #2.14: 이미지 크롭
- **파일**: `src/utils/screenshot/imageCrop.ts`
- **시간**: 20분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Canvas 크롭
 */
export function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): HTMLCanvasElement {
  const { x, y, width, height } = cropArea;

  // 유효성 검사
  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    throw new Error('Invalid crop area');
  }

  if (x + width > sourceCanvas.width || y + height > sourceCanvas.height) {
    throw new Error('Crop area exceeds canvas bounds');
  }

  // 새 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 크롭 영역 그리기
  ctx.drawImage(
    sourceCanvas,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return canvas;
}

/**
 * 자동 크롭 (여백 제거)
 */
export function autoCropCanvas(
  sourceCanvas: HTMLCanvasElement,
  tolerance: number = 0
): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let top = 0;
  let bottom = height;
  let left = 0;
  let right = width;

  // 상단 찾기
  for (let y = 0; y < height; y++) {
    if (hasContent(data, y, 0, width, 1, width, tolerance)) {
      top = y;
      break;
    }
  }

  // 하단 찾기
  for (let y = height - 1; y >= top; y--) {
    if (hasContent(data, y, 0, width, 1, width, tolerance)) {
      bottom = y + 1;
      break;
    }
  }

  // 좌측 찾기
  for (let x = 0; x < width; x++) {
    if (hasContent(data, 0, x, 1, height, width, tolerance)) {
      left = x;
      break;
    }
  }

  // 우측 찾기
  for (let x = width - 1; x >= left; x--) {
    if (hasContent(data, 0, x, 1, height, width, tolerance)) {
      right = x + 1;
      break;
    }
  }

  return cropCanvas(sourceCanvas, {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}

/**
 * 영역에 내용이 있는지 확인
 */
function hasContent(
  data: Uint8ClampedArray,
  startY: number,
  startX: number,
  width: number,
  height: number,
  rowWidth: number,
  tolerance: number
): boolean {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = ((startY + y) * rowWidth + (startX + x)) * 4;
      const alpha = data[i + 3];

      if (alpha > tolerance) {
        return true;
      }
    }
  }

  return false;
}
```
- **완료 조건**: 크롭 정상 동작

### Task #2.15: 클립보드 복사
- **파일**: `src/utils/screenshot/clipboard.ts`
- **시간**: 30분
- **의존성**: Task #2.12
- **상세 내용**:
```typescript
import { canvasToBlob } from './formatConverter';
import { ImageFormat } from '../../types/screenshot';
import { KlicError, ERROR_MESSAGES } from '../../constants/errors';

/**
 * Canvas를 클립보드에 복사
 */
export async function copyCanvasToClipboard(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'png'
): Promise<boolean> {
  try {
    // Clipboard API 지원 확인
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported');
    }

    // Canvas를 Blob으로 변환
    const blob = await canvasToBlob(canvas, format);

    // ClipboardItem 생성
    const item = new ClipboardItem({
      [blob.type]: blob,
    });

    // 클립보드에 쓰기
    await navigator.clipboard.write([item]);

    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new KlicError(
        'CLIPBOARD_DENIED',
        ERROR_MESSAGES.SCREENSHOT.CLIPBOARD_DENIED,
        error
      );
    }

    throw new KlicError(
      'CLIPBOARD_FAILED',
      '클립보드 복사에 실패했습니다',
      error
    );
  }
}

/**
 * DataUrl을 클립보드에 복사
 */
export async function copyDataUrlToClipboard(
  dataUrl: string
): Promise<boolean> {
  try {
    const blob = await fetch(dataUrl).then(r => r.blob());

    const item = new ClipboardItem({
      [blob.type]: blob,
    });

    await navigator.clipboard.write([item]);

    return true;
  } catch (error) {
    throw new KlicError(
      'CLIPBOARD_FAILED',
      '클립보드 복사에 실패했습니다',
      error
    );
  }
}

/**
 * 클립보드 권한 확인
 */
export async function checkClipboardPermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({
      name: 'clipboard-write' as PermissionName,
    });

    return result.state === 'granted' || result.state === 'prompt';
  } catch (error) {
    // 권한 API를 지원하지 않는 경우
    return true;
  }
}
```
- **완료 조건**: 클립보드 복사 성공

### Task #2.16: 이미지 다운로드
- **파일**: `src/utils/screenshot/download.ts`
- **시간**: 20분
- **의존성**: Task #2.12
- **상세 내용**:
```typescript
import { ImageFormat } from '../../types/screenshot';
import { getFileExtension } from './formatConverter';

/**
 * DataUrl 다운로드
 */
export function downloadDataUrl(
  dataUrl: string,
  filename: string,
  format: ImageFormat = 'png'
): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.${getFileExtension(format)}`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Canvas 다운로드
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: ImageFormat = 'png',
  quality: number = 0.92
): void {
  const mimeType = `image/${format}`;
  const dataUrl = canvas.toDataURL(mimeType, quality);

  downloadDataUrl(dataUrl, filename, format);
}

/**
 * 파일명 생성
 */
export function generateFilename(
  prefix: string = 'screenshot',
  includeTimestamp: boolean = true
): string {
  if (!includeTimestamp) {
    return prefix;
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);

  return `${prefix}_${timestamp}`;
}

/**
 * Blob 다운로드
 */
export function downloadBlob(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 메모리 해제
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
```
- **완료 조건**: 다운로드 정상 동작

---

## Phase 3: 주석 기능 (7개 태스크, 2.5시간)

### Task #2.17: Annotation 타입 및 유틸리티
- **파일**: `src/utils/screenshot/annotation/types.ts`
- **시간**: 15분
- **의존성**: Task #2.1
- **상세 내용**:
```typescript
import { Annotation, AnnotationTool } from '../../../types/screenshot';

/**
 * UUID 생성
 */
export function generateAnnotationId(): string {
  return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 기본 주석 객체 생성
 */
export function createAnnotation(
  type: AnnotationTool,
  data: any,
  color: string = '#ef4444',
  strokeWidth: number = 3
): Annotation {
  return {
    id: generateAnnotationId(),
    type,
    color,
    strokeWidth,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 주석 복제
 */
export function cloneAnnotation(annotation: Annotation): Annotation {
  return {
    ...annotation,
    id: generateAnnotationId(),
    timestamp: Date.now(),
  };
}
```

### Task #2.18: 화살표 주석
- **파일**: `src/utils/screenshot/annotation/arrow.ts`
- **시간**: 30분
- **의존성**: Task #2.17
- **상세 내용**:
```typescript
import { ArrowAnnotation } from '../../../types/screenshot';

/**
 * 화살표 그리기
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  annotation: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    headSize: number;
    color: string;
    strokeWidth: number;
  }
): void {
  const { startX, startY, endX, endY, headSize, color, strokeWidth } = annotation;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';

  // 선 그리기
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 화살촉 그리기
  const angle = Math.atan2(endY - startY, endX - startX);

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - Math.PI / 6),
    endY - headSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headSize * Math.cos(angle + Math.PI / 6),
    endY - headSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 화살표 주석 생성
 */
export function createArrowAnnotation(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  headSize: number = 10
): ArrowAnnotation {
  return {
    type: 'arrow',
    startX,
    startY,
    endX,
    endY,
    headSize,
  };
}
```

### Task #2.19: 텍스트 주석
- **파일**: `src/utils/screenshot/annotation/text.ts`
- **시간**: 30분
- **의존성**: Task #2.17
- **상세 내용**:
```typescript
import { TextAnnotation } from '../../../types/screenshot';

/**
 * 텍스트 그리기
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  annotation: {
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
  }
): void {
  const { x, y, text, fontSize, fontFamily, color, backgroundColor } = annotation;

  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  // 텍스트 크기 측정
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  // 배경 그리기
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      x - 4,
      y - 4,
      textWidth + 8,
      textHeight + 8
    );
  }

  // 텍스트 그리기
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * 텍스트 주석 생성
 */
export function createTextAnnotation(
  x: number,
  y: number,
  text: string,
  fontSize: number = 16,
  fontFamily: string = 'Arial',
  backgroundColor?: string
): TextAnnotation {
  return {
    type: 'text',
    x,
    y,
    text,
    fontSize,
    fontFamily,
    backgroundColor,
  };
}

/**
 * 여러 줄 텍스트 그리기
 */
export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  annotation: {
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    maxWidth?: number;
  }
): void {
  const { x, y, text, fontSize, fontFamily, color, backgroundColor, maxWidth } = annotation;

  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2;

  // 배경 그리기
  if (backgroundColor) {
    let maxLineWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    });

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      x - 4,
      y - 4,
      Math.min(maxLineWidth, maxWidth || Infinity) + 8,
      lines.length * lineHeight + 8
    );
  }

  // 텍스트 그리기
  ctx.fillStyle = color;
  lines.forEach((line, index) => {
    if (maxWidth) {
      const words = line.split(' ');
      let currentLine = '';
      let currentY = y + index * lineHeight;

      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine !== '') {
          ctx.fillText(currentLine, x, currentY);
          currentLine = word + ' ';
          currentY += lineHeight;
        } else {
          currentLine = testLine;
        }
      });

      ctx.fillText(currentLine, x, currentY);
    } else {
      ctx.fillText(line, x, y + index * lineHeight);
    }
  });

  ctx.restore();
}
```

### Task #2.20: 도형 주석 (사각형, 원)
- **파일**: `src/utils/screenshot/annotation/shape.ts`
- **시간**: 30분
- **의존성**: Task #2.17
- **상세 내용**:
```typescript
import { ShapeAnnotation } from '../../../types/screenshot';

/**
 * 사각형 그리기
 */
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  annotation: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    strokeWidth: number;
    filled: boolean;
    opacity?: number;
  }
): void {
  const { x, y, width, height, color, strokeWidth, filled, opacity = 1 } = annotation;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (filled) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
}

/**
 * 원 그리기
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  annotation: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    strokeWidth: number;
    filled: boolean;
    opacity?: number;
  }
): void {
  const { x, y, width, height, color, strokeWidth, filled, opacity = 1 } = annotation;

  const radiusX = width / 2;
  const radiusY = height / 2;
  const centerX = x + radiusX;
  const centerY = y + radiusY;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 하이라이트 그리기 (반투명 사각형)
 */
export function drawHighlight(
  ctx: CanvasRenderingContext2D,
  annotation: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }
): void {
  drawRectangle(ctx, {
    ...annotation,
    strokeWidth: 0,
    filled: true,
    opacity: 0.3,
  });
}

/**
 * 도형 주석 생성
 */
export function createShapeAnnotation(
  type: 'rectangle' | 'circle' | 'highlight',
  x: number,
  y: number,
  width: number,
  height: number,
  filled: boolean = false,
  opacity?: number
): ShapeAnnotation {
  return {
    type,
    x,
    y,
    width,
    height,
    filled,
    opacity,
  };
}
```

### Task #2.21: 펜 주석 (자유 그리기)
- **파일**: `src/utils/screenshot/annotation/pen.ts`
- **시간**: 30분
- **의존성**: Task #2.17
- **상세 내용**:
```typescript
import { PenAnnotation } from '../../../types/screenshot';

/**
 * 펜 그리기
 */
export function drawPen(
  ctx: CanvasRenderingContext2D,
  annotation: {
    points: Array<{ x: number; y: number }>;
    color: string;
    strokeWidth: number;
    smoothing?: boolean;
  }
): void {
  const { points, color, strokeWidth, smoothing } = annotation;

  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (smoothing) {
    drawSmoothPen(ctx, points);
  } else {
    drawRawPen(ctx, points);
  }

  ctx.restore();
}

/**
 * 일반 펜 그리기
 */
function drawRawPen(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

/**
 * 스무딩 펜 그리기 (Bezier curve)
 */
function drawSmoothPen(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
): void {
  if (points.length < 3) {
    drawRawPen(ctx, points);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 2; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // 마지막 두 점
  const lastIndex = points.length - 1;
  ctx.quadraticCurveTo(
    points[lastIndex - 1].x,
    points[lastIndex - 1].y,
    points[lastIndex].x,
    points[lastIndex].y
  );

  ctx.stroke();
}

/**
 * 펜 주석 생성
 */
export function createPenAnnotation(
  points: Array<{ x: number; y: number }>,
  smoothing: boolean = true
): PenAnnotation {
  return {
    type: 'pen',
    points,
    smoothing,
  };
}

/**
 * 점 단순화 (Douglas-Peucker 알고리즘)
 */
export function simplifyPoints(
  points: Array<{ x: number; y: number }>,
  tolerance: number = 2
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  return douglasPeucker(points, sqTolerance);
}

function douglasPeucker(
  points: Array<{ x: number; y: number }>,
  sqTolerance: number
): Array<{ x: number; y: number }> {
  const last = points.length - 1;
  const simplified: Array<{ x: number; y: number }> = [points[0]];

  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

function simplifyDPStep(
  points: Array<{ x: number; y: number }>,
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Array<{ x: number; y: number }>
): void {
  let maxSqDist = sqTolerance;
  let index = 0;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) {
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    }
    simplified.push(points[index]);
    if (last - index > 1) {
      simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }
}

function getSqSegDist(
  p: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
}
```

### Task #2.22: 주석 편집 유틸리티
- **파일**: `src/utils/screenshot/annotation/editor.ts`
- **시간**: 20분
- **의존성**: Task #2.17-#2.21
- **상세 내용**:
```typescript
import { Annotation } from '../../../types/screenshot';

/**
 * 주석 위치 이동
 */
export function moveAnnotation(
  annotation: Annotation,
  deltaX: number,
  deltaY: number
): Annotation {
  const data = { ...annotation.data };

  switch (annotation.type) {
    case 'arrow':
      data.startX += deltaX;
      data.startY += deltaY;
      data.endX += deltaX;
      data.endY += deltaY;
      break;

    case 'text':
      data.x += deltaX;
      data.y += deltaY;
      break;

    case 'rectangle':
    case 'circle':
    case 'highlight':
      data.x += deltaX;
      data.y += deltaY;
      break;

    case 'pen':
      data.points = data.points.map((p: { x: number; y: number }) => ({
        x: p.x + deltaX,
        y: p.y + deltaY,
      }));
      break;
  }

  return {
    ...annotation,
    data,
  };
}

/**
 * 주석 색상 변경
 */
export function changeAnnotationColor(
  annotation: Annotation,
  color: string
): Annotation {
  return {
    ...annotation,
    color,
  };
}

/**
 * 주석 선 두께 변경
 */
export function changeAnnotationStrokeWidth(
  annotation: Annotation,
  strokeWidth: number
): Annotation {
  return {
    ...annotation,
    strokeWidth,
  };
}

/**
 * 주석 삭제
 */
export function deleteAnnotation(
  annotations: Annotation[],
  annotationId: string
): Annotation[] {
  return annotations.filter(a => a.id !== annotationId);
}
```

### Task #2.23: 주석 렌더링
- **파일**: `src/utils/screenshot/annotation/renderer.ts`
- **시간**: 30분
- **의존성**: Task #2.18-#2.21
- **상세 내용**:
```typescript
import { Annotation } from '../../../types/screenshot';
import { drawArrow } from './arrow';
import { drawText, drawMultilineText } from './text';
import { drawRectangle, drawCircle, drawHighlight } from './shape';
import { drawPen } from './pen';

/**
 * 모든 주석 렌더링
 */
export function renderAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[]
): void {
  annotations.forEach(annotation => {
    renderAnnotation(ctx, annotation);
  });
}

/**
 * 단일 주석 렌더링
 */
export function renderAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation
): void {
  const { type, color, strokeWidth, data } = annotation;

  switch (type) {
    case 'arrow':
      drawArrow(ctx, {
        ...data,
        color,
        strokeWidth,
      });
      break;

    case 'text':
      if (data.text.includes('\n')) {
        drawMultilineText(ctx, {
          ...data,
          color,
        });
      } else {
        drawText(ctx, {
          ...data,
          color,
        });
      }
      break;

    case 'rectangle':
      drawRectangle(ctx, {
        ...data,
        color,
        strokeWidth,
      });
      break;

    case 'circle':
      drawCircle(ctx, {
        ...data,
        color,
        strokeWidth,
      });
      break;

    case 'highlight':
      drawHighlight(ctx, {
        ...data,
        color,
      });
      break;

    case 'pen':
      drawPen(ctx, {
        ...data,
        color,
        strokeWidth,
      });
      break;
  }
}

/**
 * 주석이 포함된 Canvas 생성
 */
export function createAnnotatedCanvas(
  sourceCanvas: HTMLCanvasElement,
  annotations: Annotation[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 원본 이미지 그리기
  ctx.drawImage(sourceCanvas, 0, 0);

  // 주석 렌더링
  renderAnnotations(ctx, annotations);

  return canvas;
}
```

---

## Phase 4: Storage (3개 태스크, 1.5시간)

### Task #2.24: Storage 훅
- **파일**: `src/hooks/screenshot/useScreenshotStorage.ts`
- **시간**: 45분
- **의존성**: Task #2.1, #2.2
- **상세 내용**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { Screenshot, ScreenshotSettings } from '../../types/screenshot';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { DEFAULT_SCREENSHOT_SETTINGS } from '../../constants/defaults';

export function useScreenshotStorage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [settings, setSettings] = useState<ScreenshotSettings>(DEFAULT_SCREENSHOT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.SCREENSHOT_HISTORY,
        STORAGE_KEYS.SCREENSHOT_SETTINGS,
      ]);

      if (result[STORAGE_KEYS.SCREENSHOT_HISTORY]) {
        setScreenshots(result[STORAGE_KEYS.SCREENSHOT_HISTORY].screenshots || []);
      }

      if (result[STORAGE_KEYS.SCREENSHOT_SETTINGS]) {
        setSettings(result[STORAGE_KEYS.SCREENSHOT_SETTINGS]);
      }
    } catch (error) {
      console.error('Failed to load screenshot data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 스크린샷 저장
   */
  const saveScreenshot = useCallback(async (screenshot: Screenshot): Promise<boolean> => {
    try {
      const newScreenshots = [screenshot, ...screenshots];

      // 최대 개수 제한
      if (newScreenshots.length > STORAGE_LIMITS.SCREENSHOT_MAX_HISTORY) {
        newScreenshots.splice(STORAGE_LIMITS.SCREENSHOT_MAX_HISTORY);
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.SCREENSHOT_HISTORY]: {
          screenshots: newScreenshots,
          maxSize: STORAGE_LIMITS.SCREENSHOT_MAX_HISTORY,
          totalCaptures: screenshots.length + 1,
          lastCaptureTime: Date.now(),
          totalSize: calculateTotalSize(newScreenshots),
        },
      });

      setScreenshots(newScreenshots);
      return true;
    } catch (error) {
      console.error('Failed to save screenshot:', error);
      return false;
    }
  }, [screenshots]);

  /**
   * 스크린샷 삭제
   */
  const deleteScreenshot = useCallback(async (id: string): Promise<boolean> => {
    try {
      const newScreenshots = screenshots.filter(s => s.id !== id);

      await chrome.storage.local.set({
        [STORAGE_KEYS.SCREENSHOT_HISTORY]: {
          screenshots: newScreenshots,
          maxSize: STORAGE_LIMITS.SCREENSHOT_MAX_HISTORY,
          totalCaptures: screenshots.length,
          lastCaptureTime: Date.now(),
          totalSize: calculateTotalSize(newScreenshots),
        },
      });

      setScreenshots(newScreenshots);
      return true;
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      return false;
    }
  }, [screenshots]);

  /**
   * 모든 스크린샷 삭제
   */
  const deleteAllScreenshots = useCallback(async (): Promise<boolean> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SCREENSHOT_HISTORY]: {
          screenshots: [],
          maxSize: STORAGE_LIMITS.SCREENSHOT_MAX_HISTORY,
          totalCaptures: 0,
          lastCaptureTime: 0,
          totalSize: 0,
        },
      });

      setScreenshots([]);
      return true;
    } catch (error) {
      console.error('Failed to delete all screenshots:', error);
      return false;
    }
  }, []);

  /**
   * 설정 업데이트
   */
  const updateSettings = useCallback(async (
    newSettings: Partial<ScreenshotSettings>
  ): Promise<boolean> => {
    try {
      const updated = {
        ...settings,
        ...newSettings,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.SCREENSHOT_SETTINGS]: updated,
      });

      setSettings(updated);
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  }, [settings]);

  return {
    screenshots,
    settings,
    isLoading,
    saveScreenshot,
    deleteScreenshot,
    deleteAllScreenshots,
    updateSettings,
  };
}

/**
 * 총 용량 계산
 */
function calculateTotalSize(screenshots: Screenshot[]): number {
  return screenshots.reduce((sum, s) => sum + s.image.size, 0);
}
```
- **완료 조건**: CRUD 동작 정상

### Task #2.25: 히스토리 관리 훅
- **파일**: `src/hooks/screenshot/useScreenshotHistory.ts`
- **시간**: 30분
- **의존성**: Task #2.24
- **상세 내용**:
```typescript
import { useMemo } from 'react';
import { useScreenshotStorage } from './useScreenshotStorage';
import { Screenshot } from '../../types/screenshot';

export function useScreenshotHistory() {
  const { screenshots, deleteScreenshot, deleteAllScreenshots } = useScreenshotStorage();

  /**
   * 최근 스크린샷 가져오기
   */
  const getRecentScreenshots = useMemo(() => {
    return (count: number = 5): Screenshot[] => {
      return screenshots.slice(0, count);
    };
  }, [screenshots]);

  /**
   * URL별 그룹화
   */
  const groupedByUrl = useMemo(() => {
    const groups: Record<string, Screenshot[]> = {};

    screenshots.forEach(screenshot => {
      const url = screenshot.url;
      if (!groups[url]) {
        groups[url] = [];
      }
      groups[url].push(screenshot);
    });

    return groups;
  }, [screenshots]);

  /**
   * 날짜별 그룹화
   */
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Screenshot[]> = {};

    screenshots.forEach(screenshot => {
      const date = new Date(screenshot.timestamp);
      const dateKey = date.toISOString().split('T')[0];

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(screenshot);
    });

    return groups;
  }, [screenshots]);

  /**
   * 검색
   */
  const searchScreenshots = useMemo(() => {
    return (query: string): Screenshot[] => {
      const lowerQuery = query.toLowerCase();

      return screenshots.filter(screenshot => {
        return (
          screenshot.title.toLowerCase().includes(lowerQuery) ||
          screenshot.url.toLowerCase().includes(lowerQuery)
        );
      });
    };
  }, [screenshots]);

  return {
    screenshots,
    getRecentScreenshots,
    groupedByUrl,
    groupedByDate,
    searchScreenshots,
    deleteScreenshot,
    deleteAllScreenshots,
  };
}
```
- **완료 조건**: 히스토리 조회 기능 정상 동작

### Task #2.26: 썸네일 생성 훅
- **파일**: `src/hooks/screenshot/useThumbnail.ts`
- **시간**: 15분
- **의존성**: Task #2.13
- **상세 내용**:
```typescript
import { useCallback } from 'react';
import { createThumbnail } from '../../utils/screenshot/imageResize';
import { canvasToDataUrl } from '../../utils/screenshot/formatConverter';

export function useThumbnail() {
  /**
   * Canvas에서 썸네일 생성
   */
  const generateThumbnail = useCallback(
    async (
      canvas: HTMLCanvasElement,
      maxWidth: number = 200,
      maxHeight: number = 150
    ): Promise<{ dataUrl: string; width: number; height: number }> => {
      const thumbnailCanvas = createThumbnail(canvas, maxWidth, maxHeight);
      const dataUrl = canvasToDataUrl(thumbnailCanvas, 'jpeg', 0.8);

      return {
        dataUrl,
        width: thumbnailCanvas.width,
        height: thumbnailCanvas.height,
      };
    },
    []
  );

  /**
   * DataUrl에서 썸네일 생성
   */
  const generateThumbnailFromDataUrl = useCallback(
    async (
      dataUrl: string,
      maxWidth: number = 200,
      maxHeight: number = 150
    ): Promise<{ dataUrl: string; width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context error'));
            return;
          }

          ctx.drawImage(img, 0, 0);

          generateThumbnail(canvas, maxWidth, maxHeight)
            .then(resolve)
            .catch(reject);
        };

        img.onerror = () => reject(new Error('Image load error'));
        img.src = dataUrl;
      });
    },
    [generateThumbnail]
  );

  return {
    generateThumbnail,
    generateThumbnailFromDataUrl,
  };
}
```
- **완료 조건**: 썸네일 생성 정상 동작

---

## Phase 5: React 컴포넌트 (5개 태스크, 2.5시간)

### Task #2.27: ScreenshotPanel 메인 컴포넌트
- **파일**: `src/sidepanel/components/Screenshot/ScreenshotPanel.tsx`
- **시간**: 45분
- **의존성**: Task #2.24
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { useScreenshotStorage } from '../../../hooks/screenshot/useScreenshotStorage';
import { CaptureModeSwitcher } from './CaptureModeSwitcher';
import { FormatSelector } from './FormatSelector';
import { ScreenshotPreview } from './ScreenshotPreview';
import { ScreenshotToolbar } from './ScreenshotToolbar';
import { CaptureMode, ImageFormat } from '../../../types/screenshot';

export function ScreenshotPanel() {
  const { settings, updateSettings, saveScreenshot } = useScreenshotStorage();
  const [captureMode, setCaptureMode] = useState<CaptureMode>(settings.captureMode);
  const [format, setFormat] = useState<ImageFormat>(settings.defaultFormat);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  /**
   * 캡처 시작
   */
  const handleCapture = async () => {
    try {
      setIsCapturing(true);

      // Content script에 캡처 요청
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'SCREENSHOT_CAPTURE',
          data: {
            mode: captureMode,
            format,
            quality: settings.quality,
          },
        });

        if (response.success && response.dataUrl) {
          setPreviewDataUrl(response.dataUrl);
        }
      }
    } catch (error) {
      console.error('Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * 저장
   */
  const handleSave = async (dataUrl: string, annotations: any[]) => {
    const screenshot = {
      id: `screenshot_${Date.now()}`,
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      image: {
        dataUrl,
        format,
        width: 0, // 실제 크기는 이미지 로드 후 계산
        height: 0,
        size: Math.round((dataUrl.length * 3) / 4),
      },
      captureMode,
      annotations,
    };

    await saveScreenshot(screenshot);
    setPreviewDataUrl(null);
  };

  /**
   * 취소
   */
  const handleCancel = () => {
    setPreviewDataUrl(null);
  };

  return (
    <div className="screenshot-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>스크린샷</h2>
      </div>

      {previewDataUrl ? (
        /* 미리보기 및 주석 */
        <ScreenshotPreview
          dataUrl={previewDataUrl}
          onSave={handleSave}
          onCancel={handleCancel}
          settings={settings}
        />
      ) : (
        /* 캡처 설정 */
        <div className="capture-settings">
          {/* 캡처 모드 */}
          <CaptureModeSwitcher
            mode={captureMode}
            onChange={setCaptureMode}
          />

          {/* 포맷 선택 */}
          <FormatSelector
            format={format}
            quality={settings.quality}
            onChange={setFormat}
            onQualityChange={(q) => updateSettings({ quality: q })}
          />

          {/* 툴바 */}
          <ScreenshotToolbar
            isCapturing={isCapturing}
            onCapture={handleCapture}
            settings={settings}
            onSettingsChange={updateSettings}
          />
        </div>
      )}
    </div>
  );
}
```
- **테스트 케이스**:
  - 캡처 모드 전환
  - 포맷 변경
  - 캡처 시작/취소
  - 미리보기 표시
- **완료 조건**: 모든 UI 동작 정상

### Task #2.28: CaptureModeSwitcher 컴포넌트
- **파일**: `src/sidepanel/components/Screenshot/CaptureModeSwitcher.tsx`
- **시간**: 30분
- **의존성**: Task #2.1
- **상세 내용**:
```typescript
import React from 'react';
import { CaptureMode } from '../../../types/screenshot';

interface CaptureModeSwitcherProps {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
}

const MODES: Array<{
  value: CaptureMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'element',
    label: '요소',
    description: '특정 요소를 클릭하여 캡처',
    icon: '🎯',
  },
  {
    value: 'area',
    label: '영역',
    description: '마우스 드래그로 영역 선택',
    icon: '📐',
  },
  {
    value: 'viewport',
    label: '뷰포트',
    description: '현재 보이는 화면만 캡처',
    icon: '🖼️',
  },
  {
    value: 'fullPage',
    label: '전체 페이지',
    description: '스크롤 포함 전체 페이지 캡처',
    icon: '📄',
  },
];

export function CaptureModeSwitcher({ mode, onChange }: CaptureModeSwitcherProps) {
  return (
    <div className="capture-mode-switcher">
      <label className="section-label">캡처 모드</label>

      <div className="mode-grid">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`mode-button ${mode === m.value ? 'active' : ''}`}
          >
            <span className="mode-icon">{m.icon}</span>
            <span className="mode-label">{m.label}</span>
            <span className="mode-description">{m.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```
- **완료 조건**: 모드 전환 정상 동작

### Task #2.29: FormatSelector 컴포넌트
- **파일**: `src/sidepanel/components/Screenshot/FormatSelector.tsx`
- **시간**: 20분
- **의존성**: Task #2.1
- **상세 내용**:
```typescript
import React from 'react';
import { ImageFormat } from '../../../types/screenshot';

interface FormatSelectorProps {
  format: ImageFormat;
  quality: number;
  onChange: (format: ImageFormat) => void;
  onQualityChange: (quality: number) => void;
}

const FORMATS: Array<{
  value: ImageFormat;
  label: string;
  description: string;
}> = [
  { value: 'png', label: 'PNG', description: '무손실, 투명 배경 지원' },
  { value: 'jpeg', label: 'JPEG', description: '작은 용량, 품질 조절 가능' },
  { value: 'webp', label: 'WebP', description: '최적 압축, 최신 포맷' },
];

export function FormatSelector({
  format,
  quality,
  onChange,
  onQualityChange,
}: FormatSelectorProps) {
  const showQuality = format === 'jpeg' || format === 'webp';

  return (
    <div className="format-selector">
      <label className="section-label">이미지 포맷</label>

      <div className="format-buttons">
        {FORMATS.map((f) => (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={`format-button ${format === f.value ? 'active' : ''}`}
            title={f.description}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showQuality && (
        <div className="quality-slider">
          <label>
            품질: {Math.round(quality * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={quality}
              onChange={(e) => onQualityChange(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: 포맷 및 품질 선택 정상 동작

### Task #2.30: ScreenshotPreview 컴포넌트
- **파일**: `src/sidepanel/components/Screenshot/ScreenshotPreview.tsx`
- **시간**: 45분
- **의존성**: Task #2.23
- **상세 내용**:
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Annotation, AnnotationTool, ScreenshotSettings } from '../../../types/screenshot';
import { renderAnnotations } from '../../../utils/screenshot/annotation/renderer';
import { createAnnotation } from '../../../utils/screenshot/annotation/types';
import { ANNOTATION_COLORS, STROKE_WIDTHS } from '../../../constants/defaults';

interface ScreenshotPreviewProps {
  dataUrl: string;
  onSave: (dataUrl: string, annotations: Annotation[]) => void;
  onCancel: () => void;
  settings: ScreenshotSettings;
}

export function ScreenshotPreview({
  dataUrl,
  onSave,
  onCancel,
  settings,
}: ScreenshotPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('arrow');
  const [currentColor, setCurrentColor] = useState(settings.annotationDefaults.color);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(
    settings.annotationDefaults.strokeWidth
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  /**
   * 이미지 로드 및 Canvas 초기화
   */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }, [dataUrl]);

  /**
   * 주석 렌더링
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 이미지 다시 그리기
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // 주석 렌더링
      renderAnnotations(ctx, annotations);
    };
    img.src = dataUrl;
  }, [annotations, dataUrl]);

  /**
   * 마우스 다운
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  /**
   * 마우스 업
   */
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // 주석 생성
    let annotationData: any;

    switch (currentTool) {
      case 'arrow':
        annotationData = {
          type: 'arrow',
          startX: startPos.x,
          startY: startPos.y,
          endX,
          endY,
          headSize: 10,
        };
        break;

      case 'rectangle':
        annotationData = {
          type: 'rectangle',
          x: Math.min(startPos.x, endX),
          y: Math.min(startPos.y, endY),
          width: Math.abs(endX - startPos.x),
          height: Math.abs(endY - startPos.y),
          filled: false,
        };
        break;

      // ... 다른 도구들
    }

    if (annotationData) {
      const annotation = createAnnotation(
        currentTool,
        annotationData,
        currentColor,
        currentStrokeWidth
      );
      setAnnotations([...annotations, annotation]);
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  /**
   * 저장
   */
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const finalDataUrl = canvas.toDataURL('image/png');
    onSave(finalDataUrl, annotations);
  };

  /**
   * 주석 실행 취소
   */
  const handleUndoAnnotation = () => {
    if (annotations.length > 0) {
      setAnnotations(annotations.slice(0, -1));
    }
  };

  return (
    <div className="screenshot-preview">
      {/* 툴바 */}
      <div className="preview-toolbar">
        {/* 도구 선택 */}
        <div className="tool-buttons">
          {(['arrow', 'text', 'rectangle', 'circle', 'pen'] as AnnotationTool[]).map(
            (tool) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool)}
                className={`tool-button ${currentTool === tool ? 'active' : ''}`}
              >
                {tool}
              </button>
            )
          )}
        </div>

        {/* 색상 선택 */}
        <div className="color-picker">
          {ANNOTATION_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`color-button ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* 선 두께 */}
        <div className="stroke-width">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={width}
              onClick={() => setCurrentStrokeWidth(width)}
              className={`stroke-button ${currentStrokeWidth === width ? 'active' : ''}`}
            >
              {width}
            </button>
          ))}
        </div>

        {/* 실행 취소 */}
        <button onClick={handleUndoAnnotation} disabled={annotations.length === 0}>
          실행 취소
        </button>
      </div>

      {/* Canvas */}
      <div className="preview-canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="preview-canvas"
        />
      </div>

      {/* 액션 버튼 */}
      <div className="preview-actions">
        <button onClick={onCancel} className="cancel-button">
          취소
        </button>
        <button onClick={handleSave} className="save-button">
          저장
        </button>
      </div>
    </div>
  );
}
```
- **완료 조건**: 주석 추가 및 저장 정상 동작

### Task #2.31: ScreenshotToolbar 컴포넌트
- **파일**: `src/sidepanel/components/Screenshot/ScreenshotToolbar.tsx`
- **시간**: 30분
- **의존성**: Task #2.1
- **상세 내용**:
```typescript
import React from 'react';
import { ScreenshotSettings } from '../../../types/screenshot';

interface ScreenshotToolbarProps {
  isCapturing: boolean;
  onCapture: () => void;
  settings: ScreenshotSettings;
  onSettingsChange: (settings: Partial<ScreenshotSettings>) => void;
}

export function ScreenshotToolbar({
  isCapturing,
  onCapture,
  settings,
  onSettingsChange,
}: ScreenshotToolbarProps) {
  return (
    <div className="screenshot-toolbar">
      {/* 캡처 버튼 */}
      <button
        onClick={onCapture}
        disabled={isCapturing}
        className="capture-button primary"
      >
        {isCapturing ? '캡처 중...' : '캡처 시작'}
      </button>

      {/* 옵션 */}
      <div className="toolbar-options">
        <label className="option-item">
          <input
            type="checkbox"
            checked={settings.copyToClipboard}
            onChange={(e) =>
              onSettingsChange({ copyToClipboard: e.target.checked })
            }
          />
          클립보드에 복사
        </label>

        <label className="option-item">
          <input
            type="checkbox"
            checked={settings.autoDownload}
            onChange={(e) =>
              onSettingsChange({ autoDownload: e.target.checked })
            }
          />
          자동 다운로드
        </label>

        <label className="option-item">
          <input
            type="checkbox"
            checked={settings.includeAnnotations}
            onChange={(e) =>
              onSettingsChange({ includeAnnotations: e.target.checked })
            }
          />
          주석 포함
        </label>
      </div>

      {/* 크기 제한 */}
      <div className="size-constraints">
        <label>
          최대 너비 (px):
          <input
            type="number"
            value={settings.maxWidth || ''}
            onChange={(e) =>
              onSettingsChange({
                maxWidth: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="제한 없음"
          />
        </label>

        <label>
          최대 높이 (px):
          <input
            type="number"
            value={settings.maxHeight || ''}
            onChange={(e) =>
              onSettingsChange({
                maxHeight: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="제한 없음"
          />
        </label>
      </div>
    </div>
  );
}
```
- **완료 조건**: 설정 변경 정상 동작

---

## Phase 6: Content Script (3개 태스크, 1.5시간)

### Task #2.32: 영역 선택 오버레이
- **파일**: `src/content/screenshot/areaSelector.ts`
- **시간**: 45분
- **의존성**: Task #2.4
- **상세 내용**:
```typescript
import { SCREENSHOT_CLASSES } from '../../constants/classes';

let overlay: HTMLDivElement | null = null;
let selectionBox: HTMLDivElement | null = null;
let startPos: { x: number; y: number } | null = null;
let isSelecting = false;

/**
 * 영역 선택 시작
 */
export function startAreaSelection(
  onComplete: (area: { x: number; y: number; width: number; height: number }) => void
): void {
  // 오버레이 생성
  createOverlay();

  // 이벤트 리스너 등록
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // 완료 콜백 저장
  (window as any).__areaSelectionCallback = onComplete;
}

/**
 * 영역 선택 종료
 */
export function endAreaSelection(): void {
  // 이벤트 리스너 제거
  document.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  // 오버레이 제거
  removeOverlay();

  // 콜백 제거
  delete (window as any).__areaSelectionCallback;
}

/**
 * 오버레이 생성
 */
function createOverlay(): void {
  // 오버레이
  overlay = document.createElement('div');
  overlay.className = SCREENSHOT_CLASSES.OVERLAY;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
  `;

  // 선택 박스
  selectionBox = document.createElement('div');
  selectionBox.className = SCREENSHOT_CLASSES.SELECTION_BOX;
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    display: none;
    z-index: 1000000;
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(selectionBox);
}

/**
 * 오버레이 제거
 */
function removeOverlay(): void {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
}

/**
 * 마우스 다운
 */
function handleMouseDown(e: MouseEvent): void {
  if (!overlay) return;

  e.preventDefault();
  e.stopPropagation();

  isSelecting = true;
  startPos = { x: e.clientX, y: e.clientY };

  if (selectionBox) {
    selectionBox.style.display = 'block';
    selectionBox.style.left = `${e.clientX}px`;
    selectionBox.style.top = `${e.clientY}px`;
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
  }
}

/**
 * 마우스 이동
 */
function handleMouseMove(e: MouseEvent): void {
  if (!isSelecting || !startPos || !selectionBox) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const x = Math.min(startPos.x, currentX);
  const y = Math.min(startPos.y, currentY);
  const width = Math.abs(currentX - startPos.x);
  const height = Math.abs(currentY - startPos.y);

  selectionBox.style.left = `${x}px`;
  selectionBox.style.top = `${y}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
}

/**
 * 마우스 업
 */
function handleMouseUp(e: MouseEvent): void {
  if (!isSelecting || !startPos) return;

  e.preventDefault();
  e.stopPropagation();

  const currentX = e.clientX;
  const currentY = e.clientY;

  const x = Math.min(startPos.x, currentX);
  const y = Math.min(startPos.y, currentY);
  const width = Math.abs(currentX - startPos.x);
  const height = Math.abs(currentY - startPos.y);

  // 최소 크기 검증
  if (width > 10 && height > 10) {
    const callback = (window as any).__areaSelectionCallback;
    if (callback) {
      callback({ x, y, width, height });
    }
  }

  // 정리
  isSelecting = false;
  startPos = null;
  endAreaSelection();
}
```
- **완료 조건**: 영역 선택 정상 동작

### Task #2.33: 요소 하이라이트
- **파일**: `src/content/screenshot/elementHighlighter.ts`
- **시간**: 30분
- **의존성**: Task #2.4
- **상세 내용**:
```typescript
import { SCREENSHOT_CLASSES } from '../../constants/classes';

let highlightOverlay: HTMLDivElement | null = null;
let currentElement: HTMLElement | null = null;

/**
 * 요소 하이라이트 시작
 */
export function startElementHighlight(
  onSelect: (element: HTMLElement) => void
): void {
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);

  (window as any).__elementSelectCallback = onSelect;
}

/**
 * 요소 하이라이트 종료
 */
export function endElementHighlight(): void {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);

  removeHighlight();
  delete (window as any).__elementSelectCallback;
}

/**
 * 마우스 이동
 */
function handleMouseMove(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  if (target === currentElement) return;

  currentElement = target;
  showHighlight(target);
}

/**
 * 클릭
 */
function handleClick(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  const callback = (window as any).__elementSelectCallback;

  if (callback) {
    callback(target);
  }

  endElementHighlight();
}

/**
 * 하이라이트 표시
 */
function showHighlight(element: HTMLElement): void {
  if (!highlightOverlay) {
    highlightOverlay = document.createElement('div');
    highlightOverlay.className = SCREENSHOT_CLASSES.ELEMENT_HIGHLIGHT;
    highlightOverlay.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 999998;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(highlightOverlay);
  }

  const rect = element.getBoundingClientRect();

  highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
  highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
}

/**
 * 하이라이트 제거
 */
function removeHighlight(): void {
  if (highlightOverlay) {
    highlightOverlay.remove();
    highlightOverlay = null;
  }
  currentElement = null;
}
```
- **완료 조건**: 요소 하이라이트 정상 동작

### Task #2.34: 메시지 핸들러
- **파일**: `src/content/screenshot/messageHandler.ts`
- **시간**: 15분
- **의존성**: Task #2.3, #2.32, #2.33
- **상세 내용**:
```typescript
import { Message } from '../../constants/messages';
import { startAreaSelection, endAreaSelection } from './areaSelector';
import { startElementHighlight, endElementHighlight } from './elementHighlighter';
import { captureElement } from '../../utils/screenshot/captureElement';
import { captureArea } from '../../utils/screenshot/captureArea';
import { captureFullPage } from '../../utils/screenshot/captureFullPage';
import { CaptureOptions } from '../../types/screenshot';

/**
 * 메시지 핸들러 등록
 */
export function registerScreenshotMessageHandler(): void {
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * 메시지 처리
 */
function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  switch (message.action) {
    case 'SCREENSHOT_CAPTURE':
      handleCapture(message.data, sendResponse);
      return true; // 비동기 응답

    case 'SCREENSHOT_AREA_SELECT_START':
      handleAreaSelectStart(sendResponse);
      return true;

    case 'SCREENSHOT_ELEMENT_HIGHLIGHT':
      handleElementHighlight(sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
}

/**
 * 캡처 처리
 */
async function handleCapture(
  options: CaptureOptions,
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    let canvas: HTMLCanvasElement;

    switch (options.mode) {
      case 'element':
        if (!options.selector) {
          throw new Error('Selector required for element mode');
        }
        canvas = await captureElement(
          document.querySelector(options.selector) as HTMLElement,
          options
        );
        break;

      case 'area':
        if (!options.area) {
          throw new Error('Area required for area mode');
        }
        canvas = await captureArea(options.area, options);
        break;

      case 'fullPage':
        canvas = await captureFullPage(options);
        break;

      default:
        throw new Error('Invalid capture mode');
    }

    const dataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);

    sendResponse({
      success: true,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });
  } catch (error) {
    console.error('Capture failed:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Capture failed',
    });
  }
}

/**
 * 영역 선택 시작
 */
function handleAreaSelectStart(sendResponse: (response: any) => void): void {
  startAreaSelection((area) => {
    sendResponse({ success: true, area });
  });
}

/**
 * 요소 하이라이트
 */
function handleElementHighlight(sendResponse: (response: any) => void): void {
  startElementHighlight((element) => {
    const selector = getSelector(element);
    sendResponse({ success: true, selector });
  });
}

/**
 * CSS 선택자 가져오기 (간단 버전)
 */
function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }

  return element.tagName.toLowerCase();
}
```
- **완료 조건**: 모든 메시지 처리 정상

---

## Phase 7: 테스트 (1개 태스크, 1시간)

### Task #2.35: 단위 및 통합 테스트
- **파일**: `src/utils/screenshot/__tests__/screenshot.test.ts`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureElement } from '../captureElement';
import { captureArea } from '../captureArea';
import { resizeCanvas, createThumbnail } from '../imageResize';
import { cropCanvas } from '../imageCrop';
import { canvasToDataUrl, canvasToBlob } from '../formatConverter';
import { copyCanvasToClipboard } from '../clipboard';
import { downloadCanvas, generateFilename } from '../download';
import { renderAnnotations } from '../annotation/renderer';
import { createAnnotation } from '../annotation/types';

describe('Screenshot Capture', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-element" style="width: 200px; height: 100px; background: red;">
        Test Content
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should capture element', async () => {
    const element = document.getElementById('test-element') as HTMLElement;
    const canvas = await captureElement(element);

    expect(canvas).toBeTruthy();
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('should throw error for non-existent element', async () => {
    await expect(
      captureElement(document.querySelector('.non-existent') as HTMLElement)
    ).rejects.toThrow();
  });
});

describe('Image Processing', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 800, 600);
    }
  });

  it('should resize canvas', () => {
    const resized = resizeCanvas(canvas, { width: 400, height: 300 });

    expect(resized.width).toBe(400);
    expect(resized.height).toBe(300);
  });

  it('should create thumbnail', () => {
    const thumbnail = createThumbnail(canvas, 200, 150);

    expect(thumbnail.width).toBeLessThanOrEqual(200);
    expect(thumbnail.height).toBeLessThanOrEqual(150);
  });

  it('should crop canvas', () => {
    const cropped = cropCanvas(canvas, {
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    });

    expect(cropped.width).toBe(200);
    expect(cropped.height).toBe(150);
  });

  it('should convert to different formats', () => {
    const pngUrl = canvasToDataUrl(canvas, 'png');
    const jpegUrl = canvasToDataUrl(canvas, 'jpeg', 0.9);
    const webpUrl = canvasToDataUrl(canvas, 'webp', 0.9);

    expect(pngUrl).toContain('data:image/png');
    expect(jpegUrl).toContain('data:image/jpeg');
    expect(webpUrl).toContain('data:image/webp');
  });

  it('should convert to blob', async () => {
    const blob = await canvasToBlob(canvas, 'png');

    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('Annotations', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);
  });

  it('should create arrow annotation', () => {
    const annotation = createAnnotation(
      'arrow',
      {
        type: 'arrow',
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        headSize: 10,
      },
      '#ef4444',
      3
    );

    expect(annotation.type).toBe('arrow');
    expect(annotation.color).toBe('#ef4444');
    expect(annotation.data.startX).toBe(100);
  });

  it('should render annotations', () => {
    const annotations = [
      createAnnotation(
        'arrow',
        {
          type: 'arrow',
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 200,
          headSize: 10,
        },
        '#ef4444',
        3
      ),
      createAnnotation(
        'rectangle',
        {
          type: 'rectangle',
          x: 300,
          y: 300,
          width: 100,
          height: 80,
          filled: false,
        },
        '#3b82f6',
        2
      ),
    ];

    expect(() => renderAnnotations(ctx, annotations)).not.toThrow();
  });
});

describe('Clipboard and Download', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should copy to clipboard', async () => {
    await expect(copyCanvasToClipboard(canvas, 'png')).resolves.toBe(true);
    expect(navigator.clipboard.write).toHaveBeenCalled();
  });

  it('should generate filename', () => {
    const filename = generateFilename('test', false);
    expect(filename).toBe('test');

    const filenameWithTimestamp = generateFilename('test', true);
    expect(filenameWithTimestamp).toContain('test_');
  });

  it('should download canvas', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');

    downloadCanvas(canvas, 'test-image', 'png');

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="capture-target" style="width: 300px; height: 200px;">
        <h1>Test Page</h1>
        <p>This is a test paragraph.</p>
      </div>
    `;

    // Mock chrome API
    global.chrome = {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
      },
    } as any;
  });

  it('should capture, annotate, and save screenshot', async () => {
    const element = document.getElementById('capture-target') as HTMLElement;

    // 캡처
    const canvas = await captureElement(element);
    expect(canvas).toBeTruthy();

    // 주석 추가
    const ctx = canvas.getContext('2d')!;
    const annotations = [
      createAnnotation(
        'arrow',
        {
          type: 'arrow',
          startX: 10,
          startY: 10,
          endX: 100,
          endY: 100,
          headSize: 10,
        },
        '#ef4444',
        3
      ),
    ];

    renderAnnotations(ctx, annotations);

    // 포맷 변환
    const dataUrl = canvasToDataUrl(canvas, 'png');
    expect(dataUrl).toContain('data:image/png');

    // 썸네일 생성
    const thumbnail = createThumbnail(canvas, 200, 150);
    expect(thumbnail.width).toBeLessThanOrEqual(200);
  });
});
```
- **테스트 항목**:
  - 요소 캡처
  - 영역 캡처
  - 이미지 리사이즈
  - 이미지 크롭
  - 포맷 변환
  - 주석 생성 및 렌더링
  - 클립보드 복사
  - 다운로드
  - 통합 시나리오
- **완료 조건**: 80% 이상 테스트 커버리지

---

## ✅ 완료 체크리스트

- [ ] Phase 1: 기반 설정 (6개 태스크)
  - [ ] Task #2.1: 타입 정의
  - [ ] Task #2.2: Storage 상수
  - [ ] Task #2.3: 메시지 액션
  - [ ] Task #2.4: CSS 클래스
  - [ ] Task #2.5: 에러 메시지
  - [ ] Task #2.6: 기본 설정

- [ ] Phase 2: 캡처 유틸리티 (10개 태스크)
  - [ ] Task #2.7: html2canvas 통합
  - [ ] Task #2.8: 요소 캡처
  - [ ] Task #2.9: 영역 캡처
  - [ ] Task #2.10: 전체 페이지 캡처
  - [ ] Task #2.11: 캔버스 병합
  - [ ] Task #2.12: 포맷 변환
  - [ ] Task #2.13: 이미지 리사이즈
  - [ ] Task #2.14: 이미지 크롭
  - [ ] Task #2.15: 클립보드 복사
  - [ ] Task #2.16: 이미지 다운로드

- [ ] Phase 3: 주석 기능 (7개 태스크)
  - [ ] Task #2.17: Annotation 타입
  - [ ] Task #2.18: 화살표 주석
  - [ ] Task #2.19: 텍스트 주석
  - [ ] Task #2.20: 도형 주석
  - [ ] Task #2.21: 펜 주석
  - [ ] Task #2.22: 주석 편집
  - [ ] Task #2.23: 주석 렌더링

- [ ] Phase 4: Storage (3개 태스크)
  - [ ] Task #2.24: Storage 훅
  - [ ] Task #2.25: 히스토리 관리
  - [ ] Task #2.26: 썸네일 생성

- [ ] Phase 5: React 컴포넌트 (5개 태스크)
  - [ ] Task #2.27: ScreenshotPanel
  - [ ] Task #2.28: CaptureModeSwitcher
  - [ ] Task #2.29: FormatSelector
  - [ ] Task #2.30: ScreenshotPreview
  - [ ] Task #2.31: ScreenshotToolbar

- [ ] Phase 6: Content Script (3개 태스크)
  - [ ] Task #2.32: 영역 선택
  - [ ] Task #2.33: 요소 하이라이트
  - [ ] Task #2.34: 메시지 핸들러

- [ ] Phase 7: 테스트 (1개 태스크)
  - [ ] Task #2.35: 단위/통합 테스트

---

**다음 단계**: 도구 #3 (CSS 스캔) 구현