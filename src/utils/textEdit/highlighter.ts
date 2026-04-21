/**
 * Highlighter Utilities
 *
 * 요소 하이라이트 관련 유틸리티 함수들
 */

import { TEXT_EDIT_CLASSES } from '../../constants/classes';

/**
 * 요소 하이라이트
 *
 * @param element - 요소
 * @param type - 하이라이트 타입
 */
export function highlightElement(
  element: HTMLElement,
  type: 'hover' | 'editing' | 'edited' = 'hover'
): void {
  const className = TEXT_EDIT_CLASSES[type.toUpperCase() as keyof typeof TEXT_EDIT_CLASSES];

  element.classList.add(className);

  // 원본 스타일 저장 (빈 문자열도 유효한 값이므로 undefined 체크)
  if (element.dataset.originalOutline === undefined) {
    element.dataset.originalOutline = element.style.outline;
    element.dataset.originalOutlineOffset = element.style.outlineOffset;
  }

  // 하이라이트 스타일 적용
  switch (type) {
    case 'hover':
      element.style.outline = '2px dashed #f59e0b';
      element.style.outlineOffset = '2px';
      element.style.cursor = 'text';
      break;

    case 'editing':
      element.style.outline = '2px solid #3b82f6';
      element.style.outlineOffset = '2px';
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
      break;

    case 'edited':
      element.style.outline = '2px solid #10b981';
      element.style.outlineOffset = '2px';
      break;
  }
}

/**
 * 하이라이트 제거
 *
 * @param element - 요소
 * @param type - 제거할 타입 (선택사항)
 */
export function removeHighlight(
  element: HTMLElement,
  type?: 'hover' | 'editing' | 'edited'
): void {
  if (type) {
    const className = TEXT_EDIT_CLASSES[type.toUpperCase() as keyof typeof TEXT_EDIT_CLASSES];
    element.classList.remove(className);
  } else {
    // 모든 하이라이트 제거
    Object.values(TEXT_EDIT_CLASSES).forEach(className => {
      element.classList.remove(className);
    });
  }

  // 원본 스타일 복원
  if (element.dataset.originalOutline !== undefined) {
    element.style.outline = element.dataset.originalOutline;
    delete element.dataset.originalOutline;
  }

  if (element.dataset.originalOutlineOffset !== undefined) {
    element.style.outlineOffset = element.dataset.originalOutlineOffset;
    delete element.dataset.originalOutlineOffset;
  }

  element.style.cursor = '';
  element.style.backgroundColor = '';
}

/**
 * 플래시 하이라이트 (일시적인 강조)
 *
 * @param element - 요소
 * @param duration - 지속 시간 (ms)
 */
export function flashHighlight(
  element: HTMLElement,
  duration: number = 1000
): void {
  element.style.transition = 'background-color 0.3s ease';
  const original = element.style.backgroundColor;
  element.style.backgroundColor = 'rgba(245, 158, 11, 0.3)';

  setTimeout(() => {
    element.style.backgroundColor = original;
    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  }, duration);
}

/**
 * 펄스 애니메이션
 *
 * @param element - 요소
 * @param times - 반복 횟수
 */
export function pulseHighlight(
  element: HTMLElement,
  times: number = 3
): void {
  let count = 0;
  const interval = setInterval(() => {
    if (count >= times * 2) {
      clearInterval(interval);
      element.style.opacity = '';
      return;
    }

    element.style.opacity = count % 2 === 0 ? '0.5' : '1';
    count++;
  }, 200);
}

/**
 * 모든 요소의 하이라이트 제거
 */
export function clearAllHighlights(): void {
  Object.values(TEXT_EDIT_CLASSES).forEach(className => {
    document.querySelectorAll(`.${className}`).forEach(el => {
      if (el instanceof HTMLElement) {
        removeHighlight(el);
      }
    });
  });
}

/**
 * 하이라이트된 요소들 가져오기
 *
 * @param type - 하이라이트 타입
 * @returns 하이라이트된 요소 배열
 */
export function getHighlightedElements(
  type: 'hover' | 'editing' | 'edited'
): HTMLElement[] {
  const className = TEXT_EDIT_CLASSES[type.toUpperCase() as keyof typeof TEXT_EDIT_CLASSES];
  return Array.from(document.querySelectorAll(`.${className}`)) as HTMLElement[];
}
