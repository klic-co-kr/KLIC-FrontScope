/**
 * Animation Highlighter
 *
 * 애니메이션 요소 하이라이트 기능 제공
 */

/**
 * 하이라이트 오버레이 엘리먼트
 */
let overlayElement: HTMLElement | null = null;

/**
 * 하이라이트 정보
 */
interface HighlightInfo {
  element: Element;
  highlight: HTMLElement;
  color: string;
  timestamp: number;
}

const activeHighlights = new Map<string, HighlightInfo>();

/**
 * 하이라이트 오버레이 생성
 */
function createOverlay(): HTMLElement {
  if (overlayElement) {
    // 이미 존재하면 반환
    return overlayElement;
  }

  overlayElement = document.createElement('div');
  overlayElement.id = 'animation-highlight-overlay';
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
    display: block;
  `;

  document.body.appendChild(overlayElement);
  return overlayElement;
}

/**
 * 하이라이트 오버레이 제거
 */
export function removeOverlay(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  activeHighlights.clear();
}

/**
 * 애니메이션 요소 하이라이트
 */
export function highlightAnimation(
  element: Element,
  options: {
    color?: string;
    duration?: number;
    label?: string;
  } = {}
): void {
  const {
    color = '#10B981',
    duration = 2000,
    label = '',
  } = options;

  const rect = element.getBoundingClientRect();
  const overlay = createOverlay();

  const highlight = document.createElement('div');
  const id = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  highlight.id = id;
  highlight.style.cssText = `
    position: absolute;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid ${color};
    background: ${color}20;
    box-shadow: 0 0 10px ${color}40, inset 0 0 10px ${color}20;
    transition: all 0.2s ease;
    border-radius: 4px;
  `;

  // 라벨 추가
  if (label) {
    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      position: absolute;
      top: -24px;
      left: 0;
      background: ${color};
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      font-family: system-ui, sans-serif;
      border-radius: 3px;
      white-space: nowrap;
      font-weight: 500;
    `;
    highlight.appendChild(labelElement);
  }

  overlay.appendChild(highlight);

  // 하이라이트 정보 저장
  activeHighlights.set(id, {
    element,
    highlight,
    color,
    timestamp: Date.now(),
  });

  // 지정된 시간 후 제거
  setTimeout(() => {
    removeHighlight(id);
  }, duration);
}

/**
 * 하이라이트 제거
 */
export function removeHighlight(id: string): void {
  const info = activeHighlights.get(id);
  if (info) {
    info.highlight.remove();
    activeHighlights.delete(id);
  }
}

/**
 * 모든 하이라이트 제거
 */
export function clearHighlights(): void {
  for (const [, info] of activeHighlights) {
    info.highlight.remove();
  }
  activeHighlights.clear();
}

/**
 * 선택자로 모든 애니메이션 하이라이트
 */
export function highlightAllAnimations(
  selectors: string[],
  options: {
    color?: string;
    duration?: number;
  } = {}
): void {
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of Array.from(elements)) {
      highlightAnimation(element, {
        ...options,
        label: selector,
      });
    }
  }
}

/**
 * 요소에 하이라이트가 있는지 확인
 */
export function hasHighlight(element: Element): boolean {
  for (const info of activeHighlights.values()) {
    if (info.element === element) {
      return true;
    }
  }
  return false;
}

/**
 * 요소의 하이라이트 제거
 */
export function removeHighlightByElement(element: Element): void {
  for (const [id, info] of activeHighlights) {
    if (info.element === element) {
      removeHighlight(id);
    }
  }
}

/**
 * 호버 시 하이라이트 활성화
 */
export function enableHoverHighlight(
  options: {
    color?: string;
    duration?: number;
    showLabel?: boolean;
  } = {}
): () => void {
  const { color = '#F59E0B', duration = 0, showLabel = false } = options;

  const handleMouseOver = (event: MouseEvent) => {
    const target = event.target as Element;
    const styles = window.getComputedStyle(target);

    const hasAnimation =
      (styles.animation && styles.animation !== 'none') ||
      (styles.transition && styles.transition !== 'none');

    if (hasAnimation) {
      const animationName = styles.animationName || styles.transitionProperty || 'animation';
      highlightAnimation(target, {
        color,
        duration: duration || 2000,
        label: showLabel ? animationName : '',
      });
    }
  };

  const handleMouseOut = (event: MouseEvent) => {
    const target = event.target as Element;
    removeHighlightByElement(target);
  };

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);

  // 정리 함수 반환
  return () => {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
  };
}

/**
 * 호버 시 하이라이트 비활성화
 */
export function disableHoverHighlight(): void {
  // 이벤트 리스너는 enableHoverHighlight에서 반환된 함수로 제거해야 함
  clearHighlights();
}

/**
 * 애니메이션 타입별 색상 반환
 */
export function getAnimationColor(
  type: 'css' | 'js',
  impact?: 'low' | 'medium' | 'high'
): string {
  if (type === 'css') {
    switch (impact) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  } else {
    // JS 애니메이션
    return '#8B5CF6';
  }
}

/**
 * 하이라이트된 요소들의 목록 반환
 */
export function getHighlightedElements(): Element[] {
  return Array.from(activeHighlights.values()).map((info) => info.element);
}

/**
 * 하이라이트 밀리초 단위로 깜빡이기 효과
 */
export function pulseHighlight(
  element: Element,
  options: {
    color?: string;
    count?: number;
    interval?: number;
  } = {}
): void {
  const { color = '#10B981', count = 3, interval = 300 } = options;

  let pulseCount = 0;

  const pulse = () => {
    if (pulseCount >= count * 2) {
      return;
    }

    const isShowing = pulseCount % 2 === 0;

    if (isShowing) {
      highlightAnimation(element, { color, duration: interval - 50 });
    } else {
      removeHighlightByElement(element);
    }

    pulseCount++;
    setTimeout(pulse, interval);
  };

  pulse();
}

/**
 * 특정 영역의 모든 애니메이션 요소 하이라이트
 */
export function highlightAnimationsInArea(
  rect: { x: number; y: number; width: number; height: number },
  options: {
    color?: string;
    duration?: number;
  } = {}
): void {
  const { color = '#10B981', duration = 2000 } = options;

  const elements = document.elementsFromPoint(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2
  );

  for (const element of elements) {
    const styles = window.getComputedStyle(element);
    const hasAnimation =
      (styles.animation && styles.animation !== 'none') ||
      (styles.transition && styles.transition !== 'none');

    if (hasAnimation) {
      highlightAnimation(element, { color, duration });
    }
  }
}

/**
 * 하이라이트 스타일 업데이트
 */
export function updateHighlightStyle(
  id: string,
  styles: Partial<{
    color: string;
    borderWidth: number;
    backgroundColor: string;
  }>
): void {
  const info = activeHighlights.get(id);
  if (!info) return;

  const highlight = info.highlight;

  if (styles.color) {
    highlight.style.borderColor = styles.color;
    highlight.style.boxShadow = `0 0 10px ${styles.color}40, inset 0 0 10px ${styles.color}20`;
  }

  if (styles.borderWidth !== undefined) {
    highlight.style.borderWidth = `${styles.borderWidth}px`;
  }

  if (styles.backgroundColor) {
    highlight.style.backgroundColor = styles.backgroundColor;
  }
}
