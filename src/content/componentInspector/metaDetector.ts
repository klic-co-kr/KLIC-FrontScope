/**
 * Meta Framework Detector
 *
 * Next.js, Nuxt, SvelteKit 등 메타 프레임워크 감지
 */

import type { FrameworkType } from '@/types/component';

/**
 * 감지된 메타 프레임워크 정보
 */
export interface MetaFrameworkInfo {
  name: 'next' | 'nuxt' | 'sveltekit' | null;
  version?: string;
  router?: 'pages' | 'app';
}

/**
 * Next.js 감지
 */
export function detectNextJS(): MetaFrameworkInfo {
  // __NEXT_DATA__ 확인
  const nextData = (window as unknown as Record<string, unknown>).__NEXT_DATA__;
  if (nextData) {
    const data = nextData as {
      buildId?: string;
      runtimeConfig?: Record<string, unknown>;
      props?: { pageProps?: Record<string, unknown> };
    };

    // App Router vs Pages Router 구분
    const isAppRouter =
      document.querySelector('[data-nextjs-router]') !== null ||
      document.body.getAttribute('data-nextjs-router') === 'app';

    return {
      name: 'next',
      version: data.buildId ? undefined : undefined,
      router: isAppRouter ? 'app' : 'pages',
    };
  }

  // next/dist 컴파일된 스크립트 확인
  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src') || '';
    if (src.includes('_next/static') || src.includes('next/dist')) {
      return { name: 'next' };
    }
  }

  return { name: null };
}

/**
 * Nuxt 감지
 */
export function detectNuxt(): MetaFrameworkInfo {
  // __NUXT__ 확인
  const nuxt = (window as unknown as Record<string, unknown>).__NUXT__;
  if (nuxt) {
    const data = nuxt as {
      config?: { public?: { nuxt?: { version?: string } } };
      data?: unknown[];
    };

    const version = data.config?.public?.nuxt?.version;

    return {
      name: 'nuxt',
      version,
    };
  }

  // Nuxt 2: __NUXT__ 대신 다른 방식
  const nuxtElement = document.getElementById('__nuxt');
  if (nuxtElement) {
    return { name: 'nuxt' };
  }

  // _nuxt 경로 확인
  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src') || '';
    if (src.includes('/_nuxt/') || src.includes('_nuxt/')) {
      return { name: 'nuxt' };
    }
  }

  return { name: null };
}

/**
 * SvelteKit 감지
 */
export function detectSvelteKit(): MetaFrameworkInfo {
  // SvelteKit은 data-sveltekit 속성 사용
  const sveltekitAttr = document.querySelector('[data-sveltekit]');
  if (sveltekitAttr) {
    return { name: 'sveltekit' };
  }

  // __sveltekit 확인
  const sveltekit = (window as unknown as Record<string, unknown>).__sveltekit;
  if (sveltekit) {
    return { name: 'sveltekit' };
  }

  // _app/immutable 경로 확인 (SvelteKit 빌드 산출물)
  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src') || '';
    if (src.includes('/_app/immutable') || src.includes('_app/immutable')) {
      return { name: 'sveltekit' };
    }
  }

  return { name: null };
}

/**
 * 기본 프레임워크 감지 (메타 프레임워크 없이)
 */
export function detectBaseFramework(): FrameworkType {
  // React Fiber 확인
  const rootElements = document.querySelectorAll('[data-reactroot], #react-root, #root');
  for (const el of rootElements) {
    const fiberKey = Object.keys(el).find(
      (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    if (fiberKey) return 'react';
  }

  // Vue 확인
  const vueElements = document.querySelectorAll('[data-v-app], #app, #vue-app');
  for (const el of vueElements) {
    const vue = (el as unknown as Record<string, unknown>).__vue__;
    const vueApp = Object.keys(el).find((k) => k.startsWith('__vueApp__'));
    if (vue || vueApp) return 'vue';
  }

  // Angular 확인
  const ngVersion = document.documentElement.getAttribute('ng-version');
  if (ngVersion) return 'angular';

  // Svelte 확인
  const svelteElements = document.querySelectorAll('[class*="svelte-"]');
  if (svelteElements.length > 0) return 'svelte';

  return 'unknown';
}

/**
 * 전체 프레임워크 감지
 */
export function detectFramework(): {
  framework: FrameworkType;
  meta: MetaFrameworkInfo;
} {
  // 1. 메타 프레임워크 먼저 확인
  const nextInfo = detectNextJS();
  if (nextInfo.name) {
    return {
      framework: 'next',
      meta: nextInfo,
    };
  }

  const nuxtInfo = detectNuxt();
  if (nuxtInfo.name) {
    return {
      framework: 'nuxt',
      meta: nuxtInfo,
    };
  }

  const sveltekitInfo = detectSvelteKit();
  if (sveltekitInfo.name) {
    return {
      framework: 'sveltekit',
      meta: sveltekitInfo,
    };
  }

  // 2. 기본 프레임워크 확인
  const baseFramework = detectBaseFramework();

  return {
    framework: baseFramework,
    meta: { name: null },
  };
}
