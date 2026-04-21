import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 색조(Tints) 팔레트 생성
 * Lightness를 높여서 밝게
 */
export function generateTints(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 7;
  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // 기본 색상부터 거의 흰색까지
  const maxLightness = 95;
  const step = (maxLightness - baseHsl.l) / (count - 1);

  for (let i = 0; i < count; i++) {
    const lightness = clamp(baseHsl.l + i * step, 0, 100);

    const newColor = createColorFromHsl({
      h: baseHsl.h,
      s: baseHsl.s,
      l: Math.round(lightness),
    });

    colors.push(newColor);
  }

  return colors;
}
