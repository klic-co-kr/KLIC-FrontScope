// src/utils/accessibility/colorValidator.ts
// Color Contrast Validator - WCAG 2.1 AA + KRDS Color System

import type { AccessibilityIssue, ValidationCategory } from '@/types/accessibility';
import { findKrdsColor } from '@/constants/krds/colors';
import { parseColor } from './selectorUtils';

const category: ValidationCategory = 'color';

/**
 * Validate color contrast against WCAG 2.1 AA and KRDS color system
 */
export function validateColors(elements: HTMLElement[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const checked = new Set<string>();

  for (const el of elements) {
    const colors = getTextColors(el);
    if (!colors) continue;

    const { foreground, background } = colors;
    const key = `${foreground}|${background}`;
    if (checked.has(key)) continue;
    checked.add(key);

    // Calculate contrast
    const fg = parseColor(foreground);
    const bg = parseColor(background);
    if (!fg || !bg) continue;

    const ratio = calculateContrast(fg, bg);

    // Get font size for determining AA vs AA-Large threshold
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

    // Check WCAG AA compliance
    const threshold = isLargeText ? 3 : 4.5;
    if (ratio < threshold) {
      issues.push({
        id: `color-contrast-${Date.now()}-${Math.random()}`,
        category,
        severity: 'critical',
        rule: 'text-contrast-aa',
        message: `텍스트 대비율이 부족합니다 (${ratio.toFixed(2)}:1, 최소 ${threshold}:1 필요)`,
        suggestion: '텍스트 또는 배경색을 조정하여 대비율을 높이세요',
        wcagCriteria: isLargeText ? '1.4.3' : '1.4.3',
      });
    }

    // Check if colors match KRDS palette
    const krdsFg = findKrdsColor(foreground);
    if (!krdsFg && !foreground.startsWith('#')) {
      // Not a KRDS color or hex value
      issues.push({
        id: `color-palette-${Date.now()}-${Math.random()}`,
        category,
        severity: 'info',
        rule: 'krds-palette-match',
        message: `색상이 KRDS 팔레트와 일치하지 않습니다: ${foreground}`,
        suggestion: 'KRDS 공식 색상을 사용하세요 (정부 표준색 #0F4C8C 등)',
      });
    }

    // Check for color-only information (color used without additional indicators)
    const text = el.textContent?.trim();
    if (text && text.length < 30 && el.classList.length > 0) {
      const hasOnlyColorStyling = Array.from(el.classList).some((cls: string) =>
        cls.includes('text-') || cls.includes('error') || cls.includes('success')
      );

      if (hasOnlyColorStyling) {
        issues.push({
          id: `color-only-info-${Date.now()}-${Math.random()}`,
          category,
          severity: 'medium',
          rule: 'color-only',
          message: '정보가 색상만으로 전달될 수 있습니다',
          suggestion: '아이콘이나 텍스트 레이블을 함께 제공하세요',
          wcagCriteria: '1.4.1',
        });
      }
    }
  }

  return issues;
}

/**
 * Get text and background colors from element
 */
function getTextColors(element: HTMLElement): { foreground: string; background: string } | null {
  const style = window.getComputedStyle(element);

  const foreground = style.color.trim();
  let background = style.backgroundColor.trim();

  // Handle transparent backgrounds - traverse to parent
  if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      background = parentStyle.backgroundColor.trim();
      if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') {
        break;
      }
      parent = parent.parentElement;
    }
  }

  // Validate colors
  if (foreground === 'rgba(0, 0, 0, 0)') return null; // No foreground
  if (background === 'rgba(0, 0, 0, 0)') return null; // No background

  return { foreground, background };
}

/**
 * Calculate contrast ratio between two colors
 * Using WCAG 2.1 relative luminance formula
 */
function calculateContrast(
  color1: { r: number; g: number; b: number; a: number },
  color2: { r: number; g: number; b: number; a: number }
): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance (WCAG 2.1)
 */
function relativeLuminance(color: { r: number; g: number; b: number; a: number }): number {
  // Normalize to 0-1 range
  const rsRGB = linearRGB(color.r / 255);
  const gsRGB = linearRGB(color.g / 255);
  const bsRGB = linearRGB(color.b / 255);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Linearize RGB value
 */
function linearRGB(value: number): number {
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}
