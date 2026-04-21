import { Color, RGB, HSL } from '../../types/colorPicker';
import { generateColorId, generateColorName } from './helpers';
import { rgbToHex } from './conversions/hexRgb';
import { rgbToHsl } from './conversions/rgbHsl';
import { rgbToHsv } from './conversions/rgbHsv';
import { hexToRgb } from './conversions/hexRgb';
import { hslToRgb } from './conversions/rgbHsl';

/**
 * HEX로부터 Color 객체 생성
 */
export function createColorFromHex(hex: string, name?: string): Color {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);

  return {
    id: generateColorId(),
    timestamp: Date.now(),
    hex,
    rgb,
    rgba: { ...rgb, a: 1 },
    hsl,
    hsla: { ...hsl, a: 1 },
    hsv,
    name: name || generateColorName(hex),
  };
}

/**
 * RGB로부터 Color 객체 생성
 */
export function createColorFromRgb(rgb: RGB, name?: string): Color {
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);

  return {
    id: generateColorId(),
    timestamp: Date.now(),
    hex,
    rgb,
    rgba: { ...rgb, a: 1 },
    hsl,
    hsla: { ...hsl, a: 1 },
    hsv,
    name: name || generateColorName(hex),
  };
}

/**
 * HSL로부터 Color 객체 생성
 */
export function createColorFromHsl(hsl: HSL, name?: string): Color {
  const rgb = hslToRgb(hsl);
  const hex = rgbToHex(rgb);
  const hsv = rgbToHsv(rgb);

  return {
    id: generateColorId(),
    timestamp: Date.now(),
    hex,
    rgb,
    rgba: { ...rgb, a: 1 },
    hsl,
    hsla: { ...hsl, a: 1 },
    hsv,
    name: name || generateColorName(hex),
  };
}
