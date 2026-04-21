import { measureElement } from '../../utils/ruler/measureElement';
import { getBoxModel } from '../../utils/ruler/boxModel';
import { createSizeLabel } from '../../utils/ruler/drawLabel';
import { createBoxModelOverlay } from '../../utils/ruler/drawBoxModel';
import { highlightElement, removeHighlight } from '../../utils/ruler/highlight';
import { getSelector } from '../../utils/dom/selectorGenerator';
import { safeSendMessage } from '../utils/safeMessage';

/**
 * 요소 선택 및 측정
 */
export function measureElementOnClick(element: HTMLElement) {
  // 측정
  const dimensions = measureElement(element);
  const boxModel = getBoxModel(element);
  const rect = element.getBoundingClientRect();
  const selector = getSelector(element);

  // 하이라이트
  highlightElement(element, 'measured');

  // 크기 라벨
  const label = createSizeLabel(
    dimensions.width,
    dimensions.height,
    {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  );
  document.body.appendChild(label);

  // Box Model 오버레이
  const overlay = createBoxModelOverlay(element);
  document.body.appendChild(overlay);

  // Side Panel에 저장
  safeSendMessage({
    action: 'RULER_SAVE_MEASUREMENT',
    data: {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'element',
      element: {
        selector,
        dimensions,
        boxModel,
        position: {
          x: rect.left,
          y: rect.top,
        },
      },
      metadata: {
        pageUrl: window.location.href,
        pageTitle: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        devicePixelRatio: window.devicePixelRatio,
      },
    },
  });

  // 3초 후 하이라이트 제거
  setTimeout(() => {
    removeHighlight(element, 'measured');
  }, 3000);
}
