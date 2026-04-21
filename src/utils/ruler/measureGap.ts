/**
 * 두 요소 간 간격 측정
 */
export function measureGap(
  element1: HTMLElement,
  element2: HTMLElement,
  direction: 'horizontal' | 'vertical' | 'both' = 'both'
): number | { horizontal: number; vertical: number } {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  if (direction === 'horizontal') {
    return calculateHorizontalGap(rect1, rect2);
  }

  if (direction === 'vertical') {
    return calculateVerticalGap(rect1, rect2);
  }

  return {
    horizontal: calculateHorizontalGap(rect1, rect2),
    vertical: calculateVerticalGap(rect1, rect2),
  };
}

/**
 * 수평 간격 계산
 */
function calculateHorizontalGap(rect1: DOMRect, rect2: DOMRect): number {
  // rect1이 왼쪽에 있는 경우
  if (rect1.right <= rect2.left) {
    return rect2.left - rect1.right;
  }

  // rect2가 왼쪽에 있는 경우
  if (rect2.right <= rect1.left) {
    return rect1.left - rect2.right;
  }

  // 겹치는 경우
  return 0;
}

/**
 * 수직 간격 계산
 */
function calculateVerticalGap(rect1: DOMRect, rect2: DOMRect): number {
  // rect1이 위에 있는 경우
  if (rect1.bottom <= rect2.top) {
    return rect2.top - rect1.bottom;
  }

  // rect2가 위에 있는 경우
  if (rect2.bottom <= rect1.top) {
    return rect1.top - rect2.bottom;
  }

  // 겹치는 경우
  return 0;
}

/**
 * 요소가 겹치는지 확인
 */
export function isOverlapping(element1: HTMLElement, element2: HTMLElement): boolean {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}
