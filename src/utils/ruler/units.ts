/**
 * 픽셀을 다른 단위로 변환
 */
export function convertFromPixels(
  pixels: number,
  targetUnit: 'px' | 'rem' | 'em',
  context?: HTMLElement
): number {
  if (targetUnit === 'px') {
    return pixels;
  }

  if (targetUnit === 'rem') {
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    return pixels / rootFontSize;
  }

  if (targetUnit === 'em') {
    const contextElement = context || document.documentElement;
    const fontSize = parseFloat(getComputedStyle(contextElement).fontSize);
    return pixels / fontSize;
  }

  return pixels;
}

/**
 * 다른 단위를 픽셀로 변환
 */
export function convertToPixels(
  value: number,
  unit: 'px' | 'rem' | 'em',
  context?: HTMLElement
): number {
  if (unit === 'px') {
    return value;
  }

  if (unit === 'rem') {
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    return value * rootFontSize;
  }

  if (unit === 'em') {
    const contextElement = context || document.documentElement;
    const fontSize = parseFloat(getComputedStyle(contextElement).fontSize);
    return value * fontSize;
  }

  return value;
}

/**
 * 값을 포맷하여 단위와 함께 반환
 */
export function formatWithUnit(
  pixels: number,
  unit: 'px' | 'rem' | 'em',
  precision: number = 2,
  context?: HTMLElement
): string {
  const value = convertFromPixels(pixels, unit, context);
  return `${value.toFixed(precision)}${unit}`;
}

/**
 * CSS 값에서 숫자와 단위 파싱
 */
export function parseCSSValue(cssValue: string): {
  value: number;
  unit: string;
} {
  const match = cssValue.match(/^([-\d.]+)([a-z%]*)$/i);

  if (!match) {
    return { value: 0, unit: 'px' };
  }

  return {
    value: parseFloat(match[1]),
    unit: match[2] || 'px',
  };
}
