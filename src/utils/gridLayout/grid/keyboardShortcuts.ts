/**
 * Keyboard Shortcuts Utilities
 *
 * 키보드 단축키 관련 유틸리티 함수들
 */

/**
 * 키 조합 인터페이스
 */
export interface KeyCombo {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/**
 * 단축키 설정 인터페이스
 */
export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description?: string;
}

/**
 * 키 조합 파싱
 */
export function parseKeyCombo(shortcut: string): KeyCombo {
  const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
  const combo: KeyCombo = {
    key: '',
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  };

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        combo.ctrl = true;
        break;
      case 'shift':
        combo.shift = true;
        break;
      case 'alt':
        combo.alt = true;
        break;
      case 'meta':
      case 'cmd':
      case 'win':
      case 'command':
        combo.meta = true;
        break;
      default:
        combo.key = part;
    }
  }

  return combo;
}

/**
 * 키보드 이벤트가 단축키와 매칭되는지 확인
 */
export function matchKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const eventKey = event.key.toLowerCase();

  return (
    eventKey === combo.key &&
    event.ctrlKey === combo.ctrl &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt &&
    event.metaKey === combo.meta
  );
}

/**
 * 단축키 문자열 생성 (표시용)
 */
export function formatShortcut(shortcut: string): string {
  const combo = parseKeyCombo(shortcut);
  const parts: string[] = [];

  if (combo.ctrl) parts.push('Ctrl');
  if (combo.shift) parts.push('Shift');
  if (combo.alt) parts.push('Alt');
  if (combo.meta) parts.push('Cmd');

  // 키 이름 포맷팅
  const displayName = formatKeyName(combo.key);
  parts.push(displayName);

  return parts.join(' + ');
}

/**
 * 키 이름 포맷팅
 */
export function formatKeyName(key: string): string {
  const keyNames: Record<string, string> = {
    ' ': 'Space',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'escape': 'Esc',
    'enter': 'Enter',
    'tab': 'Tab',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'insert': 'Ins',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PgUp',
    'pagedown': 'PgDn',
  };

  const lowerKey = key.toLowerCase();
  return keyNames[lowerKey] || key.toUpperCase();
}

/**
 * 키보드 이벤트에서 단축키 문자열 생성
 */
export function eventToShortcut(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push('Ctrl');
  if (event.shiftKey) parts.push('Shift');
  if (event.altKey) parts.push('Alt');
  if (event.metaKey) parts.push('Cmd');

  parts.push(event.key.toLowerCase());

  return parts.join('+');
}

/**
 * 단축키가 유효한지 확인
 */
export function isValidShortcut(shortcut: string): boolean {
  try {
    const combo = parseKeyCombo(shortcut);
    return combo.key.length > 0;
  } catch {
    return false;
  }
}

/**
 * 단축키 충돌 확인
 */
export function hasShortcutConflict(
  shortcut1: string,
  shortcut2: string
): boolean {
  const combo1 = parseKeyCombo(shortcut1);
  const combo2 = parseKeyCombo(shortcut2);

  return (
    combo1.key === combo2.key &&
    combo1.ctrl === combo2.ctrl &&
    combo1.shift === combo2.shift &&
    combo1.alt === combo2.alt &&
    combo1.meta === combo2.meta
  );
}

/**
 * 단축키 맵 생성
 */
export type ShortcutMap = Record<string, () => void>;

export function createShortcutHandler(
  shortcuts: Record<string, ShortcutConfig>
): (event: KeyboardEvent) => boolean {
  return (event: KeyboardEvent) => {
    for (const [, config] of Object.entries(shortcuts)) {
      const combo = parseKeyCombo(config.key);

      if (matchKeyCombo(event, combo)) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }

    return false;
  };
}

/**
 * 키보드 단축키 리스너 등록
 */
export function registerShortcutListener(
  handler: (event: KeyboardEvent) => void
): () => void {
  document.addEventListener('keydown', handler);

  return () => {
    document.removeEventListener('keydown', handler);
  };
}

/**
 * 단축키 비교 (우선순위 계산용)
 */
export function getShortcutPriority(shortcut: string): number {
  const combo = parseKeyCombo(shortcut);
  let priority = 0;

  if (combo.ctrl) priority += 100;
  if (combo.meta) priority += 100;
  if (combo.shift) priority += 50;
  if (combo.alt) priority += 25;

  return priority;
}

/**
 * 단축키 정렬
 */
export function sortShortcuts(shortcuts: string[]): string[] {
  return [...shortcuts].sort((a, b) => {
    const priorityA = getShortcutPriority(a);
    const priorityB = getShortcutPriority(b);

    if (priorityA !== priorityB) {
      return priorityB - priorityA; // 높은 우선순위 먼저
    }

    return a.localeCompare(b);
  });
}

/**
 * 단축키 그룹 확인
 */
export function getShortcutGroup(shortcut: string): 'modifier' | 'function' | 'alpha' | 'other' {
  const combo = parseKeyCombo(shortcut);

  if (combo.ctrl || combo.meta || combo.alt || combo.shift) {
    return 'modifier';
  }

  const key = combo.key.toLowerCase();

  if (key.startsWith('f') && key.length === 2) {
    const num = parseInt(key.slice(1));
    return num >= 1 && num <= 12 ? 'function' : 'other';
  }

  if (/^[a-z]$/.test(key)) {
    return 'alpha';
  }

  return 'other';
}

/**
 * 시스템 단축키인지 확인 (브라우저 기본 단축키)
 */
export function isSystemShortcut(shortcut: string): boolean {
  const systemShortcuts = [
    'ctrl+c', // copy
    'ctrl+v', // paste
    'ctrl+x', // cut
    'ctrl+z', // undo
    'ctrl+y', // redo
    'ctrl+a', // select all
    'ctrl+s', // save
    'ctrl+p', // print
    'ctrl+f', // find
    'ctrl+w', // close tab
    'ctrl+t', // new tab
    'ctrl+r', // refresh
    'f5', // refresh
    'f11', // fullscreen
    'f12', // devtools
  ];

  return systemShortcuts.some(system => hasShortcutConflict(shortcut, system));
}

/**
 * 단축키 표시 이름 생성 (사용자에게 보여줄 때)
 */
export function getShortcutDisplayName(shortcut: string): string {
  const combo = parseKeyCombo(shortcut);
  const parts: string[] = [];

  const isMac = typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (combo.ctrl) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (combo.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (combo.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (combo.meta) {
    parts.push(isMac ? '⌘' : 'Win');
  }

  parts.push(formatKeyName(combo.key));

  return parts.join(isMac ? '' : ' + ');
}
