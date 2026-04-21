// src/hooks/accessibility/index.ts
// Barrel export for accessibility hooks

export * from './useAccessibilitySettings';
export * from './useAccessibilityScanner';
export * from './useAccessibilityReport';

export type { AccessibilitySettings, AccessibilityReport, AccessibilityIssue } from '@/types/accessibility';
