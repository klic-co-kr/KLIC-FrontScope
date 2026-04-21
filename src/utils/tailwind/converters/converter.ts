/**
 * Unified CSS to Tailwind Converter
 *
 * 모든 변환기를 통합하고 전체 CSS를 Tailwind로 변환
 */

import type { ConversionSuggestion, ConversionReport } from '../../../types/tailwindScanner';
import { convertPadding, extractPaddingFromStyles } from './paddingConverter';
import { convertMargin, extractMarginFromStyles } from './marginConverter';
import { convertColor, convertOpacity } from './colorConverter';
import {
  convertFontSize,
  convertLineHeight,
  convertLetterSpacing,
  convertFontWeight,
  convertTextAlign,
  extractFontFromStyles,
} from './fontSizeConverter';
import {
  convertBorderRadius,
  convertBorderWidth,
  convertBorderStyle,
  extractBorderRadiusFromStyles,
} from './borderRadiusConverter';
import {
  convertDisplay,
  convertPosition,
  convertInset,
  convertOverflow,
  convertZIndex,
  extractLayoutFromStyles,
  convertFlexDirection,
  convertJustifyContent,
  convertAlignItems,
  convertFlexWrap,
  convertGap,
} from './displayConverter';

/**
 * 지원되는 CSS 속성 매핑
 */
const PROPERTY_CONVERTERS: Record<string, (prop: string, value: string) => ConversionSuggestion[]> = {
  // Spacing
  'padding': convertPadding,
  'padding-top': convertPadding,
  'padding-right': convertPadding,
  'padding-bottom': convertPadding,
  'padding-left': convertPadding,
  'margin': convertMargin,
  'margin-top': convertMargin,
  'margin-right': convertMargin,
  'margin-bottom': convertMargin,
  'margin-left': convertMargin,
  'gap': convertGap,
  'row-gap': convertGap,
  'column-gap': convertGap,

  // Colors
  'color': convertColor,
  'background-color': convertColor,
  'background': convertColor,
  'border-color': convertBorderWidth,
  'border-top-color': convertBorderWidth,
  'border-right-color': convertBorderWidth,
  'border-bottom-color': convertBorderWidth,
  'border-left-color': convertBorderWidth,
  'opacity': (prop, value) => convertOpacity(prop, value),

  // Typography
  'font-size': convertFontSize,
  'line-height': convertLineHeight,
  'letter-spacing': convertLetterSpacing,
  'font-weight': convertFontWeight,
  'text-align': convertTextAlign,

  // Borders
  'border-radius': convertBorderRadius,
  'border-top-left-radius': convertBorderRadius,
  'border-top-right-radius': convertBorderRadius,
  'border-bottom-right-radius': convertBorderRadius,
  'border-bottom-left-radius': convertBorderRadius,
  'border-width': convertBorderWidth,
  'border-top-width': convertBorderWidth,
  'border-right-width': convertBorderWidth,
  'border-bottom-width': convertBorderWidth,
  'border-left-width': convertBorderWidth,
  'border-style': convertBorderStyle,
  'border-top-style': convertBorderStyle,
  'border-right-style': convertBorderStyle,
  'border-bottom-style': convertBorderStyle,
  'border-left-style': convertBorderStyle,

  // Layout
  'display': convertDisplay,
  'position': convertPosition,
  'top': convertInset,
  'right': convertInset,
  'bottom': convertInset,
  'left': convertInset,
  'inset': convertInset,
  'overflow': convertOverflow,
  'overflow-x': convertOverflow,
  'overflow-y': convertOverflow,
  'z-index': convertZIndex,

  // Flexbox
  'flex-direction': convertFlexDirection,
  'justify-content': convertJustifyContent,
  'align-items': convertAlignItems,
  'flex-wrap': convertFlexWrap,
};

/**
 * 단일 CSS 속성-값 쌍 변환
 */
export function convertCSSProperty(
  property: string,
  value: string
): ConversionSuggestion[] {
  const normalisedProp = property.toLowerCase().trim();
  const normalisedValue = value.trim();

  if (!normalisedValue) {
    return [];
  }

  const converter = PROPERTY_CONVERTERS[normalisedProp];
  if (converter) {
    return converter(normalisedProp, normalisedValue);
  }

  return [];
}

/**
 * CSS 스타일 문자열에서 모든 속성 변환
 */
export function convertCSSString(cssString: string): ConversionReport {
  const properties = parseCSSString(cssString);
  return convertCSSProperties(properties);
}

/**
 * CSS 문자열 파싱
 */
function parseCSSString(cssString: string): Array<{ property: string; value: string }> {
  const properties: Array<{ property: string; value: string }> = [];

  // 세미콜론으로 분리
  const declarations = cssString.split(';').filter(d => d.trim());

  declarations.forEach((declaration) => {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex > 0) {
      const property = declaration.slice(0, colonIndex).trim();
      const value = declaration.slice(colonIndex + 1).trim();
      if (property && value) {
        properties.push({ property, value });
      }
    }
  });

  return properties;
}

/**
 * CSS 속성 목록 변환
 */
export function convertCSSProperties(
  properties: Array<{ property: string; value: string }>
): ConversionReport {
  const conversions: ConversionSuggestion[] = [];
  const unmapped: string[] = [];

  properties.forEach(({ property, value }) => {
    const suggestions = convertCSSProperty(property, value);

    if (suggestions.length > 0) {
      conversions.push(...suggestions);
    } else {
      unmapped.push(`${property}: ${value}`);
    }
  });

  // 중복 제거 및 신뢰도 기반 정렬
  const uniqueConversions = deduplicateConversions(conversions);

  return {
    totalProperties: properties.length,
    convertedCount: uniqueConversions.length,
    conversionRate: properties.length > 0 ? uniqueConversions.length / properties.length : 0,
    conversions: uniqueConversions.sort((a, b) => b.confidence - a.confidence),
    unmapped,
  };
}

/**
 * 중복 변환 제거
 */
function deduplicateConversions(conversions: ConversionSuggestion[]): ConversionSuggestion[] {
  const seen = new Set<string>();
  const unique: ConversionSuggestion[] = [];

  conversions.forEach((conv) => {
    const key = `${conv.css}|${conv.tailwind}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(conv);
    }
  });

  return unique;
}

/**
 * 요소의 계산된 스타일에서 Tailwind 클래스 추출
 */
export function convertElementStyles(element: HTMLElement): ConversionReport {
  const computedStyle = window.getComputedStyle(element);

  const conversions: ConversionSuggestion[] = [];
  const unmapped: string[] = [];

  // 각 카테고리에서 추출
  const paddingConversions = extractPaddingFromStyles(computedStyle);
  const marginConversions = extractMarginFromStyles(computedStyle);
  const fontConversions = extractFontFromStyles(computedStyle);
  const borderRadiusConversions = extractBorderRadiusFromStyles(computedStyle);
  const layoutConversions = extractLayoutFromStyles(computedStyle);

  conversions.push(
    ...paddingConversions,
    ...marginConversions,
    ...fontConversions,
    ...borderRadiusConversions,
    ...layoutConversions
  );

  // 색상 추출
  const color = computedStyle.color;
  const bgColor = computedStyle.backgroundColor;
  const borderColor = computedStyle.borderColor;

  if (color && color !== 'rgb(0, 0, 0)' && color !== '#000000') {
    conversions.push(...convertColor('color', color));
  }

  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
    conversions.push(...convertColor('background-color', bgColor));
  }

  if (borderColor && borderColor !== 'rgb(0, 0, 0)' && borderColor !== '#000000') {
    conversions.push(...convertColor('border-color', borderColor));
  }

  // 중복 제거
  const uniqueConversions = deduplicateConversions(conversions);

  // 사용자 지정 클래스 수집
  const existingClasses = Array.from(element.classList);
  const customClassSuggestions = uniqueConversions.filter((conv) => {
    // 현재 클래스와 겹치지 않는 것만
    return !existingClasses.some((cls) => conv.tailwind.includes(cls));
  });

  return {
    totalProperties: uniqueConversions.length,
    convertedCount: customClassSuggestions.length,
    conversionRate: uniqueConversions.length > 0 ? customClassSuggestions.length / uniqueConversions.length : 0,
    conversions: customClassSuggestions,
    unmapped,
  };
}

/**
 * 인라인 스타일에서 Tailwind 클래스 추출
 */
export function convertInlineStyle(styleAttr: string): ConversionReport {
  return convertCSSString(styleAttr);
}

/**
 * 스타일 태그 또는 외부 스타일시트 규칙에서 Tailwind 클래스 추출
 */
export function convertStyleRules(rules: CSSRuleList): ConversionReport {
  const conversions: ConversionSuggestion[] = [];
  const unmapped: string[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule instanceof CSSStyleRule) {
      const properties: Array<{ property: string; value: string }> = [];

      for (let j = 0; j < rule.style.length; j++) {
        const property = rule.style[j];
        const value = rule.style.getPropertyValue(property);
        properties.push({ property, value });
      }

      const report = convertCSSProperties(properties);
      conversions.push(...report.conversions);
      unmapped.push(...report.unmapped);
    }
  }

  const uniqueConversions = deduplicateConversions(conversions);

  return {
    totalProperties: uniqueConversions.length,
    convertedCount: uniqueConversions.length,
    conversionRate: 1,
    conversions: uniqueConversions,
    unmapped,
  };
}

/**
 * 선택자로 요소를 찾아 스타일 변환
 */
export function convertBySelector(selector: string): ConversionReport | null {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return null;
    }
    return convertElementStyles(element as HTMLElement);
  } catch {
    return null;
  }
}

/**
 * 페이지의 모든 인라인 스타일 변환
 */
export function convertAllInlineStyles(): {
  elements: number;
  totalConversions: number;
  elementReports: Array<{
    selector: string;
    report: ConversionReport;
  }>;
} {
  const elements = document.querySelectorAll('[style]');
  const elementReports: Array<{
    selector: string;
    report: ConversionReport;
  }> = [];
  let totalConversions = 0;

  elements.forEach((element) => {
    const selector = generateSelector(element);
    const report = convertElementStyles(element as HTMLElement);

    if (report.convertedCount > 0) {
      elementReports.push({ selector, report });
      totalConversions += report.convertedCount;
    }
  });

  return {
    elements: elementReports.length,
    totalConversions,
    elementReports,
  };
}

/**
 * 요소에 대한 선택자 생성
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
 * 최적화된 Tailwind 클래스 문자열 생성
 */
export function generateTailwindClasses(report: ConversionReport): {
  classes: string;
  arbitrary: string;
  optimized: string;
} {
  const standard: string[] = [];
  const arbitrary: string[] = [];

  // 신뢰도 기반 필터링
  const highConfidence = report.conversions.filter((c) => c.confidence >= 0.8);

  highConfidence.forEach((conv) => {
    if (conv.isArbitrary) {
      arbitrary.push(conv.tailwind);
    } else {
      standard.push(conv.tailwind);
    }
  });

  // 최적화된 클래스 문자열
  const optimized = [
    ...standard,
    ...arbitrary.slice(0, 5), // 임의 값은 최대 5개만
  ].join(' ');

  return {
    classes: standard.join(' '),
    arbitrary: arbitrary.join(' '),
    optimized,
  };
}
