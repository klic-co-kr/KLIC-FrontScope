// src/constants/krds/typography.ts
// KRDS Typography System Constants

/**
 * KRDS typography style definition
 */
export interface KRDSTypography {
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing?: string;
  usage: string;
}

/**
 * KRDS typography scale
 * Based on KRDS Design System
 */
export const KRDS_TYPOGRAPHY: Record<string, KRDSTypography> = {
  // Display
  display1: { size: 64, weight: 700, lineHeight: 1.1, usage: '최대 제목' },
  display2: { size: 56, weight: 700, lineHeight: 1.1, usage: '큰 제목' },

  // Headings
  heading1: { size: 32, weight: 700, lineHeight: 1.2, usage: '섹션 타이틀' },
  heading2: { size: 28, weight: 600, lineHeight: 1.3, usage: '하위 섹션 제목' },
  heading3: { size: 24, weight: 600, lineHeight: 1.4, usage: '소제목' },
  heading4: { size: 20, weight: 600, lineHeight: 1.4, usage: '카드 제목, 폼 제목' },
  heading5: { size: 18, weight: 600, lineHeight: 1.4, usage: '작은 제목' },
  heading6: { size: 16, weight: 600, lineHeight: 1.4, usage: '가장 작은 제목' },

  // Body
  bodyLarge: { size: 16, weight: 400, lineHeight: 1.6, usage: '본문 텍스트 (기본)' },
  bodyRegular: { size: 16, weight: 400, lineHeight: 1.6, usage: '본문 텍스트' },
  bodySmall: { size: 14, weight: 400, lineHeight: 1.5, usage: '작은 본문' },

  // Labels
  labelLarge: { size: 16, weight: 500, lineHeight: 1.5, usage: '큰 입력 레이블' },
  labelMedium: { size: 14, weight: 500, lineHeight: 1.5, usage: '중간 입력 레이블' },
  labelSmall: { size: 12, weight: 500, lineHeight: 1.4, usage: '작은 입력 레이블' },

  // Buttons
  buttonLarge: { size: 18, weight: 600, lineHeight: 1, usage: '큰 버튼' },
  buttonMedium: { size: 16, weight: 600, lineHeight: 1, usage: '기본 버튼' },
  buttonSmall: { size: 14, weight: 600, lineHeight: 1, usage: '작은 버튼' },

  // Captions
  caption: { size: 12, weight: 400, lineHeight: 1.4, letterSpacing: '0.025em', usage: '캡션, 주석' },
  overline: { size: 10, weight: 500, lineHeight: 1, letterSpacing: '0.1em', usage: '오버라인 텍스트' },

  // Code
  codeInline: { size: 14, weight: 400, lineHeight: 1.5, usage: '인라인 코드' },
  codeBlock: { size: 13, weight: 400, lineHeight: 1.6, usage: '코드 블록' },
} as const;

/**
 * KRDS font families
 */
export const KRDS_FONT_FAMILIES = {
  primary: 'Pretendard GOV, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  secondary: 'Noto Sans KR, Malgun Gothic, sans-serif',
  monospace: 'D2 Coding, Courier New, Consolas, Monaco, monospace',
  english: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
} as const;

/**
 * KRDS font weights
 */
export const KRDS_FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * KRDS font sizes
 */
export const KRDS_FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 40,
  '7xl': 48,
  '8xl': 56,
  '9xl': 64,
} as const;

/**
 * KRDS line heights
 */
export const KRDS_LINE_HEIGHTS = {
  none: 1,
  tight: 1.1,
  snug: 1.2,
  normal: 1.3,
  relaxed: 1.4,
  loose: 1.5,
  looser: 1.6,
  loosest: 1.8,
} as const;

/**
 * Check if font size meets WCAG minimum (12px for captions, 16px for body)
 */
export function isMinimumFontSize(size: number, isCaption = false): boolean {
  return isCaption ? size >= 12 : size >= 16;
}

/**
 * Check if line height meets WCAG minimum (1.4 for body, 1.2 for headings)
 */
export function isMinimumLineHeight(lineHeight: number, isHeading = false): boolean {
  return isHeading ? lineHeight >= 1.2 : lineHeight >= 1.4;
}

/**
 * Find closest KRDS typography style
 */
export function findClosestTypographicStyle(size: number, weight: number): string | undefined {
  const entries = Object.entries(KRDS_TYPOGRAPHY);
  let closest: [string, KRDSTypography] | undefined;
  let minDiff = Infinity;

  for (const [key, style] of entries) {
    const sizeDiff = Math.abs(style.size - size);
    const weightDiff = Math.abs(style.weight - weight);
    const diff = sizeDiff + weightDiff * 0.5;

    if (diff < minDiff) {
      minDiff = diff;
      closest = [key, style];
    }
  }

  return closest?.[0];
}
