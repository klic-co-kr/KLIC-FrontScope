/**
 * Screenshot Type Definitions
 *
 * 스크린샷 도구를 위한 TypeScript 타입 정의
 */

/**
 * 캡처 모드
 */
export type CaptureMode = 'element' | 'area' | 'full-page';

/**
 * 이미지 포맷
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'bmp';

/**
 * 좌표
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 치수
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * 캡처 영역
 */
export interface CaptureArea extends Point, Dimensions { }

/**
 * 스크린샷 데이터
 */
export interface Screenshot {
  id: string; /** UUID */
  timestamp: number; /** Date.now() */
  mode: CaptureMode;
  format: ImageFormat;
  quality: number; /** 0-1 (JPEG용) */
  dimensions: {
    width: number;
    height: number;
  };
  size: number; /** bytes */
  dataUrl: string; /** base64 */
  thumbnail?: string; /** 썸네일 dataUrl */
  title?: string;
  tags?: string[];
  isFavorite?: boolean;
}

/**
 * 캡처 옵션
 */
export interface CaptureOptions {
  mode: CaptureMode;
  format: ImageFormat;
  quality: number; /** 0-1 (JPEG용) */
  includeAnnotations: boolean;
  element?: HTMLElement; /** element 모드일 때 */
  area?: { x: number; y: number; width: number; height: number }; /** area 모드일 때 */
}

/**
 * 주석 타입
 */
export type AnnotationType = 'arrow' | 'text' | 'shape' | 'pen';

/**
 * 도형 타입
 */
export type ShapeType = 'rectangle' | 'circle' | 'line';

/**
 * 주석 데이터
 */
export interface BaseAnnotation {
  id: string;
  groupId?: string;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  data: {
    type: 'arrow';
    start: Point;
    end: Point;
    style: {
      color: string;
      width: number;
      doubleHeaded?: boolean;
    };
  };
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  data: {
    type: 'text';
    text: string;
    position: Point;
    style: {
      color: string;
      fontSize: number;
      fontFamily?: string;
      backgroundColor?: string;
      padding?: number;
      maxWidth?: number;
      align?: 'left' | 'center' | 'right';
    };
  };
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'shape';
  data: {
    type: 'shape';
    shape: ShapeType | 'triangle' | 'star' | 'arrow' | 'ellipse'; // Added missing types used in shapeAnnotation.ts
    points: Point[];
    style: {
      borderColor: string;
      borderWidth: number;
      fillColor?: string;
      dashed?: boolean;
    };
  };
}

export interface PenAnnotation extends BaseAnnotation {
  type: 'pen';
  data: {
    type: 'pen';
    points: Point[];
    color: string;
    width: number;
  };
}

/**
 * 주석 데이터
 */
export type Annotation = ArrowAnnotation | TextAnnotation | ShapeAnnotation | PenAnnotation;

/**
 * 스크린샷 히스토리
 */
export interface ScreenshotHistory {
  screenshots: Screenshot[];
  maxSize: number;
  totalCaptures: number;
  lastCaptureTime: number;
}

/**
 * 스크린샷 설정
 */
export interface ScreenshotSettings {
  defaultFormat: ImageFormat;
  quality: number;
  captureMode: CaptureMode;
  enableAnnotations: boolean;
  autoDownload: boolean;
  includeCursor: boolean;
}

/**
 * 캔처 결과
 */
export interface CaptureResult {
  success: boolean;
  screenshot?: Screenshot;
  error?: string;
}

/**
 * 캔처 진행 상태
 */
export interface CaptureState {
  isCapturing: boolean;
  stage: 'idle' | 'selecting' | 'capturing' | 'processing' | 'done';
  progress?: number;
}
