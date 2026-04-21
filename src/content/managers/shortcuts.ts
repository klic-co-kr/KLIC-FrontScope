/**
 * Shortcuts Manager
 *
 * 전역 키보드 단축키 관리
 */

import { ToolType } from '../../sidepanel/constants/tools';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  toolId?: ToolType;
  enabled: boolean;
  description?: string;
}

/**
 * Shortcuts Manager 클래스
 */
export class ShortcutManager {
  private shortcuts = new Map<string, Shortcut>();
  private isListening = false;

  register(shortcut: Omit<Shortcut, 'enabled'>): void {
    const key = this.formatKey(shortcut);
    this.shortcuts.set(key, { ...shortcut, enabled: true });

    // 첫 등록 시 리스너 시작
    if (!this.isListening) {
      this.startListening();
    }
  }

  unregister(key: string): void {
    this.shortcuts.delete(key);

    // 등록된 단축키가 없으면 리스너 중지
    if (this.shortcuts.size === 0) {
      this.stopListening();
    }
  }

  enable(toolId: ToolType): void {
    this.shortcuts.forEach((shortcut) => {
      if (shortcut.toolId === toolId) {
        shortcut.enabled = true;
      }
    });
  }

  disable(toolId: ToolType): void {
    this.shortcuts.forEach((shortcut) => {
      if (shortcut.toolId === toolId) {
        shortcut.enabled = false;
      }
    });
  }

  enableAll(): void {
    this.shortcuts.forEach((shortcut) => {
      shortcut.enabled = true;
    });
  }

  disableAll(): void {
    this.shortcuts.forEach((shortcut) => {
      shortcut.enabled = false;
    });
  }

  isEnabled(key: string): boolean {
    const shortcut = this.shortcuts.get(key);
    return shortcut?.enabled ?? false;
  }

  handleKeyPress(event: KeyboardEvent): boolean {
    const key = this.formatEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut && shortcut.enabled) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      return true; // 단축키가 처리됨
    }

    return false; // 단축키가 처리되지 않음
  }

  private formatKey(shortcut: Omit<Shortcut, 'enabled'>): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');

    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  private formatEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  private startListening(): void {
    if (this.isListening) return;

    document.addEventListener('keydown', this.handleKeyDown, true);
    this.isListening = true;
  }

  private stopListening(): void {
    if (!this.isListening) return;

    document.removeEventListener('keydown', this.handleKeyDown, true);
    this.isListening = false;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // 입력 필드에서는 단축키 비활성화 (Escape 제외)
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.getAttribute('contenteditable') === 'true';

    if (isInputField && event.key !== 'Escape') {
      return;
    }

    this.handleKeyPress(event);
  };

  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsForTool(toolId: ToolType): Shortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.toolId === toolId);
  }

  destroy(): void {
    this.stopListening();
    this.shortcuts.clear();
  }

  getShortcutCount(): number {
    return this.shortcuts.size;
  }

  getEnabledShortcutCount(): number {
    return Array.from(this.shortcuts.values()).filter(s => s.enabled).length;
  }
}

export const shortcutManager = new ShortcutManager();

/**
 * 기본 단축키 등록 헬퍼
 */
export function registerDefaultShortcuts(): void {
  // 나중에 도구별 핸들러와 함께 등록
  // 예시:
  // shortcutManager.register({
  //   key: 'e',
  //   ctrl: true,
  //   shift: true,
  //   action: () => console.log('Text Edit'),
  //   toolId: 'textEdit',
  //   description: '텍스트 편집',
  // });
}

/**
 * 단축키 문자열 파싱
 * 예: "Ctrl+Shift+E" -> { key: 'e', ctrl: true, shift: true }
 */
export function parseShortcutString(shortcutStr: string): Omit<Shortcut, 'enabled'> {
  const parts = shortcutStr.toLowerCase().split('+');
  const result: Omit<Shortcut, 'enabled'> = {
    key: '',
    action: () => {}, // placeholder
  };

  for (const part of parts) {
    switch (part.trim()) {
      case 'ctrl':
      case 'control':
        result.ctrl = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'alt':
        result.alt = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        result.meta = true;
        break;
      default:
        result.key = part.trim();
    }
  }

  return result;
}

/**
 * 단축키 문자열 생성
 * 예: { key: 'e', ctrl: true, shift: true } -> "Ctrl+Shift+E"
 */
export function formatShortcutString(shortcut: Omit<Shortcut, 'action' | 'enabled' | 'description' | 'toolId'>): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}
