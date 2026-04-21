import { Color, RGB } from '../../types/colorPicker';
import { createColorFromRgb } from './colorFactory';
import { clamp, round } from './helpers';

/**
 * 두 RGB 값 사이를 보간
 */
function interpolateRgb(rgb1: RGB, rgb2: RGB, t: number): RGB {
  const factor = clamp(t, 0, 1);

  return {
    r: round(rgb1.r + (rgb2.r - rgb1.r) * factor, 0),
    g: round(rgb1.g + (rgb2.g - rgb1.g) * factor, 0),
    b: round(rgb1.b + (rgb2.b - rgb1.b) * factor, 0),
  };
}

/**
 * 두 색상 사이를 보간
 */
export function interpolateColors(color1: Color, color2: Color, t: number): Color {
  const rgb = interpolateRgb(color1.rgb, color2.rgb, t);
  return createColorFromRgb(rgb);
}

/**
 * 여러 색상 사이를 균등하게 보간
 */
export function interpolateMultipleColors(
  colors: Color[],
  steps: number
): Color[] {
  if (colors.length < 2) {
    return colors;
  }

  if (steps < 2) {
    return [colors[0]];
  }

  const result: Color[] = [];
  const segmentCount = colors.length - 1;
  const stepsPerSegment = Math.floor((steps - 1) / segmentCount);

  for (let i = 0; i < segmentCount; i++) {
    const startColor = colors[i];
    const endColor = colors[i + 1];

    for (let j = 0; j < stepsPerSegment; j++) {
      const t = j / stepsPerSegment;
      result.push(interpolateColors(startColor, endColor, t));
    }
  }

  result.push(colors[colors.length - 1]);

  return result;
}

/**
 * 그라디언트 생성
 */
export function generateGradient(
  startColor: Color,
  endColor: Color,
  steps: number
): Color[] {
  const result: Color[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    result.push(interpolateColors(startColor, endColor, t));
  }

  return result;
}
