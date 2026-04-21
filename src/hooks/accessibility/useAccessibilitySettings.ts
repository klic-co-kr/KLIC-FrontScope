// src/hooks/accessibility/useAccessibilitySettings.ts
// Hook for managing accessibility checker settings

import { useState, useEffect } from 'react';
import type { AccessibilitySettings } from '@/types/accessibility';
import { DEFAULT_A11Y_SETTINGS } from '@/types/accessibility';

const STORAGE_KEY = 'accessibility:settings';

/**
 * Hook to manage accessibility checker settings
 */
export function useAccessibilitySettings() {
  const [settings, setSettingsState] = useState<AccessibilitySettings>(DEFAULT_A11Y_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from chrome.storage on mount
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        setSettingsState(result[STORAGE_KEY] as AccessibilitySettings);
      }
      setIsLoading(false);
    });
  }, []);

  /**
   * Update settings and persist to chrome.storage
   */
  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettingsState(newSettings);

    chrome.storage.local.set({ [STORAGE_KEY]: newSettings });
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = () => {
    setSettingsState(DEFAULT_A11Y_SETTINGS);
    chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_A11Y_SETTINGS });
  };

  /**
   * Toggle a category on/off
   */
  const toggleCategory = (category: AccessibilitySettings['enabledCategories'][number]) => {
    const isEnabled = settings.enabledCategories.includes(category);
    const newCategories = isEnabled
      ? settings.enabledCategories.filter((c) => c !== category)
      : [...settings.enabledCategories, category];

    updateSettings({ enabledCategories: newCategories });
  };

  /**
   * Toggle a severity filter on/off
   */
  const toggleSeverity = (severity: AccessibilitySettings['severityFilter'][number]) => {
    const isEnabled = settings.severityFilter.includes(severity);
    const newFilter = isEnabled
      ? settings.severityFilter.filter((s) => s !== severity)
      : [...settings.severityFilter, severity];

    updateSettings({ severityFilter: newFilter });
  };

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    toggleCategory,
    toggleSeverity,
  };
}
