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
