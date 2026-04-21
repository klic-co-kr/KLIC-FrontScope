# Phase 4: Hooks & State (Tasks 27-31)

> React hooks for report state, settings persistence, and scanning control

---

## Task 27: Create useAccessibilitySettings Hook

**Files:**
- Create: `src/hooks/accessibility/useAccessibilitySettings.ts`
- Test: `src/hooks/accessibility/__tests__/useAccessibilitySettings.test.ts`

```typescript
// src/hooks/accessibility/useAccessibilitySettings.ts
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_A11Y_SETTINGS } from '../../types/accessibility';
import type { AccessibilitySettings, ValidationCategory, IssueSeverity } from '../../types/accessibility';

const STORAGE_KEY = 'accessibilityChecker:settings';

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_A11Y_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY]).then((result) => {
      if (result[STORAGE_KEY]) {
        setSettings(result[STORAGE_KEY] as AccessibilitySettings);
      }
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      chrome.storage.local.set({ [STORAGE_KEY]: next });
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: ValidationCategory) => {
    setSettings((prev) => {
      const enabled = prev.enabledCategories.includes(category)
        ? prev.enabledCategories.filter(c => c !== category)
        : [...prev.enabledCategories, category];
      const next = { ...prev, enabledCategories: enabled };
      chrome.storage.local.set({ [STORAGE_KEY]: next });
      return next;
    });
  }, []);

  const toggleSeverity = useCallback((severity: IssueSeverity) => {
    setSettings((prev) => {
      const filter = prev.severityFilter.includes(severity)
        ? prev.severityFilter.filter(s => s !== severity)
        : [...prev.severityFilter, severity];
      const next = { ...prev, severityFilter: filter };
      chrome.storage.local.set({ [STORAGE_KEY]: next });
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_A11Y_SETTINGS);
    chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_A11Y_SETTINGS });
  }, []);

  return { settings, updateSettings, toggleCategory, toggleSeverity, resetSettings };
}
```

**Commit:** `feat(a11y): create useAccessibilitySettings hook with storage persistence`

---

## Task 28: Create useAccessibilityReport Hook

**Files:**
- Create: `src/hooks/accessibility/useAccessibilityReport.ts`

```typescript
// src/hooks/accessibility/useAccessibilityReport.ts
import { useState, useCallback, useEffect } from 'react';
import type { AccessibilityReport, ValidationCategory, IssueSeverity } from '../../types/accessibility';

const STORAGE_KEY = 'accessibilityChecker:lastReport';

export function useAccessibilityReport() {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Load last report from storage on mount
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY]).then((result) => {
      if (result[STORAGE_KEY]) {
        setReport(result[STORAGE_KEY] as AccessibilityReport);
      }
    });
  }, []);

  const startScan = useCallback(async (settings: unknown) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const currentWindow = await chrome.windows.getCurrent();
      const [tab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Single channel: sendResponse returns { success, report } directly
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'A11Y_SCAN_START',
        settings,
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Scan failed');
      }

      // Report comes in the same response (no separate runtime message needed)
      const scanReport = response.report as AccessibilityReport;
      setReport(scanReport);
      setIsScanning(false);
      chrome.storage.local.set({ [STORAGE_KEY]: scanReport });
    } catch (error) {
      setIsScanning(false);
      setScanError((error as Error).message);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReport(null);
    chrome.storage.local.remove(STORAGE_KEY);
  }, []);

  const getIssuesByCategory = useCallback((category: ValidationCategory) => {
    if (!report) return [];
    const catResult = report.categories.find(c => c.category === category);
    return catResult?.issues ?? [];
  }, [report]);

  const getIssuesBySeverity = useCallback((severity: IssueSeverity) => {
    if (!report) return [];
    return report.categories.flatMap(c => c.issues).filter(i => i.severity === severity);
  }, [report]);

  return {
    report,
    isScanning,
    scanError,
    startScan,
    clearReport,
    getIssuesByCategory,
    getIssuesBySeverity,
  };
}
```

**Commit:** `feat(a11y): create useAccessibilityReport hook with scan state management`

---

## Task 29: Create useAccessibilityScanner Hook

**Files:**
- Create: `src/hooks/accessibility/useAccessibilityScanner.ts`

Combines settings and report hooks for a unified scanning interface.

```typescript
// src/hooks/accessibility/useAccessibilityScanner.ts
import { useCallback } from 'react';
import { useAccessibilitySettings } from './useAccessibilitySettings';
import { useAccessibilityReport } from './useAccessibilityReport';

export function useAccessibilityScanner() {
  const { settings, updateSettings, toggleCategory, toggleSeverity, resetSettings } = useAccessibilitySettings();
  const { report, isScanning, scanError, startScan, clearReport, getIssuesByCategory, getIssuesBySeverity } = useAccessibilityReport();

  const scan = useCallback(() => {
    return startScan(settings);
  }, [startScan, settings]);

  return {
    // Settings
    settings,
    updateSettings,
    toggleCategory,
    toggleSeverity,
    resetSettings,
    // Report
    report,
    isScanning,
    scanError,
    scan,
    clearReport,
    getIssuesByCategory,
    getIssuesBySeverity,
  };
}
```

**Commit:** `feat(a11y): create useAccessibilityScanner composite hook`

---

## Task 30: Create Hook Barrel Export

**Files:**
- Create: `src/hooks/accessibility/index.ts`

```typescript
export { useAccessibilitySettings } from './useAccessibilitySettings';
export { useAccessibilityReport } from './useAccessibilityReport';
export { useAccessibilityScanner } from './useAccessibilityScanner';
```

**Commit:** `feat(a11y): add accessibility hooks barrel export`

---

## Task 31: Hook Unit Tests

**Files:**
- Create: `src/hooks/accessibility/__tests__/useAccessibilitySettings.test.ts`

Test settings persistence, category toggling, severity filtering, and reset functionality using `renderHook` and mocked `chrome.storage.local`.

**Commit:** `test(a11y): add unit tests for accessibility hooks`
