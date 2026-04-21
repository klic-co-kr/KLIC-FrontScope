import { RULER_CLASSES } from '../../constants/classes';
import { formatWithUnit } from './units';

/**
 * 측정값 라벨 생성
 */
export function createDimensionLabel(
  text: string,
  position: { x: number; y: number },
  options: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  } = {}
): HTMLDivElement {
  const {
    backgroundColor = '#3b82f6',
    textColor = '#ffffff',
    fontSize = 12,
  } = options;

  const label = document.createElement('div');
  label.classList.add(RULER_CLASSES.LABEL);
  label.textContent = text;

  label.style.position = 'absolute';
  label.style.left = `${position.x}px`;
  label.style.top = `${position.y}px`;
  label.style.backgroundColor = backgroundColor;
  label.style.color = textColor;
  label.style.fontSize = `${fontSize}px`;
  label.style.padding = '4px 8px';
  label.style.borderRadius = '4px';
  label.style.fontFamily = 'monospace';
  label.style.fontWeight = 'bold';
  label.style.whiteSpace = 'nowrap';
  label.style.pointerEvents = 'none';
  label.style.zIndex = '10001';
  label.style.transform = 'translate(-50%, -50%)';
  label.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

  return label;
}

/**
 * 크기 라벨 (width × height)
 */
export function createSizeLabel(
  width: number,
  height: number,
  position: { x: number; y: number },
  unit: 'px' | 'rem' | 'em' = 'px'
): HTMLDivElement {
  const widthText = formatWithUnit(width, unit, 1);
  const heightText = formatWithUnit(height, unit, 1);
  const text = `${widthText} × ${heightText}`;

  return createDimensionLabel(text, position);
}

/**
 * 거리 라벨
 */
export function createDistanceLabel(
  distance: number,
  position: { x: number; y: number },
  unit: 'px' | 'rem' | 'em' = 'px'
): HTMLDivElement {
  const text = formatWithUnit(distance, unit, 1);

  return createDimensionLabel(text, position);
}

/**
 * 각도 라벨
 */
export function createAngleLabel(
  angleRadians: number,
  position: { x: number; y: number }
): HTMLDivElement {
  const degrees = angleRadians * (180 / Math.PI);
  const text = `${degrees.toFixed(1)}°`;

  return createDimensionLabel(text, position, {
    backgroundColor: '#a855f7',
  });
}

/**
 * 종횡비 라벨
 */
export function createAspectRatioLabel(
  aspectRatio: { ratio: string; common?: string },
  position: { x: number; y: number }
): HTMLDivElement {
  const text = aspectRatio.common || aspectRatio.ratio;

  return createDimensionLabel(text, position, {
    backgroundColor: '#10b981',
  });
}

/**
 * 라벨 제거
 */
export function removeLabel(label: HTMLDivElement): void {
  label.remove();
}

/**
 * 모든 라벨 제거
 */
export function removeAllLabels(): void {
  const labels = document.querySelectorAll(`.${RULER_CLASSES.LABEL}`);
  labels.forEach((label) => label.remove());
}
