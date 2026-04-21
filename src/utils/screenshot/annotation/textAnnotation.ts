/**
 * Text Annotation Utilities
 *
 * 텍스트 주석 유틸리티
 */

import type { Point, TextAnnotation } from '../../../types/screenshot';

/**
 * 텍스트 측정
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    maxWidth?: number;
  } = {}
): { width: number; height: number } {
  const { fontSize = 16, fontFamily = 'Arial, sans-serif', maxWidth } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);

  let width = metrics.width;
  let height = fontSize;

  // maxWidth가 지정된 경우 텍스트 줄바꿈 고려
  if (maxWidth && width > maxWidth) {
    const lines = wrapText(ctx, text, maxWidth);
    width = maxWidth;
    height = lines.length * fontSize * 1.2;
  }

  return { width, height };
}

/**
 * 텍스트 줄바꿈
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * 텍스트 그리기
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Point,
  options: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    backgroundColor?: string;
    padding?: number;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): void {
  const {
    color = '#ffffff',
    fontSize = 16,
    fontFamily = 'Arial, sans-serif',
    backgroundColor = 'rgba(0, 0, 0, 0.7)',
    padding = 8,
    maxWidth,
    align = 'left',
  } = options;

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  let lines: string[];
  let lineWidth: number;

  if (maxWidth) {
    lines = wrapText(ctx, text, maxWidth);
    lineWidth = maxWidth;
  } else {
    lines = [text];
    lineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  }

  const lineHeight = fontSize * 1.2;
  const totalWidth = lineWidth + padding * 2;
  const totalHeight = lines.length * lineHeight + padding * 2;

  // 배경 그리기
  let x = position.x;
  const y = position.y;

  if (align === 'center') {
    x -= totalWidth / 2;
  } else if (align === 'right') {
    x -= totalWidth;
  }

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, totalWidth, totalHeight);
  }

  // 텍스트 그리기
  ctx.fillStyle = color;

  for (let line = 0; line < lines.length; line++) {
    let textX = x + padding;
    const textY = y + padding + line * lineHeight;

    if (align === 'center') {
      const textWidth = ctx.measureText(lines[line]).width;
      textX = x + (totalWidth - textWidth) / 2;
    } else if (align === 'right') {
      const textWidth = ctx.measureText(lines[line]).width;
      textX = x + totalWidth - padding - textWidth;
    }

    ctx.fillText(lines[line], textX, textY);
    // i++; // Removed unused increment of i
  }
}

/**
 * 텍스트 박스 그리기
 */
export function drawTextBox(
  ctx: CanvasRenderingContext2D,
  annotation: TextAnnotation
): void {
  const { text, position, style } = annotation.data;

  drawText(ctx, text, position, {
    color: style.color,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    backgroundColor: style.backgroundColor,
    padding: style.padding,
    maxWidth: style.maxWidth,
    align: style.align,
  });
}

/**
 * 번호 매기기 텍스트 그리기
 */
export function drawNumberedText(
  ctx: CanvasRenderingContext2D,
  number: number,
  position: Point,
  options: {
    radius?: number;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
  } = {}
): void {
  const {
    radius = 15,
    color = '#ffffff',
    backgroundColor = '#ef4444',
    fontSize = 14,
  } = options;

  // 원형 배경
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 번호 텍스트
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), position.x, position.y);
}

/**
 * 말풍선 그리기
 */
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Point,
  pointerDirection: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
  options: {
    color?: string;
    textColor?: string;
    padding?: number;
    fontSize?: number;
    pointerSize?: number;
    borderRadius?: number;
  } = {}
): void {
  const {
    color = '#ffffff',
    textColor = '#000000',
    padding = 12,
    fontSize = 14,
    pointerSize = 10,
    borderRadius = 8,
  } = options;

  ctx.font = `${fontSize}px Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight + padding * 2;

  let x = position.x;
  let y = position.y;

  // 포인터 방향에 따라 위치 조정
  switch (pointerDirection) {
    case 'top':
      y += pointerSize;
      break;
    case 'bottom':
      y -= boxHeight + pointerSize;
      break;
    case 'left':
      x += pointerSize;
      break;
    case 'right':
      x -= boxWidth + pointerSize;
      break;
  }

  // 말풍선 배경
  ctx.fillStyle = color;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  drawRoundedRectWithPointer(
    ctx,
    x,
    y,
    boxWidth,
    boxHeight,
    borderRadius,
    pointerDirection,
    pointerSize,
    position
  );

  // 텍스트
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + boxWidth / 2, y + boxHeight / 2);
}

/**
 * 포인터가 있는 둥근 사각형
 */
function drawRoundedRectWithPointer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  pointerDirection: 'top' | 'bottom' | 'left' | 'right',
  pointerSize: number,
  pointerPosition: Point
): void {
  ctx.beginPath();

  // 기본 둥근 사각형
  ctx.moveTo(x + radius, y);

  if (pointerDirection === 'top') {
    const pointerX = Math.max(
      x + radius,
      Math.min(pointerPosition.x, x + width - radius)
    );
    ctx.lineTo(pointerX - pointerSize, y);
    ctx.lineTo(pointerPosition.x, y - pointerSize);
    ctx.lineTo(pointerX + pointerSize, y);
  }

  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

  if (pointerDirection === 'right') {
    const pointerY = Math.max(
      y + radius,
      Math.min(pointerPosition.y, y + height - radius)
    );
    ctx.lineTo(x + width, pointerY - pointerSize);
    ctx.lineTo(x + width + pointerSize, pointerPosition.y);
    ctx.lineTo(x + width, pointerY + pointerSize);
  }

  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

  if (pointerDirection === 'bottom') {
    const pointerX = Math.max(
      x + radius,
      Math.min(pointerPosition.x, x + width - radius)
    );
    ctx.lineTo(pointerX + pointerSize, y + height);
    ctx.lineTo(pointerPosition.x, y + height + pointerSize);
    ctx.lineTo(pointerX - pointerSize, y + height);
  }

  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  if (pointerDirection === 'left') {
    const pointerY = Math.max(
      y + radius,
      Math.min(pointerPosition.y, y + height - radius)
    );
    ctx.lineTo(x, pointerY + pointerSize);
    ctx.lineTo(x - pointerSize, pointerPosition.y);
    ctx.lineTo(x, pointerY - pointerSize);
  }

  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * 텍스트 회전 그리기
 */
export function drawRotatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Point,
  angle: number,
  options: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  } = {}
): void {
  const { color = '#ffffff', fontSize = 16, fontFamily = 'Arial, sans-serif' } = options;

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}
