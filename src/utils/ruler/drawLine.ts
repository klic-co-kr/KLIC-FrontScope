import { RULER_CLASSES } from '../../constants/classes';

/**
 * 측정선 SVG 생성
 */
export function createMeasurementLine(
  start: { x: number; y: number },
  end: { x: number; y: number },
  options: {
    color?: string;
    width?: number;
    dashed?: boolean;
    showArrows?: boolean;
  } = {}
): SVGSVGElement {
  const {
    color = '#3b82f6',
    width = 2,
    dashed = false,
    showArrows = true,
  } = options;

  // SVG 컨테이너
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add(RULER_CLASSES.LINE);

  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);

  const svgWidth = maxX - minX + 40;
  const svgHeight = maxY - minY + 40;

  svg.setAttribute('width', svgWidth.toString());
  svg.setAttribute('height', svgHeight.toString());
  svg.style.position = 'absolute';
  svg.style.left = `${minX - 20}px`;
  svg.style.top = `${minY - 20}px`;
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '10000';

  // 선
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', (start.x - minX + 20).toString());
  line.setAttribute('y1', (start.y - minY + 20).toString());
  line.setAttribute('x2', (end.x - minX + 20).toString());
  line.setAttribute('y2', (end.y - minY + 20).toString());
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', width.toString());

  if (dashed) {
    line.setAttribute('stroke-dasharray', '4 2');
  }

  svg.appendChild(line);

  // 화살표
  if (showArrows) {
    const arrow1 = createArrow(
      start.x - minX + 20,
      start.y - minY + 20,
      end.x - minX + 20,
      end.y - minY + 20,
      color,
      true
    );
    const arrow2 = createArrow(
      start.x - minX + 20,
      start.y - minY + 20,
      end.x - minX + 20,
      end.y - minY + 20,
      color,
      false
    );

    svg.appendChild(arrow1);
    svg.appendChild(arrow2);
  }

  return svg;
}

/**
 * 화살표 생성
 */
function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  atStart: boolean
): SVGPathElement {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLength = 8;
  const arrowAngle = Math.PI / 6;

  const [px, py] = atStart ? [x1, y1] : [x2, y2];
  const direction = atStart ? -1 : 1;

  const x3 = px - direction * arrowLength * Math.cos(angle - arrowAngle);
  const y3 = py - direction * arrowLength * Math.sin(angle - arrowAngle);
  const x4 = px - direction * arrowLength * Math.cos(angle + arrowAngle);
  const y4 = py - direction * arrowLength * Math.sin(angle + arrowAngle);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x3} ${y3} L ${px} ${py} L ${x4} ${y4}`);
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');

  return path;
}

/**
 * 측정선 제거
 */
export function removeMeasurementLine(line: SVGSVGElement): void {
  line.remove();
}

/**
 * 모든 측정선 제거
 */
export function removeAllMeasurementLines(): void {
  const lines = document.querySelectorAll(`.${RULER_CLASSES.LINE}`);
  lines.forEach((line) => line.remove());
}
