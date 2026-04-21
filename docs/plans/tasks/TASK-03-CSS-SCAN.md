# 도구 #3: CSS 스캔 - 완전 태스크 분해

**총 태스크**: 40개
**예상 시간**: 16-20시간 (2-2.5일)
**작성일**: 2026-02-09

---

## 📑 목차

- [Phase 1: 기반 설정 (7개 태스크, 2.5시간)](#phase-1-기반-설정)
- [Phase 2: CSS 추출 유틸리티 (12개 태스크, 7시간)](#phase-2-css-추출-유틸리티)
- [Phase 3: Box Model 유틸리티 (5개 태스크, 2시간)](#phase-3-box-model-유틸리티)
- [Phase 4: Storage 및 상태 관리 (3개 태스크, 1.5시간)](#phase-4-storage-및-상태-관리)
- [Phase 5: React 컴포넌트 (8개 태스크, 4시간)](#phase-5-react-컴포넌트)
- [Phase 6: Content Script 통합 (4개 태스크, 2시간)](#phase-6-content-script-통합)
- [Phase 7: 테스트 및 최적화 (1개 태스크, 1시간)](#phase-7-테스트-및-최적화)

---

## Phase 1: 기반 설정 (7개 태스크, 2.5시간)

### Task #3.1: 타입 정의 - CSS 스캔 인터페이스
- **파일**: `src/types/cssScan.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * CSS 속성 카테고리
 */
export type CSSPropertyCategory =
  | 'layout'
  | 'typography'
  | 'color'
  | 'background'
  | 'border'
  | 'spacing'
  | 'positioning'
  | 'flexbox'
  | 'grid'
  | 'transform'
  | 'animation'
  | 'filter'
  | 'other';

/**
 * Computed 스타일 (선택된 중요 속성)
 */
export interface ComputedStyles {
  // Layout
  display?: string;
  width?: string;
  height?: string;
  overflow?: string;
  visibility?: string;
  opacity?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  textAlign?: string;
  textDecoration?: string;
  letterSpacing?: string;
  textTransform?: string;
  color?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;

  // Border
  border?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;

  // Spacing
  margin?: string;
  padding?: string;

  // Positioning
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;

  // Flexbox
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  gap?: string;

  // Grid
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: string;

  // Transform
  transform?: string;

  // Filters
  filter?: string;
  backdropFilter?: string;
}

/**
 * Box Model 정보
 */
export interface BoxModel {
  content: {
    width: number;
    height: number;
  };
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
 * CSS 변수 정보
 */
export interface CSSVariable {
  name: string;               // --primary-color
  value: string;              // #3b82f6
  computedValue?: string;     // rgb(59, 130, 246)
  source: 'inline' | 'stylesheet' | 'inherited';
}

/**
 * Inherited 스타일 정보
 */
export interface InheritedStyle {
  property: string;
  value: string;
  source: string;             // 부모 요소 선택자
  element: string;            // 부모 요소 태그명
}

/**
 * CSS 규칙 정보
 */
export interface CSSRule {
  selector: string;           // .my-class
  properties: Record<string, string>;
  specificity: number;        // 우선순위 점수
  source: {
    type: 'inline' | 'stylesheet' | 'user-agent';
    styleSheet?: string;      // 파일 경로
    line?: number;
  };
}

/**
 * 의사 요소 스타일
 */
export interface PseudoElementStyles {
  before?: ComputedStyles;
  after?: ComputedStyles;
}

/**
 * 스캔 결과 전체
 */
export interface CSSScanResult {
  id: string;
  timestamp: number;
  element: {
    tagName: string;
    selector: string;
    xpath: string;
    className?: string;
    id?: string;
  };
  computedStyles: ComputedStyles;
  allStyles?: Record<string, string>;     // 모든 computed styles
  boxModel: BoxModel;
  cssVariables: CSSVariable[];
  inheritedStyles: InheritedStyle[];
  cssRules: CSSRule[];
  pseudoElements?: PseudoElementStyles;
  categorizedProperties: Record<CSSPropertyCategory, Record<string, string>>;
}

/**
 * CSS 스캔 히스토리
 */
export interface CSSScanHistory {
  scans: CSSScanResult[];
  maxSize: number;            // 기본 15
  totalScans: number;
  lastScanTime: number;
}

/**
 * CSS 스캔 설정
 */
export interface CSSScanSettings {
  maxHistorySize: number;     // 기본 15
  includeInherited: boolean;  // 상속 스타일 포함
  includePseudoElements: boolean;
  includeUserAgentStyles: boolean;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  copyFormat: 'css' | 'scss' | 'js-object';
  highlightColor: string;
  showBoxModel: boolean;
  autoExpandCategories: string[];  // 자동 확장할 카테고리
}

/**
 * 코드 생성 옵션
 */
export interface CSSCodeOptions {
  format: 'css' | 'scss' | 'js-object';
  selector?: string;
  includeComments: boolean;
  minify: boolean;
  sortProperties: boolean;
  useCSSVariables: boolean;
  variablePrefix: string;     // --my-component-
}

/**
 * 즐겨찾기 스타일
 */
export interface FavoriteStyle {
  id: string;
  name: string;
  description?: string;
  styles: ComputedStyles;
  createdAt: number;
  tags?: string[];
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

### Task #3.2: CSS 속성 상수 정의
- **파일**: `src/constants/cssProperties.ts`
- **시간**: 30분
- **의존성**: Task #3.1
- **상세 내용**:
```typescript
import { CSSPropertyCategory } from '../types/cssScan';

/**
 * 중요한 CSS 속성 목록 (Computed Styles 추출용)
 */
export const IMPORTANT_CSS_PROPERTIES = [
  // Layout
  'display',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'overflow',
  'overflow-x',
  'overflow-y',
  'visibility',
  'opacity',

  // Typography
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'text-align',
  'text-decoration',
  'text-transform',
  'letter-spacing',
  'word-spacing',
  'color',
  'white-space',

  // Background
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'background-attachment',

  // Border
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',

  // Spacing
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',

  // Positioning
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',

  // Flexbox
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-content',
  'gap',
  'row-gap',
  'column-gap',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',

  // Grid
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-gap',
  'grid-column-gap',
  'grid-row-gap',
  'grid-auto-flow',

  // Transform
  'transform',
  'transform-origin',

  // Transition & Animation
  'transition',
  'animation',

  // Filter
  'filter',
  'backdrop-filter',

  // Shadow
  'box-shadow',
  'text-shadow',

  // Other
  'cursor',
  'pointer-events',
  'user-select',
] as const;

/**
 * 속성별 카테고리 매핑
 */
export const PROPERTY_CATEGORIES: Record<string, CSSPropertyCategory> = {
  // Layout
  'display': 'layout',
  'width': 'layout',
  'height': 'layout',
  'min-width': 'layout',
  'max-width': 'layout',
  'min-height': 'layout',
  'max-height': 'layout',
  'overflow': 'layout',
  'overflow-x': 'layout',
  'overflow-y': 'layout',
  'visibility': 'layout',
  'opacity': 'layout',

  // Typography
  'font-family': 'typography',
  'font-size': 'typography',
  'font-weight': 'typography',
  'font-style': 'typography',
  'line-height': 'typography',
  'text-align': 'typography',
  'text-decoration': 'typography',
  'text-transform': 'typography',
  'letter-spacing': 'typography',
  'word-spacing': 'typography',
  'white-space': 'typography',

  // Color
  'color': 'color',

  // Background
  'background-color': 'background',
  'background-image': 'background',
  'background-size': 'background',
  'background-position': 'background',
  'background-repeat': 'background',
  'background-attachment': 'background',

  // Border
  'border': 'border',
  'border-width': 'border',
  'border-style': 'border',
  'border-color': 'border',
  'border-radius': 'border',
  'border-top': 'border',
  'border-right': 'border',
  'border-bottom': 'border',
  'border-left': 'border',
  'box-shadow': 'border',

  // Spacing
  'margin': 'spacing',
  'margin-top': 'spacing',
  'margin-right': 'spacing',
  'margin-bottom': 'spacing',
  'margin-left': 'spacing',
  'padding': 'spacing',
  'padding-top': 'spacing',
  'padding-right': 'spacing',
  'padding-bottom': 'spacing',
  'padding-left': 'spacing',

  // Positioning
  'position': 'positioning',
  'top': 'positioning',
  'right': 'positioning',
  'bottom': 'positioning',
  'left': 'positioning',
  'z-index': 'positioning',

  // Flexbox
  'flex-direction': 'flexbox',
  'flex-wrap': 'flexbox',
  'justify-content': 'flexbox',
  'align-items': 'flexbox',
  'align-content': 'flexbox',
  'gap': 'flexbox',
  'row-gap': 'flexbox',
  'column-gap': 'flexbox',
  'flex': 'flexbox',
  'flex-grow': 'flexbox',
  'flex-shrink': 'flexbox',
  'flex-basis': 'flexbox',

  // Grid
  'grid-template-columns': 'grid',
  'grid-template-rows': 'grid',
  'grid-template-areas': 'grid',
  'grid-gap': 'grid',
  'grid-column-gap': 'grid',
  'grid-row-gap': 'grid',
  'grid-auto-flow': 'grid',

  // Transform
  'transform': 'transform',
  'transform-origin': 'transform',

  // Animation
  'transition': 'animation',
  'animation': 'animation',

  // Filter
  'filter': 'filter',
  'backdrop-filter': 'filter',
};

/**
 * 카테고리별 표시 이름
 */
export const CATEGORY_LABELS: Record<CSSPropertyCategory, string> = {
  layout: '레이아웃',
  typography: '타이포그래피',
  color: '색상',
  background: '배경',
  border: '테두리',
  spacing: '여백',
  positioning: '위치',
  flexbox: 'Flexbox',
  grid: 'Grid',
  transform: '변형',
  animation: '애니메이션',
  filter: '필터',
  other: '기타',
};

/**
 * 상속 가능한 CSS 속성
 */
export const INHERITABLE_PROPERTIES = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'text-align',
  'text-transform',
  'letter-spacing',
  'word-spacing',
  'white-space',
  'cursor',
  'visibility',
] as const;

/**
 * 기본값이 auto인 속성
 */
export const AUTO_VALUE_PROPERTIES = [
  'width',
  'height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'overflow',
  'cursor',
] as const;
```

### Task #3.3: Storage 키 추가
- **파일**: `src/constants/storage.ts` (수정)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // ... 기존 키들

  // CSS 스캔
  CSS_SCAN_HISTORY: 'cssScan:history',
  CSS_SCAN_SETTINGS: 'cssScan:settings',
  CSS_SCAN_FAVORITES: 'cssScan:favorites',
  CSS_SCAN_TEMP: 'cssScan:temp',
} as const;

export const STORAGE_LIMITS = {
  // ... 기존 제한들
  CSS_SCAN_MAX_HISTORY: 15,
  CSS_SCAN_MAX_FAVORITES: 50,
} as const;
```

### Task #3.4: 메시지 액션 추가
- **파일**: `src/constants/messages.ts` (수정)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // CSS 스캔
  CSS_SCAN_TOGGLE: 'CSS_SCAN_TOGGLE',
  CSS_SCAN_ELEMENT: 'CSS_SCAN_ELEMENT',
  CSS_SCAN_SAVE: 'CSS_SCAN_SAVE',
  CSS_SCAN_HIGHLIGHT: 'CSS_SCAN_HIGHLIGHT',
  CSS_SCAN_COPY: 'CSS_SCAN_COPY',
  CSS_SCAN_GET_FAVORITES: 'CSS_SCAN_GET_FAVORITES',
  CSS_SCAN_ADD_FAVORITE: 'CSS_SCAN_ADD_FAVORITE',
  CSS_SCAN_REMOVE_FAVORITE: 'CSS_SCAN_REMOVE_FAVORITE',
} as const;
```

### Task #3.5: CSS 클래스 상수
- **파일**: `src/constants/classes.ts` (수정)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const CSS_SCAN_CLASSES = {
  HOVER: 'klic-css-scan-hover',
  ACTIVE: 'klic-css-scan-active',
  HIGHLIGHT: 'klic-css-scan-highlight',
  OVERLAY: 'klic-css-scan-overlay',
  BOX_MODEL_VISUAL: 'klic-css-scan-box-model',
} as const;
```

### Task #3.6: 에러 메시지 추가
- **파일**: `src/constants/errors.ts` (수정)
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  CSS_SCAN: {
    ELEMENT_NOT_FOUND: '요소를 찾을 수 없습니다',
    STYLES_NOT_COMPUTED: '스타일을 계산할 수 없습니다',
    COPY_FAILED: '클립보드 복사에 실패했습니다',
    INVALID_SELECTOR: '유효하지 않은 선택자입니다',
    STORAGE_FULL: '저장 공간이 부족합니다',
    PSEUDO_ELEMENT_ERROR: '의사 요소 스타일을 가져올 수 없습니다',
  },
} as const;
```

### Task #3.7: 기본 설정 값
- **파일**: `src/constants/defaults.ts` (수정)
- **시간**: 15분
- **의존성**: Task #3.1
- **상세 내용**:
```typescript
import { CSSScanSettings } from '../types/cssScan';

export const DEFAULT_CSS_SCAN_SETTINGS: CSSScanSettings = {
  maxHistorySize: 15,
  includeInherited: true,
  includePseudoElements: true,
  includeUserAgentStyles: false,
  colorFormat: 'hex',
  copyFormat: 'css',
  highlightColor: '#3b82f6',
  showBoxModel: true,
  autoExpandCategories: ['layout', 'typography', 'color'],
};
```

---

## Phase 2: CSS 추출 유틸리티 (12개 태스크, 7시간)

### Task #3.8: Computed Styles 추출 (중요 속성만)
- **파일**: `src/utils/cssScan/computedStyles.ts`
- **시간**: 45분
- **의존성**: Task #3.2
- **상세 내용**:
```typescript
import { ComputedStyles } from '../../types/cssScan';
import { IMPORTANT_CSS_PROPERTIES } from '../../constants/cssProperties';

/**
 * 요소의 중요 Computed Styles 추출
 */
export function getComputedStyles(element: HTMLElement): ComputedStyles {
  const computedStyle = window.getComputedStyle(element);
  const styles: ComputedStyles = {};

  IMPORTANT_CSS_PROPERTIES.forEach((property) => {
    const value = computedStyle.getPropertyValue(property);

    if (value && value !== 'none' && value !== 'normal') {
      // 카멜케이스로 변환
      const camelCaseKey = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styles[camelCaseKey as keyof ComputedStyles] = value;
    }
  });

  return styles;
}

/**
 * 모든 Computed Styles 추출
 */
export function getAllComputedStyles(element: HTMLElement): Record<string, string> {
  const computedStyle = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  // 모든 속성 순회
  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];
    const value = computedStyle.getPropertyValue(property);

    if (value) {
      styles[property] = value;
    }
  }

  return styles;
}

/**
 * 특정 속성만 추출
 */
export function getSpecificStyles(
  element: HTMLElement,
  properties: string[]
): Record<string, string> {
  const computedStyle = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  properties.forEach((property) => {
    const value = computedStyle.getPropertyValue(property);

    if (value) {
      styles[property] = value;
    }
  });

  return styles;
}

/**
 * 기본값이 아닌 스타일만 추출
 */
export function getNonDefaultStyles(element: HTMLElement): Record<string, string> {
  const allStyles = getAllComputedStyles(element);
  const nonDefaultStyles: Record<string, string> = {};

  // 임시 요소를 생성하여 기본값 확인
  const tempElement = document.createElement(element.tagName);
  document.body.appendChild(tempElement);
  const defaultStyles = window.getComputedStyle(tempElement);

  Object.keys(allStyles).forEach((property) => {
    const currentValue = allStyles[property];
    const defaultValue = defaultStyles.getPropertyValue(property);

    if (currentValue !== defaultValue) {
      nonDefaultStyles[property] = currentValue;
    }
  });

  document.body.removeChild(tempElement);

  return nonDefaultStyles;
}
```
- **테스트 케이스**:
  - 기본 HTML 요소 스타일 추출
  - 인라인 스타일이 있는 요소
  - 복잡한 CSS가 적용된 요소
  - 상속된 스타일 확인
- **완료 조건**: 정확한 computed styles 추출

### Task #3.9: Box Model 계산
- **파일**: `src/utils/cssScan/boxModel.ts`
- **시간**: 1시간
- **의존성**: 없음
- **상세 내용**:
```typescript
import { BoxModel } from '../../types/cssScan';

/**
 * 요소의 Box Model 정보 추출
 */
export function getBoxModel(element: HTMLElement): BoxModel {
  const computedStyle = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  // Margin
  const marginTop = parseFloat(computedStyle.marginTop) || 0;
  const marginRight = parseFloat(computedStyle.marginRight) || 0;
  const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
  const marginLeft = parseFloat(computedStyle.marginLeft) || 0;

  // Border
  const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
  const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
  const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
  const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;

  // Padding
  const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

  // Content
  const contentWidth = rect.width - borderLeft - borderRight - paddingLeft - paddingRight;
  const contentHeight = rect.height - borderTop - borderBottom - paddingTop - paddingBottom;

  // Total
  const totalWidth = rect.width + marginLeft + marginRight;
  const totalHeight = rect.height + marginTop + marginBottom;

  return {
    content: {
      width: Math.max(0, contentWidth),
      height: Math.max(0, contentHeight),
    },
    padding: {
      top: paddingTop,
      right: paddingRight,
      bottom: paddingBottom,
      left: paddingLeft,
    },
    border: {
      top: borderTop,
      right: borderRight,
      bottom: borderBottom,
      left: borderLeft,
    },
    margin: {
      top: marginTop,
      right: marginRight,
      bottom: marginBottom,
      left: marginLeft,
    },
    total: {
      width: totalWidth,
      height: totalHeight,
    },
  };
}

/**
 * Box Model 시각화 데이터 생성
 */
export function getBoxModelVisualizationData(boxModel: BoxModel) {
  const { content, padding, border, margin } = boxModel;

  return {
    layers: [
      {
        name: 'margin',
        color: '#f59e0b',
        values: margin,
        total: margin.top + margin.right + margin.bottom + margin.left,
      },
      {
        name: 'border',
        color: '#ef4444',
        values: border,
        total: border.top + border.right + border.bottom + border.left,
      },
      {
        name: 'padding',
        color: '#10b981',
        values: padding,
        total: padding.top + padding.right + padding.bottom + padding.left,
      },
      {
        name: 'content',
        color: '#3b82f6',
        values: content,
        total: content.width * content.height,
      },
    ],
    totalSize: boxModel.total,
  };
}

/**
 * Box sizing 타입 확인
 */
export function getBoxSizingType(element: HTMLElement): 'content-box' | 'border-box' {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.boxSizing as 'content-box' | 'border-box';
}
```
- **완료 조건**: 정확한 box model 계산

### Task #3.10: CSS 변수 추출
- **파일**: `src/utils/cssScan/cssVariables.ts`
- **시간**: 45분
- **의존성**: Task #3.1
- **상세 내용**:
```typescript
import { CSSVariable } from '../../types/cssScan';

/**
 * 요소에 적용된 CSS 변수 추출
 */
export function getCSSVariables(element: HTMLElement): CSSVariable[] {
  const variables: CSSVariable[] = [];
  const computedStyle = window.getComputedStyle(element);

  // Inline 스타일에서 변수 추출
  const inlineStyle = element.style;
  for (let i = 0; i < inlineStyle.length; i++) {
    const property = inlineStyle[i];

    if (property.startsWith('--')) {
      const value = inlineStyle.getPropertyValue(property);
      const computedValue = computedStyle.getPropertyValue(property);

      variables.push({
        name: property,
        value: value.trim(),
        computedValue: computedValue.trim(),
        source: 'inline',
      });
    }
  }

  // Computed 스타일에서 변수 추출
  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i];

    if (property.startsWith('--')) {
      // 이미 inline에서 추가했으면 스킵
      if (variables.some((v) => v.name === property)) {
        continue;
      }

      const value = computedStyle.getPropertyValue(property);

      // 부모로부터 상속되었는지 확인
      const isInherited = isVariableInherited(element, property);

      variables.push({
        name: property,
        value: value.trim(),
        computedValue: value.trim(),
        source: isInherited ? 'inherited' : 'stylesheet',
      });
    }
  }

  return variables;
}

/**
 * 변수가 상속되었는지 확인
 */
function isVariableInherited(element: HTMLElement, variableName: string): boolean {
  const parentElement = element.parentElement;

  if (!parentElement) {
    return false;
  }

  const parentStyle = window.getComputedStyle(parentElement);
  const parentValue = parentStyle.getPropertyValue(variableName);
  const currentValue = window.getComputedStyle(element).getPropertyValue(variableName);

  return parentValue === currentValue;
}

/**
 * 스타일에서 사용된 CSS 변수 참조 추출
 */
export function getUsedCSSVariables(styles: Record<string, string>): string[] {
  const usedVariables: string[] = [];
  const varRegex = /var\((--[\w-]+)/g;

  Object.values(styles).forEach((value) => {
    let match;
    while ((match = varRegex.exec(value)) !== null) {
      const varName = match[1];
      if (!usedVariables.includes(varName)) {
        usedVariables.push(varName);
      }
    }
  });

  return usedVariables;
}

/**
 * CSS 변수 값 해석
 */
export function resolveCSSVariable(
  element: HTMLElement,
  variableName: string
): string | null {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.getPropertyValue(variableName).trim() || null;
}
```
- **완료 조건**: 모든 CSS 변수 정확하게 추출

### Task #3.11: Inherited Styles 추적
- **파일**: `src/utils/cssScan/inheritedStyles.ts`
- **시간**: 1시간
- **의존성**: Task #3.2
- **상세 내용**:
```typescript
import { InheritedStyle } from '../../types/cssScan';
import { INHERITABLE_PROPERTIES } from '../../constants/cssProperties';
import { getSelector } from '../dom/selectorGenerator';

/**
 * 상속된 스타일 추적
 */
export function getInheritedStyles(element: HTMLElement): InheritedStyle[] {
  const inheritedStyles: InheritedStyle[] = [];
  const computedStyle = window.getComputedStyle(element);

  let currentElement: HTMLElement | null = element.parentElement;

  while (currentElement) {
    const parentStyle = window.getComputedStyle(currentElement);

    INHERITABLE_PROPERTIES.forEach((property) => {
      const currentValue = computedStyle.getPropertyValue(property);
      const parentValue = parentStyle.getPropertyValue(property);

      // 부모로부터 상속받은 경우
      if (currentValue === parentValue && parentValue) {
        // 이미 추가되지 않았으면 추가
        const exists = inheritedStyles.some(
          (s) => s.property === property && s.value === currentValue
        );

        if (!exists) {
          inheritedStyles.push({
            property,
            value: currentValue,
            source: getSelector(currentElement),
            element: currentElement.tagName.toLowerCase(),
          });
        }
      }
    });

    currentElement = currentElement.parentElement;
  }

  return inheritedStyles;
}

/**
 * 특정 속성이 상속되었는지 확인
 */
export function isPropertyInherited(
  element: HTMLElement,
  property: string
): boolean {
  const parentElement = element.parentElement;

  if (!parentElement) {
    return false;
  }

  const elementStyle = window.getComputedStyle(element);
  const parentStyle = window.getComputedStyle(parentElement);

  const elementValue = elementStyle.getPropertyValue(property);
  const parentValue = parentStyle.getPropertyValue(property);

  return elementValue === parentValue && INHERITABLE_PROPERTIES.includes(property as any);
}

/**
 * 상속 체인 추적
 */
export function getInheritanceChain(
  element: HTMLElement,
  property: string
): Array<{ element: string; selector: string; value: string }> {
  const chain: Array<{ element: string; selector: string; value: string }> = [];
  let currentElement: HTMLElement | null = element;

  while (currentElement) {
    const style = window.getComputedStyle(currentElement);
    const value = style.getPropertyValue(property);

    if (value) {
      chain.push({
        element: currentElement.tagName.toLowerCase(),
        selector: getSelector(currentElement),
        value,
      });
    }

    currentElement = currentElement.parentElement;
  }

  return chain;
}
```
- **완료 조건**: 상속 경로 정확하게 추적

### Task #3.12: Pseudo Element Styles 추출
- **파일**: `src/utils/cssScan/pseudoElements.ts`
- **시간**: 45분
- **의존성**: Task #3.8
- **상세 내용**:
```typescript
import { PseudoElementStyles, ComputedStyles } from '../../types/cssScan';

/**
 * 의사 요소(::before, ::after) 스타일 추출
 */
export function getPseudoElementStyles(element: HTMLElement): PseudoElementStyles {
  const pseudoStyles: PseudoElementStyles = {};

  // ::before
  try {
    const beforeStyle = window.getComputedStyle(element, '::before');
    const beforeContent = beforeStyle.getPropertyValue('content');

    // content가 none이 아니면 ::before가 존재
    if (beforeContent && beforeContent !== 'none') {
      pseudoStyles.before = extractPseudoStyles(beforeStyle);
    }
  } catch (error) {
    console.warn('Failed to get ::before styles:', error);
  }

  // ::after
  try {
    const afterStyle = window.getComputedStyle(element, '::after');
    const afterContent = afterStyle.getPropertyValue('content');

    // content가 none이 아니면 ::after가 존재
    if (afterContent && afterContent !== 'none') {
      pseudoStyles.after = extractPseudoStyles(afterStyle);
    }
  } catch (error) {
    console.warn('Failed to get ::after styles:', error);
  }

  return pseudoStyles;
}

/**
 * CSSStyleDeclaration에서 스타일 추출
 */
function extractPseudoStyles(styleDeclaration: CSSStyleDeclaration): ComputedStyles {
  const styles: ComputedStyles = {};

  // 중요한 속성만 추출
  const importantProperties = [
    'content',
    'display',
    'position',
    'width',
    'height',
    'color',
    'background-color',
    'font-size',
    'font-weight',
    'margin',
    'padding',
    'border',
  ];

  importantProperties.forEach((property) => {
    const value = styleDeclaration.getPropertyValue(property);

    if (value && value !== 'none' && value !== 'normal') {
      const camelCaseKey = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styles[camelCaseKey as keyof ComputedStyles] = value;
    }
  });

  return styles;
}

/**
 * 의사 요소 존재 여부 확인
 */
export function hasPseudoElement(
  element: HTMLElement,
  pseudo: '::before' | '::after'
): boolean {
  const style = window.getComputedStyle(element, pseudo);
  const content = style.getPropertyValue('content');
  return content && content !== 'none';
}
```
- **완료 조건**: ::before, ::after 스타일 정확 추출

### Task #3.13: CSS Rules 추출
- **파일**: `src/utils/cssScan/cssRules.ts`
- **시간**: 1.5시간
- **의존성**: Task #3.1
- **상세 내용**:
```typescript
import { CSSRule } from '../../types/cssScan';
import { calculateSpecificity } from './specificity';

/**
 * 요소에 적용된 CSS 규칙 추출
 */
export function getCSSRules(element: HTMLElement): CSSRule[] {
  const rules: CSSRule[] = [];

  // Inline 스타일
  if (element.hasAttribute('style')) {
    const inlineProperties: Record<string, string> = {};
    const style = element.style;

    for (let i = 0; i < style.length; i++) {
      const property = style[i];
      const value = style.getPropertyValue(property);
      inlineProperties[property] = value;
    }

    rules.push({
      selector: 'inline',
      properties: inlineProperties,
      specificity: 1000, // inline 스타일은 최고 우선순위
      source: {
        type: 'inline',
      },
    });
  }

  // Stylesheet 규칙
  const styleSheets = Array.from(document.styleSheets);

  styleSheets.forEach((styleSheet) => {
    try {
      const cssRules = Array.from(styleSheet.cssRules || []);

      cssRules.forEach((rule) => {
        if (rule instanceof CSSStyleRule) {
          // 요소가 이 규칙의 선택자와 매치되는지 확인
          if (element.matches(rule.selectorText)) {
            const properties: Record<string, string> = {};
            const style = rule.style;

            for (let i = 0; i < style.length; i++) {
              const property = style[i];
              const value = style.getPropertyValue(property);
              properties[property] = value;
            }

            rules.push({
              selector: rule.selectorText,
              properties,
              specificity: calculateSpecificity(rule.selectorText),
              source: {
                type: 'stylesheet',
                styleSheet: styleSheet.href || 'inline stylesheet',
              },
            });
          }
        }
      });
    } catch (error) {
      // CORS 등의 이유로 접근 불가능한 스타일시트는 무시
      console.warn('Cannot access stylesheet:', error);
    }
  });

  // User-Agent 스타일 (선택적)
  // 브라우저 기본 스타일은 제외 가능

  // 우선순위로 정렬 (높은 순)
  rules.sort((a, b) => b.specificity - a.specificity);

  return rules;
}

/**
 * 특정 속성에 대한 규칙만 필터링
 */
export function getCSSRulesForProperty(
  element: HTMLElement,
  property: string
): CSSRule[] {
  const allRules = getCSSRules(element);

  return allRules.filter((rule) => property in rule.properties);
}

/**
 * 최종 적용된 규칙 찾기
 */
export function getAppliedRule(
  element: HTMLElement,
  property: string
): CSSRule | null {
  const rules = getCSSRulesForProperty(element, property);

  // 우선순위가 가장 높은 규칙 반환
  return rules[0] || null;
}
```
- **완료 조건**: CSS 규칙 정확하게 추출 및 우선순위 정렬

### Task #3.14: Specificity 계산
- **파일**: `src/utils/cssScan/specificity.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * CSS 선택자 우선순위(specificity) 계산
 *
 * 계산 방식:
 * - Inline 스타일: 1000
 * - ID: 100
 * - Class, attribute, pseudo-class: 10
 * - Element, pseudo-element: 1
 */
export function calculateSpecificity(selector: string): number {
  // inline 스타일은 최고 우선순위
  if (selector === 'inline') {
    return 1000;
  }

  let specificity = 0;

  // ID 선택자 (#id)
  const idMatches = selector.match(/#[\w-]+/g);
  specificity += (idMatches?.length || 0) * 100;

  // Class 선택자 (.class)
  const classMatches = selector.match(/\.[\w-]+/g);
  specificity += (classMatches?.length || 0) * 10;

  // Attribute 선택자 ([attr])
  const attrMatches = selector.match(/\[[\w-]+[\^\$\*~|]?=?["']?[\w-]*["']?\]/g);
  specificity += (attrMatches?.length || 0) * 10;

  // Pseudo-class (:hover, :nth-child 등)
  const pseudoClassMatches = selector.match(/:[\w-]+(?:\([^)]*\))?/g);
  const pseudoClasses = (pseudoClassMatches || []).filter(
    (p) => !p.startsWith('::') // ::before 등의 pseudo-element 제외
  );
  specificity += pseudoClasses.length * 10;

  // Element 선택자 (div, p 등)
  // 단, *, +, >, ~, 공백 등은 제외
  const elementMatches = selector.match(/(?:^|[\s>+~])([a-z][\w-]*)/gi);
  specificity += (elementMatches?.length || 0) * 1;

  // Pseudo-element (::before, ::after 등)
  const pseudoElementMatches = selector.match(/::[\w-]+/g);
  specificity += (pseudoElementMatches?.length || 0) * 1;

  return specificity;
}

/**
 * Specificity를 문자열로 표현
 */
export function specificityToString(specificity: number): string {
  if (specificity >= 1000) {
    return 'inline';
  }

  const ids = Math.floor(specificity / 100);
  const classes = Math.floor((specificity % 100) / 10);
  const elements = specificity % 10;

  return `(${ids}, ${classes}, ${elements})`;
}

/**
 * 두 선택자의 우선순위 비교
 */
export function compareSpecificity(selectorA: string, selectorB: string): number {
  const specA = calculateSpecificity(selectorA);
  const specB = calculateSpecificity(selectorB);

  return specA - specB;
}
```
- **테스트 케이스**:
  - `#id` → 100
  - `.class` → 10
  - `div` → 1
  - `#id .class div` → 111
  - `div:hover::before` → 12
- **완료 조건**: 정확한 specificity 계산

### Task #3.15: 속성 분류
- **파일**: `src/utils/cssScan/categorizer.ts`
- **시간**: 30분
- **의존성**: Task #3.2
- **상세 내용**:
```typescript
import { CSSPropertyCategory } from '../../types/cssScan';
import { PROPERTY_CATEGORIES } from '../../constants/cssProperties';

/**
 * CSS 속성을 카테고리별로 분류
 */
export function categorizeProperties(
  properties: Record<string, string>
): Record<CSSPropertyCategory, Record<string, string>> {
  const categorized: Record<CSSPropertyCategory, Record<string, string>> = {
    layout: {},
    typography: {},
    color: {},
    background: {},
    border: {},
    spacing: {},
    positioning: {},
    flexbox: {},
    grid: {},
    transform: {},
    animation: {},
    filter: {},
    other: {},
  };

  Object.entries(properties).forEach(([property, value]) => {
    const category = PROPERTY_CATEGORIES[property] || 'other';
    categorized[category][property] = value;
  });

  return categorized;
}

/**
 * 특정 카테고리의 속성만 추출
 */
export function getPropertiesByCategory(
  properties: Record<string, string>,
  category: CSSPropertyCategory
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(properties).forEach(([property, value]) => {
    if (PROPERTY_CATEGORIES[property] === category) {
      result[property] = value;
    }
  });

  return result;
}

/**
 * 빈 카테고리 제거
 */
export function removeEmptyCategories(
  categorized: Record<CSSPropertyCategory, Record<string, string>>
): Record<CSSPropertyCategory, Record<string, string>> {
  const result: Partial<Record<CSSPropertyCategory, Record<string, string>>> = {};

  Object.entries(categorized).forEach(([category, properties]) => {
    if (Object.keys(properties).length > 0) {
      result[category as CSSPropertyCategory] = properties;
    }
  });

  return result as Record<CSSPropertyCategory, Record<string, string>>;
}
```
- **완료 조건**: 속성이 올바른 카테고리로 분류됨

### Task #3.16: CSS 코드 생성
- **파일**: `src/utils/cssScan/codeGenerator.ts`
- **시간**: 1시간
- **의존성**: Task #3.1
- **상세 내용**:
```typescript
import { CSSCodeOptions } from '../../types/cssScan';

/**
 * CSS 코드 생성 (기본 CSS 형식)
 */
export function generateCSSCode(
  properties: Record<string, string>,
  options: CSSCodeOptions
): string {
  const { selector = '.my-element', includeComments, sortProperties } = options;

  let props = Object.entries(properties);

  // 정렬
  if (sortProperties) {
    props = props.sort(([a], [b]) => a.localeCompare(b));
  }

  const lines = props.map(([property, value]) => {
    const comment = includeComments ? ` /* ${getCategoryComment(property)} */` : '';
    return `  ${property}: ${value};${comment}`;
  });

  return `${selector} {\n${lines.join('\n')}\n}`;
}

/**
 * SCSS 코드 생성
 */
export function generateSCSS(
  properties: Record<string, string>,
  options: CSSCodeOptions
): string {
  const { selector = '.my-element', includeComments, useCSSVariables, variablePrefix = '--' } = options;

  // CSS 변수 사용 시
  if (useCSSVariables) {
    const variables: string[] = [];
    const props: string[] = [];

    Object.entries(properties).forEach(([property, value]) => {
      const varName = `${variablePrefix}${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      variables.push(`  ${varName}: ${value};`);
      props.push(`  ${property}: var(${varName});`);
    });

    return `:root {\n${variables.join('\n')}\n}\n\n${selector} {\n${props.join('\n')}\n}`;
  }

  // 기본 SCSS
  return generateCSSCode(properties, options);
}

/**
 * JavaScript 객체 형식 생성
 */
export function generateJSObject(
  properties: Record<string, string>,
  options: CSSCodeOptions
): string {
  const entries = Object.entries(properties).map(([property, value]) => {
    const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return `  ${camelCase}: '${value}'`;
  });

  return `{\n${entries.join(',\n')}\n}`;
}

/**
 * 속성 카테고리 코멘트 생성
 */
function getCategoryComment(property: string): string {
  // 간단한 카테고리 매핑
  if (property.startsWith('margin') || property.startsWith('padding')) {
    return 'Spacing';
  }
  if (property.startsWith('font') || property.includes('text')) {
    return 'Typography';
  }
  if (property.startsWith('background')) {
    return 'Background';
  }
  if (property.startsWith('border')) {
    return 'Border';
  }
  return 'Other';
}

/**
 * 코드 최적화 (중복 제거, 단축 속성 사용)
 */
export function optimizeCSS(properties: Record<string, string>): Record<string, string> {
  const optimized: Record<string, string> = { ...properties };

  // Margin 최적화
  optimized.margin = optimizeSpacing(
    properties,
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left'
  );
  if (optimized.margin) {
    delete optimized['margin-top'];
    delete optimized['margin-right'];
    delete optimized['margin-bottom'];
    delete optimized['margin-left'];
  }

  // Padding 최적화
  optimized.padding = optimizeSpacing(
    properties,
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left'
  );
  if (optimized.padding) {
    delete optimized['padding-top'];
    delete optimized['padding-right'];
    delete optimized['padding-bottom'];
    delete optimized['padding-left'];
  }

  // Border 최적화
  const borderWidth = properties['border-top-width'];
  const borderStyle = properties['border-top-style'];
  const borderColor = properties['border-top-color'];

  if (
    borderWidth &&
    borderStyle &&
    borderColor &&
    properties['border-top-width'] === properties['border-right-width'] &&
    properties['border-top-width'] === properties['border-bottom-width'] &&
    properties['border-top-width'] === properties['border-left-width']
  ) {
    optimized.border = `${borderWidth} ${borderStyle} ${borderColor}`;
    delete optimized['border-top'];
    delete optimized['border-right'];
    delete optimized['border-bottom'];
    delete optimized['border-left'];
    delete optimized['border-width'];
    delete optimized['border-style'];
    delete optimized['border-color'];
  }

  return optimized;
}

/**
 * Spacing 최적화 (margin, padding)
 */
function optimizeSpacing(
  properties: Record<string, string>,
  top: string,
  right: string,
  bottom: string,
  left: string
): string | null {
  const t = properties[top];
  const r = properties[right];
  const b = properties[bottom];
  const l = properties[left];

  if (!t || !r || !b || !l) {
    return null;
  }

  // 모두 같으면
  if (t === r && r === b && b === l) {
    return t;
  }

  // 상하, 좌우가 같으면
  if (t === b && r === l) {
    return `${t} ${r}`;
  }

  // 좌우가 같으면
  if (r === l) {
    return `${t} ${r} ${b}`;
  }

  // 모두 다르면
  return `${t} ${r} ${b} ${l}`;
}
```
- **완료 조건**: CSS, SCSS, JS 객체 형식으로 생성 가능

### Task #3.17: 색상 형식 변환
- **파일**: `src/utils/cssScan/colorConverter.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * RGB 색상 파싱
 */
export function parseRGB(rgb: string): { r: number; g: number; b: number; a?: number } | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

  if (!match) {
    return null;
  }

  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : undefined,
  };
}

/**
 * RGB to HEX 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * HEX to RGB 변환
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB to HSL 변환
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * 색상 형식 변환
 */
export function convertColorFormat(
  color: string,
  format: 'hex' | 'rgb' | 'hsl'
): string {
  // RGB 형식인 경우
  const rgb = parseRGB(color);

  if (rgb) {
    if (format === 'hex') {
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    if (format === 'hsl') {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    return color; // 이미 RGB
  }

  // HEX 형식인 경우
  if (color.startsWith('#')) {
    const rgbValues = hexToRgb(color);
    if (!rgbValues) {
      return color;
    }

    if (format === 'rgb') {
      return `rgb(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b})`;
    }
    if (format === 'hsl') {
      const hsl = rgbToHsl(rgbValues.r, rgbValues.g, rgbValues.b);
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }
    return color; // 이미 HEX
  }

  return color; // 변환 불가능
}

/**
 * 스타일 객체의 모든 색상 변환
 */
export function convertAllColors(
  styles: Record<string, string>,
  format: 'hex' | 'rgb' | 'hsl'
): Record<string, string> {
  const converted: Record<string, string> = {};

  Object.entries(styles).forEach(([property, value]) => {
    // 색상 관련 속성인지 확인
    if (
      property.includes('color') ||
      property.includes('background') ||
      property.includes('border')
    ) {
      converted[property] = convertColorFormat(value, format);
    } else {
      converted[property] = value;
    }
  });

  return converted;
}
```
- **완료 조건**: 색상 형식 변환 정상 동작

### Task #3.18: CSS 최적화 유틸리티
- **파일**: `src/utils/cssScan/optimizer.ts`
- **시간**: 30분
- **의존성**: Task #3.16
- **상세 내용**:
```typescript
/**
 * 중복 속성 제거
 */
export function removeDuplicateProperties(
  properties: Record<string, string>
): Record<string, string> {
  // 이미 Record 타입이므로 중복은 자동으로 제거됨
  return { ...properties };
}

/**
 * 기본값 속성 제거
 */
export function removeDefaultValues(
  properties: Record<string, string>
): Record<string, string> {
  const nonDefaults: Record<string, string> = {};

  const defaults: Record<string, string> = {
    'display': 'block',
    'position': 'static',
    'visibility': 'visible',
    'overflow': 'visible',
    'float': 'none',
    'clear': 'none',
  };

  Object.entries(properties).forEach(([property, value]) => {
    if (defaults[property] !== value) {
      nonDefaults[property] = value;
    }
  });

  return nonDefaults;
}

/**
 * 단축 속성으로 변환
 */
export function useShorthandProperties(
  properties: Record<string, string>
): Record<string, string> {
  return optimizeCSS(properties);
}

/**
 * CSS 속성 정렬
 */
export function sortProperties(
  properties: Record<string, string>,
  order: 'alphabetical' | 'category' = 'alphabetical'
): Record<string, string> {
  if (order === 'alphabetical') {
    return Object.keys(properties)
      .sort()
      .reduce((acc, key) => {
        acc[key] = properties[key];
        return acc;
      }, {} as Record<string, string>);
  }

  // Category order
  const categoryOrder = [
    'display',
    'position',
    'width',
    'height',
    'margin',
    'padding',
    'border',
    'background',
    'color',
    'font',
    'text',
  ];

  return Object.keys(properties)
    .sort((a, b) => {
      const aIndex = categoryOrder.findIndex((cat) => a.startsWith(cat));
      const bIndex = categoryOrder.findIndex((cat) => b.startsWith(cat));

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    })
    .reduce((acc, key) => {
      acc[key] = properties[key];
      return acc;
    }, {} as Record<string, string>);
}

// optimizeCSS 함수는 codeGenerator.ts에서 가져옴
import { optimizeCSS } from './codeGenerator';
```
- **완료 조건**: CSS 최적화 정상 동작

### Task #3.19: 전체 스캔 통합
- **파일**: `src/utils/cssScan/scanner.ts`
- **시간**: 45분
- **의존성**: Task #3.8-#3.15
- **상세 내용**:
```typescript
import { CSSScanResult } from '../../types/cssScan';
import { getComputedStyles, getAllComputedStyles } from './computedStyles';
import { getBoxModel } from './boxModel';
import { getCSSVariables } from './cssVariables';
import { getInheritedStyles } from './inheritedStyles';
import { getPseudoElementStyles } from './pseudoElements';
import { getCSSRules } from './cssRules';
import { categorizeProperties } from './categorizer';
import { getSelector } from '../dom/selectorGenerator';
import { getXPath } from '../dom/xpathGenerator';
import { generateUUID } from '../common/uuid';

/**
 * 요소의 전체 CSS 정보 스캔
 */
export function scanElementCSS(
  element: HTMLElement,
  options?: {
    includeAll?: boolean;
    includeInherited?: boolean;
    includePseudoElements?: boolean;
  }
): CSSScanResult {
  const {
    includeAll = false,
    includeInherited = true,
    includePseudoElements = true,
  } = options || {};

  const computedStyles = getComputedStyles(element);
  const allStyles = includeAll ? getAllComputedStyles(element) : undefined;

  return {
    id: generateUUID(),
    timestamp: Date.now(),
    element: {
      tagName: element.tagName,
      selector: getSelector(element),
      xpath: getXPath(element),
      className: element.className,
      id: element.id,
    },
    computedStyles,
    allStyles,
    boxModel: getBoxModel(element),
    cssVariables: getCSSVariables(element),
    inheritedStyles: includeInherited ? getInheritedStyles(element) : [],
    cssRules: getCSSRules(element),
    pseudoElements: includePseudoElements ? getPseudoElementStyles(element) : undefined,
    categorizedProperties: categorizeProperties(allStyles || computedStyles),
  };
}

/**
 * 간단한 스캔 (주요 정보만)
 */
export function quickScan(element: HTMLElement): Partial<CSSScanResult> {
  return {
    id: generateUUID(),
    timestamp: Date.now(),
    element: {
      tagName: element.tagName,
      selector: getSelector(element),
      xpath: getXPath(element),
    },
    computedStyles: getComputedStyles(element),
    boxModel: getBoxModel(element),
  };
}
```
- **완료 조건**: 전체 CSS 정보 정확하게 스캔

---

## Phase 3: Box Model 유틸리티 (5개 태스크, 2시간)

### Task #3.20: Box Model 시각화 데이터
- **파일**: `src/utils/cssScan/boxModelVisualizer.ts`
- **시간**: 30분
- **의존성**: Task #3.9
- **상세 내용**:
```typescript
import { BoxModel } from '../../types/cssScan';

/**
 * Box Model SVG 시각화 데이터 생성
 */
export function generateBoxModelSVG(boxModel: BoxModel): string {
  const { content, padding, border, margin } = boxModel;

  const totalWidth = 400;
  const totalHeight = 300;

  // 각 레이어의 크기 계산 (비율로)
  const scale = Math.min(
    totalWidth / boxModel.total.width,
    totalHeight / boxModel.total.height,
    1
  );

  const marginBox = {
    width: boxModel.total.width * scale,
    height: boxModel.total.height * scale,
  };

  const borderBox = {
    width: (boxModel.total.width - margin.left - margin.right) * scale,
    height: (boxModel.total.height - margin.top - margin.bottom) * scale,
  };

  const paddingBox = {
    width:
      (boxModel.total.width - margin.left - margin.right - border.left - border.right) * scale,
    height:
      (boxModel.total.height - margin.top - margin.bottom - border.top - border.bottom) * scale,
  };

  const contentBox = {
    width: content.width * scale,
    height: content.height * scale,
  };

  return `
    <svg width="${totalWidth}" height="${totalHeight}">
      <!-- Margin -->
      <rect
        x="${(totalWidth - marginBox.width) / 2}"
        y="${(totalHeight - marginBox.height) / 2}"
        width="${marginBox.width}"
        height="${marginBox.height}"
        fill="#f59e0b"
        opacity="0.3"
      />

      <!-- Border -->
      <rect
        x="${(totalWidth - borderBox.width) / 2}"
        y="${(totalHeight - borderBox.height) / 2}"
        width="${borderBox.width}"
        height="${borderBox.height}"
        fill="#ef4444"
        opacity="0.3"
      />

      <!-- Padding -->
      <rect
        x="${(totalWidth - paddingBox.width) / 2}"
        y="${(totalHeight - paddingBox.height) / 2}"
        width="${paddingBox.width}"
        height="${paddingBox.height}"
        fill="#10b981"
        opacity="0.3"
      />

      <!-- Content -->
      <rect
        x="${(totalWidth - contentBox.width) / 2}"
        y="${(totalHeight - contentBox.height) / 2}"
        width="${contentBox.width}"
        height="${contentBox.height}"
        fill="#3b82f6"
        opacity="0.3"
      />
    </svg>
  `;
}

/**
 * Box Model 레이블 데이터 생성
 */
export function getBoxModelLabels(boxModel: BoxModel) {
  return {
    margin: {
      top: `${boxModel.margin.top}px`,
      right: `${boxModel.margin.right}px`,
      bottom: `${boxModel.margin.bottom}px`,
      left: `${boxModel.margin.left}px`,
    },
    border: {
      top: `${boxModel.border.top}px`,
      right: `${boxModel.border.right}px`,
      bottom: `${boxModel.border.bottom}px`,
      left: `${boxModel.border.left}px`,
    },
    padding: {
      top: `${boxModel.padding.top}px`,
      right: `${boxModel.padding.right}px`,
      bottom: `${boxModel.padding.bottom}px`,
      left: `${boxModel.padding.left}px`,
    },
    content: {
      width: `${boxModel.content.width}px`,
      height: `${boxModel.content.height}px`,
    },
  };
}
```
- **완료 조건**: Box Model SVG 생성

### Task #3.21: 위치 정보 추출
- **파일**: `src/utils/cssScan/positionInfo.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 요소 위치 정보 추출
 */
export interface PositionInfo {
  position: string;
  coordinates: {
    top: string | null;
    right: string | null;
    bottom: string | null;
    left: string | null;
  };
  zIndex: string;
  offsetParent: string | null;
  absolutePosition: {
    x: number;
    y: number;
  };
}

export function getPositionInfo(element: HTMLElement): PositionInfo {
  const computedStyle = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return {
    position: computedStyle.position,
    coordinates: {
      top: computedStyle.top !== 'auto' ? computedStyle.top : null,
      right: computedStyle.right !== 'auto' ? computedStyle.right : null,
      bottom: computedStyle.bottom !== 'auto' ? computedStyle.bottom : null,
      left: computedStyle.left !== 'auto' ? computedStyle.left : null,
    },
    zIndex: computedStyle.zIndex,
    offsetParent: element.offsetParent?.tagName || null,
    absolutePosition: {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    },
  };
}
```
- **완료 조건**: 위치 정보 정확 추출

### Task #3.22: Transform 정보
- **파일**: `src/utils/cssScan/transformInfo.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Transform 정보 파싱
 */
export interface TransformInfo {
  raw: string;
  matrix: number[] | null;
  translate: { x: number; y: number } | null;
  scale: { x: number; y: number } | null;
  rotate: number | null;
  skew: { x: number; y: number } | null;
}

export function getTransformInfo(element: HTMLElement): TransformInfo {
  const computedStyle = window.getComputedStyle(element);
  const transform = computedStyle.transform;

  if (!transform || transform === 'none') {
    return {
      raw: 'none',
      matrix: null,
      translate: null,
      scale: null,
      rotate: null,
      skew: null,
    };
  }

  return {
    raw: transform,
    matrix: parseMatrix(transform),
    translate: parseTranslate(transform),
    scale: parseScale(transform),
    rotate: parseRotate(transform),
    skew: parseSkew(transform),
  };
}

function parseMatrix(transform: string): number[] | null {
  const match = transform.match(/matrix\(([^)]+)\)/);
  return match ? match[1].split(',').map(Number) : null;
}

function parseTranslate(transform: string): { x: number; y: number } | null {
  const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  return match
    ? {
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
      }
    : null;
}

function parseScale(transform: string): { x: number; y: number } | null {
  const match = transform.match(/scale\(([^,]+)(?:,\s*([^)]+))?\)/);
  return match
    ? {
        x: parseFloat(match[1]),
        y: match[2] ? parseFloat(match[2]) : parseFloat(match[1]),
      }
    : null;
}

function parseRotate(transform: string): number | null {
  const match = transform.match(/rotate\(([^)]+)\)/);
  return match ? parseFloat(match[1]) : null;
}

function parseSkew(transform: string): { x: number; y: number } | null {
  const match = transform.match(/skew\(([^,]+)(?:,\s*([^)]+))?\)/);
  return match
    ? {
        x: parseFloat(match[1]),
        y: match[2] ? parseFloat(match[2]) : 0,
      }
    : null;
}
```
- **완료 조건**: Transform 정보 파싱

### Task #3.23: Flexbox 정보
- **파일**: `src/utils/cssScan/flexboxInfo.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Flexbox 정보 추출
 */
export interface FlexboxInfo {
  isFlexContainer: boolean;
  isFlexItem: boolean;
  container?: {
    flexDirection: string;
    flexWrap: string;
    justifyContent: string;
    alignItems: string;
    alignContent: string;
    gap: string;
  };
  item?: {
    flex: string;
    flexGrow: string;
    flexShrink: string;
    flexBasis: string;
    alignSelf: string;
    order: string;
  };
}

export function getFlexboxInfo(element: HTMLElement): FlexboxInfo {
  const computedStyle = window.getComputedStyle(element);
  const isFlexContainer = computedStyle.display === 'flex' || computedStyle.display === 'inline-flex';

  const parent = element.parentElement;
  const parentStyle = parent ? window.getComputedStyle(parent) : null;
  const isFlexItem = parentStyle?.display === 'flex' || parentStyle?.display === 'inline-flex';

  const info: FlexboxInfo = {
    isFlexContainer,
    isFlexItem,
  };

  if (isFlexContainer) {
    info.container = {
      flexDirection: computedStyle.flexDirection,
      flexWrap: computedStyle.flexWrap,
      justifyContent: computedStyle.justifyContent,
      alignItems: computedStyle.alignItems,
      alignContent: computedStyle.alignContent,
      gap: computedStyle.gap,
    };
  }

  if (isFlexItem) {
    info.item = {
      flex: computedStyle.flex,
      flexGrow: computedStyle.flexGrow,
      flexShrink: computedStyle.flexShrink,
      flexBasis: computedStyle.flexBasis,
      alignSelf: computedStyle.alignSelf,
      order: computedStyle.order,
    };
  }

  return info;
}
```
- **완료 조건**: Flexbox 정보 추출

### Task #3.24: Grid 정보
- **파일**: `src/utils/cssScan/gridInfo.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Grid 정보 추출
 */
export interface GridInfo {
  isGridContainer: boolean;
  isGridItem: boolean;
  container?: {
    gridTemplateColumns: string;
    gridTemplateRows: string;
    gridTemplateAreas: string;
    gridGap: string;
    gridAutoFlow: string;
    gridAutoColumns: string;
    gridAutoRows: string;
  };
  item?: {
    gridColumn: string;
    gridRow: string;
    gridArea: string;
    justifySelf: string;
    alignSelf: string;
  };
}

export function getGridInfo(element: HTMLElement): GridInfo {
  const computedStyle = window.getComputedStyle(element);
  const isGridContainer = computedStyle.display === 'grid' || computedStyle.display === 'inline-grid';

  const parent = element.parentElement;
  const parentStyle = parent ? window.getComputedStyle(parent) : null;
  const isGridItem = parentStyle?.display === 'grid' || parentStyle?.display === 'inline-grid';

  const info: GridInfo = {
    isGridContainer,
    isGridItem,
  };

  if (isGridContainer) {
    info.container = {
      gridTemplateColumns: computedStyle.gridTemplateColumns,
      gridTemplateRows: computedStyle.gridTemplateRows,
      gridTemplateAreas: computedStyle.gridTemplateAreas,
      gridGap: computedStyle.gridGap || computedStyle.gap,
      gridAutoFlow: computedStyle.gridAutoFlow,
      gridAutoColumns: computedStyle.gridAutoColumns,
      gridAutoRows: computedStyle.gridAutoRows,
    };
  }

  if (isGridItem) {
    info.item = {
      gridColumn: computedStyle.gridColumn,
      gridRow: computedStyle.gridRow,
      gridArea: computedStyle.gridArea,
      justifySelf: computedStyle.justifySelf,
      alignSelf: computedStyle.alignSelf,
    };
  }

  return info;
}
```
- **완료 조건**: Grid 정보 추출

---

## Phase 4: Storage 및 상태 관리 (3개 태스크, 1.5시간)

### Task #3.25: Storage 기본 CRUD 훅
- **파일**: `src/hooks/cssScan/useCSSScanStorage.ts`
- **시간**: 45분
- **의존성**: Task #3.1, #3.3
- **상세 내용**:
```typescript
import { useState, useEffect } from 'react';
import { CSSScanResult, CSSScanHistory } from '../../types/cssScan';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';

export function useCSSScanStorage() {
  const [scans, setScans] = useState<CSSScanResult[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadHistory();
  }, []);

  /**
   * 히스토리 로드
   */
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(STORAGE_KEYS.CSS_SCAN_HISTORY);
      const history: CSSScanHistory = result[STORAGE_KEYS.CSS_SCAN_HISTORY] || {
        scans: [],
        maxSize: STORAGE_LIMITS.CSS_SCAN_MAX_HISTORY,
        totalScans: 0,
        lastScanTime: 0,
      };

      setScans(history.scans);
      setTotalScans(history.totalScans);
      setLastScanTime(history.lastScanTime);
    } catch (error) {
      console.error('Failed to load CSS scan history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 스캔 추가
   */
  const addScan = async (scan: CSSScanResult): Promise<void> => {
    try {
      const newScans = [scan, ...scans].slice(0, STORAGE_LIMITS.CSS_SCAN_MAX_HISTORY);
      const newTotalScans = totalScans + 1;
      const newLastScanTime = Date.now();

      const history: CSSScanHistory = {
        scans: newScans,
        maxSize: STORAGE_LIMITS.CSS_SCAN_MAX_HISTORY,
        totalScans: newTotalScans,
        lastScanTime: newLastScanTime,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_HISTORY]: history,
      });

      setScans(newScans);
      setTotalScans(newTotalScans);
      setLastScanTime(newLastScanTime);
    } catch (error) {
      console.error('Failed to add scan:', error);
      throw error;
    }
  };

  /**
   * 스캔 삭제
   */
  const removeScan = async (scanId: string): Promise<void> => {
    try {
      const newScans = scans.filter((scan) => scan.id !== scanId);

      const history: CSSScanHistory = {
        scans: newScans,
        maxSize: STORAGE_LIMITS.CSS_SCAN_MAX_HISTORY,
        totalScans,
        lastScanTime,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_HISTORY]: history,
      });

      setScans(newScans);
    } catch (error) {
      console.error('Failed to remove scan:', error);
      throw error;
    }
  };

  /**
   * 히스토리 전체 삭제
   */
  const clearHistory = async (): Promise<void> => {
    try {
      const history: CSSScanHistory = {
        scans: [],
        maxSize: STORAGE_LIMITS.CSS_SCAN_MAX_HISTORY,
        totalScans: 0,
        lastScanTime: 0,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_HISTORY]: history,
      });

      setScans([]);
      setTotalScans(0);
      setLastScanTime(0);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  };

  /**
   * 특정 스캔 가져오기
   */
  const getScan = (scanId: string): CSSScanResult | undefined => {
    return scans.find((scan) => scan.id === scanId);
  };

  return {
    scans,
    totalScans,
    lastScanTime,
    isLoading,
    addScan,
    removeScan,
    clearHistory,
    getScan,
    reload: loadHistory,
  };
}
```
- **완료 조건**: CRUD 동작 정상

### Task #3.26: 즐겨찾기 관리
- **파일**: `src/hooks/cssScan/useCSSScanFavorites.ts`
- **시간**: 30분
- **의존성**: Task #3.1, #3.3
- **상세 내용**:
```typescript
import { useState, useEffect } from 'react';
import { FavoriteStyle } from '../../types/cssScan';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { generateUUID } from '../../utils/common/uuid';

export function useCSSScanFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * 즐겨찾기 로드
   */
  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(STORAGE_KEYS.CSS_SCAN_FAVORITES);
      const favs: FavoriteStyle[] = result[STORAGE_KEYS.CSS_SCAN_FAVORITES] || [];
      setFavorites(favs);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 즐겨찾기 추가
   */
  const addFavorite = async (
    name: string,
    styles: any,
    description?: string,
    tags?: string[]
  ): Promise<void> => {
    try {
      const newFavorite: FavoriteStyle = {
        id: generateUUID(),
        name,
        description,
        styles,
        createdAt: Date.now(),
        tags,
      };

      const newFavorites = [...favorites, newFavorite].slice(
        0,
        STORAGE_LIMITS.CSS_SCAN_MAX_FAVORITES
      );

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  };

  /**
   * 즐겨찾기 삭제
   */
  const removeFavorite = async (favoriteId: string): Promise<void> => {
    try {
      const newFavorites = favorites.filter((fav) => fav.id !== favoriteId);

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  };

  /**
   * 즐겨찾기 수정
   */
  const updateFavorite = async (
    favoriteId: string,
    updates: Partial<FavoriteStyle>
  ): Promise<void> => {
    try {
      const newFavorites = favorites.map((fav) =>
        fav.id === favoriteId ? { ...fav, ...updates } : fav
      );

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_FAVORITES]: newFavorites,
      });

      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to update favorite:', error);
      throw error;
    }
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    updateFavorite,
    reload: loadFavorites,
  };
}
```
- **완료 조건**: 즐겨찾기 CRUD 정상

### Task #3.27: 설정 관리 훅
- **파일**: `src/hooks/cssScan/useCSSScanSettings.ts`
- **시간**: 15분
- **의존성**: Task #3.1, #3.7
- **상세 내용**:
```typescript
import { useState, useEffect } from 'react';
import { CSSScanSettings } from '../../types/cssScan';
import { STORAGE_KEYS } from '../../constants/storage';
import { DEFAULT_CSS_SCAN_SETTINGS } from '../../constants/defaults';

export function useCSSScanSettings() {
  const [settings, setSettings] = useState<CSSScanSettings>(DEFAULT_CSS_SCAN_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * 설정 로드
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(STORAGE_KEYS.CSS_SCAN_SETTINGS);
      const saved: CSSScanSettings = result[STORAGE_KEYS.CSS_SCAN_SETTINGS] || DEFAULT_CSS_SCAN_SETTINGS;
      setSettings(saved);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 설정 저장
   */
  const updateSettings = async (newSettings: Partial<CSSScanSettings>): Promise<void> => {
    try {
      const updated = { ...settings, ...newSettings };

      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_SETTINGS]: updated,
      });

      setSettings(updated);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  /**
   * 설정 초기화
   */
  const resetSettings = async (): Promise<void> => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CSS_SCAN_SETTINGS]: DEFAULT_CSS_SCAN_SETTINGS,
      });

      setSettings(DEFAULT_CSS_SCAN_SETTINGS);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    reload: loadSettings,
  };
}
```
- **완료 조건**: 설정 관리 정상

---

## Phase 5: React 컴포넌트 (8개 태스크, 4시간)

### Task #3.28: CSSScanPanel 메인 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/CSSScanPanel.tsx`
- **시간**: 45분
- **의존성**: Task #3.25-#3.27
- **상세 내용**: TextEditorPanel과 유사한 구조로 작성
- **완료 조건**: 메인 패널 동작 정상

### Task #3.29: BoxModelViewer 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/BoxModelViewer.tsx`
- **시간**: 45분
- **의존성**: Task #3.20
- **상세 내용**: Box Model 시각화 UI
- **완료 조건**: 시각화 렌더링 정상

### Task #3.30: ComputedStylesList 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/ComputedStylesList.tsx`
- **시간**: 30분
- **의존성**: Task #3.8
- **상세 내용**: Computed styles 목록 표시
- **완료 조건**: 리스트 렌더링 정상

### Task #3.31: CSSCodeBlock 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/CSSCodeBlock.tsx`
- **시간**: 30분
- **의존성**: Task #3.16
- **상세 내용**: Syntax highlighting된 CSS 코드 블록
- **완료 조건**: 코드 표시 및 복사 기능 정상

### Task #3.32: CSSVariablesList 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/CSSVariablesList.tsx`
- **시간**: 15분
- **의존성**: Task #3.10
- **상세 내용**: CSS 변수 목록
- **완료 조건**: 변수 목록 표시

### Task #3.33: InheritedStylesTree 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/InheritedStylesTree.tsx`
- **시간**: 30분
- **의존성**: Task #3.11
- **상세 내용**: 상속 스타일 트리 구조
- **완료 조건**: 트리 렌더링 정상

### Task #3.34: CSSRulesList 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/CSSRulesList.tsx`
- **시간**: 30분
- **의존성**: Task #3.13
- **상세 내용**: CSS 규칙 목록
- **완료 조건**: 규칙 목록 및 우선순위 표시

### Task #3.35: FilterControls 컴포넌트
- **파일**: `src/sidepanel/components/CSSScan/FilterControls.tsx`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**: 카테고리 필터 컨트롤
- **완료 조건**: 필터 동작 정상

---

## Phase 6: Content Script 통합 (4개 태스크, 2시간)

### Task #3.36: Content Script 이벤트 리스너
- **파일**: `src/content/cssScan/eventListeners.ts`
- **시간**: 45분
- **의존성**: Task #3.19
- **상세 내용**: 호버 및 클릭 이벤트 처리
- **완료 조건**: 이벤트 리스너 정상 동작

### Task #3.37: 메시지 핸들러
- **파일**: `src/content/cssScan/messageHandler.ts`
- **시간**: 30분
- **의존성**: Task #3.4
- **상세 내용**: 메시지 처리
- **완료 조건**: 메시지 처리 정상

### Task #3.38: 오버레이 스타일 주입
- **파일**: `src/content/cssScan/styles.ts`
- **시간**: 30분
- **의존성**: Task #3.5
- **상세 내용**: Hover 및 하이라이트 스타일
- **완료 조건**: 스타일 적용 정상

### Task #3.39: Side Panel 통신
- **파일**: `src/content/cssScan/communication.ts`
- **시간**: 15분
- **의존성**: Task #3.4
- **상세 내용**: Side Panel과 통신
- **완료 조건**: 통신 정상

---

## Phase 7: 테스트 및 최적화 (1개 태스크, 1시간)

### Task #3.40: 단위 및 통합 테스트
- **파일**: `src/utils/cssScan/__tests__/cssScan.test.ts`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크
- **상세 내용**: 80% 이상 테스트 커버리지
- **완료 조건**: 모든 테스트 통과

---

## 완료 체크리스트

- [ ] Phase 1: 기반 설정 (7개 태스크)
  - [ ] Task #3.1: 타입 정의
  - [ ] Task #3.2: CSS 속성 상수
  - [ ] Task #3.3: Storage 키
  - [ ] Task #3.4: 메시지 액션
  - [ ] Task #3.5: CSS 클래스
  - [ ] Task #3.6: 에러 메시지
  - [ ] Task #3.7: 기본 설정

- [ ] Phase 2: CSS 추출 유틸리티 (12개 태스크)
  - [ ] Task #3.8: Computed Styles
  - [ ] Task #3.9: Box Model
  - [ ] Task #3.10: CSS 변수
  - [ ] Task #3.11: Inherited Styles
  - [ ] Task #3.12: Pseudo Elements
  - [ ] Task #3.13: CSS Rules
  - [ ] Task #3.14: Specificity
  - [ ] Task #3.15: 속성 분류
  - [ ] Task #3.16: 코드 생성
  - [ ] Task #3.17: 색상 변환
  - [ ] Task #3.18: CSS 최적화
  - [ ] Task #3.19: 전체 스캔 통합

- [ ] Phase 3: Box Model 유틸리티 (5개 태스크)
  - [ ] Task #3.20: Box Model 시각화
  - [ ] Task #3.21: 위치 정보
  - [ ] Task #3.22: Transform 정보
  - [ ] Task #3.23: Flexbox 정보
  - [ ] Task #3.24: Grid 정보

- [ ] Phase 4: Storage 및 상태 관리 (3개 태스크)
  - [ ] Task #3.25: Storage CRUD
  - [ ] Task #3.26: 즐겨찾기
  - [ ] Task #3.27: 설정 관리

- [ ] Phase 5: React 컴포넌트 (8개 태스크)
  - [ ] Task #3.28: CSSScanPanel
  - [ ] Task #3.29: BoxModelViewer
  - [ ] Task #3.30: ComputedStylesList
  - [ ] Task #3.31: CSSCodeBlock
  - [ ] Task #3.32: CSSVariablesList
  - [ ] Task #3.33: InheritedStylesTree
  - [ ] Task #3.34: CSSRulesList
  - [ ] Task #3.35: FilterControls

- [ ] Phase 6: Content Script 통합 (4개 태스크)
  - [ ] Task #3.36: 이벤트 리스너
  - [ ] Task #3.37: 메시지 핸들러
  - [ ] Task #3.38: 스타일 주입
  - [ ] Task #3.39: Side Panel 통신

- [ ] Phase 7: 테스트 및 최적화 (1개 태스크)
  - [ ] Task #3.40: 단위 및 통합 테스트

---

**다음 단계**: 도구 #4 (페이지 검색 및 강조) 구현
