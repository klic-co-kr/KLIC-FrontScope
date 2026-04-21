/**
 * CSS Scan Type Definitions
 *
 * CSS 스타일 검사 타입 정의
 */

/**
 * CSS 속성 타입
 */
export type CSSPropertyType =
  | 'layout'
  | 'typography'
  | 'color'
  | 'border'
  | 'background'
  | 'effect'
  | 'animation'
  | 'flexbox'
  | 'grid'
  | 'position'
  | 'size'
  | 'spacing';

/**
 * CSS 값 타입
 */
export type CSSValueType =
  | 'keyword'
  | 'length'
  | 'percentage'
  | 'color'
  | 'url'
  | 'number'
  | 'angle'
  | 'time'
  | 'function'
  | 'custom';

/**
 * 선택자 타입
 */
export type SelectorType =
  | 'id'
  | 'class'
  | 'tag'
  | 'attribute'
  | 'pseudo-class'
  | 'pseudo-element'
  | 'universal';

/**
 * 스타일 소스
 */
export type StyleSource = 'inline' | 'stylesheet' | 'computed' | 'inherited';

/**
 * 미디어 쿼리
 */
export interface MediaQuery {
  type: 'screen' | 'print' | 'speech' | 'all';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  orientation?: 'portrait' | 'landscape';
  query: string;
}

/**
 * CSS 속성
 */
export interface CSSProperty {
  name: string;
  value: string;
  type: CSSPropertyType;
  valueType: CSSValueType;
  source: StyleSource;
  important: boolean;
  inherited: boolean;
  default: string;
  unit?: string;
}

/**
 * CSS 선언 (이름-값 쌍)
 */
export interface CSSDeclaration {
  property: string;
  value: string;
  important?: boolean;
}

/**
 * CSS 규칙
 */
export interface CSSRule {
  selector: string;
  selectorType: SelectorType;
  specificity: number;
  declarations: CSSDeclaration[];
  mediaQuery?: MediaQuery;
  stylesheetId?: string;
  stylesheetUrl?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * 선택자 정보
 */
export interface SelectorInfo {
  selector: string;
  type: SelectorType;
  specificity: {
    ids: number;
    classes: number;
    elements: number;
  };
  matches: boolean;
  pseudoElement?: string;
  pseudoClass?: string;
}

/**
 * 요소 스타일 정보
 */
export interface ElementStyleInfo {
  element: {
    tagName: string;
    id?: string;
    classes: string[];
    attributes: Record<string, string>;
  };
  selectors: SelectorInfo[];
  computedStyle: Record<string, string>;
  inlineStyle: Record<string, string>;
  matchedRules: CSSRule[];
  inheritedProperties: Record<string, string>;
  animationProperties?: AnimationProperties;
}

/**
 * 애니메이션 속성
 */
export interface AnimationProperties {
  name: string;
  duration: number;
  timingFunction: string;
  delay: number;
  iterationCount: number | 'infinite';
  direction: string;
  fillMode: string;
  playState: string;
}

/**
 * 박스 모델 정보
 */
export interface BoxModel {
  content: { width: number; height: number };
  padding: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  offset: { top: number; left: number };
}

/**
 * 색상 정보
 */
export interface ColorInfo {
  property: string;
  value: string;
  hex: string;
  rgb: string;
  hsl: string;
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'named';
  alpha: number;
}

/**
 * 글꼴 정보
 */
export interface FontInfo {
  family: string;
  size: number;
  sizeUnit: string;
  weight: number | string;
  style: string;
  lineHeight: number;
  letterSpacing: string;
  wordSpacing: string;
  variant: string;
}

/**
 * 플렉스박스 정보
 */
export interface FlexInfo {
  enabled: boolean;
  direction: string;
  wrap: string;
  justifyContent: string;
  alignItems: string;
  alignContent: string;
  gap: string;
  rowGap: string;
  columnGap: string;
}

/**
 * 그리드 정보
 */
export interface GridInfo {
  enabled: boolean;
  templateColumns: string;
  templateRows: string;
  templateAreas: string;
  columns: string;
  rows: string;
  areas: string;
  autoFlow: string;
  autoColumns: string;
  autoRows: string;
  gap: string;
  rowGap: string;
  columnGap: string;
}

/**
 * 포지션 정보
 */
export interface PositionInfo {
  type: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
  zIndex: string | number;
}

/**
 * 변환 정보
 */
export interface TransformInfo {
  matrix: number[];
  translate: { x: number; y: number; z: number };
  rotate: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  skew: { x: number; y: number };
  origin: string;
  perspective: string;
}

/**
 * 필터 정보
 */
export interface FilterInfo {
  blur: string;
  brightness: string;
  contrast: string;
  grayscale: string;
  hueRotate: string;
  invert: string;
  opacity: string;
  saturate: string;
  sepia: string;
  dropShadow: string;
}

/**
 * 전이 정보
 */
export interface TransitionInfo {
  property: string;
  duration: number;
  timingFunction: string;
  delay: number;
}

/**
 * 요소 트리
 */
export interface ElementTree {
  element: {
    tagName: string;
    id?: string;
    classes: string[];
  };
  children: ElementTree[];
  styles: Record<string, string>;
}

/**
 * 스타일시트 정보
 */
export interface StylesheetInfo {
  id: string;
  href: string;
  disabled: boolean;
  rules: CSSRule[];
  imports: string[];
  media: string[];
}

/**
 * 스타일 비교 결과
 */
export interface StyleComparison {
  element1: string;
  element2: string;
  differences: Array<{
    property: string;
    value1: string;
    value2: string;
  }>;
  similarities: Array<{
    property: string;
    value: string;
  }>;
}

/**
 * CSS 스캔 결과
 */
export interface CSSScanResult {
  timestamp: number;
  url: string;
  title: string;
  elements: ElementStyleInfo[];
  stylesheets: StylesheetInfo[];
  summary: {
    totalElements: number;
    totalRules: number;
    totalStylesheets: number;
    uniqueFonts: string[];
    uniqueColors: string[];
  };
}

/**
 * CSS 내보내기 옵션
 */
export interface CSSExportOptions {
  format: 'css' | 'scss' | 'less' | 'json';
  includeComputed?: boolean;
  includeInherited?: boolean;
  minify?: boolean;
  includeSelectors?: boolean;
  includeMediaQueries?: boolean;
}

/**
 * CSS 검색 옵션
 */
export interface CSSSearchOptions {
  property?: string;
  value?: string;
  selector?: string;
  specificity?: {
    min?: number;
    max?: number;
  };
  source?: StyleSource;
  mediaQuery?: string;
}

/**
 * CSS 스캔 설정
 */
export interface CSSScanSettings {
  autoScan: boolean;
  highlightOnHover: boolean;
  showBoxModel: boolean;
  showInherited: boolean;
  showComputed: boolean;
  exportFormat: CSSExportOptions['format'];
  theme: 'light' | 'dark';
}

/**
 * 커스텀 속성 (CSS 변수)
 */
export interface CustomProperty {
  name: string;
  value: string;
  scope: 'global' | 'local';
  fallback?: string;
  syntax?: string;
  inherits: boolean;
}

/**
 * 컨테이너 쿼리 정보
 */
export interface ContainerQueryInfo {
  name: string;
  condition: string;
  minWidth?: number;
  maxWidth?: number;
}
