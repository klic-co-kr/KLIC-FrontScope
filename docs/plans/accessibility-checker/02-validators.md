# Phase 2: Validators (Tasks 9-20)

> 6 validator modules + contrast utility + score calculator

Each validator module returns the `CategoryResult` type defined in `src/types/accessibility.ts`:

```typescript
// from src/types/accessibility.ts
interface CategoryResult {
  category: ValidationCategory;
  label: string;
  passed: number;
  total: number;
  score: number;       // Simple ratio: (passed / total) * 100
  issues: AccessibilityIssue[];
}
```

**Note:** Category `score` is a raw compliance ratio. The total weighted score is calculated by `scoreCalculator.ts` using severity weights.

---

## Task 9: Create Contrast Utility Functions

**Files:**
- Create: `src/utils/accessibility/contrastUtils.ts`
- Test: `src/utils/accessibility/__tests__/contrastUtils.test.ts`

**Step 1: Write the failing test**

```typescript
// src/utils/accessibility/__tests__/contrastUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  hexToRgb,
} from '../contrastUtils';

describe('contrastUtils', () => {
  it('hexToRgb converts hex to RGB tuple', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#0F4C8C')).toEqual([15, 76, 140]);
  });

  it('relativeLuminance calculates correctly', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1.0, 2);
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0.0, 2);
  });

  it('contrastRatio between black and white is 21:1', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
  });

  it('meetsContrastAA checks normal text threshold 4.5:1', () => {
    expect(meetsContrastAA([0, 0, 0], [255, 255, 255], false)).toBe(true);
    expect(meetsContrastAA([150, 150, 150], [255, 255, 255], false)).toBe(false);
  });

  it('meetsContrastAA checks large text threshold 3:1', () => {
    expect(meetsContrastAA([150, 150, 150], [255, 255, 255], true)).toBe(false);
  });

  it('parseColor handles rgb(), rgba(), hex, named colors', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0]);
    expect(parseColor('rgba(0, 128, 0, 1)')).toEqual([0, 128, 0]);
    expect(parseColor('#FF0000')).toEqual([255, 0, 0]);
    expect(parseColor('#f00')).toEqual([255, 0, 0]);
  });
});
```

**Step 2:** Run test → FAIL

**Step 3: Write implementation**

```typescript
// src/utils/accessibility/contrastUtils.ts

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  const expanded = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
  const num = parseInt(expanded, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function parseColor(color: string): RGB | null {
  if (!color || color === 'transparent') return null;

  // hex
  if (color.startsWith('#')) return hexToRgb(color);

  // rgb() / rgba()
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }

  return null;
}

function sRGBtoLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = rgb.map(sRGBtoLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastAA(fg: RGB, bg: RGB, isLargeText: boolean): boolean {
  const ratio = contrastRatio(fg, bg);
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

export function meetsContrastAAA(fg: RGB, bg: RGB, isLargeText: boolean): boolean {
  const ratio = contrastRatio(fg, bg);
  return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
}

export function isLargeText(fontSize: number, fontWeight: number): boolean {
  return fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
}
```

**Step 4:** Run test → PASS

**Commit:** `feat(a11y): add WCAG contrast ratio utility functions`

---

## Task 9.5: Create Shared Selector Utility

**Files:**
- Create: `src/utils/accessibility/selectorUtils.ts`

Shared utility used by validators and content script extractors.

```typescript
// src/utils/accessibility/selectorUtils.ts

/**
 * Generate a CSS selector for an element (for display in issue reports).
 * Used by both validator modules and content script extractors.
 */
export function generateSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList).slice(0, 2).join('.');
  return classes ? `${tag}.${classes}` : tag;
}
```

**Commit:** `feat(a11y): add shared generateSelector utility`

---

## Task 10: Create HTML Validator

**Files:**
- Create: `src/utils/accessibility/htmlValidator.ts`
- Test: `src/utils/accessibility/__tests__/htmlValidator.test.ts`

Validates: `img[alt]`, `input[label]`, `a[text]`, `table[th]`, `heading-order`, `html[lang]`, `landmark`, `button[text]`, `form[fieldset]`, `tabindex`, `aria-roles`, `focus-visible`, `video[captions]`, `auto-play`

Key implementation patterns:

```typescript
// src/utils/accessibility/htmlValidator.ts
import type { CategoryResult, AccessibilityIssue } from '../../types/accessibility';
import { generateSelector } from './selectorUtils';

export function validateHtml(doc: Document): CategoryResult {
  const issues: AccessibilityIssue[] = [];
  let total = 0;
  let passed = 0;

  // Check: img[alt]
  const images = doc.querySelectorAll('img');
  images.forEach((img, i) => {
    total++;
    if (img.hasAttribute('alt')) {
      passed++;
    } else {
      issues.push({
        id: `html-img-alt-${i}`,
        category: 'html',
        severity: 'critical',
        rule: 'img[alt]',
        message: '이미지에 alt 속성이 누락되었습니다',
        suggestion: '의미있는 대체 텍스트를 alt 속성에 추가하세요. 장식 이미지인 경우 alt=""를 사용하세요.',
        element: {
          tagName: 'IMG',
          selector: generateSelector(img),
          outerHTML: img.outerHTML.substring(0, 200),
        },
        wcagCriteria: '1.1.1',
      });
    }
  });

  // ... (similar pattern for all 14 checks)

  const score = total > 0 ? Math.round((passed / total) * 100) : 100;
  return { category: 'html', label: 'HTML 접근성', passed, total, score, issues };
}
```

**Commit:** `feat(a11y): add HTML accessibility validator (WCAG 2.1 AA)`

---

## Task 11: Create Color Validator

**Files:**
- Create: `src/utils/accessibility/colorValidator.ts`
- Test: `src/utils/accessibility/__tests__/colorValidator.test.ts`

Validates: text contrast ratios, KRDS color palette matching, status color semantics.

Receives extracted color pairs from the content script scanner.

```typescript
// src/utils/accessibility/colorValidator.ts
import type { CategoryResult, AccessibilityIssue } from '../../types/accessibility';
import { contrastRatio, isLargeText, parseColor } from './contrastUtils';
import { KRDS_COLORS, CONTRAST_THRESHOLDS } from '../../constants/krds/colors';

export interface ColorPair {
  foreground: string;
  background: string;
  fontSize: number;
  fontWeight: number;
  selector: string;
  outerHTML: string;
}

export function validateColors(colorPairs: ColorPair[]): CategoryResult {
  const issues: AccessibilityIssue[] = [];
  let total = 0;
  let passed = 0;

  for (const pair of colorPairs) {
    const fg = parseColor(pair.foreground);
    const bg = parseColor(pair.background);
    if (!fg || !bg) continue;

    total++;
    const ratio = contrastRatio(fg, bg);
    const large = isLargeText(pair.fontSize, pair.fontWeight);
    const threshold = large ? CONTRAST_THRESHOLDS.AA_LARGE : CONTRAST_THRESHOLDS.AA_NORMAL;

    if (ratio >= threshold) {
      passed++;
    } else {
      issues.push({
        id: `color-contrast-${total}`,
        category: 'color',
        severity: ratio < 2 ? 'critical' : 'high',
        rule: 'text-contrast-aa',
        message: `텍스트 대비율이 ${ratio.toFixed(1)}:1입니다 (최소 ${threshold}:1 필요)`,
        suggestion: `텍스트 색상(${pair.foreground})이나 배경색(${pair.background})을 조정하여 대비율을 높이세요`,
        element: { tagName: '', selector: pair.selector, outerHTML: pair.outerHTML },
        wcagCriteria: '1.4.3',
        krdsCriteria: 'color-contrast-aa',
      });
    }
  }

  const score = total > 0 ? Math.round((passed / total) * 100) : 100;
  return { category: 'color', label: '색상 대비', passed, total, score, issues };
}
```

**Commit:** `feat(a11y): add color contrast validator with KRDS palette`

---

## Task 12: Create Typography Validator

**Files:**
- Create: `src/utils/accessibility/typographyValidator.ts`

Validates: min font size, line height, letter spacing, heading scale, KRDS typography match.

```typescript
// Receives extracted typography data from content script
export interface TypographyData {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number; // em
  tagName: string;
  selector: string;
  isHeading: boolean;
  headingLevel?: number;
}

export function validateTypography(data: TypographyData[]): CategoryResult {
  // Check min font size, line height, letter spacing, heading order, KRDS scale match
}
```

**Commit:** `feat(a11y): add typography validator with KRDS typography system`

---

## Task 13: Create Component Validator

**Files:**
- Create: `src/utils/accessibility/componentValidator.ts`

Validates: button sizes, form label association, modal focus traps, keyboard operability.

Uses `KRDS_COMPONENT_RULES` to iterate through component-specific checks.

**Commit:** `feat(a11y): add component pattern validator with KRDS rules`

---

## Task 14: Create Responsive Validator

**Files:**
- Create: `src/utils/accessibility/responsiveValidator.ts`

Validates: viewport meta, touch targets, horizontal scroll, text resize.

```typescript
export interface LayoutData {
  viewportMeta: string | null;
  documentWidth: number;
  viewportWidth: number;
  interactiveElements: Array<{
    selector: string;
    width: number;
    height: number;
    tagName: string;
  }>;
}

export function validateResponsive(data: LayoutData): CategoryResult {
  // Check viewport meta, touch targets >= 44px, no horizontal scroll
}
```

**Commit:** `feat(a11y): add responsive design validator with KRDS breakpoints`

---

## Task 15: Create Token Validator

**Files:**
- Create: `src/utils/accessibility/tokenValidator.ts`

Validates: spacing 4px grid alignment, KRDS token matching.

Mostly INFO-level issues — these are recommendations, not blockers.

**Commit:** `feat(a11y): add design token validator with KRDS spacing scale`

---

## Task 16: Create Score Calculator

**Files:**
- Create: `src/utils/accessibility/scoreCalculator.ts`
- Test: `src/utils/accessibility/__tests__/scoreCalculator.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateReport, calculateGrade } from '../scoreCalculator';

describe('scoreCalculator', () => {
  it('calculateGrade returns A for score >= 90', () => {
    expect(calculateGrade(95)).toBe('A');
    expect(calculateGrade(90)).toBe('A');
  });

  it('calculateGrade returns B for 75-89', () => {
    expect(calculateGrade(85)).toBe('B');
    expect(calculateGrade(75)).toBe('B');
  });

  it('calculateGrade returns F for 0-39', () => {
    expect(calculateGrade(30)).toBe('F');
    expect(calculateGrade(0)).toBe('F');
  });

  it('krdsCompliant is true for score >= 75', () => {
    const report = calculateReport('https://example.com', [
      { category: 'html', label: 'HTML', passed: 9, total: 10, score: 90, issues: [] },
    ], 500);
    expect(report.krdsCompliant).toBe(true);
  });

  it('calculates weighted score based on severity', () => {
    // 10 total checks, 8 passed, 2 failed (issues.length must equal total - passed)
    const report = calculateReport('https://example.com', [
      {
        category: 'html', label: 'HTML', passed: 8, total: 10, score: 80,
        issues: [
          { id: '1', category: 'html', severity: 'critical', rule: 'r1', message: 'm', suggestion: 's' },
          { id: '2', category: 'html', severity: 'info', rule: 'r2', message: 'm', suggestion: 's' },
        ],
      },
    ], 500);
    expect(report.summary.critical).toBe(1);
    expect(report.summary.info).toBe(1);
    // Weighted: maxPenalty = 10 * 10 = 100, actualPenalty = 10 + 0 = 10, score = 90
    expect(report.totalScore).toBe(90);
  });
});
```

**Step 3: Write implementation**

```typescript
// src/utils/accessibility/scoreCalculator.ts
import type {
  AccessibilityReport,
  AccessibilityGrade,
  CategoryResult,
  IssueSeverity,
} from '../../types/accessibility';
import {
  SEVERITY_WEIGHTS,
  GRADE_THRESHOLDS,
} from '../../types/accessibility';

export function calculateGrade(score: number): AccessibilityGrade {
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (score >= min) return grade;
  }
  return 'F';
}

export function calculateReport(
  url: string,
  categories: CategoryResult[],
  scanDuration: number,
): AccessibilityReport {
  const allIssues = categories.flatMap(c => c.issues);

  const summary = {
    critical: allIssues.filter(i => i.severity === 'critical').length,
    high: allIssues.filter(i => i.severity === 'high').length,
    medium: allIssues.filter(i => i.severity === 'medium').length,
    low: allIssues.filter(i => i.severity === 'low').length,
    info: allIssues.filter(i => i.severity === 'info').length,
    totalIssues: allIssues.length,
    totalPassed: categories.reduce((sum, c) => sum + c.passed, 0),
    totalChecks: categories.reduce((sum, c) => sum + c.total, 0),
  };

  // Weighted score: deduct based on severity weights
  const maxPenalty = summary.totalChecks * SEVERITY_WEIGHTS.critical;
  const actualPenalty = allIssues.reduce(
    (sum, issue) => sum + SEVERITY_WEIGHTS[issue.severity], 0
  );
  const totalScore = maxPenalty > 0
    ? Math.max(0, Math.round((1 - actualPenalty / maxPenalty) * 100))
    : 100;

  const grade = calculateGrade(totalScore);

  return {
    url,
    timestamp: Date.now(),
    totalScore,
    grade,
    krdsCompliant: totalScore >= 75,
    categories,
    summary,
    scanDuration,
  };
}
```

**Commit:** `feat(a11y): add score calculator with weighted severity and KRDS compliance`

---

## Task 17: Create Validator Barrel Export

**Files:**
- Create: `src/utils/accessibility/index.ts`

```typescript
export { validateHtml } from './htmlValidator';
export { validateColors } from './colorValidator';
export { validateTypography } from './typographyValidator';
export { validateComponents } from './componentValidator';
export { validateResponsive } from './responsiveValidator';
export { validateTokens } from './tokenValidator';
export { calculateReport, calculateGrade } from './scoreCalculator';
export * from './contrastUtils';
export { generateSelector } from './selectorUtils';
```

**Commit:** `feat(a11y): add validator barrel exports`

---

## Tasks 18-20: Unit Tests for Validators

Create comprehensive tests for:
- Task 18: `htmlValidator.test.ts` — test each of the 14 HTML checks with mock DOM
- Task 19: `colorValidator.test.ts` — test contrast ratio checks with known color pairs
- Task 20: `scoreCalculator.test.ts` — test score calculation, grade mapping, summary aggregation

Each test file should achieve ≥ 80% coverage for its module.

**Commit:** `test(a11y): add unit tests for accessibility validators`
