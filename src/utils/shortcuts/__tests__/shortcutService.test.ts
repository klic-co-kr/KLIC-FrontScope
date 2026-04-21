import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../../constants/storage';
import { getDefaultShortcutStorageData } from '../shortcutDefaults';
import {
  getShortcuts,
  resetShortcuts,
  updateShortcut,
} from '../shortcutService';

type StorageValue = Record<string, unknown>;

const storageState = new Map<string, unknown>();
let shouldFailSet = false;

const chromeMock = {
  storage: {
    local: {
      get: async (keys?: string | string[] | Record<string, unknown> | null): Promise<StorageValue> => {
        if (keys === null || typeof keys === 'undefined') {
          return Object.fromEntries(storageState.entries());
        }

        if (typeof keys === 'string') {
          return storageState.has(keys)
            ? { [keys]: storageState.get(keys) }
            : {};
        }

        if (Array.isArray(keys)) {
          const result: StorageValue = {};
          for (const key of keys) {
            if (storageState.has(key)) {
              result[key] = storageState.get(key);
            }
          }
          return result;
        }

        const result: StorageValue = {};
        for (const [key, fallbackValue] of Object.entries(keys)) {
          result[key] = storageState.has(key) ? storageState.get(key) : fallbackValue;
        }
        return result;
      },
      set: async (items: Record<string, unknown>): Promise<void> => {
        if (shouldFailSet) {
          throw new Error('set failed');
        }

        for (const [key, value] of Object.entries(items)) {
          storageState.set(key, value);
        }
      },
      remove: async (keys: string | string[]): Promise<void> => {
        const targetKeys = Array.isArray(keys) ? keys : [keys];
        for (const key of targetKeys) {
          storageState.delete(key);
        }
      },
      clear: async (): Promise<void> => {
        storageState.clear();
      },
    },
  },
};

Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  configurable: true,
  writable: true,
});

describe('shortcutService', () => {
  beforeEach(() => {
    storageState.clear();
    shouldFailSet = false;
  });

  it('initializes and returns default shortcuts', async () => {
    const data = await getShortcuts();

    expect(data.version).toBe(1);
    expect(data.tools.textEdit).toBe('Ctrl+Shift+E');
    expect(data.tools.accessibilityChecker).toBe('Ctrl+Shift+A');
    expect(data.tools.fontAnalyzer).toBeNull();
    expect(data.actions).toEqual({});
    expect(storageState.get(STORAGE_KEYS.SHORTCUTS_DATA)).toEqual(data);
  });

  it('updates tool shortcut and trims input', async () => {
    const result = await updateShortcut({
      scope: 'tool',
      id: 'textEdit',
      shortcut: '  Ctrl+Shift+T  ',
    });

    expect(result.success).toBe(true);
    expect(result.data.tools.textEdit).toBe('Ctrl+Shift+T');
  });

  it('normalizes empty tool shortcut to null', async () => {
    const result = await updateShortcut({
      scope: 'tool',
      id: 'ruler',
      shortcut: '   ',
    });

    expect(result.success).toBe(true);
    expect(result.data.tools.ruler).toBeNull();
  });

  it('rejects unknown tool shortcut target', async () => {
    const result = await updateShortcut({
      scope: 'tool',
      id: 'unknown-tool',
      shortcut: 'Ctrl+Shift+X',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool shortcut target');
  });

  it('updates and removes action shortcut entries', async () => {
    const addResult = await updateShortcut({
      scope: 'action',
      id: 'openSettings',
      shortcut: ' Ctrl+, ',
    });

    expect(addResult.success).toBe(true);
    expect(addResult.data.actions.openSettings).toBe('Ctrl+,');

    const removeResult = await updateShortcut({
      scope: 'action',
      id: 'openSettings',
      shortcut: '  ',
    });

    expect(removeResult.success).toBe(true);
    expect(removeResult.data.actions.openSettings).toBeUndefined();
  });

  it('resets shortcuts to defaults', async () => {
    await updateShortcut({
      scope: 'tool',
      id: 'textEdit',
      shortcut: 'Ctrl+Shift+K',
    });
    await updateShortcut({
      scope: 'action',
      id: 'openSettings',
      shortcut: 'Ctrl+,',
    });

    const result = await resetShortcuts();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(getDefaultShortcutStorageData());
  });

  it('returns failure when persisting update fails', async () => {
    await getShortcuts();
    shouldFailSet = true;

    const result = await updateShortcut({
      scope: 'tool',
      id: 'textEdit',
      shortcut: 'Ctrl+Shift+K',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to persist updated tool shortcut');
    expect(result.data.tools.textEdit).toBe('Ctrl+Shift+E');
  });
});
