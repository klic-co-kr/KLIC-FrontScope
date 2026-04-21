import type { ToolType } from '../../sidepanel/constants/tools';

type ModifierToken = 'Ctrl' | 'Alt' | 'Shift' | 'Meta';

const MODIFIER_ORDER: ModifierToken[] = ['Ctrl', 'Alt', 'Shift', 'Meta'];

const MODIFIER_ALIAS_MAP: Record<string, ModifierToken> = {
  ctrl: 'Ctrl',
  control: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
  cmd: 'Meta',
  command: 'Meta',
};

const RAW_BROWSER_RESERVED_SHORTCUTS = [
  'Ctrl+L',
  'Meta+L',
  'Ctrl+K',
  'Meta+K',
  'Alt+Left',
  'Alt+Right',
  'Meta+BracketLeft',
  'Meta+BracketRight',

  'Ctrl+T',
  'Meta+T',
  'Ctrl+Shift+T',
  'Meta+Shift+T',
  'Ctrl+W',
  'Meta+W',
  'Ctrl+Shift+W',
  'Meta+Shift+W',
  'Ctrl+N',
  'Meta+N',
  'Ctrl+Shift+N',
  'Meta+Shift+N',

  'Ctrl+R',
  'Meta+R',
  'Ctrl+Shift+R',
  'Meta+Shift+R',
  'Ctrl+P',
  'Meta+P',
  'Ctrl+F',
  'Meta+F',
  'Ctrl+J',
  'Meta+J',

  'Ctrl+D',
  'Meta+D',
  'Ctrl+H',
  'Meta+H',
  'Ctrl+U',
  'Meta+U',

  'Ctrl+S',
  'Meta+S',
  'Ctrl+O',
  'Meta+O',

  'Ctrl+Shift+I',
  'Ctrl+Shift+J',
  'Ctrl+Shift+C',

  'Meta+Alt+I',
  'Meta+Alt+J',
  'Meta+Alt+C',

  'Ctrl+Shift+Delete',
  'Meta+Shift+Delete',

  'Alt+Tab',
  'Alt+F4',
  'Meta+Q',
  'Meta+M',
] as const;

const BROWSER_RESERVED_SHORTCUTS = new Set(RAW_BROWSER_RESERVED_SHORTCUTS.map((combo) => normalizeShortcutCombo(combo)));

function normalizeKeyToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length === 0) {
    return '';
  }

  const lower = trimmed.toLowerCase();
  const modifierAlias = MODIFIER_ALIAS_MAP[lower];
  if (modifierAlias) {
    return modifierAlias;
  }

  if (lower === 'space' || lower === 'spacebar') {
    return 'Space';
  }

  if (lower.startsWith('arrow') && lower.length > 5) {
    const arrowKey = lower.slice(5);
    return arrowKey.charAt(0).toUpperCase() + arrowKey.slice(1);
  }

  if (trimmed.length === 1) {
    return trimmed.toUpperCase();
  }

  if (/^f\d{1,2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function normalizeShortcutCombo(shortcut: string): string {
  const tokens = shortcut
    .split('+')
    .map(normalizeKeyToken)
    .filter(Boolean);

  if (tokens.length === 0) {
    return '';
  }

  const modifiers = new Set<ModifierToken>();
  const keyTokens: string[] = [];

  for (const token of tokens) {
    if (token === 'Ctrl' || token === 'Alt' || token === 'Shift' || token === 'Meta') {
      modifiers.add(token);
      continue;
    }

    keyTokens.push(token);
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));

  return [...orderedModifiers, ...keyTokens].join('+');
}

export function isBrowserReservedShortcut(shortcut: string): boolean {
  const normalized = normalizeShortcutCombo(shortcut);

  if (normalized.length === 0) {
    return false;
  }

  if (BROWSER_RESERVED_SHORTCUTS.has(normalized)) {
    return true;
  }

  return (
    /^(Ctrl|Meta)\+[1-9]$/.test(normalized) ||
    /^(Ctrl|Meta)\+Shift\+[1-9]$/.test(normalized) ||
    /^(Ctrl|Meta)\+(Shift\+)?Tab$/.test(normalized) ||
    /^(Ctrl|Meta)\+(Shift\+)?(Plus|Equal|Minus|0)$/.test(normalized)
  );
}

type ShortcutValidationErrorCode = 'duplicate' | 'browser_reserved';

export type ToolShortcutValidationResult =
  | {
      valid: true;
      normalizedShortcut: string;
    }
  | {
      valid: false;
      code: ShortcutValidationErrorCode;
      normalizedShortcut: string;
      conflictingToolId?: ToolType;
    };

export function validateToolShortcutAssignment(input: {
  toolId: ToolType;
  shortcut: string;
  toolShortcuts: Partial<Record<ToolType, string | null | undefined>> | null | undefined;
}): ToolShortcutValidationResult {
  const normalizedShortcut = normalizeShortcutCombo(input.shortcut);

  if (isBrowserReservedShortcut(normalizedShortcut)) {
    return {
      valid: false,
      code: 'browser_reserved',
      normalizedShortcut,
    };
  }

  const toolShortcuts = input.toolShortcuts ?? {};

  for (const [targetToolId, targetShortcut] of Object.entries(toolShortcuts) as Array<[ToolType, unknown]>) {
    if (targetToolId === input.toolId) {
      continue;
    }

    if (typeof targetShortcut !== 'string' || targetShortcut.trim().length === 0) {
      continue;
    }

    if (normalizeShortcutCombo(targetShortcut) === normalizedShortcut) {
      return {
        valid: false,
        code: 'duplicate',
        normalizedShortcut,
        conflictingToolId: targetToolId,
      };
    }
  }

  return {
    valid: true,
    normalizedShortcut,
  };
}
