import { removeAllMeasurementLines } from './drawLine';
import { removeAllLabels } from './drawLabel';
import { removeBoxModelOverlay } from './drawBoxModel';
import { removeAllHighlights } from './highlight';

/**
 * 모든 오버레이 제거
 */
export function clearAllOverlays(): void {
  removeAllMeasurementLines();
  removeAllLabels();
  removeBoxModelOverlay();
  removeAllHighlights();
}

/**
 * 측정 오버레이만 제거
 */
export function clearMeasurementOverlays(): void {
  removeAllMeasurementLines();
  removeAllLabels();
}

/**
 * Box Model 오버레이만 제거
 */
export function clearBoxModelOverlays(): void {
  removeBoxModelOverlay();
}

/**
 * 오버레이 컨테이너 생성
 */
export function createOverlayContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'klic-ruler-overlay-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9998';

  document.body.appendChild(container);

  return container;
}

/**
 * 오버레이 컨테이너 제거
 */
export function removeOverlayContainer(): void {
  const container = document.getElementById('klic-ruler-overlay-container');

  if (container) {
    container.remove();
  }
}
