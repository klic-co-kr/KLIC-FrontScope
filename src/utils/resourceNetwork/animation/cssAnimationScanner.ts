/**
 * CSS Animation Scanner
 *
 * 페이지 내 CSS 애니메이션/트랜지션 스캔 기능 제공
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSAnimation } from '../../../types/resourceNetwork';

/**
 * 페이지 내 모든 요소의 CSS 애니메이션 스캔
 */
export function scanCSSAnimations(): CSSAnimation[] {
  const animations: CSSAnimation[] = [];
  const elements = document.querySelectorAll('*');
  const seenIds = new Set<string>();

  for (const element of Array.from(elements)) {
    const styles = window.getComputedStyle(element);

    // transition 속성 확인
    const transition = styles.transition;
    if (transition && transition !== 'none' && transition !== 'all 0s ease 0s') {
      const id = `transition-${getElementSelector(element)}`;

      if (!seenIds.has(id)) {
        seenIds.add(id);
        animations.push({
          id,
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
    }

    // animation 속성 확인
    const animation = styles.animation;
    if (
      animation &&
      animation !== 'none' &&
      animation !== 'all 0s ease 0s 1 normal none running'
    ) {
      const animationName = styles.animationName || 'custom';
      const id = `animation-${getElementSelector(element)}-${animationName}`;

      if (!seenIds.has(id)) {
        seenIds.add(id);
        animations.push({
          id,
          type: 'css',
          element: getElementSelector(element),
          property: animationName,
          duration: parseDuration(styles.animationDuration),
          delay: parseDuration(styles.animationDelay),
          iterationCount: parseIterationCount(styles.animationIterationCount),
          timingFunction: styles.animationTimingFunction,
          keyframes: extractKeyframes(animationName),
          affectsPerformance: calculatePerformanceImpact(styles.animationDuration),
        });
      }
    }
  }

  return animations;
}

/**
 * 요소의 CSS 선택자 생성
 */
export function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const tagName = element.tagName.toLowerCase();

  if (element.className) {
    const classes = element.className
      .toString()
      .split(' ')
      .filter((c) => c)
      .join('.');
    if (classes) {
      return `${tagName}.${classes}`;
    }
  }

  // 추가 속성으로 고유 선택자 생성
  if (element.hasAttribute('data-testid')) {
    return `${tagName}[data-testid="${element.getAttribute('data-testid')}"]`;
  }

  return tagName;
}

/**
 * CSS 지속시간 파싱 (ms 단위)
 */
export function parseDuration(duration: string): number {
  if (!duration || duration === 'none' || duration === 'auto') return 0;

  const parts = duration.split(',').map((d) => d.trim());
  const durations = parts.map((part) => {
    const match = part.match(/([\d.]+)(ms|s)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    return unit === 's' ? value * 1000 : value;
  });

  // 여러 값이 있는 경우 평균 반환
  return durations.length > 0 ? Math.max(...durations) : 0;
}

/**
 * 반복 횟수 파싱
 */
export function parseIterationCount(count: string): number | 'infinite' {
  if (!count) return 1;

  const parts = count.split(',').map((c) => c.trim());

  for (const part of parts) {
    if (part === 'infinite') return 'infinite';
  }

  // 여러 값이 있는 경우 평균 반환
  const values = parts.map((p) => parseFloat(p) || 1);
  return Math.max(...values);
}

/**
 * 키프레임 추출 (스타일시트에서)
 */
export function extractKeyframes(animationName: string): string[] {
  const keyframes: string[] = [];

  if (!animationName || animationName === 'none') return keyframes;

  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || (sheet as any).rules;

        if (!rules) continue;

        for (const rule of Array.from(rules)) {
          if (
            rule instanceof CSSKeyframesRule &&
            rule.name === animationName
          ) {
            for (const keyframe of Array.from(rule.cssRules)) {
              if (keyframe instanceof CSSKeyframeRule) {
                keyframes.push(keyframe.keyText);
              }
            }
          }
        }
      } catch {
        // CORS 제한으로 인해 접근 불가능한 스타일시트
        continue;
      }
    }
  } catch (err) {
    console.error('Failed to extract keyframes:', err);
  }

  return keyframes;
}

/**
 * 성능 영향 계산
 */
export function calculatePerformanceImpact(
  duration: string
): 'low' | 'medium' | 'high' {
  const durationMs = parseDuration(duration);

  if (durationMs < 300) return 'low';
  if (durationMs < 1000) return 'medium';
  return 'high';
}

/**
 * 애니메이션 일시정지
 */
export function pauseCSSAnimation(element: Element): void {
  (element as HTMLElement).style.animationPlayState = 'paused';
}

/**
 * 애니메이션 재개
 */
export function resumeCSSAnimation(element: Element): void {
  (element as HTMLElement).style.animationPlayState = 'running';
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

/**
 * 특정 요소의 애니메이션 정보 가져오기
 */
export function getElementAnimations(element: Element): CSSAnimation[] {
  const styles = window.getComputedStyle(element);
  const animations: CSSAnimation[] = [];

  const animation = styles.animation;
  if (
    animation &&
    animation !== 'none' &&
    animation !== 'all 0s ease 0s 1 normal none running'
  ) {
    const animationName = styles.animationName || 'custom';
    animations.push({
      id: `animation-${getElementSelector(element)}-${animationName}`,
      type: 'css',
      element: getElementSelector(element),
      property: animationName,
      duration: parseDuration(styles.animationDuration),
      delay: parseDuration(styles.animationDelay),
      iterationCount: parseIterationCount(styles.animationIterationCount),
      timingFunction: styles.animationTimingFunction,
      keyframes: extractKeyframes(animationName),
      affectsPerformance: calculatePerformanceImpact(styles.animationDuration),
    });
  }

  return animations;
}

/**
 * transform 사용 여부 확인 (GPU 가속 여부)
 */
export function usesTransform(element: Element): boolean {
  const styles = window.getComputedStyle(element);
  const transform = styles.transform || styles.webkitTransform || '';

  // animation이 transform을 사용하는지 확인
  const animationName = styles.animationName;
  if (animationName && animationName !== 'none') {
    // 키프레임에 transform이 있는지 확인
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || (sheet as any).rules;
        if (!rules) continue;

        for (const rule of Array.from(rules)) {
          if (
            rule instanceof CSSKeyframesRule &&
            rule.name === animationName
          ) {
            for (const keyframe of Array.from(rule.cssRules)) {
              if (keyframe instanceof CSSKeyframeRule) {
                if (keyframe.style.transform) return true;
              }
            }
          }
        }
      } catch {
        continue;
      }
    }
  }

  return transform !== 'none' && transform !== '';
}

/**
 * opacity 사용 여부 확인
 */
export function usesOpacity(element: Element): boolean {
  const styles = window.getComputedStyle(element);
  const opacity = parseFloat(styles.opacity);

  return opacity < 1;
}

/**
 * GPU 가속 가능한 애니메이션인지 확인
 */
export function isGPUAccelerated(element: Element): boolean {
  return usesTransform(element) || usesOpacity(element);
}

/**
 * will-change 사용 여부 확인
 */
export function hasWillChange(element: Element): boolean {
  const styles = window.getComputedStyle(element);
  const willChange = styles.willChange;

  return willChange !== 'auto' && willChange !== '';
}
