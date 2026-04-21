/**
 * Grid Renderer Utilities
 *
 * 그리드 오버레이 렌더링 관련 유틸리티 함수들
 */

import type { GridOverlaySettings } from '../../../types/gridLayout';
import { calculateResponsiveColumns, calculateColumnPositions } from './gridCalculator';

/**
 * 그리드 HTML 생성
 */
export function generateGridHTML(
  settings: GridOverlaySettings,
  containerWidth: number
): string {
  const columns = calculateResponsiveColumns(settings, containerWidth);
  const positions = calculateColumnPositions(
    containerWidth,
    columns,
    settings.gap,
    parseFloat(settings.margin) || 0
  );

  const containerStyle = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9996;
  `;

  let html = `<div id="grid-overlay-container" style="${containerStyle}">`;

  // 컬럼 렌더링
  positions.forEach((pos, index) => {
    const columnStyle = `
      position: absolute;
      top: 0;
      left: ${pos.startX}px;
      width: ${pos.width}px;
      height: 100%;
      background-color: ${settings.color};
      opacity: ${settings.opacity};
    `;

    const numberLabel = settings.showColumnNumbers
      ? `<span style="position: absolute; top: 5px; left: 5px; font-size: 10px; color: ${settings.color}; opacity: 0.7; font-family: monospace; font-weight: bold;">${index + 1}</span>`
      : '';

    html += `
      <div class="grid-column" data-column="${index}" style="${columnStyle}">
        ${numberLabel}
      </div>
    `;
  });

  // 갭 렌더링
  positions.slice(0, -1).forEach((pos) => {
    const gapStyle = `
      position: absolute;
      top: 0;
      left: ${pos.endX}px;
      width: ${settings.gap}px;
      height: 100%;
      background-color: ${settings.color};
      opacity: ${settings.opacity * 0.3};
    `;

    html += `<div class="grid-gap" style="${gapStyle}"></div>`;
  });

  html += '</div>';

  return html;
}

/**
 * 그리드 SVG 패턴 생성 (dashed/dotted 스타일용)
 */
export function createGridPatternSVG(
  settings: GridOverlaySettings
): string {
  const patternId = `grid-pattern-${settings.style}`;

  let patternDef = '';

  switch (settings.style) {
    case 'dashed':
      patternDef = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="4" height="10">
          <rect width="2" height="10" fill="${settings.color}" fill-opacity="${settings.opacity}"/>
        </pattern>
      `;
      break;

    case 'dotted':
      patternDef = `
        <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="6" height="6">
          <circle cx="2" cy="2" r="1" fill="${settings.color}" fill-opacity="${settings.opacity}"/>
        </pattern>
      `;
      break;

    default:
      return '';
  }

  return `
    <svg width="0" height="0">
      <defs>${patternDef}</defs>
    </svg>
  `;
}

/**
 * 그리드 스타일 태그 생성
 */
export function createGridStyleElement(settings: GridOverlaySettings): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = 'grid-overlay-styles';

  const css = `
    #grid-overlay-container .grid-column {
      ${settings.style === 'dashed' ? `
        background-image: linear-gradient(to bottom, ${settings.color} 50%, transparent 50%);
        background-size: 1px 8px;
      ` : ''}
      ${settings.style === 'dotted' ? `
        background-image: radial-gradient(${settings.color} 1px, transparent 1px);
        background-size: ${settings.size || 4}px ${settings.size || 4}px;
        background-position: 0 0;
      ` : ''}
    }
  `;

  style.textContent = css;
  return style;
}

/**
 * 그리드 오버레이 생성 (DOM)
 */
export function createGridOverlay(settings: GridOverlaySettings): HTMLElement | null {
  // 기존 오버레이 제거
  removeGridOverlay();

  if (!settings.enabled) {
    return null;
  }

  // 스타일 태그 추가
  const styleElement = createGridStyleElement(settings);
  document.head.appendChild(styleElement);

  // 오버레이 생성
  const wrapper = document.createElement('div');
  wrapper.id = 'grid-overlay-wrapper';
  wrapper.innerHTML = generateGridHTML(settings, window.innerWidth);
  document.body.appendChild(wrapper);

  return wrapper;
}

/**
 * 그리드 오버레이 업데이트
 */
export function updateGridOverlay(settings: GridOverlaySettings): void {
  removeGridOverlay();
  if (settings.enabled) {
    createGridOverlay(settings);
  }
}

/**
 * 그리드 오버레이 제거
 */
export function removeGridOverlay(): void {
  // 스타일 제거
  const styleElement = document.getElementById('grid-overlay-styles');
  if (styleElement) {
    styleElement.remove();
  }

  // 컨테이너 제거
  const container = document.getElementById('grid-overlay-container');
  if (container) {
    container.remove();
  }

  // 래퍼 제거
  const wrapper = document.getElementById('grid-overlay-wrapper');
  if (wrapper) {
    wrapper.remove();
  }
}

/**
 * 그리드 오버레이 토글
 */
export function toggleGridOverlay(settings: GridOverlaySettings): void {
  if (settings.enabled) {
    createGridOverlay(settings);
  } else {
    removeGridOverlay();
  }
}

/**
 * 그리드 오버레이 존재 여부 확인
 */
export function hasGridOverlay(): boolean {
  return document.getElementById('grid-overlay-container') !== null;
}

/**
 * 그리드 오버레이 상태 가져오기
 */
export function getGridOverlayState(): {
  exists: boolean;
  visible: boolean;
  elementCount: number;
} {
  const container = document.getElementById('grid-overlay-container');

  return {
    exists: container !== null,
    visible: container !== null && container.style.display !== 'none',
    elementCount: container ? container.querySelectorAll('.grid-column').length : 0,
  };
}

/**
 * 그리드 컬럼 하이라이트
 */
export function highlightColumn(columnIndex: number, color: string = '#FF0000'): void {
  // 기존 하이라이트 제거
  clearColumnHighlights();

  const columns = document.querySelectorAll('.grid-column');
  const target = columns[columnIndex];

  if (target) {
    (target as HTMLElement).style.outline = `2px solid ${color}`;
    (target as HTMLElement).style.outlineOffset = '-2px';
    (target as HTMLElement).dataset.highlighted = 'true';
  }
}

/**
 * 컬럼 하이라이트 모두 제거
 */
export function clearColumnHighlights(): void {
  const highlighted = document.querySelectorAll('.grid-column[data-highlighted="true"]');
  highlighted.forEach((col) => {
    (col as HTMLElement).style.outline = '';
    (col as HTMLElement).style.outlineOffset = '';
    delete (col as HTMLElement).dataset.highlighted;
  });
}

/**
 * 컬럼 범위 하이라이트
 */
export function highlightColumnRange(
  startIndex: number,
  endIndex: number,
  color: string = '#FF0000'
): void {
  clearColumnHighlights();

  const columns = document.querySelectorAll('.grid-column');

  for (let i = startIndex; i <= endIndex && i < columns.length; i++) {
    const target = columns[i];
    if (target) {
      (target as HTMLElement).style.outline = `2px solid ${color}`;
      (target as HTMLElement).style.outlineOffset = '-2px';
      (target as HTMLElement).dataset.highlighted = 'true';
    }
  }
}

/**
 * 그리드 오버레이 숨김/표시
 */
export function setGridOverlayVisibility(visible: boolean): void {
  const container = document.getElementById('grid-overlay-container');
  if (container) {
    container.style.display = visible ? 'block' : 'none';
  }
}

/**
 * 컬럼 그리드 선 생성 (SVG용)
 */
export interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export function generateColumnGridLines(
  columns: number,
  containerWidth: number,
  containerHeight: number,
  margin: number | string,
  gap: number,
  color: string,
  lineWidth: number,
  style: 'solid' | 'dashed' | 'dotted'
): GridLine[] {
  const lines: GridLine[] = [];
  const numMargin = typeof margin === 'string' ? parseInt(margin) || 0 : margin;
  const columnWidth = (containerWidth - numMargin * 2 - gap * (columns - 1)) / columns;
  const startX = numMargin;

  // 수직 선 (컬럼 구분선)
  for (let i = 0; i <= columns; i++) {
    const x = startX + i * (columnWidth + gap);

    let strokeDasharray: string | undefined;
    if (style === 'dashed') {
      strokeDasharray = '8, 4';
    } else if (style === 'dotted') {
      strokeDasharray = '2, 3';
    }

    lines.push({
      x1: x,
      y1: 0,
      x2: x,
      y2: containerHeight,
      stroke: color,
      strokeWidth: lineWidth,
      strokeDasharray,
    });
  }

  return lines;
}
