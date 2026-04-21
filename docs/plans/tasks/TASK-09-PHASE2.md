# Phase 2: Tailwind 감지

**태스크**: 10개
**예상 시간**: 5시간
**의존성**: Phase 1 완료

---

### Task #9.7: Tailwind 클래스 유효성 검사

- **파일**: `src/utils/tailwind/isTailwindClass.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { TailwindVersion } from '../../types/tailwindScanner';

/**
 * Tailwind v3 유틸리티 클래스 패턴
 */
const TAILWIND_PATTERNS = {
  // 스페이싱
  spacing: /^(p|m)[trblxy]?-?\[?[\w.-]+\]?$/,

  // 사이징
  sizing: /^(w|h|min-w|max-w|min-h|max-h)-?\[?[\w.-]+\]?$/,

  // 타이포그래피
  typography: /^(text|font|leading|tracking)-?\[?[\w/-]+\]?$/,

  // 배경
  background: /^bg-?\[?[\w/-]+\]?$/,

  // 보더
  border: /^border-?\[?[\w/-]+\]?$/,
  rounded: /^rounded-?\[?[\w/-]+\]?$/,

  // 레이아웃
  display: /^(flex|grid|block|inline|hidden|table)$/,
  position: /^(static|fixed|absolute|relative|sticky)$/,

  // Flexbox
  flexbox: /^(flex|items|justify|gap)-?\[?[\w.-]+\]?$/,

  // Grid
  grid: /^grid-?\[?[\w.-]+\]?$/,
  cols: /^cols-?\[?\d+\]?$/,

  // 효과
  effects: /^(shadow|opacity)-?\[?[\w.-]+\]?$/,

  // 필터
  filters: /^(blur|brightness|contrast)-?\[?[\w.-]+\]?$/,

  // 트랜지션
  transition: /^transition-?\[?[\w.-]+\]?$/,
  transform: /^-?translate-?\[?[\w.-]+\]?$/,
  scale: /^scale-?\[?[\w.-]+\]?$/,
  rotate: /^rotate-?\[?[\w.-]+\]?$/,

  // 인터랙티브
  interactive: /^(hover|focus|active|visited)-[\w-]+$/,
} as const;

/**
 * 클래스가 Tailwind 클래스인지 확인
 */
export function isTailwindClass(className: string, version: TailwindVersion = 'v3'): boolean {
  if (!className || typeof className !== 'string') {
    return false;
  }

  // 공백 제거
  const trimmed = className.trim();

  if (trimmed.length === 0) {
    return false;
  }

  // 임의 값 패턴 체크 (예: w-[123px])
  if (isArbitraryValue(trimmed)) {
    return true;
  }

  // 각 패턴 체크
  for (const pattern of Object.values(TAILWIND_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // 접두사 제거 후 재체크 (responsive, hover 등)
  const withoutPrefix = trimmed.replace(/^(hover|focus|active|sm|md|lg|xl|2xl):/, '');
  if (withoutPrefix !== trimmed) {
    return isTailwindClass(withoutPrefix, version);
  }

  return false;
}

/**
 * 임의 값 사용인지 확인
 */
export function isArbitraryValue(className: string): boolean {
  return /\[.+\]/.test(className);
}

/**
 * Dark mode 클래스인지 확인
 */
export function isDarkModeClass(className: string): boolean {
  return className.startsWith('dark:');
}

/**
 * Responsive 클래스인지 확인
 */
export function isResponsiveClass(className: string): boolean {
  return /^(sm|md|lg|xl|2xl):/.test(className);
}

/**
 * 상태 클래스인지 확인
 */
export function isStateClass(className: string): boolean {
  return /^(hover|focus|active|visited|group-hover|group-focus):/.test(className);
}
```
- **테스트 케이스**:
  - 유효한 Tailwind 클래스들
  - 유효하지 않은 클래스들
  - 임의 값 패턴
  - Responsive/State/Dark mode 접두사
- **완료 조건**: 모든 테스트 통과, 정확한 유효성 검사

---

### Task #9.8: Tailwind 클래스 추출

- **파일**: `src/utils/tailwind/extractTailwindClasses.ts`
- **시간**: 30분
- **의존성**: Task #9.7
- **상세 내용**:
```typescript
import { isTailwindClass } from './isTailwindClass';

/**
 * 클래스 문자열에서 Tailwind 클래스 추출
 */
export function extractTailwindClasses(classString: string | undefined): {
  tailwind: string[];
  custom: string[];
  invalid: string[];
} {
  const result = {
    tailwind: [] as string[],
    custom: [] as string[],
    invalid: [] as string[],
  };

  if (!classString || typeof classString !== 'string') {
    return result;
  }

  const classes = classString.split(/\s+/).filter(Boolean);

  for (const className of classes) {
    if (isTailwindClass(className)) {
      result.tailwind.push(className);
    } else if (isValidClassName(className)) {
      result.custom.push(className);
    } else {
      result.invalid.push(className);
    }
  }

  return result;
}

/**
 * 유효한 CSS 클래스명인지 확인
 */
function isValidClassName(className: string): boolean {
  // CSS 클래스명 규칙: 문자, 숫자, 하이픈, 언더스코어만 허용
  return /^[\w-]+$/.test(className) && !/^\d/.test(className);
}

/**
 * 중복 제거
 */
export function deduplicateClasses(classes: string[]): string[] {
  return Array.from(new Set(classes));
}

/**
 * 클래스 정렬 (추천 순서)
 */
export function sortClasses(classes: string[]): string[] {
  const order = [
    'layout',      // flex, grid, etc
    'position',    // relative, absolute
    'sizing',      // w, h
    'spacing',     // p, m
    'typography',  // text, font
    'background',  // bg
    'border',      // border, rounded
    'effects',     // shadow, opacity
  ];

  return classes.sort((a, b) => {
    const orderA = getOrderIndex(a, order);
    const orderB = getOrderIndex(b, order);
    return orderA - orderB;
  });
}

function getOrderIndex(className: string, order: string[]): number {
  for (let i = 0; i < order.length; i++) {
    if (className.startsWith(order[i]) || className.includes(order[i])) {
      return i;
    }
  }
  return order.length;
}
```
- **테스트 케이스**:
  - 다양한 클래스 문자열
  - 빈 문자열/undefined 처리
  - 중복 제거
  - 정렬
- **완료 조건**: 정확한 추출 및 분류

---

### Task #9.9: Tailwind 버전 감지

- **파일**: `src/utils/tailwind/detectTailwindVersion.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { TailwindVersion } from '../../types/tailwindScanner';

/**
 * 페이지에서 Tailwind 버전 감지
 */
export function detectTailwindVersion(): TailwindVersion {
  // 1. CDN 사용 체크
  const cdnVersion = detectFromCDN();
  if (cdnVersion !== 'unknown') {
    return cdnVersion;
  }

  // 2. Build 결과물 체크
  const buildVersion = detectFromBuild();
  if (buildVersion !== 'unknown') {
    return buildVersion;
  }

  // 3. 클래스 패턴 분석
  const patternVersion = detectFromPattern();
  if (patternVersion !== 'unknown') {
    return patternVersion;
  }

  return 'unknown';
}

/**
 * CDN에서 버전 감지
 */
function detectFromCDN(): TailwindVersion {
  const scripts = Array.from(document.querySelectorAll('script[src]'));

  for (const script of scripts) {
    const src = script.getAttribute('src') || '';

    // Tailwind CDN URL
    if (src.includes('tailwindcss')) {
      if (src.includes('@3.')) return 'v3';
      if (src.includes('@2.')) return 'v2';
      if (src.includes('@4.')) return 'v4';
    }

    // Tailwind Play CDN
    if (src.includes('cdn.tailwindcss.com')) {
      // Play CDN은 기본적으로 v3
      return 'v3';
    }
  }

  return 'unknown';
}

/**
 * Build 결과물에서 버전 감지
 */
function detectFromBuild(): TailwindVersion {
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));

  for (const style of styles) {
    let content = '';

    if (style.tagName === 'STYLE') {
      content = style.textContent || '';
    } else if (style.tagName === 'LINK') {
      const href = style.getAttribute('href') || '';
      if (href.includes('tailwind')) {
        // href에서 버전 추출 시도
        if (href.includes('@3.')) return 'v3';
        if (href.includes('@2.')) return 'v2';
        if (href.includes('@4.')) return 'v4';
      }
      continue;
    }

    // CSS 내용에서 특징적인 패턴 찾기
    if (content.includes('--tw-')) {
      // CSS 변수 사용은 v3 이상
      if (content.includes('--tw-gradient-from')) {
        return 'v3';
      }
    }
  }

  return 'unknown';
}

/**
 * 클래스 패턴에서 버전 감지
 */
function detectFromPattern(): TailwindVersion {
  const allElements = document.querySelectorAll('[class]');
  let v3Patterns = 0;
  let v2Patterns = 0;

  for (const el of allElements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      // v3 특징적 패턴
      if (/^after:|^before:|^placeholder:|^file:|^backdrop:/.test(cls)) {
        v3Patterns++;
      }

      // v2 특징적 패턴
      if (/^flex-grow|^flex-shrink|^table/.test(cls)) {
        v2Patterns++;
      }
    }
  }

  if (v3Patterns > v2Patterns) return 'v3';
  if (v2Patterns > v3Patterns) return 'v2';

  // 기본값으로 v3 가정 (가장 최신)
  return 'unknown';
}

/**
 * JIT 모드 감지
 */
export function detectJITMode(): boolean {
  // JIT 모드 특징:
  // 1. 임의 값 사용 (예: w-[123px])
  // 2. 동적 클래스 조합

  const allElements = document.querySelectorAll('[class]');
  let arbitraryValueCount = 0;

  for (const el of allElements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      if (/\[.+\]/.test(cls)) {
        arbitraryValueCount++;
      }
    }
  }

  // 임의 값이 3개 이상이면 JIT 모드로 간주
  return arbitraryValueCount >= 3;
}
```
- **완료 조건**: 정확한 버전 감지

---

### Task #9.10: Tailwind 클래스 파싱

- **파일**: `src/utils/tailwind/parseTailwindClass.ts`
- **시간**: 30분
- **의존성**: Task #9.7
- **상세 내용**:
```typescript
import { TailwindClass, ClassCategory } from '../../types/tailwindScanner';
import { isArbitraryValue, isResponsiveClass, isStateClass, isDarkModeClass } from './isTailwindClass';

/**
 * Tailwind 클래스 파싱
 */
export function parseTailwindClass(className: string): TailwindClass {
  const result: TailwindClass = {
    name: className,
    category: 'unknown',
    isValid: true,
    isArbitrary: isArbitraryValue(className),
    isCustom: false,
  };

  // 접두사 추출
  const { prefix, baseClass } = extractPrefix(className);
  result.name = baseClass;

  // 카테고리 결정
  result.category = categorizeClass(baseClass);

  // 값 추출 (임의 값의 경우)
  if (result.isArbitrary) {
    result.value = extractArbitraryValue(baseClass);
  } else {
    result.value = extractValue(baseClass);
  }

  // CSS 속성 매핑
  result.properties = mapToCSSProperties(result.category, baseClass);

  return result;
}

/**
 * 접두사 추출
 */
function extractPrefix(className: string): { prefix: string; baseClass: string } {
  const prefixes = [
    'hover:', 'focus:', 'active:', 'visited:',
    'group-hover:', 'group-focus:',
    'dark:',
    'sm:', 'md:', 'lg:', 'xl:', '2xl:',
  ];

  for (const prefix of prefixes) {
    if (className.startsWith(prefix)) {
      return { prefix, baseClass: className.slice(prefix.length) };
    }
  }

  return { prefix: '', baseClass: className };
}

/**
 * 카테고리 분류
 */
function categorizeClass(className: string): ClassCategory {
  const categoryMap: Record<string, ClassCategory> = {
    // 레이아웃
    display: 'layout',
    position: 'layout',
    top: 'layout',
    right: 'layout',
    bottom: 'layout',
    left: 'layout',

    // Flexbox
    flex: 'flexbox',
    items: 'flexbox',
    justify: 'flexbox',
    gap: 'flexbox',

    // Grid
    grid: 'grid',
    cols: 'grid',
    row: 'grid',

    // 스페이싱
    p: 'spacing',
    m: 'spacing',
    space: 'spacing',

    // 사이징
    w: 'sizing',
    h: 'sizing',
    max: 'sizing',
    min: 'sizing',

    // 타이포그래피
    text: 'typography',
    font: 'typography',
    leading: 'typography',
    tracking: 'typography',

    // 배경
    bg: 'background',

    // 보더
    border: 'borders',
    rounded: 'borders',

    // 효과
    shadow: 'effects',
    opacity: 'effects',

    // 필터
    blur: 'filters',
    brightness: 'filters',
    contrast: 'filters',

    // 트랜지션
    transition: 'transitions',
    transform: 'transitions',
    scale: 'transitions',
    rotate: 'transitions',
    translate: 'transitions',
  };

  const base = className.split('-')[0];

  for (const [key, category] of Object.entries(categoryMap)) {
    if (base.startsWith(key)) {
      return category;
    }
  }

  return 'unknown';
}

/**
 * 임의 값 추출
 */
function extractArbitraryValue(className: string): string | undefined {
  const match = className.match(/\[(.+)\]/);
  return match ? match[1] : undefined;
}

/**
 * 일반 값 추출
 */
function extractValue(className: string): string | undefined {
  const parts = className.split('-');
  return parts.length > 1 ? parts.slice(1).join('-') : undefined;
}

/**
 * CSS 속성 매핑
 */
function mapToCSSProperties(category: ClassCategory, className: string): string[] {
  const propertyMap: Record<ClassCategory, Record<string, string[]>> = {
    layout: {
      flex: ['display'],
      block: ['display'],
      inline: ['display'],
      grid: ['display'],
      hidden: ['display'],
      relative: ['position'],
      absolute: ['position'],
      fixed: ['position'],
      sticky: ['position'],
    },
    flexbox: {
      'flex-row': ['flex-direction'],
      gap: ['gap'],
      'items-center': ['align-items'],
      'justify-center': ['justify-content'],
    },
    grid: {
      'grid-cols': ['grid-template-columns'],
      'grid-rows': ['grid-template-rows'],
    },
    spacing: {
      p: ['padding'],
      px: ['padding-left', 'padding-right'],
      py: ['padding-top', 'padding-bottom'],
      pt: ['padding-top'],
      pr: ['padding-right'],
      pb: ['padding-bottom'],
      pl: ['padding-left'],
      m: ['margin'],
      mx: ['margin-left', 'margin-right'],
      my: ['margin-top', 'margin-bottom'],
      mt: ['margin-top'],
      mr: ['margin-right'],
      mb: ['margin-bottom'],
      ml: ['margin-left'],
    },
    sizing: {
      w: ['width'],
      h: ['height'],
      'max-w': ['max-width'],
      'max-h': ['max-height'],
    },
    typography: {
      text: ['color'],
      'font-size': ['font-size'],
      'font-weight': ['font-weight'],
      leading: ['line-height'],
      tracking: ['letter-spacing'],
    },
    background: {
      bg: ['background-color'],
    },
    borders: {
      border: ['border-width', 'border-style', 'border-color'],
      rounded: ['border-radius'],
    },
    effects: {
      shadow: ['box-shadow'],
      opacity: ['opacity'],
    },
    filters: {
      blur: ['filter'],
      brightness: ['filter'],
    },
    transitions: {
      transition: ['transition'],
    },
    interactivity: {
      'hover:': [],
      'focus:': [],
    },
    tables: {},
    unknown: {},
  };

  const categoryMap = propertyMap[category] || {};
  const properties: string[] = [];

  for (const [key, props] of Object.entries(categoryMap)) {
    if (className.startsWith(key)) {
      properties.push(...props);
    }
  }

  return properties;
}
```
- **완료 조건**: 정확한 파싱 및 카테고리 분류

---

### Task #9.11: Tailwind 클래스 카테고리 분석

- **파일**: `src/utils/tailwind/categorizeTailwindClass.ts`
- **시간**: 30분
- **의존성**: Task #9.10
- **상세 내용**:
```typescript
import { TailwindClass, ClassCategory } from '../../types/tailwindScanner';

/**
 * 다중 클래스 카테고리 분석
 */
export function categorizeTailwindClasses(classes: string[]): {
  byCategory: Record<ClassCategory, TailwindClass[]>;
  categoryStats: Record<ClassCategory, number>;
  mostUsed: ClassCategory;
} {
  const result = {
    byCategory: {} as Record<ClassCategory, TailwindClass[]>,
    categoryStats: {} as Record<ClassCategory, number>,
    mostUsed: 'unknown' as ClassCategory,
  };

  // 모든 카테고리 초기화
  const categories: ClassCategory[] = [
    'layout', 'flexbox', 'grid', 'spacing', 'sizing',
    'typography', 'background', 'borders', 'effects',
    'filters', 'tables', 'transitions', 'interactivity', 'unknown',
  ];

  for (const cat of categories) {
    result.byCategory[cat] = [];
    result.categoryStats[cat] = 0;
  }

  // 클래스 분류
  for (const className of classes) {
    const parsed = parseTailwindClass(className);
    result.byCategory[parsed.category].push(parsed);
    result.categoryStats[parsed.category]++;
  }

  // 가장 많이 사용된 카테고리 찾기
  let maxCount = 0;
  for (const [cat, count] of Object.entries(result.categoryStats)) {
    if (count > maxCount) {
      maxCount = count;
      result.mostUsed = cat as ClassCategory;
    }
  }

  return result;
}

// parseTailwindClass import (Task #9.10)
import { parseTailwindClass } from './parseTailwindClass';
```
- **완료 조건**: 정확한 카테고리 통계

---

### Task #9.12: Tailwind 클래스 검증

- **파일**: `src/utils/tailwind/validateTailwindClass.ts`
- **시간**: 30분
- **의존성**: Task #9.7
- **상세 내용**:
```typescript
import { TailwindClass } from '../../types/tailwindScanner';
import { isTailwindClass } from './isTailwindClass';

/**
 * Tailwind 클래스 검증 결과
 */
export interface ValidationResult {
  className: string;
  isValid: boolean;
  isTailwind: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Tailwind 클래스 검증
 */
export function validateTailwindClass(className: string): ValidationResult {
  const result: ValidationResult = {
    className,
    isValid: true,
    isTailwind: false,
    errors: [],
    warnings: [],
  };

  // 기본 유효성 체크
  if (!className || typeof className !== 'string') {
    result.isValid = false;
    result.errors.push('유효하지 않은 클래스명');
    return result;
  }

  const trimmed = className.trim();

  if (trimmed.length === 0) {
    result.isValid = false;
    result.errors.push('빈 클래스명');
    return result;
  }

  // Tailwind 클래스인지 확인
  result.isTailwind = isTailwindClass(trimmed);

  if (!result.isTailwind) {
    result.warnings.push('Tailwind 유틸리티 클래스가 아닙니다');

    // 비슷한 클래스 제안
    result.suggestions = suggestSimilarClasses(trimmed);
  }

  // 구문 검증
  const syntaxErrors = validateSyntax(trimmed);
  result.errors.push(...syntaxErrors);

  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * 구문 검증
 */
function validateSyntax(className: string): string[] {
  const errors: string[] = [];

  // 잘못된 대괄호 사용
  const bracketCount = (className.match(/\[/g) || []).length;
  const closeBracketCount = (className.match(/\]/g) || []).length;

  if (bracketCount !== closeBracketCount) {
    errors.push('대괄호가 일치하지 않습니다');
  }

  // 유효하지 않은 문자
  if (/[<>]/.test(className)) {
    errors.push('유효하지 않은 문자가 포함되어 있습니다');
  }

  // 연속된 하이픈
  if (/--/.test(className) && !/\[/.test(className)) {
    errors.push('잘못된 하이픈 사용입니다');
  }

  return errors;
}

/**
 * 비슷한 클래스 제안
 */
function suggestSimilarClasses(className: string): string[] {
  const suggestions: string[] = [];

  // 자주 틀리는 클래스들
  const commonMistakes: Record<string, string[]> = {
    'padding': ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'],
    'margin': ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'],
    'width': ['w'],
    'height': ['h'],
    'background': ['bg'],
    'text-color': ['text'],
    'border-radius': ['rounded'],
  };

  for (const [wrong, correct] of Object.entries(commonMistakes)) {
    if (className.toLowerCase().includes(wrong.toLowerCase())) {
      suggestions.push(...correct);
    }
  }

  return suggestions;
}

/**
 * 다중 클래스 검증
 */
export function validateTailwindClasses(classes: string[]): ValidationResult[] {
  return classes.map(validateTailwindClass);
}
```
- **완료 조건**: 정확한 검증 및 유용한 제안

---

### Task #9.13: 임의 값 찾기

- **파일**: `src/utils/tailwind/findArbitraryValues.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 임의 값 정보
 */
export interface ArbitraryValue {
  className: string;
  property: string;
  value: string;
  unit?: string;
  isStandard: boolean;  // 표준 값으로 변환 가능한지
  standardValue?: string;
}

/**
 * 클래스에서 임의 값 찾기
 */
export function findArbitraryValues(className: string): ArbitraryValue[] {
  const results: ArbitraryValue[] = [];

  // 단일 임의 값 패턴
  const singleMatch = className.match(/^([\w-]+)\[(.+)\]$/);

  if (singleMatch) {
    const [, prefix, value] = singleMatch;
    const property = inferProperty(prefix);
    const unit = extractUnit(value);
    const standard = findStandardValue(property, value);

    results.push({
      className,
      property,
      value,
      unit,
      isStandard: !!standard,
      standardValue: standard,
    });
  }

  return results;
}

/**
 * 접두사에서 CSS 속성 추론
 */
function inferProperty(prefix: string): string {
  const propertyMap: Record<string, string> = {
    // 스페이싱
    p: 'padding',
    px: 'padding-x',
    py: 'padding-y',
    pt: 'padding-top',
    pr: 'padding-right',
    pb: 'padding-bottom',
    pl: 'padding-left',
    m: 'margin',
    mx: 'margin-x',
    my: 'margin-y',
    mt: 'margin-top',
    mr: 'margin-right',
    mb: 'margin-bottom',
    ml: 'margin-left',

    // 사이징
    w: 'width',
    h: 'height',
    'max-w': 'max-width',
    'max-h': 'max-height',
    'min-w': 'min-width',
    'min-h': 'min-height',

    // 기타
    gap: 'gap',
    text: 'color',
    bg: 'background-color',
    rounded: 'border-radius',
    shadow: 'box-shadow',
  };

  return propertyMap[prefix] || prefix;
}

/**
 * 단위 추출
 */
function extractUnit(value: string): string | undefined {
  const unitMatch = value.match(/\d+(px|%|em|rem|vh|vw|deg|s|ms)?$/);
  return unitMatch ? unitMatch[1] : undefined;
}

/**
 * 표준 값 찾기
 */
function findStandardValue(property: string, value: string): string | undefined {
  // Tailwind 표준 스케일
  const spacingScale = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'];

  // 숫자 값만 추출
  const numMatch = value.match(/^(\d+(?:\.\d+)?)\w*$/);
  if (!numMatch) return undefined;

  const num = parseFloat(numMatch[1]);

  // px를 rem으로 변환 (16px = 1rem)
  const inRem = value.includes('px') ? num / 16 : num;

  // 가장 가까운 표준 값 찾기
  for (const scale of spacingScale) {
    const scaleNum = parseFloat(scale);
    if (Math.abs(inRem - scaleNum) < 0.01) {
      return scale;
    }
  }

  return undefined;
}

/**
 * 페이지의 모든 임의 값 찾기
 */
export function findAllArbitraryValues(): ArbitraryValue[] {
  const results: ArbitraryValue[] = [];
  const elements = document.querySelectorAll('[class]');

  for (const el of elements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      const found = findArbitraryValues(cls);
      results.push(...found);
    }
  }

  return results;
}
```
- **완료 조건**: 정확한 임의 값 추출

---

### Task #9.14: JIT 모드 감지

- **파일**: `src/utils/tailwind/detectJITMode.ts`
- **시간**: 30분
- **의존성**: Task #9.13
- **상세 내용**:
```typescript
/**
 * JIT 모드 분석 결과
 */
export interface JITModeAnalysis {
  isJIT: boolean;
  confidence: number;
  indicators: {
    arbitraryValues: number;
    dynamicClasses: number;
    stackVariants: number;
  };
  examples: string[];
}

/**
 * JIT 모드 감지
 */
export function detectJITMode(): JITModeAnalysis {
  const result: JITModeAnalysis = {
    isJIT: false,
    confidence: 0,
    indicators: {
      arbitraryValues: 0,
      dynamicClasses: 0,
      stackVariants: 0,
    },
    examples: [],
  };

  const elements = document.querySelectorAll('[class]');

  for (const el of elements) {
    const classes = el.className?.split(/\s+/) || [];

    for (const cls of classes) {
      // 임의 값 체크
      if (/\[.+\]/.test(cls)) {
        result.indicators.arbitraryValues++;
        if (result.examples.length < 5) {
          result.examples.push(cls);
        }
      }

      // 스택 변형 체크 (예: hover:focus:)
      if (/hover:|focus:|active:/.test(cls) && /:/.test(cls.slice(5))) {
        result.indicators.stackVariants++;
      }
    }
  }

  // JIT 모드 판정
  const totalIndicators =
    result.indicators.arbitraryValues +
    result.indicators.dynamicClasses +
    result.indicators.stackVariants;

  if (result.indicators.arbitraryValues >= 5) {
    result.isJIT = true;
    result.confidence = Math.min(1, result.indicators.arbitraryValues / 10);
  } else if (result.indicators.stackVariants >= 3) {
    result.isJIT = true;
    result.confidence = Math.min(1, result.indicators.stackVariants / 5);
  }

  return result;
}
```
- **완료 조건**: 정확한 JIT 모드 감지

---

### Task #9.15: 커스텀 클래스 추출

- **파일**: `src/utils/tailwind/extractCustomClasses.ts`
- **시간**: 30분
- **의존성**: Task #9.7
- **상세 내용**:
```typescript
import { isTailwindClass } from './isTailwindClass';

/**
 * 커스텀 클래스 정보
 */
export interface CustomClass {
  name: string;
  frequency: number;
  elements: string[];
  possibleConflicts?: string[];
}

/**
 * 커스텀 클래스 추출
 */
export function extractCustomClasses(): CustomClass[] {
  const classMap = new Map<string, { count: number; elements: Set<string> }>();
  const elements = document.querySelectorAll('[class]');

  for (const el of elements) {
    const classes = el.className?.split(/\s+/) || [];
    const selector = getSelector(el);

    for (const cls of classes) {
      // Tailwind 클래스가 아닌 것만
      if (!isTailwindClass(cls) && /^[a-zA-Z][\w-]*$/.test(cls)) {
        if (!classMap.has(cls)) {
          classMap.set(cls, { count: 0, elements: new Set() });
        }

        const data = classMap.get(cls)!;
        data.count++;
        data.elements.add(selector);
      }
    }
  }

  // 결과 변환
  const results: CustomClass[] = [];

  for (const [name, data] of classMap.entries()) {
    results.push({
      name,
      frequency: data.count,
      elements: Array.from(data.elements),
    });
  }

  // 빈도순 정렬
  return results.sort((a, b) => b.frequency - a.frequency);
}

// CSS 선택자 생성 함수 (간단 버전)
function getSelector(el: Element): string {
  if (el.id) {
    return `#${el.id}`;
  }

  if (el.className) {
    const classes = el.className.split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }

  return el.tagName.toLowerCase();
}

/**
 * Tailwind와 충돌할 수 있는 커스텀 클래스 찾기
 */
export function findPotentialConflicts(customClasses: string[]): string[] {
  const conflicts: string[] = [];

  const tailwindPrefixes = [
    'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
    'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
    'w', 'h', 'text', 'bg', 'border', 'rounded',
    'flex', 'grid', 'gap', 'shadow', 'opacity',
  ];

  for (const cls of customClasses) {
    const base = cls.split('-')[0];

    if (tailwindPrefixes.includes(base)) {
      conflicts.push(cls);
    }
  }

  return conflicts;
}
```
- **완료 조건**: 정확한 커스텀 클래스 식별

---

### Task #9.16: Tailwind 사용 분석

- **파일**: `src/utils/tailwind/analyzeTailwindUsage.ts`
- **시간**: 30분
- **의존성**: Task #9.7, #9.11, #9.15
- **상세 내용**:
```typescript
import { TailwindUsageStats, TailwindDetectionResult } from '../../types/tailwindScanner';
import { isTailwindClass } from './isTailwindClass';
import { categorizeTailwindClasses } from './categorizeTailwindClass';
import { extractCustomClasses } from './extractCustomClasses';

/**
 * 페이지의 Tailwind 사용 분석
 */
export function analyzeTailwindUsage(): TailwindUsageStats {
  const elements = document.querySelectorAll('[class]');

  let totalElements = 0;
  let elementsWithTailwind = 0;
  let totalClasses = 0;
  let totalTailwindClasses = 0;

  const allClasses: string[] = [];
  const tailwindClasses: string[] = [];

  for (const el of elements) {
    const classes = el.className?.split(/\s+/).filter(Boolean) || [];

    if (classes.length > 0) {
      totalElements++;
      totalClasses += classes.length;

      const hasTailwind = classes.some(isTailwindClass);

      if (hasTailwind) {
        elementsWithTailwind++;
        for (const cls of classes) {
          allClasses.push(cls);
          if (isTailwindClass(cls)) {
            tailwindClasses.push(cls);
            totalTailwindClasses++;
          }
        }
      }
    }
  }

  // 카테고리 분포
  const categoryResult = categorizeTailwindClasses(tailwindClasses);

  // 상위 클래스
  const classFrequency = new Map<string, number>();
  for (const cls of tailwindClasses) {
    classFrequency.set(cls, (classFrequency.get(cls) || 0) + 1);
  }

  const topClasses = Array.from(classFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([class, count]) => ({ class, count }));

  // 커스텀 클래스
  const customClassesData = extractCustomClasses();
  const customClasses = customClassesData.map(c => c.name);

  return {
    totalElements,
    elementsWithTailwind,
    totalClasses,
    totalTailwindClasses,
    coverage: totalElements > 0 ? elementsWithTailwind / totalElements : 0,
    categoryDistribution: categoryResult.categoryStats,
    topClasses,
    customClasses,
  };
}

/**
 * 페이지 전체 Tailwind 감지
 */
export function detectTailwindInPage(): TailwindDetectionResult {
  const usage = analyzeTailwindUsage();

  return {
    detected: usage.elementsWithTailwind > 0,
    version: 'unknown', // detectTailwindVersion() 사용
    jitMode: false,     // detectJITMode() 사용
    classes: [],        // 필요시 파싱
    totalClasses: usage.totalTailwindClasses,
    customClasses: usage.customClasses,
    arbitraryValues: [], // findArbitraryValues() 사용
  };
}
```
- **완료 조건**: 정확한 사용 통계

---

[Phase 3: CSS → Tailwind 변환](./TASK-09-PHASE3.md) 로 계속
