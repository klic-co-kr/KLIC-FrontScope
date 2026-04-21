/**
 * Common Color Utilities
 *
 * 공통 색상 변환 유틸리티 함수
 * - hexToRgb, rgbToHex, colorDistance, rgbStringToHex
 */

/**
 * Hex 색상을 RGB로 변환
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB 값을 Hex 색상으로 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * 두 RGB 색상 간의 거리 계산 (CIE76 Delta-E)
 */
export function colorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * RGB 문자열을 Hex 색상으로 변환
 * 예: "rgb(255, 0, 0)" → "#ff0000"
 *     "rgba(255, 0, 0, 0.5)" → "#ff0000"
 */
export function rgbStringToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;

  const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}
