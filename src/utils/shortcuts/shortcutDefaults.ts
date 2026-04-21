import {
  SHORTCUT_TOOL_IDS,
  SHORTCUT_SCHEMA_VERSION,
  type ShortcutActionMap,
  type ShortcutStorageData,
  type ShortcutToolMap,
} from '../../types/shortcuts';

export function getDefaultShortcutToolMap(): ShortcutToolMap {
  return SHORTCUT_TOOL_IDS.reduce<ShortcutToolMap>((acc, toolId) => {
    acc[toolId] = null;
    return acc;
  }, {} as ShortcutToolMap);
}

export function getDefaultShortcutActionMap(): ShortcutActionMap {
  return {};
}

export function getDefaultShortcutStorageData(): ShortcutStorageData {
  return {
    version: SHORTCUT_SCHEMA_VERSION,
    tools: getDefaultShortcutToolMap(),
    actions: getDefaultShortcutActionMap(),
  };
}
