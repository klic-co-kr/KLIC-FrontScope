import { Color, WCAGLevel } from '../../../types/colorPicker';
import { getContrastRatio } from './contrast';
import { checkWCAG } from './wcag';
import { createColorFromHsl } from '../colorFactory';
import { WCAG_CONTRAST_RATIOS } from '../../../constants/colors';

/**
 * 접근성을 만족하는 색상 제안
 * Lightness를 조정하여 대비율 만족
 */
export function suggestAccessibleColor(
  foreground: Color,
  background: Color,
  level: WCAGLevel = 'AA'
): Color | null {
  // 이미 만족하면 원본 반환
  if (checkWCAG(foreground, background, level)) {
    return foreground;
  }

  const targetRatio = level === 'AA'
    ? WCAG_CONTRAST_RATIOS.AA_NORMAL
    : WCAG_CONTRAST_RATIOS.AAA_NORMAL;

  const fgHsl = foreground.hsl;

  // Lightness를 0부터 100까지 시도
  for (let l = 0; l <= 100; l += 5) {
    const testColor = createColorFromHsl({
      h: fgHsl.h,
      s: fgHsl.s,
      l,
    });

    const ratio = getContrastRatio(testColor, background);

    if (ratio >= targetRatio) {
      return testColor;
    }
  }

  return null;
}

/**
 * 대비율을 만족하는 텍스트 색상 제안
 * 배경에 따라 검은색 또는 흰색 반환
 */
export function getReadableTextColor(background: Color): Color {
  const whiteColor = createColorFromHsl({ h: 0, s: 0, l: 100 });
  const blackColor = createColorFromHsl({ h: 0, s: 0, l: 0 });

  const whiteRatio = getContrastRatio(whiteColor, background);
  const blackRatio = getContrastRatio(blackColor, background);

  return whiteRatio > blackRatio ? whiteColor : blackColor;
}
