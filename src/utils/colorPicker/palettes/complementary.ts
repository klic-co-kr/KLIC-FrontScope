import type { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 보색 팔레트 생성
 * Hue를 180도 회전
 */
export function generateComplementary(
  baseColor: Color,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: Partial<PaletteOptions>
): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  const complementaryHue = (baseHsl.h + 180) % 360;

  const complementaryColor = createColorFromHsl({
    h: complementaryHue,
    s: baseHsl.s,
    l: baseHsl.l,
  });

  colors.push(complementaryColor);

  return colors;
}

/**
 * 분할 보색 생성
 * 보색 양옆의 색상들
 */
export function generateSplitComplementary(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;
  const variation = options?.variation || 30;

  const complementaryHue = (baseHsl.h + 180) % 360;

  // 보색 기준 +/- variation
  const hue1 = (complementaryHue - variation + 360) % 360;
  const hue2 = (complementaryHue + variation) % 360;

  colors.push(
    createColorFromHsl({ h: hue1, s: baseHsl.s, l: baseHsl.l }),
    createColorFromHsl({ h: hue2, s: baseHsl.s, l: baseHsl.l })
  );

  return colors;
}
