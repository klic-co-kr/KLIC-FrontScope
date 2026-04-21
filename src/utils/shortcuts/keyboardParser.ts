export type ToolShortcutParserErrorCode = 'modifier_required' | 'invalid_key';

export type ToolShortcutKeydownParseResult =
  | { type: 'cancel' }
  | { type: 'ignore' }
  | { type: 'error'; code: ToolShortcutParserErrorCode }
  | { type: 'combo'; value: string };

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

const SYMBOL_KEY_MAP: Record<string, string> = {
  '+': 'Plus',
  '-': 'Minus',
  '=': 'Equal',
  '/': 'Slash',
  '\\': 'Backslash',
  '.': 'Period',
  ',': 'Comma',
  ';': 'Semicolon',
  "'": 'Quote',
  '`': 'Backtick',
  '[': 'BracketLeft',
  ']': 'BracketRight',
};

function normalizeMainKey(key: string): string | null {
  if (key === ' ' || key === 'Spacebar' || key === 'Space') {
    return 'Space';
  }

  if (key === 'Dead' || key === 'Unidentified') {
    return null;
  }

  if (key.startsWith('Arrow')) {
    return key.slice('Arrow'.length);
  }

  if (key in SYMBOL_KEY_MAP) {
    return SYMBOL_KEY_MAP[key];
  }

  if (key.length === 1) {
    const upper = key.toUpperCase();
    return upper;
  }

  return key;
}

function isPureModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}

export function parseToolShortcutKeydown(event: KeyboardEvent): ToolShortcutKeydownParseResult {
  if (event.key === 'Escape') {
    return { type: 'cancel' };
  }

  if (isPureModifierKey(event.key)) {
    return { type: 'ignore' };
  }

  const hasModifier = Boolean(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey);
  if (!hasModifier) {
    return { type: 'error', code: 'modifier_required' };
  }

  const mainKey = normalizeMainKey(event.key);
  if (!mainKey) {
    return { type: 'error', code: 'invalid_key' };
  }

  const parts: string[] = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  parts.push(mainKey);

  return { type: 'combo', value: parts.join('+') };
}
