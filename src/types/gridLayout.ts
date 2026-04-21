/**
 * Grid & Layout Tool Type Definitions
 */

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
  opacity?: number;              // 불투명도 (0-1)
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
  showColumnBackgrounds?: boolean;
  showInfo?: boolean;
  lineWidth?: number;            // 선 두께 (px)
  zIndex?: number;               // z-index 값
  size?: number;                 // 패턴 크기 (px)
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
 * 가이드라인 관리 설정
 */
export interface GuideLineSettings {
  items: GuideLine[];
  showOnHover: boolean;
  snapToLines: boolean;
  snapThreshold: number;       // px
  maxGuidelines: number;        // 최대 가이드라인 수
}

/**
 * 키보드 단축키 설정
 */
export interface KeyboardShortcutSettings {
  toggleGrid: string;          // e.g., 'Ctrl+G'
  toggleGuides: string;        // e.g., 'Ctrl+Shift+G'
  clearAll: string;            // e.g., 'Ctrl+Shift+X'
}

/**
 * 통합 그리드 설정
 */
export interface GridLayoutSettings {
  guideLines: GuideLineSettings;
  viewport: ViewportState;
  gridOverlay: GridOverlaySettings;
  whitespace: WhitespaceSettings;
  keyboardShortcuts: KeyboardShortcutSettings;
}

/**
 * 뷰포트 리사이저 옵션
 */
export interface ViewportResizerOptions {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  step?: number;                // px 단위
}

/**
 * 리사이즈 방향
 */
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * 그리드 측정 정보
 */
export interface GridMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
  columnWidth?: number;
  columnIndex?: number;
  breakpoint?: string;
}

/**
 * 스냅샷 설정
 */
export interface GridSnapshotSettings {
  includeGuidelines: boolean;
  includeGrid: boolean;
  includeViewport: boolean;
  format: 'json' | 'png';
}
