// src/utils/accessibility/typographyValidator.ts
// Typography Validator - KRDS Typography System compliance

import type { AccessibilityIssue, ValidationCategory } from '@/types/accessibility';

const category: ValidationCategory = 'typography';

/**
 * Validate typography against KRDS typography system and WCAG guidelines
 */
export function validateTypography(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const checked = new Set<string>();

  for (const el of elements) {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight);
    const letterSpacing = style.letterSpacing;
    const fontWeight = parseInt(style.fontWeight);
    const tagName = el.tagName.toLowerCase();

    // Skip non-text elements
    if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
      continue;
    }

    const key = `${tagName}-${fontSize}-${lineHeight}`;
    if (checked.has(key)) continue;
    checked.add(key);

    // Check 1: Minimum font size (12px for captions, 16px for body)
    const isCaption = el.closest('figcaption, caption, [role="caption"]');
    const minSize = isCaption ? 12 : 16;

    if (fontSize < minSize) {
      issues.push({
        id: `font-size-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'min-font-size',
        message: `폰트 크기가 너무 작습니다 (${fontSize}px, 최소 ${minSize}px 필요)`,
        suggestion: '폰트 크기를 키우세요 (본문 16px 이상, 캡션 12px 이상)',
        wcagCriteria: '1.4.4',
        element: {
          tagName,
          selector: generateSelector(el),
          outerHTML: el.outerHTML.substring(0, 200),
        },
      });
    }

    // Check 2: Line height (1.4 for body, 1.2 for headings)
    const isHeading = /^h[1-6]$/.test(tagName);
    const minLineHeight = isHeading ? 1.2 : 1.4;

    if (lineHeight < minLineHeight) {
      issues.push({
        id: `line-height-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'line-height',
        message: `줄 높이가 부족합니다 (${lineHeight}, 최소 ${minLineHeight} 필요)`,
        suggestion: '줄 높이를 늘리세요 (본문 1.4 이상, 제목 1.2 이상)',
        wcagCriteria: '1.4.8',
        element: {
          tagName,
          selector: generateSelector(el),
          outerHTML: el.outerHTML.substring(0, 200),
        },
      });
    }

    // Check 3: No negative letter-spacing on body text
    if (letterSpacing && letterSpacing.startsWith('-') && !isHeading) {
      issues.push({
        id: `letter-spacing-${Date.now()}-${Math.random()}`,
        category,
        severity: 'medium',
        rule: 'letter-spacing',
        message: '본문 텍스트에 음수 자간이 사용되었습니다',
        suggestion: '자간을 0 이상으로 설정하세요',
        element: {
          tagName,
          selector: generateSelector(el),
          outerHTML: el.outerHTML.substring(0, 200),
        },
      });
    }

    // Check 4: Font weight matches KRDS scale
    const validWeights = [300, 400, 500, 600, 700, 800, 900];
    if (!validWeights.includes(fontWeight)) {
      issues.push({
        id: `font-weight-${Date.now()}-${Math.random()}`,
        category,
        severity: 'info',
        rule: 'font-weight',
        message: `폰트 굵기가 KRDS 스케일과 일치하지 않습니다 (${fontWeight})`,
        suggestion: 'KRDS 폰트 굵기를 사용하세요 (300, 400, 500, 600, 700 등)',
        element: {
          tagName,
          selector: generateSelector(el),
          outerHTML: el.outerHTML.substring(0, 200),
        },
      });
    }

    // Check 5: Heading sizes follow KRDS scale
    if (isHeading) {
      const headingLevel = parseInt(tagName[1]);
      const expectedSizes = { 1: 32, 2: 28, 3: 24, 4: 20, 5: 18, 6: 16 };
      const expectedSize = expectedSizes[headingLevel as keyof typeof expectedSizes];

      if (expectedSize && Math.abs(fontSize - expectedSize) > 2) {
        issues.push({
          id: `heading-scale-${Date.now()}-${Math.random()}`,
          category,
          severity: 'info',
          rule: 'heading-scale',
          message: `제목 크기가 KRDS 스케일과 다릅니다 (h${headingLevel}: ${fontSize}px, 예상 ${expectedSize}px)`,
          suggestion: `KRDS 제목 크기를 사용하세요 (h${headingLevel}: ${expectedSize}px)`,
          element: {
            tagName,
            selector: generateSelector(el),
            outerHTML: el.outerHTML.substring(0, 200),
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Generate CSS selector for element
 */
function generateSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className
        .toString()
        .split(' ')
        .filter((c) => c.length > 0)
        .map((c) => `.${c}`)
        .slice(0, 3);
      selector += classes.join('');
    }

    path.unshift(selector);
    current = current.parentElement as HTMLElement;
    if (path.length > 5) break;
  }

  return path.join(' > ');
}
