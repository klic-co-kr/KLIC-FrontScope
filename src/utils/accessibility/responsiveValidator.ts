// src/utils/accessibility/responsiveValidator.ts
// Responsive Design Validator - KRDS Responsive System

import type { AccessibilityIssue, ValidationCategory } from '@/types/accessibility';
import { meetsTouchTargetSize, hasValidViewportMeta } from '@/constants/krds/systems';

const category: ValidationCategory = 'responsive';

/**
 * Validate responsive design against KRDS responsive guidelines
 */
export function validateResponsive(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const viewport = window.innerWidth;

  // Check 1: Viewport meta tag
  issues.push(...checkViewportMeta());

  // Check 2: Touch target sizes
  issues.push(...checkTouchTargets(elements));

  // Check 3: Horizontal scroll
  issues.push(...checkHorizontalScroll());

  // Check 4: Responsive images
  issues.push(...checkResponsiveImages(elements, viewport));

  issues.push(...checkFocusNotObscured(elements));
  issues.push(...checkFocusNotObscuredEnhanced(elements));

  // Check 5: Text resize (200%)
  // This requires user interaction simulation, skip for automated scan

  // Check 6: Media query coverage
  issues.push(...checkMediaQueries(viewport));

  return issues;
}

/**
 * Check viewport meta tag
 */
function checkViewportMeta(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  if (!hasValidViewportMeta()) {
    issues.push({
      id: `viewport-${Date.now()}`,
      category,
      severity: 'critical',
      rule: 'viewport-meta',
      message: 'viewport 메타 태그가 없습니다',
      suggestion: '<meta name="viewport" content="width=device-width, initial-scale=1">를 추가하세요',
      wcagCriteria: '1.4.10',
    });
  }

  return issues;
}

/**
 * Check touch target sizes (44x44px minimum)
 */
function checkTouchTargets(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const interactiveElements = elements.filter((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const tabIndex = el.getAttribute('tabindex');

    return ['button', 'a', 'input', 'select', 'textarea'].includes(tag) ||
           ['button', 'link'].includes(role || '') ||
           (tabIndex && tabIndex !== '-1');
  });

  for (const el of interactiveElements) {
    if (!isElementVisible(el)) continue;

    if (isInlineTextLink(el)) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (!meetsTouchTargetSize(width, height)) {
      issues.push({
        id: `touch-target-${Date.now()}-${Math.random()}`,
        category,
        severity: 'high',
        rule: 'touch-target-44',
        message: `터치 영역이 부족합니다 (${width}x${height}px, 최소 44x44px 필요)`,
        suggestion: '대화형 요소의 크기를 44x44px 이상으로 늘리세요',
        wcagCriteria: '2.5.8',
        krdsCriteria: 'touch-target-44',
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

function checkFocusNotObscured(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const blockers = Array.from(document.body.querySelectorAll<HTMLElement>('*')).filter((el) => {
    if (!isElementVisible(el)) return false;

    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;

    const rect = el.getBoundingClientRect();
    if (rect.width < viewportWidth * 0.6) return false;
    if (rect.height < 24) return false;

    return rect.bottom > 0 && rect.top < viewportHeight;
  });

  if (blockers.length === 0) {
    return issues;
  }

  let topCover = 0;
  let bottomCover = 0;

  for (const blocker of blockers) {
    const rect = blocker.getBoundingClientRect();
    if (rect.top <= 0 && rect.bottom > 0) {
      topCover = Math.max(topCover, rect.bottom);
    }
    if (rect.bottom >= viewportHeight && rect.top < viewportHeight) {
      bottomCover = Math.max(bottomCover, viewportHeight - rect.top);
    }
  }

  if (topCover === 0 && bottomCover === 0) {
    return issues;
  }

  const focusableElements = elements.filter((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';
    const tabIndex = el.getAttribute('tabindex');

    return ['button', 'a', 'input', 'select', 'textarea'].includes(tag) ||
      role === 'button' ||
      role === 'link' ||
      (tabIndex !== null && tabIndex !== '-1');
  });

  for (const el of focusableElements) {
    if (!isElementVisible(el)) continue;
    if (blockers.some((blocker) => blocker === el || blocker.contains(el))) continue;

    const rect = el.getBoundingClientRect();
    const topObscured = topCover > 0 && rect.top >= 0 && rect.top < topCover;
    const bottomObscured = bottomCover > 0 && rect.bottom <= viewportHeight && rect.bottom > viewportHeight - bottomCover;

    if (!topObscured && !bottomObscured) {
      continue;
    }

    const style = window.getComputedStyle(el);
    const scrollMarginTop = parseFloat(style.scrollMarginTop || '0');
    const scrollMarginBottom = parseFloat(style.scrollMarginBottom || '0');

    if (topObscured && scrollMarginTop >= topCover) {
      continue;
    }

    if (bottomObscured && scrollMarginBottom >= bottomCover) {
      continue;
    }

    issues.push({
      id: `focus-obscured-${Date.now()}-${Math.random()}`,
      category,
      severity: 'medium',
      rule: 'focus-not-obscured-minimum',
      message: '고정/스티키 UI로 인해 포커스 대상이 가려질 수 있습니다',
      suggestion: '포커스 이동 시 요소가 완전히 보이도록 scroll-margin 또는 여백을 조정하세요',
      wcagCriteria: '2.4.11',
      element: {
        tagName: el.tagName.toLowerCase(),
        selector: generateSelector(el),
        outerHTML: el.outerHTML.substring(0, 200),
      },
    });
    break;
  }

  return issues;
}

function checkFocusNotObscuredEnhanced(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const blockers = Array.from(document.body.querySelectorAll<HTMLElement>('*')).filter((el) => {
    if (!isElementVisible(el)) return false;

    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
    if (style.pointerEvents === 'none') return false;

    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return false;
    if (!hasViewportIntersection(rect, viewportWidth, viewportHeight)) return false;

    const hasVisualSurface = !isFullyTransparentColor(style.backgroundColor)
      || style.boxShadow !== 'none'
      || (style.borderStyle !== 'none' && parseFloat(style.borderWidth || '0') > 0);

    return hasVisualSurface;
  });

  if (blockers.length === 0) {
    return issues;
  }

  const focusableElements = elements.filter((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';
    const tabIndex = el.getAttribute('tabindex');

    return ['button', 'a', 'input', 'select', 'textarea'].includes(tag)
      || role === 'button'
      || role === 'link'
      || (tabIndex !== null && tabIndex !== '-1');
  });

  for (const el of focusableElements) {
    if (!isElementVisible(el)) continue;

    const rect = el.getBoundingClientRect();
    if (!hasViewportIntersection(rect, viewportWidth, viewportHeight)) continue;

    if (blockers.some((blocker) => blocker === el || blocker.contains(el))) {
      continue;
    }

    let obscured = false;

    for (const blocker of blockers) {
      const blockerRect = blocker.getBoundingClientRect();
      const intersection = getIntersectionRect(rect, blockerRect);

      if (!intersection) {
        continue;
      }

      const x = clamp(intersection.left + (intersection.width / 2), 0, viewportWidth - 1);
      const y = clamp(intersection.top + (intersection.height / 2), 0, viewportHeight - 1);
      const topElement = document.elementFromPoint(x, y) as HTMLElement | null;

      if (!topElement) {
        continue;
      }

      const blockerOnTop = blocker === topElement || blocker.contains(topElement);
      const focusOnTop = el === topElement || el.contains(topElement);

      if (blockerOnTop && !focusOnTop) {
        obscured = true;
        break;
      }
    }

    if (!obscured) {
      continue;
    }

    issues.push({
      id: `focus-obscured-enhanced-${Date.now()}-${Math.random()}`,
      category,
      severity: 'info',
      rule: 'focus-not-obscured-enhanced',
      message: '포커스 표시 일부가 고정/스티키 UI에 의해 가려질 수 있습니다',
      suggestion: '키보드 포커스가 항상 완전히 보이도록 고정 UI 오프셋과 scroll-margin 값을 조정하세요',
      wcagCriteria: '2.4.12',
      element: {
        tagName: el.tagName.toLowerCase(),
        selector: generateSelector(el),
        outerHTML: el.outerHTML.substring(0, 200),
      },
    });
    break;
  }

  return issues;
}

/**
 * Check for horizontal scroll (indicates mobile responsiveness issues)
 */
function checkHorizontalScroll(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check if document has horizontal scroll
  const docWidth = document.documentElement.scrollWidth;
  const viewport = window.innerWidth;

  if (docWidth > viewport + 20) {
    issues.push({
      id: `horizontal-scroll-${Date.now()}`,
      category,
      severity: 'high',
      rule: 'no-horizontal-scroll',
      message: '가로 스크롤이 발생했습니다 (모바일 대응 문제)',
      suggestion: '반응형 디자인을 구현하여 가로 스크롤을 방지하세요',
      krdsCriteria: 'no-horizontal-scroll',
    });
  }

  return issues;
}

/**
 * Check responsive images (max-width: 100%, height: auto)
 */
function checkResponsiveImages(elements: HTMLElement[], viewport: number): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const images = elements.filter((el) => el.tagName.toLowerCase() === 'img');

  for (const img of images) {
    const style = window.getComputedStyle(img);
    const width = style.width;

    // Check if image has fixed width that exceeds viewport
    if (width && width !== 'auto' && !width.endsWith('%')) {
      const pixelWidth = parseInt(width);
      if (pixelWidth > viewport) {
        issues.push({
          id: `img-fixed-width-${Date.now()}-${Math.random()}`,
          category,
          severity: 'medium',
          rule: 'content-reflow',
          message: `이미지가 고정 폭을 가집니다 (${width}, 뷰포트 ${viewport}px)`,
          suggestion: '이미지에 max-width: 100%를 적용하세요',
          element: {
            tagName: 'img',
            selector: generateSelector(img),
            outerHTML: img.outerHTML.substring(0, 200),
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Check media query coverage
 */
function checkMediaQueries(viewport: number): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for common breakpoints
  const breakpoints = [320, 768, 1024, 1440];

  for (const bp of breakpoints) {
    // This is a heuristic check - real validation requires CSS inspection
    // We'll check viewport against breakpoints
    if (viewport < bp) {
      // Using a lower breakpoint is valid
      continue;
    }
  }

  // Check if styles load for current viewport
  // This is limited - we can't easily check media query usage from JS
  // Instead, we'll add an info issue if viewport is unusual

  if (viewport < 320) {
    issues.push({
      id: `viewport-small-${Date.now()}`,
      category,
      severity: 'info',
      rule: 'media-queries',
      message: `뷰포트가 너무 작습니다 (${viewport}px, 최소 320px)`,
      suggestion: '모바일 최소 뷰포트(320px)를 고려하세요',
      krdsCriteria: 'media-queries',
    });
  }

  return issues;
}

function isInlineTextLink(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() !== 'a') {
    return false;
  }

  if (el.querySelector('img, svg, button, input, select, textarea')) {
    return false;
  }

  const style = window.getComputedStyle(el);
  const text = el.textContent?.trim() || '';

  return style.display === 'inline' && text.length > 0;
}

function hasViewportIntersection(rect: DOMRect, viewportWidth: number, viewportHeight: number): boolean {
  return rect.right > 0
    && rect.left < viewportWidth
    && rect.bottom > 0
    && rect.top < viewportHeight;
}

type IntersectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function getIntersectionRect(a: DOMRect, b: DOMRect): IntersectionRect | null {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);

  if (right <= left || bottom <= top) {
    return null;
  }

  return { left, top, width: right - left, height: bottom - top };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isFullyTransparentColor(color: string): boolean {
  const normalized = color.replace(/\s+/g, '').toLowerCase();

  if (normalized === 'transparent') {
    return true;
  }

  const rgbaMatch = normalized.match(/^rgba\(([^)]+)\)$/);
  if (!rgbaMatch) {
    return false;
  }

  const parts = rgbaMatch[1].split(',');
  if (parts.length !== 4) {
    return false;
  }

  const alpha = Number(parts[3]);
  return Number.isFinite(alpha) && alpha <= 0;
}

function isElementVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
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
