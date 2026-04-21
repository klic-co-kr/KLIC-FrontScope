/**
 * CSS Utilities
 *
 * DOM 스타일 조작 및 색상 변환 유틸리티
 */

/**
 * CSS 주입
 */
export function injectCSS(styles: string, id?: string): HTMLStyleElement {
  const style = document.createElement('style');

  if (id) {
    style.id = id;

    // 이미 존재하면 제거
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }

  style.textContent = styles;
  document.head.appendChild(style);

  return style;
}

/**
 * CSS 제거
 */
export function removeCSS(id: string): boolean {
  const style = document.getElementById(id);
  if (style) {
    style.remove();
    return true;
  }
  return false;
}

/**
 * CSS 업데이트
 */
export function updateCSS(id: string, styles: string): boolean {
  const style = document.getElementById(id) as HTMLStyleElement;
  if (style) {
    style.textContent = styles;
    return true;
  }
  return false;
}

/**
 * CSS 존재 확인
 */
export function hasCSS(id: string): boolean {
  return !!document.getElementById(id);
}

/**
 * 클래스명 생성 (cls 패턴)
 */
export function createClassName(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * 스타일 적용
 */
export function applyStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.assign(element.style, styles);
}

/**
 * 계산된 스타일 가져오기
 */
export function getComputedStyles(
  element: HTMLElement,
  properties: string[]
): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const result: Record<string, string> = {};

  properties.forEach(prop => {
    result[prop] = computed.getPropertyValue(prop);
  });

  return result;
}

/**
 * 단일 계산된 스타일 값 가져오기
 */
export function getComputedStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * 색상 파싱 (rgba 객체로 변환)
 */
export function parseColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} | null {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

  return { r, g, b, a: a / 255 };
}

/**
 * RGB를 Hex로 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * RGBA를 Hex로 변환
 */
export function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const alpha = Math.round(a * 255);
  return '#' + [r, g, b, alpha].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Hex를 RGB로 변환
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Hex를 RGBA로 변환
 */
export function hexToRgba(hex: string, alpha: number = 1): { r: number; g: number; b: number; a: number } | null {
  const rgb = hexToRgb(hex);
  return rgb ? { ...rgb, a: alpha } : null;
}

/**
 * 색상 밝기 확인 (밝은색 true, 어두운색 false)
 */
export function isLightColor(color: string): boolean {
  const parsed = parseColor(color);
  if (!parsed) return false;

  // 밝기 계산 (YIQ formula)
  const yiq = (parsed.r * 299 + parsed.g * 587 + parsed.b * 114) / 1000;
  return yiq >= 128;
}

/**
 * 대비색상 반환 (검은색 또는 흰색)
 */
export function getContrastColor(color: string): string {
  return isLightColor(color) ? '#000000' : '#FFFFFF';
}

/**
 * 색상 혼합
 */
export function blendColors(color1: string, color2: string, ratio: number = 0.5): string | null {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  if (!c1 || !c2) return null;

  const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
  const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
  const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
  const a = c1.a * (1 - ratio) + c2.a * ratio;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  return rgbToHex(r, g, b);
}

/**
 * CSS 단위 변환
 */
export function convertCssUnit(
  value: string,
  fromUnit: 'px' | 'rem' | 'em' | 'vw' | 'vh',
  toUnit: 'px' | 'rem' | 'em' | 'vw' | 'vh',
  baseFontSize: number = 16,
  viewportWidth: number = window.innerWidth,
  viewportHeight: number = window.innerHeight
): number | null {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  let pxValue: number;

  // 먼저 px로 변환
  switch (fromUnit) {
    case 'px':
      pxValue = numValue;
      break;
    case 'rem':
    case 'em':
      pxValue = numValue * baseFontSize;
      break;
    case 'vw':
      pxValue = (numValue / 100) * viewportWidth;
      break;
    case 'vh':
      pxValue = (numValue / 100) * viewportHeight;
      break;
    default:
      return null;
  }

  // px에서 목표 단위로 변환
  switch (toUnit) {
    case 'px':
      return pxValue;
    case 'rem':
    case 'em':
      return pxValue / baseFontSize;
    case 'vw':
      return (pxValue / viewportWidth) * 100;
    case 'vh':
      return (pxValue / viewportHeight) * 100;
    default:
      return null;
  }
}

/**
 * 스타일 속성 camelCase를 kebab-case로 변환
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * 스타일 속성 kebab-case를 camelCase로 변환
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
