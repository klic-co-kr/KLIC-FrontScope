/**
 * Box Model Utilities
 *
 * CSS 박스 모델 분석 유틸리티
 */

import type { BoxModel } from '../../types/cssScan';
import { BOX_MODEL_COLORS } from '../../constants/cssScanDefaults';

/**
 * 박스 모델 정보 추출
 */
export function extractBoxModel(element: HTMLElement): BoxModel {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);

  // 오프셋
  const offset = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
  };

  // 콘텐츠 크기
  const content = {
    width: rect.width,
    height: rect.height,
  };

  // 패딩
  const padding = {
    top: parseSize(styles.paddingTop),
    right: parseSize(styles.paddingRight),
    bottom: parseSize(styles.paddingBottom),
    left: parseSize(styles.paddingLeft),
  };

  // 보더
  const border = {
    top: parseSize(styles.borderTopWidth),
    right: parseSize(styles.borderRightWidth),
    bottom: parseSize(styles.borderBottomWidth),
    left: parseSize(styles.borderLeftWidth),
  };

  // 마진
  const margin = {
    top: parseSize(styles.marginTop),
    right: parseSize(styles.marginRight),
    bottom: parseSize(styles.marginBottom),
    left: parseSize(styles.marginLeft),
  };

  return {
    content,
    padding,
    border,
    margin,
    offset,
  };
}

/**
 * 크기 값 파싱
 */
function parseSize(value: string): number {
  return parseFloat(value) || 0;
}

/**
 * 박스 모델 오버레이 생성
 */
export function createBoxModelOverlay(
  element: HTMLElement,
  container: HTMLElement
): {
  overlay: HTMLElement;
  update: () => void;
  remove: () => void;
} {
  const boxModel = extractBoxModel(element);

  // 오버레이 컨테이너
  const overlay = document.createElement('div');
  overlay.className = 'css-scan-box-model-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;

  // 박스 모델 레이어
  const layers = [
    {
      name: 'margin',
      color: BOX_MODEL_COLORS.margin,
      getRect: () => ({
        top: boxModel.offset.top - boxModel.margin.top,
        left: boxModel.offset.left - boxModel.margin.left,
        width: boxModel.content.width + boxModel.padding.left + boxModel.padding.right + boxModel.border.left + boxModel.border.right + boxModel.margin.left + boxModel.margin.right,
        height: boxModel.content.height + boxModel.padding.top + boxModel.padding.bottom + boxModel.border.top + boxModel.border.bottom + boxModel.margin.top + boxModel.margin.bottom,
      }),
    },
    {
      name: 'border',
      color: BOX_MODEL_COLORS.border,
      getRect: () => ({
        top: boxModel.offset.top,
        left: boxModel.offset.left,
        width: boxModel.content.width + boxModel.padding.left + boxModel.padding.right + boxModel.border.left + boxModel.border.right,
        height: boxModel.content.height + boxModel.padding.top + boxModel.padding.bottom + boxModel.border.top + boxModel.border.bottom,
      }),
    },
    {
      name: 'padding',
      color: BOX_MODEL_COLORS.padding,
      getRect: () => ({
        top: boxModel.offset.top + boxModel.border.top,
        left: boxModel.offset.left + boxModel.border.left,
        width: boxModel.content.width + boxModel.padding.left + boxModel.padding.right,
        height: boxModel.content.height + boxModel.padding.top + boxModel.padding.bottom,
      }),
    },
    {
      name: 'content',
      color: BOX_MODEL_COLORS.content,
      getRect: () => ({
        top: boxModel.offset.top + boxModel.border.top + boxModel.padding.top,
        left: boxModel.offset.left + boxModel.border.left + boxModel.padding.left,
        width: boxModel.content.width,
        height: boxModel.content.height,
      }),
    },
  ];

  // 레이어 생성
  for (const layer of layers) {
    const rect = layer.getRect();
    const box = document.createElement('div');
    box.className = `css-scan-box-${layer.name}`;
    box.dataset.layer = layer.name;
    box.style.cssText = `
      position: absolute;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background-color: ${layer.color}33;
      border: 1px solid ${layer.color};
      box-sizing: border-box;
    `;
    overlay.appendChild(box);

    // 라벨 추가
    const label = document.createElement('div');
    label.className = `css-scan-box-${layer.name}-label`;
    label.textContent = `${layer.name}: ${getLabelSize(layer.name, boxModel)}`;
    label.style.cssText = `
      position: absolute;
      top: ${rect.top}px;
      left: ${rect.left + rect.width + 5}px;
      background: ${layer.color};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-family: monospace;
      white-space: nowrap;
    `;
    overlay.appendChild(label);
  }

  container.appendChild(overlay);

  return {
    overlay,
    update: () => {
      const newBoxModel = extractBoxModel(element);
      updateBoxModelOverlay(newBoxModel, overlay);
    },
    remove: () => {
      overlay.remove();
    },
  };
}

/**
 * 라벨 크기 가져오기
 */
function getLabelSize(layer: string, boxModel: BoxModel): string {
  switch (layer) {
    case 'content':
      return `${Math.round(boxModel.content.width)} × ${Math.round(boxModel.content.height)}`;
    case 'padding':
      return `${boxModel.padding.top} ${boxModel.padding.right} ${boxModel.padding.bottom} ${boxModel.padding.left}`;
    case 'border':
      return `${boxModel.border.top} ${boxModel.border.right} ${boxModel.border.bottom} ${boxModel.border.left}`;
    case 'margin':
      return `${boxModel.margin.top} ${boxModel.margin.right} ${boxModel.margin.bottom} ${boxModel.margin.left}`;
    default:
      return '';
  }
}

/**
 * 박스 모델 오버레이 업데이트
 */
function updateBoxModelOverlay(boxModel: BoxModel, overlay: HTMLElement): void {
  const layers = overlay.querySelectorAll('[data-layer]');

  for (const layer of layers) {
    const htmlElement = layer as HTMLElement;
    const name = htmlElement.dataset.layer;
    if (!name) continue;

    let rect;
    switch (name) {
      case 'margin':
        rect = {
          top: boxModel.offset.top - boxModel.margin.top,
          left: boxModel.offset.left - boxModel.margin.left,
          width: boxModel.content.width + boxModel.padding.left + boxModel.padding.right + boxModel.border.left + boxModel.border.right + boxModel.margin.left + boxModel.margin.right,
          height: boxModel.content.height + boxModel.padding.top + boxModel.padding.bottom + boxModel.border.top + boxModel.border.bottom + boxModel.margin.top + boxModel.margin.bottom,
        };
        break;
      case 'border':
        rect = {
          top: boxModel.offset.top,
          left: boxModel.offset.left,
          width: boxModel.content.width + boxModel.padding.left + boxModel.padding.right + boxModel.border.left + boxModel.border.right,
          height: boxModel.content.height + boxModel.padding.top + boxModel.padding.bottom + boxModel.border.top + boxModel.border.bottom,
        };
        break;
      case 'padding':
        rect = {
          top: boxModel.offset.top + boxModel.border.top,
          left: boxModel.offset.left + boxModel.border.left,
          width: boxModel.content.width + boxModel.padding.left + boxModel.padding.right,
          height: boxModel.content.height + boxModel.padding.top + boxModel.padding.bottom,
        };
        break;
      case 'content':
        rect = {
          top: boxModel.offset.top + boxModel.border.top + boxModel.padding.top,
          left: boxModel.offset.left + boxModel.border.left + boxModel.padding.left,
          width: boxModel.content.width,
          height: boxModel.content.height,
        };
        break;
    }

    if (rect) {
      (layer as HTMLElement).style.top = `${rect.top}px`;
      (layer as HTMLElement).style.left = `${rect.left}px`;
      (layer as HTMLElement).style.width = `${rect.width}px`;
      (layer as HTMLElement).style.height = `${rect.height}px`;
    }
  }

  // 라벨 업데이트
  const labels = overlay.querySelectorAll('[class*="-label"]');
  for (const label of labels) {
    const htmlLabel = label as HTMLElement;
    const className = Array.from(htmlLabel.classList).find(c => c.endsWith('-label'));
    if (className) {
      const layerName = className.replace('-label', '').replace('css-scan-box-', '');
      label.textContent = `${layerName}: ${getLabelSize(layerName, boxModel)}`;
    }
  }
}

/**
 * 박스 모델 정보를 CSS로 내보내기
 */
export function boxModelToCSS(boxModel: BoxModel): string {
  const parts = [];

  if (boxModel.margin.top || boxModel.margin.right || boxModel.margin.bottom || boxModel.margin.left) {
    parts.push(`margin: ${boxModel.margin.top}px ${boxModel.margin.right}px ${boxModel.margin.bottom}px ${boxModel.margin.left}px;`);
  }

  if (boxModel.padding.top || boxModel.padding.right || boxModel.padding.bottom || boxModel.padding.left) {
    parts.push(`padding: ${boxModel.padding.top}px ${boxModel.padding.right}px ${boxModel.padding.bottom}px ${boxModel.padding.left}px;`);
  }

  if (boxModel.border.top || boxModel.border.right || boxModel.border.bottom || boxModel.border.left) {
    parts.push(`border-width: ${boxModel.border.top}px ${boxModel.border.right}px ${boxModel.border.bottom}px ${boxModel.border.left}px;`);
  }

  if (boxModel.content.width) {
    parts.push(`width: ${boxModel.content.width}px;`);
  }

  if (boxModel.content.height) {
    parts.push(`height: ${boxModel.content.height}px;`);
  }

  return parts.join('\n');
}

/**
 * 요소 간 박스 모델 비교
 */
export function compareBoxModels(
  element1: HTMLElement,
  element2: HTMLElement
): {
  element1: BoxModel;
  element2: BoxModel;
  differences: Array<{
    property: string;
    value1: number;
    value2: number;
  }>;
} {
  const box1 = extractBoxModel(element1);
  const box2 = extractBoxModel(element2);

  const differences: Array<{
    property: string;
    value1: number;
    value2: number;
  }> = [];

  const compare = (obj1: Record<string, unknown>, obj2: Record<string, unknown>, prefix: string = '') => {
    for (const key of Object.keys(obj1)) {
      if (typeof obj1[key] === 'number' && typeof obj2[key] === 'number') {
        if (obj1[key] !== obj2[key]) {
          differences.push({
            property: prefix + key,
            value1: obj1[key],
            value2: obj2[key],
          });
        }
      } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object' && obj1[key] !== null && obj2[key] !== null) {
        compare(obj1[key] as Record<string, unknown>, obj2[key] as Record<string, unknown>, prefix + key + '.');
      }
    }
  };

  compare(box1 as unknown as Record<string, unknown>, box2 as unknown as Record<string, unknown>);

  return {
    element1: box1,
    element2: box2,
    differences,
  };
}
