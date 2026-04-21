import { ColorFormat } from '../types/colorPicker';

/**
 * 기본 색상 포맷
 */
export const DEFAULT_COLOR_FORMAT: ColorFormat = 'hex';

/**
 * 지원하는 색상 포맷
 */
export const COLOR_FORMATS: readonly ColorFormat[] = [
  'hex',
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hsv',
  'cssvar',
] as const;

/**
 * 포맷 표시 이름
 */
export const COLOR_FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: 'HEX',
  rgb: 'RGB',
  rgba: 'RGBA',
  hsl: 'HSL',
  hsla: 'HSLA',
  hsv: 'HSV',
  cssvar: 'CSS Variable',
};

/**
 * WCAG 대비율 기준
 */
export const WCAG_CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,        // AA 일반 텍스트
  AA_LARGE: 3,           // AA 큰 텍스트
  AAA_NORMAL: 7,         // AAA 일반 텍스트
  AAA_LARGE: 4.5,        // AAA 큰 텍스트
} as const;

/**
 * 팔레트 타입 표시 이름
 */
export const PALETTE_TYPE_LABELS = {
  analogous: '유사색',
  complementary: '보색',
  triadic: '3색 조합',
  tetradic: '4색 조합',
  monochromatic: '단색 조합',
  shades: '명암 변화',
  tints: '색조 변화',
} as const;

/**
 * 팔레트 타입별 기본 색상 개수
 */
export const PALETTE_DEFAULT_COUNTS = {
  analogous: 5,
  complementary: 2,
  triadic: 3,
  tetradic: 4,
  monochromatic: 7,
  shades: 7,
  tints: 7,
} as const;

/**
 * Export 포맷 레이블
 */
export const EXPORT_FORMAT_LABELS = {
  json: 'JSON',
  css: 'CSS',
  scss: 'SCSS',
  tailwind: 'Tailwind',
  csv: 'CSV',
} as const;
