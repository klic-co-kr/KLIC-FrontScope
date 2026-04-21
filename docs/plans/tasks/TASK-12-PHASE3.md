# Phase 3: 애니메이션 검사기

**태스크**: 7개
**예상 시간**: 3시간
**의존성**: Phase 1-2 완료

---

### Task #12.14: CSS 애니메이션 스캐너

- **파일**: `src/utils/resourceNetwork/animation/cssAnimationScanner.ts`
- **시간**: 30분
- **의존성**: Task #12.1, #12.4
- **상세 내용**:
```typescript
import { CSSAnimation, AnimationInfo } from '../../../types/resourceNetwork';

/**
 * 페이지 내 모든 요소의 CSS 애니메이션 스캔
 */
export function scanCSSAnimations(): CSSAnimation[] {
  const animations: CSSAnimation[] = [];
  const elements = document.querySelectorAll('*');

  for (const element of Array.from(elements)) {
    const styles = window.getComputedStyle(element);

    // transition 속성 확인
    const transition = styles.transition;
    if (transition && transition !== 'none' && transition !== 'all 0s ease 0s') {
      animations.push({
        id: `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'css',
        element: getElementSelector(element),
        property: styles.transitionProperty || 'all',
        duration: parseDuration(styles.transitionDuration),
        delay: parseDuration(styles.transitionDelay),
        iterationCount: 1,
        timingFunction: styles.transitionTimingFunction,
        keyframes: [],
        affectsPerformance: calculatePerformanceImpact(styles.transitionDuration),
      });
    }

    // animation 속성 확인
    const animation = styles.animation;
    if (animation && animation !== 'none' && animation !== 'all 0s ease 0s 1 normal none running') {
      animations.push({
        id: `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'css',
        element: getElementSelector(element),
        property: styles.animationName || 'custom',
        duration: parseDuration(styles.animationDuration),
        delay: parseDuration(styles.animationDelay),
        iterationCount: parseIterationCount(styles.animationIterationCount),
        timingFunction: styles.animationTimingFunction,
        keyframes: extractKeyframes(styles.animationName),
        affectsPerformance: calculatePerformanceImpact(styles.animationDuration),
      });
    }
  }

  return animations;
}

/**
 * 요소의 CSS 선택자 생성
 */
function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(c => c).join('.');
    if (classes) {
      return `${element.tagName.toLowerCase()}.${classes}`;
    }
  }

  return element.tagName.toLowerCase();
}

/**
 * CSS 지속시간 파싱 (ms 단위)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/([\d.]+)(ms|s)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 's' ? value * 1000 : value;
}

/**
 * 반복 횟수 파싱
 */
function parseIterationCount(count: string): number | 'infinite' {
  if (count === 'infinite') return 'infinite';
  return parseInt(count) || 1;
}

/**
 * 키프레임 추출 (스타일시트에서)
 */
function extractKeyframes(animationName: string): string[] {
  const keyframes: string[] = [];

  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;

        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSKeyframesRule && rule.name === animationName) {
            for (const keyframe of Array.from(rule.cssRules)) {
              if (keyframe instanceof CSSKeyframeRule) {
                keyframes.push(keyframe.keyText);
              }
            }
          }
        }
      } catch (e) {
        // CORS 제한으로 인해 접근 불가능한 스타일시트
        continue;
      }
    }
  } catch (error) {
    console.error('Failed to extract keyframes:', error);
  }

  return keyframes;
}

/**
 * 성능 영향 계산
 */
function calculatePerformanceImpact(duration: string): 'low' | 'medium' | 'high' {
  const durationMs = parseDuration(duration);

  if (durationMs < 300) return 'low';
  if (durationMs < 1000) return 'medium';
  return 'high';
}

/**
 * 애니메이션 일시정지
 */
export function pauseCSSAnimation(element: Element): void {
  (element as any).style.animationPlayState = 'paused';
}

/**
 * 애니메이션 재개
 */
export function resumeCSSAnimation(element: Element): void {
  (element as any).style.animationPlayState = 'running';
}

/**
 * 모든 애니메이션 일시정지
 */
export function pauseAllCSSAnimations(): void {
  const elements = document.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    const styles = window.getComputedStyle(element);
    if (styles.animation !== 'none') {
      pauseCSSAnimation(element);
    }
  }
}

/**
 * 모든 애니메이션 재개
 */
export function resumeAllCSSAnimations(): void {
  const elements = document.querySelectorAll('*');
  for (const element of Array.from(elements)) {
    const styles = window.getComputedStyle(element);
    if (styles.animation !== 'none') {
      resumeCSSAnimation(element);
    }
  }
}
```

---

### Task #12.15: JS 애니메이션 스캐너

- **파일**: `src/utils/resourceNetwork/animation/jsAnimationScanner.ts`
- **시간**: 25분
- **의존성**: Task #12.1
- **상세 내용**:
```typescript
import { JSAnimation } from '../../../types/resourceNetwork';

/**
 * requestAnimationFrame 사용 감지
 */
export function detectRAFUsage(): JSAnimation[] {
  const animations: JSAnimation[] = [];
  const originalRAF = window.requestAnimationFrame;

  // Monkey patch로 감지
  let rafCount = 0;
  let rafStartTime = Date.now();

  window.requestAnimationFrame = function(callback) {
    rafCount++;
    return originalRAF.call(window, callback);
  };

  // 1초 후 측정
  setTimeout(() => {
    const elapsed = Date.now() - rafStartTime;
    const estimatedFPS = rafCount / (elapsed / 1000);

    if (rafCount > 0) {
      animations.push({
        id: `raf-${Date.now()}`,
        type: 'js',
        library: 'requestAnimationFrame',
        frameCount: rafCount,
        estimatedFPS: Math.round(estimatedFPS),
        affectsPerformance: estimatedFPS < 30 ? 'high' : estimatedFPS < 50 ? 'medium' : 'low',
      });
    }

    // 복구
    window.requestAnimationFrame = originalRAF;
  }, 1000);

  return animations;
}

/**
 * Web Animation API 사용 감지
 */
export function detectWebAnimations(): JSAnimation[] {
  const animations: JSAnimation[] = [];

  // Element.animate() 사용 감지
  const originalAnimate = Element.prototype.animate;

  Element.prototype.animate = function(...args) {
    const animation = originalAnimate.apply(this, args);

    animations.push({
      id: `wa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'js',
      library: 'web-animation',
      frameCount: 0,
      estimatedFPS: 60, // 기본값
      affectsPerformance: 'low',
    });

    return animation;
  };

  return animations;
}

/**
 * 애니메이션 라이브러리 감지
 */
export function detectAnimationLibraries(): string[] {
  const detected: string[] = [];

  // GSAP
  if ((window as any).gsap || (window as any).TweenMax) {
    detected.push('gsap');
  }

  // Anime.js
  if ((window as any).anime) {
    detected.push('animejs');
  }

  // Velocity.js
  if ((window as any).Velocity) {
    detected.push('velocity');
  }

  // Mo.js
  if ((window as any).mo) {
    detected.push('mojs');
  }

  // Lottie
  if ((window as any).lottie) {
    detected.push('lottie');
  }

  // Three.js (3D 애니메이션)
  if ((window as any).THREE) {
    detected.push('three');
  }

  return detected;
}
```

---

### Task #12.16: 애니메이션 성능 분석기

- **파일**: `src/utils/resourceNetwork/animation/performanceAnalyzer.ts`
- **시간**: 20분
- **의존성**: Task #12.1, #12.14, #12.15
- **상세 내용**:
```typescript
import { AnimationInfo } from '../../../types/resourceNetwork';

/**
 * 애니메이션 성능 영향 분석
 */
export interface AnimationPerformanceReport {
  totalAnimations: number;
  byImpact: {
    low: number;
    medium: number;
    high: number;
  };
  recommendations: string[];
}

export function analyzeAnimationPerformance(animations: AnimationInfo[]): AnimationPerformanceReport {
  const byImpact = { low: 0, medium: 0, high: 0 };
  const recommendations: string[] = [];

  for (const anim of animations) {
    byImpact[anim.affectsPerformance]++;
  }

  // 권장사항 생성
  if (byImpact.high > 0) {
    recommendations.push('높은 성능 영향의 애니메이션을 최적화하세요 (지속시간 단축, transform/opacity 사용)');
  }

  if (byImpact.medium > 5) {
    recommendations.push('중간 영향의 애니메이션이 많습니다. will-change 속성을 고려하세요');
  }

  if (animations.length > 20) {
    recommendations.push('애니메이션 수가 많습니다. 불필요한 애니메이션을 제거하세요');
  }

  // CSS transform 사용 권장
  const nonTransformAnimations = animations.filter(
    anim => anim.type === 'css' && anim.property !== 'transform' && anim.property !== 'opacity'
  );

  if (nonTransformAnimations.length > 0) {
    recommendations.push('일부 애니메이션이 transform/opacity를 사용하지 않습니다. GPU 가속을 위해 이 속성들을 사용하세요');
  }

  return {
    totalAnimations: animations.length,
    byImpact,
    recommendations,
  };
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
export function getOptimizationSuggestions(animations: AnimationInfo[]): string[] {
  const suggestions: string[] = [];

  for (const anim of animations) {
    if (anim.type === 'css') {
      if (anim.affectsPerformance === 'high') {
        suggestions.push(`[${anim.element}] ${anim.duration}ms 지속시간을 줄이세요`);
      }

      if (anim.iterationCount === 'infinite') {
        suggestions.push(`[${anim.element}] 무한 반복 애니메이션을 확인하세요`);
      }
    }
  }

  return suggestions;
}
```

---

### Task #12.17: 애니메이션 관리 훅

- **파일**: `src/hooks/resourceNetwork/useAnimationInspector.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.2, #12.14, #12.15, #12.16
- **상세 내용**:
```typescript
import { useState, useCallback } from 'react';
import { AnimationInfo } from '../../types/resourceNetwork';
import { scanCSSAnimations, pauseAllCSSAnimations, resumeAllCSSAnimations } from '../../utils/resourceNetwork/animation/cssAnimationScanner';
import { detectRAFUsage, detectWebAnimations, detectAnimationLibraries } from '../../utils/resourceNetwork/animation/jsAnimationScanner';
import { analyzeAnimationPerformance } from '../../utils/resourceNetwork/animation/performanceAnalyzer';

export function useAnimationInspector() {
  const [animations, setAnimations] = useState<AnimationInfo[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<any>(null);

  // 애니메이션 스캔
  const scanAnimations = useCallback(() => {
    const cssAnimations = scanCSSAnimations();
    const jsAnimations = [
      ...detectRAFUsage(),
      ...detectWebAnimations(),
    ];

    const allAnimations = [...cssAnimations, ...jsAnimations];
    setAnimations(allAnimations);

    const report = analyzeAnimationPerformance(allAnimations);
    setPerformanceReport(report);
  }, []);

  // 모든 애니메이션 일시정지
  const pauseAll = useCallback(() => {
    pauseAllCSSAnimations();
    setIsPaused(true);
  }, []);

  // 모든 애니메이션 재개
  const resumeAll = useCallback(() => {
    resumeAllCSSAnimations();
    setIsPaused(false);
  }, []);

  // 특정 애니메이션 토글
  const toggleAnimation = useCallback((id: string) => {
    const animation = animations.find(a => a.id === id);
    if (animation && animation.type === 'css') {
      const element = document.querySelector(animation.element);
      if (element) {
        const current = (element as any).style.animationPlayState;
        (element as any).style.animationPlayState = current === 'paused' ? 'running' : 'paused';
      }
    }
  }, [animations]);

  // 성능 영향별 필터링
  const getAnimationsByImpact = useCallback((impact: 'low' | 'medium' | 'high') => {
    return animations.filter(a => a.affectsPerformance === impact);
  }, [animations]);

  return {
    animations,
    isPaused,
    performanceReport,
    scanAnimations,
    pauseAll,
    resumeAll,
    toggleAnimation,
    getAnimationsByImpact,
  };
}
```
- **완료 조건**: 애니메이션 스캔 및 제어 동작 검증

---

### Task #12.18: 애니메이션 하이라이터

- **파일**: `src/utils/resourceNetwork/animation/animationHighlighter.ts`
- **시간**: 25분
- **의존성**: Task #12.1, #12.14
- **상세 내용**:
```typescript
/**
 * 애니메이션 하이라이트 오버레이
 */
let overlayElement: HTMLElement | null = null;

/**
 * 하이라이트 오버레이 생성
 */
function createOverlay(): HTMLElement {
  if (overlayElement) return overlayElement;

  overlayElement = document.createElement('div');
  overlayElement.id = 'animation-highlight-overlay';
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
  `;

  document.body.appendChild(overlayElement);
  return overlayElement;
}

/**
 * 애니메이션 요소 하이라이트
 */
export function highlightAnimation(element: Element, color: string = '#10B981'): void {
  const rect = element.getBoundingClientRect();
  const overlay = createOverlay();

  const highlight = document.createElement('div');
  highlight.style.cssText = `
    position: absolute;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid ${color};
    background: ${color}20;
    box-shadow: 0 0 10px ${color}40;
    transition: all 0.2s ease;
  `;

  overlay.appendChild(highlight);

  // 2초 후 제거
  setTimeout(() => {
    highlight.remove();
  }, 2000);
}

/**
 * 모든 애니메이션 하이라이트
 */
export function highlightAllAnimations(selectors: string[]): void {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      highlightAnimation(element);
    }
  }
}

/**
 * 하이라이트 제거
 */
export function clearHighlights(): void {
  if (overlayElement) {
    overlayElement.innerHTML = '';
  }
}

/**
 * 호버 시 하이라이트 활성화
 */
export function enableHoverHighlight(): void {
  document.addEventListener('mouseover', handleMouseOver);
}

/**
 * 호버 시 하이라이트 비활성화
 */
export function disableHoverHighlight(): void {
  document.removeEventListener('mouseover', handleMouseOver);
  clearHighlights();
}

/**
 * 마우스 오버 핸들러
 */
function handleMouseOver(event: MouseEvent): void {
  const target = event.target as Element;
  const styles = window.getComputedStyle(target);

  const hasAnimation =
    (styles.animation && styles.animation !== 'none') ||
    (styles.transition && styles.transition !== 'none');

  if (hasAnimation) {
    highlightAnimation(target, '#F59E0B');
  }
}
```

---

### Task #12.19: 애니메이션 타임라인

- **파일**: `src/utils/resourceNetwork/animation/animationTimeline.ts`
- **시간**: 20분
- **의존성**: Task #12.1, #12.14
- **상세 내용**:
```typescript
import { CSSAnimation, JSAnimation } from '../../../types/resourceNetwork';

/**
 * 타임라인 엔트리
 */
export interface TimelineEntry {
  id: string;
  element: string;
  type: 'css' | 'js';
  startTime: number;
  duration: number;
  delay: number;
  endTime: number;
}

/**
 * 애니메이션 타임라인 생성
 */
export function createAnimationTimeline(animations: (CSSAnimation | JSAnimation)[]): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];

  for (const anim of animations) {
    if (anim.type === 'css') {
      const cssAnim = anim as CSSAnimation;
      const startTime = Date.now(); // 실제로는 애니메이션 시작 시간 필요
      const endTime = startTime + cssAnim.duration + cssAnim.delay;

      timeline.push({
        id: cssAnim.id,
        element: cssAnim.element,
        type: 'css',
        startTime,
        duration: cssAnim.duration,
        delay: cssAnim.delay,
        endTime,
      });
    }
  }

  return timeline.sort((a, b) => a.startTime - b.startTime);
}

/**
 * 타임라인 시각화 데이터 생성
 */
export interface TimelineVisualization {
  totalDuration: number;
  entries: Array<{
    id: string;
    element: string;
    startPercent: number;
    widthPercent: number;
    color: string;
  }>;
}

export function createTimelineVisualization(timeline: TimelineEntry[]): TimelineVisualization {
  if (timeline.length === 0) {
    return { totalDuration: 0, entries: [] };
  }

  const startTime = Math.min(...timeline.map(e => e.startTime));
  const endTime = Math.max(...timeline.map(e => e.endTime));
  const totalDuration = endTime - startTime;

  const entries = timeline.map(entry => {
    const startPercent = ((entry.startTime - startTime) / totalDuration) * 100;
    const widthPercent = (entry.duration / totalDuration) * 100;

    return {
      id: entry.id,
      element: entry.element,
      startPercent,
      widthPercent,
      color: entry.type === 'css' ? '#3B82F6' : '#10B981',
    };
  });

  return { totalDuration, entries };
}

/**
 * 현재 재생 중인 애니메이션 확인
 */
export function getActiveAnimations(timeline: TimelineEntry[]): TimelineEntry[] {
  const now = Date.now();
  return timeline.filter(entry => entry.startTime <= now && entry.endTime >= now);
}

/**
 * 겹치는 애니메이션 찾기
 */
export function findOverlappingAnimations(timeline: TimelineEntry[]): Array<{
  animations: TimelineEntry[];
  period: { start: number; end: number };
}> {
  const overlaps: Array<{ animations: TimelineEntry[]; period: { start: number; end: number } }> = [];

  for (let i = 0; i < timeline.length; i++) {
    const current = timeline[i];
    const overlapping = [current];

    for (let j = i + 1; j < timeline.length; j++) {
      const next = timeline[j];

      // 시간이 겹치는지 확인
      if (next.startTime < current.endTime) {
        overlapping.push(next);
      }
    }

    if (overlapping.length > 1) {
      const start = Math.min(...overlapping.map(a => a.startTime));
      const end = Math.max(...overlapping.map(a => a.endTime));

      overlaps.push({
        animations: overlapping,
        period: { start, end },
      });
    }
  }

  return overlaps;
}
```

---

### Task #12.20: 애니메이션 내보내기

- **파일**: `src/utils/resourceNetwork/animation/animationExport.ts`
- **시간**: 15분
- **의존성**: Task #12.1, #12.14, #12.15
- **상세 내용**:
```typescript
import { AnimationInfo } from '../../../types/resourceNetwork';

/**
 * 애니메이션 내보내기 데이터
 */
export interface AnimationExport {
  timestamp: number;
  url: string;
  totalAnimations: number;
  cssAnimations: number;
  jsAnimations: number;
  animations: Array<{
    id: string;
    type: string;
    element: string;
    duration: number;
    performanceImpact: string;
  }>;
}

/**
 * 애니메이션 내보내기
 */
export function exportAnimations(animations: AnimationInfo[]): AnimationExport {
  const cssAnimations = animations.filter(a => a.type === 'css');
  const jsAnimations = animations.filter(a => a.type === 'js');

  return {
    timestamp: Date.now(),
    url: window.location.href,
    totalAnimations: animations.length,
    cssAnimations: cssAnimations.length,
    jsAnimations: jsAnimations.length,
    animations: animations.map(anim => ({
      id: anim.id,
      type: anim.type,
      element: anim.type === 'css' ? (anim as any).element : 'window',
      duration: anim.type === 'css' ? (anim as any).duration : 0,
      performanceImpact: anim.affectsPerformance,
    })),
  };
}

/**
 * JSON 파일로 다운로드
 */
export function downloadAnimationExport(exp: AnimationExport): void {
  const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `animation-export-${new Date(exp.timestamp).toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * HTML 보고서 생성
 */
export function generateAnimationReport(animations: AnimationInfo[]): string {
  const exp = exportAnimations(animations);

  return `
<!DOCTYPE html>
<html>
<head>
  <title>애니메이션 분석 보고서</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    h1 { color: #1f2937; }
    .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .high { color: #ef4444; }
    .medium { color: #f59e0b; }
    .low { color: #10b981; }
  </style>
</head>
<body>
  <h1>애니메이션 분석 보고서</h1>
  <div class="summary">
    <p><strong>URL:</strong> ${exp.url}</p>
    <p><strong>전체:</strong> ${exp.totalAnimations}개</p>
    <p><strong>CSS:</strong> ${exp.cssAnimations}개</p>
    <p><strong>JS:</strong> ${exp.jsAnimations}개</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>타입</th>
        <th>요소</th>
        <th>지속시간</th>
        <th>성능 영향</th>
      </tr>
    </thead>
    <tbody>
      ${exp.animations.map(anim => `
        <tr>
          <td>${anim.id}</td>
          <td>${anim.type}</td>
          <td>${anim.element}</td>
          <td>${anim.duration}ms</td>
          <td class="${anim.performanceImpact}">${anim.performanceImpact}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `.trim();
}
```

---

[Phase 4: 네트워크 요청 분석](./TASK-12-PHASE4.md) 로 계속
