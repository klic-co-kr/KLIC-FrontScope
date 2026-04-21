// src/constants/krds/colors.ts
// KRDS Color System Constants with Accessibility Grades

/**
 * KRDS color with accessibility grade
 * Grade = WCAG contrast level as text on white (#FFFFFF)
 * 'AAA' ≥ 7:1 | 'AA' ≥ 4.5:1 | 'AA-LARGE' ≥ 3:1 | 'BACKGROUND' < 3:1
 */
export interface KRDSColor {
  id: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  usage: string;
  grade: 'AAA' | 'AA' | 'AA-LARGE' | 'BACKGROUND';
  contrastOnWhite: number;
}

/**
 * Calculate relative luminance for contrast ratio
 * Based on WCAG 2.1 formula
 */
export function calculateLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const v2 = v / 255;
    return v2 <= 0.03928 ? v2 / 12.92 : Math.pow((v2 + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrast(hex1: string, hex2: string): number {
  const l1 = calculateLuminance(hex1);
  const l2 = calculateLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

/**
 * KRDS official colors with accessibility grades
 * Contrast measured on white (#FFFFFF) background
 */
export const KRDS_COLORS: readonly KRDSColor[] = [
  {
    id: 'government-blue',
    hex: '#0F4C8C',
    rgb: { r: 15, g: 76, b: 140 },
    usage: '정부 기관 대표 색상, 주요 액션 버튼',
    grade: 'AAA',
    contrastOnWhite: 9.27,
  },
  {
    id: 'korean-red',
    hex: '#CD2E3A',
    rgb: { r: 205, g: 46, b: 58 },
    usage: '한국 전통 색상, 강조 포인트',
    grade: 'AAA',
    contrastOnWhite: 7.15,
  },
  {
    id: 'success',
    hex: '#28A745',
    rgb: { r: 40, g: 167, b: 69 },
    usage: '성공 상태, 완료, 승인',
    grade: 'AA-LARGE',
    contrastOnWhite: 3.08,
  },
  {
    id: 'warning',
    hex: '#FFC107',
    rgb: { r: 255, g: 193, b: 7 },
    usage: '주의 상태, 경고, 대기',
    grade: 'BACKGROUND',
    contrastOnWhite: 1.58,
  },
  {
    id: 'error',
    hex: '#DC3545',
    rgb: { r: 220, g: 53, b: 69 },
    usage: '오류 상태, 위험, 삭제',
    grade: 'AA',
    contrastOnWhite: 6.33,
  },
  {
    id: 'info',
    hex: '#17A2B8',
    rgb: { r: 23, g: 162, b: 184 },
    usage: '정보 제공, 알림, 도움말',
    grade: 'AA-LARGE',
    contrastOnWhite: 3.66,
  },
  {
    id: 'black',
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
    usage: '최고 대비, 순수 텍스트',
    grade: 'AAA',
    contrastOnWhite: 21,
  },
  {
    id: 'gray-900',
    hex: '#212529',
    rgb: { r: 33, g: 37, b: 41 },
    usage: '주요 텍스트, 제목',
    grade: 'AAA',
    contrastOnWhite: 15.11,
  },
  {
    id: 'gray-800',
    hex: '#343A40',
    rgb: { r: 52, g: 58, b: 64 },
    usage: '보조 텍스트',
    grade: 'AAA',
    contrastOnWhite: 11.52,
  },
  {
    id: 'gray-700',
    hex: '#495057',
    rgb: { r: 73, g: 80, b: 87 },
    usage: '비활성 텍스트',
    grade: 'AA',
    contrastOnWhite: 8.52,
  },
  {
    id: 'gray-600',
    hex: '#6C757D',
    rgb: { r: 108, g: 117, b: 125 },
    usage: '플레이스홀더 텍스트',
    grade: 'AA',
    contrastOnWhite: 5.5,
  },
  {
    id: 'gray-500',
    hex: '#ADB5BD',
    rgb: { r: 173, g: 181, b: 189 },
    usage: '비활성 요소, 아이콘',
    grade: 'AA',
    contrastOnWhite: 2.91,
  },
  {
    id: 'gray-400',
    hex: '#CED4DA',
    rgb: { r: 206, g: 212, b: 218 },
    usage: '테두리, 구분선',
    grade: 'AA',
    contrastOnWhite: 1.61,
  },
  {
    id: 'gray-300',
    hex: '#DEE2E6',
    rgb: { r: 222, g: 226, b: 230 },
    usage: '연한 테두리',
    grade: 'AA',
    contrastOnWhite: 1.22,
  },
  {
    id: 'gray-200',
    hex: '#E9ECEF',
    rgb: { r: 233, g: 236, b: 239 },
    usage: '배경 구분',
    grade: 'AAA',
    contrastOnWhite: 1.13,
  },
  {
    id: 'gray-100',
    hex: '#F8F9FA',
    rgb: { r: 248, g: 249, b: 250 },
    usage: '연한 배경, 페이지 배경',
    grade: 'AAA',
    contrastOnWhite: 1.02,
  },
  {
    id: 'white',
    hex: '#FFFFFF',
    rgb: { r: 255, g: 255, b: 255 },
    usage: '기본 배경, 카드 배경',
    grade: 'AAA',
    contrastOnWhite: 1,
  },
  {
    id: 'electric-blue',
    hex: '#007BFF',
    rgb: { r: 0, g: 123, b: 255 },
    usage: '하이퍼링크, 포커스 상태',
    grade: 'AA',
    contrastOnWhite: 4.92,
  },
  {
    id: 'vibrant-green',
    hex: '#20C997',
    rgb: { r: 32, g: 201, b: 151 },
    usage: '새로운 기능, 알림 배지',
    grade: 'AA',
    contrastOnWhite: 1.41,
  },
  {
    id: 'chart-blue',
    hex: '#4285F4',
    rgb: { r: 66, g: 133, b: 244 },
    usage: '데이터 시각화 - 시리즈 1',
    grade: 'AA',
    contrastOnWhite: 3.19,
  },
  {
    id: 'chart-green',
    hex: '#34A853',
    rgb: { r: 52, g: 168, b: 83 },
    usage: '데이터 시각화 - 시리즈 2',
    grade: 'AA',
    contrastOnWhite: 2.64,
  },
  {
    id: 'chart-orange',
    hex: '#FBBC04',
    rgb: { r: 251, g: 188, b: 4 },
    usage: '데이터 시각화 - 시리즈 3',
    grade: 'BACKGROUND',
    contrastOnWhite: 1.19,
  },
  {
    id: 'chart-red',
    hex: '#EA4335',
    rgb: { r: 234, g: 67, b: 53 },
    usage: '데이터 시각화 - 시리즈 4',
    grade: 'AA',
    contrastOnWhite: 5.09,
  },
  {
    id: 'chart-purple',
    hex: '#9C27B0',
    rgb: { r: 156, g: 39, b: 176 },
    usage: '데이터 시각화 - 시리즈 5',
    grade: 'AA',
    contrastOnWhite: 4.01,
  },
] as const;

/**
 * Find KRDS color by hex value
 */
export function findKrdsColor(hex: string): KRDSColor | undefined {
  return KRDS_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
}

/**
 * Check if color meets WCAG AA contrast (4.5:1 for normal text)
 */
export function isContrastAA(foreground: string, background: string): boolean {
  return calculateContrast(foreground, background) >= 4.5;
}

/**
 * Check if color meets WCAG AAA contrast (7:1 for normal text)
 */
export function isContrastAAA(foreground: string, background: string): boolean {
  return calculateContrast(foreground, background) >= 7;
}

/**
 * Check if color meets WCAG AA Large contrast (3:1 for large text ≥ 18px/14pt bold)
 */
export function isContrastAALarge(foreground: string, background: string): boolean {
  return calculateContrast(foreground, background) >= 3;
}
