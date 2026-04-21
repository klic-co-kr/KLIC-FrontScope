/**
 * Viewport 기준 위치 반환
 */
export function getBoundingRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Document 기준 절대 위치 반환
 */
export function getAbsolutePosition(element: HTMLElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * 요소의 중심점 반환
 */
export function getCenterPoint(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * 요소가 Viewport 내에 있는지 확인
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * 요소가 Viewport와 겹치는지 확인
 */
export function intersectsViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}
