import { Color } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 4색 조합 팔레트 생성 (사각형)
 * Hue를 90도씩 회전
 */
export function generateTetradic(baseColor: Color): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  for (let i = 1; i < 4; i++) {
    const newHue = (baseHsl.h + i * 90) % 360;

    const newColor = createColorFromHsl({
      h: newHue,
      s: baseHsl.s,
      l: baseHsl.l,
    });

    colors.push(newColor);
  }

  return colors;
}

/**
 * 직사각형 4색 조합
 */
export function generateSquare(baseColor: Color, offset: number = 60): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  const hues = [
    baseHsl.h,
    (baseHsl.h + offset) % 360,
    (baseHsl.h + 180) % 360,
    (baseHsl.h + 180 + offset) % 360,
  ];

  for (let i = 1; i < hues.length; i++) {
    colors.push(
      createColorFromHsl({
        h: hues[i],
        s: baseHsl.s,
        l: baseHsl.l,
      })
    );
  }

  return colors;
}
