// src/content/accessibility/typographyExtractor.ts
// Typography Extractor - Extract typography data from elements

import type { ScannableElement } from './domScanner';

/**
 * Extracted typography data
 */
export interface ExtractedTypographyData {
  elements: HTMLElement[];
}

/**
 * Extract typography data from scannable elements
 */
export function extractTypography(elements: ScannableElement[]): ExtractedTypographyData {
  // Get all text and heading elements
  const typographyElements = elements.filter((e) =>
    ['text', 'heading'].includes(e.type)
  ).map((e) => e.element);

  return {
    elements: typographyElements,
  };
}
