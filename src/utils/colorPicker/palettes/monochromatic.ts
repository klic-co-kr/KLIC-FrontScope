import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 단색 조합 팔레트 생성
 * 같은 Hue, 다른 Lightness
 */
export function generateMonochromatic(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 7;
  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // Lightness를 10%부터 90%까지 균등 분배
  const minLightness = 10;
  const maxLightness = 90;
  const step = (maxLightness - minLightness) / (count - 1);

  for (let i = 0; i < count; i++) {
    const lightness = clamp(minLightness + i * step, 0, 100);

    const newColor = createColorFromHsl({
      h: baseHsl.h,
      s: baseHsl.s,
      l: Math.round(lightness),
    });

    colors.push(newColor);
  }

  return colors;
}
