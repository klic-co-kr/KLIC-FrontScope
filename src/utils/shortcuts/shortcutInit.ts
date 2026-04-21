import { STORAGE_KEYS } from '../../constants/storage';
import { getStorage, setStorage } from '../storage';
import {
  SHORTCUT_SCHEMA_VERSION,
  type ShortcutActionMap,
  type ShortcutStorageData,
  type ShortcutToolMap,
} from '../../types/shortcuts';
import {
  getDefaultShortcutActionMap,
  getDefaultShortcutStorageData,
  getDefaultShortcutToolMap,
} from './shortcutDefaults';
import { normalizeShortcutCombo } from './shortcutValidation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeToolShortcuts(value: unknown): ShortcutToolMap {
  const defaults = getDefaultShortcutToolMap();

  if (!isRecord(value)) {
    return defaults;
  }

  const normalized: ShortcutToolMap = { ...defaults };
  const toolIds = Object.keys(defaults) as Array<keyof ShortcutToolMap>;

  for (const toolId of toolIds) {
    const rawShortcut = value[toolId];

    if (typeof rawShortcut === 'string') {
      const trimmedShortcut = rawShortcut.trim();
      normalized[toolId] = trimmedShortcut.length > 0
        ? normalizeShortcutCombo(trimmedShortcut)
        : null;
      continue;
    }

    if (rawShortcut === null) {
      normalized[toolId] = null;
    }
  }

  return normalized;
}

function normalizeActionShortcuts(value: unknown): ShortcutActionMap {
  const defaults = getDefaultShortcutActionMap();

  if (!isRecord(value)) {
    return defaults;
  }

  const normalized: ShortcutActionMap = { ...defaults };

  for (const [actionId, rawShortcut] of Object.entries(value)) {
    if (typeof rawShortcut !== 'string') {
      continue;
    }

    const trimmedShortcut = rawShortcut.trim();
    if (trimmedShortcut.length === 0) {
      continue;
    }

    normalized[actionId] = trimmedShortcut;
  }

  return normalized;
}

export function normalizeShortcutStorageData(value: unknown): ShortcutStorageData {
  const defaults = getDefaultShortcutStorageData();

  if (!isRecord(value)) {
    return defaults;
  }

  const normalizedTools = normalizeToolShortcuts(value.tools);
  const normalizedActions = normalizeActionShortcuts(value.actions);
  const normalizedVersion = value.version === SHORTCUT_SCHEMA_VERSION
    ? SHORTCUT_SCHEMA_VERSION
    : defaults.version;

  return {
    version: normalizedVersion,
    tools: normalizedTools,
    actions: normalizedActions,
  };
}

export async function initializeShortcutStorage(): Promise<ShortcutStorageData> {
  const rawStoredData = await getStorage<unknown>(STORAGE_KEYS.SHORTCUTS_DATA);
  const normalizedData = normalizeShortcutStorageData(rawStoredData);

  const shouldPersist =
    rawStoredData === null ||
    JSON.stringify(rawStoredData) !== JSON.stringify(normalizedData);

  if (shouldPersist) {
    await setStorage(STORAGE_KEYS.SHORTCUTS_DATA, normalizedData);
  }

  return normalizedData;
}
