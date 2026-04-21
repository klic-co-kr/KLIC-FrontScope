// src/content/accessibility/colorExtractor.ts
// Color Extractor - Extract color data from elements

import type { ScannableElement } from './domScanner';

/**
 * Extracted color data
 */
export interface ExtractedColorData {
  elements: HTMLElement[];
}

/**
 * Extract color data from scannable elements
 */
export function extractColors(elements: ScannableElement[]): ExtractedColorData {
  // Get all elements that have text content
  const textElements = elements.filter((e) =>
    ['text', 'heading'].includes(e.type)
  ).map((e) => e.element);

  return {
    elements: textElements,
  };
}
