/**
 * Padding Converter
 *
 * CSS padding → Tailwind 클래스 변환
 */

import type { ConversionSuggestion } from '../../../types/tailwindScanner';

/**
 * Tailwind padding 스케일 (px 단위)
 */
export const PADDING_SCALE: Record<string, string> = {
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '7': '1.75rem',   // 28px
  '8': '2rem',      // 32px
  '9': '2.25rem',   // 36px
  '10': '2.5rem',   // 40px
  '11': '2.75rem',  // 44px
  '12': '3rem',     // 48px
  '14': '3.5rem',   // 56px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px
  '28': '7rem',     // 112px
  '32': '8rem',     // 128px
  '36': '9rem',     // 144px
  '40': '10rem',    // 160px
  '44': '11rem',    // 176px
  '48': '12rem',    // 192px
  '52': '13rem',    // 208px
  '56': '14rem',    // 224px
  '60': '15rem',    // 240px
  '64': '16rem',    // 256px
  '72': '18rem',    // 288px
  '80': '20rem',    // 320px
  '96': '24rem',    // 384px
};

/**
 * 단위 변환: px → rem (1rem = 16px)
 */
function pxToRem(px: number): number {
  return px / 16;
}

/**
 * 단위 변환: em → rem (기본적으로 1:1, 부모 요소에 따라 다름)
 */
function emToRem(em: number): number {
  return em; // 단순화
}

/**
 * padding 단순화
 */
export function parsePaddingValue(value: string): string | null {
  // 숫자 추출
  const match = value.match(/^([\d.]+)(px|rem|em|%)?$/);
  if (!match) {
    return null;
  }

  const numValue = parseFloat(match[1]);
  const unit = match[2] || 'rem';

  // px 변환
  let inRem = numValue;
  if (unit === 'px') {
    inRem = pxToRem(numValue);
  } else if (unit === 'em') {
    inRem = emToRem(numValue);
  }

  // 가장 가까운 Tailwind 값 찾기
  return findClosestPadding(inRem);
}

/**
 * 가장 가까운 Tailwind padding 값 찾기
 */
function findClosestPadding(remValue: number): string | null {
  let closest: string | null = null;
  let minDiff = Infinity;

  for (const [key, value] of Object.entries(PADDING_SCALE)) {
    const scaleValue = parseFloat(value);
    const diff = Math.abs(scaleValue - remValue);

    if (diff < minDiff) {
      minDiff = diff;
      closest = key;
    }
  }

  // 허용 오차 범위 내에서만 반환 (10% 이내)
  if (closest && minDiff <= 0.05) {
    return closest;
  }

  return null;
}

/**
 * padding 속성 변환
 */
export function convertPadding(cssProperty: string, cssValue: string): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  // padding: all
  if (cssProperty === 'padding') {
    const values = cssValue.split(/\s+/);
    const tailwindClass = convertPaddingShorthand(values);
    if (tailwindClass) {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: tailwindClass,
        confidence: 0.95,
        category: 'spacing',
        isArbitrary: false,
      });
    }
    return suggestions;
  }

  // padding-top, padding-bottom → py
  if (cssProperty === 'padding-top' || cssProperty === 'padding-bottom') {
    const value = parsePaddingValue(cssValue);
    if (value) {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `py-${value}`,
        confidence: 0.9,
        category: 'spacing',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `py-[${cssValue}]`,
        confidence: 0.8,
        category: 'spacing',
        isArbitrary: true,
      });
    }
  }

  // padding-left, padding-right → px
  if (cssProperty === 'padding-left' || cssProperty === 'padding-right') {
    const value = parsePaddingValue(cssValue);
    if (value) {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `px-${value}`,
        confidence: 0.9,
        category: 'spacing',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `px-[${cssValue}]`,
        confidence: 0.8,
        category: 'spacing',
        isArbitrary: true,
      });
    }
  }

  // 개별 속성
  const direction = cssProperty.replace('padding-', '');
  const value = parsePaddingValue(cssValue);
  if (value) {
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `p${direction.charAt(0)}-${value}`,
      confidence: 0.95,
      category: 'spacing',
      isArbitrary: false,
    });
  } else {
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `p${direction.charAt(0)}-[${cssValue}]`,
      confidence: 0.8,
      category: 'spacing',
      isArbitrary: true,
    });
  }

  return suggestions;
}

/**
 * padding 단축형 변환
 */
function convertPaddingShorthand(values: string[]): string | null {
  switch (values.length) {
    case 1: {
      // padding: 10px → p-2.5
      const value1 = parsePaddingValue(values[0]);
      if (value1) {
        return `p-${value1}`;
      }
      return `p-[${values[0]}]`;
    }

    case 2: {
      // padding: 10px 20px → py-2.5 px-5
      const v1 = parsePaddingValue(values[0]);
      const v2 = parsePaddingValue(values[1]);
      if (v1 && v2) {
        return `py-${v1} px-${v2}`;
      }
      return `py-[${values[0]}] px-[${values[1]}]`;
    }

    case 3: {
      // padding: 10px 20px 30px → pt-2.5 px-5 pb-7.5
      const v3a = parsePaddingValue(values[0]);
      const v3b = parsePaddingValue(values[1]);
      const v3c = parsePaddingValue(values[2]);
      if (v3a && v3b && v3c) {
        return `pt-${v3a} px-${v3b} pb-${v3c}`;
      }
      return `pt-[${values[0]}] px-[${values[1]}] pb-[${values[2]}]`;
    }

    case 4: {
      // padding: 10px 20px 30px 40px → pt-2.5 pr-5 pb-7.5 pl-10
      const v4a = parsePaddingValue(values[0]);
      const v4b = parsePaddingValue(values[1]);
      const v4c = parsePaddingValue(values[2]);
      const v4d = parsePaddingValue(values[3]);
      if (v4a && v4b && v4c && v4d) {
        return `pt-${v4a} pr-${v4b} pb-${v4c} pl-${v4d}`;
      }
      return `pt-[${values[0]}] pr-[${values[1]}] pb-[${values[2]}] pl-[${values[3]}]`;
    }
  }

  return null;
}

/**
 * 현재 계산된 스타일에서 padding 추출
 */
export function extractPaddingFromStyles(
  computedStyle: CSSStyleDeclaration
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];
  const paddingProps = [
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
  ];

  paddingProps.forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value !== '0px') {
      const converted = convertPadding(prop, value);
      suggestions.push(...converted);
    }
  });

  // 동일한 상하/좌우 값으로 최적화
  const top = computedStyle.getPropertyValue('padding-top');
  const bottom = computedStyle.getPropertyValue('padding-bottom');
  const left = computedStyle.getPropertyValue('padding-left');
  const right = computedStyle.getPropertyValue('padding-right');

  if (top === bottom && top !== '0px') {
    const py = convertPadding('padding-top', top);
    if (py.length > 0) {
      suggestions.push({
        css: `padding-top: ${top}; padding-bottom: ${bottom}`,
        tailwind: py[0].tailwind.replace('pt-', 'py-'),
        confidence: 0.95,
        category: 'spacing',
        isArbitrary: false,
      });
    }
  }

  if (left === right && left !== '0px') {
    const px = convertPadding('padding-left', left);
    if (px.length > 0) {
      suggestions.push({
        css: `padding-left: ${left}; padding-right: ${right}`,
        tailwind: px[0].tailwind.replace('pl-', 'px-'),
        confidence: 0.95,
        category: 'spacing',
        isArbitrary: false,
      });
    }
  }

  return suggestions;
}

/**
 * padding 값이 기본값인지 확인
 */
export function isDefaultPadding(value: string): boolean {
  return value === '0px' || value === '0' || value === '0rem';
}

/**
 * padding이 모두 0인지 확인
 */
export function hasNoPadding(computedStyle: CSSStyleDeclaration): boolean {
  return (
    isDefaultPadding(computedStyle.paddingTop) &&
    isDefaultPadding(computedStyle.paddingRight) &&
    isDefaultPadding(computedStyle.paddingBottom) &&
    isDefaultPadding(computedStyle.paddingLeft)
  );
}
