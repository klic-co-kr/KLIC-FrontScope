// src/content/accessibility/layoutExtractor.ts
// Layout Extractor - Extract layout data for validation

/**
 * Extracted layout data
 */
export interface ExtractedLayoutData {
  viewportWidth: number;
  hasHorizontalScroll: boolean;
  formGroups: number;
  modalElements: HTMLElement[];
  accordions: HTMLElement[];
}

/**
 * Extract layout data from page
 */
export function extractLayout(): ExtractedLayoutData {
  const viewportWidth = window.innerWidth;
  const docWidth = document.documentElement.scrollWidth;
  const hasHorizontalScroll = docWidth > viewportWidth + 20;

  // Count form groups (fieldsets)
  const fieldsets = document.querySelectorAll('fieldset');
  const formGroups = fieldsets.length;

  // Find modals
  const modals = Array.from(document.querySelectorAll('[role="dialog"], dialog, .modal'))
    .filter((el): el is HTMLElement => el instanceof HTMLElement);

  // Find accordions
  const accordions = Array.from(document.querySelectorAll(
    '[aria-expanded], .accordion, [role="region"][aria-controls]'
  )).filter((el): el is HTMLElement => el instanceof HTMLElement);

  return {
    viewportWidth,
    hasHorizontalScroll,
    formGroups,
    modalElements: modals,
    accordions,
  };
}
