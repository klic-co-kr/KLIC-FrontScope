/**
 * Annotation Renderer
 *
 * 주석 렌더러 유틸리티
 */

import type { Annotation, Point, ArrowAnnotation, TextAnnotation, ShapeAnnotation } from '../../../types/screenshot';

/**
 * 렌더러 옵션
 */
export interface RendererOptions {
  showSelection?: boolean;
  showHandles?: boolean;
  handleSize?: number;
  selectionColor?: string;
}

/**
 * 주석 렌더러
 */
export class AnnotationRenderer {
  private ctx: CanvasRenderingContext2D;
  private options: RendererOptions;

  constructor(
    ctx: CanvasRenderingContext2D,
    options: RendererOptions = {}
  ) {
    this.ctx = ctx;
    this.options = {
      showSelection: true,
      showHandles: true,
      handleSize: 8,
      selectionColor: '#3b82f6',
      ...options,
    };
  }

  /**
   * 캔버스 레이어 생성
   */
  static createLayers(
    container: HTMLElement,
    width: number,
    height: number
  ): {
    base: HTMLCanvasElement;
    annotation: HTMLCanvasElement;
    overlay: HTMLCanvasElement;
  } {
    const layers = {
      base: document.createElement('canvas'),
      annotation: document.createElement('canvas'),
      overlay: document.createElement('canvas'),
    };

    for (const layer of Object.values(layers)) {
      layer.width = width;
      layer.height = height;
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
    }

    layers.base.style.zIndex = '1';
    layers.annotation.style.zIndex = '2';
    layers.overlay.style.zIndex = '3';

    container.appendChild(layers.base);
    container.appendChild(layers.annotation);
    container.appendChild(layers.overlay);

    return layers;
  }

  /**
   * 주석 레이어에 주석 그리기
   */
  renderAnnotations(
    ctx: CanvasRenderingContext2D,
    annotations: Annotation[],
    selectedId?: string | null
  ): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const annotation of annotations) {
      this.renderSingleAnnotation(ctx, annotation);

      if (selectedId && annotation.id === selectedId) {
        this.renderSelection(ctx, annotation);
      }
    }
  }

  /**
   * 개별 주석 렌더링
   */
  private renderSingleAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation
  ): void {
    ctx.save();

    switch (annotation.type) {
      case 'arrow':
        this.renderArrow(ctx, annotation);
        break;
      case 'text':
        this.renderText(ctx, annotation);
        break;
      case 'shape':
        this.renderShape(ctx, annotation);
        break;
    }

    ctx.restore();
  }

  /**
   * 화살표 렌더링
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private renderArrow(_ctx: CanvasRenderingContext2D, _annotation: ArrowAnnotation): void {
    // Arrow 렌더링 로직 (drawing.ts에서 가져온 함수 사용)
    // 이 부분은 drawing.ts의 함수를 활용
  }

  /**
   * 텍스트 렌더링
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private renderText(_ctx: CanvasRenderingContext2D, _annotation: TextAnnotation): void {
    // Text 렌더링 로직
    // textAnnotation.ts의 함수 활용
  }

  /**
   * 도형 렌더링
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private renderShape(_ctx: CanvasRenderingContext2D, _annotation: ShapeAnnotation): void {
    // Shape 렌더링 로직
    // shapeAnnotation.ts의 함수 활용
  }

  /**
   * 선택 상태 렌더링
   */
  private renderSelection(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation
  ): void {
    const bounds = this.calculateBounds(annotation);
    if (!bounds) return;

    ctx.save();
    ctx.strokeStyle = this.options.selectionColor!;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10
    );

    if (this.options.showHandles!) {
      this.drawHandles(ctx, bounds);
    }

    ctx.restore();
  }

  /**
   * 핸들 그리기
   */
  private drawHandles(
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    const size = this.options.handleSize!;
    const handles = this.getHandlePositions(bounds, size);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = this.options.selectionColor!;
    ctx.lineWidth = 2;

    for (const handle of handles) {
      ctx.fillRect(handle.x, handle.y, size, size);
      ctx.strokeRect(handle.x, handle.y, size, size);
    }
  }

  /**
   * 핸들 위치 계산
   */
  private getHandlePositions(
    bounds: { x: number; y: number; width: number; height: number },
    size: number
  ): Point[] {
    const { x, y, width, height } = bounds;
    const offset = size / 2;

    return [
      { x: x - offset, y: y - offset }, // 좌상단
      { x: x + width / 2 - offset, y: y - offset }, // 상단
      { x: x + width - offset, y: y - offset }, // 우상단
      { x: x + width - offset, y: y + height / 2 - offset }, // 우측
      { x: x + width - offset, y: y + height - offset }, // 우하단
      { x: x + width / 2 - offset, y: y + height - offset }, // 하단
      { x: x - offset, y: y + height - offset }, // 좌하단
      { x: x - offset, y: y + height / 2 - offset }, // 좌측
    ];
  }

  /**
   * 주석 영역 계산
   */
  private calculateBounds(
    annotation: Annotation
  ): { x: number; y: number; width: number; height: number } | null {
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
        const { position } = text.data;
        return { x: position.x, y: position.y, width: 100, height: 30 };
      }
      case 'shape': {
        const shape = annotation as ShapeAnnotation;
        const { points } = shape.data;
        if (!points || points.length < 2) return null;
        const xs = points.map((p: Point) => p.x);
        const ys = points.map((p: Point) => p.y);
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
}

/**
 * 캔버스 컨테이너 생성
 */
export function createAnnotationContainer(
  width: number,
  height: number
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: relative;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
  `;
  return container;
}

/**
 * 레이어 업데이트
 */
export function updateLayerSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  if (canvas.width !== width || canvas.height !== height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx && tempCtx) {
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }
}

/**
 * 합성 이미지 생성 (모든 레이어)
 */
export function mergeLayers(
  baseCanvas: HTMLCanvasElement,
  annotationCanvas: HTMLCanvasElement,
  overlayCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const merged = document.createElement('canvas');
  merged.width = baseCanvas.width;
  merged.height = baseCanvas.height;
  const ctx = merged.getContext('2d');

  if (ctx) {
    ctx.drawImage(baseCanvas, 0, 0);
    ctx.drawImage(annotationCanvas, 0, 0);
    if (overlayCanvas) {
      ctx.drawImage(overlayCanvas, 0, 0);
    }
  }

  return merged;
}
