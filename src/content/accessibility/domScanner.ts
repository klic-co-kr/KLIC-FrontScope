// src/content/accessibility/domScanner.ts
// DOM Scanner - Traverse and extract elements for validation

import { isKLICElement } from '@/utils/accessibility';

/**
 * Scannable element data
 */
export interface ScannableElement {
  element: HTMLElement;
  type: 'text' | 'heading' | 'image' | 'form' | 'table' | 'link' | 'button' | 'list' | 'landmark' | 'other';
}

/**
 * Scan DOM and return elements for accessibility validation
 */
export function scanDOM(
  root: Document | HTMLElement,
  maxElements: number = 1000,
  includeHidden: boolean = false
): ScannableElement[] {
  const elements: ScannableElement[] = [];
  const seen = new Set<HTMLElement>();

  // Start with body
  const queue: HTMLElement[] = [root instanceof Document ? root.body : root];

  while (queue.length > 0 && elements.length < maxElements) {
    const element = queue.shift()!;

    // Skip KLIC elements and already seen
    if (isKLICElement(element) || seen.has(element)) {
      continue;
    }
    seen.add(element);

    // Skip if hidden and not including hidden
    if (!includeHidden && isHidden(element)) {
      continue;
    }

    // Categorize element
    const type = categorizeElement(element);

    // Add to results
    elements.push({ element, type });

    // Add children to queue
    for (let i = 0; i < element.children.length && elements.length < maxElements; i++) {
      const child = element.children[i] as HTMLElement;
      if (child && !seen.has(child)) {
        queue.push(child);
      }
    }
  }

  return elements;
}

/**
 * Categorize element by type
 */
function categorizeElement(element: HTMLElement): ScannableElement['type'] {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role');

  // Check for ARIA roles first
  if (role === 'navigation' || tag === 'nav') {
    return 'landmark';
  }
  if (role === 'banner' || tag === 'header') {
    return 'landmark';
  }
  if (role === 'contentinfo' || tag === 'footer') {
    return 'landmark';
  }
  if (role === 'main' || tag === 'main') {
    return 'landmark';
  }

  // Check by tag name
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    return 'heading';
  }
  if (tag === 'img') {
    return 'image';
  }
  if (tag === 'button' || role === 'button') {
    return 'button';
  }
  if (['a', 'area'].includes(tag) && element.hasAttribute('href')) {
    return 'link';
  }
  if (['input', 'select', 'textarea', 'button'].includes(tag)) {
    return 'form';
  }
  if (tag === 'table') {
    return 'table';
  }
  if (['ul', 'ol', 'dl', 'menu'].includes(tag)) {
    return 'list';
  }
  if (['p', 'span', 'div', 'section', 'article', 'aside', 'figure'].includes(tag)) {
    // Check if it has text content
    if (element.textContent?.trim()) {
      return 'text';
    }
  }

  return 'other';
}

/**
 * Check if element is hidden (display: none, visibility: hidden, etc.)
 */
function isHidden(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);

  if (style.display === 'none') {
    return true;
  }

  if (style.visibility === 'hidden') {
    return true;
  }

  if (style.opacity === '0' && !element.getAttribute('aria-hidden')) {
    return true;
  }

  // Check aria-hidden attribute
  if (element.getAttribute('aria-hidden') === 'true') {
    return true;
  }

  return false;
}

/**
 * Filter elements by type
 */
export function filterByType(elements: ScannableElement[], type: ScannableElement['type']): ScannableElement[] {
  return elements.filter((e) => e.type === type);
}

/**
 * Get all text elements
 */
export function getTextElements(elements: ScannableElement[]): HTMLElement[] {
  return elements.filter((e) => ['text', 'heading'].includes(e.type)).map((e) => e.element);
}

/**
 * Get all interactive elements
 */
export function getInteractiveElements(elements: ScannableElement[]): HTMLElement[] {
  return elements.filter((e) => ['button', 'link', 'form'].includes(e.type)).map((e) => e.element);
}

/**
 * Get all form elements
 */
export function getFormElements(elements: ScannableElement[]): HTMLElement[] {
  return elements.filter((e) => e.type === 'form').map((e) => e.element);
}

/**
 * Get all images
 */
export function getImages(elements: ScannableElement[]): HTMLElement[] {
  return elements.filter((e) => e.type === 'image').map((e) => e.element);
}

/**
 * Get all landmarks
 */
export function getLandmarks(elements: ScannableElement[]): HTMLElement[] {
  return elements.filter((e) => e.type === 'landmark').map((e) => e.element);
}
