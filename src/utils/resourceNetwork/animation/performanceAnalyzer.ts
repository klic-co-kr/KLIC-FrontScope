/**
 * Animation Performance Analyzer
 *
 * 애니메이션 성능 분석 기능 제공
 */

import { AnimationInfo, CSSAnimation, JSAnimation } from '../../../types/resourceNetwork';

/**
 * 애니메이션 성능 보고서
 */
export interface AnimationPerformanceReport {
  totalAnimations: number;
  cssCount: number;
  jsCount: number;
  byImpact: {
    low: number;
    medium: number;
    high: number;
  };
  recommendations: string[];
  score: number; // 0-100
}

/**
 * 애니메이션 성능 영향 분석
 */
export function analyzeAnimationPerformance(
  animations: AnimationInfo[]
): AnimationPerformanceReport {
  const byImpact = { low: 0, medium: 0, high: 0 };
  const recommendations: string[] = [];

  let cssCount = 0;
  let jsCount = 0;

  for (const anim of animations) {
    byImpact[anim.affectsPerformance]++;

    if (anim.type === 'css') {
      cssCount++;
    } else {
      jsCount++;
    }
  }

  // 권장사항 생성
  if (byImpact.high > 0) {
    recommendations.push(
      '높은 성능 영향의 애니메이션을 최적화하세요 (지속시간 단축, transform/opacity 사용)'
    );
  }

  if (byImpact.medium > 5) {
    recommendations.push(
      '중간 영향의 애니메이션이 많습니다. will-change 속성을 고려하세요'
    );
  }

  if (animations.length > 20) {
    recommendations.push('애니메이션 수가 많습니다. 불필요한 애니메이션을 제거하세요');
  }

  // 무한 반복 애니메이션 확인
  const infiniteAnimations = animations.filter(
    (anim) => anim.type === 'css' && (anim as CSSAnimation).iterationCount === 'infinite'
  );

  if (infiniteAnimations.length > 3) {
    recommendations.push(
      `${infiniteAnimations.length}개의 무한 반복 애니메이션이 있습니다. 배터리 소모를 줄이기 위해 제한을 고려하세요`
    );
  }

  // CSS transform 사용 권장
  const nonTransformAnimations = animations.filter(
    (anim) =>
      anim.type === 'css' &&
      (anim as CSSAnimation).property !== 'transform' &&
      (anim as CSSAnimation).property !== 'opacity'
  );

  if (nonTransformAnimations.length > 0) {
    recommendations.push(
      `${nonTransformAnimations.length}개의 애니메이션이 transform/opacity를 사용하지 않습니다. GPU 가속을 위해 이 속성들을 사용하세요`
    );
  }

  // JS 애니메이션 확인
  if (jsCount > 0) {
    const lowFPSAnimations = animations.filter(
      (anim) => anim.type === 'js' && ((anim as JSAnimation).estimatedFPS ?? 60) < 30
    );

    if (lowFPSAnimations.length > 0) {
      recommendations.push(
        `${lowFPSAnimations.length}개의 JS 애니메이션이 낮은 FPS를 기록하고 있습니다. 최적화가 필요합니다`
      );
    }
  }

  // 성능 점수 계산 (0-100)
  const score = calculatePerformanceScore(animations, byImpact);

  return {
    totalAnimations: animations.length,
    cssCount,
    jsCount,
    byImpact,
    recommendations,
    score,
  };
}

/**
 * 성능 점수 계산
 */
function calculatePerformanceScore(
  animations: AnimationInfo[],
  byImpact: { low: number; medium: number; high: number }
): number {
  let score = 100;

  // 높은 영향 애니메이션당 -15점
  score -= byImpact.high * 15;

  // 중간 영향 애니메이션당 -5점
  score -= byImpact.medium * 5;

  // 전체 애니메이션 수에 따른 감점
  if (animations.length > 20) {
    score -= (animations.length - 20) * 2;
  }

  // 무한 반복 애니메이션 감점
  const infiniteCount = animations.filter(
    (anim) => anim.type === 'css' && (anim as CSSAnimation).iterationCount === 'infinite'
  ).length;
  score -= infiniteCount * 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * 프레임 속도 측정
 */
export function measureFPS(duration: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const startTime = performance.now();

    function countFrame() {
      frames++;

      const elapsed = performance.now() - startTime;
      if (elapsed >= duration) {
        const fps = Math.round((frames / elapsed) * 1000);
        resolve(fps);
      } else {
        requestAnimationFrame(countFrame);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * 애니메이션 최적화 제안
 */
export function getOptimizationSuggestions(animations: AnimationInfo[]): Array<{
  element?: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const suggestions: Array<{
    element?: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  for (const anim of animations) {
    if (anim.type === 'css') {
      const cssAnim = anim as CSSAnimation;

      if (anim.affectsPerformance === 'high') {
        suggestions.push({
          element: cssAnim.element,
          issue: `지속시간이 ${cssAnim.duration}ms로 깁니다`,
          suggestion: '지속시간을 300ms 미만으로 줄이세요',
          priority: 'high',
        });
      }

      if (cssAnim.iterationCount === 'infinite') {
        suggestions.push({
          element: cssAnim.element,
          issue: '무한 반복 애니메이션',
          suggestion: '반복 횟수를 제한하거나 사용자가 페이지를 벗어날 때 애니메이션을 중지하세요',
          priority: 'medium',
        });
      }

      if (
        cssAnim.property !== 'transform' &&
        cssAnim.property !== 'opacity' &&
        cssAnim.property !== 'all'
      ) {
        suggestions.push({
          element: cssAnim.element,
          issue: `${cssAnim.property} 속성으로 애니메이션`,
          suggestion: 'GPU 가속을 위해 transform 또는 opacity를 사용하세요',
          priority: 'medium',
        });
      }

      if (cssAnim.timingFunction === 'ease-in-out' && cssAnim.duration > 500) {
        suggestions.push({
          element: cssAnim.element,
          issue: '복잡한 타이밍 함수와 긴 지속시간',
          suggestion: '간단한 ease 또는 linear를 사용하거나 지속시간을 줄이세요',
          priority: 'low',
        });
      }
    }

    if (anim.type === 'js') {
      const jsAnim = anim as JSAnimation;

      if ((jsAnim.estimatedFPS ?? 60) < 30) {
        suggestions.push({
          issue: `낮은 FPS (${jsAnim.estimatedFPS ?? 60})`,
          suggestion: '애니메이션 로직을 최적화하거나 CSS 애니메이션으로 전환하세요',
          priority: 'high',
        });
      }

      if (jsAnim.library === 'requestAnimationFrame' && (jsAnim.frameCount ?? 0) > 1000) {
        suggestions.push({
          issue: `높은 RAF 호출 수 (${jsAnim.frameCount})`,
          suggestion: '불필요한 계산을 줄이거나 requestAnimationFrame 호출을 최적화하세요',
          priority: 'medium',
        });
      }
    }
  }

  // 우선순위별 정렬
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * GPU 가속 사용 가능한 애니메이션 확인
 */
export function getGPUAcceleratableAnimations(
  animations: AnimationInfo[]
): { gpuAccelerated: AnimationInfo[]; notAccelerated: AnimationInfo[] } {
  const gpuAccelerated: AnimationInfo[] = [];
  const notAccelerated: AnimationInfo[] = [];

  for (const anim of animations) {
    if (anim.type === 'css') {
      const cssAnim = anim as CSSAnimation;
      const isGPUAccelerated =
        cssAnim.property === 'transform' ||
        cssAnim.property === 'opacity' ||
        cssAnim.property === 'all';

      if (isGPUAccelerated) {
        gpuAccelerated.push(anim);
      } else {
        notAccelerated.push(anim);
      }
    } else {
      // JS 애니메이션은 기본적으로 not accelerated로 분류
      notAccelerated.push(anim);
    }
  }

  return { gpuAccelerated, notAccelerated };
}

/**
 * 애니메이션 통계 생성
 */
export interface AnimationStatistics {
  totalDuration: number;
  averageDuration: number;
  longestAnimation?: AnimationInfo;
  shortestAnimation?: AnimationInfo;
  byProperty: Record<string, number>;
  byTimingFunction: Record<string, number>;
}

export function generateAnimationStatistics(
  animations: AnimationInfo[]
): AnimationStatistics {
  const stats: AnimationStatistics = {
    totalDuration: 0,
    averageDuration: 0,
    byProperty: {},
    byTimingFunction: {},
  };

  let longestDuration = 0;
  let shortestDuration = Infinity;

  for (const anim of animations) {
    if (anim.type === 'css') {
      const cssAnim = anim as CSSAnimation;

      stats.totalDuration += cssAnim.duration;

      if (cssAnim.duration > longestDuration) {
        longestDuration = cssAnim.duration;
        stats.longestAnimation = anim;
      }

      if (cssAnim.duration < shortestDuration) {
        shortestDuration = cssAnim.duration;
        stats.shortestAnimation = anim;
      }

      // 속성별 카운트
      const prop = cssAnim.property ?? 'unknown';
      stats.byProperty[prop] = (stats.byProperty[prop] || 0) + 1;

      // 타이밍 함수별 카운트
      const timing = cssAnim.timingFunction ?? 'unknown';
      stats.byTimingFunction[timing] = (stats.byTimingFunction[timing] || 0) + 1;
    }
  }

  const cssAnimations = animations.filter((a) => a.type === 'css');
  stats.averageDuration =
    cssAnimations.length > 0 ? stats.totalDuration / cssAnimations.length : 0;

  return stats;
}

/**
 * 성능 등급 부여
 */
export function getPerformanceGrade(score: number): {
  grade: string;
  color: string;
  label: string;
} {
  if (score >= 90) {
    return { grade: 'A', color: '#10B981', label: '우수' };
  }
  if (score >= 75) {
    return { grade: 'B', color: '#3B82F6', label: '좋음' };
  }
  if (score >= 60) {
    return { grade: 'C', color: '#F59E0B', label: '보통' };
  }
  if (score >= 40) {
    return { grade: 'D', color: '#EF4444', label: '낮음' };
  }
  return { grade: 'F', color: '#DC2626', label: '매우 낮음' };
}
