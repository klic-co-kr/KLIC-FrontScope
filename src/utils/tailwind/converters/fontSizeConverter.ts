/**
 * Font Size Converter
 *
 * CSS font-size → Tailwind 클래스 변환
 */

import type { ConversionSuggestion } from '../../../types/tailwindScanner';

/**
 * Tailwind 폰트 크기 스케일
 */
const FONT_SIZE_SCALE: Record<string, { size: string; lineHeight: string }> = {
  'xs': { size: '0.75rem', lineHeight: '1rem' },      // 12px / 16px
  'sm': { size: '0.875rem', lineHeight: '1.25rem' },  // 14px / 20px
  'base': { size: '1rem', lineHeight: '1.5rem' },     // 16px / 24px
  'lg': { size: '1.125rem', lineHeight: '1.75rem' },  // 18px / 28px
  'xl': { size: '1.25rem', lineHeight: '1.75rem' },   // 20px / 28px
  '2xl': { size: '1.5rem', lineHeight: '2rem' },      // 24px / 32px
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px / 36px
  '4xl': { size: '2.25rem', lineHeight: '2.5rem' },   // 36px / 40px
  '5xl': { size: '3rem', lineHeight: '1' },           // 48px / 48px
  '6xl': { size: '3.75rem', lineHeight: '1' },        // 60px / 60px
  '7xl': { size: '4.5rem', lineHeight: '1' },         // 72px / 72px
  '8xl': { size: '6rem', lineHeight: '1' },           // 96px / 96px
  '9xl': { size: '8rem', lineHeight: '1' },           // 128px / 128px
};

/**
 * 단위 변환: px → rem
 */
function pxToRem(px: number): number {
  return px / 16;
}

/**
 * 폰트 크기값 파싱
 */
function parseFontSize(value: string): number | null {
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
 * 가장 가까운 Tailwind 폰트 크기 찾기
 */
function findClosestFontSize(remValue: number): string | null {
  const sizes: Array<{ name: string; value: number }> = [];

  for (const [name, config] of Object.entries(FONT_SIZE_SCALE)) {
    const sizeValue = parseFloat(config.size);
    sizes.push({ name, value: sizeValue });
  }

  // 가장 가까운 크기 찾기
  let closest: string | null = null;
  let minDiff = Infinity;

  for (const { name, value } of sizes) {
    const diff = Math.abs(value - remValue);
    if (diff < minDiff) {
      minDiff = diff;
      closest = name;
    }
  }

  // 허용 오차 범위 내에서만 반환 (10% 이내)
  if (closest && minDiff <= remValue * 0.1) {
    return closest;
  }

  return null;
}

/**
 * font-size 속성 변환
 */
export function convertFontSize(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'font-size') {
    return [];
  }

  const remValue = parseFontSize(cssValue);
  if (remValue === null) {
    suggestions.push({
      css: `font-size: ${cssValue}`,
      tailwind: `text-[${cssValue}]`,
      confidence: 0.6,
      category: 'typography',
      isArbitrary: true
    });
    return suggestions;
  }

  const closest = findClosestFontSize(remValue);
  if (closest) {
    suggestions.push({
      css: `font-size: ${cssValue}`,
      tailwind: `text-${closest}`,
      confidence: 0.9,
      category: 'typography',
    isArbitrary: false,
    });
  }

  // 임의 값 대안
  suggestions.push({
    css: `font-size: ${cssValue}`,
    tailwind: `text-[${remValue}rem]`,
    confidence: 0.8,
    category: 'typography',
    isArbitrary: true,
  });

  return suggestions;
}

/**
 * line-height 속성 변환
 */
export function convertLineHeight(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'line-height') {
    return [];
  }

  // 단위 없는 값 (비율)
  if (/^\d+(\.\d+)?$/.test(cssValue)) {
    const value = parseFloat(cssValue);

    // 표준 line-height 매핑
    const standardLineHeights: Record<string, number> = {
      'none': 1,
      'tight': 1.25,
      'snug': 1.375,
      'normal': 1.5,
      'relaxed': 1.625,
      'loose': 2,
    };

    let closest: string | null = null;
    let minDiff = Infinity;

    for (const [name, ratio] of Object.entries(standardLineHeights)) {
      const diff = Math.abs(ratio - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = name;
      }
    }

    if (closest && minDiff < 0.1) {
      suggestions.push({
        css: `line-height: ${cssValue}`,
        tailwind: `leading-${closest}`,
        confidence: 0.95,
        category: 'typography',
        isArbitrary: false,
      });
    }

    // 임의 값
    suggestions.push({
      css: `line-height: ${cssValue}`,
      tailwind: `leading-[${cssValue}]`,
      confidence: 0.7,
      category: 'typography',
      isArbitrary: true,
    });
  } else {
    // 단위 있는 값
    suggestions.push({
      css: `line-height: ${cssValue}`,
      tailwind: `leading-[${cssValue}]`,
      confidence: 0.8,
      category: 'typography',
      isArbitrary: true,
    });
  }

  return suggestions;
}

/**
 * letter-spacing 속성 변환
 */
export function convertLetterSpacing(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'letter-spacing') {
    return [];
  }

  // em 단위 변환
  const emMatch = cssValue.match(/^([\d.-]+)em$/);
  if (emMatch) {
    const emValue = parseFloat(emMatch[1]);

    const trackingValues: Record<string, number> = {
      'tighter': -0.05,
      'tight': -0.025,
      'normal': 0,
      'wide': 0.025,
      'wider': 0.05,
      'widest': 0.1,
    };

    let closest: string | null = null;
    let minDiff = Infinity;

    for (const [name, value] of Object.entries(trackingValues)) {
      const diff = Math.abs(value - emValue);
      if (diff < minDiff) {
        minDiff = diff;
        closest = name;
      }
    }

    if (closest && minDiff < 0.02) {
      suggestions.push({
        css: `letter-spacing: ${cssValue}`,
        tailwind: `tracking-${closest}`,
        confidence: 0.9,
        category: 'typography',
        isArbitrary: false,
      });
    }
  }

  // 임의 값
  suggestions.push({
    css: `letter-spacing: ${cssValue}`,
    tailwind: `tracking-[${cssValue}]`,
    confidence: 0.8,
    category: 'typography',
    isArbitrary: true,
  });

  return suggestions;
}

/**
 * font-weight 속성 변환
 */
export function convertFontWeight(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'font-weight') {
    return [];
  }

  // 숫자 값
  const weightNum = parseInt(cssValue, 10);
  if (isNaN(weightNum)) {
    // named values
    const namedWeights: Record<string, string> = {
      'thin': '100',
      'extralight': '200',
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
      'extrabold': '800',
      'black': '900',
    };

    const tailwindWeight = namedWeights[cssValue.toLowerCase()];
    if (tailwindWeight) {
      suggestions.push({
        css: `font-weight: ${cssValue}`,
        tailwind: `font-${tailwindWeight}`,
        confidence: 1.0,
        category: 'typography',
        isArbitrary: false,
      });
    }
  } else {
    // 표준 font-weight 매핑
    const weightMap: Record<number, string> = {
      100: 'thin',
      200: 'extralight',
      300: 'light',
      400: 'normal',
      500: 'medium',
      600: 'semibold',
      700: 'bold',
      800: 'extrabold',
      900: 'black',
    };

    const tailwindWeight = weightMap[weightNum];
    if (tailwindWeight) {
      suggestions.push({
        css: `font-weight: ${cssValue}`,
        tailwind: `font-${tailwindWeight}`,
        confidence: 1.0,
        category: 'typography',
        isArbitrary: false,
      });
    } else {
      suggestions.push({
        css: `font-weight: ${cssValue}`,
        tailwind: `font-[${weightNum}]`,
        confidence: 0.8,
        category: 'typography',
        isArbitrary: true,
      });
    }
  }

  return suggestions;
}

/**
 * text-align 속성 변환
 */
export function convertTextAlign(
  cssProperty: string,
  cssValue: string
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  if (cssProperty !== 'text-align') {
    return [];
  }

  const alignMap: Record<string, string> = {
    'left': 'left',
    'center': 'center',
    'right': 'right',
    'justify': 'justify',
    'start': 'start',
    'end': 'end',
  };

  const tailwindAlign = alignMap[cssValue.toLowerCase()];
  if (tailwindAlign) {
    suggestions.push({
      css: `text-align: ${cssValue}`,
      tailwind: `text-${tailwindAlign}`,
      confidence: 1.0,
      category: 'typography',
    isArbitrary: false,
    });
  }

  return suggestions;
}

/**
 * 계산된 스타일에서 폰트 관련 속성 추출
 */
export function extractFontFromStyles(
  computedStyle: CSSStyleDeclaration
): ConversionSuggestion[] {
  const suggestions: ConversionSuggestion[] = [];

  const fontSize = computedStyle.fontSize;
  const lineHeight = computedStyle.lineHeight;
  const fontWeight = computedStyle.fontWeight;
  const letterSpacing = computedStyle.letterSpacing;
  const textAlign = computedStyle.textAlign;

  if (fontSize && fontSize !== '16px') {
    suggestions.push(...convertFontSize('font-size', fontSize));
  }

  if (lineHeight && lineHeight !== 'normal') {
    suggestions.push(...convertLineHeight('line-height', lineHeight));
  }

  if (fontWeight && fontWeight !== '400') {
    suggestions.push(...convertFontWeight('font-weight', fontWeight));
  }

  if (letterSpacing && letterSpacing !== 'normal') {
    suggestions.push(...convertLetterSpacing('letter-spacing', letterSpacing));
  }

  if (textAlign && textAlign !== 'start') {
    suggestions.push(...convertTextAlign('text-align', textAlign));
  }

  return suggestions;
}
