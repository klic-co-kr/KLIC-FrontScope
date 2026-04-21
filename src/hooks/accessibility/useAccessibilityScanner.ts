// src/hooks/accessibility/useAccessibilityScanner.ts
// Hook for triggering and monitoring accessibility scans

import { useState, useCallback, useRef } from 'react';
import type { AccessibilityIssue, AccessibilityReport, AccessibilitySettings } from '../../types/accessibility';
import { DEFAULT_A11Y_SETTINGS } from '../../types/accessibility';
import { sendMessageToActiveTab } from '../resourceNetwork/activeTabMessaging';

interface ScanState {
  isScanning: boolean;
  isComplete: boolean;
  report: AccessibilityReport | null;
  error: string | null;
  progress: number;
}

/**
 * Hook to manage accessibility scanning process
 */
export function useAccessibilityScanner() {
  const [state, setState] = useState<ScanState>({
    isScanning: false,
    isComplete: false,
    report: null,
    error: null,
    progress: 0,
  });

  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_A11Y_SETTINGS);
  const scanningRef = useRef(false);

  /**
   * Start accessibility scan on current page
   */
  const startScan = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setState({ isScanning: true, isComplete: false, report: null, error: null, progress: 0 });

    let listenerCleanedUp = false;

    const cleanup = (handler: (message: { action: string; data?: AccessibilityReport }) => void) => {
      if (listenerCleanedUp) return;
      listenerCleanedUp = true;
      scanningRef.current = false;
      chrome.runtime.onMessage.removeListener(handler);
    };

    try {
      // Listen for result from content script
      const handleMessage = (message: { action: string; data?: AccessibilityReport }) => {
        if (message.action === 'A11Y_SCAN_RESULT' && message.data) {
          cleanup(handleMessage);
          setState({
            isScanning: false,
            isComplete: true,
            report: message.data,
            error: null,
            progress: 100,
          });
        } else if (message.action === 'A11Y_SCAN_PROGRESS') {
          setState((prev) => ({ ...prev, progress: (prev.progress + 10) }));
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);

      // Send scan start message to content script
      const response = await sendMessageToActiveTab<{
        success?: boolean;
        data?: AccessibilityReport;
        error?: string;
      }>({
        action: 'A11Y_SCAN_START',
        data: settings,
      });

      // If sendMessage returned a result directly (sync response), use it
      if (response?.success && response?.data) {
        cleanup(handleMessage);
        setState({
          isScanning: false,
          isComplete: true,
          report: response.data,
          error: null,
          progress: 100,
        });
        return;
      }

      if (response?.success === false && response?.error) {
        cleanup(handleMessage);
        throw new Error(response.error);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (scanningRef.current) {
          cleanup(handleMessage);
          setState({
            isScanning: false,
            isComplete: false,
            report: null,
            error: 'Scan timeout - please try again',
            progress: 0,
          });
        }
      }, 30000);

    } catch (error) {
      scanningRef.current = false;
      setState({
        isScanning: false,
        isComplete: false,
        report: null,
        error: error instanceof Error ? error.message : 'Scan failed',
        progress: 0,
      });
    }
  }, [settings]);

  /**
   * Clear scan results
   */
  const clearScan = useCallback(() => {
    scanningRef.current = false;
    setState({
      isScanning: false,
      isComplete: false,
      report: null,
      error: null,
      progress: 0,
    });
  }, []);

  /**
   * Highlight an issue element on the page
   */
  const highlightElement = useCallback(async (selector: string | undefined, issue?: AccessibilityIssue) => {
    try {
      await sendMessageToActiveTab({
        action: 'A11Y_SCAN_ELEMENT',
        data: {
          selector,
          issue: issue ? {
            category: issue.category,
            severity: issue.severity,
            rule: issue.rule,
            message: issue.message,
            suggestion: issue.suggestion,
            wcagCriteria: issue.wcagCriteria,
            krdsCriteria: issue.krdsCriteria,
            element: issue.element,
          } : undefined,
        },
      });
    } catch {
      // Ignore errors
    }
  }, []);

  /**
   * Clear all highlights
   */
  const clearHighlights = useCallback(async () => {
    try {
      await sendMessageToActiveTab({
        action: 'A11Y_SCAN_CLEAR',
      });
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    ...state,
    settings,
    updateSettings: (newSettings: Partial<AccessibilitySettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    startScan,
    clearScan,
    highlightElement,
    clearHighlights,
  };
}
