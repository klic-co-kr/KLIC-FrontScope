/**
 * Device Pixel Ratio 반환
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * 픽셀 스냅 (레티나 대응)
 */
export function snapToPixel(value: number): number {
  const dpr = getDevicePixelRatio();
  return Math.round(value * dpr) / dpr;
}

/**
 * 좌표 스냅
 */
export function snapPoint(point: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: snapToPixel(point.x),
    y: snapToPixel(point.y),
  };
}

/**
 * DOMRect 스냅
 */
export function snapRect(rect: DOMRect): DOMRect {
  return new DOMRect(
    snapToPixel(rect.x),
    snapToPixel(rect.y),
    snapToPixel(rect.width),
    snapToPixel(rect.height)
  );
}

/**
 * 물리적 픽셀 크기 계산
 */
export function getPhysicalPixels(cssPixels: number): number {
  return cssPixels * getDevicePixelRatio();
}

/**
 * CSS 픽셀 크기 계산
 */
export function getCSSPixels(physicalPixels: number): number {
  return physicalPixels / getDevicePixelRatio();
}

/**
 * 레티나 디스플레이 여부 확인
 */
export function isRetina(): boolean {
  return getDevicePixelRatio() > 1;
}
