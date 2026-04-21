/**
 * Font Analyzer Side Panel Communication
 *
 * 사이드 패널과의 통신 유틸리티
 */

import { FONT_ANALYZER_MESSAGE_ACTIONS } from '../constants/fontAnalyzerMessages';

/**
 * Send message to content script
 */
export async function sendToFontAnalyzerContent(
  tabId: number,
  action: string,
  data?: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        source: 'sidepanel',
        action,
        data,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

/**
 * Start font analysis
 */
export async function startFontAnalysis(tabId: number): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.START_ANALYSIS
  );
}

/**
 * Cancel font analysis
 */
export async function cancelFontAnalysis(tabId: number): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.CANCEL_ANALYSIS
  );
}

/**
 * Get fonts from page
 */
export async function getPageFonts(
  tabId: number,
  elementId?: string
): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.GET_FONTS,
    { elementId }
  );
}

/**
 * Get web fonts
 */
export async function getWebFonts(tabId: number): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.GET_WEB_FONTS
  );
}

/**
 * Get system fonts
 */
export async function getSystemFontsFromPage(tabId: number): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.GET_SYSTEM_FONTS
  );
}

/**
 * Compare fonts
 */
export async function comparePageFonts(
  tabId: number,
  elementId1: string,
  elementId2: string
): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.COMPARE_FONTS,
    { elementId1, elementId2 }
  );
}

/**
 * Suggest font pairs
 */
export async function suggestFontPairs(
  tabId: number,
  heading?: string,
  body?: string
): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.SUGGEST_PAIRS,
    { heading, body }
  );
}

/**
 * Update font analyzer settings
 */
export async function updateFontAnalyzerSettings(
  tabId: number,
  settings: Record<string, unknown>
): Promise<unknown> {
  return sendToFontAnalyzerContent(
    tabId,
    FONT_ANALYZER_MESSAGE_ACTIONS.UPDATE_SETTINGS,
    settings
  );
}

/**
 * Enable font analyzer hover mode
 */
export async function enableFontAnalyzer(tabId: number): Promise<void> {
  // Inject a script to enable the analyzer
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const wnd = window as unknown as { enableFontAnalyzer?: () => void };
      wnd.enableFontAnalyzer?.();
    },
  });
}

/**
 * Disable font analyzer hover mode
 */
export async function disableFontAnalyzer(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const wnd = window as unknown as { disableFontAnalyzer?: () => void };
      wnd.disableFontAnalyzer?.();
    },
  });
}
