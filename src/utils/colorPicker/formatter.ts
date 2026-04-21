import { RGB, RGBA, HSL, HSLA, Color, ColorFormat } from '../../types/colorPicker';
import { round } from './helpers';

/**
 * RGB를 문자열로 변환
 */
export function formatRgb(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * RGBA를 문자열로 변환
 */
export function formatRgba(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${round(rgba.a, 2)})`;
}

/**
 * HSL를 문자열로 변환
 */
export function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * HSLA를 문자열로 변환
 */
export function formatHsla(hsla: HSLA): string {
  return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${round(hsla.a, 2)})`;
}

/**
 * CSS Variable 형식으로 변환
 */
export function formatCssVar(name: string): string {
  const varName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return `var(--${varName})`;
}

/**
 * 색상을 지정된 포맷으로 변환
 */
export function formatColor(color: Color, format: ColorFormat): string {
  switch (format) {
    case 'hex':
      return color.hex;

    case 'rgb':
      return formatRgb(color.rgb);

    case 'rgba':
      return formatRgba(color.rgba);

    case 'hsl':
      return formatHsl(color.hsl);

    case 'hsla':
      return formatHsla(color.hsla);

    case 'hsv':
      return `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`;

    case 'cssvar':
      return formatCssVar(color.name || color.hex);

    default:
      return color.hex;
  }
}
