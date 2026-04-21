import { RULER_CLASSES } from '../../constants/classes';

/**
 * 요소 하이라이트 (측정 가능 표시)
 */
export function highlightElement(
  element: HTMLElement,
  type: 'hover' | 'measuring' | 'measured' = 'hover'
): void {
  const className = type === 'hover'
    ? RULER_CLASSES.HOVER
    : type === 'measuring'
    ? RULER_CLASSES.MEASURING
    : RULER_CLASSES.MEASURED;

  element.classList.add(className);
}

/**
 * 하이라이트 제거
 */
export function removeHighlight(
  element: HTMLElement,
  type?: 'hover' | 'measuring' | 'measured'
): void {
  if (type) {
    const className = type === 'hover'
      ? RULER_CLASSES.HOVER
      : type === 'measuring'
      ? RULER_CLASSES.MEASURING
      : RULER_CLASSES.MEASURED;

    element.classList.remove(className);
  } else {
    element.classList.remove(
      RULER_CLASSES.HOVER,
      RULER_CLASSES.MEASURING,
      RULER_CLASSES.MEASURED
    );
  }
}

/**
 * 모든 하이라이트 제거
 */
export function removeAllHighlights(): void {
  const elements = document.querySelectorAll(
    `.${RULER_CLASSES.HOVER}, .${RULER_CLASSES.MEASURING}, .${RULER_CLASSES.MEASURED}`
  );

  elements.forEach((element) => {
    element.classList.remove(
      RULER_CLASSES.HOVER,
      RULER_CLASSES.MEASURING,
      RULER_CLASSES.MEASURED
    );
  });
}

/**
 * 선택자로 요소 하이라이트
 */
export function highlightElementBySelector(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement;

  if (element) {
    highlightElement(element, 'measured');

    // 3초 후 자동 제거
    setTimeout(() => {
      removeHighlight(element, 'measured');
    }, 3000);
  }
}
