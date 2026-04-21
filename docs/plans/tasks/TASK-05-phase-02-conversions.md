# Phase 2: 컬러피커 - 색상 변환 유틸리티

**태스크 범위**: Task #5.9 ~ #5.18 (10개)
**예상 시간**: 5시간
**의존성**: Phase 1 완료

---

## Task #5.9: HEX ↔ RGB 변환

- **파일**: `src/utils/colorPicker/conversions/hexRgb.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.8

```typescript
import { RGB, RGBA } from '../../../types/colorPicker';
import { clamp, normalizeHex } from '../helpers';

/**
 * HEX를 RGB로 변환
 */
export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex).replace('#', '');

  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  return {
    r: clamp(r, 0, 255),
    g: clamp(g, 0, 255),
    b: clamp(b, 0, 255),
  };
}

/**
 * HEX를 RGBA로 변환 (alpha 포함)
 */
export function hexToRgba(hex: string, alpha: number = 1): RGBA {
  const rgb = hexToRgb(hex);

  return {
    ...rgb,
    a: clamp(alpha, 0, 1),
  };
}

/**
 * RGB를 HEX로 변환
 */
export function rgbToHex(rgb: RGB): string {
  const r = clamp(Math.round(rgb.r), 0, 255);
  const g = clamp(Math.round(rgb.g), 0, 255);
  const b = clamp(Math.round(rgb.b), 0, 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * RGBA를 HEX로 변환 (alpha 포함)
 */
export function rgbaToHex(rgba: RGBA, includeAlpha: boolean = false): string {
  const rgb = { r: rgba.r, g: rgba.g, b: rgba.b };
  const hex = rgbToHex(rgb);

  if (includeAlpha) {
    const alpha = clamp(Math.round(rgba.a * 255), 0, 255);
    const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();
    return `${hex}${alphaHex}`;
  }

  return hex;
}
```

**테스트 케이스**:
- `#FFFFFF` → `{ r: 255, g: 255, b: 255 }`
- `#000000` → `{ r: 0, g: 0, b: 0 }`
- `#F00` → `{ r: 255, g: 0, b: 0 }`
- `{ r: 255, g: 0, b: 0 }` → `#FF0000`

**완료 조건**: 양방향 변환 정확성 검증

---

## Task #5.10: RGB ↔ HSL 변환

- **파일**: `src/utils/colorPicker/conversions/rgbHsl.ts`
- **시간**: 45분
- **의존성**: Task #5.1, #5.8

```typescript
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
```

**테스트 케이스**:
- Red: `{ r: 255, g: 0, b: 0 }` ↔ `{ h: 0, s: 100, l: 50 }`
- Green: `{ r: 0, g: 255, b: 0 }` ↔ `{ h: 120, s: 100, l: 50 }`
- Blue: `{ r: 0, g: 0, b: 255 }` ↔ `{ h: 240, s: 100, l: 50 }`

**완료 조건**: 양방향 변환 정확성 검증

---

## Task #5.11: RGB ↔ HSV 변환

- **파일**: `src/utils/colorPicker/conversions/rgbHsv.ts`
- **시간**: 45분
- **의존성**: Task #5.1, #5.8

```typescript
import { RGB, HSV } from '../../../types/colorPicker';
import { clamp, round } from '../helpers';

/**
 * RGB를 HSV로 변환
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
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
    v: round(v * 100, 0),
  };
}

/**
 * HSV를 RGB로 변환
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r: number;
  let g: number;
  let b: number;

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p;
      break;
    case 1:
      r = q; g = v; b = p;
      break;
    case 2:
      r = p; g = v; b = t;
      break;
    case 3:
      r = p; g = q; b = v;
      break;
    case 4:
      r = t; g = p; b = v;
      break;
    case 5:
    default:
      r = v; g = p; b = q;
      break;
  }

  return {
    r: round(r * 255, 0),
    g: round(g * 255, 0),
    b: round(b * 255, 0),
  };
}
```

**완료 조건**: 양방향 변환 정확성 검증

---

## Task #5.12: HEX ↔ HSL 변환

- **파일**: `src/utils/colorPicker/conversions/hexHsl.ts`
- **시간**: 20분
- **의존성**: Task #5.9, #5.10

```typescript
import { HSL, HSLA } from '../../../types/colorPicker';
import { hexToRgb, rgbToHex } from './hexRgb';
import { rgbToHsl, hslToRgb } from './rgbHsl';

/**
 * HEX를 HSL로 변환
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * HEX를 HSLA로 변환
 */
export function hexToHsla(hex: string, alpha: number = 1): HSLA {
  const hsl = hexToHsl(hex);

  return {
    ...hsl,
    a: alpha,
  };
}

/**
 * HSL를 HEX로 변환
 */
export function hslToHex(hsl: HSL): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

/**
 * HSLA를 HEX로 변환
 */
export function hslaToHex(hsla: HSLA): string {
  return hslToHex({ h: hsla.h, s: hsla.s, l: hsla.l });
}
```

**완료 조건**: 조합 변환 정확성 검증

---

## Task #5.13: 색상 문자열 파싱

- **파일**: `src/utils/colorPicker/parser.ts`
- **시간**: 45분
- **의존성**: Task #5.1, #5.7, #5.9-#5.12

```typescript
import { RGB, RGBA, HSL, HSLA } from '../../types/colorPicker';
import { COLOR_PATTERNS, detectColorFormat } from './patterns';
import { hexToRgb } from './conversions/hexRgb';
import { clamp } from './helpers';

/**
 * 색상 문자열을 파싱
 */
export function parseColor(colorString: string): RGB | RGBA | HSL | HSLA | null {
  const format = detectColorFormat(colorString);

  if (!format) {
    return null;
  }

  switch (format) {
    case 'hex':
      return hexToRgb(colorString);

    case 'rgb':
      return parseRgb(colorString);

    case 'rgba':
      return parseRgba(colorString);

    case 'hsl':
      return parseHsl(colorString);

    case 'hsla':
      return parseHsla(colorString);

    default:
      return null;
  }
}

/**
 * RGB 문자열 파싱
 */
function parseRgb(rgbString: string): RGB | null {
  const match = rgbString.match(COLOR_PATTERNS.rgb);

  if (!match) {
    return null;
  }

  return {
    r: clamp(parseInt(match[1]), 0, 255),
    g: clamp(parseInt(match[2]), 0, 255),
    b: clamp(parseInt(match[3]), 0, 255),
  };
}

/**
 * RGBA 문자열 파싱
 */
function parseRgba(rgbaString: string): RGBA | null {
  const match = rgbaString.match(COLOR_PATTERNS.rgba);

  if (!match) {
    return null;
  }

  return {
    r: clamp(parseInt(match[1]), 0, 255),
    g: clamp(parseInt(match[2]), 0, 255),
    b: clamp(parseInt(match[3]), 0, 255),
    a: clamp(parseFloat(match[4]), 0, 1),
  };
}

/**
 * HSL 문자열 파싱
 */
function parseHsl(hslString: string): HSL | null {
  const match = hslString.match(COLOR_PATTERNS.hsl);

  if (!match) {
    return null;
  }

  return {
    h: clamp(parseInt(match[1]), 0, 360),
    s: clamp(parseInt(match[2]), 0, 100),
    l: clamp(parseInt(match[3]), 0, 100),
  };
}

/**
 * HSLA 문자열 파싱
 */
function parseHsla(hslaString: string): HSLA | null {
  const match = hslaString.match(COLOR_PATTERNS.hsla);

  if (!match) {
    return null;
  }

  return {
    h: clamp(parseInt(match[1]), 0, 360),
    s: clamp(parseInt(match[2]), 0, 100),
    l: clamp(parseInt(match[3]), 0, 100),
    a: clamp(parseFloat(match[4]), 0, 1),
  };
}
```

**완료 조건**: 모든 포맷 파싱 성공

---

## Task #5.14: 색상 포맷팅

- **파일**: `src/utils/colorPicker/formatter.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.8

```typescript
import { RGB, RGBA, HSL, HSLA, Color, ColorFormat } from '../../types/colorPicker';
import { round } from './helpers';

/**
 * RGB를 문자열로 변환
 */
export function formatRgb(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * RGBA를 문자열로 변환
 */
export function formatRgba(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${round(rgba.a, 2)})`;
}

/**
 * HSL를 문자열로 변환
 */
export function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * HSLA를 문자열로 변환
 */
export function formatHsla(hsla: HSLA): string {
  return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${round(hsla.a, 2)})`;
}

/**
 * CSS Variable 형식으로 변환
 */
export function formatCssVar(name: string): string {
  const varName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return `var(--${varName})`;
}

/**
 * 색상을 지정된 포맷으로 변환
 */
export function formatColor(color: Color, format: ColorFormat): string {
  switch (format) {
    case 'hex':
      return color.hex;

    case 'rgb':
      return formatRgb(color.rgb);

    case 'rgba':
      return formatRgba(color.rgba);

    case 'hsl':
      return formatHsl(color.hsl);

    case 'hsla':
      return formatHsla(color.hsla);

    case 'hsv':
      return `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`;

    case 'cssvar':
      return formatCssVar(color.name || color.hex);

    default:
      return color.hex;
  }
}
```

**완료 조건**: 모든 포맷 출력 검증

---

## Task #5.15: Color 객체 생성

- **파일**: `src/utils/colorPicker/colorFactory.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.8, #5.9-#5.12

```typescript
import { Color, RGB, HSL } from '../../types/colorPicker';
import { generateColorId, generateColorName } from './helpers';
import { rgbToHex } from './conversions/hexRgb';
import { rgbToHsl } from './conversions/rgbHsl';
import { rgbToHsv } from './conversions/rgbHsv';
import { hexToRgb } from './conversions/hexRgb';
import { hslToRgb } from './conversions/rgbHsl';

/**
 * HEX로부터 Color 객체 생성
 */
export function createColorFromHex(hex: string, name?: string): Color {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);

  return {
    id: generateColorId(),
    timestamp: Date.now(),
    hex,
    rgb,
    rgba: { ...rgb, a: 1 },
    hsl,
    hsla: { ...hsl, a: 1 },
    hsv,
    name: name || generateColorName(hex),
  };
}

/**
 * RGB로부터 Color 객체 생성
 */
export function createColorFromRgb(rgb: RGB, name?: string): Color {
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);

  return {
    id: generateColorId(),
    timestamp: Date.now(),
    hex,
    rgb,
    rgba: { ...rgb, a: 1 },
    hsl,
    hsla: { ...hsl, a: 1 },
    hsv,
    name: name || generateColorName(hex),
  };
}

/**
 * HSL로부터 Color 객체 생성
 */
export function createColorFromHsl(hsl: HSL, name?: string): Color {
  const rgb = hslToRgb(hsl);
  const hex = rgbToHex(rgb);
  const hsv = rgbToHsv(rgb);

  return {
    id: generateColorId(),
    timestamp: Date.now(),
    hex,
    rgb,
    rgba: { ...rgb, a: 1 },
    hsl,
    hsla: { ...hsl, a: 1 },
    hsv,
    name: name || generateColorName(hex),
  };
}
```

**완료 조건**: Color 객체 완전성 검증

---

## Task #5.16: 색상 유효성 검증

- **파일**: `src/utils/colorPicker/validator.ts`
- **시간**: 20분
- **의존성**: Task #5.1, #5.7, #5.13

```typescript
import { RGB, RGBA, HSL, HSLA, Color } from '../../types/colorPicker';
import { isValidColor as isValidColorString } from './patterns';
import { parseColor } from './parser';

/**
 * RGB 값 유효성 검증
 */
export function isValidRgb(rgb: RGB): boolean {
  return (
    rgb.r >= 0 && rgb.r <= 255 &&
    rgb.g >= 0 && rgb.g <= 255 &&
    rgb.b >= 0 && rgb.b <= 255
  );
}

/**
 * RGBA 값 유효성 검증
 */
export function isValidRgba(rgba: RGBA): boolean {
  return isValidRgb(rgba) && rgba.a >= 0 && rgba.a <= 1;
}

/**
 * HSL 값 유효성 검증
 */
export function isValidHsl(hsl: HSL): boolean {
  return (
    hsl.h >= 0 && hsl.h <= 360 &&
    hsl.s >= 0 && hsl.s <= 100 &&
    hsl.l >= 0 && hsl.l <= 100
  );
}

/**
 * HSLA 값 유효성 검증
 */
export function isValidHsla(hsla: HSLA): boolean {
  return isValidHsl(hsla) && hsla.a >= 0 && hsla.a <= 1;
}

/**
 * Color 객체 유효성 검증
 */
export function isValidColor(color: Color): boolean {
  return (
    color.id !== undefined &&
    color.timestamp > 0 &&
    isValidColorString(color.hex) &&
    isValidRgb(color.rgb) &&
    isValidRgba(color.rgba) &&
    isValidHsl(color.hsl) &&
    isValidHsla(color.hsla)
  );
}
```

**완료 조건**: 유효성 검증 정확성 확인

---

## Task #5.17: 색상 문자열 변환 통합

- **파일**: `src/utils/colorPicker/colorString.ts`
- **시간**: 20분
- **의존성**: Task #5.13, #5.14

```typescript
import { Color, ColorFormat } from '../../types/colorPicker';
import { parseColor } from './parser';
import { formatColor } from './formatter';
import { createColorFromRgb } from './colorFactory';

/**
 * 색상 문자열을 다른 포맷으로 변환
 */
export function convertColorString(
  colorString: string,
  toFormat: ColorFormat
): string | null {
  try {
    const parsed = parseColor(colorString);

    if (!parsed) {
      return null;
    }

    // RGB로 통일
    let rgb;
    if ('r' in parsed) {
      rgb = { r: parsed.r, g: parsed.g, b: parsed.b };
    } else {
      // HSL 등의 경우 변환 필요
      return null;
    }

    const color = createColorFromRgb(rgb);

    return formatColor(color, toFormat);
  } catch (error) {
    return null;
  }
}

/**
 * Color 객체를 모든 포맷으로 반환
 */
export function colorToAllFormats(color: Color): Record<ColorFormat, string> {
  return {
    hex: formatColor(color, 'hex'),
    rgb: formatColor(color, 'rgb'),
    rgba: formatColor(color, 'rgba'),
    hsl: formatColor(color, 'hsl'),
    hsla: formatColor(color, 'hsla'),
    hsv: formatColor(color, 'hsv'),
    cssvar: formatColor(color, 'cssvar'),
  };
}
```

**완료 조건**: 통합 변환 기능 검증

---

## Task #5.18: 색상 보간 (Interpolation)

- **파일**: `src/utils/colorPicker/interpolation.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.9-#5.12, #5.15

```typescript
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
```

**완료 조건**: 보간 정확성 검증

---

**완료 후 다음 단계**: [Phase 3: 팔레트 생성](./TASK-05-phase-03-palettes.md)
