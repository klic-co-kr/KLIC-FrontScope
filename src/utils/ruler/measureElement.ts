import { ElementDimensions } from '../../types/ruler';

/**
 * 요소의 크기를 측정
 */
export function measureElement(element: HTMLElement): ElementDimensions {
  const rect = element.getBoundingClientRect();

  const width = rect.width;
  const height = rect.height;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
  };
}

/**
 * 요소의 실제 크기 측정 (스크롤 포함)
 */
export function measureElementFull(element: HTMLElement): ElementDimensions {
  const width = element.scrollWidth;
  const height = element.scrollHeight;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
  };
}

/**
 * 요소의 오프셋 크기 측정
 */
export function measureElementOffset(element: HTMLElement): ElementDimensions {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
  };
}
