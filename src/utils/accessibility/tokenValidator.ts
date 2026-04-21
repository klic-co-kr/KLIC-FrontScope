// src/utils/accessibility/tokenValidator.ts
// Design Token Validator - KRDS Token System compliance

import type { AccessibilityIssue, ValidationCategory } from '@/types/accessibility';
import { isSpacingOnGrid, findClosestSpacing, parsePixelValue } from '@/constants/krds/tokens';

const category: ValidationCategory = 'token';

/**
 * Validate design tokens against KRDS token system
 */
export function validateTokens(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check 1: Spacing alignment to 4px grid
  issues.push(...checkSpacingGrid(elements));

  // Check 2: Border radius matches KRDS scale
  issues.push(...checkBorderRadius(elements));

  // Check 3: Shadow tokens
  issues.push(...checkShadows(elements));

  // Check 4: Motion duration tokens
  issues.push(...checkMotion());

  return issues;
}

/**
 * Check spacing values align to 4px grid
 */
function checkSpacingGrid(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  for (const el of elements) {
    const style = window.getComputedStyle(el);

    // Check margin and padding
    const spacingProps = [
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'gap', 'row-gap', 'column-gap',
    ];

    for (const prop of spacingProps) {
      const value = style.getPropertyValue(prop);
      if (!value) continue;

      const pixels = parsePixelValue(value);
      if (pixels === null) continue;

      if (!isSpacingOnGrid(pixels)) {
        // Find closest KRDS spacing value
        const closest = findClosestSpacing(pixels);
        issues.push({
          id: `spacing-grid-${Date.now()}-${Math.random()}`,
          category,
          severity: 'info',
          rule: 'spacing-4px-grid',
          message: `간격이 4px 그리드에 정렬되지 않았습니다 (${prop}: ${value})`,
          suggestion: `KRDS 간격(${closest}px)을 사용하거나 4px 단위로 조정하세요`,
          krdsCriteria: 'spacing-4px-grid',
          element: {
            tagName: el.tagName.toLowerCase(),
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
 * Check border radius matches KRDS token scale
 */
function checkBorderRadius(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const validRadiuses = [0, 2, 4, 6, 8, 12, 16, 20, 24, 9999];

  for (const el of elements) {
    const style = window.getComputedStyle(el);
    const radius = style.borderRadius;

    if (!radius || radius === '0px' || radius === 'none') {
      continue;
    }

    // Parse radius value (handle "4px", "50%", etc.)
    const match = radius.match(/^([\d.]+)(px|%)$/);
    if (!match) continue;

    const value = parseFloat(match[1]);
    const unit = match[2];

    if (unit === '%' && value !== 50) {
      continue; // Non-50% is unusual but valid
    }

    if (!validRadiuses.some((v) => Math.abs(v - value) < 0.1)) {
      issues.push({
        id: `border-radius-${Date.now()}-${Math.random()}`,
        category,
        severity: 'info',
        rule: 'border-radius',
        message: `테두리 둥글기가 KRDS 토큰과 일치하지 않습니다 (${radius})`,
        suggestion: 'KRDS 테두리 둥글기(0, 2, 4, 6, 8, 12, 16, 20, 24px)를 사용하세요',
        krdsCriteria: 'border-radius',
        element: {
          tagName: el.tagName.toLowerCase(),
          selector: generateSelector(el),
          outerHTML: el.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

/**
 * Check shadow values match KRDS tokens
 */
function checkShadows(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // This is informational - KRDS shadow tokens are quite specific
  // We'll check for shadows that seem non-standard (multiple shadows, unusual values)

  for (const el of elements) {
    const style = window.getComputedStyle(el);
    const shadow = style.boxShadow;

    if (!shadow || shadow === 'none') {
      continue;
    }

    // Check for multiple box-shadows (non-standard)
    const shadowCount = (shadow.match(/,/g) || []).length + 1;
    if (shadowCount > 2) {
      issues.push({
        id: `shadow-multiple-${Date.now()}-${Math.random()}`,
        category,
        severity: 'info',
        rule: 'shadow-tokens',
        message: `여러 개의 그림자가 사용되었습니다 (${shadowCount}개)`,
        suggestion: '단일 그림자 효과를 사용하거나 KRDS 쉐도우 토큰을 참고하세요',
        krdsCriteria: 'shadow-tokens',
        element: {
          tagName: el.tagName.toLowerCase(),
          selector: generateSelector(el),
          outerHTML: el.outerHTML.substring(0, 200),
        },
      });
    }
  }

  return issues;
}

/**
 * Check motion duration matches KRDS tokens
 */
function checkMotion(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Get all stylesheets and check for animation durations
  const stylesheets = Array.from(document.styleSheets);
  const validDurations = [0, 150, 300, 500, 700]; // ms values from KRDS

  for (const sheet of stylesheets) {
    try {
      const rules = Array.from(sheet.cssRules || []);

      for (const rule of rules) {
        if (rule.type !== CSSRule.STYLE_RULE) continue;

        const style = (rule as CSSStyleRule).style;
        const duration = style.animationDuration;

        if (!duration) continue;

        // Parse duration (e.g., "0.3s", "300ms")
        const durationMs = parseDuration(duration);

        if (durationMs === null) continue;

        // Check if duration is close to KRDS values
        const isClose = validDurations.some((v) => Math.abs(v - durationMs) <= 50);

        if (!isClose && durationMs > 1000) {
          issues.push({
            id: `motion-duration-${Date.now()}-${Math.random()}`,
            category,
            severity: 'info',
            rule: 'motion-duration',
            message: `애니메이션 지속시간이 KRDS 토큰과 다릅니다 (${duration})`,
            suggestion: 'KRDS 모션 지속시간(150ms, 300ms, 500ms, 700ms)을 사용하세요',
            krdsCriteria: 'motion-duration',
          });
        }
      }
    } catch {
      // CORS or other access issues - skip
    }
  }

  return issues;
}

/**
 * Parse animation duration to milliseconds
 */
function parseDuration(duration: string): number | null {
  // Handle "0.3s" format
  const secMatch = duration.match(/^([\d.]+)s$/);
  if (secMatch) {
    return Math.round(parseFloat(secMatch[1]) * 1000);
  }

  // Handle "300ms" format
  const msMatch = duration.match(/^([\d.]+)ms$/);
  if (msMatch) {
    return Math.round(parseFloat(msMatch[1]));
  }

  return null;
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
