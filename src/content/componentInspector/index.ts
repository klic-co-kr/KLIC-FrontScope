/**
 * Component Inspector - Content Script Handler
 *
 * 컴포넌트 인스펙터 피커 및 스캔 기능
 */

import { MESSAGE_ACTIONS } from '@/constants/messages';
import { scanComponents, scanElement } from './scanner';

let isPickerActive = false;
let hoverOverlay: HTMLElement | null = null;
let toastElement: HTMLElement | null = null;

/**
 * 컴포넌트 피커 활성화
 */
export function activateComponentPicker(): void {
  if (isPickerActive) return;
  isPickerActive = true;

  document.addEventListener('mousemove', handlePickerHover);
  document.addEventListener('click', handlePickerClick, true);
  document.addEventListener('keydown', handlePickerKeydown);

  createHoverOverlay();
  showPickerToast();
}

/**
 * 컴포넌트 피커 비활성화
 */
export function deactivateComponentPicker(): void {
  if (!isPickerActive) return;
  isPickerActive = false;

  document.removeEventListener('mousemove', handlePickerHover);
  document.removeEventListener('click', handlePickerClick, true);
  document.removeEventListener('keydown', handlePickerKeydown);

  removeHoverOverlay();
  removePickerToast();
}

/**
 * 호버 오버레이 생성
 */
function createHoverOverlay(): void {
  if (hoverOverlay) return;

  hoverOverlay = document.createElement('div');
  hoverOverlay.id = 'klic-component-picker-overlay';
  hoverOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    border: 2px solid #8B5CF6;
    background: rgba(139, 92, 246, 0.1);
    transition: all 0.1s ease;
    border-radius: 4px;
  `;
  document.body.appendChild(hoverOverlay);
}

/**
 * 호버 오버레이 제거
 */
function removeHoverOverlay(): void {
  if (hoverOverlay) {
    hoverOverlay.remove();
    hoverOverlay = null;
  }
}

/**
 * 피커 토스트 제거
 */
function removePickerToast(): void {
  if (toastElement) {
    toastElement.remove();
    toastElement = null;
  }
}

/**
 * 피커 토스트 표시
 */
function showPickerToast(): void {
  // 기존 토스트 제거
  removePickerToast();

  toastElement = document.createElement('div');
  toastElement.className = 'klic-component-picker-toast';
  toastElement.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  toastElement.textContent = '컴포넌트를 클릭하여 선택하세요 (ESC로 취소)';
  document.body.appendChild(toastElement);

  // 3초 후 자동 제거
  setTimeout(() => {
    removePickerToast();
  }, 3000);
}

/**
 * 피커 호버 처리
 */
function handlePickerHover(e: MouseEvent): void {
  if (!hoverOverlay) return;

  const target = e.target as HTMLElement;
  if (target === hoverOverlay) return;

  const rect = target.getBoundingClientRect();
  hoverOverlay.style.top = `${rect.top}px`;
  hoverOverlay.style.left = `${rect.left}px`;
  hoverOverlay.style.width = `${rect.width}px`;
  hoverOverlay.style.height = `${rect.height}px`;
}

/**
 * 피커 클릭 처리
 */
function handlePickerClick(e: MouseEvent): void {
  if (!isPickerActive) return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  if (target === hoverOverlay) return;

  const componentInfo = scanElement(target);

  // 사이드패널로 선택된 컴포넌트 전송
  chrome.runtime.sendMessage({
    action: MESSAGE_ACTIONS.COMPONENT_DATA,
    data: {
      component: componentInfo,
      x: e.clientX,
      y: e.clientY,
    },
  }).catch(() => undefined);

  // 피커 종료 알림
  chrome.runtime.sendMessage({
    action: MESSAGE_ACTIONS.COMPONENT_PICKER_DONE,
  }).catch(() => undefined);

  deactivateComponentPicker();
}

/**
 * 피커 키다운 처리 (ESC 취소)
 */
function handlePickerKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    deactivateComponentPicker();
    chrome.runtime.sendMessage({
      action: MESSAGE_ACTIONS.COMPONENT_PICKER_DONE,
      data: { cancelled: true },
    }).catch(() => undefined);
  }
}

/**
 * 전체 컴포넌트 스캔
 */
export function performComponentScan(options?: { frameworkOnly?: boolean }): void {
  try {
    const result = scanComponents(document.body, options);

    chrome.runtime.sendMessage({
      action: MESSAGE_ACTIONS.COMPONENT_DATA,
      data: result,
    }).catch(() => undefined);
  } catch (error) {
    console.error('[KLIC] Component scan failed:', error);
  }
}

/**
 * 특정 요소 스캔
 */
export function scanSpecificElement(selector: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    chrome.runtime.sendMessage({
      action: MESSAGE_ACTIONS.COMPONENT_DATA,
      data: { error: 'Element not found' },
    }).catch(() => undefined);
    return;
  }

  const componentInfo = scanElement(element);
  chrome.runtime.sendMessage({
    action: MESSAGE_ACTIONS.COMPONENT_DATA,
    data: componentInfo,
  }).catch(() => undefined);
}

/**
 * 피커 활성화 상태 확인
 */
export function isComponentPickerActive(): boolean {
  return isPickerActive;
}
