import { HSL, HSLA } from '../../../types/colorPicker';
import { hexToRgb, rgbToHex } from './hexRgb';
import { rgbToHsl, hslToRgb } from './rgbHsl';

/**
 * HEX를 HSL로 변환
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * HEX를 HSLA로 변환
 */
export function hexToHsla(hex: string, alpha: number = 1): HSLA {
  const hsl = hexToHsl(hex);

  return {
    ...hsl,
    a: alpha,
  };
}

/**
 * HSL를 HEX로 변환
 */
export function hslToHex(hsl: HSL): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

/**
 * HSLA를 HEX로 변환
 */
export function hslaToHex(hsla: HSLA): string {
  return hslToHex({ h: hsla.h, s: hsla.s, l: hsla.l });
}
