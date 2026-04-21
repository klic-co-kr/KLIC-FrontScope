/**
 * Tool Reset Utilities
 *
 * 각 도구의 chrome.storage.local 데이터를 초기화하는 유틸리티
 */

import { STORAGE_KEYS } from '../constants/storage';

/**
 * 도구별 storage key 그룹
 */
const TOOL_STORAGE_KEYS: Record<string, string[]> = {
  textEdit: [
    STORAGE_KEYS.TEXT_EDIT_HISTORY,
    STORAGE_KEYS.TEXT_EDIT_SETTINGS,
    STORAGE_KEYS.TEXT_EDIT_TEMP,
    STORAGE_KEYS.TEXT_EDIT_STATS,
  ],
  screenshot: [
    STORAGE_KEYS.SCREENSHOT_HISTORY,
    STORAGE_KEYS.SCREENSHOT_SETTINGS,
  ],
  colorPicker: [
    STORAGE_KEYS.COLOR_PICKER_HISTORY,
    STORAGE_KEYS.COLOR_PICKER_COLLECTIONS,
    STORAGE_KEYS.COLOR_PICKER_FAVORITES,
    STORAGE_KEYS.COLOR_PICKER_SETTINGS,
  ],
  cssScan: [STORAGE_KEYS.CSS_SCAN_HISTORY],
  ruler: [
    STORAGE_KEYS.RULER_HISTORY,
    STORAGE_KEYS.RULER_SETTINGS,
    STORAGE_KEYS.RULER_TEMP,
    STORAGE_KEYS.RULER_STATS,
  ],
  gridLayout: [
    STORAGE_KEYS.GRID_LAYOUT_SETTINGS,
    STORAGE_KEYS.GRID_LAYOUT_GUIDELINES,
    STORAGE_KEYS.GRID_LAYOUT_VIEWPORT,
    STORAGE_KEYS.GRID_LAYOUT_OVERLAY,
    STORAGE_KEYS.GRID_LAYOUT_WHITESPACE,
    STORAGE_KEYS.GRID_LAYOUT_SNAPSHOTS,
    STORAGE_KEYS.GRID_LAYOUT_CUSTOM_PRESETS,
  ],
  fontAnalyzer: [STORAGE_KEYS.FONT_ANALYSIS_CACHE],
  tailwind: [
    STORAGE_KEYS.TAILWIND_CACHE,
    STORAGE_KEYS.TAILWIND_SETTINGS,
    STORAGE_KEYS.TAILWIND_HISTORY,
  ],
  assets: [
    STORAGE_KEYS.ASSET_MANAGER_HISTORY,
    STORAGE_KEYS.ASSET_MANAGER_SETTINGS,
    STORAGE_KEYS.ASSET_MANAGER_STATS,
    STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS,
  ],
  console: [
    STORAGE_KEYS.CONSOLE_LOGS,
    STORAGE_KEYS.CONSOLE_SETTINGS,
    STORAGE_KEYS.CONSOLE_STATS,
  ],
  resourceNetwork: [
    STORAGE_KEYS.RESOURCE_NETWORK_SETTINGS,
    STORAGE_KEYS.RESOURCE_NETWORK_STATS,
    STORAGE_KEYS.RESOURCE_NETWORK_STORAGE_EXPORT,
    STORAGE_KEYS.RESOURCE_NETWORK_SCHEDULED_CLEAN,
  ],
  palette: [],
  accessibilityChecker: [],
};

/**
 * 도구의 storage key 목록 반환
 */
export function getToolStorageKeys(toolId: string): string[] {
  return TOOL_STORAGE_KEYS[toolId] ?? [];
}

/**
 * 단일 도구의 storage 데이터 초기화
 */
export async function resetTool(toolId: string): Promise<boolean> {
  const keys = getToolStorageKeys(toolId);
  if (keys.length === 0) return true;

  try {
    await chrome.storage.local.remove(keys);
    return true;
  } catch (error) {
    console.error(`Failed to reset tool ${toolId}:`, error);
    return false;
  }
}

/**
 * 모든 도구의 storage 데이터 초기화
 */
export async function resetAllTools(): Promise<boolean> {
  const allKeys = Object.values(TOOL_STORAGE_KEYS).flat();
  if (allKeys.length === 0) return true;

  try {
    await chrome.storage.local.remove(allKeys);
    return true;
  } catch (error) {
    console.error('Failed to reset all tools:', error);
    return false;
  }
}
