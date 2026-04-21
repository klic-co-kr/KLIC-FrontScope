import { Color } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 3색 조합 팔레트 생성
 * Hue를 120도씩 회전
 */
export function generateTriadic(baseColor: Color): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  for (let i = 1; i < 3; i++) {
    const newHue = (baseHsl.h + i * 120) % 360;

    const newColor = createColorFromHsl({
      h: newHue,
      s: baseHsl.s,
      l: baseHsl.l,
    });

    colors.push(newColor);
  }

  return colors;
}
