/**
 * Annotation Manager
 *
 * 주석 관리 유틸리티
 */

import type {
  Annotation,
  ArrowAnnotation,
  TextAnnotation,
  ShapeAnnotation,
  // Point,
} from '../../../types/screenshot';
import { drawArrow } from './drawing'; // Removed drawDoubleArrow
import { drawTextBox } from './textAnnotation';
import { drawShape } from './shapeAnnotation';

/**
 * 주석 관리자 상태
 */
export interface AnnotationManagerState {
  annotations: Annotation[];
  selectedId: string | null;
  isDrawing: boolean;
  currentType: Annotation['type'] | null;
}

/**
 * 주석 관리자 클래스
 */
export class AnnotationManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImage: HTMLCanvasElement | HTMLImageElement;
  private state: AnnotationManagerState;

  constructor(
    canvas: HTMLCanvasElement,
    originalImage: HTMLCanvasElement | string
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    // 원본 이미지 저장
    if (typeof originalImage === 'string') {
      this.originalImage = this.createImageFromUrl(originalImage);
    } else {
      this.originalImage = originalImage;
    }

    this.state = {
      annotations: [],
      selectedId: null,
      isDrawing: false,
      currentType: null,
    };
  }

  /**
   * 주석 추가
   */
  addAnnotation(annotation: Annotation): void {
    this.state.annotations.push(annotation);
    this.render();
  }

  /**
   * 주석 제거
   */
  removeAnnotation(id: string): void {
    this.state.annotations = this.state.annotations.filter(a => a.id !== id);
    if (this.state.selectedId === id) {
      this.state.selectedId = null;
    }
    this.render();
  }

  /**
   * 주석 업데이트
   */
  updateAnnotation(id: string, updates: Partial<Annotation>): void {
    const index = this.state.annotations.findIndex(a => a.id === id);
    if (index !== -1) {
      this.state.annotations[index] = {
        ...this.state.annotations[index],
        ...updates,
      } as Annotation;
      this.render();
    }
  }

  /**
   * 주석 선택
   */
  selectAnnotation(id: string | null): void {
    this.state.selectedId = id;
    this.render();
  }

  /**
   * 선택된 주석 가져오기
   */
  getSelectedAnnotation(): Annotation | null {
    if (!this.state.selectedId) return null;
    return (
      this.state.annotations.find(a => a.id === this.state.selectedId) || null
    );
  }

  /**
   * 모든 주석 가져오기
   */
  getAnnotations(): Annotation[] {
    return [...this.state.annotations];
  }

  /**
   * 주석 지우기
   */
  clearAnnotations(): void {
    this.state.annotations = [];
    this.state.selectedId = null;
    this.render();
  }

  /**
   * 렌더링
   */
  render(): void {
    // 원본 이미지 그리기
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    // 주석 그리기
    for (const annotation of this.state.annotations) {
      this.drawAnnotation(annotation);

      // 선택된 주석에 하이라이트
      if (annotation.id === this.state.selectedId) {
        this.drawSelectionHighlight(annotation);
      }
    }
  }

  /**
   * 개별 주석 그리기
   */
  private drawAnnotation(annotation: Annotation): void {
    switch (annotation.type) {
      case 'arrow':
        this.drawArrowAnnotation(annotation as ArrowAnnotation);
        break;
      case 'text':
        this.drawTextAnnotation(annotation as TextAnnotation);
        break;
      case 'shape':
        this.drawShapeAnnotation(annotation as ShapeAnnotation);
        break;
    }
  }

  /**
   * 화살표 주석 그리기
   */
  private drawArrowAnnotation(annotation: ArrowAnnotation): void {
    const { start, end, style } = annotation.data;

    drawArrow(this.ctx, start, end, {
      color: style.color,
      width: style.width,
    });
  }

  /**
   * 텍스트 주석 그리기
   */
  private drawTextAnnotation(annotation: TextAnnotation): void {
    drawTextBox(this.ctx, annotation);
  }

  /**
   * 도형 주석 그리기
   */
  private drawShapeAnnotation(annotation: ShapeAnnotation): void {
    drawShape(this.ctx, annotation);
  }

  /**
   * 선택 하이라이트 그리기
   */
  private drawSelectionHighlight(annotation: Annotation): void {
    const bounds = this.getAnnotationBounds(annotation);
    if (!bounds) return;

    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10
    );
    this.ctx.setLineDash([]);
  }

  /**
   * 주석 영역 계산
   */
  private getAnnotationBounds(annotation: Annotation): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
    switch (annotation.type) {
      case 'arrow': {
        const arrow = annotation as ArrowAnnotation;
        const { start, end } = arrow.data;
        const minX = Math.min(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxX = Math.max(start.x, end.x);
        const maxY = Math.max(start.y, end.y);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      case 'text': {
        const text = annotation as TextAnnotation;
        return { x: text.data.position.x, y: text.data.position.y, width: 100, height: 30 };
      }
      case 'shape': {
        const shape = annotation as ShapeAnnotation;
        const { points } = shape.data;
        if (!points || points.length < 2) return null;
        const xs = points.map((p: { x: number }) => p.x);
        const ys = points.map((p: { y: number }) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      default:
        return null;
    }
  }

  /**
   * Data URL을 Canvas로 변환
   */
  private createImageFromUrl(url: string): HTMLImageElement {
    const img = new Image();
    img.src = url;
    return img;
  }

  /**
   * 결과를 Data URL로 내보내기
   */
  toDataURL(format: string = 'image/png', quality: number = 1): string {
    return this.canvas.toDataURL(format, quality);
  }

  /**
   * 결과를 Blob으로 내보내기
   */
  async toBlob(
    format: string = 'image/png',
    quality: number = 1
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        format,
        quality
      );
    });
  }

  /**
   * 주석 순서 변경
   */
  reorderAnnotation(id: string, newIndex: number): void {
    const index = this.state.annotations.findIndex(a => a.id === id);
    if (index !== -1) {
      const [annotation] = this.state.annotations.splice(index, 1);
      this.state.annotations.splice(newIndex, 0, annotation);
      this.render();
    }
  }

  /**
   * 주석 그룹화
   */
  groupAnnotations(ids: string[], groupId: string): void {
    // 그룹화 로직 (확장 가능)
    for (const id of ids) {
      this.updateAnnotation(id, { groupId } as Partial<Annotation>);
    }
  }

  /**
   * 그룹 해제
   */
  ungroupAnnotations(groupId: string): void {
    for (const annotation of this.state.annotations) {
      if (annotation.groupId === groupId) {
        this.updateAnnotation(annotation.id, { groupId: undefined } as Partial<Annotation>);
      }
    }
  }
}

/**
 * 빈 주석 관리자 생성
 */
export function createAnnotationManager(
  canvas: HTMLCanvasElement,
  originalImage: HTMLCanvasElement | string
): AnnotationManager {
  return new AnnotationManager(canvas, originalImage);
}
