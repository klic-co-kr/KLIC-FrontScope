// src/constants/krds/systems.ts
// KRDS System Constants (Grid, Responsive, Dark Mode)

/**
 * KRDS breakpoint definition
 */
export interface KRDSBreakpoint {
  name: string;
  min: number;
  max?: number;
  columns: number | string;
  touchTarget: number;
}

/**
 * KRDS grid system
 */
export const KRDS_GRID = {
  // Container max widths
  containerMaxWidths: {
    sm: 540,
    md: 720,
    lg: 960,
    xl: 1140,
    xxl: 1320,
  },
  // Columns
  columns: 12,
  // Gutter width
  gutter: 24,
} as const;

/**
 * KRDS breakpoints
 */
export const KRDS_BREAKPOINTS: Readonly<Record<string, KRDSBreakpoint>> = {
  xs: { name: 'xs', min: 0, columns: 1, touchTarget: 44 },
  sm: { name: 'sm', min: 576, columns: 1, touchTarget: 44 },
  md: { name: 'md', min: 768, columns: '2-3', touchTarget: 44 },
  lg: { name: 'lg', min: 992, columns: 'multi', touchTarget: 44 },
  xl: { name: 'xl', min: 1200, columns: 'multi', touchTarget: 44 },
  xxl: { name: 'xxl', min: 1400, columns: 'multi', touchTarget: 44 },
} as const;

/**
 * Responsive device ranges
 */
export const KRDS_DEVICE_RANGES = {
  mobile: { min: 320, max: 767, label: 'mobile' },
  tablet: { min: 768, max: 1023, label: 'tablet' },
  desktop: { min: 1024, max: 1439, label: 'desktop' },
  wide: { min: 1440, label: 'wide' },
} as const;

/**
 * Touch target minimum size (KRDS mobile guideline)
 */
export const KRDS_TOUCH_TARGET_MIN = 44;

/**
 * Viewport meta tag requirements
 */
export const VIEWPORT_META_REQUIREMENTS = {
  width: 'device-width',
  'initial-scale': '1',
} as const;

/**
 * Get current breakpoint based on viewport width
 */
export function getCurrentBreakpoint(width: number): string {
  if (width < 576) return 'xs';
  if (width < 768) return 'sm';
  if (width < 992) return 'md';
  if (width < 1200) return 'lg';
  if (width < 1400) return 'xl';
  return 'xxl';
}

/**
 * Get device type based on viewport width
 */
export function getDeviceType(width: number): string {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'desktop';
  return 'wide';
}

/**
 * Check if element meets minimum touch target size (44x44px)
 */
export function meetsTouchTargetSize(width: number, height: number): boolean {
  return width >= KRDS_TOUCH_TARGET_MIN && height >= KRDS_TOUCH_TARGET_MIN;
}

/**
 * Check if viewport meta tag is present and correct
 */
export function hasValidViewportMeta(): boolean {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return false;

  const content = meta.getAttribute('content') || '';
  return content.includes('width=device-width') || content.includes('width=device-width');
}
