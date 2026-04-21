/**
 * Font Analyzer Utilities
 *
 * 폰트 분석 유틸리티
 */

import type { FontInfo } from '../../types/cssScan';

/**
 * 폰트 정보 추출
 */
export function extractFontInfo(element: HTMLElement): FontInfo | null {
  const computedStyle = window.getComputedStyle(element);

  const fontSize = computedStyle.getPropertyValue('font-size');
  const fontFamily = computedStyle.getPropertyValue('font-family');
  const fontWeight = computedStyle.getPropertyValue('font-weight');
  const fontStyle = computedStyle.getPropertyValue('font-style');
  const lineHeight = computedStyle.getPropertyValue('line-height');
  const letterSpacing = computedStyle.getPropertyValue('letter-spacing');
  const wordSpacing = computedStyle.getPropertyValue('word-spacing');
  const fontVariant = computedStyle.getPropertyValue('font-variant');

  // 폰트 크기 파싱
  const sizeMatch = fontSize.match(/^([\d.]+)(px|em|rem|%|pt|vw|vh)?$/i);
  const sizeValue = sizeMatch ? parseFloat(sizeMatch[1]) : 16;
  const sizeUnit = sizeMatch?.[2] || 'px';

  // 라인 높이 파싱
  let lineHeightNum = 1.5;
  if (lineHeight !== 'normal') {
    const lineMatch = lineHeight.match(/^([\d.]+)(px|em|rem|%)?$/i);
    if (lineMatch) {
      lineHeightNum = parseFloat(lineMatch[1]);
    }
  }

  return {
    family: fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
    size: sizeValue,
    sizeUnit,
    weight: parseFontWeight(fontWeight),
    style: fontStyle,
    lineHeight: lineHeightNum,
    letterSpacing,
    wordSpacing,
    variant: fontVariant,
  };
}

/**
 * 폰트 두께 파싱
 */
function parseFontWeight(weight: string): number | string {
  const numericWeight = parseInt(weight);
  if (!isNaN(numericWeight)) {
    return numericWeight;
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
    'demibold': 600,
    bold: 700,
    'extra-bold': 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
  };

  return weightMap[weight.toLowerCase()] || 400;
}

/**
 * 페이지의 모든 폰트 추출
 */
export function extractPageFonts(): Array<{
  family: string;
  weights: Set<number>;
  styles: Set<string>;
  usage: number;
}> {
  const fontMap = new Map<string, {
    weights: Set<number>;
    styles: Set<string>;
    usage: number;
  }>();

  const elements = document.querySelectorAll('*');
  const textElements = Array.from(elements).filter(
    el => el.childNodes.length > 0 || (el.textContent?.length || 0) > 0
  );

  for (const element of textElements) {
    if (!(element instanceof HTMLElement)) continue;

    const fontInfo = extractFontInfo(element);
    if (!fontInfo) continue;

    const key = fontInfo.family.toLowerCase();

    if (!fontMap.has(key)) {
      fontMap.set(key, {
        weights: new Set(),
        styles: new Set(),
        usage: 0,
      });
    }

    const fontData = fontMap.get(key)!;
    if (typeof fontInfo.weight === 'number') {
      fontData.weights.add(fontInfo.weight);
    }
    fontData.styles.add(fontInfo.style);
    fontData.usage++;
  }

  return Array.from(fontMap.entries()).map(([family, data]) => ({
    family,
    weights: data.weights,
    styles: data.styles,
    usage: data.usage,
  }));
}

/**
 * 폰트 페어 추천 (컨트라스트 폰트)
 */
export function suggestFontPair(currentFont: FontInfo): string[] {
  const pairs: Record<string, string[]> = {
    serif: ['Georgia', 'Times New Roman', 'Palatino'],
    'sans-serif': ['Arial', 'Helvetica', 'Verdana', 'Open Sans'],
    monospace: ['Courier New', 'Consolas', 'Monaco'],
    cursive: ['Brush Script MT', 'Comic Sans MS'],
    fantasy: ['Impact', 'Copperplate'],
  };

  const currentFamily = currentFont.family.toLowerCase();

  for (const [category, fonts] of Object.entries(pairs)) {
    if (currentFamily.includes(category)) {
      return fonts;
    }
  }

  return pairs['sans-serif'];
}

/**
 * 폰트 크기 계층 구조 분석
 */
export function analyzeFontSizeHierarchy(): Array<{
  level: number;
  fontSize: number;
  unit: string;
  elements: number;
  commonTags: string[];
}> {
  const sizeMap = new Map<string, {
    fontSize: number;
    unit: string;
    elements: string[];
  }>();

  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button');

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const computedStyle = window.getComputedStyle(element);
    const fontSize = computedStyle.getPropertyValue('font-size');

    const match = fontSize.match(/^([\d.]+)(px|em|rem)?$/i);
    if (!match) continue;

    const sizeValue = parseFloat(match[1]);
    const unit = match[2] || 'px';
    const key = `${sizeValue}${unit}`;

    if (!sizeMap.has(key)) {
      sizeMap.set(key, {
        fontSize: sizeValue,
        unit,
        elements: [],
      });
    }

    const data = sizeMap.get(key)!;
    data.elements.push(element.tagName.toLowerCase());
  }

  return Array.from(sizeMap.values())
    .sort((a, b) => b.fontSize - a.fontSize)
    .map(data => {
      const tagCounts = new Map<string, number>();
      for (const tag of data.elements) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }

      const commonTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

      return {
        level: 0,
        fontSize: data.fontSize,
        unit: data.unit,
        elements: data.elements.length,
        commonTags,
      };
    });
}

/**
 * 텍스트 가독성 점수 계산
 */
export function calculateReadabilityScore(
  element: HTMLElement
): {
  score: number;
  issues: string[];
} {
  const fontInfo = extractFontInfo(element);
  const computedStyle = window.getComputedStyle(element);

  if (!fontInfo) {
    return { score: 0, issues: ['Cannot extract font info'] };
  }

  const issues: string[] = [];
  let score = 100;

  // 폰트 크기 검사
  if (fontInfo.size < 12) {
    issues.push('Font size too small (less than 12px)');
    score -= 20;
  } else if (fontInfo.size < 14) {
    issues.push('Font size could be larger (recommended: 14px+)');
    score -= 10;
  }

  // 라인 높이 검사
  if (fontInfo.lineHeight < 1.3) {
    issues.push('Line height too small (recommended: 1.4+)');
    score -= 15;
  }

  // 폰트 두께 검사
  if (typeof fontInfo.weight === 'number' && fontInfo.weight < 400) {
    issues.push('Font weight too light for body text');
    score -= 10;
  }

  // 컨트라스트 검사
  const textColor = computedStyle.getPropertyValue('color');
  const bgColor = getBackgroundColor(element);

  if (textColor && bgColor) {
    const contrast = calculateContrastRatio(textColor, bgColor);

    if (contrast < 3) {
      issues.push('Contrast ratio too low (WCAG AA requires 4.5:1)');
      score -= 30;
    } else if (contrast < 4.5) {
      issues.push('Contrast ratio below WCAG AA standard (4.5:1)');
      score -= 15;
    }
  }

  // 자간 검사
  if (fontInfo.letterSpacing !== 'normal') {
    const spacing = parseFloat(fontInfo.letterSpacing);
    if (spacing < 0) {
      issues.push('Negative letter spacing may reduce readability');
      score -= 5;
    }
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 배경색 가져오기
 */
function getBackgroundColor(element: HTMLElement): string | null {
  const computedStyle = window.getComputedStyle(element);
  const bgColor = computedStyle.getPropertyValue('background-color');

  if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
    const parent = element.parentElement;
    if (parent) {
      return getBackgroundColor(parent);
    }
    return '#ffffff';
  }

  return bgColor;
}

/**
 * 대비율 계산
 */
function calculateContrastRatio(foreground: string, background: string): number {
  const fgLum = calculateLuminance(foreground);
  const bgLum = calculateLuminance(background);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 밝기 계산
 */
function calculateLuminance(color: string): number {
  const rgb = color.match(/^rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s/);
  if (!rgb) return 0;

  let r = parseInt(rgb[1]) / 255;
  let g = parseInt(rgb[2]) / 255;
  let b = parseInt(rgb[3]) / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 웹 폰트 로드 확인
 */
export function getWebFonts(): Array<{
  family: string;
  url?: string;
  loaded: boolean;
}> {
  const fonts: Array<{ family: string; url?: string; loaded: boolean }> = [];

  // @font-face 규칙에서 추출
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;

      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSFontFaceRule) {
          const family = rule.style.getPropertyValue('font-family');
          const src = rule.style.getPropertyValue('src');

          const urlMatch = src.match(/url\(['"]?([^'")]+)['"]?\)/);
          const url = urlMatch ? urlMatch[1] : undefined;

          fonts.push({
            family: family.replace(/['"]/g, ''),
            url,
            loaded: isFontLoaded(family),
          });
        }
      }
    } catch {
      // CORS 제한 무시
    }
  }

  return fonts;
}

/**
 * 폰트 로드 확인
 */
function isFontLoaded(fontFamily: string): boolean {
  return document.fonts.check(`12px "${fontFamily}"`);
}

/**
 * 사용 가능한 시스템 폰트
 */
export function getSystemFonts(): string[] {
  const testString = 'mmmmmmmmmmlli';

  const testFonts = [
    'Arial',
    'Arial Black',
    'Arial Narrow',
    'Calibri',
    'Cambria',
    'Cambria Math',
    'Comic Sans MS',
    'Consolas',
    'Courier',
    'Courier New',
    'Georgia',
    'Helvetica',
    'Impact',
    'Lucida Console',
    'Lucida Sans Unicode',
    'Palatino Linotype',
    'Segoe UI',
    'Tahoma',
    'Times',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Monaco',
  ];

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return [];

  const baselineWidth = context.measureText(testString).width;
  const availableFonts: string[] = [];

  for (const font of testFonts) {
    context.font = `12px "${font}"`;
    const width = context.measureText(testString).width;

    if (width !== baselineWidth) {
      availableFonts.push(font);
    }
  }

  return availableFonts;
}
