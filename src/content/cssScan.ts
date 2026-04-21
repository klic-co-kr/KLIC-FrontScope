/**
 * CSS Scan Content Script
 *
 * CSS 스타일 검사 Content Script
 */

import type { ElementStyleInfo, CSSScanResult } from '../types/cssScan';
import {
  CSS_SCAN_MESSAGE_ACTIONS,
  CSSScanMessage,
} from '../constants/cssScanMessages';
import { safeSendMessage } from './utils/safeMessage';
import { CSS_SCAN_CLASSES } from '../constants/cssScanClasses';
import {
  extractElementStyle,
} from '../utils/cssScan/styleExtractor';
import { extractColorInfo } from '../utils/cssScan/colorAnalyzer';
import { extractFontInfo } from '../utils/cssScan/fontAnalyzer';
import { extractPageCSS } from '../utils/cssScan/cssExporter';

/**
 * CSS Scan 상태
 */
interface CSSScanState {
  isScanning: boolean;
  selectedElement: HTMLElement | null;
  overlay: HTMLElement | null;
}

const state: CSSScanState = {
  isScanning: false,
  selectedElement: null,
  overlay: null,
};

/**
 * CSS Scan 메시지 핸들러
 */
export function handleCSSScanMessage(message: CSSScanMessage): void {
  switch (message.action) {
    case CSS_SCAN_MESSAGE_ACTIONS.START_SCAN:
      startScan(message.options || {});
      break;

    case CSS_SCAN_MESSAGE_ACTIONS.CANCEL_SCAN:
      cancelScan();
      break;

    case CSS_SCAN_MESSAGE_ACTIONS.GET_ELEMENT_STYLE:
      getElementStyle(message.selector!, message.options);
      break;

    case CSS_SCAN_MESSAGE_ACTIONS.EXPORT_STYLES:
      exportStyles(message.format, message.options);
      break;

    default:
      break;
  }
}

/**
 * 스캔 시작
 */
async function startScan(options: {
  includeComputed?: boolean;
  includeInherited?: boolean;
  includeAnimations?: boolean;
}): Promise<void> {
  if (state.isScanning) {
    return;
  }

  state.isScanning = true;

  try {
    // 전체 페이지 스캔
    const result = await scanAll(options);

    // 결과 전송
    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.SCAN_COMPLETE,
      result,
    } as CSSScanMessage);
  } catch (error) {
    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.SCAN_ERROR,
      error: error instanceof Error ? error.message : 'Scan failed',
    } as CSSScanMessage);
  } finally {
    state.isScanning = false;
  }
}

/**
 * 요소 스타일 가져오기
 */
function getElementStyle(
  selector: string,
  options: {
    includeComputed?: boolean;
    includeInherited?: boolean;
  } = {}
): void {
  const element = document.querySelector(selector) as HTMLElement;

  if (!element) {
    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.ELEMENT_STYLE_RESPONSE,
      error: 'Element not found',
    } as CSSScanMessage);
    return;
  }

  try {
    const styleInfo = extractElementStyle(element, options);

    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.ELEMENT_STYLE_RESPONSE,
      data: styleInfo,
    } as CSSScanMessage);
  } catch (error) {
    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.ELEMENT_STYLE_RESPONSE,
      error: error instanceof Error ? error.message : 'Failed to extract style',
    } as CSSScanMessage);
  }
}

/**
 * 스타일 내보내기
 */
function exportStyles(
  format: string = 'css',
  options: {
    minify?: boolean;
    includeComputed?: boolean;
  } = {}
): void {
  try {
    const css = extractPageCSS({
      format: format as 'css' | 'scss' | 'less' | 'json',
      minify: options.minify,
      includeComputed: options.includeComputed,
    });

    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.EXPORT_RESPONSE,
      data: css,
    } as CSSScanMessage);
  } catch (error) {
    safeSendMessage({
      action: CSS_SCAN_MESSAGE_ACTIONS.EXPORT_RESPONSE,
      error: error instanceof Error ? error.message : 'Export failed',
    } as CSSScanMessage);
  }
}

/**
 * 전체 페이지 스캔
 */
async function scanAll(options: {
  includeComputed?: boolean;
  includeInherited?: boolean;
  includeAnimations?: boolean;
}): Promise<CSSScanResult> {
  const startTime = Date.now();

  // 모든 요소 수집
  const elements = document.querySelectorAll('*');
  const scannedElements: ElementStyleInfo[] = [];

  // 색상 수집
  const colorSet = new Set<string>();
  const fontSet = new Set<string>();

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    // 텍스트 요소만
    if (!element.textContent?.trim()) continue;

    const style = extractElementStyle(element, {
      includeComputed: options.includeComputed ?? true,
      includeInherited: options.includeInherited ?? false,
      includeAnimations: options.includeAnimations ?? false,
    });

    scannedElements.push(style);

    // 색상 수집
    const colors = extractColorInfo(element);
    for (const color of colors) {
      colorSet.add(color.hex);
    }

    // 폰트 수집
    const fontInfo = extractFontInfo(element);
    if (fontInfo) {
      fontSet.add(fontInfo.family);
    }
  }

  // 스타일시트 정보
  const stylesheets = Array.from(document.styleSheets).map(sheet => ({
    id: `sheet-${Math.random().toString(36).substr(2, 9)}`,
    href: sheet.href || 'inline',
    disabled: sheet.disabled,
    rules: [],
    imports: [],
    media: [],
  }));

  const result: CSSScanResult = {
    timestamp: startTime,
    url: window.location.href,
    title: document.title,
    elements: scannedElements,
    stylesheets,
    summary: {
      totalElements: scannedElements.length,
      totalRules: scannedElements.reduce((sum, s) => sum + s.matchedRules.length, 0),
      totalStylesheets: stylesheets.length,
      uniqueFonts: Array.from(fontSet),
      uniqueColors: Array.from(colorSet),
    },
  };

  return result;
}

/**
 * 스캔 취소
 */
function cancelScan(): void {
  state.isScanning = false;
  cleanup();
}

/**
 * 요소 하이라이트 시작
 */
export function startHighlighting(): () => void {
  const overlay = document.createElement('div');
  overlay.className = CSS_SCAN_CLASSES.HIGHLIGHTED;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483646;
    pointer-events: none;
  `;

  document.body.appendChild(overlay);
  state.overlay = overlay;

  // 마우스 이동으로 하이라이트
  const handleMouseMove = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    highlightElement(target);
  };

  // 클릭으로 요소 선택
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    state.selectedElement = target;

    // 요소 정보 전송
    const styleInfo = extractElementStyle(target);
    safeSendMessage({
      action: 'ELEMENT_SELECTED',
      data: styleInfo,
    });
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);

  // 정리 함수 반환
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
    if (state.overlay) {
      state.overlay.remove();
      state.overlay = null;
    }
    removeAllHighlights();
  };
}

/**
 * 요소 하이라이트
 */
function highlightElement(element: HTMLElement): void {
  removeAllHighlights();

  const highlight = document.createElement('div');
  highlight.className = CSS_SCAN_CLASSES.ELEMENT_HIGHLIGHT;

  const rect = element.getBoundingClientRect();

  highlight.style.cssText = `
    position: fixed;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    z-index: 2147483647;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(highlight);
}

/**
 * 모든 하이라이트 제거
 */
function removeAllHighlights(): void {
  const highlights = document.querySelectorAll(`.${CSS_SCAN_CLASSES.ELEMENT_HIGHLIGHT}`);
  for (const highlight of Array.from(highlights)) {
    highlight.remove();
  }
}

/**
 * 정리
 */
function cleanup(): void {
  if (state.overlay) {
    state.overlay.remove();
    state.overlay = null;
  }

  state.selectedElement = null;
  removeAllHighlights();

  // CSS 클래스 제거
  document.body.classList.remove(
    CSS_SCAN_CLASSES.HIGHLIGHTED,
    CSS_SCAN_CLASSES.CAPTURING
  );
}

/**
 * 초기화
 */
export function initCSSScanContentScript(): void {
  // 메시지 리스너 등록
  chrome.runtime.onMessage.addListener((message: CSSScanMessage) => {
    handleCSSScanMessage(message);
  });

  // 자동 하이라이트 (설정에 따라)
  chrome.storage.local.get('css-scan-settings', (result) => {
    const settings = result['css-scan-settings'] as { highlightOnHover?: boolean } | undefined;
    if (settings?.highlightOnHover) {
      // 하이라이트 기능 활성화
    }
  });
}

// Content script 로드 시 자동 초기화
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCSSScanContentScript);
  } else {
    initCSSScanContentScript();
  }
}
