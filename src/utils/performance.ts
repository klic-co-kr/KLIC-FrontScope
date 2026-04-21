/**
 * Performance Profiler
 *
 * 앱 성능 모니터링 및 프로파일링 유틸리티
 */

export interface PerformanceMeasure {
  name: string;
  duration: number;
  timestamp: number;
}

export interface PerformanceStats {
  avg: number;
  min: number;
  max: number;
  count: number;
  total: number;
}

/**
 * Performance Profiler 클래스
 */
export class PerformanceProfiler {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();
  private customMeasures = new Map<string, PerformanceMeasure[]>();

  /**
   * 마크 생성
   */
  mark(name: string): void {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);

    // Native Performance API도 사용
    performance.mark(name);
  }

  /**
   * 측정 (두 마크 사이의 시간)
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (start === undefined) {
      console.warn(`[PerformanceProfiler] Start mark "${startMark}" not found`);
      return 0;
    }

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (end === undefined) {
      console.warn(`[PerformanceProfiler] End mark "${endMark}" not found`);
      return 0;
    }

    const duration = end - start;

    // 기록
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    // 커스텀 측정값도 저장
    if (!this.customMeasures.has(name)) {
      this.customMeasures.set(name, []);
    }
    this.customMeasures.get(name)!.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    console.log(`[PerformanceProfiler] ${name}: ${duration.toFixed(2)}ms`);

    // Native Performance API도 사용
    try {
      performance.measure(name, startMark, endMark);
    } catch {
      // Native API 실패 시 무시
    }

    return duration;
  }

  /**
   * 즉시 측정 (현재 시간까지)
   */
  measureFrom(name: string, startMark: string): number {
    return this.measure(name, startMark);
  }

  /**
   * 통계 가져오기
   */
  getStats(name: string): PerformanceStats | null {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return null;

    const sum = measures.reduce((a, b) => a + b, 0);
    const avg = sum / measures.length;
    const min = Math.min(...measures);
    const max = Math.max(...measures);

    return {
      avg,
      min,
      max,
      count: measures.length,
      total: sum,
    };
  }

  /**
   * 모든 통계 보고
   */
  report(): void {
    console.group('[PerformanceProfiler] Report');

    if (this.measures.size === 0) {
      console.log('No measurements recorded.');
    } else {
      this.measures.forEach((_, name) => {
        const stats = this.getStats(name);
        if (stats) {
          console.log(`${name}:`, {
            avg: `${stats.avg.toFixed(2)}ms`,
            min: `${stats.min.toFixed(2)}ms`,
            max: `${stats.max.toFixed(2)}ms`,
            count: stats.count,
            total: `${stats.total.toFixed(2)}ms`,
          });
        }
      });
    }

    console.groupEnd();
  }

  /**
   * 마크 제거
   */
  removeMark(name: string): void {
    this.marks.delete(name);
    try {
      performance.clearMarks(name);
    } catch {
      // Ignore
    }
  }

  /**
   * 측정 제거
   */
  removeMeasure(name: string): void {
    this.measures.delete(name);
    this.customMeasures.delete(name);
    try {
      performance.clearMeasures(name);
    } catch {
      // Ignore
    }
  }

  /**
   * 전체 초기화
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
    this.customMeasures.clear();

    try {
      performance.clearMarks();
      performance.clearMeasures();
    } catch {
      // Ignore
    }
  }

  /**
   * 모든 측정값 가져오기
   */
  getAllMeasures(): PerformanceMeasure[] {
    const all: PerformanceMeasure[] = [];
    this.customMeasures.forEach(measures => {
      all.push(...measures);
    });
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 특정 기간 내의 측정값 필터링
   */
  getMeasuresInRange(startTime: number, endTime: number): PerformanceMeasure[] {
    return this.getAllMeasures().filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * 측정값 내보내기 (JSON)
   */
  exportJSON(): string {
    return JSON.stringify({
      measures: this.getAllMeasures(),
      stats: Object.fromEntries(
        Array.from(this.measures.keys()).map(name => [name, this.getStats(name)])
      ),
      timestamp: Date.now(),
    }, null, 2);
  }
}

export const profiler = new PerformanceProfiler();

/**
 * React 성능 모니터링 Hook
 */
export function usePerformanceMonitor(componentName: string) {
  const startRender = () => {
    profiler.mark(`${componentName}-render-start`);
  };

  const endRender = () => {
    profiler.measure(`${componentName}-render`, `${componentName}-render-start`);
  };

  const startEffect = (effectName: string) => {
    profiler.mark(`${componentName}-${effectName}-start`);
  };

  const endEffect = (effectName: string) => {
    profiler.measure(`${componentName}-${effectName}`, `${componentName}-${effectName}-start`);
  };

  return {
    startRender,
    endRender,
    startEffect,
    endEffect,
  };
}

/**
 * 메모리 사용량 가져오기
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
} | null {
  if ('memory' in performance) {
    const perf = performance as Performance & { memory?: PerformanceMemory };
    const memory = perf.memory as PerformanceMemory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

/**
 * 바이트 단위 포맷팅
 */
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

/**
 * 메모리 사용량 보고
 */
export function reportMemoryUsage(): void {
  const memory = getMemoryUsage();

  if (!memory) {
    console.log('[Memory] Performance.memory API not available');
    return;
  }

  console.group('[Memory] Usage Report');
  console.log(`Used: ${formatBytes(memory.usedJSHeapSize)}`);
  console.log(`Total: ${formatBytes(memory.totalJSHeapSize)}`);
  console.log(`Limit: ${formatBytes(memory.jsHeapSizeLimit)}`);
  console.log(`Usage: ${memory.usedPercentage.toFixed(2)}%`);
  console.groupEnd();
}

/**
 * 메모리 누수 감지 (간단 버전)
 */
export class MemoryLeakDetector {
  private snapshots: Map<string, number[]> = new Map();
  private maxSnapshots = 10;

  /**
   * 스냅샷 생성
   */
  takeSnapshot(label: string): number | null {
    const memory = getMemoryUsage();
    if (!memory) return null;

    if (!this.snapshots.has(label)) {
      this.snapshots.set(label, []);
    }

    const snapshots = this.snapshots.get(label)!;
    snapshots.push(memory.usedJSHeapSize);

    // 최대 개수 유지
    if (snapshots.length > this.maxSnapshots) {
      snapshots.shift();
    }

    return memory.usedJSHeapSize;
  }

  /**
   * 메모리 누수 확인 (증가 추세)
   */
  detectLeak(label: string, threshold: number = 1024 * 1024): boolean {
    const snapshots = this.snapshots.get(label);
    if (!snapshots || snapshots.length < 3) return false;

    // 처음 3개와 마지막 3개의 평균 비교
    const firstAvg = snapshots.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const lastAvg = snapshots.slice(-3).reduce((a, b) => a + b, 0) / 3;

    return (lastAvg - firstAvg) > threshold;
  }

  /**
   * 증가량 계산
   */
  getGrowth(label: string): number | null {
    const snapshots = this.snapshots.get(label);
    if (!snapshots || snapshots.length < 2) return null;

    return snapshots[snapshots.length - 1] - snapshots[0];
  }

  /**
   * 보고서 생성
   */
  report(label: string): void {
    const snapshots = this.snapshots.get(label);
    if (!snapshots || snapshots.length === 0) {
      console.log(`[MemoryLeakDetector] No snapshots for "${label}"`);
      return;
    }

    const growth = this.getGrowth(label);
    const hasLeak = this.detectLeak(label);

    console.group(`[MemoryLeakDetector] Report: ${label}`);
    console.log('Snapshots:', snapshots.map(formatBytes));
    console.log('Growth:', growth !== null ? formatBytes(growth) : 'N/A');
    console.log('Leak Detected:', hasLeak ? '⚠️ YES' : '✓ NO');
    console.groupEnd();
  }

  /**
   * 라벨 초기화
   */
  clear(label?: string): void {
    if (label) {
      this.snapshots.delete(label);
    } else {
      this.snapshots.clear();
    }
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();

/**
 * 성능 측정 데코레이터
 */
export function measurePerformance(name?: string) {
  return function (
    target: Record<string, unknown>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const measureName = name || `${(target.constructor as { name: string }).name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      profiler.mark(`${measureName}-start`);
      try {
        const result = await originalMethod.apply(this, args);
        profiler.measure(measureName, `${measureName}-start`);
        return result;
      } catch (error) {
        profiler.measure(`${measureName}-error`, `${measureName}-start`);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 측정 래퍼 - 함수 실행 시간 측정
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  profiler.mark(`${name}-start`);
  try {
    const result = await fn();
    profiler.measure(name, `${name}-start`);
    return result;
  } catch (error) {
    profiler.measure(`${name}-error`, `${name}-start`);
    throw error;
  }
}

/**
 * 측정 래퍼 - 동기 함수 실행 시간 측정
 */
export function measure<T>(
  name: string,
  fn: () => T
): T {
  profiler.mark(`${name}-start`);
  try {
    const result = fn();
    profiler.measure(name, `${name}-start`);
    return result;
  } catch (error) {
    profiler.measure(`${name}-error`, `${name}-start`);
    throw error;
  }
}
