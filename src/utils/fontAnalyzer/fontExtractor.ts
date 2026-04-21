/**
 * Font Extractor Utilities
 *
 * 폰트 추출 유틸리티
 */

import type { FontInfo, FontMetrics } from '../../types/fontAnalyzer';

/**
 * 요소에서 폰트 정보 추출
 */
export function extractFontInfo(element: HTMLElement): FontInfo | null {
  if (!element) return null;

  const computedStyle = window.getComputedStyle(element);

  const fontSize = computedStyle.getPropertyValue('font-size');
  const fontFamily = computedStyle.getPropertyValue('font-family');
  const fontWeight = computedStyle.getPropertyValue('font-weight');
  const fontStyle = computedStyle.getPropertyValue('font-style');
  const lineHeight = computedStyle.getPropertyValue('line-height');
  const letterSpacing = computedStyle.getPropertyValue('letter-spacing');
  const wordSpacing = computedStyle.getPropertyValue('word-spacing');
  const fontVariant = computedStyle.getPropertyValue('font-variant');
  const fontStretch = computedStyle.getPropertyValue('font-stretch');

  // 폰트 크기 파싱
  const sizeMatch = fontSize.match(/^([\d.]+)(px|em|rem|%|pt|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pc)?$/i);
  const sizeValue = sizeMatch ? parseFloat(sizeMatch[1]) : 16;
  const sizeUnit = sizeMatch?.[2] || 'px';

  // 폰트 패밀리
  const primaryFamily = fontFamily
    .split(',')[0]
    .replace(/['"]/g, '')
    .trim();

  return {
    family: primaryFamily,
    style: fontStyle,
    weight: parseFontWeight(fontWeight),
    size: sizeValue,
    sizeUnit,
    lineHeight: parseFloat(lineHeight) || 1.5,
    letterSpacing,
    wordSpacing,
    variant: fontVariant,
    stretch: fontStretch,
  };
}

/**
 * 폰트 두께 파싱
 */
export function parseFontWeight(weight: string): number | string {
  const numericWeight = parseInt(weight);
  if (!isNaN(numericWeight)) {
    return numericWeight;
  }

  const weightMap: Record<string, number> = {
    thin: 100,
    'extra-light': 200,
    ultralight: 200,
    extralight: 200,
    light: 300,
    'semi-light': 350,
    normal: 400,
    regular: 400,
    book: 400,
    medium: 500,
    'semi-bold': 600,
    demibold: 600,
    'demi-bold': 600,
    bold: 700,
  'extra-bold': 800,
  ultrabold: 800,
  extrabold: 800,
  black: 900,
    heavy: 900,
  };

  return weightMap[weight.toLowerCase()] || 400;
}

/**
 * 폰트 스타일 정규화
 */
export function normalizeFontStyle(style: string): string {
  const normalized = style.toLowerCase();
  if (normalized === 'italic' || normalized === 'oblique') {
    return normalized;
  }
  return 'normal';
}

/**
 * 폰트 메트릭스 추출
 */
export function extractFontMetrics(
  element: HTMLElement,
  canvas?: HTMLCanvasElement
): FontMetrics | null {
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.getPropertyValue('font-size'));

  // 캔버스 생성
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 200;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.font = computedStyle.font;

  // EM 높이 계산
  const emHeight = fontSize;
  const capHeight = emHeight * 0.7;
  const xHeight = emHeight * 0.5;

  // 어센트/디센드 추정 (간략화)
  const ascent = emHeight * 0.8;
  const descent = emHeight * 0.2;

  return {
    emHeight,
    ascent,
    descent,
    ascender: ascent,
    descender: -descent,
    capHeight,
    xHeight,
    unitsPerEm: 1000,
  };
}

/**
 * 렌더링된 폰트 패밀리 감지
 */
export function getRenderedFontFamily(element: HTMLElement): string | null {
  const computedStyle = window.getComputedStyle(element);
  const fontFamily = computedStyle.getPropertyValue('font-family');

  // 첫 번째 폰트패밀리 반환
  return fontFamily.split(',')[0]?.replace(/['"]/g, '').trim() || null;
}

/**
 * 폰트 대체(fallback) 체인
 */
export function detectFontFallback(
  requestedFont: string
): {
  actual: string;
  reason: string;
} | null {
  const testElement = document.createElement('span');
  testElement.style.fontFamily = requestedFont;
  testElement.style.visibility = 'hidden';
  testElement.textContent = 'A';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const actualFont = computedStyle.getPropertyValue('font-family');

  document.body.removeChild(testElement);

  if (actualFont !== requestedFont) {
    return {
      actual: actualFont,
      reason: 'Font not available, fallback used',
    };
  }

  return null;
}

/**
 * 폰트 사용 가능 여부 확인
 */
export function isFontAvailable(family: string): boolean {
  return detectFontFallback(family) === null;
}

/**
 * 텍스트에서 사용된 모든 폰트 추출
 */
export function extractFontsFromText(container: HTMLElement = document.body): Map<
  string,
  {
    count: number;
    elements: string[];
    weights: Set<number>;
    styles: Set<string>;
  }
> {
  const fontMap = new Map<
    string,
    {
      count: number;
      elements: string[];
      weights: Set<number>;
      styles: Set<string>;
    }
  >();

  const elements = container.querySelectorAll('*');

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    // 텍스트 내용이 있는 요소만
    if (!element.textContent?.trim()) continue;

    const fontInfo = extractFontInfo(element);
    if (!fontInfo) continue;

    const key = fontInfo.family.toLowerCase();

    if (!fontMap.has(key)) {
      fontMap.set(key, {
        count: 0,
        elements: [],
        weights: new Set(),
        styles: new Set(),
      });
    }

    const data = fontMap.get(key)!;
    data.count++;
    data.elements.push(describeElement(element));

    if (typeof fontInfo.weight === 'number') {
      data.weights.add(fontInfo.weight);
    }

    data.styles.add(fontInfo.style);
  }

  return fontMap;
}

/**
 * 요소 설명
 */
function describeElement(element: HTMLElement): string {
  const parts: string[] = [];

  parts.push(element.tagName.toLowerCase());

  if (element.id) {
    parts.push(`#${element.id}`);
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(c => c);
    parts.push(...classes.map(c => `.${c}`));
  }

  return parts.join('');
}

/**
 * 페이지에서 사용된 모든 폰트 추출
 */
export function extractAllPageFonts(): Array<{
  family: string;
  count: number;
  percentage: number;
  weights: number[];
  styles: string[];
}> {
  const fontMap = extractFontsFromText();
  const totalElements = Array.from(fontMap.values()).reduce((sum, data) => sum + data.count, 0);

  return Array.from(fontMap.entries())
    .map(([family, data]) => ({
      family,
      count: data.count,
      percentage: (data.count / totalElements) * 100,
      weights: Array.from(data.weights).sort((a, b) => a - b),
      styles: Array.from(data.styles),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 폰트 크기 분석
 */
export function analyzeFontSizes(
  container: HTMLElement | Document = document
): {
  sizes: Array<{ size: number; unit: string; count: number }>;
  minSize: number;
  maxSize: number;
  averageSize: number;
  mostCommon: { size: number; unit: string } | null;
} {
  const sizeMap = new Map<string, number>();
  const sizes: Array<{ size: number; unit: string; count: number }> = [];

  const elements = (container === document
    ? document.querySelectorAll('*')
    : container.querySelectorAll('*')
  ) as NodeListOf<HTMLElement>;

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const fontInfo = extractFontInfo(element);
    if (!fontInfo) continue;

    const key = `${fontInfo.size}${fontInfo.sizeUnit}`;
    sizeMap.set(key, (sizeMap.get(key) || 0) + 1);
  }

  for (const [key, count] of sizeMap.entries()) {
    const match = key.match(/([\d.]+)(px|em|rem|%|pt|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pc)?$/i);
    if (match) {
      sizes.push({
        size: parseFloat(match[1]),
        unit: match[2] || 'px',
        count,
      });
    }
  }

  sizes.sort((a, b) => a.size - b.size);

  const numericSizes = sizes.map(s => s.size);
  const minSize = numericSizes.length > 0 ? Math.min(...numericSizes) : 0;
  const maxSize = numericSizes.length > 0 ? Math.max(...numericSizes) : 0;
  const averageSize = numericSizes.length > 0
    ? numericSizes.reduce((sum, size) => sum + size, 0) / numericSizes.length
    : 0;

  const mostCommon = sizes.length > 0 ? sizes.reduce((prev, curr) =>
    curr.count > prev.count ? curr : prev
  ) : null;

  return {
    sizes,
    minSize,
    maxSize,
    averageSize,
    mostCommon,
  };
}

/**
 * 줄 높이 분석
 */
export function analyzeLineHeights(
  container: HTMLElement | Document = document
): {
  lineHeights: Array<{ lineHeight: number; count: number }>;
  average: number;
  min: number;
  max: number;
  recommendations: string[];
} {
  const lineMap = new Map<number, number>();
  const lineHeights: Array<{ lineHeight: number; count: number }> = [];

  const elements = (container === document
    ? document.querySelectorAll('*')
    : container.querySelectorAll('*')
  ) as NodeListOf<HTMLElement>;

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const computedStyle = window.getComputedStyle(element);
    const lineHeightStr = computedStyle.getPropertyValue('line-height');

    // 줄 높이 계산
    let lineHeight: number | undefined;
    if (lineHeightStr === 'normal') {
      lineHeight = 1.2;
    } else {
      const match = lineHeightStr.match(/^([\d.]+)(px|em|rem|%)?$/);
      if (match) {
        lineHeight = parseFloat(match[1]);
      }
    }

    if (lineHeight !== undefined) {
      lineMap.set(lineHeight, (lineMap.get(lineHeight) || 0) + 1);
    }
  }

  for (const [lineHeight, count] of lineMap.entries()) {
    lineHeights.push({ lineHeight, count });
  }

  lineHeights.sort((a, b) => a.lineHeight - b.lineHeight);

  const numericValues = Array.from(lineMap.keys()).map(Number);
  const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
  const average = numericValues.length > 0
    ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
    : 0;

  const recommendations: string[] = [];

  if (average < 1.3) {
    recommendations.push('줄 높이가 너무 작습니다. 권장: 1.4-1.6');
  } else if (average > 1.8) {
    recommendations.push('줄 높이가 너무 큽니다. 권장: 1.4-1.6');
  }

  return {
    lineHeights,
    average,
    min,
    max,
    recommendations,
  };
}

/**
 * 자간(letterspacing) 분석
 */
export function analyzeLetterSpacing(
  container: HTMLElement | Document = document
): {
  spacingValues: Array<{ value: string; count: number }>;
  normalCount: number;
  nonNormalCount: number;
} {
  const spacingMap = new Map<string, number>();
  let normalCount = 0;

  const elements = (container === document
    ? document.querySelectorAll('*')
    : container.querySelectorAll('*')
  ) as NodeListOf<HTMLElement>;

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const computedStyle = window.getComputedStyle(element);
    const letterSpacing = computedStyle.getPropertyValue('letter-spacing');

    if (letterSpacing === 'normal') {
      normalCount++;
    } else {
      spacingMap.set(letterSpacing, (spacingMap.get(letterSpacing) || 0) + 1);
    }
  }

  const spacingValues = Array.from(spacingMap.entries()).map(([value, count]) => ({
    value,
    count,
  }));

  spacingValues.sort((a, b) => b.count - a.count);

  return {
    spacingValues,
    normalCount,
    nonNormalCount: Array.from(spacingMap.values()).reduce((sum, count) => sum + count, 0),
  };
}

/**
 * 워드 스페이싱(word-spacing) 분석
 */
export function analyzeWordSpacing(
  container: HTMLElement | Document = document
): {
  spacingValues: Array<{ value: string; count: number }>;
  normalCount: number;
  nonNormalCount: number;
} {
  const spacingMap = new Map<string, number>();
  let normalCount = 0;

  const elements = (container === document
    ? document.querySelectorAll('*')
    : container.querySelectorAll('*')
  ) as NodeListOf<HTMLElement>;

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const computedStyle = window.getComputedStyle(element);
    const wordSpacing = computedStyle.getPropertyValue('word-spacing');

    if (wordSpacing === 'normal') {
      normalCount++;
    } else {
      spacingMap.set(wordSpacing, (spacingMap.get(wordSpacing) || 0) + 1);
    }
  }

  const spacingValues = Array.from(spacingMap.entries()).map(([value, count]) => ({
    value,
    count,
  }));

  spacingValues.sort((a, b) => b.count - a.count);

  return {
    spacingValues,
    normalCount,
    nonNormalCount: Array.from(spacingMap.values()).reduce((sum, count) => sum + count, 0),
  };
}
