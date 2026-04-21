/**
 * Spacing Config Extraction
 *
 * 페이지에서 사용된 spacing 분석 및 Tailwind config 제안
 */

import type { TailwindConfig } from '../../../types/tailwindScanner';

/**
 * Spacing 사용 정보
 */
interface SpacingUsage {
  remValue: number;
  pxValue: number;
  frequency: number;
  contexts: Array<{
    property: string;
    selector: string;
  }>;
}

/**
 * 페이지에서 spacing 추출
 */
export function extractSpacingFromPage(): SpacingUsage[] {
  const spacingMap = new Map<number, SpacingUsage>();

  // 모든 요소의 spacing 추출
  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    // spacing 속성 확인
    const spacingProps = [
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'gap', 'rowGap', 'columnGap',
    ];

    spacingProps.forEach((prop) => {
      const value = computedStyle[prop as keyof CSSStyleDeclaration] as string;
      if (!value) return;

      const pxValue = parsePxValue(value);
      if (pxValue === null || pxValue === 0) return;

      const remValue = pxValue / 16;

      // 반올림하여 근사값 그룹화
      const roundedRem = Math.round(remValue * 100) / 100;

      if (spacingMap.has(roundedRem)) {
        const usage = spacingMap.get(roundedRem)!;
        usage.frequency++;
        usage.contexts.push({
          property: prop,
          selector: generateSelector(element),
        });
      } else {
        spacingMap.set(roundedRem, {
          remValue: roundedRem,
          pxValue,
          frequency: 1,
          contexts: [{
            property: prop,
            selector: generateSelector(element),
          }],
        });
      }
    });
  });

  // 빈도 기반 정렬
  return Array.from(spacingMap.values()).sort((a, b) => b.frequency - a.frequency);
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
 * Tailwind spacing과 비교하여 커스텀 spacing 식별
 */
export function identifyCustomSpacing(usages: SpacingUsage[]): {
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

  // Tailwind 기본 spacing 스케일
  const tailwindSpacing: Record<string, number> = {
    '0': 0,
    'px': 0.0625,
    '0.5': 0.125,
    '1': 0.25,
    '1.5': 0.375,
    '2': 0.5,
    '2.5': 0.625,
    '3': 0.75,
    '3.5': 0.875,
    '4': 1,
    '5': 1.25,
    '6': 1.5,
    '7': 1.75,
    '8': 2,
    '9': 2.25,
    '10': 2.5,
    '11': 2.75,
    '12': 3,
    '14': 3.5,
    '16': 4,
    '20': 5,
    '24': 6,
    '28': 7,
    '32': 8,
    '36': 9,
    '40': 10,
    '44': 11,
    '48': 12,
    '52': 13,
    '56': 14,
    '60': 15,
    '64': 16,
    '72': 18,
    '80': 20,
    '96': 24,
  };

  usages.forEach((usage) => {
    const { remValue, pxValue, frequency } = usage;

    // 가장 가까운 Tailwind spacing 찾기
    const closest = findClosestTailwindSpacing(remValue, tailwindSpacing);

    if (closest && closest.distance < 0.1) {
      // Tailwind spacing으로 간주
      tailwind.push({
        key: closest.key,
        remValue,
        pxValue,
        frequency,
      });
    } else {
      // 커스텀 spacing
      const suggestedKey = closest ? closest.key : '4';
      custom.push({
        key: generateCustomSpacingKey(remValue),
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
 * 가장 가까운 Tailwind spacing 찾기
 */
function findClosestTailwindSpacing(
  remValue: number,
  tailwindSpacing: Record<string, number>
): { key: string; distance: number } | null {
  let closest: { key: string; distance: number } | null = null;
  let minDistance = Infinity;

  for (const [key, value] of Object.entries(tailwindSpacing)) {
    const distance = Math.abs(value - remValue);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { key, distance };
    }
  }

  return closest;
}

/**
 * 커스텀 spacing 키 생성
 */
function generateCustomSpacingKey(remValue: number): string {
  // 소수점 제거 및 정수로 변환
  const scaledValue = Math.round(remValue * 100);
  return `${scaledValue}`;
}

/**
 * spacing config 생성
 */
export function generateSpacingConfig(usages: SpacingUsage[]): {
  spacing: Record<string, string>;
  recommendations: string[];
} {
  const { custom } = identifyCustomSpacing(usages);

  const spacing: Record<string, string> = {};
  const recommendations: string[] = [];

  // 빈도가 높은 커스텀 spacing 추가
  custom.filter(c => c.frequency >= 3).forEach((item) => {
    spacing[item.key] = `${item.remValue}rem`;

    if (item.suggestedKey !== item.key) {
      recommendations.push(
        `"${item.key}" (${item.remValue}rem, ${item.pxValue}px)이(가) ${item.frequency}번 사용됨 - ${item.suggestedKey}와 유사`
      );
    }
  });

  return { spacing, recommendations };
}

/**
 * 완전한 spacing 설정 추출
 */
export function extractSpacingConfig(): TailwindConfig['theme'] {
  const usages = extractSpacingFromPage();
  const { spacing } = generateSpacingConfig(usages);

  return {
    spacing,
  };
}

/**
 * fontSize와 관련된 spacing 추출
 */
export function extractFontSizeSpacing(): {
  fontSizes: Array<{
    key: string;
    remValue: number;
    pxValue: number;
    frequency: number;
  }>;
  lineHeights: Array<{
    ratio: number;
    frequency: number;
  }>;
} {
  const fontSizeMap = new Map<number, { remValue: number; pxValue: number; frequency: number }>();
  const lineHeightMap = new Map<number, number>();

  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    // font-size
    const fontSize = computedStyle.fontSize;
    if (fontSize) {
      const pxValue = parsePxValue(fontSize);
      if (pxValue && pxValue > 0) {
        const remValue = pxValue / 16;
        const roundedRem = Math.round(remValue * 100) / 100;

        if (fontSizeMap.has(roundedRem)) {
          fontSizeMap.get(roundedRem)!.frequency++;
        } else {
          fontSizeMap.set(roundedRem, { remValue: roundedRem, pxValue, frequency: 1 });
        }
      }
    }

    // line-height
    const lineHeight = computedStyle.lineHeight;
    if (lineHeight && lineHeight !== 'normal') {
      const numValue = parseFloat(lineHeight);
      if (!isNaN(numValue)) {
        const roundedRatio = Math.round(numValue * 100) / 100;
        lineHeightMap.set(roundedRatio, (lineHeightMap.get(roundedRatio) || 0) + 1);
      }
    }
  });

  return {
    fontSizes: Array.from(fontSizeMap.entries())
      .map(([key, value]) => ({ key: `${key}rem`, ...value }))
      .sort((a, b) => b.frequency - a.frequency),
    lineHeights: Array.from(lineHeightMap.entries())
      .map(([ratio, frequency]) => ({ ratio, frequency }))
      .sort((a, b) => b.frequency - a.frequency),
  };
}
