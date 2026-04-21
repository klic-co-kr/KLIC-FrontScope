/**
 * Text Edit Content Script
 *
 * 텍스트 편집 기능을 위한 Content Script
 * 페이지의 텍스트 요소를 편집 가능하게 만들고 Side Panel과 통신
 */

import { safeSendMessage } from './utils/safeMessage';
import { getEditableElements } from '../utils/textEdit/elementDetector';
import { getSelector, getXPath } from '../utils/dom/selectorGenerator';
import {
  saveOriginalText,
  getChanges,
} from '../utils/textEdit/textStorage';
import { highlightElement, removeHighlight, clearAllHighlights } from '../utils/textEdit/highlighter';
import {
  makeEditable,
  makeUneditable,
  isEditable,
} from '../utils/textEdit/editableControl';
import { getTextStats } from '../utils/textEdit/textAnalysis';
import { KeyboardManager, getDefaultShortcuts } from '../utils/textEdit/keyboardHandler';
import type { TextEditFormatCommand, TextEditFontOptionsResponse } from '../types/textEdit';

const FONT_CANDIDATES = [
  'Inter',
  'Roboto',
  'Segoe UI',
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Noto Sans KR',
  'Nanum Gothic',
  'Malgun Gothic',
  'Apple SD Gothic Neo',
] as const;

const GENERIC_FONT_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
]);

type TextEditCommandFailureReason =
  | 'TEXT_EDIT_NO_SELECTION'
  | 'TEXT_EDIT_INVALID_FONT'
  | 'TEXT_EDIT_INVALID_FONT_SIZE'
  | 'TEXT_EDIT_INVALID_FORMAT'
  | 'TEXT_EDIT_FORMAT_FAILED'
  | 'TEXT_EDIT_FONT_FAILED'
  | 'TEXT_EDIT_FONT_SIZE_FAILED';

interface TextEditCommandResult {
  success: boolean;
  reason?: TextEditCommandFailureReason;
}

function isTextEditFormatCommand(value: unknown): value is TextEditFormatCommand {
  return (
    value === 'bold'
    || value === 'italic'
    || value === 'strikethrough'
    || value === 'underline'
    || value === 'superscript'
    || value === 'subscript'
  );
}

/**
 * 텍스트 편집 상태 관리자
 */
class TextEditManager {
  private isActive = false;
  private keyboardManager: KeyboardManager;
  private hoverTimeout: number | null = null;
  private currentEditable: HTMLElement | null = null;
  private hoverOverlay: HTMLElement | null = null;
  private lastSelectionRange: Range | null = null;

  constructor() {
    this.keyboardManager = new KeyboardManager();

    // 기본 단축키 등록
    const shortcuts = getDefaultShortcuts();
    shortcuts.forEach(s => this.keyboardManager.register(s));
  }

  /**
   * 텍스트 편집 활성화
   */
  activate(): void {
    if (this.isActive) return;

    this.isActive = true;

    // 모든 편집 가능한 요소에 호버 이벤트 추가
    this.attachHoverListeners();

    // 전역 키보드 이벤트
    document.addEventListener('keydown', this.handleKeyDown);

    window.addEventListener('keydown', this.handleEditingKeyDownCapture, true);
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  /**
   * 텍스트 편집 비활성화
   */
  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // 호버 이벤트 제거
    this.detachHoverListeners();

    // 오버레이 제거
    this.removeHoverOverlay();

    // 진행 중인 편집 완료
    if (this.currentEditable && isEditable(this.currentEditable)) {
      makeUneditable(this.currentEditable);
    }
    this.currentEditable = null;

    // 모든 하이라이트 + 인라인 스타일 제거 (hover, editing, edited 전부)
    clearAllHighlights();

    // contentEditable이 남아있는 요소 정리
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      if (el instanceof HTMLElement && el.dataset.editStartTime) {
        makeUneditable(el);
      }
    });

    // 전역 키보드 이벤트 제거
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keydown', this.handleEditingKeyDownCapture, true);
    document.removeEventListener('selectionchange', this.handleSelectionChange);

    this.lastSelectionRange = null;
  }

  /**
   * 요소에 호버 리스너 연결
   */
  private attachHoverListeners(): void {
    // 이벤트 위임을 사용하여 동적으로 추가되는 요소도 처리
    document.body.addEventListener('mouseover', this.handleMouseOver, true);
    document.body.addEventListener('mouseout', this.handleMouseOut, true);
    document.body.addEventListener('click', this.handleClick, true);
  }

  /**
   * 요소에서 호버 리스너 제거
   */
  private detachHoverListeners(): void {
    document.body.removeEventListener('mouseover', this.handleMouseOver, true);
    document.body.removeEventListener('mouseout', this.handleMouseOut, true);
    document.body.removeEventListener('click', this.handleClick, true);
  }

  /**
   * 호버 오버레이 생성
   */
  private createHoverOverlay(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();

    if (!this.hoverOverlay || !document.body.contains(this.hoverOverlay)) {
      document.getElementById('klic-text-edit-overlay')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'klic-text-edit-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        pointerEvents: 'none',
        border: '2px solid #f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        zIndex: '2147483646',
        transition: 'all 0.08s ease',
        borderRadius: '4px',
      });

      const info = document.createElement('div');
      info.id = 'klic-text-edit-info';
      Object.assign(info.style, {
        position: 'absolute',
        top: '-28px',
        left: '0',
        background: '#f59e0b',
        color: 'white',
        padding: '4px 8px',
        fontSize: '12px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        fontWeight: '600',
        fontFamily: 'system-ui, sans-serif',
      });
      info.textContent = '텍스트 편집';
      overlay.appendChild(info);

      document.body.appendChild(overlay);
      this.hoverOverlay = overlay;
    }

    Object.assign(this.hoverOverlay.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  /**
   * 호버 오버레이 제거
   */
  private removeHoverOverlay(): void {
    if (this.hoverOverlay) {
      this.hoverOverlay.remove();
      this.hoverOverlay = null;
    }
  }

  /**
   * 호버 이벤트 핸들러
   */
  private handleMouseOver = (e: MouseEvent): void => {
    if (!this.isActive) return;

    const target = e.target as HTMLElement;

    // 편집 가능한 요소인지 확인
    if (!getEditableElements().includes(target)) return;

    // 타임아웃 클리어
    if (this.hoverTimeout !== null) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = window.setTimeout(() => {
      this.createHoverOverlay(target);
    }, 50);
  };

  /**
   * 마우스 아웃 핸들러
   */
  private handleMouseOut = (): void => {
    this.removeHoverOverlay();

    if (this.hoverTimeout !== null) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  };

  /**
   * 클릭 핸들러
   */
  private handleClick = (e: MouseEvent): void => {
    if (!this.isActive) return;

    const target = e.target as HTMLElement;

    // 편집 가능한 요소인지 확인
    if (!getEditableElements().includes(target)) return;

    e.preventDefault();
    e.stopPropagation();

    this.startEditing(target);
  };

  /**
   * 편집 시작
   */
  private startEditing(element: HTMLElement): void {
    // 오버레이 및 호버 하이라이트 제거
    this.removeHoverOverlay();

    // 원본 텍스트 저장
    saveOriginalText(element);

    // 편집 모드로 전환
    makeEditable(element);
    highlightElement(element, 'editing');

    this.currentEditable = element;

    // 편집 완료 리스너
    const finishEditing = () => {
      this.finishEditing(element);
    };

    element.addEventListener('blur', finishEditing, { once: true });
  }

  /**
   * 편집 완료
   */
  private finishEditing(element: HTMLElement): void {
    const changes = getChanges(element);

    // 편집 하이라이트 제거 (원본 스타일 복원)
    removeHighlight(element, 'editing');

    if (changes.changed) {
      // 변경 사항이 있으면 Side Panel로 전송
      const stats = getTextStats(element.textContent || '');
      const edit = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        element: {
          tagName: element.tagName,
          selector: getSelector(element),
          xpath: getXPath(element),
          className: element.className,
          id: element.id,
        },
        changes: {
          before: changes.before,
          after: changes.after,
          charDiff: changes.after.length - changes.before.length,
        },
        metadata: {
          wordCount: {
            before: stats.words,
            after: stats.words,
          },
          language: stats.language,
        },
      };

      // Side Panel로 전송
      safeSendMessage({
        action: 'TEXT_EDIT_SAVE',
        data: edit,
      });

      // 편집 완료 하이라이트 (녹색 플래시)
      highlightElement(element, 'edited');

      // 2초 후 편집 하이라이트 제거
      setTimeout(() => {
        removeHighlight(element, 'edited');
      }, 2000);
    }

    makeUneditable(element);
    this.currentEditable = null;
  }

  /**
   * 키다운 이벤트 핸들러
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    const target =
      this.currentEditable && isEditable(this.currentEditable)
        ? this.currentEditable
        : (e.target as HTMLElement);

    this.keyboardManager.handleKeyDown(e, target);
  };

  private handleEditingKeyDownCapture = (e: KeyboardEvent): void => {
    const editable = this.currentEditable;
    if (!this.isActive || !editable || !isEditable(editable)) return;

    if (e.isComposing || e.key === 'Process' || e.key === 'Dead') return;

    const target = e.target;
    const isFromEditable =
      target === editable ||
      (target instanceof Node && editable.contains(target));

    if (isFromEditable) {
      const handled = this.keyboardManager.handleKeyDown(e, editable);

      if (handled) {
        e.stopPropagation();
        return;
      }

      if (!e.ctrlKey && !e.metaKey) {
        e.stopPropagation();
      }

      return;
    }

    if (!this.shouldRouteTypingToEditable(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    editable.focus();

    if (e.key === 'Escape' || e.key === 'Enter') {
      this.keyboardManager.handleKeyDown(e, editable);
      return;
    }

    if (e.key === 'Backspace') {
      document.execCommand('delete');
      return;
    }

    if (e.key === 'Delete') {
      document.execCommand('forwardDelete');
      return;
    }

    if (e.key === 'Tab') {
      document.execCommand('insertText', false, '  ');
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      document.execCommand('insertText', false, e.key);
    }
  };

  private shouldRouteTypingToEditable(e: KeyboardEvent): boolean {
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return e.key === 'Escape';
    }

    if (e.key.length === 1) {
      return true;
    }

    return ['Backspace', 'Delete', 'Enter', 'Tab', 'Escape'].includes(e.key);
  }

  private handleSelectionChange = (): void => {
    if (!this.isActive) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed || !this.isRangeUsable(range)) {
      return;
    }

    this.lastSelectionRange = range.cloneRange();
  };

  private isRangeUsable(range: Range): boolean {
    const container = range.commonAncestorContainer;
    const root = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;

    return !!root && document.body.contains(root);
  }

  private getCurrentSelectionRange(): Range | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed || !this.isRangeUsable(range)) {
      return null;
    }

    return range;
  }

  private getSelectionRangeForCommand(): Range | null {
    const currentRange = this.getCurrentSelectionRange();
    if (currentRange) {
      this.lastSelectionRange = currentRange.cloneRange();
      return currentRange.cloneRange();
    }

    if (this.lastSelectionRange && !this.lastSelectionRange.collapsed && this.isRangeUsable(this.lastSelectionRange)) {
      return this.lastSelectionRange.cloneRange();
    }

    return null;
  }

  private getEditableForCommand(): HTMLElement | null {
    if (!this.isActive || !this.currentEditable || !isEditable(this.currentEditable)) {
      return null;
    }

    return this.currentEditable;
  }

  private normalizeFontFamily(fontFamily: string): string {
    return fontFamily.trim().replace(/^['"]+|['"]+$/g, '');
  }

  private normalizeFontSize(fontSize: number): number | null {
    if (!Number.isFinite(fontSize)) {
      return null;
    }

    const rounded = Math.round(fontSize);
    if (rounded < 8 || rounded > 200) {
      return null;
    }

    return rounded;
  }

  private getElementFromNode(node: Node | null): HTMLElement | null {
    if (!node) {
      return null;
    }

    if (node instanceof HTMLElement) {
      return node;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      return node.parentElement;
    }

    return null;
  }

  private getCurrentStyleAnchorElement(): HTMLElement | null {
    const editable = this.getEditableForCommand();
    if (editable) {
      return editable;
    }

    const selectionRange = this.getCurrentSelectionRange() ?? this.lastSelectionRange;
    if (!selectionRange || !this.isRangeUsable(selectionRange)) {
      return null;
    }

    return this.getElementFromNode(selectionRange.startContainer);
  }

  private getCurrentFontSize(): number | null {
    const anchorElement = this.getCurrentStyleAnchorElement();
    if (!anchorElement) {
      return null;
    }

    const parsed = Number.parseFloat(getComputedStyle(anchorElement).fontSize);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.round(parsed);
  }

  private getPrimaryFontFamily(fontFamily: string): string | null {
    const [primaryFamily] = fontFamily.split(',');
    if (!primaryFamily) {
      return null;
    }

    const normalized = this.normalizeFontFamily(primaryFamily);
    return normalized.length > 0 ? normalized : null;
  }

  private isFontAvailable(fontFamily: string): boolean {
    const normalized = this.normalizeFontFamily(fontFamily);
    if (normalized.length === 0) {
      return false;
    }

    if (GENERIC_FONT_FAMILIES.has(normalized.toLowerCase())) {
      return true;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return true;
    }

    const testText = 'mmmmmmmmmlli';
    const testSize = '72px';
    const baseFamilies = ['monospace', 'sans-serif', 'serif'] as const;

    return baseFamilies.some((baseFamily) => {
      context.font = `${testSize} ${baseFamily}`;
      const baselineWidth = context.measureText(testText).width;

      context.font = `${testSize} "${normalized}", ${baseFamily}`;
      const candidateWidth = context.measureText(testText).width;

      return baselineWidth !== candidateWidth;
    });
  }

  private getDocumentFontFamilies(): string[] {
    if (!('fonts' in document)) {
      return [];
    }

    try {
      const families = Array.from(document.fonts)
        .map((fontFace) => this.normalizeFontFamily(fontFace.family))
        .filter((family) => family.length > 0);

      return Array.from(new Set(families));
    } catch {
      return [];
    }
  }

  private applyFontFallback(editable: HTMLElement, fontFamily: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editable.style.fontFamily = fontFamily;
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editable.contains(range.commonAncestorContainer) || range.collapsed) {
      editable.style.fontFamily = fontFamily;
      return;
    }

    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;

    try {
      range.surroundContents(span);
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    } catch {
      editable.style.fontFamily = fontFamily;
    }
  }

  private applyNodeToRange(range: Range, node: HTMLElement): boolean {
    if (range.collapsed || !this.isRangeUsable(range)) {
      return false;
    }

    try {
      const fragment = range.extractContents();
      if (fragment.childNodes.length === 0) {
        return false;
      }

      node.appendChild(fragment);
      range.insertNode(node);

      const selection = window.getSelection();
      if (selection) {
        const nextRange = document.createRange();
        nextRange.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(nextRange);
        this.lastSelectionRange = nextRange.cloneRange();
      }

      return true;
    } catch {
      return false;
    }
  }

  private createFormatNode(command: TextEditFormatCommand): HTMLElement {
    if (command === 'bold') {
      return document.createElement('strong');
    }

    if (command === 'italic') {
      return document.createElement('em');
    }

    if (command === 'underline') {
      return document.createElement('u');
    }

    if (command === 'superscript') {
      return document.createElement('sup');
    }

    if (command === 'subscript') {
      return document.createElement('sub');
    }

    return document.createElement('s');
  }

  applyFormat(command: TextEditFormatCommand): TextEditCommandResult {
    const editable = this.getEditableForCommand();

    if (editable) {
      editable.focus();

      const executed = document.execCommand(command);
      if (executed) {
        return { success: true };
      }
    }

    const range = this.getSelectionRangeForCommand();
    if (!range) {
      return { success: false, reason: 'TEXT_EDIT_NO_SELECTION' };
    }

    const formatNode = this.createFormatNode(command);
    const applied = this.applyNodeToRange(range, formatNode);

    if (!applied) {
      return { success: false, reason: 'TEXT_EDIT_FORMAT_FAILED' };
    }

    return { success: true };
  }

  applyFontFamily(fontFamily: string): TextEditCommandResult {
    const editable = this.getEditableForCommand();

    const normalized = this.normalizeFontFamily(fontFamily);
    if (normalized.length === 0) {
      return { success: false, reason: 'TEXT_EDIT_INVALID_FONT' };
    }

    if (editable) {
      editable.focus();

      const executed = document.execCommand('fontName', false, normalized);
      if (executed) {
        return { success: true };
      }

      const selectionRange = this.getSelectionRangeForCommand();
      if (!selectionRange) {
        editable.style.fontFamily = normalized;
        return { success: true };
      }

      const fallbackNode = document.createElement('span');
      fallbackNode.style.fontFamily = normalized;
      if (this.applyNodeToRange(selectionRange, fallbackNode)) {
        return { success: true };
      }

      this.applyFontFallback(editable, normalized);
      return { success: true };
    }

    const range = this.getSelectionRangeForCommand();
    if (!range) {
      return { success: false, reason: 'TEXT_EDIT_NO_SELECTION' };
    }

    const fontNode = document.createElement('span');
    fontNode.style.fontFamily = normalized;

    if (!this.applyNodeToRange(range, fontNode)) {
      return { success: false, reason: 'TEXT_EDIT_FONT_FAILED' };
    }

    return { success: true };
  }

  applyFontSize(fontSize: number): TextEditCommandResult {
    const editable = this.getEditableForCommand();
    const normalizedSize = this.normalizeFontSize(fontSize);

    if (!normalizedSize) {
      return { success: false, reason: 'TEXT_EDIT_INVALID_FONT_SIZE' };
    }

    const fontSizeValue = `${normalizedSize}px`;

    if (editable) {
      editable.focus();

      const selectionRange = this.getSelectionRangeForCommand();
      if (!selectionRange) {
        editable.style.fontSize = fontSizeValue;
        return { success: true };
      }

      const span = document.createElement('span');
      span.style.fontSize = fontSizeValue;

      if (this.applyNodeToRange(selectionRange, span)) {
        return { success: true };
      }

      return { success: false, reason: 'TEXT_EDIT_FONT_SIZE_FAILED' };
    }

    const range = this.getSelectionRangeForCommand();
    if (!range) {
      return { success: false, reason: 'TEXT_EDIT_NO_SELECTION' };
    }

    const fontSizeNode = document.createElement('span');
    fontSizeNode.style.fontSize = fontSizeValue;

    if (!this.applyNodeToRange(range, fontSizeNode)) {
      return { success: false, reason: 'TEXT_EDIT_FONT_SIZE_FAILED' };
    }

    return { success: true };
  }

  getFontOptions(): TextEditFontOptionsResponse {
    const currentEditable = this.getEditableForCommand();
    const currentFont = currentEditable
      ? this.getPrimaryFontFamily(getComputedStyle(currentEditable).fontFamily)
      : null;

    const availableCandidateFonts = FONT_CANDIDATES.filter((fontFamily) => this.isFontAvailable(fontFamily));
    const documentFonts = this.getDocumentFontFamilies();

    const fontSet = new Set<string>(availableCandidateFonts);
    documentFonts.forEach((family) => {
      if (this.isFontAvailable(family)) {
        fontSet.add(family);
      }
    });

    if (currentFont) {
      fontSet.add(currentFont);
    }

    const fonts = Array.from(fontSet).sort((a, b) => a.localeCompare(b));

    return {
      fonts,
      currentFont,
      currentFontSize: this.getCurrentFontSize(),
    };
  }

  /**
   * 특정 요소의 편집 되돌리기
   */
  undoEdit(selector: string, originalText: string): boolean {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return false;

    element.textContent = originalText;
    removeHighlight(element, 'edited');

    return true;
  }
}

// 전역 인스턴스
const textEditManagerInstance = new TextEditManager();

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void _sender;
  switch (message.action) {
    case 'TEXT_EDIT_TOGGLE':
      if (message.data?.active) {
        textEditManagerInstance.activate();
      } else {
        textEditManagerInstance.deactivate();
      }
      sendResponse({ success: true });
      return true;

    case 'TEXT_EDIT_UNDO': {
      const { selector, originalText } = message.data || {};
      const success = textEditManagerInstance.undoEdit(selector, originalText);
      sendResponse({ success });
      return true;
    }

    case 'TEXT_EDIT_APPLY_FORMAT': {
      const command = message.data?.command;

      if (!isTextEditFormatCommand(command)) {
        sendResponse({ success: false, reason: 'TEXT_EDIT_INVALID_FORMAT' });
        return true;
      }

      sendResponse(textEditManagerInstance.applyFormat(command));
      return true;
    }

    case 'TEXT_EDIT_APPLY_FONT_FAMILY': {
      const fontFamily = message.data?.fontFamily;

      if (typeof fontFamily !== 'string') {
        sendResponse({ success: false, reason: 'TEXT_EDIT_INVALID_FONT' });
        return true;
      }

      sendResponse(textEditManagerInstance.applyFontFamily(fontFamily));
      return true;
    }

    case 'TEXT_EDIT_APPLY_FONT_SIZE': {
      const fontSize = message.data?.fontSize;

      if (typeof fontSize !== 'number') {
        sendResponse({ success: false, reason: 'TEXT_EDIT_INVALID_FONT_SIZE' });
        return true;
      }

      sendResponse(textEditManagerInstance.applyFontSize(fontSize));
      return true;
    }

    case 'TEXT_EDIT_GET_FONT_OPTIONS': {
      sendResponse({
        success: true,
        data: textEditManagerInstance.getFontOptions(),
      });
      return true;
    }

    case 'TEXT_EDIT_START':
      textEditManagerInstance.activate();
      sendResponse({ success: true });
      return true;

    case 'TEXT_EDIT_END':
      textEditManagerInstance.deactivate();
      sendResponse({ success: true });
      return true;
  }
});

// 초기화
console.log('Text Edit Content Script loaded');

// TextEditManager export
export { TextEditManager };

// Export singleton instance
export { textEditManagerInstance };
