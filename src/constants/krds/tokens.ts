// src/constants/krds/tokens.ts
// KRDS Design Token Constants

/**
 * KRDS spacing scale (4px grid system)
 */
export const KRDS_SPACING: Readonly<Record<string, string>> = {
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '11': '44px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '28': '112px',
  '32': '128px',
  '36': '144px',
  '40': '160px',
  '44': '176px',
  '48': '192px',
  '52': '208px',
  '56': '224px',
  '60': '240px',
  '64': '256px',
  '72': '288px',
  '80': '320px',
  '96': '384px',
} as const;

/**
 * Numeric spacing values (for calculations)
 */
export const KRDS_SPACING_VALUES = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 128] as const;

/**
 * KRDS sizing tokens
 */
export const KRDS_SIZING: Readonly<Record<string, string>> = {
  // Fixed sizes
  '0': '0',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '28': '112px',
  '32': '128px',
  '36': '144px',
  '40': '160px',
  '44': '176px',
  '48': '192px',
  '52': '208px',
  '56': '224px',
  '60': '240px',
  '64': '256px',
  '72': '288px',
  '80': '320px',
  '96': '384px',
  // Fractional sizes
  '1-2': '50%',
  '1-3': '33.333333%',
  '2-3': '66.666667%',
  '1-4': '25%',
  '2-4': '50%',
  '3-4': '75%',
  '1-5': '20%',
  '2-5': '40%',
  '3-5': '60%',
  '4-5': '80%',
  '1-6': '16.666667%',
  '5-6': '83.333333%',
  // Special sizes
  'full': '100%',
  'screen': '100vh',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
} as const;

/**
 * KRDS border radius tokens
 */
export const KRDS_BORDER_RADIUS: Readonly<Record<string, string>> = {
  none: '0',
  xs: '2px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

/**
 * KRDS border width tokens
 */
export const KRDS_BORDER_WIDTH = {
  '0': '0',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
} as const;

/**
 * KRDS shadow tokens
 */
export const KRDS_SHADOWS: Readonly<Record<string, string>> = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  'focus-primary': '0 0 0 3px rgba(15, 76, 140, 0.1)',
  'focus-error': '0 0 0 3px rgba(220, 53, 69, 0.1)',
  'focus-success': '0 0 0 3px rgba(40, 167, 69, 0.1)',
  'focus-warning': '0 0 0 3px rgba(255, 193, 7, 0.1)',
} as const;

/**
 * KRDS motion duration tokens
 */
export const KRDS_MOTION_DURATION = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
} as const;

/**
 * KRDS motion easing tokens
 */
export const KRDS_MOTION_EASING = {
  linear: 'cubic-bezier(0, 0, 1, 1)',
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
  'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * KRDS transition tokens
 */
export const KRDS_TRANSITIONS = {
  colors: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  opacity: 'opacity 150ms ease',
  shadow: 'box-shadow 150ms ease',
  transform: 'transform 150ms ease',
  all: 'all 150ms ease',
} as const;

/**
 * Check if spacing value aligns to 4px grid
 */
export function isSpacingOnGrid(value: number): boolean {
  return value % 4 === 0;
}

/**
 * Find closest KRDS spacing value
 */
export function findClosestSpacing(value: number): number {
  return KRDS_SPACING_VALUES.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

/**
 * Parse pixel value to number
 */
export function parsePixelValue(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? parseFloat(match[1]) : null;
}
