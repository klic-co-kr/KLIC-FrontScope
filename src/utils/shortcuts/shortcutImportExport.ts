import { ALL_TOOLS } from '../../sidepanel/constants/tools';
import {
  SHORTCUT_SCHEMA_VERSION,
  type ShortcutStorageData,
} from '../../types/shortcuts';
import { normalizeShortcutStorageData } from './shortcutInit';

export type ShortcutImportResult =
  | {
      ok: true;
      normalized: ShortcutStorageData;
    }
  | {
      ok: false;
      code: 'invalid_json' | 'invalid_schema' | 'unsupported_version';
      message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasOnlyAllowedKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function getKnownToolIds(): Set<string> {
  return new Set(ALL_TOOLS.map((tool) => tool.id));
}

function validateShortcutImportSchema(value: unknown): {
  valid: true;
  data: unknown;
} | {
  valid: false;
  code: 'invalid_schema' | 'unsupported_version';
  message: string;
} {
  if (!isRecord(value)) {
    return {
      valid: false,
      code: 'invalid_schema',
      message: 'Expected an object at the JSON root.',
    };
  }

  if (!hasOnlyAllowedKeys(value, ['version', 'tools', 'actions'])) {
    return {
      valid: false,
      code: 'invalid_schema',
      message: 'Unexpected top-level keys found.',
    };
  }

  if (value.version !== SHORTCUT_SCHEMA_VERSION) {
    return {
      valid: false,
      code: 'unsupported_version',
      message: `Unsupported shortcut schema version: ${String(value.version)}`,
    };
  }

  if (!isRecord(value.tools)) {
    return {
      valid: false,
      code: 'invalid_schema',
      message: 'Expected "tools" to be an object.',
    };
  }

  if (!isRecord(value.actions)) {
    return {
      valid: false,
      code: 'invalid_schema',
      message: 'Expected "actions" to be an object.',
    };
  }

  const knownToolIds = getKnownToolIds();

  for (const [toolId, rawShortcut] of Object.entries(value.tools)) {
    if (!knownToolIds.has(toolId)) {
      return {
        valid: false,
        code: 'invalid_schema',
        message: `Unknown tool id in import: ${toolId}`,
      };
    }

    if (typeof rawShortcut !== 'string' && rawShortcut !== null) {
      return {
        valid: false,
        code: 'invalid_schema',
        message: `Invalid shortcut value for tool: ${toolId}`,
      };
    }
  }

  for (const [actionId, rawShortcut] of Object.entries(value.actions)) {
    if (actionId.trim().length === 0) {
      return {
        valid: false,
        code: 'invalid_schema',
        message: 'Action id must be a non-empty string.',
      };
    }

    if (typeof rawShortcut !== 'string') {
      return {
        valid: false,
        code: 'invalid_schema',
        message: `Invalid shortcut value for action: ${actionId}`,
      };
    }
  }

  return { valid: true, data: value };
}

export function parseAndNormalizeShortcutImport(jsonText: string): ShortcutImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    return {
      ok: false,
      code: 'invalid_json',
      message: 'Failed to parse JSON.',
    };
  }

  const validated = validateShortcutImportSchema(parsed);
  if (!validated.valid) {
    return {
      ok: false,
      code: validated.code,
      message: validated.message,
    };
  }

  return {
    ok: true,
    normalized: normalizeShortcutStorageData(parsed),
  };
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function getShortcutExportFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const min = pad2(now.getMinutes());

  return `klic-shortcuts-v${SHORTCUT_SCHEMA_VERSION}-${yyyy}${mm}${dd}-${hh}${min}.json`;
}
