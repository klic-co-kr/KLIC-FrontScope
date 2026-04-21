import { Color } from '../../types/colorPicker';
import { generateUUID } from '../common/uuid';

/**
 * 색상 ID 생성
 */
export function generateColorId(): string {
  return generateUUID();
}

/**
 * 색상 이름 생성 (HEX 기반)
 */
export function generateColorName(hex: string): string {
  return `Color ${hex.toUpperCase()}`;
}

/**
 * 숫자를 범위 내로 제한
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 숫자를 지정된 소수점 자리수로 반올림
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * HEX 값 정규화 (#RGB -> #RRGGBB)
 */
export function normalizeHex(hex: string): string {
  let normalized = hex.replace('#', '');

  // 3자리 HEX를 6자리로 확장
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  return `#${normalized.toUpperCase()}`;
}

/**
 * 색상 복제
 */
export function cloneColor(color: Color): Color {
  return {
    ...color,
    id: generateColorId(),
    timestamp: Date.now(),
    rgb: { ...color.rgb },
    rgba: { ...color.rgba },
    hsl: { ...color.hsl },
    hsla: { ...color.hsla },
    hsv: { ...color.hsv },
    tags: color.tags ? [...color.tags] : undefined,
  };
}

/**
 * 두 색상이 같은지 비교
 */
export function areColorsEqual(color1: Color, color2: Color): boolean {
  return color1.hex === color2.hex;
}

/**
 * 색상 배열에서 중복 제거
 */
export function deduplicateColors(colors: Color[]): Color[] {
  const seen = new Set<string>();

  return colors.filter((color) => {
    if (seen.has(color.hex)) {
      return false;
    }

    seen.add(color.hex);
    return true;
  });
}
