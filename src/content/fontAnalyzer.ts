/**
 * Font Analyzer Content Script
 *
 * 폰트 분석기 컨텐츠 스크립트
 */

import {
  extractFontInfo,
  extractWebFonts,
  getSystemFonts,
  detectAllFonts,
  checkFontOptimization,
  toggleMetricsGuide,
  createMetricsInfoPanel,
  compareFonts as compareFontsUtil,
  suggestFontPair,
} from '../utils/fontAnalyzer';
import { FONT_ANALYZER_MESSAGE_ACTIONS } from '../constants/fontAnalyzerMessages';
import { safeSendMessage } from './utils/safeMessage';
import { FONT_ANALYZER_CLASSES } from '../constants/fontAnalyzerClasses';
import type { FontInfo, FontAnalysisResult } from '../types/fontAnalyzer';

/**
 * Font Analyzer Content Script State
 */
interface FontAnalyzerState {
  isEnabled: boolean;
  hoveredElement: HTMLElement | null;
  metricsCleanup: (() => void) | null;
  inspectorPanel: HTMLElement | null;
  overlay: HTMLElement | null;
}

const state: FontAnalyzerState = {
  isEnabled: false,
  hoveredElement: null,
  metricsCleanup: null,
  inspectorPanel: null,
  overlay: null,
};

/**
 * Initialize Font Analyzer
 */
export function initFontAnalyzer(): void {
  chrome.runtime.onMessage.addListener(handleMessage);
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
}

/**
 * Handle chrome runtime messages
 */
function handleMessage(
  request: { action?: string; data?: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): boolean | undefined {
  switch (request.action) {
    case FONT_ANALYZER_MESSAGE_ACTIONS.START_ANALYSIS:
      startAnalysis(sendResponse);
      return true;

    case FONT_ANALYZER_MESSAGE_ACTIONS.CANCEL_ANALYSIS:
      cancelAnalysis();
      sendResponse({ success: true });
      break;

    case FONT_ANALYZER_MESSAGE_ACTIONS.GET_FONTS:
      getFonts(request.data as { elementId?: string } | undefined, sendResponse);
      return true;

    case FONT_ANALYZER_MESSAGE_ACTIONS.GET_WEB_FONTS:
      getWebFonts(sendResponse);
      return true;

    case FONT_ANALYZER_MESSAGE_ACTIONS.GET_SYSTEM_FONTS:
      getSystemFontsList(sendResponse);
      return true;

    case FONT_ANALYZER_MESSAGE_ACTIONS.COMPARE_FONTS:
      handleCompareFonts(request.data as { elementId1: string; elementId2: string }, sendResponse);
      return true;

    case FONT_ANALYZER_MESSAGE_ACTIONS.SUGGEST_PAIRS:
      suggestPairs(request.data as { heading?: string; body?: string }, sendResponse);
      return true;

    case FONT_ANALYZER_MESSAGE_ACTIONS.UPDATE_SETTINGS:
      updateSettings(request.data as { highlightOnHover?: boolean });
      sendResponse({ success: true });
      break;

    default:
      break;
  }
}

/**
 * Start font analysis
 */
function startAnalysis(sendResponse: (response: unknown) => void): void {
  try {
    const detectionResult = detectAllFonts();
    const optimization = checkFontOptimization();

    const result: FontAnalysisResult = {
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      fonts: detectionResult.usedFonts.map(f => ({
        ...f,
        percentage: (f.count / document.querySelectorAll('*').length) * 100,
        elements: f.count,
      })),
      webFonts: extractWebFonts(),
      systemFonts: getSystemFonts(),
      totalElements: document.querySelectorAll('*').length,
      uniqueFamilies: detectionResult.totalFonts,
      recommendations: [],
    };

    sendResponse({
      success: true,
      result,
      optimization: {
        score: optimization.score,
        issues: optimization.issues,
        recommendations: optimization.recommendations,
      },
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Cancel analysis
 */
function cancelAnalysis(): void {
  removeOverlay();
  removeInspectorPanel();

  // Remove all highlights
  document
    .querySelectorAll(`.${FONT_ANALYZER_CLASSES.HIGHLIGHTED}`)
    .forEach(el => {
      el.classList.remove(FONT_ANALYZER_CLASSES.HIGHLIGHTED);
    });
}

/**
 * Get fonts
 */
function getFonts(
  data: { elementId?: string } | undefined,
  sendResponse: (response: unknown) => void
): void {
  try {
    let fonts: FontInfo[];

    if (data?.elementId) {
      const element = document.getElementById(data.elementId);
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }

      const font = extractFontInfo(element as HTMLElement);
      fonts = font ? [font] : [];
    } else {
      const detectionResult = detectAllFonts();
      fonts = detectionResult.usedFonts as unknown as FontInfo[];
    }

    sendResponse({ success: true, fonts });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get web fonts
 */
function getWebFonts(sendResponse: (response: unknown) => void): void {
  try {
    const webFonts = extractWebFonts();
    sendResponse({ success: true, webFonts });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get system fonts list
 */
function getSystemFontsList(sendResponse: (response: unknown) => void): void {
  try {
    const systemFonts = getSystemFonts();
    sendResponse({ success: true, systemFonts });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Compare fonts
 */
function handleCompareFonts(
  data: { elementId1: string; elementId2: string },
  sendResponse: (response: unknown) => void
): void {
  try {
    const element1 = document.getElementById(data.elementId1) as HTMLElement;
    const element2 = document.getElementById(data.elementId2) as HTMLElement;

    if (!element1 || !element2) {
      sendResponse({ success: false, error: 'Element not found' });
      return;
    }

    const result = compareFontsUtil(element1, element2);

    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Suggest font pairs
 */
function suggestPairs(
  data: { heading?: string; body?: string },
  sendResponse: (response: unknown) => void
): void {
  try {
    const pairs = suggestFontPair(data.heading, data.body);

    sendResponse({ success: true, pairs });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Update settings
 */
function updateSettings(settings: { highlightOnHover?: boolean }): void {
  // Apply settings locally
  if (settings.highlightOnHover !== undefined) {
    state.isEnabled = settings.highlightOnHover;
  }
}

/**
 * Handle mouse over for font inspection
 */
function handleMouseOver(event: MouseEvent): void {
  if (!state.isEnabled) return;

  const target = event.target as HTMLElement;
  if (!target || target === document.body || target === document.documentElement) {
    return;
  }

  state.hoveredElement = target;
  target.classList.add(FONT_ANALYZER_CLASSES.HIGHLIGHTED);

  // Send font info to side panel
  const font = extractFontInfo(target);
  if (font) {
    safeSendMessage({
      action: FONT_ANALYZER_MESSAGE_ACTIONS.GET_FONTS,
      data: { font },
    });
  }
}

/**
 * Handle mouse out
 */
function handleMouseOut(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (target && target.classList.contains(FONT_ANALYZER_CLASSES.HIGHLIGHTED)) {
    target.classList.remove(FONT_ANALYZER_CLASSES.HIGHLIGHTED);
  }

  state.hoveredElement = null;
}

/**
 * Handle click for metrics display
 */
function handleClick(event: MouseEvent): void {
  if (!state.isEnabled) return;

  const target = event.target as HTMLElement;
  if (!target) return;

  // Toggle metrics guide on click
  if (state.metricsCleanup) {
    state.metricsCleanup();
    state.metricsCleanup = null;
    removeMetricsInfoPanel();
  } else {
    state.metricsCleanup = toggleMetricsGuide(target);

    // Show metrics info panel
    const infoPanel = createMetricsInfoPanel(target);
    document.body.appendChild(infoPanel);
    state.inspectorPanel = infoPanel;

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (state.inspectorPanel && state.inspectorPanel.parentNode) {
        state.inspectorPanel.remove();
        state.inspectorPanel = null;
      }
    }, 5000);
  }
}

/**
 * Remove overlay
 */
function removeOverlay(): void {
  if (state.overlay && state.overlay.parentNode) {
    state.overlay.remove();
    state.overlay = null;
  }
}

/**
 * Remove inspector panel
 */
function removeInspectorPanel(): void {
  if (state.inspectorPanel && state.inspectorPanel.parentNode) {
    state.inspectorPanel.remove();
    state.inspectorPanel = null;
  }
}

/**
 * Remove metrics info panel
 */
function removeMetricsInfoPanel(): void {
  const panels = document.querySelectorAll(`.${FONT_ANALYZER_CLASSES.METRICS_PANEL}`);
  panels.forEach(panel => panel.remove());
}

/**
 * Enable font analyzer
 */
export function enableFontAnalyzer(): void {
  state.isEnabled = true;
}

/**
 * Disable font analyzer
 */
export function disableFontAnalyzer(): void {
  state.isEnabled = false;
  cancelAnalysis();
}

/**
 * Get current hovered element
 */
export function getHoveredElement(): HTMLElement | null {
  return state.hoveredElement;
}

// Initialize on load
if (typeof window !== 'undefined') {
  initFontAnalyzer();
}
