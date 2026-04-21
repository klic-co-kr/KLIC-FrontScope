/**
 * Text Storage Utilities
 *
 * 요소의 원본 텍스트를 저장/복원하는 유틸리티 함수들
 */

/**
 * 요소의 원본 텍스트를 WeakMap에 저장
 * (요소가 제거되면 자동으로 가비지 컬렉션)
 */
const originalTexts = new WeakMap<Element, string>();
const originalHTML = new WeakMap<Element, string>();

/**
 * 원본 텍스트 저장
 *
 * @param element - 요소
 */
export function saveOriginalText(element: Element): void {
  if (!originalTexts.has(element)) {
    originalTexts.set(element, element.textContent || '');
  }
}

/**
 * 원본 HTML 저장 (포맷 보존 시)
 *
 * @param element - 요소
 */
export function saveOriginalHTML(element: Element): void {
  if (!originalHTML.has(element)) {
    originalHTML.set(element, element.innerHTML);
  }
}

/**
 * 원본 텍스트 가져오기
 *
 * @param element - 요소
 * @returns 원본 텍스트 또는 undefined
 */
export function getOriginalText(element: Element): string | undefined {
  return originalTexts.get(element);
}

/**
 * 원본 HTML 가져오기
 *
 * @param element - 요소
 * @returns 원본 HTML 또는 undefined
 */
export function getOriginalHTML(element: Element): string | undefined {
  return originalHTML.get(element);
}

/**
 * 원본 텍스트로 복원
 *
 * @param element - 요소
 * @returns 복원 성공 여부
 */
export function restoreOriginalText(element: Element): boolean {
  const original = originalTexts.get(element);
  if (original !== undefined) {
    element.textContent = original;
    originalTexts.delete(element);
    return true;
  }
  return false;
}

/**
 * 원본 HTML로 복원
 *
 * @param element - 요소
 * @returns 복원 성공 여부
 */
export function restoreOriginalHTML(element: Element): boolean {
  const original = originalHTML.get(element);
  if (original !== undefined) {
    element.innerHTML = original;
    originalHTML.delete(element);
    return true;
  }
  return false;
}

/**
 * 텍스트가 변경되었는지 확인
 *
 * @param element - 요소
 * @returns 변경 여부
 */
export function isTextChanged(element: Element): boolean {
  const original = originalTexts.get(element);
  if (original === undefined) return false;
  return original !== element.textContent;
}

/**
 * 변경 사항 가져오기
 *
 * @param element - 요소
 * @returns 변경 정보
 */
export function getChanges(element: Element): {
  before: string;
  after: string;
  changed: boolean;
} {
  const before = getOriginalText(element) || '';
  const after = element.textContent || '';
  return {
    before,
    after,
    changed: before !== after,
  };
}

/**
 * 모든 저장된 원본 제거
 * WeakMap은 자동으로 가비지 컬렉션되므로 별도 처리 불필요
 */
export function clearAllOriginals(): void {
  // WeakMap은 자동으로 가비지 컬렉션됨
}
