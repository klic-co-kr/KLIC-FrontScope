/**
 * Annotation History
 *
 * 주석 작업 내역 관리 (실행 취소/재실행)
 */

import type { Annotation } from '../../../types/screenshot';

/**
 * 내역 항목
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: 'add' | 'remove' | 'update' | 'clear';
  annotation?: Annotation | Annotation[];
  previousAnnotation?: Annotation | Annotation[];
  description: string;
}

/**
 * 내역 관리자 상태
 */
export interface HistoryState {
  past: HistoryEntry[];
  present: Annotation[];
  future: HistoryEntry[];
  maxSize: number;
}

/**
 * 주석 내역 관리자
 */
export class AnnotationHistory {
  private state: HistoryState;
  private listeners: Set<(state: HistoryState) => void> = new Set();

  constructor(maxSize: number = 50) {
    this.state = {
      past: [],
      present: [],
      future: [],
      maxSize,
    };
  }

  /**
   * 현재 주석 목록 가져오기
   */
  getPresent(): Annotation[] {
    return [...this.state.present];
  }

  /**
   * 실행 취소 가능 여부
   */
  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  /**
   * 재실행 가능 여부
   */
  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  /**
   * 주석 추가
   */
  add(annotation: Annotation): void {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'add',
      annotation,
      description: `Add ${annotation.type}`,
    };

    this.pushToPast(entry);
    this.state.present = [...this.state.present, annotation];
    this.clearFuture();
    this.notify();
  }

  /**
   * 주석 제거
   */
  remove(annotationId: string): void {
    const annotation = this.state.present.find(a => a.id === annotationId);
    if (!annotation) return;

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'remove',
      annotation,
      description: `Remove ${annotation.type}`,
    };

    this.pushToPast(entry);
    this.state.present = this.state.present.filter(a => a.id !== annotationId);
    this.clearFuture();
    this.notify();
  }

  /**
   * 주석 업데이트
   */
  update(annotationId: string, updates: Partial<Annotation>): void {
    const index = this.state.present.findIndex(a => a.id === annotationId);
    if (index === -1) return;

    const previousAnnotation = this.state.present[index];
    const updatedAnnotation = {
      ...previousAnnotation,
      ...updates,
    } as Annotation;

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'update',
      annotation: updatedAnnotation,
      previousAnnotation,
      description: `Update ${updatedAnnotation.type}`,
    };

    this.pushToPast(entry);
    this.state.present = [
      ...this.state.present.slice(0, index),
      updatedAnnotation,
      ...this.state.present.slice(index + 1),
    ];
    this.clearFuture();
    this.notify();
  }

  /**
   * 모든 주석 지우기
   */
  clear(): void {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'clear',
      annotation: undefined,
      previousAnnotation: undefined,
      description: 'Clear all annotations',
    };

    this.pushToPast({
      ...entry,
      annotation: this.state.present,
    });
    this.state.present = [];
    this.clearFuture();
    this.notify();
  }

  /**
   * 실행 취소
   */
  undo(): Annotation[] | null {
    if (!this.canUndo()) return null;

    const lastEntry = this.state.past.pop()!;

    // 현재 상태를 future에 저장
    this.state.future.unshift({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: lastEntry.action,
      annotation: this.state.present,
      description: `Undo ${lastEntry.description}`,
    });

    // 이전 상태 복원
    switch (lastEntry.action) {
      case 'add':
        this.state.present = this.state.present.filter(
          a => a.id !== (lastEntry.annotation as Annotation).id
        );
        break;
      case 'remove':
        if (lastEntry.annotation) {
          this.state.present = [...this.state.present, lastEntry.annotation as Annotation];
        }
        break;
      case 'update':
        if (lastEntry.previousAnnotation) {
          const prev = lastEntry.previousAnnotation as Annotation;
          const index = this.state.present.findIndex(
            a => a.id === prev.id
          );
          if (index !== -1) {
            this.state.present = [
              ...this.state.present.slice(0, index),
              prev,
              ...this.state.present.slice(index + 1),
            ];
          }
        }
        break;
      case 'clear':
        if (Array.isArray(lastEntry.annotation)) {
          this.state.present = [...lastEntry.annotation];
        } else if (lastEntry.annotation) {
          // Fallback if valid annotation but not array? Should not happen for clear.
        }
        break;
    }

    this.notify();
    return this.getPresent();
  }

  /**
   * 재실행
   */
  redo(): Annotation[] | null {
    if (!this.canRedo()) return null;

    const nextEntry = this.state.future.shift()!;

    // 현재 상태를 past에 저장
    this.state.past.push(nextEntry);

    // 다음 상태로 전환
    switch (nextEntry.action) {
      case 'add':
        if (nextEntry.annotation) {
          this.state.present = [...this.state.present, nextEntry.annotation as Annotation];
        }
        break;
      case 'remove':
        if (nextEntry.annotation) {
          this.state.present = this.state.present.filter(
            a => a.id !== (nextEntry.annotation as Annotation).id
          );
        }
        break;
      case 'update':
        if (nextEntry.annotation) {
          const nextAnn = nextEntry.annotation as Annotation;
          const index = this.state.present.findIndex(
            a => a.id === nextAnn.id
          );
          if (index !== -1) {
            this.state.present = [
              ...this.state.present.slice(0, index),
              nextAnn,
              ...this.state.present.slice(index + 1),
            ];
          }
        }
        break;
      case 'clear':
        this.state.present = [];
        break;
    }

    this.notify();
    return this.getPresent();
  }

  /**
   * 내역 초기화
   */
  reset(): void {
    this.state = {
      past: [],
      present: [],
      future: [],
      maxSize: this.state.maxSize,
    };
    this.notify();
  }

  /**
   * 현재 상태로 설정 (새로운 기본점)
   */
  setPresent(annotations: Annotation[]): void {
    this.state = {
      past: [],
      present: annotations,
      future: [],
      maxSize: this.state.maxSize,
    };
    this.notify();
  }

  /**
   * 내역 항목 목록 가져오기
   */
  getHistory(): HistoryEntry[] {
    return [
      ...this.state.past,
      { id: 'present', timestamp: Date.now(), action: 'clear', description: 'Current state' },
      ...this.state.future,
    ];
  }

  /**
   * 특정 시점으로 이동
   */
  travelTo(entryId: string): Annotation[] | null {
    // past에서 찾기
    const pastIndex = this.state.past.findIndex(e => e.id === entryId);
    if (pastIndex !== -1) {
      // 해당 시점까지의 past만 유지
      const targetPast = this.state.past.slice(0, pastIndex + 1);
      const futureFrom = this.state.past.slice(pastIndex + 1);

      // 해당 시점의 상태 계산
      let present: Annotation[] = [];
      for (const entry of targetPast) {
        present = this.applyEntry(present, entry);
      }

      this.state.past = targetPast;
      this.state.present = present;
      this.state.future = [...futureFrom.reverse(), ...this.state.future];

      this.notify();
      return this.getPresent();
    }

    // future에서 찾기
    const futureIndex = this.state.future.findIndex(e => e.id === entryId);
    if (futureIndex !== -1) {
      // 해당 시점까지 모든 future 적용
      let present = this.state.present;
      for (let i = 0; i <= futureIndex; i++) {
        const entry = this.state.future[i];
        this.state.past.push(entry);
        present = this.applyEntry(present, entry);
      }

      this.state.present = present;
      this.state.future = this.state.future.slice(futureIndex + 1);

      this.notify();
      return this.getPresent();
    }

    return null;
  }

  /**
   * 상태 변경 리스너 등록
   */
  subscribe(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 내역 항목을 상태에 적용
   */
  private applyEntry(present: Annotation[], entry: HistoryEntry): Annotation[] {
    switch (entry.action) {
      case 'add':
        return entry.annotation && !Array.isArray(entry.annotation)
          ? [...present, entry.annotation]
          : present;
      case 'remove':
        return present.filter(a => a.id !== (entry.annotation as Annotation)?.id);
      case 'update': {
        const updateAnnotation = entry.annotation as Annotation;
        return present.map(a =>
          a.id === updateAnnotation?.id ? updateAnnotation : a
        );
      }
      case 'clear':
        return [];
      default:
        return present;
    }
  }

  /**
   * past에 항목 추가 (크기 제한)
   */
  private pushToPast(entry: HistoryEntry): void {
    this.state.past.push(entry);
    if (this.state.past.length > this.state.maxSize) {
      this.state.past.shift();
    }
  }

  /**
   * future 비우기
   */
  private clearFuture(): void {
    this.state.future = [];
  }

  /**
   * 상태 변경 알림
   */
  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

/**
 * 내역 관리자 생성
 */
export function createAnnotationHistory(maxSize: number = 50): AnnotationHistory {
  return new AnnotationHistory(maxSize);
}

/**
 * 내역 내보내기 (JSON)
 */
export function exportHistory(history: AnnotationHistory): string {
  return JSON.stringify({
    past: history['state'].past,
    present: history['state'].present,
    future: history['state'].future,
  });
}

/**
 * 내역 가져오기 (JSON)
 */
export function importHistory(json: string, maxSize: number = 50): AnnotationHistory | null {
  try {
    const data = JSON.parse(json);
    const history = new AnnotationHistory(maxSize);
    history['state'] = {
      past: data.past || [],
      present: data.present || [],
      future: data.future || [],
      maxSize,
    };
    return history;
  } catch {
    return null;
  }
}
