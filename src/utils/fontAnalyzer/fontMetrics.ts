/**
 * Font Metrics Visualization Utilities
 *
 * 폰트 메트릭스 시각화 유틸리티
 */

import type { FontMetrics, MetricsOverlayOptions } from '../../types/fontAnalyzer';
import { FONT_ANALYZER_CLASSES } from '../../constants/fontAnalyzerClasses';

/**
 * 폰트 메트릭스 오버레이 생성
 */
export function createMetricsOverlay(
  element: HTMLElement,
  options: MetricsOverlayOptions = {}
): HTMLElement {
  const {
    showAscender = true,
    showDescender = true,
    showCapHeight = true,
    showBaseline = true,
    showMedian = true,
    color = '#ff0000',
    lineWidth = 1,
  } = options;

  const overlay = document.createElement('div');
  overlay.className = FONT_ANALYZER_CLASSES.GUIDE_ASCENDER;
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 999999;
  `;

  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);

  // 메트릭스 계산
  const emHeight = fontSize;
  const capHeight = emHeight * 0.7;
  const xHeight = emHeight * 0.5;
  const ascender = emHeight * 0.8;
  const descender = emHeight * 0.2;
  const baseline = emHeight * 0.8;

  // SVG 생성
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  `;

  const offsetTop = element.offsetTop;
  const offsetLeft = element.offsetLeft;

  // Ascender 라인
  if (showAscender) {
    const line = createSvgLine(
      offsetLeft,
      offsetTop,
      offsetLeft + element.offsetWidth,
      offsetTop,
      color,
      lineWidth
    );
    line.setAttribute('class', FONT_ANALYZER_CLASSES.GUIDE_ASCENDER);
    svg.appendChild(line);

    const label = createSvgLabel(
      offsetLeft + element.offsetWidth + 5,
      offsetTop,
      'Ascender',
      color
    );
    svg.appendChild(label);
  }

  // Cap height 라인
  if (showCapHeight) {
    const capY = offsetTop + (ascender - capHeight);
    const line = createSvgLine(
      offsetLeft,
      capY,
      offsetLeft + element.offsetWidth,
      capY,
      '#00ff00',
      lineWidth
    );
    line.setAttribute('class', FONT_ANALYZER_CLASSES.GUIDE_CAP);
    svg.appendChild(line);

    const label = createSvgLabel(
      offsetLeft + element.offsetWidth + 5,
      capY,
      'Cap',
      '#00ff00'
    );
    svg.appendChild(label);
  }

  // Median 라인
  if (showMedian) {
    const medianY = offsetTop + (ascender - xHeight);
    const line = createSvgLine(
      offsetLeft,
      medianY,
      offsetLeft + element.offsetWidth,
      medianY,
      '#0000ff',
      lineWidth
    );
    svg.appendChild(line);

    const label = createSvgLabel(
      offsetLeft + element.offsetWidth + 5,
      medianY,
      'x-Height',
      '#0000ff'
    );
    svg.appendChild(label);
  }

  // Baseline 라인
  if (showBaseline) {
    const baselineY = offsetTop + baseline;
    const line = createSvgLine(
      offsetLeft,
      baselineY,
      offsetLeft + element.offsetWidth,
      baselineY,
      '#ff00ff',
      lineWidth
    );
    svg.appendChild(line);

    const label = createSvgLabel(
      offsetLeft + element.offsetWidth + 5,
      baselineY,
      'Baseline',
      '#ff00ff'
    );
    svg.appendChild(label);
  }

  // Descender 라인
  if (showDescender) {
    const descenderY = offsetTop + baseline + descender;
    const line = createSvgLine(
      offsetLeft,
      descenderY,
      offsetLeft + element.offsetWidth,
      descenderY,
      color,
      lineWidth
    );
    line.setAttribute('class', FONT_ANALYZER_CLASSES.GUIDE_DESCENDER);
    svg.appendChild(line);

    const label = createSvgLabel(
      offsetLeft + element.offsetWidth + 5,
      descenderY,
      'Descender',
      color
    );
    svg.appendChild(label);
  }

  overlay.appendChild(svg);
  return overlay;
}

/**
 * SVG 라인 생성
 */
function createSvgLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', String(width));
  line.setAttribute('stroke-dasharray', '5,5');
  return line;
}

/**
 * SVG 라벨 생성
 */
function createSvgLabel(
  x: number,
  y: number,
  text: string,
  color: string
): SVGTextElement {
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', String(x));
  label.setAttribute('y', String(y));
  label.setAttribute('fill', color);
  label.setAttribute('font-size', '10');
  label.setAttribute('font-family', 'sans-serif');
  label.textContent = text;
  return label;
}

/**
 * 요소에 메트릭스 가이드 토글
 */
export function toggleMetricsGuide(
  element: HTMLElement,
  options?: MetricsOverlayOptions
): () => void {
  const existingGuide = element.querySelector(`.${FONT_ANALYZER_CLASSES.GUIDE_ASCENDER}`);
  if (existingGuide) {
    existingGuide.remove();
    return () => {};
  }

  const guide = createMetricsOverlay(element, options);
  document.body.appendChild(guide);

  // 위치 업데이트
  const updatePosition = () => {
    const svg = guide.querySelector('svg');
    if (!svg) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // 모든 라인과 라벨 위치 업데이트
    const lines = svg.querySelectorAll('line');
    const labels = svg.querySelectorAll('text');

    // 스타일 재계산
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize);

    const emHeight = fontSize;
    const ascender = emHeight * 0.8;
    const baseline = emHeight * 0.8;

    const offsetTop = rect.top + scrollTop;
    const offsetLeft = rect.left + scrollLeft;

    // Ascender
    if (lines[0]) {
      lines[0].setAttribute('x1', String(offsetLeft));
      lines[0].setAttribute('y1', String(offsetTop));
      lines[0].setAttribute('x2', String(offsetLeft + rect.width));
      lines[0].setAttribute('y2', String(offsetTop));
    }
    if (labels[0]) {
      labels[0].setAttribute('x', String(offsetLeft + rect.width + 5));
      labels[0].setAttribute('y', String(offsetTop));
    }

    // Cap
    const capY = offsetTop + (ascender - emHeight * 0.7);
    if (lines[1]) {
      lines[1].setAttribute('x1', String(offsetLeft));
      lines[1].setAttribute('y1', String(capY));
      lines[1].setAttribute('x2', String(offsetLeft + rect.width));
      lines[1].setAttribute('y2', String(capY));
    }
    if (labels[1]) {
      labels[1].setAttribute('x', String(offsetLeft + rect.width + 5));
      labels[1].setAttribute('y', String(capY));
    }

    // Baseline
    const baselineY = offsetTop + baseline;
    if (lines[3]) {
      lines[3].setAttribute('x1', String(offsetLeft));
      lines[3].setAttribute('y1', String(baselineY));
      lines[3].setAttribute('x2', String(offsetLeft + rect.width));
      lines[3].setAttribute('y2', String(baselineY));
    }
    if (labels[3]) {
      labels[3].setAttribute('x', String(offsetLeft + rect.width + 5));
      labels[3].setAttribute('y', String(baselineY));
    }
  };

  window.addEventListener('scroll', updatePosition);
  window.addEventListener('resize', updatePosition);
  updatePosition();

  // 정리 함수
  return () => {
    window.removeEventListener('scroll', updatePosition);
    window.removeEventListener('resize', updatePosition);
    guide.remove();
  };
}

/**
 * 상세 메트릭스 정보 표시 패널 생성
 */
export function createMetricsInfoPanel(element: HTMLElement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = FONT_ANALYZER_CLASSES.METRICS_PANEL;
  panel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-size: 12px;
    z-index: 999999;
    max-width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;

  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);

  const metrics: FontMetrics = {
    emHeight: fontSize,
    ascent: fontSize * 0.8,
    descent: fontSize * 0.2,
    ascender: fontSize * 0.8,
    descender: fontSize * 0.2,
    capHeight: fontSize * 0.7,
    xHeight: fontSize * 0.5,
    unitsPerEm: 1000,
  };

  const metricsList = [
    { label: 'EM Height', value: `${metrics.emHeight.toFixed(2)}px` },
    { label: 'Cap Height', value: `${metrics.capHeight.toFixed(2)}px` },
    { label: 'X-Height', value: `${metrics.xHeight.toFixed(2)}px` },
    { label: 'Ascender', value: `${metrics.ascender.toFixed(2)}px` },
    { label: 'Descender', value: `${metrics.descender.toFixed(2)}px` },
    { label: 'Baseline', value: `${(metrics.ascender).toFixed(2)}px` },
  ];

  const title = document.createElement('h3');
  title.textContent = 'Font Metrics';
  title.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';
  panel.appendChild(title);

  for (const metric of metricsList) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px;';

    const label = document.createElement('span');
    label.textContent = metric.label + ':';
    label.style.cssText = 'color: #666;';

    const value = document.createElement('span');
    value.textContent = metric.value;
    value.style.cssText = 'font-weight: bold;';

    row.appendChild(label);
    row.appendChild(value);
    panel.appendChild(row);
  }

  return panel;
}

/**
 * 베이스라인 격자 오버레이 생성
 */
export function createBaselineGrid(
  container: HTMLElement = document.body,
  options: {
    lineColor?: string;
    lineWidth?: number;
    showLabels?: boolean;
  } = {}
): HTMLElement {
  const {
    lineColor = 'rgba(255, 0, 0, 0.3)',
    lineWidth = 1,
    showLabels = true,
  } = options;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 999998;
  `;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `
    width: 100%;
    height: 100%;
  `;
  overlay.appendChild(svg);

  // 기본 줄 높이 감지
  const firstElement = container.querySelector('p, span, div, h1, h2, h3, h4, h5, h6');
  let lineHeight = 24; // 기본값

  if (firstElement instanceof HTMLElement) {
    const computedStyle = window.getComputedStyle(firstElement);
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeightValue = computedStyle.lineHeight;
    if (lineHeightValue !== 'normal') {
      lineHeight = parseFloat(lineHeightValue) * fontSize;
    } else {
      lineHeight = fontSize * 1.5;
    }
  }

  // 격자 선 그리기
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  for (let y = 0; y < viewportHeight; y += lineHeight) {
    const line = createSvgLine(0, y, viewportWidth, y, lineColor, lineWidth);
    svg.appendChild(line);

    if (showLabels) {
      const label = createSvgLabel(10, y - 2, `${y.toFixed(0)}px`, lineColor);
      svg.appendChild(label);
    }
  }

  return overlay;
}

/**
 * 렌더링된 폰트 메트릭스 측정 (캔버스 사용)
 */
export function measureRenderedFontMetrics(
  element: HTMLElement,
  text: string = 'Hxpg'
): FontMetrics | null {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 100;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);

  ctx.font = computedStyle.font;
  ctx.textBaseline = 'alphabetic';

  // 메트릭스 측정
  const metrics = ctx.measureText(text);

  // 실제 렌더링된 높이 측정
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;

  return {
    emHeight: fontSize,
    ascent: ascent,
    descent: descent,
    ascender: ascent,
    descender: descent,
    capHeight: ascent * 0.875,
    xHeight: ascent * 0.625,
    unitsPerEm: 1000,
  };
}

/**
 * 폰트 메트릭스 비교
 */
export function compareFontMetrics(
  element1: HTMLElement,
  element2: HTMLElement
): {
  metrics1: FontMetrics | null;
  metrics2: FontMetrics | null;
  differences: {
    emHeight?: number;
    ascender?: number;
    descender?: number;
    capHeight?: number;
    xHeight?: number;
  };
} {
  const metrics1 = measureRenderedFontMetrics(element1);
  const metrics2 = measureRenderedFontMetrics(element2);

  const differences: {
    emHeight?: number;
    ascender?: number;
    descender?: number;
    capHeight?: number;
    xHeight?: number;
  } = {};

  if (metrics1 && metrics2) {
    if (metrics1.emHeight !== metrics2.emHeight) {
      differences.emHeight = metrics2.emHeight - metrics1.emHeight;
    }
    if (metrics1.ascender !== metrics2.ascender) {
      differences.ascender = metrics2.ascender - metrics1.ascender;
    }
    if (metrics1.descender !== metrics2.descender) {
      differences.descender = metrics2.descender - metrics1.descender;
    }
    if (metrics1.capHeight !== metrics2.capHeight) {
      differences.capHeight = metrics2.capHeight - metrics1.capHeight;
    }
    if (metrics1.xHeight !== metrics2.xHeight) {
      differences.xHeight = metrics2.xHeight - metrics1.xHeight;
    }
  }

  return {
    metrics1,
    metrics2,
    differences,
  };
}

/**
 * 요소의 시각적 폰트 크기 측정
 */
export function measureVisualFontSize(element: HTMLElement): {
  fontSize: number;
  actualHeight: number;
  lineHeight: number;
  actualLineHeight: number;
  renderHeight: number;
} {
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 1.5;

  const testSpan = document.createElement('span');
  testSpan.style.visibility = 'hidden';
  testSpan.style.position = 'absolute';
  testSpan.style.whiteSpace = 'nowrap';
  testSpan.textContent = 'A';

  element.appendChild(testSpan);
  const actualHeight = testSpan.offsetHeight;
  element.removeChild(testSpan);

  const renderHeight = element.offsetHeight;

  return {
    fontSize,
    actualHeight,
    lineHeight: lineHeight * fontSize,
    actualLineHeight: renderHeight,
    renderHeight,
  };
}
