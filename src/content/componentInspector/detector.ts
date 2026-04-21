/**
 * Framework Detector
 *
 * React, Vue, Angular, Svelte, Web Components 감지
 */

import type { ComponentInfo, ComponentType } from '@/types/component';
import { safeSerialize } from './safeSerialize';

/**
 * React 컴포넌트 감지
 */
export function detectReact(element: HTMLElement): ComponentInfo | null {
  // React 18+ 및 17 호환
  const fiberKey = Object.keys(element).find(
    (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  );
  if (!fiberKey) return null;

  const fiber = (element as unknown as Record<string, unknown>)[fiberKey];
  if (!fiber || typeof fiber !== 'object') return null;

  const fiberObj = fiber as {
    type?: { name?: string; displayName?: string } | string;
    memoizedProps?: Record<string, unknown>;
    memoizedState?: Record<string, unknown>;
    return?: unknown;
  };

  const name =
    (typeof fiberObj.type === 'object'
      ? fiberObj.type?.name || fiberObj.type?.displayName
      : typeof fiberObj.type === 'string'
        ? fiberObj.type
        : 'Anonymous') || 'Anonymous';

  return {
    id: `react-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'react' as ComponentType,
    name,
    selector: generateSelector(element),
    props: safeSerialize(fiberObj.memoizedProps) as Record<string, unknown> | undefined,
    state: safeSerialize(fiberObj.memoizedState) as Record<string, unknown> | undefined,
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}

/**
 * Vue 컴포넌트 감지 (Vue 2/3)
 */
export function detectVue(element: HTMLElement): ComponentInfo | null {
  // Vue 3
  const vueAppKey = Object.keys(element).find((k) => k.startsWith('__vueApp__'));
  if (vueAppKey) {
    // Vue 3은 앱 인스턴스만 있고 컴포넌트 정보는 별도로 추출 필요
    // 간단히 Vue 3으로 감지된 것만 표시
    return {
      id: `vue-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'vue' as ComponentType,
      name: element.tagName.toLowerCase(),
      selector: generateSelector(element),
      tagName: element.tagName.toLowerCase(),
      className: element.className || undefined,
      elementId: element.id || undefined,
      children: element.children.length,
      depth: getDepth(element),
    };
  }

  // Vue 2
  const vue = (element as unknown as Record<string, unknown>).__vue__;
  if (!vue || typeof vue !== 'object') return null;

  const vueObj = vue as {
    $options?: { name?: string; _componentTag?: string };
    $props?: Record<string, unknown>;
    $data?: Record<string, unknown>;
  };

  const name = vueObj.$options?.name || vueObj.$options?._componentTag || 'Anonymous';

  return {
    id: `vue-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'vue' as ComponentType,
    name,
    selector: generateSelector(element),
    props: safeSerialize(vueObj.$props) as Record<string, unknown> | undefined,
    state: safeSerialize(vueObj.$data) as Record<string, unknown> | undefined,
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}

/**
 * Angular 컴포넌트 감지
 */
export function detectAngular(element: HTMLElement): ComponentInfo | null {
  // Angular 버전 속성 확인
  const ngVersion = document.documentElement.getAttribute('ng-version');
  if (!ngVersion) return null;

  // Angular 컴포넌트는 ng-reflect-* 속성을 가짐
  const ngAttributes = Array.from(element.attributes).filter((attr) =>
    attr.name.startsWith('ng-reflect-')
  );

  if (ngAttributes.length === 0) return null;

  // 컴포넌트 이름 추출
  const tagName = element.tagName.toLowerCase();
  const name =
    tagName.includes('-') ? tagName : element.getAttribute('ng-reflect-name') || 'AngularComponent';

  return {
    id: `angular-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'angular' as ComponentType,
    name,
    selector: generateSelector(element),
    props: safeSerialize(
      ngAttributes.reduce(
        (acc, attr) => {
          acc[attr.name.replace('ng-reflect-', '')] = attr.value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    ) as Record<string, unknown> | undefined,
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}

/**
 * Svelte 컴포넌트 감지
 */
export function detectSvelte(element: HTMLElement): ComponentInfo | null {
  // Svelte는 svelte-xxx 클래스를 가짐
  const svelteClass = Array.from(element.classList).find((cls) => cls.startsWith('svelte-'));

  if (!svelteClass) return null;

  // Svelte 5: __svelte_meta
  const meta = (element as unknown as Record<string, unknown>).__svelte_meta;
  const name = (meta as { component?: { name?: string } })?.component?.name || 'SvelteComponent';

  return {
    id: `svelte-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'svelte' as ComponentType,
    name,
    selector: generateSelector(element),
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}

/**
 * Web Components 감지
 */
export function detectWebComponent(element: HTMLElement): ComponentInfo | null {
  const hasShadow = !!(element as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
  const hasDash = element.tagName.includes('-');

  // 커스텀 엘리먼트가 아니면 skip
  if (!hasDash && !hasShadow) return null;

  const tagName = element.tagName.toLowerCase();
  const isRegistered = typeof customElements !== 'undefined' && customElements !== null && customElements.get(tagName) !== undefined;

  // 미등록 + shadow DOM 없는 요소는 skip (단순 `-` 포함 태그)
  if (!isRegistered && !hasShadow) return null;

  return {
    id: `web-component-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'web-component' as ComponentType,
    name: tagName,
    selector: generateSelector(element),
    hasShadow,
    tagName,
    className: typeof element.className === 'string' ? element.className || undefined : undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
    source: isRegistered ? 'registered' : 'unregistered',
  };
}

/**
 * HTML 기본 요소 감지
 */
export function detectHtml(element: HTMLElement): ComponentInfo {
  return {
    id: `html-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'html' as ComponentType,
    name: element.tagName.toLowerCase(),
    selector: generateSelector(element),
    tagName: element.tagName.toLowerCase(),
    className: element.className || undefined,
    elementId: element.id || undefined,
    children: element.children.length,
    depth: getDepth(element),
  };
}

/**
 * 요소의 프레임워크 컴포넌트 감지
 * 우선순위: React > Vue > Angular > Svelte > Web Components > HTML
 */
export function detectComponent(element: HTMLElement): ComponentInfo {
  return (
    detectReact(element) ||
    detectVue(element) ||
    detectAngular(element) ||
    detectSvelte(element) ||
    detectWebComponent(element) ||
    detectHtml(element)
  );
}

/**
 * CSS 선택자 생성
 */
function generateSelector(element: HTMLElement): string {
  try {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const className = typeof element.className === 'string' ? element.className : '';
    if (className) {
      const classes = className.split(' ').filter(Boolean).join('.');
      if (classes) return `${element.tagName.toLowerCase()}.${classes}`;
    }
    return element.tagName.toLowerCase();
  } catch {
    return element.tagName?.toLowerCase() || 'unknown';
  }
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
