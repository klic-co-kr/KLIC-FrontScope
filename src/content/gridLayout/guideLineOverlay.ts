/**
 * Guide Line Overlay
 *
 * 가이드라인 오버레이 주입 및 관리
 */

import type { GuideLine } from '../../types/gridLayout';
import type { CSSProperties } from 'react';

const containerId = 'guide-lines-container';

/**
 * 가이드라인 컨테이너 생성
 */
function createContainer(): HTMLElement {
  const existing = document.getElementById(containerId);
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = containerId;
  container.className = 'klic-guide-lines-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9998;
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * 가이드라인 스타일 생성
 */
function generateGuideLineStyle(guide: GuideLine): CSSProperties {
  const baseStyle: CSSProperties = {
    position: 'absolute',
    backgroundColor: guide.color,
    zIndex: guide.visible ? 1000 : -1,
    pointerEvents: guide.locked ? 'none' : 'auto',
    cursor: guide.locked ? 'default' : 'move',
    opacity: guide.visible ? (guide.opacity ?? 1) : 0,
    transition: 'opacity 0.2s',
  };

  if (guide.type === 'horizontal') {
    return {
      ...baseStyle,
      left: '0',
      top: `${guide.position}px`,
      width: '100%',
      height: `${guide.width}px`,
      borderTopStyle: guide.style,
      borderTopWidth: `${guide.width}px`,
      borderTopColor: guide.color,
    };
  } else {
    return {
      ...baseStyle,
      left: `${guide.position}px`,
      top: '0',
      width: `${guide.width}px`,
      height: '100%',
      borderLeftStyle: guide.style,
      borderLeftWidth: `${guide.width}px`,
      borderLeftColor: guide.color,
    };
  }
}

/**
 * 가이드라인 요소 생성
 */
function createGuideLineElement(guide: GuideLine): HTMLElement {
  const element = document.createElement('div');
  element.id = `guide-${guide.id}`;
  element.className = `klic-guide-line guide-line guide-line-${guide.type}`;
  element.dataset.guideId = guide.id;
  element.draggable = true;

  const styles = generateGuideLineStyle(guide);
  Object.assign(element.style, styles);

  // 잠금 상태 표시
  if (guide.locked) {
    element.classList.add('locked');
    element.dataset.locked = 'true';
  }

  // 표시 여부
  if (!guide.visible) {
    element.style.display = 'none';
  }

  // 핸들 요소 추가
  const handle = document.createElement('div');
  handle.className = 'guide-line-handle';
  handle.style.cssText = `
    position: absolute;
    width: 12px;
    height: 12px;
    background: ${guide.color};
    border: 2px solid white;
    border-radius: 50%;
    pointer-events: auto;
    cursor: ${guide.type === 'horizontal' ? 'ns-resize' : 'ew-resize'};
    opacity: 0;
    transition: opacity 0.15s;
  `;

  if (guide.type === 'horizontal') {
    handle.style.left = 'calc(50% - 6px)';
    handle.style.top = '-6px';
  } else {
    handle.style.left = '-6px';
    handle.style.top = 'calc(50% - 6px)';
  }

  element.appendChild(handle);

  // 호버 시 핸들 표시
  element.addEventListener('mouseenter', () => {
    if (!guide.locked && guide.visible) {
      handle.style.opacity = '1';
    }
  });

  element.addEventListener('mouseleave', () => {
    handle.style.opacity = '0';
  });

  return element;
}

/**
 * 모든 가이드라인 주입
 */
export function injectGuideLines(guides: GuideLine[]): void {
  const container = createContainer();

  for (const guide of guides) {
    const element = createGuideLineElement(guide);
    container.appendChild(element);
  }
}

/**
 * 가이드라인 업데이트
 */
export function updateGuideLine(guide: GuideLine): void {
  const element = document.getElementById(`guide-${guide.id}`);
  if (element) {
    const styles = generateGuideLineStyle(guide);
    Object.assign(element.style, styles);

    element.style.display = guide.visible ? '' : 'none';
    element.classList.toggle('locked', guide.locked);
    element.dataset.locked = guide.locked ? 'true' : 'false';
  }
}

/**
 * 단일 가이드라인 주입
 */
export function injectSingleGuideLine(guide: GuideLine): void {
  let container = document.getElementById(containerId);
  if (!container) {
    container = createContainer();
  }

  const element = createGuideLineElement(guide);
  container.appendChild(element);
}

/**
 * 모든 가이드라인 제거
 */
export function removeGuideLines(): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.remove();
  }
}

/**
 * 특정 가이드라인 제거
 */
export function removeGuideLine(guideId: string): void {
  const element = document.getElementById(`guide-${guideId}`);
  if (element) {
    element.remove();
  }

  // 컨테이너가 비어있으면 제거
  const container = document.getElementById(containerId);
  if (container && container.children.length === 0) {
    container.remove();
  }
}

/**
 * 가이드라인 표시/숨김
 */
export function setGuideLineVisibility(guideId: string, visible: boolean): void {
  const element = document.getElementById(`guide-${guideId}`);
  if (element) {
    element.style.display = visible ? '' : 'none';
  }
}

/**
 * 모든 가이드라인 표시/숨김
 */
export function setAllGuideLinesVisibility(visible: boolean): void {
  const container = document.getElementById(containerId);
  if (container) {
    const guides = container.querySelectorAll('.guide-line');
    guides.forEach(guide => {
      (guide as HTMLElement).style.display = visible ? '' : 'none';
    });
  }
}

/**
 * 가이드라인 위치 가져오기
 */
export function getGuideLinePosition(guideId: string): number | null {
  const element = document.getElementById(`guide-${guideId}`);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return rect.left;
}
