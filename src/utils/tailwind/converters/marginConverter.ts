/**
 * Margin Converter
 *
 * CSS margin → Tailwind 클래스 변환
 */

import type { ConversionSuggestion } from '../../../types/tailwindScanner';
import { parsePaddingValue } from './paddingConverter';

/**
 * margin 속성 변환
 */
export function convertMargin(cssProperty: string, cssValue: string): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  // auto 처리
  if (cssValue === 'auto') {
    if (cssProperty === 'margin-left' || cssProperty === 'margin-right') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: 'mx-auto',
        confidence: 1.0,
        category: 'spacing',
        isArbitrary: false,
      });
    } else if (cssProperty === 'margin') {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: 'mx-auto',
        confidence: 0.9,
        category: 'spacing',
        isArbitrary: false,
      });
    }
    return suggestions;
  }

  // margin: all
  if (cssProperty === 'margin') {
    const values = cssValue.split(/\s+/);
    const tailwindClass = convertMarginShorthand(values);
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

  // 음수 값 처리
  const isNegative = cssValue.startsWith('-');
  const absoluteValue = isNegative ? cssValue.slice(1) : cssValue;

  // margin-top, margin-bottom → my
  if (cssProperty === 'margin-top' || cssProperty === 'margin-bottom') {
    const value = parsePaddingValue(absoluteValue);
    if (value) {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${isNegative ? '-' : ''}my-${value}`,
        confidence: 0.9,
        category: 'spacing',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${isNegative ? '-' : ''}my-[${absoluteValue}]`,
        confidence: 0.8,
        category: 'spacing',
        isArbitrary: true,
      });
    }
  }

  // margin-left, margin-right → mx
  if (cssProperty === 'margin-left' || cssProperty === 'margin-right') {
    const value = parsePaddingValue(absoluteValue);
    if (value) {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${isNegative ? '-' : ''}mx-${value}`,
        confidence: 0.9,
        category: 'spacing',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `${cssProperty}: ${cssValue}`,
        tailwind: `${isNegative ? '-' : ''}mx-[${absoluteValue}]`,
        confidence: 0.8,
        category: 'spacing',
        isArbitrary: true,
      });
    }
  }

  // 개별 속성
  const direction = cssProperty.replace('margin-', '');
  const value = parsePaddingValue(absoluteValue);
  if (value) {
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `${isNegative ? '-' : ''}m${direction.charAt(0)}-${value}`,
      confidence: 0.95,
      category: 'spacing',
      isArbitrary: false,
    });
  } else {
    suggestions.push({
      css: `${cssProperty}: ${cssValue}`,
      tailwind: `${isNegative ? '-' : ''}m${direction.charAt(0)}-[${absoluteValue}]`,
      confidence: 0.8,
      category: 'spacing',
      isArbitrary: true,
    });
  }

  return suggestions;
}

/**
 * margin 단축형 변환
 */
function convertMarginShorthand(values: string[]): string | null {

  // 음수 값 처리
  const processedValues = values.map((v) => {
    if (v === 'auto') return 'auto';
    const isNegative = v.startsWith('-');
    const absoluteValue = isNegative ? v.slice(1) : v;
    const parsed = parsePaddingValue(absoluteValue);
    if (parsed) {
      return isNegative ? `-${parsed}` : parsed;
    }
    return v;
  });

  switch (values.length) {
    case 1: {
      const v1 = processedValues[0];
      if (v1 === 'auto') {
        return 'mx-auto';
      }
      if (v1.startsWith('-') || v1.match(/^\d+$/)) {
        return `m-${v1}`;
      }
      return `m-[${values[0]}]`;
    }

    case 2: {
      // margin: 10px 20px → my-2.5 mx-5
      const v2a = processedValues[0];
      const v2b = processedValues[1];
      if (v2b === 'auto') {
        return `my-${v2a} mx-auto`;
      }
      if (v2a.match(/^-?\d+$/) && v2b.match(/^-?\d+$/)) {
        return `my-${v2a} mx-${v2b}`;
      }
      return `my-[${values[0]}] mx-[${values[1]}]`;
    }

    case 3: {
      // margin: 10px 20px 30px → mt-2.5 mx-5 mb-7.5
      const v3a = processedValues[0];
      const v3b = processedValues[1];
      const v3c = processedValues[2];
      if (v3b === 'auto') {
        return `mt-${v3a} mx-auto mb-${v3c}`;
      }
      if (v3a.match(/^-?\d+$/) && v3b.match(/^-?\d+$/) && v3c.match(/^-?\d+$/)) {
        return `mt-${v3a} mx-${v3b} mb-${v3c}`;
      }
      return `mt-[${values[0]}] mx-[${values[1]}] mb-[${values[2]}]`;
    }

    case 4: {
      // margin: 10px 20px 30px 40px → mt-2.5 mr-5 mb-7.5 ml-10
      const v4a = processedValues[0];
      const v4b = processedValues[1];
      const v4c = processedValues[2];
      const v4d = processedValues[3];
      if (v4a.match(/^-?\d+$/) && v4b.match(/^-?\d+$/) && v4c.match(/^-?\d+$/) && v4d.match(/^-?\d+$/)) {
        return `mt-${v4a} mr-${v4b} mb-${v4c} ml-${v4d}`;
      }
      return `mt-[${values[0]}] mr-[${values[1]}] mb-[${values[2]}] ml-[${values[3]}]`;
    }
  }

  return null;
}

/**
 * 현재 계산된 스타일에서 margin 추출
 */
export function extractMarginFromStyles(
  computedStyle: CSSStyleDeclaration
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];
  const marginProps = [
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
  ];

  marginProps.forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value !== '0px') {
      const converted = convertMargin(prop, value);
      suggestions.push(...converted);
    }
  });

  // 동일한 상하/좌우 값으로 최적화
  const top = computedStyle.getPropertyValue('margin-top');
  const bottom = computedStyle.getPropertyValue('margin-bottom');
  const left = computedStyle.getPropertyValue('margin-left');
  const right = computedStyle.getPropertyValue('margin-right');

  // mx-auto 특수 처리
  if (left === right && (left === 'auto' || right === 'auto')) {
    suggestions.push({
      css: `margin-left: ${left}; margin-right: ${right}`,
      tailwind: 'mx-auto',
      confidence: 1.0,
      category: 'spacing',
      isArbitrary: false,
    });
  } else if (left === right && left !== '0px') {
    const mx = convertMargin('margin-left', left);
    if (mx.length > 0) {
      const mxClass = mx[0].tailwind.replace('ml-', 'mx-');
      suggestions.push({
        css: `margin-left: ${left}; margin-right: ${right}`,
        tailwind: mxClass,
        confidence: 0.95,
        category: 'spacing',
        isArbitrary: mx[0].isArbitrary,
      });
    }
  }

  if (top === bottom && top !== '0px') {
    const my = convertMargin('margin-top', top);
    if (my.length > 0) {
      const myClass = my[0].tailwind.replace('mt-', 'my-');
      suggestions.push({
        css: `margin-top: ${top}; margin-bottom: ${bottom}`,
        tailwind: myClass,
        confidence: 0.95,
        category: 'spacing',
        isArbitrary: my[0].isArbitrary,
      });
    }
  }

  return suggestions;
}

/**
 * space-between 변환
 */
export function convertSpaceBetween(
  gapValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  const value = parsePaddingValue(gapValue);
  if (value) {
    // flex 또는 grid 레이아웃에서 gap 사용
    suggestions.push({
      css: `gap: ${gapValue}`,
      tailwind: `gap-${value}`,
      confidence: 0.95,
      category: 'spacing',
      isArbitrary: false,
    });
  } else {
    suggestions.push({
      css: `gap: ${gapValue}`,
      tailwind: `gap-[${gapValue}]`,
      confidence: 0.8,
      category: 'spacing',
      isArbitrary: true,
    });
  }

  // space-x/y 대안 (flex 레이아웃용)
  suggestions.push({
    css: `gap: ${gapValue}`,
    tailwind: `space-x-${value || gapValue}`,
    confidence: 0.7,
    category: 'spacing',
    isArbitrary: !value,
  });

  return suggestions;
}

/**
 * margin 값이 기본값인지 확인
 */
export function isDefaultMargin(value: string): boolean {
  return value === '0px' || value === '0' || value === '0rem';
}

/**
 * margin이 모두 0인지 확인
 */
export function hasNoMargin(computedStyle: CSSStyleDeclaration): boolean {
  return (
    isDefaultMargin(computedStyle.marginTop) &&
    isDefaultMargin(computedStyle.marginRight) &&
    isDefaultMargin(computedStyle.marginBottom) &&
    isDefaultMargin(computedStyle.marginLeft)
  );
}
