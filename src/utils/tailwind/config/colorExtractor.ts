/**
 * Color Config Extraction
 *
 * 페이지에서 사용된 색상 분석 및 Tailwind config 제안
 */

import type { TailwindConfig } from '../../../types/tailwindScanner';
import { hexToRgb, colorDistance } from '../../common/colorUtils';

/**
 * 색상 사용 정보
 */
interface ColorUsage {
  hex: string;
  rgb: string;
  frequency: number;
  contexts: Array<{
    property: string;
    selector: string;
  }>;
}

/**
 * 페이지에서 색상 추출
 */
export function extractColorsFromPage(): ColorUsage[] {
  const colorMap = new Map<string, ColorUsage>();

  // 모든 요소의 색상 추출
  const elements = document.querySelectorAll('*');

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    // color 속성
    const color = computedStyle.color;
    if (color && color !== 'rgba(0, 0, 0, 0)') {
      addColorToMap(colorMap, color, 'color', element);
    }

    // background-color
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      addColorToMap(colorMap, bgColor, 'background-color', element);
    }

    // border-color
    const borderColor = computedStyle.borderColor;
    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
      addColorToMap(colorMap, borderColor, 'border-color', element);
    }

    // outline-color
    const outlineColor = computedStyle.outlineColor;
    if (outlineColor && outlineColor !== 'rgba(0, 0, 0, 0)') {
      addColorToMap(colorMap, outlineColor, 'outline-color', element);
    }

    // box-shadow 색상
    const boxShadow = computedStyle.boxShadow;
    if (boxShadow && boxShadow !== 'none') {
      const shadowColor = extractShadowColor(boxShadow);
      if (shadowColor) {
        addColorToMap(colorMap, shadowColor, 'box-shadow', element);
      }
    }
  });

  // 빈도 기반 정렬
  return Array.from(colorMap.values()).sort((a, b) => b.frequency - a.frequency);
}

/**
 * 색상을 맵에 추가
 */
function addColorToMap(
  colorMap: Map<string, ColorUsage>,
  colorValue: string,
  property: string,
  element: Element
): void {
  const hex = normalizeColor(colorValue);
  if (!hex) return;

  const selector = generateSelector(element);

  if (colorMap.has(hex)) {
    const usage = colorMap.get(hex)!;
    usage.frequency++;
    usage.contexts.push({ property, selector });
  } else {
    colorMap.set(hex, {
      hex,
      rgb: colorValue,
      frequency: 1,
      contexts: [{ property, selector }],
    });
  }
}

/**
 * 색상 정규화 (RGB → HEX)
 */
function normalizeColor(colorValue: string): string | null {
  // 이미 hex
  if (colorValue.startsWith('#')) {
    return colorValue.toLowerCase();
  }

  // rgb/rgba
  const rgbMatch = colorValue.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;

    if (a < 0.01) return null; // 투명

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // named colors
  const namedColors: Record<string, string | null> = {
    'black': '#000000',
    'white': '#ffffff',
    'transparent': null,
    'inherit': null,
    'current': null,
  };

  const lower = colorValue.toLowerCase();
  if (namedColors[lower] !== undefined) {
    return namedColors[lower];
  }

  return null;
}

/**
 * box-shadow에서 색상 추출
 */
function extractShadowColor(boxShadow: string): string | null {
  // box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.5)
  const colorMatch = boxShadow.match(
    /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/
  );
  return colorMatch ? colorMatch[0] : null;
}

/**
 * 요소 선택자 생성
 */
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const classes = Array.from(element.classList)
    .filter((c) => c.length < 20)
    .slice(0, 2)
    .join('.');

  if (classes) {
    return `${element.tagName.toLowerCase()}.${classes}`;
  }

  return element.tagName.toLowerCase();
}

/**
 * Tailwind 색상과 비교하여 커스텀 색상 식별
 */
export function identifyCustomColors(usages: ColorUsage[]): {
  custom: Array<{
    name: string;
    hex: string;
    frequency: number;
    suggestedShade: string;
  }>;
  tailwind: Array<{
    name: string;
    shade: number;
    hex: string;
    frequency: number;
  }>;
} {
  const custom: Array<{
    name: string;
    hex: string;
    frequency: number;
    suggestedShade: string;
  }> = [];
  const tailwind: Array<{
    name: string;
    shade: number;
    hex: string;
    frequency: number;
  }> = [];

  // Tailwind 기본 색상 (일부)
  const tailwindColors = getTailwindColorMap();

  usages.forEach((usage) => {
    const { hex, frequency } = usage;

    // 가장 가까운 Tailwind 색상 찾기
    const closest = findClosestTailwindColor(hex, tailwindColors);

    if (closest && closest.distance < 10) {
      // Tailwind 색상으로 간주
      tailwind.push({
        name: closest.colorName,
        shade: closest.shade,
        hex,
        frequency,
      });
    } else {
      // 커스텀 색상
      custom.push({
        name: generateCustomColorName(hex),
        hex,
        frequency,
        suggestedShade: closest ? `${closest.colorName}-${closest.shade}` : 'unknown',
      });
    }
  });

  return { custom, tailwind };
}

/**
 * Tailwind 색상 맵 가져오기
 */
function getTailwindColorMap(): Map<string, Map<number, string>> {
  const colors = new Map<string, Map<number, string>>();

  const colorData: Record<string, Record<number, string>> = {
    gray: {
      50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
      400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
      800: '#1f2937', 900: '#111827', 950: '#030712',
    },
    red: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
      800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
    },
    blue: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
      800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
    },
    green: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
      400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
      800: '#166534', 900: '#14532d', 950: '#052e16',
    },
  };

  for (const [name, shades] of Object.entries(colorData)) {
    const shadeMap = new Map<number, string>();
    for (const [shadeStr, hex] of Object.entries(shades)) {
      shadeMap.set(parseInt(shadeStr, 10), hex);
    }
    colors.set(name, shadeMap);
  }

  return colors;
}

/**
 * 가장 가까운 Tailwind 색상 찾기
 */
function findClosestTailwindColor(
  hex: string,
  tailwindColors: Map<string, Map<number, string>>
): { colorName: string; shade: number; distance: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  let closest: { colorName: string; shade: number; distance: number } | null = null;
  let minDistance = Infinity;

  for (const [colorName, shades] of tailwindColors.entries()) {
    for (const [shade, shadeHex] of shades.entries()) {
      const shadeRgb = hexToRgb(shadeHex);
      if (!shadeRgb) continue;

      const distance = colorDistance(rgb, shadeRgb);
      if (distance < minDistance) {
        minDistance = distance;
        closest = { colorName, shade, distance };
      }
    }
  }

  return closest;
}


/**
 * 커스텀 색상 이름 생성
 */
function generateCustomColorName(hex: string): string {
  // 색상 톤 기반 이름 생성
  const rgb = hexToRgb(hex);
  if (!rgb) return `custom-${hex.slice(1)}`;

  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // 회색 계열
  if (max - min < 30) {
    const lightness = (r + g + b) / 3;
    if (lightness < 128) return 'gray-dark';
    if (lightness > 200) return 'gray-light';
    return 'gray';
  }

  // 빨강 계열
  if (r > g && r > b) {
    if (g > b * 1.5) return 'orange';
    if (b > g * 1.5) return 'purple';
    return 'red';
  }

  // 초록 계열
  if (g > r && g > b) {
    if (r > b * 1.2) return 'lime';
    if (b > r * 1.2) return 'teal';
    return 'green';
  }

  // 파랑 계열
  if (b > r && b > g) {
    if (r > g * 1.2) return 'purple';
    if (g > r * 1.2) return 'cyan';
    return 'blue';
  }

  return `custom-${hex.slice(1)}`;
}

/**
 * 색상 config 생성
 */
export function generateColorConfig(usages: ColorUsage[]): {
  colors: Record<string, string | Record<string, string>>;
  recommendations: string[];
} {
  const { custom } = identifyCustomColors(usages);

  const colors: Record<string, string | Record<string, string>> = {};
  const recommendations: string[] = [];

  // 빈도가 높은 커스텀 색상 추가
  custom.filter(c => c.frequency >= 3).forEach((color) => {
    // 비슷한 색상끼리 그룹화
    const baseName = color.name.split('-')[0];
    if (!colors[baseName]) {
      colors[baseName] = {};
    }

    if (typeof colors[baseName] === 'object') {
      // 음영 계산
      const shade = calculateShade(color.hex);
      (colors[baseName] as Record<string, string>)[shade] = color.hex;
    }

    recommendations.push(
      `"${color.name}" (${color.hex})이(가) ${color.frequency}번 사용됨 - ${color.suggestedShade}와 유사`
    );
  });

  return { colors, recommendations };
}

/**
 * 색상 음영 계산
 */
function calculateShade(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 500;

  const { r, g, b } = rgb;
  // 밝기 계산 (Perceived brightness)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 밝기를 음영으로 매핑
  if (brightness < 50) return 950;
  if (brightness < 80) return 900;
  if (brightness < 120) return 800;
  if (brightness < 160) return 700;
  if (brightness < 200) return 600;
  if (brightness < 240) return 500;
  if (brightness < 250) return 400;
  return 50;
}

/**
 * 완전한 색상 설정 추출
 */
export function extractColorConfig(): TailwindConfig['theme'] {
  const usages = extractColorsFromPage();
  const { colors } = generateColorConfig(usages);

  return {
    colors,
  };
}
