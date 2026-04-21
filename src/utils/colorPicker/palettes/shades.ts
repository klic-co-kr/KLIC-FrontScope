import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 명암(Shades) 팔레트 생성
 * Lightness를 줄여서 어둡게
 */
export function generateShades(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 7;
  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // 기본 색상부터 거의 검은색까지
  const minLightness = 5;
  const step = (baseHsl.l - minLightness) / (count - 1);

  for (let i = 0; i < count; i++) {
    const lightness = clamp(baseHsl.l - i * step, 0, 100);

    const newColor = createColorFromHsl({
      h: baseHsl.h,
      s: baseHsl.s,
      l: Math.round(lightness),
    });

    colors.push(newColor);
  }

  return colors;
}
