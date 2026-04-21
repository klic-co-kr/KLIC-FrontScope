/**
 * Style Comparison Utilities
 *
 * 스타일 비교 유틸리티
 */

import type { StyleComparison } from '../../types/cssScan';
import { extractElementStyle } from './styleExtractor';

/**
 * 두 요소의 스타일 비교
 */
export function compareStyles(
  element1: HTMLElement,
  element2: HTMLElement,
  options: {
    includeComputed?: boolean;
    includeInherited?: boolean;
  } = {}
): StyleComparison {
  const { includeComputed = true, includeInherited = false } = options;

  const style1 = extractElementStyle(element1, { includeComputed, includeInherited });
  const style2 = extractElementStyle(element2, { includeComputed, includeInherited });

  const desc1 = describeElement(element1);
  const desc2 = describeElement(element2);

  const differences: Array<{
    property: string;
    value1: string;
    value2: string;
  }> = [];

  const similarities: Array<{
    property: string;
    value: string;
  }> = [];

  // 모든 속성 수집
  const allProps = new Set<string>();
  const props1 = Object.keys(style1.computedStyle);
  const props2 = Object.keys(style2.computedStyle);

  for (const prop of props1) allProps.add(prop);
  for (const prop of props2) allProps.add(prop);

  // 각 속성 비교
  for (const prop of allProps) {
    const val1 = style1.computedStyle[prop] || '';
    const val2 = style2.computedStyle[prop] || '';

    // 중요하지 않은 속성 필터
    if (isInsignificantProperty(prop)) {
      continue;
    }

    // 값 정규화
    const normalized1 = normalizeCSSValue(val1);
    const normalized2 = normalizeCSSValue(val2);

    if (normalized1 !== normalized2) {
      differences.push({
        property: prop,
        value1: val1,
        value2: val2,
      });
    } else if (val1 && val2) {
      similarities.push({
        property: prop,
        value: val1,
      });
    }
  }

  return {
    element1: desc1,
    element2: desc2,
    differences,
    similarities,
  };
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
 * CSS 값 정규화
 */
function normalizeCSSValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ',')
    .replace(/rgba?\([^)]+\)/g, (match) => {
      // 색상 정규화 (간단 버전)
      return match.toLowerCase();
    });
}

/**
 * 중요하지 않은 속성인지 확인
 */
function isInsignificantProperty(prop: string): boolean {
  const insignificant = [
    // 자동 생성 속성
    '-webkit-',
    '-moz-',
    '-ms-',
    '-o-',
    // 브라우저 내부 속성
    'appearance',
    'backface-visibility',
    'perspective',
    'perspective-origin',
    // 애니메이션 관련 (변동 가능)
    'animation',
    'transition',
  ];

  const lowerProp = prop.toLowerCase();

  return insignificant.some(prefix => lowerProp.startsWith(prefix));
}

/**
 * 다중 요소 스타일 비교
 */
export function compareMultipleStyles(
  elements: HTMLElement[]
): Array<{
  element: string;
  commonStyles: Record<string, string>;
  uniqueStyles: Record<string, string>;
}> {
  if (elements.length === 0) return [];

  // 모든 요소의 스타일 추출
  const styles = elements.map(el => ({
    element: describeElement(el),
    style: extractElementStyle(el, { includeComputed: true }),
  }));

  // 공통 스타일 찾기
  const commonStyles: Record<string, string> = {};
  const uniqueStyles: Array<Record<string, string>> = [];

  // 첫 번째 요소의 속성 기준
  const firstStyle = styles[0].style.computedStyle;

  for (const [prop, value] of Object.entries(firstStyle)) {
    if (isInsignificantProperty(prop)) continue;

    const isCommon = styles.every(s => {
      const val = s.style.computedStyle[prop];
      return val && normalizeCSSValue(val) === normalizeCSSValue(value);
    });

    if (isCommon) {
      commonStyles[prop] = value;
    }
  }

  // 각 요소의 고유 스타일
  for (const { style } of styles) {
    const unique: Record<string, string> = {};

    for (const [prop, value] of Object.entries(style.computedStyle)) {
      if (isInsignificantProperty(prop)) continue;

      const commonValue = commonStyles[prop];
      if (!commonValue || normalizeCSSValue(value) !== normalizeCSSValue(commonValue)) {
        unique[prop] = value;
      }
    }

    uniqueStyles.push(unique);
  }

  return styles.map((s, i) => ({
    element: s.element,
    commonStyles,
    uniqueStyles: uniqueStyles[i],
  }));
}

/**
 * 스타일 차이점 강조 (Diff 형식)
 */
export function highlightStyleDifferences(
  comparison: StyleComparison
): Array<{
    property: string;
    value1: string;
    value2: string;
    type: 'added' | 'removed' | 'changed';
  }> {
  const result: Array<{
    property: string;
    value1: string;
    value2: string;
    type: 'added' | 'removed' | 'changed';
  }> = [];

  for (const diff of comparison.differences) {
    if (!diff.value1 || diff.value1 === 'none' || diff.value1 === 'auto') {
      result.push({
        property: diff.property,
        value1: diff.value1,
        value2: diff.value2,
        type: 'added',
      });
    } else if (!diff.value2 || diff.value2 === 'none' || diff.value2 === 'auto') {
      result.push({
        property: diff.property,
        value1: diff.value1,
        value2: diff.value2,
        type: 'removed',
      });
    } else {
      result.push({
        property: diff.property,
        value1: diff.value1,
        value2: diff.value2,
        type: 'changed',
      });
    }
  }

  return result.sort((a, b) => {
    const typeOrder = { changed: 0, added: 1, removed: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * 스타일 유사도 점수 계산
 */
export function calculateStyleSimilarity(
  element1: HTMLElement,
  element2: HTMLElement
): {
  score: number; // 0-100
  common: number;
  total: number;
} {
  const comparison = compareStyles(element1, element2, { includeComputed: true });

  const total = comparison.differences.length + comparison.similarities.length;

  if (total === 0) {
    return { score: 100, common: 0, total: 0 };
  }

  const common = comparison.similarities.length;
  const score = Math.round((common / total) * 100);

  return { score, common, total };
}

/**
 * 비슷한 스타일의 요소 찾기
 */
export function findSimilarStyledElements(
  target: HTMLElement,
  threshold: number = 80,
  container: HTMLElement | Document = document
): Array<{
  element: HTMLElement;
  similarity: number;
}> {
  const results: Array<{
    element: HTMLElement;
    similarity: number;
  }> = [];

  const elements = (container === document
    ? document.querySelectorAll('*')
    : container.querySelectorAll('*')
  ) as NodeListOf<HTMLElement>;

  for (const element of Array.from(elements)) {
    if (element === target) continue;

    const { score } = calculateStyleSimilarity(target, element);

    if (score >= threshold) {
      results.push({ element, similarity: score });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * 스타일 중복 탐지
 */
export function detectDuplicateStyles(
  container: HTMLElement | Document = document
): Array<{
  styles: Record<string, string>;
  elements: string[];
  count: number;
}> {
  const styleMap = new Map<string, {
    styles: Record<string, string>;
    elements: string[];
  }>();

  const elements = (container === document
    ? document.querySelectorAll('*')
    : container.querySelectorAll('*')
  ) as NodeListOf<HTMLElement>;

  for (const element of Array.from(elements)) {
    const computedStyle = window.getComputedStyle(element);
    const styleKey: string[] = [];

    // 주요 속성만 사용하여 키 생성
    const keyProps = [
      'display',
      'position',
      'width',
      'height',
      'background-color',
      'color',
      'font-size',
      'font-family',
      'margin',
      'padding',
      'border',
    ];

    for (const prop of keyProps) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto') {
        styleKey.push(`${prop}:${value}`);
      }
    }

    const key = styleKey.join('|');

    if (!styleMap.has(key)) {
      styleMap.set(key, {
        styles: {},
        elements: [],
      });
    }

    const entry = styleMap.get(key)!;

    // 스타일 저장
    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle[i];
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'auto') {
        entry.styles[prop] = value;
      }
    }

    entry.elements.push(describeElement(element));
  }

  // 중복된 것만 필터링
  return Array.from(styleMap.values())
    .filter(entry => entry.elements.length > 1)
    .map(entry => ({
      styles: entry.styles,
      elements: entry.elements,
      count: entry.elements.length,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 스타일 시각적 비교 (HTML 테이블)
 */
export function generateStyleComparisonTable(
  comparison: StyleComparison
): string {
  const rows: string[] = [];

  // 헤더
  rows.push('<table class="css-scan-comparison-table">');
  rows.push('<thead><tr>');
  rows.push(`<th>Property</th>`);
  rows.push(`<th>${comparison.element1}</th>`);
  rows.push(`<th>${comparison.element2}</th>`);
  rows.push('</tr></thead>');

  // 본문
  rows.push('<tbody>');

  // 차이점
  if (comparison.differences.length > 0) {
    for (const diff of comparison.differences) {
      rows.push('<tr class="diff">');
      rows.push(`<td class="property">${diff.property}</td>`);
      rows.push(`<td class="value1">${diff.value1 || '-'}</td>`);
      rows.push(`<td class="value2">${diff.value2 || '-'}</td>`);
      rows.push('</tr>');
    }
  }

  // 유사점 (상위 20개)
  const similarShown = comparison.similarities.slice(0, 20);
  for (const sim of similarShown) {
    rows.push('<tr class="same">');
    rows.push(`<td class="property">${sim.property}</td>`);
    rows.push(`<td class="value1">${sim.value}</td>`);
    rows.push(`<td class="value2">${sim.value}</td>`);
    rows.push('</tr>');
  }

  rows.push('</tbody>');
  rows.push('</table>');

  return rows.join('\n');
}
