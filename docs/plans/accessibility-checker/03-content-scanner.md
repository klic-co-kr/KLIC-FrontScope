# Phase 3: Content Script Scanner (Tasks 21-26)

> DOM scanning, element extraction, scan orchestration in content script context

---

## Task 21: Create DOM Scanner

**Files:**
- Create: `src/content/accessibility/domScanner.ts`

Traverses the DOM tree and collects scannable elements, respecting `maxElementsToScan` limit and `includeHidden` setting.

```typescript
// src/content/accessibility/domScanner.ts

export interface ScannableElement {
  element: Element;
  tagName: string;
  computedStyle: CSSStyleDeclaration;
  rect: DOMRect;
  isVisible: boolean;
  isInteractive: boolean;
}

export function scanDOM(
  root: Document | Element,
  maxElements: number,
  includeHidden: boolean
): ScannableElement[] {
  const elements: ScannableElement[] = [];
  const walker = document.createTreeWalker(
    root instanceof Document ? root.body : root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (elements.length >= maxElements) return NodeFilter.FILTER_REJECT;
        const el = node as Element;
        // Skip KLIC extension overlays
        if (el.id?.startsWith('klic-') || el.dataset?.klicTool) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node: Node | null;
  while ((node = walker.nextNode()) && elements.length < maxElements) {
    const el = node as Element;
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== 'none'
      && style.visibility !== 'hidden'
      && style.opacity !== '0';

    if (!isVisible && !includeHidden) continue;

    const rect = el.getBoundingClientRect();
    const isInteractive = isInteractiveElement(el);

    elements.push({
      element: el,
      tagName: el.tagName,
      computedStyle: style,
      rect,
      isVisible,
      isInteractive,
    });
  }

  return elements;
}

function isInteractiveElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
  if (interactiveTags.includes(tag)) return true;
  if (el.getAttribute('role') === 'button') return true;
  if (el.getAttribute('tabindex') !== null) return true;
  if (el.getAttribute('onclick') !== null) return true;
  return false;
}
```

**Commit:** `feat(a11y): add DOM scanner for content script`

---

## Task 22: Create Element Extractor

**Files:**
- Create: `src/content/accessibility/elementExtractor.ts`

Extracts structured data from scannable elements for component and HTML validators.

```typescript
// src/content/accessibility/elementExtractor.ts
import type { ScannableElement } from './domScanner';

export interface ExtractedElementData {
  images: Array<{ element: Element; hasAlt: boolean; altText: string; selector: string; outerHTML: string }>;
  links: Array<{ element: Element; hasText: boolean; text: string; selector: string; outerHTML: string }>;
  inputs: Array<{ element: Element; type: string; hasLabel: boolean; selector: string; outerHTML: string }>;
  buttons: Array<{ element: Element; hasText: boolean; text: string; width: number; height: number; selector: string; outerHTML: string }>;
  headings: Array<{ element: Element; level: number; text: string; selector: string }>;
  tables: Array<{ element: Element; hasHeaders: boolean; hasCaption: boolean; selector: string; outerHTML: string }>;
  forms: Array<{ element: Element; hasFieldset: boolean; selector: string; outerHTML: string }>;
  modals: Array<{ element: Element; selector: string; outerHTML: string }>;
  videos: Array<{ element: Element; hasCaptions: boolean; selector: string; outerHTML: string }>;
  landmarks: { hasMain: boolean; hasNav: boolean; hasHeader: boolean; hasFooter: boolean };
  htmlLang: string | null;
  interactiveElements: ScannableElement[];
}

export function extractElements(elements: ScannableElement[]): ExtractedElementData {
  // ... iterate through elements and categorize
}
```

**Commit:** `feat(a11y): add element extractor for accessibility checks`

---

## Task 23: Create Color Extractor

**Files:**
- Create: `src/content/accessibility/colorExtractor.ts`

Extracts foreground/background color pairs for contrast checking.

```typescript
// src/content/accessibility/colorExtractor.ts
import type { ScannableElement } from './domScanner';
import type { ColorPair } from '../../utils/accessibility/colorValidator';
import { generateSelector } from '../../utils/accessibility/selectorUtils';

export function extractColors(elements: ScannableElement[]): ColorPair[] {
  const pairs: ColorPair[] = [];

  for (const { element, computedStyle, rect } of elements) {
    // Skip elements with no text content
    const text = element.textContent?.trim();
    if (!text || text.length === 0) continue;

    // Skip elements with zero size
    if (rect.width === 0 || rect.height === 0) continue;

    const foreground = computedStyle.color;
    const background = getEffectiveBackground(element);
    if (!foreground || !background) continue;

    const fontSize = parseFloat(computedStyle.fontSize);
    const fontWeight = parseInt(computedStyle.fontWeight) || 400;

    pairs.push({
      foreground,
      background,
      fontSize,
      fontWeight,
      selector: generateSelector(element),
      outerHTML: element.outerHTML.substring(0, 200),
    });
  }

  return pairs;
}

/**
 * Walk up the DOM tree to find effective background color
 * (handles transparent backgrounds)
 */
function getEffectiveBackground(element: Element): string {
  let current: Element | null = element;
  while (current) {
    const style = window.getComputedStyle(current);
    const bg = style.backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      return bg;
    }
    current = current.parentElement;
  }
  return 'rgb(255, 255, 255)'; // assume white if no background found
}
```

**Commit:** `feat(a11y): add color pair extractor for contrast analysis`

---

## Task 24: Create Typography Extractor

**Files:**
- Create: `src/content/accessibility/typographyExtractor.ts`

Extracts typography data for font size, line height, and heading scale checks.

```typescript
// src/content/accessibility/typographyExtractor.ts
import type { ScannableElement } from './domScanner';
import type { TypographyData } from '../../utils/accessibility/typographyValidator';
import { generateSelector } from '../../utils/accessibility/selectorUtils';

export function extractTypography(elements: ScannableElement[]): TypographyData[] {
  const data: TypographyData[] = [];
  const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  for (const { element, computedStyle } of elements) {
    const text = element.textContent?.trim();
    if (!text) continue;

    const tagName = element.tagName;
    const isHeading = headingTags.includes(tagName);
    const headingLevel = isHeading ? parseInt(tagName[1]) : undefined;

    data.push({
      fontSize: parseFloat(computedStyle.fontSize),
      fontWeight: parseInt(computedStyle.fontWeight) || 400,
      lineHeight: parseLineHeight(computedStyle.lineHeight, parseFloat(computedStyle.fontSize)),
      letterSpacing: parseLetterSpacing(computedStyle.letterSpacing),
      tagName,
      selector: generateSelector(element),
      isHeading,
      headingLevel,
    });
  }

  return data;
}

function parseLineHeight(lineHeight: string, fontSize: number): number {
  // getComputedStyle usually returns px values, but 'normal' is possible
  // for elements where line-height is not explicitly set.
  // Browser 'normal' is typically 1.0–1.2; use 1.2 as conservative estimate.
  if (lineHeight === 'normal') return 1.2;
  if (lineHeight.endsWith('px')) {
    return fontSize > 0 ? parseFloat(lineHeight) / fontSize : 1.2;
  }
  const parsed = parseFloat(lineHeight);
  return isNaN(parsed) ? 1.2 : parsed;
}

function parseLetterSpacing(letterSpacing: string): number {
  if (letterSpacing === 'normal') return 0;
  if (letterSpacing.endsWith('em')) return parseFloat(letterSpacing);
  if (letterSpacing.endsWith('px')) return parseFloat(letterSpacing) / 16; // rough em conversion
  return 0;
}
```

**Commit:** `feat(a11y): add typography data extractor`

---

## Task 25: Create Layout Extractor

**Files:**
- Create: `src/content/accessibility/layoutExtractor.ts`

Extracts layout and responsive data for responsive and token validators.

```typescript
// src/content/accessibility/layoutExtractor.ts
import type { LayoutData } from '../../utils/accessibility/responsiveValidator';
import { generateSelector } from '../../utils/accessibility/selectorUtils';

/**
 * @param maxElements - Limits interactive elements scanned (matches domScanner limit)
 */
export function extractLayout(maxElements: number): LayoutData {
  const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null;

  // Find interactive elements (respect maxElements limit for performance)
  const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [tabindex]';
  const interactiveEls = document.querySelectorAll(interactiveSelectors);
  const interactiveElements: LayoutData['interactiveElements'] = [];

  for (let i = 0; i < Math.min(interactiveEls.length, maxElements); i++) {
    const el = interactiveEls[i];
    // Skip KLIC extension overlays
    if ((el as HTMLElement).id?.startsWith('klic-') || (el as HTMLElement).dataset?.klicTool) continue;

    const rect = el.getBoundingClientRect();
    interactiveElements.push({
      selector: generateSelector(el),
      width: rect.width,
      height: rect.height,
      tagName: el.tagName,
    });
  }

  return {
    viewportMeta,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    interactiveElements,
  };
}
```

**Commit:** `feat(a11y): add layout data extractor for responsive checks`

---

## Task 26: Create Scan Orchestrator

**Files:**
- Create: `src/content/accessibility/scanOrchestrator.ts`

Entry point that coordinates all extractors and validators.

```typescript
// src/content/accessibility/scanOrchestrator.ts
import type { AccessibilityReport, AccessibilitySettings } from '../../types/accessibility';
import { scanDOM } from './domScanner';
import { extractElements } from './elementExtractor';
import { extractColors } from './colorExtractor';
import { extractTypography } from './typographyExtractor';
import { extractLayout } from './layoutExtractor';
import {
  validateHtml,
  validateColors,
  validateTypography,
  validateComponents,
  validateResponsive,
  validateTokens,
  calculateReport,
} from '../../utils/accessibility';
import type { CategoryResult } from '../../types/accessibility';

export async function runAccessibilityScan(
  settings: AccessibilitySettings
): Promise<AccessibilityReport> {
  const startTime = performance.now();
  const url = window.location.href;

  // 1. Scan DOM
  const scannableElements = scanDOM(
    document,
    settings.maxElementsToScan,
    settings.includeHidden
  );

  // 2. Extract data
  const elementData = extractElements(scannableElements);
  const colorData = extractColors(scannableElements);
  const typographyData = extractTypography(scannableElements);
  const layoutData = extractLayout(settings.maxElementsToScan);

  // 3. Run validators (only enabled categories)
  const categories: CategoryResult[] = [];

  if (settings.enabledCategories.includes('html')) {
    categories.push(validateHtml(document));
  }
  if (settings.enabledCategories.includes('color')) {
    categories.push(validateColors(colorData));
  }
  if (settings.enabledCategories.includes('typography')) {
    categories.push(validateTypography(typographyData));
  }
  if (settings.enabledCategories.includes('component')) {
    categories.push(validateComponents(elementData));
  }
  if (settings.enabledCategories.includes('responsive')) {
    categories.push(validateResponsive(layoutData));
  }
  if (settings.enabledCategories.includes('token')) {
    categories.push(validateTokens(scannableElements));
  }

  // 4. Calculate report
  const scanDuration = performance.now() - startTime;
  return calculateReport(url, categories, scanDuration);
}
```

**Commit:** `feat(a11y): add scan orchestrator to coordinate extraction and validation`
