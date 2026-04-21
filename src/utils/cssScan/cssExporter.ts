/**
 * CSS Export Utilities
 *
 * CSS 스타일 내보내기 유틸리티
 */

import type { CSSExportOptions, ElementStyleInfo } from '../../types/cssScan';
import { DEFAULT_CSS_EXPORT_OPTIONS } from '../../constants/cssScanDefaults';

/**
 * 요소 스타일을 CSS로 내보내기
 */
export function exportStyleToCSS(
  styleInfo: ElementStyleInfo,
  options: Partial<CSSExportOptions> = {}
): string {
  const opts: CSSExportOptions = { ...DEFAULT_CSS_EXPORT_OPTIONS, ...options };

  const lines: string[] = [];

  // 선택자 생성
  const selector = generateSelector(styleInfo);
  lines.push(`${selector} {`);

  // 인라인 스타일 추가
  if (styleInfo.inlineStyle && Object.keys(styleInfo.inlineStyle).length > 0) {
    for (const [prop, value] of Object.entries(styleInfo.inlineStyle)) {
      lines.push(`  ${prop}: ${value};`);
    }
  }

  // 계산된 스타일 추가 (옵션)
  if (opts.includeComputed && styleInfo.computedStyle) {
    const computedProps = Object.entries(styleInfo.computedStyle)
      .filter(([, value]) => {
        // 기본값과 다른 속성만 포함
        return value !== 'none' && value !== 'auto' && value !== 'normal';
      })
      .slice(0, 20); // 상위 20개만

    for (const [prop, value] of computedProps) {
      if (!styleInfo.inlineStyle[prop]) {
        lines.push(`  ${prop}: ${value};`);
      }
    }
  }

  lines.push('}');

  let result = lines.join('\n');

  if (opts.minify) {
    result = result
      .replace(/\n/g, '')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';');
  }

  return result;
}

/**
 * 선택자 생성
 */
function generateSelector(styleInfo: ElementStyleInfo): string {
  const { element } = styleInfo;
  const parts: string[] = [];

  if (element.id) {
    parts.push(`#${element.id}`);
  }

  if (element.classes.length > 0) {
    parts.push(...element.classes.map(c => `.${c}`));
  }

  if (parts.length === 0) {
    parts.push(element.tagName);
  }

  return parts.join('');
}

/**
 * SCSS로 내보내기
 */
export function exportStyleToSCSS(
  styleInfo: ElementStyleInfo,
  options: Partial<CSSExportOptions> = {}
): string {
  const opts: CSSExportOptions = { ...DEFAULT_CSS_EXPORT_OPTIONS, ...options };
  const css = exportStyleToCSS(styleInfo, opts);

  // 중첩 구조 변환
  let scss = css;

  if (styleInfo.element.classes.length > 0) {
    const parentClass = styleInfo.element.classes[0];
    const nested = `.${parentClass} {
  ${scss
    .substring(scss.indexOf('{') + 1, scss.lastIndexOf('}'))
    .trim()
    .split('\n')
    .map(line => '  ' + line)
    .join('\n')}
}`;
    scss = nested;
  }

  return scss;
}

/**
 * LESS로 내보내기
 */
export function exportStyleToLESS(
  styleInfo: ElementStyleInfo,
  options: Partial<CSSExportOptions> = {}
): string {
  // LESS는 SCSS와 유사한 구조
  return exportStyleToSCSS(styleInfo, options);
}

/**
 * JSON으로 내보내기
 */
export function exportStyleToJSON(
  styleInfo: ElementStyleInfo,
  options: Partial<CSSExportOptions> = {}
): string {
  const data: Record<string, unknown> = {
    selector: generateSelector(styleInfo),
    element: styleInfo.element,
  };

  if (options.includeComputed) {
    data.computedStyle = styleInfo.computedStyle;
  }

  if (options.includeInherited) {
    data.inheritedProperties = styleInfo.inheritedProperties;
  }

  data.inlineStyle = styleInfo.inlineStyle;

  return JSON.stringify(data, null, options.minify ? 0 : 2);
}

/**
 * 전체 페이지 CSS 추출
 */
export function extractPageCSS(options: Partial<CSSExportOptions> = {}): string {
  const opts: CSSExportOptions = { ...DEFAULT_CSS_EXPORT_OPTIONS, ...options };
  const cssLines: string[] = [];

  // 모든 스타일시트에서 규칙 추출
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;

      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          cssLines.push(extractCSSRule(rule));
        } else if (rule instanceof CSSMediaRule) {
          if (opts.includeMediaQueries) {
            cssLines.push(`@media ${rule.media.mediaText} {`);

            for (const nestedRule of Array.from(rule.cssRules)) {
              if (nestedRule instanceof CSSStyleRule) {
                cssLines.push(`  ${extractCSSRule(nestedRule)}`);
              }
            }

            cssLines.push('}');
          }
        }
      }
    } catch {
      // CORS 제한 무시
    }
  }

  let result = cssLines.join('\n\n');

  if (opts.minify) {
    result = result
      .replace(/\n\s*/g, '')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';');
  }

  return result;
}

/**
 * CSS 규칙 추출
 */
function extractCSSRule(
  rule: CSSStyleRule
): string {
  const lines: string[] = [];

  lines.push(`${rule.selectorText} {`);

  for (let i = 0; i < rule.style.length; i++) {
    const prop = rule.style[i];
    const value = rule.style.getPropertyValue(prop);
    const priority = rule.style.getPropertyPriority(prop);

    const line = `  ${prop}: ${value}${priority === 'important' ? ' !important' : ''};`;
    lines.push(line);
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * 사용자 정의 속성 (CSS 변수) 추출
 */
export function extractCustomProperties(): Record<string, string> {
  const properties: Record<string, string> = {};

  // :root에서 변수 추출
  const root = document.documentElement;
  const rootStyle = window.getComputedStyle(root);

  for (let i = 0; i < rootStyle.length; i++) {
    const prop = rootStyle[i];
    if (prop.startsWith('--')) {
      properties[prop] = rootStyle.getPropertyValue(prop);
    }
  }

  return properties;
}

/**
 * CSS 변수를 사용하는 속성 찾기
 */
export function findPropertiesUsingVariable(
  variableName: string
): Array<{
    element: string;
    property: string;
    value: string;
  }> {
  const results: Array<{
    element: string;
    property: string;
    value: string;
  }> = [];

  const normalizedVar = variableName.startsWith('--')
    ? variableName
    : `--${variableName}`;

  const elements = document.querySelectorAll('*');

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const computedStyle = window.getComputedStyle(element);

    for (let i = 0; i < computedStyle.length; i++) {
      const prop = computedStyle[i];
      const value = computedStyle.getPropertyValue(prop);

      if (value.includes(`var(${normalizedVar})`)) {
        results.push({
          element: describeElement(element),
          property: prop,
          value,
        });
      }
    }
  }

  return results;
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
 * 스타일시트 내보내기
 */
export async function exportStylesheet(
  stylesheet: CSSStyleSheet,
  format: 'css' | 'scss' | 'json' = 'css'
): Promise<string> {
  const rules: string[] = [];

  try {
    const cssRules = stylesheet.cssRules || stylesheet.rules;

    for (const rule of Array.from(cssRules)) {
      if (rule instanceof CSSStyleRule) {
        rules.push(rule.cssText);
      }
    }
  } catch {
    return '';
  }

  const css = rules.join('\n\n');

  switch (format) {
    case 'scss':
      return css; // SCSS 호환
    case 'json':
      return JSON.stringify({ css }, null, 2);
    default:
      return css;
  }
}

/**
 * 클립보드에 CSS 복사
 */
export async function copyCSS(css: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(css);
    return true;
  } catch {
    return false;
  }
}

/**
 * CSS 파일 다운로드
 */
export function downloadCSS(
  css: string,
  filename: string = 'styles.css'
): void {
  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
