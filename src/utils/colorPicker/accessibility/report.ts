import { Color } from '../../../types/colorPicker';
import { getWCAGResult, WCAGResult } from './wcag';
import { getReadableTextColor } from './suggestions';

/**
 * 접근성 리포트
 */
export interface AccessibilityReport {
  wcag: WCAGResult;
  readableTextColor: Color;
  recommendations: string[];
}

/**
 * 접근성 리포트 생성
 */
export function generateAccessibilityReport(
  foreground: Color,
  background: Color
): AccessibilityReport {
  const wcag = getWCAGResult(foreground, background);
  const readableTextColor = getReadableTextColor(background);

  const recommendations: string[] = [];

  if (!wcag.normalAA) {
    recommendations.push('일반 텍스트에 대한 AA 기준을 만족하지 않습니다.');
  }

  if (!wcag.normalAAA) {
    recommendations.push('일반 텍스트에 대한 AAA 기준을 만족하지 않습니다.');
  }

  if (wcag.largeAA && !wcag.normalAA) {
    recommendations.push('큰 텍스트(18pt 이상 또는 14pt 굵게)만 사용하세요.');
  }

  if (wcag.ratio < 3) {
    recommendations.push('대비율이 너무 낮습니다. 색상을 변경하세요.');
  }

  return {
    wcag,
    readableTextColor,
    recommendations,
  };
}
