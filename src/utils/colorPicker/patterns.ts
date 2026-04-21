import { ColorFormat } from '../../types/colorPicker';

/**
 * 색상 포맷 정규식
 */
export const COLOR_PATTERNS = {
  // HEX: #RGB, #RRGGBB, #RRGGBBAA
  hex: /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/,

  // RGB: rgb(255, 255, 255)
  rgb: /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,

  // RGBA: rgba(255, 255, 255, 0.5)
  rgba: /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i,

  // HSL: hsl(360, 100%, 50%)
  hsl: /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i,

  // HSLA: hsla(360, 100%, 50%, 0.5)
  hsla: /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1|0?\.\d+)\s*\)$/i,

  // CSS Variable: var(--color-name)
  cssvar: /^var\(\s*--[\w-]+\s*\)$/i,
} as const;

/**
 * 색상 포맷 감지
 */
export function detectColorFormat(color: string): ColorFormat | null {
  if (COLOR_PATTERNS.hex.test(color)) return 'hex';
  if (COLOR_PATTERNS.rgba.test(color)) return 'rgba';
  if (COLOR_PATTERNS.rgb.test(color)) return 'rgb';
  if (COLOR_PATTERNS.hsla.test(color)) return 'hsla';
  if (COLOR_PATTERNS.hsl.test(color)) return 'hsl';
  if (COLOR_PATTERNS.cssvar.test(color)) return 'cssvar';

  return null;
}

/**
 * 색상 유효성 검증
 */
export function isValidColor(color: string): boolean {
  return detectColorFormat(color) !== null;
}
