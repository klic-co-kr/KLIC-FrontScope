import { Color, ColorFormat } from '../../types/colorPicker';
import { parseColor } from './parser';
import { formatColor } from './formatter';
import { createColorFromRgb, createColorFromHsl } from './colorFactory';

/**
 * 색상 문자열을 다른 포맷으로 변환
 */
export function convertColorString(
  colorString: string,
  toFormat: ColorFormat
): string | null {
  try {
    const parsed = parseColor(colorString);

    if (!parsed) {
      return null;
    }

    // RGB 또는 HSL로 Color 객체 생성
    let color: Color;
    if ('r' in parsed) {
      color = createColorFromRgb({ r: parsed.r, g: parsed.g, b: parsed.b });
    } else if ('h' in parsed) {
      color = createColorFromHsl({ h: parsed.h, s: parsed.s, l: parsed.l });
    } else {
      return null;
    }

    return formatColor(color, toFormat);
  } catch {
    return null;
  }
}

/**
 * Color 객체를 모든 포맷으로 반환
 */
export function colorToAllFormats(color: Color): Record<ColorFormat, string> {
  return {
    hex: formatColor(color, 'hex'),
    rgb: formatColor(color, 'rgb'),
    rgba: formatColor(color, 'rgba'),
    hsl: formatColor(color, 'hsl'),
    hsla: formatColor(color, 'hsla'),
    hsv: formatColor(color, 'hsv'),
    cssvar: formatColor(color, 'cssvar'),
  };
}
