/**
 * 좌표 유효성 검증
 */
export function isValidCoordinate(point: { x: number; y: number }): boolean {
  return (
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    !isNaN(point.x) &&
    !isNaN(point.y) &&
    isFinite(point.x) &&
    isFinite(point.y)
  );
}

/**
 * 요소 유효성 검증
 */
export function isValidElement(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    element.offsetParent !== null
  );
}

/**
 * 크기 유효성 검증
 */
export function isValidDimension(value: number): boolean {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    value >= 0
  );
}

/**
 * 측정 결과 유효성 검증
 */
export function isValidMeasurement(measurement: unknown): boolean {
  if (!measurement || typeof measurement !== 'object') {
    return false;
  }

  const m = measurement as Record<string, unknown>;

  if (!m.id || !m.timestamp || !m.type) {
    return false;
  }

  if (m.type === 'element' && !m.element) {
    return false;
  }

  if (m.type === 'distance' && !m.distance) {
    return false;
  }

  if (m.type === 'gap' && !m.gap) {
    return false;
  }

  return true;
}

/**
 * 단위 유효성 검증
 */
export function isValidUnit(unit: string): unit is 'px' | 'rem' | 'em' {
  return unit === 'px' || unit === 'rem' || unit === 'em';
}
