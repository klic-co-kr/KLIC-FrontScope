/**
 * Viewport Preset Selector Utilities
 *
 * 뷰포트 프리셋 선택 및 관리 관련 유틸리티 함수들
 */

import type { ViewportPreset, DeviceCategory } from '../../../types/gridLayout';
import { VIEWPORT_PRESETS } from '../../../constants/viewportPresets';

/**
 * 카테고리별 프리셋 그룹화
 */
export function groupPresetsByCategory(
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): Record<DeviceCategory, ViewportPreset[]> {
  return {
    mobile: presets.filter(p => p.category === 'mobile'),
    tablet: presets.filter(p => p.category === 'tablet'),
    desktop: presets.filter(p => p.category === 'desktop'),
    custom: presets.filter(p => p.category === 'custom'),
  };
}

/**
 * 카테고리별 프리셋 가져오기
 */
export function getPresetsByCategory(
  category: DeviceCategory,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset[] {
  return presets.filter(p => p.category === category);
}

/**
 * ID로 프리셋 찾기
 */
export function findPresetById(
  id: string,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset | undefined {
  return presets.find(p => p.id === id);
}

/**
 * 이름으로 프리셋 찾기
 */
export function findPresetByName(
  name: string,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset | undefined {
  return presets.find(p => p.name === name);
}

/**
 * 프리셋 검색
 */
export function searchPresets(
  query: string,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset[] {
  const lowerQuery = query.toLowerCase();
  return presets.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 해상도로 프리셋 찾기
 */
export function findPresetByResolution(
  width: number,
  height: number,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset | undefined {
  return presets.find(p => p.width === width && p.height === height);
}

/**
 * 유사한 해상도의 프리셋 찾기
 */
export function findSimilarPreset(
  width: number,
  height: number,
  tolerance: number = 50,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset | undefined {
  return presets.find(p =>
    Math.abs(p.width - width) <= tolerance &&
    Math.abs(p.height - height) <= tolerance
  );
}

/**
 * 가장 가까운 프리셋 찾기
 */
export function findClosestPreset(
  width: number,
  height: number,
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS,
  category?: DeviceCategory
): ViewportPreset | null {
  const filtered = category ? getPresetsByCategory(category, presets) : presets;

  if (filtered.length === 0) return null;

  let closest: ViewportPreset | null = null;
  let minDiff = Infinity;

  for (const preset of filtered) {
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

/**
 * 프리셋 정렬
 */
export type SortBy = 'name' | 'resolution' | 'category' | 'width' | 'height';

export function sortPresets(
  sortBy: SortBy = 'name',
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS
): ViewportPreset[] {
  const sorted = [...presets];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'resolution':
      return sorted.sort((a, b) => a.width * a.height - b.width * b.height);
    case 'category':
      return sorted.sort((a, b) => {
        const categoryOrder: Record<DeviceCategory, number> = {
          mobile: 0,
          tablet: 1,
          desktop: 2,
          custom: 3,
        };
        return categoryOrder[a.category] - categoryOrder[b.category];
      });
    case 'width':
      return sorted.sort((a, b) => a.width - b.width);
    case 'height':
      return sorted.sort((a, b) => a.height - b.height);
    default:
      return sorted;
  }
}

/**
 * 인기 있는 프리셋 목록
 */
export function getPopularPresets(
  presets: readonly ViewportPreset[] = VIEWPORT_PRESETS,
  limit: number = 5
): ViewportPreset[] {
  // 일반적으로 많이 사용되는 프리셋
  const popularIds = [
    'iphone-12-pro',
    'iphone-14-pro-max',
    'ipad-pro-11',
    'laptop-13',
    'desktop-hd',
  ];

  return popularIds
    .map(id => findPresetById(id, presets))
    .filter((p): p is ViewportPreset => p !== undefined)
    .slice(0, limit);
}

/**
 * 최근 사용된 프리셛 목록 (localStorage에서 가져오기)
 */
export function getRecentPresets(
  limit: number = 5
): ViewportPreset[] {
  try {
    const recentIds = JSON.parse(
      localStorage.getItem('gridLayout:recentPresets') || '[]'
    ) as string[];

    return recentIds
      .map(id => findPresetById(id))
      .filter((p): p is ViewportPreset => p !== undefined)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * 프리셋을 최근 사용 목록에 추가
 */
export function addRecentPreset(presetId: string): void {
  try {
    const recentIds = JSON.parse(
      localStorage.getItem('gridLayout:recentPresets') || '[]'
    ) as string[];

    // 중복 제거
    const filtered = recentIds.filter(id => id !== presetId);

    // 맨 앞에 추가
    const updated = [presetId, ...filtered].slice(0, 10);

    localStorage.setItem('gridLayout:recentPresets', JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * 사용자 정의 프리셋 생성
 */
export function createCustomPreset(
  name: string,
  width: number,
  height: number,
  options: {
    devicePixelRatio?: number;
    icon?: string;
  } = {}
): ViewportPreset {
  const id = `custom-${Date.now()}`;

  return {
    id,
    name,
    category: 'custom',
    width: Math.max(320, Math.min(width, 7680)),
    height: Math.max(480, Math.min(height, 7680)),
    devicePixelRatio: options.devicePixelRatio || 1,
    icon: options.icon || '📐',
  };
}

/**
 * 사용자 정의 프리셋 저장
 */
export function saveCustomPreset(preset: ViewportPreset): void {
  try {
    const customPresets = JSON.parse(
      localStorage.getItem('gridLayout:customPresets') || '[]'
    ) as ViewportPreset[];

    // 중복 확인
    const existingIndex = customPresets.findIndex(p => p.id === preset.id);
    if (existingIndex >= 0) {
      customPresets[existingIndex] = preset;
    } else {
      customPresets.push(preset);
    }

    localStorage.setItem('gridLayout:customPresets', JSON.stringify(customPresets));
  } catch {
    // Ignore storage errors
  }
}

/**
 * 저장된 사용자 정의 프리셋 불러오기
 */
export function loadCustomPresets(): ViewportPreset[] {
  try {
    return JSON.parse(
      localStorage.getItem('gridLayout:customPresets') || '[]'
    ) as ViewportPreset[];
  } catch {
    return [];
  }
}

/**
 * 사용자 정의 프리셋 삭제
 */
export function deleteCustomPreset(presetId: string): void {
  try {
    const customPresets = loadCustomPresets();
    const filtered = customPresets.filter(p => p.id !== presetId);
    localStorage.setItem('gridLayout:customPresets', JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

/**
 * 모든 프리셋 가져오기 (기본 + 사용자 정의)
 */
export function getAllPresets(): ViewportPreset[] {
  return [...VIEWPORT_PRESETS, ...loadCustomPresets()];
}

/**
 * 프리셋 자동 완성 제안
 */
export function getPresetSuggestions(
  query: string,
  limit: number = 5
): ViewportPreset[] {
  const allPresets = getAllPresets();
  const matches = searchPresets(query, allPresets);
  return sortPresets('name', matches).slice(0, limit);
}
