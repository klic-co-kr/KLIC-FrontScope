import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 유사색 팔레트 생성
 * Hue를 기준으로 ±30도 범위의 색상들
 */
export function generateAnalogous(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 5;
  const variation = options?.variation || 30; // 기본 30도

  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // 중앙에 기본 색상
  const centerIndex = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const offset = (i - centerIndex) * (variation / (count - 1));
    const newHue = (baseHsl.h + offset + 360) % 360;

    const newColor = createColorFromHsl({
      h: newHue,
      s: baseHsl.s,
      l: baseHsl.l,
    });

    colors.push(newColor);
  }

  return colors;
}
