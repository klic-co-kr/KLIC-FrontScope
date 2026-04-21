/**
 * Tailwind Scanner Types
 *
 * Tailwind CSS 스캔 및 분석을 위한 타입 정의
 */

/**
 * 임의 값 타입
 */
export interface ArbitraryValue {
  value: string;
  hasBrackets: boolean;
  property?: string;
  className?: string;
  element?: {
    tagName: string;
    selector: string;
  };
}

/**
 * Tailwind 카테고리 (별칭)
 */
export type TailwindCategory = ClassCategory;

/**
 * Tailwind 클래스 정보
 */
export interface TailwindClass {
  name: string;                   // 클래스명 (예: 'bg-blue-500')
  category: ClassCategory;        // 카테고리
  isValid: boolean;              // 유효한 Tailwind 클래스인지
  isArbitrary: boolean;          // 임의 값 사용인지 (예: 'w-[123px]')
  isCustom: boolean;             // 사용자 정의 클래스인지
  value?: string;                // 추출된 값 (예: '123px')
  properties?: string[];         // 해당 CSS 속성들
  full?: string;                 // 전체 클래스명 (베리언트 포함)
  usageCount?: number;           // 사용 횟수
  element?: {
    tagName: string;
    selector: string;
  };
}

/**
 * Tailwind 클래스 카테고리
 */
export type ClassCategory =
  | 'layout'        // display, position, etc
  | 'flexbox'       // flex, gap, etc
  | 'grid'          // grid, cols, etc
  | 'spacing'       // padding, margin
  | 'sizing'        // width, height
  | 'typography'    // font, text, etc
  | 'background'    // bg, gradient
  | 'borders'       // border, rounded
  | 'effects'       // shadow, opacity
  | 'filters'       // blur, brightness
  | 'tables'        // table 관련
  | 'transitions'   // transition, transform
  | 'transforms'    // transform, scale, rotate, etc
  | 'interactivity' // hover, focus, etc
  | 'svg'           // stroke, fill, etc
  | 'arbitrary'     // arbitrary values with brackets
  | 'colors'        // text, bg, border colors
  | 'unknown';

/**
 * Tailwind 버전
 */
export type TailwindVersion = 'v2' | 'v3' | 'v4' | 'unknown';

/**
 * Tailwind 감지 결과
 */
export interface TailwindDetectionResult {
  detected: boolean;              // Tailwind 사용 여부
  version: TailwindVersion;       // 감지된 버전
  jitMode: boolean;              // JIT 모드 여부
  classes: TailwindClass[];      // 감지된 클래스들
  totalClasses: number;          // 전체 클래스 수
  customClasses: string[];       // 커스텀 클래스들
  arbitraryValues: string[];     // 임의 값 사용 클래스들
}

/**
 * CSS 속성 → Tailwind 변환 결과
 */
export interface CSSToTailwindResult {
  css: {
    property: string;            // CSS 속성명
    value: string;              // CSS 값
  };
  tailwind: {
    classes: string[];          // 변환된 Tailwind 클래스들
    confidence: number;         // 변환 확신도 (0-1)
  };
  alternatives?: string[][];    // 대안 클래스들
}

/**
 * Tailwind 설정
 */
export interface TailwindConfig {
  theme?: {
    colors?: Record<string, string | Record<string, string>>;
    spacing?: Record<string, string>;
    fontSize?: Record<string, string | [string, object]>;
    borderRadius?: Record<string, string>;
    screens?: Record<string, string>;
    extend?: {
      colors?: Record<string, string | Record<string, string>>;
      spacing?: Record<string, string>;
      [key: string]: unknown;
    };
  };
  plugins?: string[];
  presets?: string[];
  content?: string[];
  safelist?: string[];
  important?: boolean | string;
}

/**
 * 요소 스타일 분석 결과
 */
export interface ElementStyleAnalysis {
  element: {
    tagName: string;
    selector: string;
    className?: string;
  };
  inlineStyles: Record<string, string>;     // 인라인 스타일
  computedStyles: Record<string, string>;   // 계산된 스타일
  tailwindClasses: TailwindClass[];         // Tailwind 클래스들
  conversionSuggestions: CSSToTailwindResult[]; // 변환 제안
  conversionScore: number;                   // 변환 가능성 점수 (0-1)
}

/**
 * Tailwind 사용 통계
 */
export interface TailwindUsageStats {
  totalElements: number;
  elementsWithTailwind: number;
  totalClasses: number;
  totalTailwindClasses: number;
  coverage: number;              // Tailwind 적용 범위 (0-1)
  categoryDistribution: Record<ClassCategory, number>;
  topClasses: Array<{ class: string; count: number }>;
  customClasses: string[];
}

/**
 * Tailwind 스캔 결과
 */
export interface TailwindScanResult {
  timestamp: number;
  url: string;
  title: string;
  isTailwindDetected: boolean;
  version: TailwindVersion;
  isJITMode: boolean;
  totalClasses: number;
  classesByCategory: Record<string, number>;
  classes: TailwindClass[];
  customClasses: string[];
  arbitraryValues: Array<{ property: string; value: string; class: string }>;
  config?: TailwindConfig;
}

/**
 * 스캔 히스토리 항목
 */
export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  totalClasses: number;
  result: TailwindScanResult;
}

/**
 * 변환 제안
 */
export interface ConversionSuggestion {
  css: string;                   // 원본 CSS
  tailwind: string;              // 변환된 Tailwind 클래스
  confidence: number;            // 확신도 (0-1)
  isArbitrary: boolean;          // 임의 값 여부
  category?: ClassCategory;      // 카테고리
}

/**
 * 변환 리포트
 */
export interface ConversionReport {
  totalProperties: number;       // 전체 속성 수
  convertedCount: number;        // 변환된 수
  conversionRate: number;        // 변환율 (0-1)
  conversions: ConversionSuggestion[];  // 변환 결과들
  unmapped: string[];            // 변환되지 않은 CSS
}

/**
 * Tailwind 설정
 */
export interface TailwindSettings {
  detectJIT: boolean;            // JIT 모드 감지
  includeArbitrary: boolean;     // 임의 값 포함
  showSuggestions: boolean;      // 변환 제안 표시
  autoScan: boolean;             // 자동 스캔
  maxHistorySize: number;        // 최대 히스토리 크기
}
