/**
 * Editable Control Utilities
 *
 * contentEditable 제어 관련 유틸리티 함수들
 */

/**
 * 요소를 편집 가능하게 만들기
 *
 * @param element - HTML 요소
 */
export function makeEditable(element: HTMLElement): void {
  // 원본 contentEditable 상태 저장 (복원용)
  if (element.dataset.originalContentEditable === undefined) {
    element.dataset.originalContentEditable = element.getAttribute('contenteditable') || '';
  }

  element.contentEditable = 'true';
  element.focus();

  // 텍스트 전체 선택
  selectAllText(element);

  // spellcheck 비활성화 (선택적)
  element.spellcheck = false;

  // 편집 시작 시간 기록
  element.dataset.editStartTime = Date.now().toString();

  // Enter 키로 줄바꿈 허용 (기본 동작)
  element.style.whiteSpace = 'pre-wrap';
}

/**
 * 편집 불가능하게 만들기
 *
 * @param element - HTML 요소
 */
export function makeUneditable(element: HTMLElement): void {
  // 원본 contentEditable 상태 복원 (기본값 'inherit'으로 돌아감)
  const original = element.dataset.originalContentEditable;
  if (original !== undefined) {
    if (original === '') {
      // 원래 contenteditable 속성이 없었던 경우 → 속성 제거
      element.removeAttribute('contenteditable');
    } else {
      element.setAttribute('contenteditable', original);
    }
    delete element.dataset.originalContentEditable;
  } else {
    // 저장된 원본이 없으면 속성 자체를 제거 (기본 상태 복원)
    element.removeAttribute('contenteditable');
  }

  element.blur();

  // 선택 해제
  window.getSelection()?.removeAllRanges();

  // spellcheck 복원
  element.spellcheck = true;

  // 편집 시간 계산
  if (element.dataset.editStartTime) {
    const duration = Date.now() - parseInt(element.dataset.editStartTime);
    element.dataset.editDuration = duration.toString();
    delete element.dataset.editStartTime;
  }

  element.style.whiteSpace = '';
}

/**
 * 요소가 편집 가능한 상태인지 확인
 *
 * @param element - 요소
 * @returns 편집 가능 여부
 */
export function isEditable(element: HTMLElement): boolean {
  return element.contentEditable === 'true';
}

/**
 * 텍스트 전체 선택
 *
 * @param element - 요소
 */
export function selectAllText(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * 커서를 텍스트 끝으로 이동
 *
 * @param element - 요소
 */
export function moveCursorToEnd(element: HTMLElement): void {
  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(element);
  range.collapse(false); // 끝으로

  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * 커서를 텍스트 시작으로 이동
 *
 * @param element - 요소
 */
export function moveCursorToStart(element: HTMLElement): void {
  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(element);
  range.collapse(true); // 시작으로

  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * 현재 커서 위치 가져오기
 *
 * @param element - 요소
 * @returns 커서 위치
 */
export function getCursorPosition(element: HTMLElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange.toString().length;
}

/**
 * 커서를 특정 위치로 이동
 *
 * @param element - 요소
 * @param position - 위치
 */
export function setCursorPosition(
  element: HTMLElement,
  position: number
): void {
  const range = document.createRange();
  const selection = window.getSelection();

  let currentPos = 0;
  let found = false;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textLength = node.textContent?.length || 0;

    if (currentPos + textLength >= position) {
      const offset = position - currentPos;
      range.setStart(node, offset);
      range.collapse(true);
      found = true;
      break;
    }

    currentPos += textLength;
  }

  if (found) {
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}

/**
 * 편집 가능한 요소에 입력 제한 적용
 *
 * @param element - 요소
 * @param constraints - 제약 조건
 */
export function applyInputConstraints(
  element: HTMLElement,
  constraints: {
    maxLength?: number;
    allowNewlines?: boolean;
    allowHTML?: boolean;
  }
): void {
  const { maxLength, allowNewlines = true, allowHTML = false } = constraints;

  element.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;

    // maxLength 체크
    if (maxLength && target.textContent && target.textContent.length > maxLength) {
      target.textContent = target.textContent.substring(0, maxLength);
      moveCursorToEnd(target);
    }

    // HTML 제거
    if (!allowHTML && target.innerHTML !== target.textContent) {
      const text = target.textContent || '';
      target.textContent = text;
      moveCursorToEnd(target);
    }
  });

  element.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;

    // Enter 키 제한
    if (!allowNewlines && e.key === 'Enter') {
      e.preventDefault();
    }

    // maxLength 도달 시 추가 입력 차단
    if (
      maxLength &&
      target.textContent &&
      target.textContent.length >= maxLength &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    ) {
      e.preventDefault();
    }
  });

  // 붙여넣기 시 HTML 제거
  if (!allowHTML) {
    element.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        document.execCommand('insertText', false, text);
      }
    });
  }
}

/**
 * 텍스트 선택하기
 *
 * @param element - 요소
 * @param start - 시작 위치
 * @param end - 끝 위치
 */
export function selectTextRange(
  element: HTMLElement,
  start: number,
  end: number
): void {
  const range = document.createRange();
  const selection = window.getSelection();

  let currentPos = 0;
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textLength = node.textContent?.length || 0;

    if (!startNode && currentPos + textLength >= start) {
      startNode = node;
      startOffset = start - currentPos;
    }

    if (!endNode && currentPos + textLength >= end) {
      endNode = node;
      endOffset = end - currentPos;
      break;
    }

    currentPos += textLength;
  }

  if (startNode && endNode) {
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}
