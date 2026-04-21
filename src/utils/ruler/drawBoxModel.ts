import { RULER_CLASSES } from '../../constants/classes';
import { RULER_COLORS } from '../../constants/defaults';
import { getBoxModel, getBoxModelRects } from './boxModel';

/**
 * Box Model 오버레이 생성
 */
export function createBoxModelOverlay(element: HTMLElement): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.classList.add(RULER_CLASSES.BOX_MODEL);
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '9999';

  const rects = getBoxModelRects(element);

  // Margin
  const marginBox = createBoxLayer(rects.margin, RULER_COLORS.MARGIN, 0.2);
  overlay.appendChild(marginBox);

  // Border
  const borderBox = createBoxLayer(rects.border, RULER_COLORS.BORDER, 0.2);
  overlay.appendChild(borderBox);

  // Padding
  const paddingBox = createBoxLayer(rects.padding, RULER_COLORS.PADDING, 0.2);
  overlay.appendChild(paddingBox);

  // Content
  const contentBox = createBoxLayer(rects.content, RULER_COLORS.CONTENT, 0.2);
  overlay.appendChild(contentBox);

  // 라벨
  const labels = createBoxModelLabels(element, rects);
  labels.forEach((label) => overlay.appendChild(label));

  return overlay;
}

/**
 * Box Model 레이어 생성
 */
function createBoxLayer(
  rect: DOMRect,
  color: string,
  opacity: number
): HTMLDivElement {
  const layer = document.createElement('div');
  layer.style.position = 'absolute';
  layer.style.left = `${rect.left}px`;
  layer.style.top = `${rect.top}px`;
  layer.style.width = `${rect.width}px`;
  layer.style.height = `${rect.height}px`;
  layer.style.backgroundColor = color;
  layer.style.opacity = opacity.toString();
  layer.style.border = `1px solid ${color}`;

  return layer;
}

/**
 * Box Model 라벨 생성
 */
function createBoxModelLabels(
  element: HTMLElement,
  rects: ReturnType<typeof getBoxModelRects>
): HTMLDivElement[] {
  const boxModel = getBoxModel(element);
  const labels: HTMLDivElement[] = [];

  // Content 크기
  const contentLabel = createLabel(
    `${Math.round(rects.content.width)} × ${Math.round(rects.content.height)}`,
    {
      x: rects.content.left + rects.content.width / 2,
      y: rects.content.top + rects.content.height / 2,
    },
    RULER_COLORS.CONTENT
  );
  labels.push(contentLabel);

  // Padding
  if (boxModel.padding.top > 0) {
    const paddingTopLabel = createLabel(
      `padding: ${boxModel.padding.top}px`,
      {
        x: rects.padding.left + rects.padding.width / 2,
        y: rects.padding.top + boxModel.padding.top / 2,
      },
      RULER_COLORS.PADDING
    );
    labels.push(paddingTopLabel);
  }

  // Border
  if (boxModel.border.top > 0) {
    const borderTopLabel = createLabel(
      `border: ${boxModel.border.top}px`,
      {
        x: rects.border.left + rects.border.width / 2,
        y: rects.border.top + boxModel.border.top / 2,
      },
      RULER_COLORS.BORDER
    );
    labels.push(borderTopLabel);
  }

  // Margin
  if (boxModel.margin.top > 0) {
    const marginTopLabel = createLabel(
      `margin: ${boxModel.margin.top}px`,
      {
        x: rects.margin.left + rects.margin.width / 2,
        y: rects.margin.top + boxModel.margin.top / 2,
      },
      RULER_COLORS.MARGIN
    );
    labels.push(marginTopLabel);
  }

  return labels;
}

/**
 * 라벨 헬퍼
 */
function createLabel(
  text: string,
  position: { x: number; y: number },
  color: string
): HTMLDivElement {
  const label = document.createElement('div');
  label.textContent = text;
  label.style.position = 'absolute';
  label.style.left = `${position.x}px`;
  label.style.top = `${position.y}px`;
  label.style.transform = 'translate(-50%, -50%)';
  label.style.backgroundColor = color;
  label.style.color = '#ffffff';
  label.style.padding = '2px 6px';
  label.style.borderRadius = '3px';
  label.style.fontSize = '11px';
  label.style.fontFamily = 'monospace';
  label.style.whiteSpace = 'nowrap';
  label.style.pointerEvents = 'none';

  return label;
}

/**
 * Box Model 오버레이 제거
 */
export function removeBoxModelOverlay(): void {
  const overlays = document.querySelectorAll(`.${RULER_CLASSES.BOX_MODEL}`);
  overlays.forEach((overlay) => overlay.remove());
}
