// src/utils/accessibility/htmlValidator.ts
// HTML Accessibility Validator (WCAG 2.1 AA)

import type { CategoryResult, AccessibilityIssue } from '../../types/accessibility';
import { generateSelector } from './selectorUtils';

export function validateHtml(doc: Document): CategoryResult {
  const issues: AccessibilityIssue[] = [];
  let total = 0;
  let passed = 0;

  // Check: img[alt]
  const images = doc.querySelectorAll('img');
  images.forEach((img, i) => {
    if (isElementExcludedFromA11yTree(img)) {
      return;
    }

    const role = img.getAttribute('role')?.toLowerCase() || '';
    const ariaHidden = img.getAttribute('aria-hidden') === 'true';

    if (role === 'presentation' || role === 'none' || ariaHidden) {
      return;
    }

    total++;
    const alt = img.getAttribute('alt');
    const ariaLabel = normalizeText(img.getAttribute('aria-label'));
    const labelledText = getAriaLabelledByText(img);

    if (alt !== null || ariaLabel.length > 0 || labelledText.length > 0) {
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
          selector: generateSelector(img as HTMLElement),
          outerHTML: img.outerHTML.substring(0, 200),
        },
        wcagCriteria: '1.1.1',
      });
    }
  });

  // Check: input[label]
  const inputs = doc.querySelectorAll('input, select, textarea');
  inputs.forEach((input, i) => {
    const type = input.tagName.toLowerCase();
    const inputType = (input as HTMLInputElement).type;

    // Skip hidden inputs
    if (type === 'input' && (inputType === 'hidden' || inputType === 'submit' || inputType === 'button')) {
      return;
    }

    total++;
    const hasLabel = hasAssociatedLabel(input);
    if (hasLabel) {
      passed++;
    } else {
      issues.push({
        id: `html-input-label-${i}`,
        category: 'html',
        severity: 'critical',
        rule: 'input[label]',
        message: `${type === 'input' ? '입력' : type.toUpperCase()}에 레이블이 연결되어 있지 않습니다`,
        suggestion: '<label> 요소를 추가하거나 aria-label 속성을 사용하세요',
        element: {
          tagName: type.toUpperCase(),
          selector: generateSelector(input as HTMLElement),
          outerHTML: input.outerHTML.substring(0, 200),
        },
        wcagCriteria: '1.3.1',
      });
    }
  });

  // Check: a[text]
  const links = doc.querySelectorAll('a[href]');
  links.forEach((link, i) => {
    if (isElementExcludedFromA11yTree(link)) {
      return;
    }

    total++;
    const accessibleName = getElementAccessibleName(link);
    const hasAccessibleText = accessibleName.length > 0;

    if (hasAccessibleText) {
      passed++;
    } else {
      issues.push({
        id: `html-a-text-${i}`,
        category: 'html',
        severity: 'critical',
        rule: 'a[text]',
        message: '링크에 접근 가능한 텍스트가 없습니다',
        suggestion: '링크 텍스트를 추가하거나 aria-label/aria-labelledby를 제공하세요. 이미지 링크는 img alt를 제공하세요',
        element: {
          tagName: 'A',
          selector: generateSelector(link as HTMLElement),
          outerHTML: link.outerHTML.substring(0, 200),
        },
        wcagCriteria: '2.4.4',
      });
    }
  });

  // Check: button[text]
  const buttons = doc.querySelectorAll('button, [role="button"]');
  buttons.forEach((btn, i) => {
    if (isElementExcludedFromA11yTree(btn)) {
      return;
    }

    total++;
    const accessibleName = getElementAccessibleName(btn);
    const hasAccessibleText = accessibleName.length > 0;

    if (hasAccessibleText) {
      passed++;
    } else {
      issues.push({
        id: `html-button-text-${i}`,
        category: 'html',
        severity: 'critical',
        rule: 'button[text]',
        message: '버튼에 접근 가능한 텍스트가 없습니다',
        suggestion: '버튼 텍스트를 추가하거나 aria-label 속성을 사용하세요',
        element: {
          tagName: 'BUTTON',
          selector: generateSelector(btn as HTMLElement),
          outerHTML: btn.outerHTML.substring(0, 200),
        },
        wcagCriteria: '4.1.2',
      });
    }
  });

  // Check: table[th]
  const tables = doc.querySelectorAll('table');
  tables.forEach((table, i) => {
    total++;
    const hasHeaders = table.querySelectorAll('th').length > 0;
    if (hasHeaders) {
      passed++;
    } else {
      issues.push({
        id: `html-table-th-${i}`,
        category: 'html',
        severity: 'high',
        rule: 'table[th]',
        message: '테이블에 헤더 셀(th)이 없습니다',
        suggestion: '<th> 요소를 사용하여 테이블 헤더를 정의하세요',
        element: {
          tagName: 'TABLE',
          selector: generateSelector(table as HTMLElement),
          outerHTML: table.outerHTML.substring(0, 200),
        },
        wcagCriteria: '1.3.1',
      });
    }
  });

  // Check: heading-order
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  let headingOrderPassed = true;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1 && level > lastLevel + 1) {
      headingOrderPassed = false;
    }
    lastLevel = level;
  });
  total++; // One check for all headings
  if (headingOrderPassed) {
    passed++;
  } else {
    issues.push({
      id: 'html-heading-order',
      category: 'html',
      severity: 'high',
      rule: 'heading-order',
      message: '제목 수준이 건너뛰었습니다 (예: h1 → h3)',
      suggestion: '제목 수준을 순서대로 사용하세요 (h1 → h2 → h3)',
      wcagCriteria: '1.3.1',
    });
  }

  // Check: html[lang]
  const html = doc.documentElement;
  total++;
  if (html.getAttribute('lang')) {
    passed++;
  } else {
    issues.push({
      id: 'html-lang',
      category: 'html',
      severity: 'high',
      rule: 'html[lang]',
      message: '<html> 요소에 lang 속성이 없습니다',
      suggestion: 'lang 속성을 추가하세요 (예: lang="ko" 또는 lang="en")',
      wcagCriteria: '3.1.1',
    });
  }

  // Check: landmarks (main, nav, header, footer)
  total++;
  const hasMain = doc.querySelector('main') !== null;
  const hasNav = doc.querySelector('nav') !== null;
  const hasHeader = doc.querySelector('header') !== null;
  const hasFooter = doc.querySelector('footer') !== null;

  if (hasMain && (hasNav || hasHeader || hasFooter)) {
    passed++;
  } else {
    issues.push({
      id: 'html-landmark',
      category: 'html',
      severity: 'medium',
      rule: 'landmark',
      message: '페이지에 적절한 랜드마크가 부족합니다',
      suggestion: '<main>, <nav>, <header>, <footer> 요소를 사용하여 페이지 구조를 명확히 하세요',
      wcagCriteria: '2.4.1',
    });
  }

  // Check: tabindex (no positive values)
  const positiveTabindexes = doc.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
  if (positiveTabindexes.length > 0) {
    total++;
    positiveTabindexes.forEach((el, i) => {
      issues.push({
        id: `html-tabindex-${i}`,
        category: 'html',
        severity: 'medium',
        rule: 'tabindex',
        message: `tabindex="${el.getAttribute('tabindex')}"이 사용되었습니다`,
        suggestion: 'tabindex를 0 또는 -1로 설정하거나 제거하세요 (자연 탭 순서 사용 권장)',
        wcagCriteria: '2.4.3',
      });
    });
  } else {
    total++;
    passed++;
  }

  const score = total > 0 ? Math.round((passed / total) * 100) : 100;
  return { category: 'html', label: 'HTML 접근성', passed, total, score, issues };
}

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

function getAriaLabelledByText(element: Element): string {
  const labelledBy = normalizeText(element.getAttribute('aria-labelledby'));
  if (!labelledBy) {
    return '';
  }

  const owner = element.ownerDocument;
  if (!owner) {
    return '';
  }

  const text = labelledBy
    .split(' ')
    .map((id) => owner.getElementById(id))
    .filter((node): node is HTMLElement => node instanceof HTMLElement)
    .map((node) => normalizeText(node.textContent))
    .filter((value) => value.length > 0)
    .join(' ');

  return normalizeText(text);
}

function getDescendantImageAltText(element: Element): string {
  const imageAlts = Array.from(element.querySelectorAll('img[alt], input[type="image"][alt]'))
    .filter((node) => !isElementExcludedFromA11yTree(node))
    .map((node) => normalizeText(node.getAttribute('alt')))
    .filter((alt) => alt.length > 0)
    .join(' ');

  return normalizeText(imageAlts);
}

function getVisibleTextContent(element: Element): string {
  const owner = element.ownerDocument;
  if (!owner) {
    return '';
  }

  const showText = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
  const walker = owner.createTreeWalker(element, showText);
  const chunks: string[] = [];

  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    const text = normalizeText(node.textContent);
    if (parent && text.length > 0 && !isElementExcludedFromA11yTree(parent)) {
      chunks.push(text);
    }
    node = walker.nextNode();
  }

  return normalizeText(chunks.join(' '));
}

function getComputedStyleSafe(element: Element): CSSStyleDeclaration | null {
  const owner = element.ownerDocument;
  const view = owner?.defaultView;
  if (!view) {
    return null;
  }

  try {
    return view.getComputedStyle(element);
  } catch {
    return null;
  }
}

function isElementExcludedFromA11yTree(element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    if (current.hasAttribute('hidden')) {
      return true;
    }

    if (current.getAttribute('aria-hidden') === 'true') {
      return true;
    }

    if (current.hasAttribute('inert')) {
      return true;
    }

    if (current instanceof HTMLElement) {
      if (current.style.display === 'none') {
        return true;
      }

      if (current.style.visibility === 'hidden' || current.style.visibility === 'collapse') {
        return true;
      }

      if ('contentVisibility' in current.style && current.style.contentVisibility === 'hidden') {
        return true;
      }
    }

    const style = getComputedStyleSafe(current);
    if (style) {
      if (style.display === 'none') {
        return true;
      }

      if (style.visibility === 'hidden' || style.visibility === 'collapse') {
        return true;
      }

      if ('contentVisibility' in style && style.contentVisibility === 'hidden') {
        return true;
      }
    }

    current = current.parentElement;
  }

  return false;
}

function getElementAccessibleName(element: Element): string {
  const directAria = normalizeText(element.getAttribute('aria-label'));
  if (directAria.length > 0) {
    return directAria;
  }

  const labelledText = getAriaLabelledByText(element);
  if (labelledText.length > 0) {
    return labelledText;
  }

  const ownText = getVisibleTextContent(element);
  if (ownText.length > 0) {
    return ownText;
  }

  const title = normalizeText(element.getAttribute('title'));
  if (title.length > 0) {
    return title;
  }

  const imageAltText = getDescendantImageAltText(element);
  if (imageAltText.length > 0) {
    return imageAltText;
  }

  return '';
}

/**
 * Check if an element has an associated label
 * Checks for: <label for="...">, aria-label, aria-labelledby
 */
function hasAssociatedLabel(element: Element): boolean {
  // Check for aria-label or aria-labelledby
  if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) {
    return true;
  }

  // Check for <label> element with matching `for` attribute
  if (element.id) {
    const labels = document.querySelectorAll(`label[for="${element.id}"]`);
    if (labels.length > 0) {
      return true;
    }
  }

  // Check if wrapped in <label>
  if (element.parentElement?.tagName === 'LABEL') {
    return true;
  }

  return false;
}
