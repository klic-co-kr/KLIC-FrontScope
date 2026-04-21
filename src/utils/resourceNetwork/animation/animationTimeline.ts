/**
 * Animation Timeline
 *
 * 애니메이션 타임라인 시각화 기능 제공
 */

import { CSSAnimation, JSAnimation, AnimationInfo } from '../../../types/resourceNetwork';

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
  iterationCount: number | 'infinite';
  color: string;
}

/**
 * 타임라인 생성
 */
export function createAnimationTimeline(
  animations: AnimationInfo[],
  baseTime: number = Date.now()
): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];

  for (const anim of animations) {
    if (anim.type === 'css') {
      const cssAnim = anim as CSSAnimation;
      const startTime = baseTime;
      const endTime = startTime + cssAnim.duration + cssAnim.delay;

      timeline.push({
        id: cssAnim.id,
        element: cssAnim.element,
        type: 'css',
        startTime,
        duration: cssAnim.duration,
        delay: cssAnim.delay,
        endTime,
        iterationCount: cssAnim.iterationCount ?? 1,
        color: getColorByImpact(cssAnim.affectsPerformance),
      });
    } else if (anim.type === 'js') {
      const jsAnim = anim as JSAnimation;
      // JS 애니메이션은 시작/종료 시간을 알기 어려움
      timeline.push({
        id: jsAnim.id,
        element: 'window',
        type: 'js',
        startTime: baseTime,
        duration: 0,
        delay: 0,
        endTime: baseTime,
        iterationCount: 1,
        color: '#8B5CF6',
      });
    }
  }

  return timeline.sort((a, b) => a.startTime - b.startTime);
}

/**
 * 성능 영향별 색상 반환
 */
function getColorByImpact(impact: 'low' | 'medium' | 'high'): string {
  switch (impact) {
    case 'low':
      return '#10B981';
    case 'medium':
      return '#F59E0B';
    case 'high':
      return '#EF4444';
    default:
      return '#3B82F6';
  }
}

/**
 * 타임라인 시각화 데이터 생성
 */
export interface TimelineVisualization {
  totalDuration: number;
  startTime: number;
  endTime: number;
  entries: Array<{
    id: string;
    element: string;
    type: 'css' | 'js';
    startPercent: number;
    widthPercent: number;
    color: string;
    duration: number;
    delay: number;
  }>;
}

export function createTimelineVisualization(
  timeline: TimelineEntry[]
): TimelineVisualization {
  if (timeline.length === 0) {
    return {
      totalDuration: 0,
      startTime: 0,
      endTime: 0,
      entries: [],
    };
  }

  const startTime = Math.min(...timeline.map((e) => e.startTime));
  const endTime = Math.max(...timeline.map((e) => e.endTime));
  const totalDuration = endTime - startTime;

  const entries = timeline.map((entry) => {
    const startPercent = ((entry.startTime - startTime) / totalDuration) * 100;
    const widthPercent = ((entry.duration + entry.delay) / totalDuration) * 100;

    return {
      id: entry.id,
      element: entry.element,
      type: entry.type,
      startPercent,
      widthPercent,
      color: entry.color,
      duration: entry.duration,
      delay: entry.delay,
    };
  });

  return {
    totalDuration,
    startTime,
    endTime,
    entries,
  };
}

/**
 * 현재 재생 중인 애니메이션 확인
 */
export function getActiveAnimations(
  timeline: TimelineEntry[],
  currentTime: number = Date.now()
): TimelineEntry[] {
  return timeline.filter(
    (entry) => entry.startTime <= currentTime && entry.endTime >= currentTime
  );
}

/**
 * 대기 중인 애니메이션 확인
 */
export function getPendingAnimations(
  timeline: TimelineEntry[],
  currentTime: number = Date.now()
): TimelineEntry[] {
  return timeline.filter((entry) => entry.startTime > currentTime);
}

/**
 * 완료된 애니메이션 확인
 */
export function getCompletedAnimations(
  timeline: TimelineEntry[],
  currentTime: number = Date.now()
): TimelineEntry[] {
  return timeline.filter((entry) => entry.endTime < currentTime);
}

/**
 * 겹치는 애니메이션 찾기
 */
export interface OverlapInfo {
  animations: TimelineEntry[];
  period: { start: number; end: number };
  overlapDuration: number;
}

export function findOverlappingAnimations(
  timeline: TimelineEntry[]
): OverlapInfo[] {
  const overlaps: OverlapInfo[] = [];

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
      const start = Math.min(...overlapping.map((a) => a.startTime));
      const end = Math.max(...overlapping.map((a) => a.endTime));

      overlaps.push({
        animations: overlapping,
        period: { start, end },
        overlapDuration: end - start,
      });
    }
  }

  return overlaps;
}

/**
 * 동시에 실행되는 최대 애니메이션 수 계산
 */
export function getMaxConcurrentAnimations(timeline: TimelineEntry[]): {
  maxCount: number;
  timePoints: Array<{ time: number; count: number }>;
} {
  const events: Array<{ time: number; type: 'start' | 'end' }> = [];

  for (const entry of timeline) {
    events.push({ time: entry.startTime, type: 'start' });
    events.push({ time: entry.endTime, type: 'end' });
  }

  events.sort((a, b) => a.time - b.time);

  let currentCount = 0;
  let maxCount = 0;
  const timePoints: Array<{ time: number; count: number }> = [];

  for (const event of events) {
    if (event.type === 'start') {
      currentCount++;
      if (currentCount > maxCount) {
        maxCount = currentCount;
      }
    } else {
      currentCount--;
    }

    timePoints.push({ time: event.time, count: currentCount });
  }

  return { maxCount, timePoints };
}

/**
 * 애니메이션 병목 구간 찾기
 */
export interface BottleneckInfo {
  time: number;
  animationCount: number;
  severity: 'low' | 'medium' | 'high';
}

export function findBottlenecks(
  timeline: TimelineEntry[],
  threshold: number = 5
): BottleneckInfo[] {
  const { timePoints } = getMaxConcurrentAnimations(timeline);
  const bottlenecks: BottleneckInfo[] = [];

  for (const point of timePoints) {
    if (point.count >= threshold) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (point.count >= threshold * 1.5) {
        severity = 'high';
      } else if (point.count >= threshold * 1.2) {
        severity = 'medium';
      }

      bottlenecks.push({
        time: point.time,
        animationCount: point.count,
        severity,
      });
    }
  }

  return bottlenecks;
}

/**
 * 타임라인 필터링
 */
export function filterTimeline(
  timeline: TimelineEntry[],
  filters: {
    type?: 'css' | 'js';
    minDuration?: number;
    maxDuration?: number;
    impact?: 'low' | 'medium' | 'high';
  }
): TimelineEntry[] {
  return timeline.filter((entry) => {
    if (filters.type && entry.type !== filters.type) {
      return false;
    }
    if (filters.minDuration && entry.duration < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration && entry.duration > filters.maxDuration) {
      return false;
    }
    // impact는 color로 유추
    if (filters.impact) {
      const expectedColor = getColorByImpact(filters.impact);
      if (entry.color !== expectedColor) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 타임라인을 JSON으로 내보내기
 */
export function exportTimelineToJson(timeline: TimelineEntry[]): string {
  return JSON.stringify(timeline, null, 2);
}

/**
 * 타임라인을 CSV로 내보내기
 */
export function exportTimelineToCsv(timeline: TimelineEntry[]): string {
  const headers = ['ID', 'Element', 'Type', 'Start Time', 'Duration', 'Delay', 'End Time', 'Color'];
  const rows = timeline.map((entry) => [
    entry.id,
    entry.element,
    entry.type,
    entry.startTime.toString(),
    entry.duration.toString(),
    entry.delay.toString(),
    entry.endTime.toString(),
    entry.color,
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

/**
 * 타임라인 통계
 */
export interface TimelineStatistics {
  totalAnimations: number;
  cssCount: number;
  jsCount: number;
  averageDuration: number;
  longestAnimation: TimelineEntry | null;
  shortestAnimation: TimelineEntry | null;
  totalOverlapTime: number;
  maxConcurrentAnimations: number;
}

export function getTimelineStatistics(timeline: TimelineEntry[]): TimelineStatistics {
  const cssCount = timeline.filter((e) => e.type === 'css').length;
  const jsCount = timeline.filter((e) => e.type === 'js').length;

  const durations = timeline
    .filter((e) => e.type === 'css')
    .map((e) => e.duration);
  const averageDuration =
    durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

  const sortedByDuration = [...timeline]
    .filter((e) => e.type === 'css')
    .sort((a, b) => b.duration - a.duration);
  const longestAnimation = sortedByDuration[0] || null;
  const shortestAnimation = sortedByDuration[sortedByDuration.length - 1] || null;

  const { maxCount } = getMaxConcurrentAnimations(timeline);

  const overlaps = findOverlappingAnimations(timeline);
  const totalOverlapTime = overlaps.reduce(
    (sum, overlap) => sum + overlap.overlapDuration,
    0
  );

  return {
    totalAnimations: timeline.length,
    cssCount,
    jsCount,
    averageDuration,
    longestAnimation,
    shortestAnimation,
    totalOverlapTime,
    maxConcurrentAnimations: maxCount,
  };
}
