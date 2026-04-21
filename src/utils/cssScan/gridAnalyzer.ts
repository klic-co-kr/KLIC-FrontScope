/**
 * Grid Analyzer Utilities
 *
 * CSS 그리드 분석 유틸리티
 */

import type { GridInfo } from '../../types/cssScan';

/**
 * 그리드 정보 추출
 */
export function extractGridInfo(element: HTMLElement): GridInfo {
  const computedStyle = window.getComputedStyle(element);

  const display = computedStyle.getPropertyValue('display');
  const enabled = display === 'grid' || display === 'inline-grid';

  return {
    enabled,
    templateColumns: computedStyle.getPropertyValue('grid-template-columns'),
    templateRows: computedStyle.getPropertyValue('grid-template-rows'),
    templateAreas: computedStyle.getPropertyValue('grid-template-areas'),
    columns: computedStyle.getPropertyValue('grid-auto-columns'),
    rows: computedStyle.getPropertyValue('grid-auto-rows'),
    areas: computedStyle.getPropertyValue('grid-template-areas'),
    autoFlow: computedStyle.getPropertyValue('grid-auto-flow'),
    autoColumns: computedStyle.getPropertyValue('grid-auto-columns'),
    autoRows: computedStyle.getPropertyValue('grid-auto-rows'),
    gap: computedStyle.getPropertyValue('gap'),
    rowGap: computedStyle.getPropertyValue('row-gap'),
    columnGap: computedStyle.getPropertyValue('column-gap'),
  };
}

/**
 * 그리드 컨테이너인지 확인
 */
export function isGridContainer(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const display = computedStyle.getPropertyValue('display');
  return display === 'grid' || display === 'inline-grid';
}

/**
 * 페이지의 모든 그리드 컨테이너 찾기
 */
export function findGridContainers(): HTMLElement[] {
  const elements = document.querySelectorAll('*');
  const gridContainers: HTMLElement[] = [];

  for (const element of Array.from(elements)) {
    if (element instanceof HTMLElement && isGridContainer(element)) {
      gridContainers.push(element);
    }
  }

  return gridContainers;
}

/**
 * 그리드 크기 파싱
 */
export function parseGridTrackSize(trackValue: string): Array<{
  value: string;
  minmax?: { min: string; max: string };
  repeat?: { count: number | 'auto-fit' | 'auto-fill'; size: string };
}> {
  const tracks: Array<{
    value: string;
    minmax?: { min: string; max: string };
    repeat?: { count: number | 'auto-fit' | 'auto-fill'; size: string };
  }> = [];

  // repeat() 파싱
  const repeatRegex = /repeat\(([^)]+)\)/g;
  let match;

  while ((match = repeatRegex.exec(trackValue)) !== null) {
    const repeatContent = match[1];
    const parts = repeatContent.split(',');

    if (parts.length >= 2) {
      const count = parts[0].trim();
      const size = parts.slice(1).join(',').trim();

      tracks.push({
        value: '',
        repeat: {
          count: count === 'auto-fit' || count === 'auto-fill' ? count : parseInt(count),
          size,
        },
      });
    }
  }

  // minmax() 파싱
  const minmaxRegex = /minmax\(([^,]+),\s*([^)]+)\)/g;
  while ((match = minmaxRegex.exec(trackValue)) !== null) {
    tracks.push({
      value: match[0],
      minmax: {
        min: match[1].trim(),
        max: match[2].trim(),
      },
    });
  }

  // 일반 트랙 값
  const cleanedValue = trackValue
    .replace(/repeat\([^)]+\)/g, '')
    .replace(/minmax\([^)]+\)/g, '')
    .trim();

  if (cleanedValue) {
    const values = cleanedValue.split(/\s+/);
    for (const value of values) {
      if (value.trim()) {
        tracks.push({ value: value.trim() });
      }
    }
  }

  return tracks.length > 0 ? tracks : [{ value: trackValue }];
}

/**
 * 그리드 셀 정보 추출
 */
export function extractGridCellInfo(element: HTMLElement): {
  isGridItem: boolean;
  gridContainer: HTMLElement | null;
  rowStart: string;
  rowEnd: string;
  columnStart: string;
  columnEnd: string;
  area: string;
} {
  const computedStyle = window.getComputedStyle(element);
  const parent = element.parentElement;

  const isGridItem = parent ? isGridContainer(parent) : false;

  return {
    isGridItem,
    gridContainer: isGridItem ? parent : null,
    rowStart: computedStyle.getPropertyValue('grid-row-start'),
    rowEnd: computedStyle.getPropertyValue('grid-row-end'),
    columnStart: computedStyle.getPropertyValue('grid-column-start'),
    columnEnd: computedStyle.getPropertyValue('grid-column-end'),
    area: computedStyle.getPropertyValue('grid-area'),
  };
}

/**
 * 그리드 오버레이 생성
 */
export function createGridOverlay(
  element: HTMLElement,
  container: HTMLElement
): {
    overlay: HTMLElement;
    update: () => void;
    remove: () => void;
  } {
  const gridInfo = extractGridInfo(element);
  const rect = element.getBoundingClientRect();

  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.className = 'css-scan-grid-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    pointer-events: none;
    z-index: 2147483646;
    border: 2px dashed #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
  `;

  // 그리드 라인 그리기
  const tracks = parseGridTrackSize(gridInfo.templateColumns);
  const columns = tracks.length || 1;

  const columnWidth = rect.width / columns;

  for (let i = 1; i < columns; i++) {
    const line = document.createElement('div');
    line.className = 'css-scan-grid-column-line';
    line.style.cssText = `
      position: absolute;
      top: 0;
      left: ${columnWidth * i}px;
      width: 1px;
      height: 100%;
      background: rgba(139, 92, 246, 0.5);
    `;
    overlay.appendChild(line);
  }

  // 행 라인
  const rowTracks = parseGridTrackSize(gridInfo.templateRows);
  const rows = rowTracks.length || 1;

  const rowHeight = rect.height / rows;

  for (let i = 1; i < rows; i++) {
    const line = document.createElement('div');
    line.className = 'css-scan-grid-row-line';
    line.style.cssText = `
      position: absolute;
      top: ${rowHeight * i}px;
      left: 0;
      width: 100%;
      height: 1px;
      background: rgba(139, 92, 246, 0.5);
    `;
    overlay.appendChild(line);
  }

  // 셀 번호 표시
  let cellNumber = 1;
  const cellHeight = rect.height / rows;
  const cellWidth = rect.width / columns;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = document.createElement('div');
      cell.className = 'css-scan-grid-cell';
      cell.style.cssText = `
        position: absolute;
        top: ${cellHeight * row}px;
        left: ${cellWidth * col}px;
        width: ${cellWidth}px;
        height: ${cellHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(139, 92, 246, 0.8);
        font-size: 12px;
        font-weight: bold;
      `;
      cell.textContent = cellNumber.toString();
      overlay.appendChild(cell);
      cellNumber++;
    }
  }

  // 라벨
  const label = document.createElement('div');
  label.className = 'css-scan-grid-label';
  label.style.cssText = `
    position: absolute;
    top: -25px;
    left: 0;
    background: #8b5cf6;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    white-space: nowrap;
  `;
  label.textContent = `grid: ${columns} × ${rows}`;
  overlay.appendChild(label);

  container.appendChild(overlay);

  return {
    overlay,
    update: () => {
      updateGridOverlay(element, overlay);
    },
    remove: () => {
      overlay.remove();
    },
  };
}

/**
 * 그리드 오버레이 업데이트
 */
function updateGridOverlay(element: HTMLElement, overlay: HTMLElement): void {
  const rect = element.getBoundingClientRect();

  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  // 셀 크기 재계산
  const gridInfo = extractGridInfo(element);
  const tracks = parseGridTrackSize(gridInfo.templateColumns);
  const columns = tracks.length || 1;

  const rowTracks = parseGridTrackSize(gridInfo.templateRows);
  const rows = rowTracks.length || 1;

  const cellWidth = rect.width / columns;
  const cellHeight = rect.height / rows;

  // 라인 업데이트
  const columnLines = overlay.querySelectorAll('.css-scan-grid-column-line');
  for (let i = 0; i < columnLines.length; i++) {
    const line = columnLines[i] as HTMLElement;
    line.style.left = `${cellWidth * (i + 1)}px`;
  }

  const rowLines = overlay.querySelectorAll('.css-scan-grid-row-line');
  for (let i = 0; i < rowLines.length; i++) {
    const line = rowLines[i] as HTMLElement;
    line.style.top = `${cellHeight * (i + 1)}px`;
  }

  // 셀 업데이트
  const cells = overlay.querySelectorAll('.css-scan-grid-cell');
  let cellNumber = 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cellIndex = (row * columns + col);
      const cell = cells[cellIndex] as HTMLElement;

      if (cell) {
        cell.style.top = `${cellHeight * row}px`;
        cell.style.left = `${cellWidth * col}px`;
        cell.style.width = `${cellWidth}px`;
        cell.style.height = `${cellHeight}px`;
        cell.textContent = cellNumber.toString();
      }
      cellNumber++;
    }
  }
}

/**
 * 그리드 속성을 CSS로 내보내기
 */
export function gridToCSS(gridInfo: GridInfo): string {
  const lines: string[] = [];

  if (gridInfo.enabled) {
    lines.push('display: grid;');
  }

  if (gridInfo.templateColumns !== 'none') {
    lines.push(`grid-template-columns: ${gridInfo.templateColumns};`);
  }

  if (gridInfo.templateRows !== 'none') {
    lines.push(`grid-template-rows: ${gridInfo.templateRows};`);
  }

  if (gridInfo.templateAreas !== 'none') {
    lines.push(`grid-template-areas: ${gridInfo.templateAreas};`);
  }

  if (gridInfo.gap !== 'normal') {
    lines.push(`gap: ${gridInfo.gap};`);
  }

  if (gridInfo.autoFlow !== 'row') {
    lines.push(`grid-auto-flow: ${gridInfo.autoFlow};`);
  }

  if (gridInfo.autoColumns !== 'auto') {
    lines.push(`grid-auto-columns: ${gridInfo.autoColumns};`);
  }

  if (gridInfo.autoRows !== 'auto') {
    lines.push(`grid-auto-rows: ${gridInfo.autoRows};`);
  }

  return lines.join('\n');
}

/**
 * 그리드 템플릿 시각화 (ASCII)
 */
export function visualizeGridTemplate(
  templateAreas: string
): string[] {
  if (!templateAreas || templateAreas === 'none') return [];

  const areas = templateAreas
    .split('"')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return areas;
}

/**
 * 반응형 그리드 추천
 */
export function suggestResponsiveGrid(
  element: HTMLElement
): {
    columns: number;
    breakpoint: string;
    mediaQuery: string;
  }[] {
  const suggestions: {
    columns: number;
    breakpoint: string;
    mediaQuery: string;
  }[] = [];

  const children = Array.from(element.children);
  const itemCount = children.length;

  // 데스크탑
  if (itemCount > 6) {
    suggestions.push({
      columns: 4,
      breakpoint: 'desktop',
      mediaQuery: '(min-width: 1024px)',
    });
  } else if (itemCount > 3) {
    suggestions.push({
      columns: 3,
      breakpoint: 'desktop',
      mediaQuery: '(min-width: 1024px)',
    });
  }

  // 태블릿
  if (itemCount > 4) {
    suggestions.push({
      columns: 2,
      breakpoint: 'tablet',
      mediaQuery: '(min-width: 768px) and (max-width: 1023px)',
    });
  }

  // 모바일
  suggestions.push({
    columns: 1,
    breakpoint: 'mobile',
    mediaQuery: '(max-width: 767px)',
  });

  return suggestions;
}
