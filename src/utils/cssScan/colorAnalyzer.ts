/**
 * Color Analyzer Utilities
 *
 * CSS 색상 분석 유틸리티
 */

import type { ColorInfo } from '../../types/cssScan';
import { hexToRgb, rgbToHex } from '../common/colorUtils';

/**
 * 색상 정보 추출
 */
export function extractColorInfo(
  element: HTMLElement,
  properties: string[] = [
    'color',
    'background-color',
    'border-color',
    'outline-color',
    'text-decoration-color',
  ]
): ColorInfo[] {
  const colors: ColorInfo[] = [];
  const computedStyle = window.getComputedStyle(element);

  for (const prop of properties) {
    const value = computedStyle.getPropertyValue(prop);
    if (!value || value === 'none' || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
      continue;
    }

    const colorInfo = parseColor(value);
    if (colorInfo) {
      colors.push({
        property: prop,
        value,
        ...colorInfo,
      });
    }
  }

  return colors;
}

/**
 * 색상 파싱
 */
export function parseColor(colorValue: string): Omit<ColorInfo, 'property' | 'value'> | null {
  const color = colorValue.trim();

  // Hex 색상
  const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    const hex = normalizeHex(hexMatch[1]);
    const rgb = hexToRgb(hex);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
    return {
      hex,
      rgb: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : color,
      hsl: hsl ?? color,
      format: 'hex',
      alpha: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }

  // RGB/RGBA 색상
  const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;

    return {
      hex: rgbToHex(r, g, b),
      rgb: rgbMatch[4] ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`,
      hsl: rgbToHsl(r, g, b),
      format: rgbMatch[4] ? 'rgba' : 'rgb',
      alpha: a,
    };
  }

  // HSL/HSLA 색상
  const hslMatch = color.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]);
    const l = parseInt(hslMatch[3]);
    const a = hslMatch[4] ? parseFloat(hslMatch[4]) : 1;

    const rgb = hslToRgb(h, s, l);

    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb: hslMatch[4] ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: hslMatch[4] ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`,
      format: hslMatch[4] ? 'hsla' : 'hsl',
      alpha: a,
    };
  }

  // 명명된 색상
  const namedColors: Record<string, string> = {
    transparent: '#00000000',
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    brown: '#a52a2a',
    gray: '#808080',
    grey: '#808080',
    // ... 더 많은 색상 추가 가능
  };

  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    const hex = namedColors[lowerColor];
    const rgb = hexToRgb(hex);
    return {
      hex,
      rgb: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : color,
      hsl: rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : color,
      format: 'named',
      alpha: 1,
    };
  }

  // currentcolor, inherit 등
  if (lowerColor === 'currentcolor' || lowerColor === 'inherit' || lowerColor === 'initial' || lowerColor === 'unset') {
    return {
      hex: '#000000',
      rgb: 'rgb(0, 0, 0)',
      hsl: 'hsl(0, 0%, 0%)',
      format: 'named',
      alpha: 1,
    };
  }

  return null;
}

/**
 * Hex 색상 정규화
 */
function normalizeHex(hex: string): string {
  if (hex.length === 3) {
    return hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  if (hex.length === 4) {
    return hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  return hex.toLowerCase();
}


/**
 * RGB를 HSL로 변환
 */
function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/**
 * HSL을 RGB로 변환
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * 대비율 계산 (WCAG)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 밝기 계산
 */
export function calculateLuminance(color: string): number {
  const rgb = parseColor(color)?.rgb;
  if (!rgb) return 0;

  const match = rgb.match(/rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/);
  if (!match) return 0;

  let r = parseInt(match[1]) / 255;
  let g = parseInt(match[2]) / 255;
  let b = parseInt(match[3]) / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 색상 혼합
 */
export function blendColors(
  color1: string,
  color2: string,
  ratio: number = 0.5
): string {
  const rgb1 = parseColor(color1)?.rgb;
  const rgb2 = parseColor(color2)?.rgb;

  if (!rgb1 || !rgb2) return color1;

  const match1 = rgb1.match(/rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  const match2 = rgb2.match(/rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);

  if (!match1 || !match2) return color1;

  const r1 = parseInt(match1[1]);
  const g1 = parseInt(match1[2]);
  const b1 = parseInt(match1[3]);
  const a1 = match1[4] ? parseFloat(match1[4]) : 1;

  const r2 = parseInt(match2[1]);
  const g2 = parseInt(match2[2]);
  const b2 = parseInt(match2[3]);
  const a2 = match2[4] ? parseFloat(match2[4]) : 1;

  const r = Math.round(r1 * ratio + r2 * (1 - ratio));
  const g = Math.round(g1 * ratio + g2 * (1 - ratio));
  const b = Math.round(b1 * ratio + b2 * (1 - ratio));
  const a = a1 * ratio + a2 * (1 - ratio);

  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * 색상 반전
 */
export function invertColor(color: string): string {
  const rgb = parseColor(color)?.rgb;
  if (!rgb) return color;

  const match = rgb.match(/rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (!match) return color;

  const r = 255 - parseInt(match[1]);
  const g = 255 - parseInt(match[2]);
  const b = 255 - parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;

  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * 색상 밝기 조정
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = parseColor(color)?.rgb;
  if (!rgb) return color;

  const match = rgb.match(/rgb(?:a)?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (!match) return color;

  let r = parseInt(match[1]);
  let g = parseInt(match[2]);
  let b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;

  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));

  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

/**
 * 색상 채도 조정
 */
export function adjustSaturation(color: string, percent: number): string {
  const hsl = parseColor(color)?.hsl;
  if (!hsl) return color;

  const match = hsl.match(/hsl(?:a)?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (!match) return color;

  const h = parseInt(match[1]);
  let s = parseInt(match[2]);
  const l = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;

  s = Math.max(0, Math.min(100, s * (1 + percent / 100)));

  return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * 페이지의 모든 색상 추출
 */
export function extractPageColors(): Map<string, number> {
  const colorMap = new Map<string, number>();
  const elements = document.querySelectorAll('*');

  for (const element of Array.from(elements)) {
    if (!(element instanceof HTMLElement)) continue;

    const styles = window.getComputedStyle(element);
    const colorProperties = [
      'color',
      'background-color',
      'border-color',
      'outline-color',
    ];

    for (const prop of colorProperties) {
      const value = styles.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') {
        const colorInfo = parseColor(value);
        if (colorInfo) {
          const hex = colorInfo.hex;
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }
      }
    }
  }

  return colorMap;
}

/**
 * 가장 많이 사용된 색상
 */
export function getMostUsedColors(limit: number = 10): Array<{
  color: string;
  count: number;
  percentage: number;
}> {
  const colorMap = extractPageColors();
  const total = Array.from(colorMap.values()).reduce((sum, count) => sum + count, 0);

  return Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([color, count]) => ({
      color,
      count,
      percentage: (count / total) * 100,
    }));
}
