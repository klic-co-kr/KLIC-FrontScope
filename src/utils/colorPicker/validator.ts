import { RGB, RGBA, HSL, HSLA, Color } from '../../types/colorPicker';
import { isValidColor as isValidColorString } from './patterns';

/**
 * RGB 값 유효성 검증
 */
export function isValidRgb(rgb: RGB): boolean {
  return (
    rgb.r >= 0 && rgb.r <= 255 &&
    rgb.g >= 0 && rgb.g <= 255 &&
    rgb.b >= 0 && rgb.b <= 255
  );
}

/**
 * RGBA 값 유효성 검증
 */
export function isValidRgba(rgba: RGBA): boolean {
  return isValidRgb(rgba) && rgba.a >= 0 && rgba.a <= 1;
}

/**
 * HSL 값 유효성 검증
 */
export function isValidHsl(hsl: HSL): boolean {
  return (
    hsl.h >= 0 && hsl.h <= 360 &&
    hsl.s >= 0 && hsl.s <= 100 &&
    hsl.l >= 0 && hsl.l <= 100
  );
}

/**
 * HSLA 값 유효성 검증
 */
export function isValidHsla(hsla: HSLA): boolean {
  return isValidHsl(hsla) && hsla.a >= 0 && hsla.a <= 1;
}

/**
 * Color 객체 유효성 검증
 */
export function isValidColorObject(color: Color): boolean {
  return (
    color.id !== undefined &&
    color.timestamp > 0 &&
    isValidColorString(color.hex) &&
    isValidRgb(color.rgb) &&
    isValidRgba(color.rgba) &&
    isValidHsl(color.hsl) &&
    isValidHsla(color.hsla)
  );
}
