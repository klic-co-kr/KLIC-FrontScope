/**
 * Flexbox Analyzer Utilities
 *
 * 플렉스박스 분석 유틸리티
 */

import type { FlexInfo } from '../../types/cssScan';

/**
 * 플렉스박스 정보 추출
 */
export function extractFlexInfo(element: HTMLElement): FlexInfo {
  const computedStyle = window.getComputedStyle(element);

  const display = computedStyle.getPropertyValue('display');
  const enabled = display === 'flex' || display === 'inline-flex';

  return {
    enabled,
    direction: computedStyle.getPropertyValue('flex-direction'),
    wrap: computedStyle.getPropertyValue('flex-wrap'),
    justifyContent: computedStyle.getPropertyValue('justify-content'),
    alignItems: computedStyle.getPropertyValue('align-items'),
    alignContent: computedStyle.getPropertyValue('align-content'),
    gap: computedStyle.getPropertyValue('gap'),
    rowGap: computedStyle.getPropertyValue('row-gap'),
    columnGap: computedStyle.getPropertyValue('column-gap'),
  };
}

/**
 * 플렉스 아이템 정보 추출
 */
export function extractFlexItemInfo(element: HTMLElement): {
  isFlexItem: boolean;
  flexContainer: HTMLElement | null;
  grow: string;
  shrink: string;
  basis: string;
  alignSelf: string;
  order: string;
} {
  const parent = element.parentElement;
  const isFlexItem = parent ? isFlexContainer(parent) : false;

  if (!isFlexItem || !parent) {
    return {
      isFlexItem: false,
      flexContainer: null,
      grow: '0',
      shrink: '1',
      basis: 'auto',
      alignSelf: 'auto',
      order: '0',
    };
  }

  const computedStyle = window.getComputedStyle(element);

  return {
    isFlexItem: true,
    flexContainer: parent,
    grow: computedStyle.getPropertyValue('flex-grow'),
    shrink: computedStyle.getPropertyValue('flex-shrink'),
    basis: computedStyle.getPropertyValue('flex-basis'),
    alignSelf: computedStyle.getPropertyValue('align-self'),
    order: computedStyle.getPropertyValue('order'),
  };
}

/**
 * 플렉스 컨테이너인지 확인
 */
export function isFlexContainer(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const display = computedStyle.getPropertyValue('display');
  return display === 'flex' || display === 'inline-flex';
}

/**
 * 페이지의 모든 플렉스 컨테이너 찾기
 */
export function findFlexContainers(): HTMLElement[] {
  const elements = document.querySelectorAll('*');
  const flexContainers: HTMLElement[] = [];

  for (const element of Array.from(elements)) {
    if (element instanceof HTMLElement && isFlexContainer(element)) {
      flexContainers.push(element);
    }
  }

  return flexContainers;
}

/**
 * 플렉스 컨테이너 시각화 오버레이 생성
 */
export function createFlexOverlay(
  element: HTMLElement,
  container: HTMLElement
): {
    overlay: HTMLElement;
    update: () => void;
    remove: () => void;
  } {
  const flexInfo = extractFlexInfo(element);
  const rect = element.getBoundingClientRect();
  const children = Array.from(element.children) as HTMLElement[];

  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.className = 'css-scan-flex-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    pointer-events: none;
    z-index: 2147483646;
    border: 2px dashed #60a5fa;
    background: rgba(96, 165, 250, 0.1);
  `;

  // 자식 요소 표시
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childRect = child.getBoundingClientRect();

    const childOverlay = document.createElement('div');
    childOverlay.className = 'css-scan-flex-item';
    childOverlay.dataset.index = i.toString();
    childOverlay.style.cssText = `
      position: absolute;
      top: ${childRect.top + window.scrollY - (rect.top + window.scrollY)}px;
      left: ${childRect.left + window.scrollX - (rect.left + window.scrollX)}px;
      width: ${childRect.width}px;
      height: ${childRect.height}px;
      background: rgba(96, 165, 250, 0.3);
      border: 1px solid #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e40af;
      font-size: 12px;
      font-weight: bold;
    `;
    childOverlay.textContent = i.toString();

    overlay.appendChild(childOverlay);
  }

  // 라벨
  const label = document.createElement('div');
  label.className = 'css-scan-flex-label';
  label.style.cssText = `
    position: absolute;
    top: -25px;
    left: 0;
    background: #3b82f6;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    white-space: nowrap;
  `;
  label.textContent = `flex: ${flexInfo.direction} | ${flexInfo.justifyContent} ${flexInfo.alignItems}`;
  overlay.appendChild(label);

  container.appendChild(overlay);

  return {
    overlay,
    update: () => {
      updateFlexOverlay(element, overlay);
    },
    remove: () => {
      overlay.remove();
    },
  };
}

/**
 * 플렉스 오버레이 업데이트
 */
function updateFlexOverlay(element: HTMLElement, overlay: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const children = Array.from(element.children) as HTMLElement[];

  // 메인 오버레이 업데이트
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  // 자식 요소 오버레이 업데이트
  const itemOverlays = overlay.querySelectorAll('.css-scan-flex-item');

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childRect = child.getBoundingClientRect();
    const itemOverlay = itemOverlays[i] as HTMLElement;

    if (itemOverlay) {
      itemOverlay.style.top = `${childRect.top + window.scrollY - (rect.top + window.scrollY)}px`;
      itemOverlay.style.left = `${childRect.left + window.scrollX - (rect.left + window.scrollX)}px`;
      itemOverlay.style.width = `${childRect.width}px`;
      itemOverlay.style.height = `${childRect.height}px`;
      itemOverlay.textContent = i.toString();
    }
  }
}

/**
 * 플렉스 속성을 CSS로 내보내기
 */
export function flexToCSS(flexInfo: FlexInfo, includePrefixes: boolean = false): string {
  const lines: string[] = [];

  if (includePrefixes) {
    lines.push('display: -webkit-box;');
    lines.push('display: -ms-flexbox;');
  }
  lines.push('display: flex;');

  if (flexInfo.direction !== 'row') {
    if (includePrefixes) {
      lines.push(`-webkit-box-orient: ${flexInfo.direction.includes('column') ? 'vertical' : 'horizontal'};`);
      lines.push(`-webkit-box-direction: ${flexInfo.direction.includes('reverse') ? 'reverse' : 'normal'};`);
      lines.push(`-ms-flex-direction: ${flexInfo.direction};`);
    }
    lines.push(`flex-direction: ${flexInfo.direction};`);
  }

  if (flexInfo.wrap !== 'nowrap') {
    if (includePrefixes) {
      lines.push(`-ms-flex-wrap: ${flexInfo.wrap};`);
    }
    lines.push(`flex-wrap: ${flexInfo.wrap};`);
  }

  if (flexInfo.justifyContent !== 'flex-start') {
    if (includePrefixes) {
      lines.push(`-webkit-box-pack: ${convertJustifyContent(flexInfo.justifyContent)};`);
      lines.push(`-ms-flex-pack: ${convertJustifyContent(flexInfo.justifyContent)};`);
    }
    lines.push(`justify-content: ${flexInfo.justifyContent};`);
  }

  if (flexInfo.alignItems !== 'normal') {
    if (includePrefixes) {
      lines.push(`-webkit-box-align: ${convertAlignItems(flexInfo.alignItems)};`);
      lines.push(`-ms-flex-align: ${convertAlignItems(flexInfo.alignItems)};`);
    }
    lines.push(`align-items: ${flexInfo.alignItems};`);
  }

  if (flexInfo.alignContent !== 'normal') {
    if (includePrefixes) {
      lines.push(`-ms-flex-line-pack: ${flexInfo.alignContent};`);
    }
    lines.push(`align-content: ${flexInfo.alignContent};`);
  }

  if (flexInfo.gap !== 'normal') {
    if (includePrefixes) {
      lines.push(`gap: ${flexInfo.gap};`);
    }
  }

  return lines.join('\n');
}

/**
 * justify-content 변환 (오래된 브라우저 호환)
 */
function convertJustifyContent(value: string): string {
  const map: Record<string, string> = {
    'flex-start': 'start',
    'flex-end': 'end',
    'space-between': 'justify',
    'space-around': 'distribute',
  };
  return map[value] || value;
}

/**
 * align-items 변환 (오래된 브라우저 호환)
 */
function convertAlignItems(value: string): string {
  const map: Record<string, string> = {
    'flex-start': 'start',
    'flex-end': 'end',
  };
  return map[value] || value;
}

/**
 * 그리드 레이아웃과 플렉스박스 비교 추천
 */
export function recommendLayout(
  element: HTMLElement
): {
    current: 'flex' | 'grid' | 'block' | 'inline' | 'none';
    recommendation: 'flex' | 'grid' | 'keep';
    reason: string;
  } {
  const computedStyle = window.getComputedStyle(element);
  const display = computedStyle.getPropertyValue('display');
  const children = Array.from(element.children);

  // 현재 레이아웃
  let current: 'flex' | 'grid' | 'block' | 'inline' | 'none';
  if (display === 'flex' || display === 'inline-flex') current = 'flex';
  else if (display === 'grid' || display === 'inline-grid') current = 'grid';
  else if (display === 'none') current = 'none';
  else if (display === 'inline' || display === 'inline-block') current = 'inline';
  else current = 'block';

  // 추천
  if (children.length === 0) {
    return { current, recommendation: 'keep', reason: 'No children to layout' };
  }

  if (current === 'grid') {
    return { current, recommendation: 'keep', reason: 'Already using Grid' };
  }

  // 2D 레이아웃 (행과 열 모두 필요)
  const hasMultipleRows = children.length > 3;
  const hasNestedFlex = Array.from(element.querySelectorAll(':scope > * > *')).length > 0;

  if (hasMultipleRows && hasNestedFlex) {
    return {
      current,
      recommendation: 'grid',
      reason: 'Consider Grid for 2D layout with multiple rows and columns',
    };
  }

  // 1D 레이아웃 (행 또는 열)
  if (current !== 'flex') {
    return {
      current,
      recommendation: 'flex',
      reason: 'Use Flexbox for 1D layout (row or column)',
    };
  }

  return { current, recommendation: 'keep', reason: 'Current layout is appropriate' };
}
