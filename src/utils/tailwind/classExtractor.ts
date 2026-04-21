/**
 * Tailwind Class Extraction Utilities
 *
 * DOM에서 Tailwind 클래스 추출 및 분석
 */

import type { TailwindClass, TailwindCategory } from '../../types/tailwindScanner';
import { isTailwindClass } from './detection';

/**
 * Tailwind 클래스 카테고리 매핑
 */
const CATEGORY_PATTERNS: Record<TailwindCategory, RegExp[]> = {
  layout: [
    /^(container|(?:flex|grid|block|inline|table|hidden|flow|clear|float|object|position|overflow|z|isolate))$/,
    /^(static|fixed|absolute|relative|sticky)$/,
  ],
  flexbox: [
    /^(flex|shrink|grow|justify|items|self|place|order|flex-(dir|wrap|grow|shrink))$/,
  ],
  grid: [
    /^grid/,
    /^(col|row)-(span|start|end)/,
  ],
  spacing: [
    /^(p|m)(x|y|t|r|b|l|s|e)?-?(?!-)/,
    /^space-(x|y)-/,
  ],
  sizing: [
    /^(w|h|min-w|max-w|min-h|max-h)-/,
    /^(width|height)-/,
  ],
  typography: [
    /^(text|font|leading|tracking|align|list|decoration|whitespace|word|break)/,
    /^(antialiased|subpixel-antialiased)$/,
    /^(uppercase|lowercase|capitalize|normal-case)$/,
  ],
  background: [
    /^bg-/,
  ],
  borders: [
    /^(border|rounded)/,
    /^ring-/,
  ],
  colors: [
    /^(text|bg|border|ring|fill|stroke|accent|shadow)-(?!transparent|current|inherit)/,
    /^(from|via|to)-/,
  ],
  effects: [
    /^(shadow|opacity|mix-blend|filter|blur|brightness|contrast|grayscale|invert|sepia)/,
  ],
  filters: [
    /^(blur|brightness|contrast|grayscale|invert|sepia|saturate)-/,
  ],
  tables: [
    /^(table|border-collapse|caption)-/,
  ],
  transitions: [
    /^transition/,
    /^duration-/,
    /^ease-/,
    /^delay-/,
  ],
  transforms: [
    /^(scale|rotate|translate|skew)/,
    /^transform/,
    /^transform-gpu/,
    /^transform-none/,
  ],
  interactivity: [
    /^(cursor|pointer|select|touch|resiz|user)-/,
    /^(accent|caret)-/,
  ],
  svg: [
    /^(stroke|fill)-/,
  ],
  arbitrary: [
    /\[.+\]/,
  ],
  unknown: [
    /.*/,
  ],
};

/**
 * 단일 요소에서 Tailwind 클래스 추출
 */
export function extractClassesFromElement(element: HTMLElement): TailwindClass[] {
  const classes: TailwindClass[] = [];
  const classNames = element.className?.toString().split(/\s+/) || [];

  classNames.forEach((className) => {
    if (!className || !isTailwindClass(className)) {
      return;
    }

    const tailwindClass = parseTailwindClass(className, element);
    if (tailwindClass) {
      classes.push(tailwindClass);
    }
  });

  return classes;
}

/**
 * 문서 전체에서 Tailwind 클래스 추출
 */
export function extractAllClasses(options?: {
  maxElements?: number;
  includeCustom?: boolean;
}): {
  classes: TailwindClass[];
  totalElements: number;
  totalClasses: number;
  customClasses: string[];
} {
  const maxElements = options?.maxElements ?? 5000;
  const includeCustom = options?.includeCustom ?? false;

  const classMap = new Map<string, TailwindClass>();
  const customClasses = new Set<string>();
  let totalElements = 0;
  let totalClasses = 0;

  // 모든 요소 순회
  const elements = document.querySelectorAll('[class]');
  const limit = Math.min(elements.length, maxElements);

  for (let i = 0; i < limit; i++) {
    const element = elements[i] as HTMLElement;
    totalElements++;

    const classNames = extractClassesFromElement(element);
    totalClasses += classNames.length;

    classNames.forEach((tailwindClass) => {
      const key = tailwindClass.full ?? tailwindClass.name;

      // 중복 클래스 처리 (사용 횟수 집계)
      if (classMap.has(key)) {
        const existing = classMap.get(key)!;
        existing.usageCount = (existing.usageCount || 0) + 1;
      } else {
        classMap.set(key, tailwindClass);
      }
    });
  }

  // 커스텀 클래스 수집 (Tailwind 형식이 아닌 클래스)
  if (includeCustom) {
    elements.forEach((element) => {
      const classNames = element.className?.toString().split(/\s+/) || [];
      classNames.forEach((className) => {
        if (className && !isTailwindClass(className)) {
          customClasses.add(className);
        }
      });
    });
  }

  return {
    classes: Array.from(classMap.values()),
    totalElements,
    totalClasses,
    customClasses: Array.from(customClasses),
  };
}

/**
 * Tailwind 클래스 파싱
 */
function parseTailwindClass(className: string, element: HTMLElement): TailwindClass | null {
  // 임의 값 확인
  const utilityClass = getTailwindUtilityName(className);
  const isArbitrary = utilityClass.includes('[') && utilityClass.includes(']');

  // 기본 이름 추출 (임의 값 제거)
  const baseName = extractBaseName(className);

  // 카테고리 결정
  const category = categorizeClass(className, isArbitrary);

  // 커스텀 클래스 확인 (선택자 접두사 등)
  const isCustom = isCustomClass(className);

  return {
    name: baseName,
    category,
    isValid: true,
    full: className,
    isArbitrary,
    isCustom,
    usageCount: 1,
    element: {
      tagName: element.tagName.toLowerCase(),
      selector: generateSelector(element),
    },
  };
}

/**
 * 클래스명에서 Tailwind 유틸리티 조각 추출
 */
function getTailwindUtilityName(className: string): string {
  const normalized = className.trim().replace(/^!/, '');
  const segments = normalized.split(':').filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : normalized;
}

/**
 * 기본 클래스 이름 추출
 */
function extractBaseName(className: string): string {
  const utilityClass = getTailwindUtilityName(className);

  // 임의 값 제거: text-[#123456] -> text
  const arbitraryMatch = utilityClass.match(/^([^[]+)\[/);
  if (arbitraryMatch) {
    return arbitraryMatch[1].replace(/-$/, '');
  }

  return utilityClass;
}

/**
 * 클래스 카테고리 결정
 */
function categorizeClass(className: string, isArbitrary: boolean): TailwindCategory {
  const utilityClass = getTailwindUtilityName(className);

  // 임의 값은 arbitrary 카테고리
  if (isArbitrary || (utilityClass.includes('[') && utilityClass.includes(']'))) {
    return 'arbitrary';
  }

  // 각 카테고리 패턴 확인
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(utilityClass)) {
        return category as TailwindCategory;
      }
    }
  }

  return 'arbitrary';
}

/**
 * 커스텀 클래스 확인
 */
function isCustomClass(className: string): boolean {
  // @apply 또는 @layer 사용 여부 (불가능, DOM만 접근 가능)
  // 대신 특정 패턴으로 추론

  // 언더스코어로 시작
  if (className.startsWith('_')) {
    return true;
  }

  // 특정 프레임워크 접두사
  const frameworkPrefixes = [
    'tw-', // Tailwind 커스텀 접두사
  ];

  for (const prefix of frameworkPrefixes) {
    if (className.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * 요소에 대한 CSS 선택자 생성
 */
function generateSelector(element: HTMLElement): string {
  // ID 우선
  if (element.id) {
    return `#${element.id}`;
  }

  // 클래스 기반
  if (element.className) {
    const classes = element.className.toString()
      .split(/\s+/)
      .filter((c) => c && isTailwindClass(c))
      .slice(0, 2) // 최대 2개 클래스
      .join('.');

    if (classes) {
      return `${element.tagName.toLowerCase()}.${classes}`;
    }
  }

  // 태그 + 위치 기반
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    return `${element.tagName.toLowerCase()}:nth-child(${index})`;
  }

  return element.tagName.toLowerCase();
}

/**
 * 특정 카테고리의 클래스만 추출
 */
export function extractClassesByCategory(category: TailwindCategory): TailwindClass[] {
  const all = extractAllClasses();
  return all.classes.filter((c) => c.category === category);
}

/**
 * 임의 값만 추출
 */
export function extractArbitraryClasses(): TailwindClass[] {
  const all = extractAllClasses();
  return all.classes.filter((c) => c.isArbitrary);
}

/**
 * 커스텀 클래스만 추출
 */
export function extractCustomClasses(): string[] {
  const all = extractAllClasses({ includeCustom: true });
  return all.customClasses;
}

/**
 * 클래스 사용 빈도 분석
 */
export function analyzeClassFrequency(): {
  mostUsed: TailwindClass[];
  leastUsed: TailwindClass[];
  byCategory: Record<TailwindCategory, TailwindClass[]>;
} {
  const all = extractAllClasses();
  const sorted = [...all.classes].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  const byCategory: Record<string, TailwindClass[]> = {};
  all.classes.forEach((cls) => {
    if (!byCategory[cls.category]) {
      byCategory[cls.category] = [];
    }
    byCategory[cls.category].push(cls);
  });

  // 카테고리별로 정렬
  for (const category of Object.keys(byCategory)) {
    byCategory[category].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  }

  return {
    mostUsed: sorted.slice(0, 20),
    leastUsed: sorted.slice(-20).reverse(),
    byCategory: byCategory as Record<TailwindCategory, TailwindClass[]>,
  };
}
