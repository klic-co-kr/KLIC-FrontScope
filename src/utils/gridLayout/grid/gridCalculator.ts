/**
 * Grid Calculator Utilities
 *
 * 그리드 계산 관련 유틸리티 함수들
 */

import type { GridOverlaySettings } from '../../../types/gridLayout';
import { TAILWIND_BREAKPOINTS } from '../../../constants/viewportPresets';

/**
 * 컬럼 위치 정보
 */
export interface ColumnPosition {
  index: number;
  startX: number;
  endX: number;
  width: number;
  centerX: number;
}

/**
 * 그리드 컬럼 너비 계산
 */
export function calculateColumnWidths(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): number[] {
  const availableWidth = containerWidth - margin * 2 - gap * (columns - 1);
  const columnWidth = Math.max(0, availableWidth / columns);

  return Array(columns).fill(columnWidth);
}

/**
 * 그리드 컬럼 위치 계산
 */
export function calculateColumnPositions(
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): ColumnPosition[] {
  const positions: ColumnPosition[] = [];
  const columnWidths = calculateColumnWidths(containerWidth, columns, gap, margin);

  let currentX = margin;

  columnWidths.forEach((width, index) => {
    const startX = currentX;
    const endX = currentX + width;

    positions.push({
      index,
      startX,
      endX,
      width,
      centerX: (startX + endX) / 2,
    });

    currentX = endX + gap;
  });

  return positions;
}

/**
 * 반응형 컬럼 수 계산
 */
export function calculateResponsiveColumns(
  settings: GridOverlaySettings,
  viewportWidth: number
): number {
  const { breakpoints } = settings;

  if (viewportWidth < TAILWIND_BREAKPOINTS.sm) {
    return breakpoints.sm.enabled ? breakpoints.sm.columns : settings.columns;
  }
  if (viewportWidth < TAILWIND_BREAKPOINTS.md) {
    return breakpoints.md.enabled ? breakpoints.md.columns : settings.columns;
  }
  if (viewportWidth < TAILWIND_BREAKPOINTS.lg) {
    return breakpoints.lg.enabled ? breakpoints.lg.columns : settings.columns;
  }
  if (viewportWidth < TAILWIND_BREAKPOINTS.xl) {
    return breakpoints.xl.enabled ? breakpoints.xl.columns : settings.columns;
  }
  return breakpoints['2xl'].enabled ? breakpoints['2xl'].columns : settings.columns;
}

/**
 * 그리드 오프셋 계산 (중앙 정렬용)
 */
export function calculateGridOffset(
  containerWidth: number,
  gridWidth: number
): number {
  return (containerWidth - gridWidth) / 2;
}

/**
 * 그리드 총 너비 계산
 */
export function calculateGridWidth(
  columns: number,
  columnWidth: number,
  gap: number
): number {
  return columnWidth * columns + gap * (columns - 1);
}

/**
 * 그리드 높이 계산 (행 기반)
 */
export function calculateRowHeight(
  containerHeight: number,
  rows: number,
  gap: number,
  margin: number
): number {
  const availableHeight = containerHeight - margin * 2 - gap * (rows - 1);
  return Math.max(0, availableHeight / rows);
}

/**
 * 그리드 행 위치 계산
 */
export interface RowPosition {
  index: number;
  startY: number;
  endY: number;
  height: number;
  centerY: number;
}

export function calculateRowPositions(
  containerHeight: number,
  rows: number,
  gap: number,
  margin: number
): RowPosition[] {
  const positions: RowPosition[] = [];
  const rowHeight = calculateRowHeight(containerHeight, rows, gap, margin);

  let currentY = margin;

  for (let i = 0; i < rows; i++) {
    const startY = currentY;
    const endY = currentY + rowHeight;

    positions.push({
      index: i,
      startY,
      endY,
      height: rowHeight,
      centerY: (startY + endY) / 2,
    });

    currentY = endY + gap;
  }

  return positions;
}

/**
 * 그리드 셀 위치 계산
 */
export interface GridCell {
  columnIndex: number;
  rowIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function calculateGridCells(
  containerWidth: number,
  containerHeight: number,
  columns: number,
  rows: number,
  gap: number,
  margin: number
): GridCell[] {
  const cells: GridCell[] = [];
  const columnPositions = calculateColumnPositions(containerWidth, columns, gap, margin);
  const rowPositions = calculateRowPositions(containerHeight, rows, gap, margin);

  for (const col of columnPositions) {
    for (const row of rowPositions) {
      cells.push({
        columnIndex: col.index,
        rowIndex: row.index,
        x: col.startX,
        y: row.startY,
        width: col.width,
        height: row.height,
        centerX: col.centerX,
        centerY: row.centerY,
      });
    }
  }

  return cells;
}

/**
 * 그리드 CSS 생성
 */
export interface GridCSS {
  container: React.CSSProperties;
  columns: React.CSSProperties[];
  gaps: React.CSSProperties[];
}

export function generateGridCSS(
  settings: GridOverlaySettings,
  containerWidth: number
): GridCSS {
  const columns = calculateResponsiveColumns(settings, containerWidth);
  const positions = calculateColumnPositions(
    containerWidth,
    columns,
    settings.gap,
    parseFloat(settings.margin) || 0
  );

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9996,
  };

  const columnStyles = positions.map((pos) => ({
    position: 'absolute' as const,
    top: 0,
    left: `${pos.startX}px`,
    width: `${pos.width}px`,
    height: '100%',
    backgroundColor: settings.color,
    opacity: settings.opacity,
  }));

  const gapStyles = positions.slice(0, -1).map((pos) => ({
    position: 'absolute' as const,
    top: 0,
    left: `${pos.endX}px`,
    width: `${settings.gap}px`,
    height: '100%',
    backgroundColor: settings.color,
    opacity: settings.opacity * 0.3,
  }));

  return {
    container: containerStyle,
    columns: columnStyles,
    gaps: gapStyles,
  };
}

/**
 * 그리드 측정 정보
 */
export interface GridMeasurement {
  x: number;
  y: number;
  columnSpan: number;
  rowSpan: number;
  columnStart: number;
  columnEnd: number;
  rowStart: number;
  rowEnd: number;
}

/**
 * 위치에서 그리드 셀 정보 찾기
 */
export function findCellAtPosition(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number,
  columns: number,
  rows: number,
  gap: number,
  margin: number
): GridMeasurement | null {
  const columnPositions = calculateColumnPositions(containerWidth, columns, gap, margin);
  const rowPositions = calculateRowPositions(containerHeight, rows, gap, margin);

  const columnIndex = columnPositions.findIndex(
    (col) => x >= col.startX && x <= col.endX
  );

  const rowIndex = rowPositions.findIndex(
    (row) => y >= row.startY && y <= row.endY
  );

  if (columnIndex === -1 || rowIndex === -1) {
    return null;
  }

  return {
    x,
    y,
    columnSpan: 1,
    rowSpan: 1,
    columnStart: columnIndex,
    columnEnd: columnIndex + 1,
    rowStart: rowIndex,
    rowEnd: rowIndex + 1,
  };
}

/**
 * 컬럼 인덱스에서 X 위치 찾기
 */
export function getColumnXPosition(
  columnIndex: number,
  containerWidth: number,
  columns: number,
  gap: number,
  margin: number
): number {
  const positions = calculateColumnPositions(containerWidth, columns, gap, margin);

  if (columnIndex < 0 || columnIndex >= positions.length) {
    return margin;
  }

  return positions[columnIndex].startX;
}

/**
 * 행 인덱스에서 Y 위치 찾기
 */
export function getRowYPosition(
  rowIndex: number,
  containerHeight: number,
  rows: number,
  gap: number,
  margin: number
): number {
  const positions = calculateRowPositions(containerHeight, rows, gap, margin);

  if (rowIndex < 0 || rowIndex >= positions.length) {
    return margin;
  }

  return positions[rowIndex].startY;
}
