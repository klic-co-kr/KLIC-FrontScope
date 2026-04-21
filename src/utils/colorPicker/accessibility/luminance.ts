import { RGB, Color } from '../../../types/colorPicker';

/**
 * sRGB 채널을 선형으로 변환
 */
function linearizeChannel(channel: number): number {
  const normalized = channel / 255;

  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }

  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * RGB의 상대 밝기 계산 (WCAG 2.1)
 */
export function getRelativeLuminance(rgb: RGB): number {
  const r = linearizeChannel(rgb.r);
  const g = linearizeChannel(rgb.g);
  const b = linearizeChannel(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Color 객체의 상대 밝기 계산
 */
export function getColorLuminance(color: Color): number {
  return getRelativeLuminance(color.rgb);
}
