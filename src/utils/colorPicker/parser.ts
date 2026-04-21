import { RGB, RGBA, HSL, HSLA } from '../../types/colorPicker';
import { COLOR_PATTERNS, detectColorFormat } from './patterns';
import { hexToRgb } from './conversions/hexRgb';
import { clamp } from './helpers';

/**
 * 색상 문자열을 파싱
 */
export function parseColor(colorString: string): RGB | RGBA | HSL | HSLA | null {
  const format = detectColorFormat(colorString);

  if (!format) {
    return null;
  }

  switch (format) {
    case 'hex':
      return hexToRgb(colorString);

    case 'rgb':
      return parseRgb(colorString);

    case 'rgba':
      return parseRgba(colorString);

    case 'hsl':
      return parseHsl(colorString);

    case 'hsla':
      return parseHsla(colorString);

    default:
      return null;
  }
}

/**
 * RGB 문자열 파싱
 */
function parseRgb(rgbString: string): RGB | null {
  const match = rgbString.match(COLOR_PATTERNS.rgb);

  if (!match) {
    return null;
  }

  return {
    r: clamp(parseInt(match[1]), 0, 255),
    g: clamp(parseInt(match[2]), 0, 255),
    b: clamp(parseInt(match[3]), 0, 255),
  };
}

/**
 * RGBA 문자열 파싱
 */
function parseRgba(rgbaString: string): RGBA | null {
  const match = rgbaString.match(COLOR_PATTERNS.rgba);

  if (!match) {
    return null;
  }

  return {
    r: clamp(parseInt(match[1]), 0, 255),
    g: clamp(parseInt(match[2]), 0, 255),
    b: clamp(parseInt(match[3]), 0, 255),
    a: clamp(parseFloat(match[4]), 0, 1),
  };
}

/**
 * HSL 문자열 파싱
 */
function parseHsl(hslString: string): HSL | null {
  const match = hslString.match(COLOR_PATTERNS.hsl);

  if (!match) {
    return null;
  }

  return {
    h: clamp(parseInt(match[1]), 0, 360),
    s: clamp(parseInt(match[2]), 0, 100),
    l: clamp(parseInt(match[3]), 0, 100),
  };
}

/**
 * HSLA 문자열 파싱
 */
function parseHsla(hslaString: string): HSLA | null {
  const match = hslaString.match(COLOR_PATTERNS.hsla);

  if (!match) {
    return null;
  }

  return {
    h: clamp(parseInt(match[1]), 0, 360),
    s: clamp(parseInt(match[2]), 0, 100),
    l: clamp(parseInt(match[3]), 0, 100),
    a: clamp(parseFloat(match[4]), 0, 1),
  };
}
