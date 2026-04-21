# Phase 5: 전체 통합 - 테스트 및 최적화

**태스크 범위**: Task #10.26 ~ #10.30 (5개)
**예상 시간**: 3시간
**의존성**: 모든 이전 Phase

---

## Task #10.26: E2E 테스트 작성

- **파일**: `e2e/integration.spec.ts`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크

```typescript
import { test, expect, chromium } from '@playwright/test';

test.describe('KLIC Extension Integration', () => {
  let extensionId: string;

  test.beforeAll(async () => {
    // Extension 로드
    const extensionPath = './dist';
    const context = await chromium.launchPersistentContext('', {
      args: [`--disable-extensions-except=${extensionPath}`],
      headless: false,
    });
    // extensionId 가져오기
  });

  test('should open side panel', async ({ page }) => {
    // 테스트 페이지 접속
    await page.goto('https://example.com');

    // Side Panel 오픈
    // 단축키 또는 아이콘 클릭

    // Side Panel 확인
    // await expect(page.locator('.app-layout')).toBeVisible();
  });

  test('should activate text edit tool', async ({ page }) => {
    await page.goto('https://example.com');

    // 텍스트 편집 도구 활성화
    // await page.click('[data-tool="textEdit"]');

    // 편집 가능한 요소 hover
    // await page.hover('p');

    // hover 상태 확인
    // await expect(page.locator('p')).toHaveClass(/klic-text-edit-hover/);
  });

  test('should switch between tools', async ({ page }) => {
    await page.goto('https://example.com');

    // 텍스트 편집 활성화
    // 스크린샷 도구로 전환
    // 텍스트 편집 비활성화 확인
    // 스크린샷 활성화 확인
  });

  test('should handle conflicts between tools', async ({ page }) => {
    // 독점 도구 간 전환 시 충돌 처리 확인
  });

  test('should persist settings', async ({ page }) => {
    // 설정 변경 후 새로고침
    // 설정 유지 확인
  });
});
```

**완료 조건**: 모든 E2E 테스트 통과

---

## Task #10.27: 성능 프로파일링

- **파일**: `src/utils/performance.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
export class PerformanceProfiler {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = end - start;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    return duration;
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return null;

    const sum = measures.reduce((a, b) => a + b, 0);
    const avg = sum / measures.length;
    const min = Math.min(...measures);
    const max = Math.max(...measures);

    return { avg, min, max, count: measures.length };
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  report(): void {
    console.group('Performance Report');

    this.measures.forEach((measures, name) => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, {
          avg: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          count: stats.count,
        });
      }
    });

    console.groupEnd();
  }
}

export const profiler = new PerformanceProfiler();

// 성능 모니터링 Hook
export function usePerformanceMonitor(componentName: string) {
  return {
    startRender: () => profiler.mark(`${componentName}-render-start`),
    endRender: () => profiler.measure(`${componentName}-render`, `${componentName}-render-start`),
  };
}

// 메모리 사용량 모니터링
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
```

**완료 조건**: 성능 병목 지점 식별

---

## Task #10.28: 메모리 누수 체크

- **파일**: `e2e/memory-leak.spec.ts`
- **시간**: 30분
- **의존성**: Task #10.27

```typescript
import { test, expect } from '@playwright/test';

test.describe('Memory Leak Tests', () => {
  test('should not leak memory when activating tools', async ({ page }) => {
    await page.goto('https://example.com');

    // 초기 메모리 측정
    const initialMemory = await getMemoryUsage(page);

    // 도구 활성화/비활성화 반복
    for (let i = 0; i < 10; i++) {
      // await page.click('[data-tool="textEdit"]');
      // await page.waitForTimeout(1000);
      // await page.click('[data-tool="textEdit"]'); // 비활성화
      // await page.waitForTimeout(1000);
    }

    // GC 강제 실행 (가능한 경우)
    await forceGC(page);

    // 최종 메모리 측정
    const finalMemory = await getMemoryUsage(page);

    // 메모리 증가 확인 (10MB 이하)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  test('should cleanup properly when switching tools', async ({ page }) => {
    // 도구 전환 시 cleanup 확인
  });

  test('should not leak event listeners', async ({ page }) => {
    // 이벤트 리스너 누수 확인
  });
});

async function getMemoryUsage(page: any): Promise<number> {
  return await page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });
}

async function forceGC(page: any): Promise<void> {
  // Chrome DevTools Protocol을 통한 GC
  // (구현 필요)
}
```

**완료 조건**: 메모리 누수 없음

---

## Task #10.29: Bundle 최적화

- **파일**: `build/optimization.ts`
- **시간**: 30분
- **의존성**: 없음

```typescript
// vite.config.ts에 추가할 최적화 설정

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  build: {
    // Code Splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React 라이브러리 분리
          'react-vendor': ['react', 'react-dom'],

          // 유틸리티 분리
          'utils': [
            './src/utils/dom',
            './src/utils/storage',
            './src/utils/messaging',
          ],

          // 공통 컴포넌트 분리
          'components': [
            './src/sidepanel/components/Layout',
            './src/sidepanel/components/Header',
            './src/sidepanel/components/Footer',
          ],

          // 각 도구별 분리
          'tool-textEdit': [
            './src/sidepanel/components/TextEdit',
            './src/content/textEdit',
          ],
          'tool-screenshot': [
            './src/sidepanel/components/Screenshot',
            './src/content/screenshot',
          ],
          // ... 나머지 도구들
        },
      },
    },

    // 최소화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Chunk 크기 경고
    chunkSizeWarningLimit: 500,
  },

  // 의존성 최적화
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['chrome-extension-polyfill'],
  },

  // 별칭
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**완료 조건**: Bundle 크기 최적화

---

## Task #10.30: 최종 검증 및 문서화

- **파일**: `docs/INTEGRATION-GUIDE.md`
- **시간**: 1시간
- **의존성**: 모든 이전 태스크

```markdown
# KLIC Extension 통합 가이드

## 개요
모든 도구가 통합된 상태에서의 사용법과 동작 방식 설명

## 도구 활성화
- 독점 도구: 텍스트 편집, 스크린샷, 컬러 피커 등
- 동시 실행 도구: 링크 체커, 대비 체크 등

## 충돌 처리
- 독점 도구간 자동 비활성화
- 사용자 우선순위 설정

## 데이터 공유
- Storage 공유
- 메시지 전달
- 상태 동기화

## 성능
- 초기 로딩 시간
- 메모리 사용량
- 실행 속도

## 문제 해결
- 일반적인 문제
- 디버깅 방법
- 재설정 방법
```

**완료 조건**: 모든 기능 정상 동작 확인

---

**전체 완료 후**: 모든 태스크 완료 후 릴리스 준비
