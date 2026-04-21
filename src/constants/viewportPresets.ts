/**
 * Viewport Presets
 *
 * 미리 정의된 뷰포트 크기 및 디바이스 정보
 */

import { ViewportPreset, DeviceCategory } from '../types/gridLayout';

/**
 * 뷰포트 프리셋 목록
 */
export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  // Mobile
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'mobile' as DeviceCategory,
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'iphone-12-pro',
    name: 'iPhone 12 Pro',
    category: 'mobile' as DeviceCategory,
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    icon: '📱',
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'mobile' as DeviceCategory,
    width: 430,
    height: 932,
    devicePixelRatio: 3,
    icon: '📱',
  },
  {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    category: 'mobile' as DeviceCategory,
    width: 412,
    height: 915,
    devicePixelRatio: 2.625,
    icon: '📱',
  },
  {
    id: 'galaxy-s23',
    name: 'Samsung Galaxy S23',
    category: 'mobile' as DeviceCategory,
    width: 360,
    height: 780,
    devicePixelRatio: 3,
    icon: '📱',
  },

  // Tablet
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet' as DeviceCategory,
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    category: 'tablet' as DeviceCategory,
    width: 820,
    height: 1180,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'tablet' as DeviceCategory,
    width: 834,
    height: 1194,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'ipad-pro-12-9',
    name: 'iPad Pro 12.9"',
    category: 'tablet' as DeviceCategory,
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
    icon: '📱',
  },
  {
    id: 'surface-pro',
    name: 'Surface Pro 7',
    category: 'tablet' as DeviceCategory,
    width: 912,
    height: 1368,
    devicePixelRatio: 2,
    icon: '💻',
  },

  // Desktop
  {
    id: 'laptop-13',
    name: 'Laptop 13"',
    category: 'desktop' as DeviceCategory,
    width: 1280,
    height: 720,
    icon: '💻',
  },
  {
    id: 'laptop-15',
    name: 'Laptop 15"',
    category: 'desktop' as DeviceCategory,
    width: 1440,
    height: 900,
    icon: '💻',
  },
  {
    id: 'desktop-hd',
    name: 'Desktop HD',
    category: 'desktop' as DeviceCategory,
    width: 1920,
    height: 1080,
    icon: '🖥️',
  },
  {
    id: 'desktop-fhd',
    name: 'Desktop FHD',
    category: 'desktop' as DeviceCategory,
    width: 2560,
    height: 1440,
    icon: '🖥️',
  },
  {
    id: 'desktop-4k',
    name: 'Desktop 4K',
    category: 'desktop' as DeviceCategory,
    width: 3840,
    height: 2160,
    icon: '🖥️',
  },
] as const;

/**
 * 기본 프리셋 ID
 */
export const DEFAULT_VIEWPORT_PRESET = 'laptop-13';

/**
 * 카테고리별 프리셋
 */
export const VIEWPORT_PRESETS_BY_CATEGORY: Record<DeviceCategory, ViewportPreset[]> = {
  mobile: VIEWPORT_PRESETS.filter(p => p.category === 'mobile'),
  tablet: VIEWPORT_PRESETS.filter(p => p.category === 'tablet'),
  desktop: VIEWPORT_PRESETS.filter(p => p.category === 'desktop'),
  custom: [],
};

/**
 * Tailwind CSS 기본 브레이크포인트
 */
export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type TailwindBreakpoint = keyof typeof TAILWIND_BREAKPOINTS;

/**
 * 브레이크포인트 라벨
 */
export const BREAKPOINT_LABELS: Record<TailwindBreakpoint, string> = {
  sm: '모바일',
  md: '태블릿',
  lg: '랩탑',
  xl: '데스크톱',
  '2xl': '와이드',
};

/**
 * 디바이스 카테고리 라벨
 */
export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  mobile: '모바일',
  tablet: '태블릿',
  desktop: '데스크톱',
  custom: '사용자 정의',
};

/**
 * Tailwind 브레이크포인트별 기본 컬럼 수
 */
export const TAILWIND_DEFAULT_COLUMNS: Record<TailwindBreakpoint, number> = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 12,
  '2xl': 12,
} as const;

/**
 * 프리셋 ID로 프리셋 조회
 */
export function getPresetById(id: string): ViewportPreset | undefined {
  return VIEWPORT_PRESETS.find(p => p.id === id);
}

/**
 * 카테고리별 프리셋 목록 가져오기
 */
export function getPresetsByCategory(category: DeviceCategory): ViewportPreset[] {
  return VIEWPORT_PRESETS_BY_CATEGORY[category] || [];
}

/**
 * 이름으로 프리셋 검색
 */
export function searchPresets(query: string): ViewportPreset[] {
  const lowerQuery = query.toLowerCase();
  return VIEWPORT_PRESETS.filter(preset =>
    preset.name.toLowerCase().includes(lowerQuery) ||
    preset.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 너비 기준으로 가까운 프리셋 찾기
 */
export function findClosestPreset(
  width: number,
  height: number,
  category?: DeviceCategory
): ViewportPreset | null {
  const presets = category
    ? getPresetsByCategory(category)
    : VIEWPORT_PRESETS;

  let closest: ViewportPreset | null = null;
  let minDiff = Infinity;

  for (const preset of presets) {
    const widthDiff = Math.abs(preset.width - width);
    const heightDiff = Math.abs(preset.height - height);
    const diff = widthDiff + heightDiff;

    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }

  return closest;
}
