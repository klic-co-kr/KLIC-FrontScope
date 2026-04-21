/**
 * Keyboard Handler
 *
 * 키보드 단축키 처리 및 등록
 */

import { parseKeyCombo, matchKeyCombo } from '../../utils/gridLayout/grid/keyboardShortcuts';
import { MESSAGE_ACTIONS } from '../../constants/messages';
import { safeSendMessage } from '../utils/safeMessage';

interface ShortcutAction {
  key: string;
  action: (e: KeyboardEvent) => void;
  description: string;
}

const registeredShortcuts: Map<string, ShortcutAction> = new Map();

/**
 * 키보드 단축키 설정
 */
export function setupKeyboardHandler(shortcuts: Record<string, () => void>): () => void {
  // 단축키 등록
  for (const [shortcut, action] of Object.entries(shortcuts)) {
    registerShortcut(shortcut, action, `Custom: ${shortcut}`);
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // 입력 필드에서는 무시
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      (target as HTMLElement).isContentEditable
    ) {
      return;
    }

    // 등록된 단축키 체크
    for (const [shortcut, shortcutAction] of registeredShortcuts.entries()) {
      const combo = parseKeyCombo(shortcut);

      if (matchKeyCombo(e, combo)) {
        e.preventDefault();
        e.stopPropagation();
        shortcutAction.action(e);
        break;
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * 단축키 등록
 */
export function registerShortcut(
  shortcut: string,
  action: () => void,
  description: string = ''
): void {
  registeredShortcuts.set(shortcut, {
    key: shortcut,
    action,
    description,
  });
}

/**
 * 단축키 제거
 */
export function unregisterShortcut(shortcut: string): void {
  registeredShortcuts.delete(shortcut);
}

/**
 * 모든 단축키 제거
 */
export function clearAllShortcuts(): void {
  registeredShortcuts.clear();
}

/**
 * 등록된 단축키 목록 가져오기
 */
export function getRegisteredShortcuts(): Array<{
  shortcut: string;
  description: string;
}> {
  return Array.from(registeredShortcuts.values()).map(({ key, description }) => ({
    shortcut: key,
    description,
  }));
}

/**
 * 기본 단축키 등록
 */
export function registerDefaultShortcuts(): () => void {
  // 그리드 토글
  registerShortcut(
    'Ctrl+Shift+G',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_OVERLAY,
        payload: { enabled: true }, // 토글 로직 필요
      });
    },
    '그리드 오버레이 토글'
  );

  // 가이드라인 토글
  registerShortcut(
    'Ctrl+Shift+H',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_GUIDES,
        payload: { enabled: true }, // 토글 로직 필요
      });
    },
    '가이드라인 토글'
  );

  // 화이트스페이스 토글
  registerShortcut(
    'Ctrl+Shift+W',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_TOGGLE_WHITESPACE,
        payload: { enabled: true }, // 토글 로직 필요
      });
    },
    '화이트스페이스 토글'
  );

  // 수평 가이드라인 추가
  registerShortcut(
    'Ctrl+Alt+H',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE,
        payload: {
          type: 'horizontal',
          position: Math.round(window.innerHeight / 2),
          color: '#FF3366',
        },
      });
    },
    '수평 가이드라인 추가'
  );

  // 수직 가이드라인 추가
  registerShortcut(
    'Ctrl+Alt+V',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ADD_GUIDE,
        payload: {
          type: 'vertical',
          position: Math.round(window.innerWidth / 2),
          color: '#FF3366',
        },
      });
    },
    '수직 가이드라인 추가'
  );

  // 모두 제거
  registerShortcut(
    'Ctrl+Shift+X',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_CLEAR_ALL,
      });
      removeAllOverlays();
    },
    '모든 가이드라인 및 오버레이 제거'
  );

  // 확대
  registerShortcut(
    'Ctrl+Alt+Up',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ZOOM_IN,
      });
    },
    '확대'
  );

  // 축소
  registerShortcut(
    'Ctrl+Alt+Down',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ZOOM_OUT,
      });
    },
    '축소'
  );

  // 컬럼 증가
  registerShortcut(
    'Ctrl+Alt+Right',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_INCREASE_COLUMNS,
      });
    },
    '컬럼 수 증가'
  );

  // 컬럼 감소
  registerShortcut(
    'Ctrl+Alt+Left',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_DECREASE_COLUMNS,
      });
    },
    '컬럼 수 감소'
  );

  // 회전
  registerShortcut(
    'Ctrl+R',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_ROTATE_VIEWPORT,
      });
    },
    '뷰포트 회전'
  );

  // 줌 리셋
  registerShortcut(
    'Ctrl+0',
    () => {
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_RESET_ZOOM,
      });
    },
    '줌 리셋'
  );

  // ESC - 모두 닫기
  registerShortcut(
    'Escape',
    () => {
      removeAllOverlays();
      safeSendMessage({
        action: MESSAGE_ACTIONS.GRID_LAYOUT_DEACTIVATE,
      });
    },
    '모든 오버레이 닫기'
  );

  // 핸들러 설정
  return setupKeyboardHandler({});
}

/**
 * 단축키 매칭 확인
 */
export function isShortcutPressed(shortcut: string): boolean {
  const combo = parseKeyCombo(shortcut);

  // 현재 키 상태 확인
  const event = new KeyboardEvent('keydown', {
    key: combo.key,
    ctrlKey: combo.ctrl,
    shiftKey: combo.shift,
    altKey: combo.alt,
    metaKey: combo.meta,
  });

  return matchKeyCombo(event, combo);
}

/**
 * 모든 오버레이 제거
 */
export function removeAllOverlays(): void {
  const gridContainer = document.getElementById('grid-overlay-container');
  const gridWrapper = document.getElementById('grid-overlay-wrapper');
  const whitespaceOverlay = document.getElementById('whitespace-overlay');
  const guideLinesContainer = document.getElementById('guide-lines-container');

  gridContainer?.remove();
  gridWrapper?.remove();
  whitespaceOverlay?.remove();
  guideLinesContainer?.remove();
}

/**
 * 활성화된 오버레이 확인
 */
export function hasActiveOverlays(): boolean {
  return !!(
    document.getElementById('grid-overlay-container') ||
    document.getElementById('whitespace-overlay') ||
    document.getElementById('guide-lines-container')
  );
}

/**
 * 현재 눌린 키 조합 가져오기
 */
export function getCurrentKeyCombo(): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
} {
  return {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: '',
  };
}
