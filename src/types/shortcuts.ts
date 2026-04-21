export const SHORTCUT_SCHEMA_VERSION = 1 as const;

export const SHORTCUT_TOOL_IDS = [
  'textEdit',
  'screenshot',
  'cssScan',
  'fontAnalyzer',
  'palette',
  'ruler',
  'assets',
  'console',
  'tailwind',
  'jsInspector',
  'gridLayout',
  'resourceNetwork',
  'accessibilityChecker',
  'componentInspector',
] as const;

export type ShortcutToolId = (typeof SHORTCUT_TOOL_IDS)[number];

export type ShortcutToolMap = Record<ShortcutToolId, string | null>;

export type ShortcutActionMap = Record<string, string>;

export interface ShortcutStorageSchemaV1 {
  version: typeof SHORTCUT_SCHEMA_VERSION;
  tools: ShortcutToolMap;
  actions: ShortcutActionMap;
}

export type ShortcutStorageData = ShortcutStorageSchemaV1;
