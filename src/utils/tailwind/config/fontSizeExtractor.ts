/**
 * Font Size Config Extraction
 *
 * 페이지에서 사용된 font-size 분석 및 Tailwind config 제안
 */

import type { TailwindConfig } from '../../../types/tailwindScanner';

/**
 * FontSize 사용 정보
 */
interface FontSizeUsage {
  remValue: number;
  pxValue: number;
  frequency: number;
  lineHeight?: number;
  contexts: Array<{
    selector: string;
    element: string;
  }>;
}

/**
 * 페이지에서 font-size 추출
 */
export function extractFontSizesFromPage(): FontSizeUsage[] {
  const fontSizeMap = new Map<number, FontSizeUsage>();

  // 모든 요소의 font-size 추출
  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    const fontSize = computedStyle.fontSize;
    const lineHeight = computedStyle.lineHeight;

    if (!fontSize) return;

    const pxValue = parsePxValue(fontSize);
    if (pxValue === null || pxValue === 0) return;

    const remValue = Math.round((pxValue / 16) * 100) / 100;
    const lineHeightValue = parseLineHeight(lineHeight);

    if (fontSizeMap.has(remValue)) {
      const usage = fontSizeMap.get(remValue)!;
      usage.frequency++;
      usage.contexts.push({
        selector: generateSelector(element),
        element: element.tagName.toLowerCase(),
      });
    } else {
      fontSizeMap.set(remValue, {
        remValue,
        pxValue,
        frequency: 1,
        lineHeight: lineHeightValue,
        contexts: [{
          selector: generateSelector(element),
          element: element.tagName.toLowerCase(),
        }],
      });
    }
  });

  // 빈도 기반 정렬
  return Array.from(fontSizeMap.values()).sort((a, b) => b.frequency - a.frequency);
}

/**
 * px 값 파싱
 */
function parsePxValue(value: string): number | null {
  const pxMatch = value.match(/([\d.]+)px/);
  if (!pxMatch) return null;
  return parseFloat(pxMatch[1]);
}

/**
 * line-height 파싱
 */
function parseLineHeight(value: string): number | undefined {
  if (value === 'normal') return undefined;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return undefined;

  return Math.round(numValue * 100) / 100;
}

/**
 * 요소 선택자 생성
 */
function generateSelector(element: Element): string {
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
 * Tailwind fontSize와 비교하여 커스텀 fontSize 식별
 */
export function identifyCustomFontSizes(usages: FontSizeUsage[]): {
  custom: Array<{
    key: string;
    remValue: number;
    pxValue: number;
    frequency: number;
    suggestedKey: string;
  }>;
  tailwind: Array<{
    key: string;
    remValue: number;
    pxValue: number;
    frequency: number;
  }>;
} {
  const custom: Array<{
    key: string;
    remValue: number;
    pxValue: number;
    frequency: number;
    suggestedKey: string;
  }> = [];
  const tailwind: Array<{
    key: string;
    remValue: number;
    pxValue: number;
    frequency: number;
  }> = [];

  // Tailwind 기본 fontSize 스케일 (rem 단위)
  const tailwindFontSizes: Record<string, number> = {
    'xs': 0.75,
    'sm': 0.875,
    'base': 1,
    'lg': 1.125,
    'xl': 1.25,
    '2xl': 1.5,
    '3xl': 1.875,
    '4xl': 2.25,
    '5xl': 3,
    '6xl': 3.75,
    '7xl': 4.5,
    '8xl': 6,
    '9xl': 8,
  };

  usages.forEach((usage) => {
    const { remValue, pxValue, frequency } = usage;

    // 가장 가까운 Tailwind fontSize 찾기
    const closest = findClosestTailwindFontSize(remValue, tailwindFontSizes);

    if (closest && closest.distance < 0.15) {
      // Tailwind fontSize로 간주
      tailwind.push({
        key: closest.key,
        remValue,
        pxValue,
        frequency,
      });
    } else {
      // 커스텀 fontSize
      const suggestedKey = closest ? closest.key : 'base';
      custom.push({
        key: generateCustomFontSizeKey(remValue),
        remValue,
        pxValue,
        frequency,
        suggestedKey,
      });
    }
  });

  return { custom, tailwind };
}

/**
 * 가장 가까운 Tailwind fontSize 찾기
 */
function findClosestTailwindFontSize(
  remValue: number,
  tailwindFontSizes: Record<string, number>
): { key: string; distance: number } | null {
  let closest: { key: string; distance: number } | null = null;
  let minDistance = Infinity;

  for (const [key, value] of Object.entries(tailwindFontSizes)) {
    const distance = Math.abs(value - remValue);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { key, distance };
    }
  }

  return closest;
}

/**
 * 커스텀 fontSize 키 생성
 */
function generateCustomFontSizeKey(remValue: number): string {
  // 소수점 제거 및 정수로 변환
  const scaledValue = Math.round(remValue * 100);
  return `${scaledValue}`;
}

/**
 * fontSize config 생성 (Tailwind v3+ format)
 */
export function generateFontSizeConfig(usages: FontSizeUsage[]): {
  fontSize: Record<string, string | [string, string]>;
  recommendations: string[];
} {
  const { custom } = identifyCustomFontSizes(usages);

  const fontSize: Record<string, string | [string, string]> = {};
  const recommendations: string[] = [];

  // 빈도가 높은 커스텀 fontSize 추가
  custom.filter(c => c.frequency >= 3).forEach((item) => {
    const usage = usages.find(u => u.remValue === item.remValue);
    const lineHeight = usage?.lineHeight;

    if (lineHeight) {
      // [fontSize, lineHeight] format
      fontSize[item.key] = [`${item.remValue}rem`, `${lineHeight}`];
    } else {
      // fontSize only
      fontSize[item.key] = `${item.remValue}rem`;
    }

    if (item.suggestedKey !== item.key) {
      recommendations.push(
        `"${item.key}" (${item.remValue}rem, ${item.pxValue}px)이(가) ${item.frequency}번 사용됨 - ${item.suggestedKey}와 유사`
      );
    }
  });

  return { fontSize, recommendations };
}

/**
 * 완전한 fontSize 설정 추출
 */
export function extractFontSizeConfig(): TailwindConfig['theme'] {
  const usages = extractFontSizesFromPage();
  const { fontSize } = generateFontSizeConfig(usages);

  return {
    extend: {
      fontSize,
    },
  };
}

/**
 * 텍스트 관련 설정 추출
 */
export function extractTextConfig(): {
  fontSize?: Record<string, string | [string, string]>;
  letterSpacing?: Record<string, string>;
  lineHeight?: Record<string, string>;
} {
  const config: {
    fontSize?: Record<string, string | [string, string]>;
    letterSpacing?: Record<string, string>;
    lineHeight?: Record<string, string>;
  } = {};

  // font-size
  const fontSizeConfig = extractFontSizeConfig();
  if (fontSizeConfig?.extend?.fontSize) {
    config.fontSize = fontSizeConfig.extend.fontSize as Record<string, string | [string, string]>;
  }

  // letter-spacing 추출
  const letterSpacingMap = new Map<string, number>();
  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const letterSpacing = computedStyle.letterSpacing;

    if (letterSpacing && letterSpacing !== 'normal') {
      const emMatch = letterSpacing.match(/([\d.-]+)em/);
      if (emMatch) {
        const emValue = emMatch[1];
        const rounded = Math.round(parseFloat(emValue) * 100) / 100;
        letterSpacingMap.set(rounded.toString(), (letterSpacingMap.get(rounded.toString()) || 0) + 1);
      }
    }
  });

  if (letterSpacingMap.size > 0) {
    config.letterSpacing = {};
    letterSpacingMap.forEach((freq, key) => {
      if (freq >= 3) {
        config.letterSpacing![key] = `${key}em`;
      }
    });
  }

  // line-height 추출
  const lineHeightMap = new Map<string, number>();

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = computedStyle.lineHeight;

    if (lineHeight && lineHeight !== 'normal') {
      const numValue = parseFloat(lineHeight);
      if (!isNaN(numValue)) {
        const rounded = Math.round(numValue * 100) / 100;
        lineHeightMap.set(rounded.toString(), (lineHeightMap.get(rounded.toString()) || 0) + 1);
      }
    }
  });

  if (lineHeightMap.size > 0) {
    config.lineHeight = {};
    lineHeightMap.forEach((freq, key) => {
      if (freq >= 3) {
        config.lineHeight![key] = key;
      }
    });
  }

  return config;
}
