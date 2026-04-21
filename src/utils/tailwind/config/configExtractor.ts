/**
 * Tailwind Config Extraction
 *
 * 페이지에서 Tailwind 설정 추출
 */

import type { TailwindConfig } from '../../../types/tailwindScanner';

/**
 * 스크립트 태그에서 Tailwind 설정 추출
 */
export function extractConfigFromScript(): Partial<TailwindConfig> | null {
  const scripts = document.querySelectorAll('script');
  const config: Partial<TailwindConfig> = {};

  for (const script of scripts) {
    const content = script.textContent;
    if (!content) continue;

    // tailwind.config 객체 찾기
    const configMatch = content.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\});/);
    if (!configMatch) continue;

    try {
      // 설정 파싱 (간단한 eval 대신 파싱 시도)
      const configStr = configMatch[1];
      const parsed = parseConfigObject(configStr);
      if (parsed) {
        return parsed;
      }
    } catch {
      // 파싱 실패 시 계속
    }
  }

  // 추론된 설정 반환
  return config;
}

/**
 * 설정 객체 파싱
 */
function parseConfigObject(configStr: string): Partial<TailwindConfig> | null {
  try {
    // 안전한 파싱을 위한 간단한 접근
    const config: Partial<TailwindConfig> = {};

    // theme 추출
    const themeMatch = configStr.match(/theme\s*:\s*(\{[\s\S]*?\})/);
    if (themeMatch) {
      config.theme = parseTheme(themeMatch[1]);
    }

    // plugins 추출
    const pluginsMatch = configStr.match(/plugins\s*:\s*\[([\s\S]*?)\]/);
    if (pluginsMatch) {
      config.plugins = parsePlugins(pluginsMatch[1]);
    }

    // content 추출
    const contentMatch = configStr.match(/content\s*:\s*\[([\s\S]*?)\]/);
    if (contentMatch) {
      config.content = parseContent(contentMatch[1]);
    }

    // safelist 추출
    const safelistMatch = configStr.match(/safelist\s*:\s*\[([\s\S]*?)\]/);
    if (safelistMatch) {
      config.safelist = parseSafelist(safelistMatch[1]);
    }

    // important 추출
    const importantMatch = configStr.match(/important\s*:\s*(true|false|'[^']*')/);
    if (importantMatch) {
      config.important = importantMatch[1] === 'true' || importantMatch[1] === "'[data-tw-foo]'";
    }

    return config;
  } catch {
    return null;
  }
}

/**
 * theme 파싱
 */
function parseTheme(themeStr: string): TailwindConfig['theme'] {
  const theme: Record<string, unknown> = {};

  // colors 추출
  const colorsMatch = themeStr.match(/colors\s*:\s*(\{[\s\S]*?\})/);
  if (colorsMatch) {
    theme.colors = parseColors(colorsMatch[1]);
  }

  // spacing 추출
  const spacingMatch = themeStr.match(/spacing\s*:\s*(\{[\s\S]*?\})/);
  if (spacingMatch) {
    theme.spacing = parseSpacing(spacingMatch[1]);
  }

  // extend 추출
  const extendMatch = themeStr.match(/extend\s*:\s*(\{[\s\S]*?\})/);
  if (extendMatch) {
    theme.extend = parseExtend(extendMatch[1]);
  }

  return theme;
}

/**
 * 색상 파싱
 */
function parseColors(colorsStr: string): Record<string, string | Record<string, string>> {
  const colors: Record<string, string | Record<string, string>> = {};

  // 간단한 색상 패턴 파싱
  const colorMatches = colorsStr.match(/(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|(\{[\s\S]*?\}))/g);
  if (colorMatches) {
    colorMatches.forEach((match) => {
      const [, name, value1, value2] = match.match(/(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|(\{[\s\S]*?\}))/) || [];
      const value = value1 || value2;
      if (name && value) {
        colors[name] = value;
      }
    });
  }

  return colors;
}

/**
 * spacing 파싱
 */
function parseSpacing(spacingStr: string): Record<string, string> {
  const spacing: Record<string, string> = {};

  const spacingMatches = spacingStr.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/g);
  if (spacingMatches) {
    spacingMatches.forEach((match) => {
      const [, name, value] = match.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/) || [];
      if (name && value) {
        spacing[name] = value;
      }
    });
  }

  return spacing;
}

/**
 * extend 파싱
 */
function parseExtend(extendStr: string): Record<string, unknown> {
  const extend: Record<string, unknown> = {};

  // colors 추출
  const colorsMatch = extendStr.match(/colors\s*:\s*(\{[\s\S]*?\})/);
  if (colorsMatch) {
    extend.colors = parseColors(colorsMatch[1]);
  }

  // spacing 추출
  const spacingMatch = extendStr.match(/spacing\s*:\s*(\{[\s\S]*?\})/);
  if (spacingMatch) {
    extend.spacing = parseSpacing(spacingMatch[1]);
  }

  return extend;
}

/**
 * plugins 파싱
 */
function parsePlugins(pluginsStr: string): string[] {
  const plugins: string[] = [];

  // plugin 이름 추출
  const pluginMatches = pluginsStr.match(/require\(['"]([^'"]+)['"]\)/g);
  if (pluginMatches) {
    pluginMatches.forEach((match) => {
      const name = match.match(/require\(['"]([^'"]+)['"]\)/)?.[1];
      if (name) {
        plugins.push(name);
      }
    });
  }

  return plugins;
}

/**
 * content 파싱
 */
function parseContent(contentStr: string): string[] {
  const content: string[] = [];

  // 경로 패턴 추출
  const pathMatches = contentStr.match(/['"]([^'"]+)['"]/g);
  if (pathMatches) {
    pathMatches.forEach((match) => {
      const path = match.slice(1, -1);
      if (path) {
        content.push(path);
      }
    });
  }

  return content;
}

/**
 * safelist 파싱
 */
function parseSafelist(safelistStr: string): string[] {
  const safelist: string[] = [];

  // 패턴 추출
  const patternMatches = safelistStr.match(/['"]([^'"]+)['"]/g);
  if (patternMatches) {
    patternMatches.forEach((match) => {
      const pattern = match.slice(1, -1);
      if (pattern) {
        safelist.push(pattern);
      }
    });
  }

  return safelist;
}

/**
 * 사용된 커스텀 색상 추론
 */
export function inferUsedColors(): Record<string, string> {
  const elements = document.querySelectorAll('[class]');
  const colorUsage = new Map<string, number>();

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const bgColor = computedStyle.backgroundColor;

    if (color) {
      const hex = rgbToHex(color);
      if (hex) {
        colorUsage.set(hex, (colorUsage.get(hex) || 0) + 1);
      }
    }

    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      const hex = rgbToHex(bgColor);
      if (hex) {
        colorUsage.set(hex, (colorUsage.get(hex) || 0) + 1);
      }
    }
  });

  // 가장 자주 사용된 색상 반환
  const sortedColors = Array.from(colorUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([color]) => color);

  // Tailwind 색상과 비교하여 커스텀 색상 식별
  const customColors: Record<string, string> = {};
  sortedColors.forEach((color) => {
    if (!isTailwindColor(color)) {
      const name = generateColorName(color);
      customColors[name] = color;
    }
  });

  return customColors;
}

/**
 * RGB를 Hex로 변환
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;

  const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Tailwind 색상인지 확인
 */
function isTailwindColor(hex: string): boolean {
  // Tailwind 기본 색상 목록
  const tailwindColors = [
    '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
    '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
    '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
    '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
    '#84cc16', '#65a30d', '#4d7c0f', '#3f6212', '#365314',
    '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
    '#14b8a1', '#0d9488', '#0f766e', '#115e59', '#134e4a',
    '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
    '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e',
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
    '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
    '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
    '#d946ef', '#c026d3', '#a21caf', '#86198f', '#701a75',
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
    '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337',
    '#000000', '#ffffff',
  ];

  return tailwindColors.includes(hex.toLowerCase());
}

/**
 * 색상 이름 생성
 */
function generateColorName(hex: string): string {
  // 간단한 해시 기반 이름 생성
  const hash = parseInt(hex.slice(1), 16);
  return `custom-${hash.toString(36)}`;
}

/**
 * 사용된 커스텀 spacing 추론
 */
export function inferUsedSpacing(): Record<string, string> {
  const elements = document.querySelectorAll('[style*="padding"], [style*="margin"]');
  const spacingUsage = new Map<string, number>();

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
     'marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach((prop) => {
      const value = computedStyle[prop as keyof CSSStyleDeclaration] as string;
      if (value && value !== '0px' && value !== 'auto') {
        // px를 rem으로 변환
        const pxMatch = value.match(/(\d+(?:\.\d+)?)px/);
        if (pxMatch) {
          const pxValue = parseFloat(pxMatch[1]);
          const remValue = (pxValue / 16).toFixed(3);
          spacingUsage.set(remValue, (spacingUsage.get(remValue) || 0) + 1);
        }
      }
    });
  });

  // 커스텀 spacing 반환
  const customSpacing: Record<string, string> = {};
  spacingUsage.forEach((count, value) => {
    if (count >= 3 && !isTailwindSpacing(value)) {
      const name = `spacing-${Math.round(parseFloat(value) * 100)}`;
      customSpacing[name] = `${value}rem`;
    }
  });

  return customSpacing;
}

/**
 * Tailwind spacing인지 확인
 */
function isTailwindSpacing(remValue: string): boolean {
  const tailwindSpacing = ['0', '0.25', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'];
  return tailwindSpacing.includes(remValue);
}

/**
 * 완전한 설정 추출
 */
export function extractFullConfig(): TailwindConfig {
  const scriptConfig = extractConfigFromScript();
  const inferredColors = inferUsedColors();
  const inferredSpacing = inferUsedSpacing();

  return {
    ...scriptConfig,
    theme: {
      ...scriptConfig?.theme,
      colors: {
        ...scriptConfig?.theme?.colors,
        ...inferredColors,
      },
      spacing: {
        ...scriptConfig?.theme?.spacing,
        ...inferredSpacing,
      },
      extend: {
        ...scriptConfig?.theme?.extend,
      },
    },
    plugins: scriptConfig?.plugins || [],
    content: scriptConfig?.content || [],
    safelist: scriptConfig?.safelist || [],
    important: scriptConfig?.important || false,
  };
}
