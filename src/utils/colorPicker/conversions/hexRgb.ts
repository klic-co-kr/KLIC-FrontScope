import { RGB, RGBA } from '../../../types/colorPicker';
import { clamp, normalizeHex } from '../helpers';

/**
 * HEX를 RGB로 변환
 */
export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex).replace('#', '');

  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  return {
    r: clamp(r, 0, 255),
    g: clamp(g, 0, 255),
    b: clamp(b, 0, 255),
  };
}

/**
 * HEX를 RGBA로 변환 (alpha 포함)
 */
export function hexToRgba(hex: string, alpha: number = 1): RGBA {
  const rgb = hexToRgb(hex);

  return {
    ...rgb,
    a: clamp(alpha, 0, 1),
  };
}

/**
 * RGB를 HEX로 변환
 */
export function rgbToHex(rgb: RGB): string {
  const r = clamp(Math.round(rgb.r), 0, 255);
  const g = clamp(Math.round(rgb.g), 0, 255);
  const b = clamp(Math.round(rgb.b), 0, 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * RGBA를 HEX로 변환 (alpha 포함)
 */
export function rgbaToHex(rgba: RGBA, includeAlpha: boolean = false): string {
  const rgb = { r: rgba.r, g: rgba.g, b: rgba.b };
  const hex = rgbToHex(rgb);

  if (includeAlpha) {
    const alpha = clamp(Math.round(rgba.a * 255), 0, 255);
    const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();
    return `${hex}${alphaHex}`;
  }

  return hex;
}
