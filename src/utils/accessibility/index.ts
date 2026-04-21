// src/utils/accessibility/index.ts
// Barrel export for accessibility validators

export * from './htmlValidator';
export * from './colorValidator';
export * from './selectorUtils';
export * from './scoreCalculator';

// Re-export commonly used types
export type { AccessibilityIssue, ValidationCategory, CategoryResult, AccessibilityReport, AccessibilitySettings } from '@/types/accessibility';
export { SEVERITY_WEIGHTS, GRADE_THRESHOLDS, DEFAULT_A11Y_SETTINGS } from '@/types/accessibility';
