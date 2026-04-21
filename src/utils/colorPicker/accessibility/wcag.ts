import { Color, WCAGLevel } from '../../../types/colorPicker';
import { getContrastRatio } from './contrast';
import { WCAG_CONTRAST_RATIOS } from '../../../constants/colors';

/**
 * WCAG 레벨 검증 (일반 텍스트)
 */
export function checkWCAG(
  foreground: Color,
  background: Color,
  level: WCAGLevel
): boolean {
  const ratio = getContrastRatio(foreground, background);

  const threshold = level === 'AA'
    ? WCAG_CONTRAST_RATIOS.AA_NORMAL
    : WCAG_CONTRAST_RATIOS.AAA_NORMAL;

  return ratio >= threshold;
}

/**
 * WCAG 레벨 검증 (큰 텍스트)
 */
export function checkWCAGLargeText(
  foreground: Color,
  background: Color,
  level: WCAGLevel
): boolean {
  const ratio = getContrastRatio(foreground, background);

  const threshold = level === 'AA'
    ? WCAG_CONTRAST_RATIOS.AA_LARGE
    : WCAG_CONTRAST_RATIOS.AAA_LARGE;

  return ratio >= threshold;
}

/**
 * 모든 WCAG 레벨 결과
 */
export interface WCAGResult {
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
  ratio: number;
}

export function getWCAGResult(
  foreground: Color,
  background: Color
): WCAGResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    normalAA: ratio >= WCAG_CONTRAST_RATIOS.AA_NORMAL,
    normalAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA_NORMAL,
    largeAA: ratio >= WCAG_CONTRAST_RATIOS.AA_LARGE,
    largeAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA_LARGE,
    ratio,
  };
}
