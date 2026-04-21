/**
 * Keyboard Handler Utilities
 *
 * 키보드 이벤트를 처리하는 유틸리티 클래스와 함수들
 */

import type { KeyboardShortcut } from '../../types/textEdit';

/**
 * 키보드 매니저 클래스
 */
export class KeyboardManager {
  private shortcuts: KeyboardShortcut[] = [];
  private isEnabled: boolean = true;

  /**
   * 단축키 등록
   *
   * @param shortcut - 단축키 정보
   */
  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
  }

  /**
   * 단축키 등록 해제
   *
   * @param key - 키 이름
   */
  unregister(key: string): void {
    this.shortcuts = this.shortcuts.filter(s => s.key !== key);
  }

  /**
   * 모든 단축키 제거
   */
  clearAll(): void {
    this.shortcuts = [];
  }

  /**
   * 키보드 매니저 활성화/비활성화
   *
   * @param enabled - 활성화 여부
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 키다운 이벤트 처리
   *
   * @param event - 키보드 이벤트
   * @returns 처리 여부
   */
  handleKeyDown(event: KeyboardEvent, overrideTarget?: HTMLElement): boolean {
    if (!this.isEnabled) return false;

    const target = overrideTarget ?? (event.target as HTMLElement);

    const match = this.shortcuts.find(
      s =>
        s.key.toLowerCase() === event.key.toLowerCase() &&
        (s.ctrlKey === undefined || s.ctrlKey === event.ctrlKey) &&
        (s.shiftKey === undefined || s.shiftKey === event.shiftKey) &&
        (s.altKey === undefined || s.altKey === event.altKey) &&
        (s.metaKey === undefined || s.metaKey === event.metaKey)
    );

    if (match) {
      event.preventDefault();
      event.stopPropagation();
      match.handler(event, target);
      return true;
    }

    return false;
  }

  /**
   * 등록된 모든 단축키 가져오기
   *
   * @returns 단축키 배열
   */
  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }
}

/**
 * 기본 단축키 정의
 */
export function getDefaultShortcuts(): KeyboardShortcut[] {
  return [
    // ESC: 편집 취소
    {
      key: 'Escape',
      handler: (_e: KeyboardEvent, element: HTMLElement) => {
        if (isEditable(element)) {
          restoreOriginalText(element);
          makeUneditable(element);
          removeHighlight(element);
        }
      },
      description: '편집 취소',
    },

    {
      key: 'Enter',
      ctrlKey: false,
      handler: (_e: KeyboardEvent, element: HTMLElement) => {
        if (isEditable(element)) {
          makeUneditable(element);
          // 저장 로직 트리거
          element.dispatchEvent(new CustomEvent('text-edit-save'));
        }
      },
      description: '저장',
    },

    {
      key: 'Enter',
      ctrlKey: true,
      handler: (_e: KeyboardEvent, element: HTMLElement) => {
        if (isEditable(element)) {
          if (!document.execCommand('insertLineBreak')) {
            document.execCommand('insertHTML', false, '<br>');
          }
        }
      },
      description: '줄바꿈',
    },

    // Ctrl+Z: 실행 취소
    {
      key: 'z',
      ctrlKey: true,
      handler: (_e: KeyboardEvent, element: HTMLElement) => {
        // Undo 로직
        element.dispatchEvent(new CustomEvent('text-edit-undo'));
      },
      description: '실행 취소',
    },

    // Ctrl+Shift+Z: 다시 실행
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      handler: (_e: KeyboardEvent, element: HTMLElement) => {
        // Redo 로직
        element.dispatchEvent(new CustomEvent('text-edit-redo'));
      },
      description: '다시 실행',
    },

    // Ctrl+A: 전체 선택
    {
      key: 'a',
      ctrlKey: true,
      handler: (_e: KeyboardEvent, element: HTMLElement) => {
        if (isEditable(element)) {
          selectAllText(element);
        }
      },
      description: '전체 선택',
    },

    // Tab: 들여쓰기 (편집 모드에서만)
    {
      key: 'Tab',
      handler: (e: KeyboardEvent, element: HTMLElement) => {
        if (isEditable(element)) {
          e.preventDefault();
          document.execCommand('insertText', false, '  '); // 2칸 공백
        }
      },
      description: '들여쓰기',
    },
  ];
}

/**
 * 단축키를 사람이 읽을 수 있는 문자열로 변환
 *
 * @param shortcut - 단축키 정보
 * @returns 문자열 표현
 */
export function shortcutToString(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.metaKey) parts.push('Cmd');

  parts.push(shortcut.key);

  return parts.join('+');
}

/**
 * 문자열을 단축키 객체로 파싱
 *
 * @param shortcutString - 단축키 문자열
 * @returns 단축키 객체
 */
export function parseShortcut(shortcutString: string): Partial<KeyboardShortcut> {
  const parts = shortcutString.split('+').map(p => p.trim());
  const key = parts[parts.length - 1];

  return {
    key,
    ctrlKey: parts.includes('Ctrl'),
    shiftKey: parts.includes('Shift'),
    altKey: parts.includes('Alt'),
    metaKey: parts.includes('Cmd'),
  };
}

// 필요한 함수들 import
import { isEditable, makeUneditable } from './editableControl';
import { restoreOriginalText } from './textStorage';
import { removeHighlight } from './highlighter';
import { selectAllText } from './editableControl';
