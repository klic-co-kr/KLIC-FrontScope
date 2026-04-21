// src/content/accessibility/index.ts
// Content script accessibility scanner entry point

import type { AccessibilitySettings, AccessibilityReport, CategoryResult } from '@/types/accessibility';
import { DEFAULT_A11Y_SETTINGS } from '@/types/accessibility';

/**
 * Handle accessibility scan start from side panel
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'A11Y_SCAN_START') {
    handleScanStart(message.data as Partial<AccessibilitySettings>)
      .then((report) => {
        chrome.runtime.sendMessage({
          action: 'A11Y_SCAN_RESULT',
          data: report,
        });
        sendResponse({ success: true, data: report });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open
  }

  if (message.action === 'A11Y_SCAN_ELEMENT') {
    handleElementHighlight(message.data?.selector);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'A11Y_SCAN_CLEAR') {
    clearHighlights();
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Run accessibility scan on current page
 */
async function handleScanStart(
  settings: Partial<AccessibilitySettings> = {}
): Promise<AccessibilityReport> {
  const { runAccessibilityScan } = await import('./scanOrchestrator');

  // Merge with default settings
  const scanSettings: AccessibilitySettings = {
    ...DEFAULT_A11Y_SETTINGS,
    ...settings,
  };

  // Skip if not on a valid page
  if (['chrome:', 'edge:', 'about:'].some((prefix) => window.location.href.startsWith(prefix))) {
    return createEmptyReport(window.location.href, 0);
  }

  try {
    const report = await runAccessibilityScan(document, scanSettings);
    return report;
  } catch (error) {
    console.error('Accessibility scan failed:', error);
    throw error;
  }
}

/**
 * Highlight a specific element on the page
 */
function handleElementHighlight(selector: string | undefined): void {
  clearHighlights();

  if (!selector) return;

  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.outline = '3px solid #FF5722';
        el.style.outlineOffset = '2px';
        el.style.backgroundColor = 'rgba(255, 87, 34, 0.1)';
      }
    });
  } catch {
    // Invalid selector - ignore
  }
}

/**
 * Clear all highlights
 */
function clearHighlights(): void {
  const highlighted = document.querySelectorAll('[data-a11y-highlighted]');
  highlighted.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.backgroundColor = '';
      el.removeAttribute('data-a11y-highlighted');
    }
  });
}

/**
 * Create empty report for invalid pages
 */
function createEmptyReport(url: string, scanDuration: number): AccessibilityReport {
  return {
    url,
    timestamp: Date.now(),
    totalScore: 0,
    grade: 'F',
    krdsCompliant: false,
    issues: [],
    categories: [] as CategoryResult[],
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      totalIssues: 0,
      totalPassed: 0,
      totalChecks: 0,
    },
    scanDuration,
  };
}

export {};
