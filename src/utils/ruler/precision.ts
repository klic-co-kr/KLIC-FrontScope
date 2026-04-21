/**
 * 지정된 정밀도로 반올림
 */
export function roundToPrecision(value: number, precision: number = 2): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 거리 객체의 모든 값 반올림
 */
export function roundDistance(distance: {
  horizontal: number;
  vertical: number;
  diagonal: number;
  angle: number;
}, precision: number = 2): typeof distance {
  return {
    horizontal: roundToPrecision(distance.horizontal, precision),
    vertical: roundToPrecision(distance.vertical, precision),
    diagonal: roundToPrecision(distance.diagonal, precision),
    angle: roundToPrecision(distance.angle, precision),
  };
}

/**
 * 크기 객체의 모든 값 반올림
 */
export function roundDimensions(dimensions: {
  width: number;
  height: number;
  aspectRatio: number;
}, precision: number = 2): typeof dimensions {
  return {
    width: roundToPrecision(dimensions.width, precision),
    height: roundToPrecision(dimensions.height, precision),
    aspectRatio: roundToPrecision(dimensions.aspectRatio, precision),
  };
}

/**
 * 정수로 반올림
 */
export function roundToInteger(value: number): number {
  return Math.round(value);
}

/**
 * 가장 가까운 배수로 반올림
 */
export function roundToMultiple(value: number, multiple: number): number {
  return Math.round(value / multiple) * multiple;
}
