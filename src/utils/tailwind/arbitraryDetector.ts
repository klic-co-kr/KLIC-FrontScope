/**
 * Arbitrary Value Detection Utilities
 *
 * Tailwind 임의 값(Arbitrary Values) 감지 및 추출
 *
 * 예: text-[#123456], w-[500px], bg-[rgba(0,0,0,0.5)]
 */

import type { ArbitraryValue } from '../../types/tailwindScanner';

// Arbitrary value patterns reserved for future use
// const ARBITRARY_PATTERNS = {
//   // 색상: text-[#123456], bg-[rgb(0,0,0)], border-[rgba(255,255,255,0.5)]
//   color: /\[([#]|rgb|rgba|hsl|hsla)\(.+\)\]/,
//   // 크기: w-[500px], h-[10rem], max-w-[90vw]
//   size: /\[\d+\.?\d*(px|rem|em|%|vw|vh|vmin|vmax|ch|ex)\]/,
//   // 간격: p-[5px], m-[2rem], gap-[10px]
//   spacing: /\[\d+\.?\d*(px|rem|em|%)\]/,
//   // 경계: rounded-[10px], border-[2px]
//   radius: /\[rounded?-\d+\.?\d*(px|rem|%)\]/,
//   // 위치: top-[100px], left-[50%]
//   position: /\[(top|right|bottom|left|inset)-\d+\.?\d*(px|rem|%)\]/,
//   // 글꼴: text-[20px], leading-[1.5]
//   typography: /\[(text|font|leading)-\d+\.?\d*(px|rem|em|%)\]/,
//   // 그리드: grid-cols-[3], grid-rows-[auto]
//   grid: /\[grid-(cols|rows)-\d+\]/,
//   // 일반 임의 값
//   general: /\[.+\]/,
// };

/**
 * 임의 값이 포함된 클래스 파싱
 */
export function parseArbitraryClass(
  className: string,
  element?: HTMLElement
): ArbitraryValue | null {
  // 임의 값 패턴 확인
  const match = className.match(/\[(.+)\]$/);
  if (!match) {
    return null;
  }

  const valueStr = match[1];

  // 속성 및 값 추출
  const { property, value } = extractPropertyAndValue(className, valueStr);

  return {
    property,
    value,
    hasBrackets: true,
    className,
    element: element ? {
      tagName: element.tagName.toLowerCase(),
      selector: generateElementSelector(element),
    } : undefined,
  };
}

/**
 * 클래스에서 CSS 속성과 값 추출
 */
function extractPropertyAndValue(className: string, valueStr: string): {
  property: string;
  value: string;
} {
  // 접두사 기반 속성 결정
  const prefix = className.split('-')[0];
  const property = mapPrefixToProperty(prefix);

  return {
    property,
    value: valueStr,
  };
}

/**
 * 접두사를 CSS 속성으로 매핑
 */
function mapPrefixToProperty(prefix: string): string {
  const propertyMap: Record<string, string> = {
    // 레이아웃
    w: 'width',
    h: 'height',
    'min-w': 'min-width',
    'max-w': 'max-width',
    'min-h': 'min-height',
    'max-h': 'max-height',

    // 간격
    p: 'padding',
    px: 'padding-left, padding-right',
    py: 'padding-top, padding-bottom',
    pt: 'padding-top',
    pr: 'padding-right',
    pb: 'padding-bottom',
    pl: 'padding-left',
    m: 'margin',
    mx: 'margin-left, margin-right',
    my: 'margin-top, margin-bottom',
    mt: 'margin-top',
    mr: 'margin-right',
    mb: 'margin-bottom',
    ml: 'margin-left',

    // 색상
    text: 'color',
    bg: 'background-color',
    border: 'border-color',
    'ring-color': '--tw-ring-color',
    'fill': 'fill',
    'stroke': 'stroke',

    // 폰트
    'text-size': 'font-size',
    'leading': 'line-height',
    'tracking': 'letter-spacing',
    'font-weight': 'font-weight',

    // 경계
    rounded: 'border-radius',
    'border-w': 'border-width',

    // 위치
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    inset: 'inset',

    // 그리드
    'grid-cols': 'grid-template-columns',
    'grid-rows': 'grid-template-rows',

    // 플렉스
    'flex-basis': 'flex-basis',
    'flex-grow': 'flex-grow',
    'flex-shrink': 'flex-shrink',

    // Z-index
    z: 'z-index',

    // 불투명도
    opacity: 'opacity',

    // 그림자
    shadow: 'box-shadow',
  };

  // 직접 매칭
  if (propertyMap[prefix]) {
    return propertyMap[prefix];
  }

  // 하이픈 포함 접두사 확인
  const parts = prefix.split('-');
  for (let i = parts.length; i > 0; i--) {
    const testPrefix = parts.slice(0, i).join('-');
    if (propertyMap[testPrefix]) {
      return propertyMap[testPrefix];
    }
  }

  // 기본값
  return 'custom-property';
}

/**
 * 요소에 대한 선택자 생성
 */
function generateElementSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const classes = Array.from(element.classList)
    .filter((c) => c.length < 20)
    .slice(0, 2)
    .join('.');

  if (classes) {
    return `${element.tagName.toLowerCase()}.${classes}`;
  }

  return element.tagName.toLowerCase();
}

/**
 * 문서에서 모든 임의 값 추출
 */
export function extractAllArbitraryValues(options?: {
  maxElements?: number;
}): {
  values: ArbitraryValue[];
  byProperty: Record<string, ArbitraryValue[]>;
  totalClasses: number;
} {
  const maxElements = options?.maxElements ?? 5000;
  const elements = document.querySelectorAll('[class]');
  const values: ArbitraryValue[] = [];
  const byProperty: Record<string, ArbitraryValue[]> = {};

  const limit = Math.min(elements.length, maxElements);

  for (let i = 0; i < limit; i++) {
    const element = elements[i] as HTMLElement;
    const classNames = element.className?.toString().split(/\s+/) || [];

    classNames.forEach((className) => {
      const arbitrary = parseArbitraryClass(className, element);
      if (arbitrary) {
        values.push(arbitrary);

        // 속성별 그룹화
        if (arbitrary.property) {
          if (!byProperty[arbitrary.property]) {
            byProperty[arbitrary.property] = [];
          }
          byProperty[arbitrary.property].push(arbitrary);
        }
      }
    });
  }

  return {
    values,
    byProperty,
    totalClasses: values.length,
  };
}

/**
 * 임의 값 타입 감지
 */
export function detectArbitraryType(value: string): 'color' | 'size' | 'number' | 'string' {
  // 색상
  if (/^#[0-9a-fA-F]{3,8}$/.test(value) ||
      /^rgb|hsl|rgba|hsla/.test(value)) {
    return 'color';
  }

  // 크기 (단위 포함)
  if (/\d+(px|rem|em|%|vw|vh|vmin|vmax|ch|ex|deg|rad|turn|s|ms)$/.test(value)) {
    return 'size';
  }

  // 숫자
  if (/^-?\d+\.?\d*$/.test(value)) {
    return 'number';
  }

  return 'string';
}

/**
 * 임의 값 분석
 */
export function analyzeArbitraryValues(values: ArbitraryValue[]): {
  byType: Record<string, ArbitraryValue[]>;
  uniqueValues: Record<string, string[]>; // property -> values
  mostCommon: ArbitraryValue[];
} {
  const byType: Record<string, ArbitraryValue[]> = {
    color: [],
    size: [],
    number: [],
    string: [],
  };

  const uniqueValues: Record<string, Set<string>> = {};
  const valueCounts = new Map<string, number>();

  values.forEach((v) => {
    const type = detectArbitraryType(v.value);
    byType[type].push(v);

    // 고유 값 수집
    if (v.property) {
      if (!uniqueValues[v.property]) {
        uniqueValues[v.property] = new Set();
      }
      uniqueValues[v.property].add(v.value);
    }

    // 빈도 계산
    const key = `${v.property ?? 'unknown'}:${v.value}`;
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  });

  // 가장 일반적인 값
  const mostCommon = values
    .map((v) => ({
      ...v,
      count: valueCounts.get(`${v.property}:${v.value}`) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map((v) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { count, ...rest } = v;
      return rest;
    });

  return {
    byType,
    uniqueValues: Object.fromEntries(
      Object.entries(uniqueValues).map(([k, v]) => [k, Array.from(v)])
    ),
    mostCommon,
  };
}

/**
 * 임의 값을 유틸리티 클래스로 변환 제안
 */
export function suggestUtilityClass(arbitrary: ArbitraryValue): string[] {
  const suggestions: string[] = [];
  const { property, value } = arbitrary;

  if (!property) return suggestions;

  // 색상 값
  if (property.includes('color') || property === 'background-color') {
    const hexValue = convertToHex(value);
    if (hexValue) {
      // 가장 가까운 Tailwind 색상 찾기 (단순화)
      const nearestColor = findNearestTailwindColor(hexValue);
      if (nearestColor) {
        suggestions.push(nearestColor);
      }
    }
  }

  // 크기 값
  if (property.includes('width') || property.includes('height') ||
      property.includes('padding') || property.includes('margin')) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // 가장 가까운 Tailwind 크기 찾기
      const nearestSize = findNearestTailwindSize(numValue);
      if (nearestSize) {
        const prefix = property.split('-')[0];
        suggestions.push(`${prefix}-${nearestSize}`);
      }
    }
  }

  // 경계 반경
  if (property.includes('radius')) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const nearestRadius = findNearestTailwindSize(numValue);
      if (nearestRadius) {
        suggestions.push(`rounded-${nearestRadius}`);
      }
    }
  }

  return suggestions;
}

/**
 * 색상을 Hex로 변환
 */
function convertToHex(color: string): string | null {
  // 이미 Hex
  if (color.startsWith('#')) {
    return color;
  }

  // rgb/rgba 변환 (간단화)
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  return null;
}

/**
 * 가장 가까운 Tailwind 색상 찾기 (단순화)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function findNearestTailwindColor(_hexValue: string): string | null {
  // Tailwind 기본 색상 팔레트 (단순화)
  // TODO: Implement color distance calculation
  // 여기서는 null을 반환하여 분석이 필요함을 표시
  return null;
}

/**
 * 가장 가까운 Tailwind 크기 찾기
 */
function findNearestTailwindSize(px: number): string | null {
  const tailwindSizes: Record<string, number> = {
    '0': 0, 'px': 1, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10,
    '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32,
    '9': 36, '10': 40, '11': 44, '12': 48, '14': 56, '16': 64, '20': 80,
    '24': 96, '28': 112, '32': 128, '36': 144, '40': 160, '44': 176,
    '48': 192, '52': 208, '56': 224, '60': 240, '64': 256, '72': 288,
    '80': 320, '96': 384,
  };

  let nearest: string | null = null;
  let minDiff = Infinity;

  for (const [size, value] of Object.entries(tailwindSizes)) {
    const diff = Math.abs(value - px);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = size;
    }
  }

  // 허용 오차 범위 내에서만 반환
  if (minDiff <= px * 0.1) {
    return nearest;
  }

  return null;
}

/**
 * 임의 값이 Tailwind 기본값으로 대체 가능한지 확인
 */
export function isReplaceableWithStandard(arbitrary: ArbitraryValue): boolean {
  const suggestions = suggestUtilityClass(arbitrary);
  return suggestions.length > 0;
}
