// src/content/accessibility/scanOrchestrator.ts
// Scan Orchestrator - Orchestrate accessibility scanning process

import type { AccessibilitySettings, AccessibilityReport } from '@/types/accessibility';
import { calculateReport } from '@/utils/accessibility';

import { scanDOM } from './domScanner';
import { extractHtmlData, extractColorData, extractTypographyData, extractComponentData, extractTokenData } from './elementExtractor';
import { validateColors } from '@/utils/accessibility';
import { validateTypography } from '@/utils/accessibility/typographyValidator';
import { validateComponents } from '@/utils/accessibility/componentValidator';
import { validateResponsive } from '@/utils/accessibility/responsiveValidator';
import { validateTokens } from '@/utils/accessibility/tokenValidator';

/**
 * Run accessibility scan on current page
 * Main orchestrator for the scanning process
 */
export async function runAccessibilityScan(
  root: Document | HTMLElement,
  settings: AccessibilitySettings
): Promise<AccessibilityReport> {
  const startTime = performance.now();
  const url = window.location.href;

  // Step 1: Scan DOM
  const scannableElements = scanDOM(
    root,
    settings.maxElementsToScan,
    settings.includeHidden
  );

  // Step 2: Extract data by category
  const colorData = extractColorData(scannableElements);
  const typographyData = extractTypographyData(scannableElements);
  const componentData = extractComponentData(scannableElements);
  const tokenData = extractTokenData(scannableElements);

  // Step 3: Run validators for enabled categories
  const categories: ReturnType<typeof calculateReport>['categories'] = [];

  // HTML validation (always enabled)
  categories.push(extractHtmlData(scannableElements, settings));

  // Color validation
  if (settings.enabledCategories.includes('color')) {
    const issues = validateColors(colorData.elements || []);
    const passed = colorData.total - issues.length;
    categories.push({
      category: 'color',
      label: '색상 대비',
      passed,
      total: colorData.total,
      score: colorData.score,
      issues,
    });
  }

  // Typography validation
  if (settings.enabledCategories.includes('typography')) {
    const issues = validateTypography(typographyData.elements || []);
    const passed = typographyData.total - issues.length;
    categories.push({
      category: 'typography',
      label: '타이포그래피',
      passed,
      total: typographyData.total,
      score: typographyData.score,
      issues,
    });
  }

  // Component validation
  if (settings.enabledCategories.includes('component')) {
    const issues = validateComponents(componentData.elements || []);
    const passed = componentData.total - issues.length;
    categories.push({
      category: 'component',
      label: '컴포넌트',
      passed,
      total: componentData.total,
      score: componentData.score,
      issues,
    });
  }

  // Responsive validation
  if (settings.enabledCategories.includes('responsive')) {
    const elements = scannableElements.map((e) => e.element);
    const issues = validateResponsive(elements);
    const totalChecks = 8;
    const passed = totalChecks - issues.length;
    categories.push({
      category: 'responsive',
      label: '반응형',
      passed,
      total: totalChecks,
      score: Math.round((passed / totalChecks) * 100),
      issues,
    });
  }

  // Token validation
  if (settings.enabledCategories.includes('token')) {
    const issues = validateTokens(tokenData.elements || []);
    const passed = tokenData.total - issues.length;
    categories.push({
      category: 'token',
      label: '디자인 토큰',
      passed,
      total: tokenData.total,
      score: tokenData.score,
      issues,
    });
  }

  // Step 4: Calculate report
  const scanDuration = Math.round(performance.now() - startTime);
  const report = calculateReport(url, categories, scanDuration);

  return report;
}
