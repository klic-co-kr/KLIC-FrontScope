/**
 * Font Comparison Utilities
 *
 * 폰트 비교 유틸리티
 */

import type { FontInfo, FontComparisonResult, FontDiff } from '../../types/fontAnalyzer';
import { extractFontInfo } from './fontExtractor';

/**
 * 두 폰트 정보 비교
 */
export function compareFonts(
  element1: HTMLElement,
  element2: HTMLElement
): FontComparisonResult | null {
  const font1 = extractFontInfo(element1);
  const font2 = extractFontInfo(element2);

  if (!font1 || !font2) {
    return null;
  }

  const diffs: FontDiff[] = [];
  let similarityScore = 100;

  // 폰트 패밀리 비교
  if (font1.family !== font2.family) {
    diffs.push({
      property: 'family',
      value1: font1.family,
      value2: font2.family,
      significant: true,
    });
    similarityScore -= 30;
  }

  // 크기 비교
  const sizeDiff = Math.abs(font1.size - font2.size);
  if (sizeDiff > 0.5) {
    diffs.push({
      property: 'size',
      value1: `${font1.size}${font1.sizeUnit}`,
      value2: `${font2.size}${font2.sizeUnit}`,
      significant: sizeDiff > 2,
    });
    similarityScore -= Math.min(sizeDiff * 5, 20);
  }

  // 두께 비교
  const weight1 = normalizeWeight(font1.weight);
  const weight2 = normalizeWeight(font2.weight);
  const weightDiff = Math.abs(weight1 - weight2);
  if (weightDiff > 50) {
    diffs.push({
      property: 'weight',
      value1: String(font1.weight),
      value2: String(font2.weight),
      significant: weightDiff > 200,
    });
    similarityScore -= Math.min(weightDiff / 10, 15);
  }

  // 스타일 비교
  if (font1.style !== font2.style) {
    diffs.push({
      property: 'style',
      value1: font1.style,
      value2: font2.style,
      significant: true,
    });
    similarityScore -= 10;
  }

  // 줄 높이 비교
  const lineHeightDiff = Math.abs(font1.lineHeight - font2.lineHeight);
  if (lineHeightDiff > 0.1) {
    diffs.push({
      property: 'lineHeight',
      value1: String(font1.lineHeight),
      value2: String(font2.lineHeight),
      significant: lineHeightDiff > 0.5,
    });
    similarityScore -= Math.min(lineHeightDiff * 10, 10);
  }

  // 자간 비교
  if (font1.letterSpacing !== font2.letterSpacing) {
    diffs.push({
      property: 'letterSpacing',
      value1: font1.letterSpacing,
      value2: font2.letterSpacing,
      significant: font1.letterSpacing !== 'normal' || font2.letterSpacing !== 'normal',
    });
    similarityScore -= 5;
  }

  // 워드 스페이싱 비교
  if (font1.wordSpacing !== font2.wordSpacing) {
    diffs.push({
      property: 'wordSpacing',
      value1: font1.wordSpacing,
      value2: font2.wordSpacing,
      significant: font1.wordSpacing !== 'normal' || font2.wordSpacing !== 'normal',
    });
    similarityScore -= 3;
  }

  return {
    font1,
    font2,
    similarityScore: Math.max(0, Math.round(similarityScore)),
    diffs,
    isIdentical: diffs.length === 0,
  };
}

/**
 * 폰트 두께 정규화
 */
function normalizeWeight(weight: number | string): number {
  if (typeof weight === 'number') {
    return weight;
  }
  const weightMap: Record<string, number> = {
    thin: 100,
    'extra-light': 200,
    ultralight: 200,
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    'semi-bold': 600,
    bold: 700,
    'extra-bold': 800,
    black: 900,
  };
  return weightMap[String(weight).toLowerCase()] || 400;
}

/**
 * 여러 요소의 폰트 비교
 */
export function compareMultipleFonts(
  elements: HTMLElement[]
): Array<{
  element: HTMLElement;
  font: FontInfo;
  group: number;
}> {
  const groups: Array<{
    element: HTMLElement;
    font: FontInfo;
    group: number;
  }> = [];

  const fontGroups: FontInfo[][] = [];

  for (const element of elements) {
    const font = extractFontInfo(element);
    if (!font) continue;

    // 기존 그룹에서 유사한 폰트 찾기
    let foundGroup = false;
    for (let i = 0; i < fontGroups.length; i++) {
      const groupFont = fontGroups[i][0];
      if (areFontsSimilar(font, groupFont)) {
        fontGroups[i].push(font);
        groups.push({
          element,
          font,
          group: i,
        });
        foundGroup = true;
        break;
      }
    }

    // 새 그룹 생성
    if (!foundGroup) {
      fontGroups.push([font]);
      groups.push({
        element,
        font,
        group: fontGroups.length - 1,
      });
    }
  }

  return groups;
}

/**
 * 두 폰트가 유사한지 확인
 */
function areFontsSimilar(font1: FontInfo, font2: FontInfo): boolean {
  // 패밀리가 같으면 유사함
  if (font1.family === font2.family) {
    return true;
  }

  // 크기 차이가 1px 이하이고 두께 차이가 100 이하면 유사함
  const sizeDiff = Math.abs(font1.size - font2.size);
  const weightDiff = Math.abs(
    normalizeWeight(font1.weight) - normalizeWeight(font2.weight)
  );

  return sizeDiff <= 1 && weightDiff <= 100;
}

/**
 * 폰트 스타일 그룹화
 */
export function groupFontsByStyle(
  fonts: FontInfo[]
): Map<string, FontInfo[]> {
  const groups = new Map<string, FontInfo[]>();

  for (const font of fonts) {
    // 스타일 키 생성
    const key = `${font.family}-${font.style}-${normalizeWeight(font.weight)}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(font);
  }

  return groups;
}

/**
 * 폰트 변경 감지
 */
export function detectFontChanges(
  element: HTMLElement
): Promise<FontDiff[]> {
  return new Promise(resolve => {
    const initialFont = extractFontInfo(element);
    const diffs: FontDiff[] = [];

    const observer = new MutationObserver(() => {
      const currentFont = extractFontInfo(element);

      if (!currentFont || !initialFont) return;

      if (currentFont.family !== initialFont.family) {
        diffs.push({
          property: 'family',
          value1: initialFont.family,
          value2: currentFont.family,
          significant: true,
        });
      }

      if (currentFont.size !== initialFont.size) {
        diffs.push({
          property: 'size',
          value1: `${initialFont.size}${initialFont.sizeUnit}`,
          value2: `${currentFont.size}${currentFont.sizeUnit}`,
          significant: Math.abs(currentFont.size - initialFont.size) > 1,
        });
      }

      if (diffs.length > 0) {
        observer.disconnect();
        resolve(diffs);
      }
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // 타임아웃
    setTimeout(() => {
      observer.disconnect();
      resolve(diffs);
    }, 5000);
  });
}

/**
 * 폰트 대소문자 스타일 비교
 */
export function compareFontVariant(
  element1: HTMLElement,
  element2: HTMLElement
): {
  variant1: string;
  variant2: string;
  isSame: boolean;
} {
  const font1 = extractFontInfo(element1);
  const font2 = extractFontInfo(element2);

  return {
    variant1: font1?.variant || 'normal',
    variant2: font2?.variant || 'normal',
    isSame: font1?.variant === font2?.variant,
  };
}

/**
 * 폰트 스트레치 비교
 */
export function compareFontStretch(
  element1: HTMLElement,
  element2: HTMLElement
): {
  stretch1: string;
  stretch2: string;
  isSame: boolean;
} {
  const font1 = extractFontInfo(element1);
  const font2 = extractFontInfo(element2);

  return {
    stretch1: font1?.stretch || 'normal',
    stretch2: font2?.stretch || 'normal',
    isSame: font1?.stretch === font2?.stretch,
  };
}

/**
 * 가장 많이 사용된 폰트 찾기
 */
export function findMostCommonFont(
  elements: HTMLElement[]
): FontInfo | null {
  const fontCounts = new Map<string, { font: FontInfo; count: number }>();

  for (const element of elements) {
    const font = extractFontInfo(element);
    if (!font) continue;

    const key = JSON.stringify(font);
    if (!fontCounts.has(key)) {
      fontCounts.set(key, { font, count: 0 });
    }

    fontCounts.get(key)!.count++;
  }

  let maxCount = 0;
  let mostCommon: FontInfo | null = null;

  for (const { font, count } of fontCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = font;
    }
  }

  return mostCommon;
}

/**
 * 폰트 체인 비교 (font-family fallback 체인)
 */
export function compareFontChains(
  element1: HTMLElement,
  element2: HTMLElement
): {
  chain1: string[];
  chain2: string[];
  common: string[];
  onlyIn1: string[];
  onlyIn2: string[];
} {
  const style1 = window.getComputedStyle(element1);
  const style2 = window.getComputedStyle(element2);

  const chain1 = style1.fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
  const chain2 = style2.fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));

  const common = chain1.filter(f => chain2.includes(f));
  const onlyIn1 = chain1.filter(f => !chain2.includes(f));
  const onlyIn2 = chain2.filter(f => !chain1.includes(f));

  return {
    chain1,
    chain2,
    common,
    onlyIn1,
    onlyIn2,
  };
}

/**
 * 폰트 반응형 비교 (다양한 뷰포트에서의 크기 변화)
 */
export function compareResponsiveFont(
  element: HTMLElement,
  breakpoints: number[] = [320, 768, 1024, 1440]
): Array<{
  width: number;
  fontSize: number;
  unit: string;
}> {
  const results: Array<{
    width: number;
    fontSize: number;
    unit: string;
  }> = [];

  for (const width of breakpoints) {
    // 간접적으로 측정 (실제로는 미디어 쿼리가 필요)
    const style = window.getComputedStyle(element);
    const fontSize = style.fontSize;
    const match = fontSize.match(/^([\d.]+)(px|em|rem|%|pt|vw|vh)?$/i);

    if (match) {
      results.push({
        width,
        fontSize: parseFloat(match[1]),
        unit: match[2] || 'px',
      });
    }
  }

  return results;
}
