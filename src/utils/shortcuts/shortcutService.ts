import { STORAGE_KEYS } from '../../constants/storage';
import type { ShortcutStorageData } from '../../types/shortcuts';
import { setStorage } from '../storage';
import {
  initializeShortcutStorage,
  normalizeShortcutStorageData,
} from './shortcutInit';
import { getDefaultShortcutStorageData } from './shortcutDefaults';
import { normalizeShortcutCombo } from './shortcutValidation';

export type ShortcutUpdateTarget =
  | {
      scope: 'tool';
      id: string;
      shortcut: string | null;
    }
  | {
      scope: 'action';
      id: string;
      shortcut: string;
    };

export type ShortcutServiceResult = {
  success: boolean;
  data: ShortcutStorageData;
  error?: string;
};

function isKnownToolId(data: ShortcutStorageData, toolId: string): boolean {
  return Object.prototype.hasOwnProperty.call(data.tools, toolId);
}

function normalizeToolShortcut(shortcut: string | null): string | null {
  if (shortcut === null) {
    return null;
  }

  const trimmedShortcut = shortcut.trim();
  if (trimmedShortcut.length === 0) {
    return null;
  }

  return normalizeShortcutCombo(trimmedShortcut);
}

function normalizeActionShortcut(shortcut: string): string {
  return shortcut.trim();
}

async function persistShortcutData(data: ShortcutStorageData): Promise<boolean> {
  const normalizedData = normalizeShortcutStorageData(data);
  return setStorage(STORAGE_KEYS.SHORTCUTS_DATA, normalizedData);
}

export async function getShortcuts(): Promise<ShortcutStorageData> {
  return initializeShortcutStorage();
}

export async function updateShortcut(target: ShortcutUpdateTarget): Promise<ShortcutServiceResult> {
  const currentData = await initializeShortcutStorage();

  if (target.scope === 'tool') {
    if (!isKnownToolId(currentData, target.id)) {
      return {
        success: false,
        error: `Unknown tool shortcut target: ${target.id}`,
        data: currentData,
      };
    }

    const nextData: ShortcutStorageData = {
      ...currentData,
      tools: {
        ...currentData.tools,
        [target.id]: normalizeToolShortcut(target.shortcut),
      },
    };

    const persisted = await persistShortcutData(nextData);
    if (!persisted) {
      return {
        success: false,
        error: 'Failed to persist updated tool shortcut',
        data: currentData,
      };
    }

    return {
      success: true,
      data: await initializeShortcutStorage(),
    };
  }

  const actionId = target.id.trim();
  if (actionId.length === 0) {
    return {
      success: false,
      error: 'Action shortcut target id is required',
      data: currentData,
    };
  }

  const normalizedShortcut = normalizeActionShortcut(target.shortcut);
  const nextActions = { ...currentData.actions };

  if (normalizedShortcut.length === 0) {
    delete nextActions[actionId];
  } else {
    nextActions[actionId] = normalizedShortcut;
  }

  const nextData: ShortcutStorageData = {
    ...currentData,
    actions: nextActions,
  };

  const persisted = await persistShortcutData(nextData);
  if (!persisted) {
    return {
      success: false,
      error: 'Failed to persist updated action shortcut',
      data: currentData,
    };
  }

  return {
    success: true,
    data: await initializeShortcutStorage(),
  };
}

export async function resetShortcuts(): Promise<ShortcutServiceResult> {
  const currentData = await initializeShortcutStorage();
  const defaults = normalizeShortcutStorageData(getDefaultShortcutStorageData());
  const persisted = await persistShortcutData(defaults);

  if (!persisted) {
    return {
      success: false,
      error: 'Failed to reset shortcuts to defaults',
      data: currentData,
    };
  }

  return {
    success: true,
    data: await initializeShortcutStorage(),
  };
}
