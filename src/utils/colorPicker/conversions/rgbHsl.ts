import { RGB, RGBA, HSL, HSLA } from '../../../types/colorPicker';
import { clamp, round } from '../helpers';

/**
 * RGB를 HSL로 변환
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: round(h * 360, 0),
    s: round(s * 100, 0),
    l: round(l * 100, 0),
  };
}

/**
 * RGBA를 HSLA로 변환
 */
export function rgbaToHsla(rgba: RGBA): HSLA {
  const hsl = rgbToHsl({ r: rgba.r, g: rgba.g, b: rgba.b });

  return {
    ...hsl,
    a: clamp(rgba.a, 0, 1),
  };
}

/**
 * HSL를 RGB로 변환
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hueToRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return {
    r: round(r * 255, 0),
    g: round(g * 255, 0),
    b: round(b * 255, 0),
  };
}

/**
 * HSLA를 RGBA로 변환
 */
export function hslaToRgba(hsla: HSLA): RGBA {
  const rgb = hslToRgb({ h: hsla.h, s: hsla.s, l: hsla.l });

  return {
    ...rgb,
    a: clamp(hsla.a, 0, 1),
  };
}
