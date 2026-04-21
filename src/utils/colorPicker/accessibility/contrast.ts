import { Color, ContrastResult } from '../../../types/colorPicker';
import { getColorLuminance } from './luminance';
import { WCAG_CONTRAST_RATIOS } from '../../../constants/colors';
import { round } from '../helpers';

/**
 * 두 색상 간 대비율 계산
 */
export function getContrastRatio(color1: Color, color2: Color): number {
  const lum1 = getColorLuminance(color1);
  const lum2 = getColorLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return round((lighter + 0.05) / (darker + 0.05), 2);
}

/**
 * 대비율 결과 생성
 */
export function getContrastResult(
  foreground: Color,
  background: Color
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  const passAA = ratio >= WCAG_CONTRAST_RATIOS.AA_NORMAL;
  const passAAA = ratio >= WCAG_CONTRAST_RATIOS.AAA_NORMAL;

  let rating: ContrastResult['rating'];
  if (ratio >= WCAG_CONTRAST_RATIOS.AAA_NORMAL) {
    rating = 'excellent';
  } else if (ratio >= WCAG_CONTRAST_RATIOS.AA_NORMAL) {
    rating = 'good';
  } else if (ratio >= WCAG_CONTRAST_RATIOS.AA_LARGE) {
    rating = 'fair';
  } else {
    rating = 'poor';
  }

  return {
    ratio,
    passAA,
    passAAA,
    rating,
  };
}
