// src/content/accessibility/elementExtractor.ts
// Element Extractor - Extract element data for validation

import type { AccessibilitySettings, CategoryResult, AccessibilityIssue } from '@/types/accessibility';
import { ScannableElement, getTextElements, getFormElements, filterByType } from './domScanner';
import { validateHtml } from '@/utils/accessibility';
import type { ValidationCategory } from '@/types/accessibility';

/**
 * Extract HTML validation data
 */
export function extractHtmlData(
  elements: ScannableElement[],
  settings: AccessibilitySettings
): CategoryResult {
  // Run HTML validator
  const result = validateHtml(document);

  // Filter issues by enabled categories
  const enabledIssues = settings.enabledCategories.includes('html')
    ? result.issues
    : [];

  // Calculate passed/total
  const totalChecks = 15; // 15 WCAG checks
  const passed = totalChecks - enabledIssues.length;

  return {
    category: 'html' as ValidationCategory,
    label: 'HTML 접근성',
    passed,
    total: totalChecks,
    score: Math.round((passed / totalChecks) * 100),
    issues: enabledIssues,
  };
}

/**
 * Extract color data for validation
 */
export function extractColorData(
  elements: ScannableElement[]
): CategoryResult {
  const textElements = getTextElements(elements);

  // Run color validator (imported dynamically)
  // This will be implemented in scanOrchestrator
  const issues: AccessibilityIssue[] = [];

  const passed = textElements.length - issues.length;
  const total = textElements.length;

  return {
    category: 'color' as ValidationCategory,
    label: '색상 대비',
    passed,
    total,
    score: total === 0 ? 100 : Math.round((passed / total) * 100),
    issues,
    elements: textElements,
  };
}

/**
 * Extract typography data for validation
 */
export function extractTypographyData(
  elements: ScannableElement[]
): CategoryResult {
  const textAndHeadingElements = elements.filter((e) =>
    ['text', 'heading'].includes(e.type)
  ).map((e) => e.element);

  // Run typography validator
  // This will be implemented in scanOrchestrator
  const issues: AccessibilityIssue[] = [];

  const passed = textAndHeadingElements.length - issues.length;
  const total = textAndHeadingElements.length;

  return {
    category: 'typography' as ValidationCategory,
    label: '타이포그래피',
    passed,
    total,
    score: total === 0 ? 100 : Math.round((passed / total) * 100),
    issues,
    elements: textAndHeadingElements,
  };
}

/**
 * Extract component data for validation
 */
export function extractComponentData(
  elements: ScannableElement[]
): CategoryResult {
  const formElements = getFormElements(elements);
  const buttons = filterByType(elements, 'button').map((e) => e.element);
  const allComponents = [...formElements, ...buttons];

  // Run component validator
  const issues: AccessibilityIssue[] = [];

  const passed = allComponents.length - issues.length;
  const total = allComponents.length;

  return {
    category: 'component' as ValidationCategory,
    label: '컴포넌트',
    passed,
    total,
    score: total === 0 ? 100 : Math.round((passed / total) * 100),
    issues,
    elements: allComponents,
  };
}

/**
 * Extract responsive design data for validation
 */
export function extractResponsiveData(
  elements: ScannableElement[]
): CategoryResult {
  // Responsive validation is mostly viewport-based, not element-specific
  const issues: AccessibilityIssue[] = [];

  // Run responsive validator
  // This will be implemented in scanOrchestrator
  const totalChecks = 8;
  const passed = totalChecks - issues.length;
  const allElements = elements.map((e) => e.element);

  return {
    category: 'responsive' as ValidationCategory,
    label: '반응형',
    passed,
    total: totalChecks,
    score: Math.round((passed / totalChecks) * 100),
    issues,
    elements: allElements,
  };
}

/**
 * Extract token data for validation
 */
export function extractTokenData(
  elements: ScannableElement[]
): CategoryResult {
  const allElements = elements.map((e) => e.element);

  // Run token validator
  const issues: AccessibilityIssue[] = [];

  const passed = allElements.length - issues.length;
  const total = allElements.length;

  return {
    category: 'token' as ValidationCategory,
    label: '디자인 토큰',
    passed,
    total,
    score: total === 0 ? 100 : Math.round((passed / total) * 100),
    issues,
    elements: allElements,
  };
}
