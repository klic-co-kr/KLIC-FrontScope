/**
 * CSS Scan Data Extractor
 *
 * 요소의 전체 CSS 데이터를 추출하여 사이드 패널에 전송할 수 있는 형태로 변환
 * 브라우저 기본값과 비교하여 실제 변경된 속성만 필터링
 */

import type { CssScanToolData, CSSRule } from '../../types/cssScan';
import { extractElementStyle } from '../../utils/cssScan/styleExtractor';
import { extractBoxModel } from '../../utils/cssScan/boxModel';
import { extractColorInfo } from '../../utils/cssScan/colorAnalyzer';
import { extractFontInfo } from '../../utils/cssScan/fontAnalyzer';
import { extractFlexInfo } from '../../utils/cssScan/flexboxAnalyzer';
import { extractGridInfo } from '../../utils/cssScan/gridAnalyzer';

const PSEUDO_CLASS_PATTERN = /:(hover|focus|active|visited|focus-within|focus-visible|checked|disabled|enabled|first-child|last-child|nth-child|empty|target)/gi;

/**
 * 동일 태그의 빈 요소를 생성하여 브라우저 기본 computed style을 가져옴
 */
function getDefaultStyles(tagName: string): Record<string, string> {
  const temp = document.createElement(tagName);
  // 화면에 보이지 않도록 숨김
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  temp.style.pointerEvents = 'none';
  temp.style.left = '-9999px';
  temp.style.top = '-9999px';
  document.body.appendChild(temp);

  const defaults: Record<string, string> = {};
  const computed = window.getComputedStyle(temp);
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    defaults[prop] = computed.getPropertyValue(prop);
  }

  document.body.removeChild(temp);
  return defaults;
}

/**
 * 요소의 전체 CSS Scan 데이터 추출
 */
export function extractCssScanData(element: HTMLElement): CssScanToolData {
  const rect = element.getBoundingClientRect();

  // 기존 유틸리티 활용
  const styleInfo = extractElementStyle(element, {
    includeComputed: true,
    includeInherited: true,
  });
  const boxModel = extractBoxModel(element);
  const colors = extractColorInfo(element);
  const font = extractFontInfo(element);
  const flexInfo = extractFlexInfo(element);
  const gridInfo = extractGridInfo(element);

  // pseudo-class 규칙 추출
  const pseudoClassRules = extractPseudoClassRules(element);

  // CSS 변수 추출
  const cssVariables = extractCssVariables(element);

  // 브라우저 기본값 대비 변경된 속성만 필터링
  const defaultStyles = getDefaultStyles(styleInfo.element.tagName);
  const changedStyles: Record<string, string> = {};

  for (const [prop, value] of Object.entries(styleInfo.computedStyle)) {
    // CSS 변수는 제외 (별도 섹션에서 처리)
    if (prop.startsWith('--')) continue;
    // 기본값과 다른 속성만 포함
    if (defaultStyles[prop] !== value) {
      changedStyles[prop] = value;
    }
  }

  return {
    element: {
      tagName: styleInfo.element.tagName,
      id: styleInfo.element.id,
      classes: styleInfo.element.classes,
      dimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    },
    boxModel,
    computedStyles: changedStyles,
    allComputedStyles: styleInfo.computedStyle,
    inlineStyles: styleInfo.inlineStyle,
    matchedRules: styleInfo.matchedRules,
    pseudoClassRules,
    inheritedProperties: styleInfo.inheritedProperties,
    colors,
    font,
    flexInfo: flexInfo.enabled ? flexInfo : null,
    gridInfo: gridInfo.enabled ? gridInfo : null,
    cssVariables,
    timestamp: Date.now(),
  };
}

/**
 * Pseudo-class 규칙 추출
 * 모든 stylesheets에서 :hover, :focus 등을 포함하는 규칙 중
 * base selector가 해당 요소와 매칭되는 것을 수집
 */
function extractPseudoClassRules(element: HTMLElement): CSSRule[] {
  const rules: CSSRule[] = [];

  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const sheetRules = sheet.cssRules || sheet.rules;
        for (const rule of Array.from(sheetRules)) {
          if (!(rule instanceof CSSStyleRule)) continue;

          const selector = rule.selectorText;
          if (!PSEUDO_CLASS_PATTERN.test(selector)) continue;
          // Reset regex lastIndex
          PSEUDO_CLASS_PATTERN.lastIndex = 0;

          // pseudo-class를 제거한 base selector로 매칭 테스트
          const baseSelector = selector.replace(PSEUDO_CLASS_PATTERN, '').trim();
          if (!baseSelector) continue;

          try {
            if (element.matches(baseSelector)) {
              const declarations = [];
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                declarations.push({
                  property: prop,
                  value: rule.style.getPropertyValue(prop),
                  important: rule.style.getPropertyPriority(prop) === 'important',
                });
              }

              rules.push({
                selector,
                selectorType: 'pseudo-class',
                specificity: 0,
                declarations,
                stylesheetUrl: sheet.href || undefined,
              });
            }
          } catch {
            // selector matching error
          }
        }
      } catch {
        // CORS stylesheet access error
      }
    }
  } catch {
    // general error
  }

  return rules;
}

/**
 * CSS 변수 추출
 * 요소의 computed style에서 --로 시작하는 커스텀 속성 수집
 */
function extractCssVariables(element: HTMLElement): Array<{ name: string; value: string }> {
  const variables: Array<{ name: string; value: string }> = [];
  const seen = new Set<string>();

  try {
    // 요소의 computed style에서 CSS 변수 수집
    const computed = window.getComputedStyle(element);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      if (prop.startsWith('--')) {
        const value = computed.getPropertyValue(prop).trim();
        if (!seen.has(prop)) {
          seen.add(prop);
          variables.push({ name: prop, value });
        }
      }
    }

    // document.documentElement에서 전역 CSS 변수도 수집
    const rootComputed = window.getComputedStyle(document.documentElement);
    for (let i = 0; i < rootComputed.length; i++) {
      const prop = rootComputed[i];
      if (prop.startsWith('--') && !seen.has(prop)) {
        const value = rootComputed.getPropertyValue(prop).trim();
        seen.add(prop);
        variables.push({ name: prop, value });
      }
    }
  } catch {
    // ignore errors
  }

  return variables;
}
