/**
 * Cache Comparator
 *
 * 캐시 상태 비교 및 변경사항 추적
 */

import { CacheEntry } from '../../../types/resourceNetwork';

/**
 * 캐시 스냅샷
 */
export interface CacheSnapshot {
  timestamp: number;
  entries: CacheEntry[];
  hash: string;
}

/**
 * 캐시 변경사항
 */
export interface CacheChange {
  type: 'added' | 'removed' | 'modified';
  url: string;
  oldEntry?: CacheEntry;
  newEntry?: CacheEntry;
}

/**
 * 캐시 비교 결과
 */
export interface CacheComparison {
  timestamp: number;
  added: CacheEntry[];
  removed: CacheEntry[];
  modified: Array<{ old: CacheEntry; new: CacheEntry }>;
  unchanged: CacheEntry[];
  sizeDiff: number;
  totalChanges: number;
}

/**
 * 캐시 항목 해시 생성
 */
function hashCacheEntry(entry: CacheEntry): string {
  const data = `${entry.url}-${entry.size}-${entry.lastModified}-${entry.etag || ''}`;
  // 간단한 해시
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * 캐시 스냅샷 생성
 */
export function createCacheSnapshot(entries: CacheEntry[]): CacheSnapshot {
  const sortedEntries = [...entries].sort((a, b) => a.url.localeCompare(b.url));
  const hash = sortedEntries.map((e) => hashCacheEntry(e)).join('|');

  return {
    timestamp: Date.now(),
    entries: sortedEntries,
    hash,
  };
}

/**
 * 두 스냅샷 비교
 */
export function compareCacheSnapshots(
  before: CacheSnapshot,
  after: CacheSnapshot
): CacheComparison {
  const beforeMap = new Map(before.entries.map((e) => [e.url, e]));
  const afterMap = new Map(after.entries.map((e) => [e.url, e]));

  const added: CacheEntry[] = [];
  const removed: CacheEntry[] = [];
  const modified: Array<{ old: CacheEntry; new: CacheEntry }> = [];
  const unchanged: CacheEntry[] = [];

  // 추가 및 변경된 항목 확인
  for (const [url, newEntry] of afterMap) {
    const oldEntry = beforeMap.get(url);

    if (!oldEntry) {
      added.push(newEntry);
    } else if (hashCacheEntry(oldEntry) !== hashCacheEntry(newEntry)) {
      modified.push({ old: oldEntry, new: newEntry });
    } else {
      unchanged.push(newEntry);
    }
  }

  // 제거된 항목 확인
  for (const [url, oldEntry] of beforeMap) {
    if (!afterMap.has(url)) {
      removed.push(oldEntry);
    }
  }

  // 크기 변화 계산
  const beforeSize = before.entries.reduce((sum, e) => sum + e.size, 0);
  const afterSize = after.entries.reduce((sum, e) => sum + e.size, 0);
  const sizeDiff = afterSize - beforeSize;

  return {
    timestamp: Date.now(),
    added,
    removed,
    modified,
    unchanged,
    sizeDiff,
    totalChanges: added.length + removed.length + modified.length,
  };
}

/**
 * 변경사항 요약
 */
export function summarizeChanges(comparison: CacheComparison): {
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  sizeDiff: string;
  summary: string;
} {
  const totalChanges =
    comparison.added.length + comparison.removed.length + comparison.modified.length;

  const sizeDiffStr =
    comparison.sizeDiff > 0
      ? `+${formatBytes(comparison.sizeDiff)}`
      : formatBytes(comparison.sizeDiff);

  const summaryParts: string[] = [];

  if (comparison.added.length > 0) {
    summaryParts.push(`${comparison.added.length}개 추가`);
  }
  if (comparison.removed.length > 0) {
    summaryParts.push(`${comparison.removed.length}개 제거`);
  }
  if (comparison.modified.length > 0) {
    summaryParts.push(`${comparison.modified.length}개 수정`);
  }

  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : '변경사항 없음';

  return {
    totalChanges,
    addedCount: comparison.added.length,
    removedCount: comparison.removed.length,
    modifiedCount: comparison.modified.length,
    sizeDiff: sizeDiffStr,
    summary,
  };
}

/**
 * 바이트 포맷
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 변경사항을 변경 이벤트 배열로 변환
 */
export function changesToEvents(comparison: CacheComparison): CacheChange[] {
  const events: CacheChange[] = [];

  for (const entry of comparison.added) {
    events.push({ type: 'added', url: entry.url, newEntry: entry });
  }

  for (const entry of comparison.removed) {
    events.push({ type: 'removed', url: entry.url, oldEntry: entry });
  }

  for (const { old, new: newEntry } of comparison.modified) {
    events.push({
      type: 'modified',
      url: old.url,
      oldEntry: old,
      newEntry: newEntry,
    });
  }

  return events.sort((a, b) => {
    const order = { added: 0, modified: 1, removed: 2 };
    return order[a.type] - order[b.type];
  });
}

/**
 * 캐시 히스토리 관리자
 */
export class CacheHistory {
  private snapshots: CacheSnapshot[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * 스냅샷 추가
   */
  addSnapshot(entries: CacheEntry[]): void {
    const snapshot = createCacheSnapshot(entries);
    this.snapshots.push(snapshot);

    // 크기 제한 유지
    if (this.snapshots.length > this.maxSize) {
      this.snapshots.shift();
    }
  }

  /**
   * 최근 스냅샷 가져오기
   */
  getLatestSnapshot(): CacheSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  /**
   * 이전 스냅샷 가져오기
   */
  getPreviousSnapshot(): CacheSnapshot | null {
    return this.snapshots[this.snapshots.length - 2] || null;
  }

  /**
   * 가장 최근 변경사항 가져오기
   */
  getLatestChanges(): CacheComparison | null {
    const latest = this.getLatestSnapshot();
    const previous = this.getPreviousSnapshot();

    if (!latest || !previous) {
      return null;
    }

    return compareCacheSnapshots(previous, latest);
  }

  /**
   * 모든 스냅샷 가져오기
   */
  getAllSnapshots(): CacheSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * 스냅샷 초기화
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * 스냅샷 개수
   */
  get length(): number {
    return this.snapshots.length;
  }
}

/**
 * 캐시 변화 추적 (실시간)
 */
export class CacheChangeTracker {
  private history = new CacheHistory();
  private callback?: (changes: CacheComparison) => void;
  private intervalId: number | null = null;

  constructor(maxHistorySize: number = 10) {
    this.history = new CacheHistory(maxHistorySize);
  }

  /**
   * 추적 시작
   */
  async start(
    getEntries: () => Promise<CacheEntry[]>,
    intervalMs: number = 5000,
    callback?: (changes: CacheComparison) => void
  ): Promise<void> {
    this.callback = callback;

    // 초기 스냅샷
    const entries = await getEntries();
    this.history.addSnapshot(entries);

    // 주기적 확인
    this.intervalId = window.setInterval(async () => {
      const currentEntries = await getEntries();
      this.history.addSnapshot(currentEntries);

      const changes = this.history.getLatestChanges();
      if (changes && changes.totalChanges > 0 && this.callback) {
        this.callback(changes);
      }
    }, intervalMs) as unknown as number;
  }

  /**
   * 추적 중지
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 히스토리 가져오기
   */
  getHistory(): CacheHistory {
    return this.history;
  }
}
