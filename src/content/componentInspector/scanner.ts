/**
 * Component Scanner
 *
 * 페이지 내 컴포넌트 스캔 및 수집
 */

import type { ComponentInfo, ComponentScanResult } from '@/types/component';
import { detectComponent } from './detector';
import { detectFramework } from './metaDetector';

/**
 * 스캔 옵션
 */
export interface ScanOptions {
  /** 최대 스캔 깊이 */
  maxDepth?: number;
  /** 프레임워크 컴포넌트만 수집 */
  frameworkOnly?: boolean;
  /** 최대 수집 개수 */
  maxComponents?: number;
}

/**
 * 기본 스캔 옵션
 */
const DEFAULT_OPTIONS: Required<ScanOptions> = {
  maxDepth: 20,
  frameworkOnly: true,
  maxComponents: 500,
};

/**
 * 컴포넌트 스캔
 */
export function scanComponents(
  root: HTMLElement = document.body,
  options: ScanOptions = {}
): ComponentScanResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const components: ComponentInfo[] = [];
  let totalElements = 0;

  // 프레임워크 감지
  const { framework, meta } = detectFramework();

  // 순회하며 컴포넌트 수집
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const element = node as HTMLElement;

        // 깊이 제한
        if (opts.maxDepth < Infinity) {
          const depth = getDepth(element);
          if (depth > opts.maxDepth) {
            return NodeFilter.FILTER_REJECT;
          }
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  while (walker.nextNode()) {
    // 최대 개수 제한 (루프 내에서 체크)
    if (components.length >= opts.maxComponents) {
      break;
    }

    const element = walker.currentNode as HTMLElement;
    totalElements++;

    let componentInfo: ComponentInfo;
    try {
      componentInfo = detectComponent(element);
    } catch {
      continue;
    }

    // frameworkOnly 옵션이면 HTML 제외
    if (opts.frameworkOnly && componentInfo.type === 'html') {
      continue;
    }

    // 중복 제거 (같은 선택자와 이름)
    const isDuplicate = components.some(
      (c) => c.selector === componentInfo.selector && c.name === componentInfo.name
    );

    if (!isDuplicate) {
      components.push(componentInfo);
    }
  }

  // 컴포넌트 타입별 정렬 (React > Vue > Angular > Svelte > Web Components > HTML)
  const typeOrder = ['react', 'vue', 'angular', 'svelte', 'web-component', 'html'];
  components.sort((a, b) => {
    const orderA = typeOrder.indexOf(a.type);
    const orderB = typeOrder.indexOf(b.type);
    if (orderA !== orderB) return orderA - orderB;
    return a.depth - b.depth;
  });

  return {
    framework,
    metaFramework: meta.name || undefined,
    components,
    totalElements,
    scannedAt: Date.now(),
  };
}

/**
 * 특정 요소 스캔
 */
export function scanElement(element: HTMLElement): ComponentInfo {
  return detectComponent(element);
}

/**
 * 선택자로 요소 스캔
 */
export function scanBySelector(selector: string): ComponentInfo | null {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return null;
  return scanElement(element);
}

/**
 * 타입별 컴포넌트 필터링
 */
export function filterByType(
  components: ComponentInfo[],
  type: ComponentInfo['type']
): ComponentInfo[] {
  return components.filter((c) => c.type === type);
}

/**
 * 이름으로 컴포넌트 검색
 */
export function searchByName(
  components: ComponentInfo[],
  name: string
): ComponentInfo[] {
  const lowerName = name.toLowerCase();
  return components.filter((c) => c.name.toLowerCase().includes(lowerName));
}

/**
 * 컴포넌트 통계
 */
export function getComponentStats(components: ComponentInfo[]): {
  byType: Record<string, number>;
  byDepth: Record<number, number>;
  total: number;
} {
  const byType: Record<string, number> = {};
  const byDepth: Record<number, number> = {};

  for (const component of components) {
    byType[component.type] = (byType[component.type] || 0) + 1;
    byDepth[component.depth] = (byDepth[component.depth] || 0) + 1;
  }

  return {
    byType,
    byDepth,
    total: components.length,
  };
}

/**
 * DOM 깊이 계산
 */
function getDepth(element: HTMLElement): number {
  let depth = 0;
  let parent = element.parentElement;
  while (parent) {
    depth++;
    parent = parent.parentElement;
  }
  return depth;
}
