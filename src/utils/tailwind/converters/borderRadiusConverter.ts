/**
 * Border Radius Converter
 *
 * CSS border-radius → Tailwind 클래스 변환
 */

import type { ConversionSuggestion } from '../../../types/tailwindScanner';

/**
 * Tailwind border-radius 스케일 (px 단위)
 */
const BORDER_RADIUS_SCALE: Record<string, string> = {
  'none': '0',
  'sm': '0.125rem',   // 2px
  'DEFAULT': '0.25rem', // 4px
  'md': '0.375rem',   // 6px
  'lg': '0.5rem',     // 8px
  'xl': '0.75rem',    // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  'full': '9999px',   // 완전 둥글
};

/**
 * px → rem 변환
 */
function pxToRem(px: number): number {
  return px / 16;
}

/**
 * border-radius 값 파싱
 */
function parseBorderRadius(value: string): number | null {
  const match = value.match(/^([\d.]+)(px|rem|em|%)?$/);
  if (!match) {
    return null;
  }

  const numValue = parseFloat(match[1]);
  const unit = match[2] || 'rem';

  if (unit === 'px') {
    return pxToRem(numValue);
  }
  return numValue;
}

/**
 * 가장 가까운 Tailwind border-radius 찾기
 */
function findClosestBorderRadius(remValue: number): string | null {
  // full 특수 처리
  if (remValue > 10) {
    return 'full';
  }

  let closest: string | null = null;
  let minDiff = Infinity;

  for (const [name, value] of Object.entries(BORDER_RADIUS_SCALE)) {
    if (name === 'none' || name === 'full') continue;

    const scaleValue = parseFloat(value);
    const diff = Math.abs(scaleValue - remValue);

    if (diff < minDiff) {
      minDiff = diff;
      closest = name;
    }
  }

  // 기본값이면 'DEFAULT' 반환
  if (closest === 'DEFAULT') {
    return ''; // rounded만 사용
  }

  // 허용 오차 범위 내에서만 반환 (15% 이내)
  if (closest && minDiff <= remValue * 0.15) {
    return closest;
  }

  return null;
}

/**
 * border-radius 속성 변환
 */
export function convertBorderRadius(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (!cssProperty.startsWith('border-radius')) {
    return [];
  }

  // 0 또는 none 처리
  if (cssValue === '0' || cssValue === 'none' || cssValue === '0px') {
    let corner = '';
    if (cssProperty === 'border-top-left-radius') corner = 'tl';
    else if (cssProperty === 'border-top-right-radius') corner = 'tr';
    else if (cssProperty === 'border-bottom-left-radius') corner = 'bl';
    else if (cssProperty === 'border-bottom-right-radius') corner = 'br';

    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `rounded${corner ? '-' + corner : ''}-none`,
      confidence: 1.0,
      category: 'effects',
    isArbitrary: false,
    });
    return suggestions;
  }

  // full 처리
  if (cssValue === '9999px' || cssValue === '50%') {
    let corner = '';
    if (cssProperty === 'border-top-left-radius') corner = 'tl';
    else if (cssProperty === 'border-top-right-radius') corner = 'tr';
    else if (cssProperty === 'border-bottom-left-radius') corner = 'bl';
    else if (cssProperty === 'border-bottom-right-radius') corner = 'br';

    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `rounded${corner ? '-' + corner : ''}-full`,
      confidence: 1.0,
      category: 'effects',
    isArbitrary: false,
    });
    return suggestions;
  }

  const remValue = parseBorderRadius(cssValue);
  if (remValue === null) {
    // 파싱 실패 - 임의 값
    let corner = '';
    if (cssProperty === 'border-top-left-radius') corner = 'tl';
    else if (cssProperty === 'border-top-right-radius') corner = 'tr';
    else if (cssProperty === 'border-bottom-left-radius') corner = 'bl';
    else if (cssProperty === 'border-bottom-right-radius') corner = 'br';

    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `rounded${corner ? '-' + corner : ''}-[${cssValue}]`,
      confidence: 0.6,
      category: 'effects',
      isArbitrary: true,
    });
    return suggestions;
  }

  // 개별 코너 처리
  if (cssProperty !== 'border-radius') {
    const closest = findClosestBorderRadius(remValue);
    let corner = '';
    if (cssProperty === 'border-top-left-radius') corner = 'tl';
    else if (cssProperty === 'border-top-right-radius') corner = 'tr';
    else if (cssProperty === 'border-bottom-left-radius') corner = 'bl';
    else if (cssProperty === 'border-bottom-right-radius') corner = 'br';

    if (closest) {
      const suffix = closest === '' ? '' : `-${closest}`;
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `rounded-${corner}${suffix}`,
        confidence: 0.9,
        category: 'effects',
        isArbitrary: false,
      });
    }

    // 임의 값 대안
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `rounded-${corner}-[${remValue}rem]`,
      confidence: 0.8,
      category: 'effects',
      isArbitrary: true,
    });
  } else {
    // border-radius 단축형
    const values = cssValue.split(/\s+/);

    if (values.length === 1) {
      const closest = findClosestBorderRadius(remValue);
      if (closest) {
        const suffix = closest === '' ? '' : `-${closest}`;
        suggestions.push({
          css: `border-radius: ${cssValue}`,
          tailwind: `rounded${suffix}`,
          confidence: 0.9,
          category: 'effects',
          isArbitrary: false,
        });
      }

      suggestions.push({
        css: `border-radius: ${cssValue}`,
        tailwind: `rounded-[${remValue}rem]`,
        confidence: 0.8,
        category: 'effects',
        isArbitrary: true,
      });
    } else {
      // 여러 값: tl tr bl br 순서
      // rounded-tl, rounded-tr, rounded-bl, rounded-br
      const corners = ['tl', 'tr', 'br', 'bl'];
      const classes: string[] = [];

      for (let i = 0; i < values.length; i++) {
        const value = parseBorderRadius(values[i]);
        if (value !== null) {
          const closest = findClosestBorderRadius(value);
          const suffix = closest === '' ? '' : `-${closest}`;
          classes.push(`rounded-${corners[i]}${suffix}`);
        }
      }

      if (classes.length > 0) {
        suggestions.push({
          css: `border-radius: ${cssValue}`,
          tailwind: classes.join(' '),
          confidence: 0.85,
          category: 'effects',
          isArbitrary: false,
        });
      }
    }
  }

  return suggestions;
}

/**
 * border-width 속성 변환
 */
export function convertBorderWidth(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (!cssProperty.startsWith('border')) {
    return [];
  }

  // border-width 또는 border-{side}-width
  const widthMatch = cssProperty.match(/border(?:-(top|right|bottom|left))?-width/);
  if (!widthMatch) {
    return [];
  }

  const side = widthMatch[1];

  const pxMatch = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (!pxMatch) {
    return [];
  }

  const pxValue = parseFloat(pxMatch[1]);

  // Tailwind border-width 매핑
  const borderWidthMap: Record<number, string> = {
    0: '0',
    1: '',
    2: '2',
    4: '4',
    8: '8',
  };

  let closest: string | null = null;
  const sortedWidths = [0, 1, 2, 4, 8].sort((a, b) => Math.abs(a - pxValue) - Math.abs(b - pxValue));

  for (const width of sortedWidths) {
    if (Math.abs(width - pxValue) <= 1) {
      closest = borderWidthMap[width];
      break;
    }
  }

  if (closest !== null) {
    const prefix = side ? `border-${side}` : 'border';
    const suffix = closest === '' ? '' : `-${closest}`;
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `${prefix}${suffix}`,
      confidence: 0.9,
      category: 'borders',
    isArbitrary: false,
    });
  }

  // 임의 값 대안
  const prefix = side ? `border-${side}` : 'border';
  suggestions.push({
    css: `${cssProperty}: ${cssValue}`,
    tailwind: `${prefix}-[${cssValue}]`,
    confidence: 0.7,
    category: 'borders',
    isArbitrary: true,
  });

  return suggestions;
}

/**
 * 계산된 스타일에서 border-radius 추출
 */
export function extractBorderRadiusFromStyles(
  computedStyle: CSSStyleDeclaration
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  // 개별 코너 확인
  const corners = [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ];

  // 모든 코너가 동일한지 확인
  const topLeft = computedStyle.getPropertyValue('border-top-left-radius');
  const topRight = computedStyle.getPropertyValue('border-top-right-radius');
  const bottomRight = computedStyle.getPropertyValue('border-bottom-right-radius');
  const bottomLeft = computedStyle.getPropertyValue('border-bottom-left-radius');

  if (topLeft && topLeft !== '0px') {
    if (topLeft === topRight && topLeft === bottomRight && topLeft === bottomLeft) {
      // 모두 동일 - rounded 사용
      suggestions.push(...convertBorderRadius('border-radius', topLeft));
    } else {
      // 개별 코너
      corners.forEach((corner) => {
        const value = computedStyle.getPropertyValue(corner);
        if (value && value !== '0px') {
          suggestions.push(...convertBorderRadius(corner, value));
        }
      });
    }
  }

  return suggestions;
}

/**
 * border-style 속성 변환
 */
export function convertBorderStyle(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (!cssProperty.startsWith('border')) {
    return [];
  }

  const styleMatch = cssProperty.match(/border(?:-(top|right|bottom|left))?-style/);
  if (!styleMatch) {
    return [];
  }

  const side = styleMatch[1];

  const styleMap: Record<string, string> = {
    'solid': 'solid',
    'dashed': 'dashed',
    'dotted': 'dotted',
    'double': 'double',
    'none': 'none',
  };

  const tailwindStyle = styleMap[cssValue.toLowerCase()];
  if (tailwindStyle) {
    const prefix = side ? `border-${side}` : 'border';
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `${prefix}-${tailwindStyle}`,
      confidence: 1.0,
      category: 'borders',
    isArbitrary: false,
    });
  }

  return suggestions;
}
