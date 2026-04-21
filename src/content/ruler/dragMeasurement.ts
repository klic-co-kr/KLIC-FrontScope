import { measureDistance } from '../../utils/ruler/measureDistance';
import { createMeasurementLine } from '../../utils/ruler/drawLine';
import { createDistanceLabel } from '../../utils/ruler/drawLabel';
import { snapPoint } from '../../utils/ruler/retina';
import { safeSendMessage } from '../utils/safeMessage';

let isDragging = false;
let startPoint: { x: number; y: number } | null = null;
let currentLine: SVGSVGElement | null = null;
let currentLabel: HTMLDivElement | null = null;

/**
 * 드래그 측정 초기화
 */
export function initDragMeasurement() {
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

/**
 * 드래그 측정 정리
 */
export function cleanupDragMeasurement() {
  document.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  clearCurrentMeasurement();
}

/**
 * 마우스 다운 핸들러
 */
function handleMouseDown(event: MouseEvent) {
  if (event.button !== 0) return; // 좌클릭만

  startPoint = snapPoint({
    x: event.clientX,
    y: event.clientY,
  });

  isDragging = true;
}

/**
 * 마우스 이동 핸들러
 */
function handleMouseMove(event: MouseEvent) {
  if (!isDragging || !startPoint) return;

  const currentPoint = snapPoint({
    x: event.clientX,
    y: event.clientY,
  });

  updateMeasurement(startPoint, currentPoint);
}

/**
 * 마우스 업 핸들러
 */
function handleMouseUp(event: MouseEvent) {
  if (!isDragging || !startPoint) return;

  const endPoint = snapPoint({
    x: event.clientX,
    y: event.clientY,
  });

  finalizeMeasurement(startPoint, endPoint);

  isDragging = false;
  startPoint = null;
}

/**
 * 측정 업데이트 (실시간)
 */
function updateMeasurement(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  // 이전 측정 제거
  clearCurrentMeasurement();

  // 거리 계산
  const distance = measureDistance(start, end);

  // 선 그리기
  currentLine = createMeasurementLine(start, end, {
    color: '#3b82f6',
    width: 2,
    showArrows: true,
  });
  document.body.appendChild(currentLine);

  // 라벨 그리기
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  currentLabel = createDistanceLabel(distance.diagonal, midPoint);
  document.body.appendChild(currentLabel);
}

/**
 * 측정 확정
 */
function finalizeMeasurement(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const distance = measureDistance(start, end);

  // Side Panel에 저장
  safeSendMessage({
    action: 'RULER_SAVE_MEASUREMENT',
    data: {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'distance',
      distance: {
        start,
        end,
        result: distance,
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
}

/**
 * 현재 측정 클리어
 */
function clearCurrentMeasurement() {
  if (currentLine) {
    currentLine.remove();
    currentLine = null;
  }

  if (currentLabel) {
    currentLabel.remove();
    currentLabel = null;
  }
}
