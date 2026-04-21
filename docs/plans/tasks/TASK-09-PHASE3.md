# Phase 3: CSS → Tailwind 변환

**태스크**: 8개
**예상 시간**: 4시간
**의존성**: Phase 1, Phase 2 완료

---

### Task #9.17: CSS → Tailwind 변환

- **파일**: `src/utils/tailwind/convertCSSToTailwind.ts`
- **시간**: 45분
- **의존성**: Task #9.7
- **상세 내용**:
```typescript
import { CSSToTailwindResult } from '../../types/tailwindScanner';

/**
 * CSS 속성을 Tailwind 클래스로 변환
 */
export function convertCSSToTailwind(
  property: string,
  value: string
): CSSToTailwindResult {
  const result: CSSToTailwindResult = {
    css: { property, value },
    tailwind: {
      classes: [],
      confidence: 0,
    },
  };

  // 속성별 변환
  switch (property) {
    case 'padding':
    case 'padding-top':
    case 'padding-right':
    case 'padding-bottom':
    case 'padding-left':
      result.tailwind = convertPadding(property, value);
      break;

    case 'margin':
    case 'margin-top':
    case 'margin-right':
    case 'margin-bottom':
    case 'margin-left':
      result.tailwind = convertMargin(property, value);
      break;

    case 'color':
      result.tailwind = convertColor(property, value);
      break;

    case 'background-color':
      result.tailwind = convertColor(property, value);
      break;

    case 'font-size':
      result.tailwind = convertFontSize(value);
      break;

    case 'border-radius':
      result.tailwind = convertBorderRadius(value);
      break;

    case 'display':
      result.tailwind = convertDisplay(value);
      break;

    default:
      result.tailwind = { classes: [], confidence: 0 };
  }

  return result;
}

/**
 * 여러 CSS 속성 변환
 */
export function convertMultipleCSS(
  styles: Record<string, string>
): CSSToTailwindResult[] {
  const results: CSSToTailwindResult[] = [];

  for (const [property, value] of Object.entries(styles)) {
    results.push(convertCSSToTailwind(property, value));
  }

  return results;
}
```
- **완료 조건**: 정확한 변환 및 확신도 계산

---

### Task #9.18: Padding 변환

- **파일**: `src/utils/tailwind/convertPadding.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Padding 변환
 */
export function convertPadding(
  property: string,
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];
  let confidence = 0;

  // 단위 변환
  const normalized = normalizeSpacingValue(value);

  if (!normalized) {
    return { classes: [], confidence: 0 };
  }

  // Tailwind 스페이스 스케일
  const spacingScale = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'];

  // 가장 가까운 표준 값 찾기
  const closest = findClosestValue(normalized, spacingScale);

  if (closest) {
    confidence = calculateConfidence(normalized, closest, spacingScale);

    // 속성별 클래스 생성
    switch (property) {
      case 'padding':
        classes.push(`p-${closest}`);
        break;
      case 'padding-top':
        classes.push(`pt-${closest}`);
        break;
      case 'padding-right':
        classes.push(`pr-${closest}`);
        break;
      case 'padding-bottom':
        classes.push(`pb-${closest}`);
        break;
      case 'padding-left':
        classes.push(`pl-${closest}`);
        break;
    }
  } else {
    // 임의 값 사용
    classes.push(`p-[${value}]`);
    confidence = 1;
  }

  return { classes, confidence };
}

/**
 * 스페이싱 값 정규화
 */
function normalizeSpacingValue(value: string): number | null {
  if (!value) return null;

  // px 단위
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    return px / 4; // Tailwind는 0.25rem 단위
  }

  // rem 단위
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) {
    return parseFloat(remMatch[1]);
  }

  // em 단위
  const emMatch = value.match(/^(\d+(?:\.\d+)?)em$/);
  if (emMatch) {
    return parseFloat(emMatch[1]);
  }

  return null;
}

/**
 * 가장 가까운 값 찾기
 */
function findClosestValue(
  target: number,
  scale: string[]
): string | null {
  let closest: string | null = null;
  let minDiff = Infinity;

  for (const value of scale) {
    const num = parseFloat(value);
    const diff = Math.abs(target - num);

    if (diff < minDiff) {
      minDiff = diff;
      closest = value;
    }
  }

  // 차이가 너무 크면 null 반환
  if (minDiff > 0.25) {
    return null;
  }

  return closest;
}

/**
 * 확신도 계산
 */
function calculateConfidence(
  target: number,
  closest: string,
  scale: string[]
): number {
  const closestNum = parseFloat(closest);
  const diff = Math.abs(target - closestNum);

  // 완전히 일치하면 1
  if (diff === 0) return 1;

  // 차이가 작을수록 높은 확신도
  return Math.max(0, 1 - diff * 2);
}
```
- **완료 조건**: 정확한 padding 변환

---

### Task #9.19: Margin 변환

- **파일**: `src/utils/tailwind/convertMargin.ts`
- **시간**: 30분
- **의존성**: Task #9.18
- **상세 내용**:
```typescript
/**
 * Margin 변환 (padding과 유사)
 */
export function convertMargin(
  property: string,
  value: string
): { classes: string[]; confidence: number } {
  // padding과 동일한 로직
  // m, mt, mr, mb, ml 클래스 사용
  // 음수 값 지원 (-mt-4 등)

  const classes: string[] = [];
  let confidence = 0;

  const normalized = normalizeSpacingValue(value);

  if (normalized === null) {
    // 자동 값
    if (value === 'auto') {
      switch (property) {
        case 'margin':
          classes.push('mx-auto');
          break;
        case 'margin-left':
        case 'margin-right':
          classes.push('mx-auto');
          break;
        case 'margin-top':
        case 'margin-bottom':
          classes.push('my-auto');
          break;
      }
      return { classes, confidence: 1 };
    }

    return { classes: [], confidence: 0 };
  }

  // 음수 처리
  const isNegative = normalized < 0;
  const absValue = Math.abs(normalized);

  const spacingScale = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'];

  const closest = findClosestValue(absValue, spacingScale);

  if (closest) {
    confidence = calculateConfidence(absValue, closest, spacingScale);
    const prefix = isNegative ? '-' : '';

    switch (property) {
      case 'margin':
        classes.push(`${prefix}m-${closest}`);
        break;
      case 'margin-top':
        classes.push(`${prefix}mt-${closest}`);
        break;
      case 'margin-right':
        classes.push(`${prefix}mr-${closest}`);
        break;
      case 'margin-bottom':
        classes.push(`${prefix}mb-${closest}`);
        break;
      case 'margin-left':
        classes.push(`${prefix}ml-${closest}`);
        break;
    }
  } else {
    classes.push(`m-[${value}]`);
    confidence = 1;
  }

  return { classes, confidence };
}

// 유틸리티 함수들 import
function normalizeSpacingValue(value: string): number | null {
  // Task #9.18의 함수 사용
  return 0; // 실제로는 import
}

function findClosestValue(target: number, scale: string[]): string | null {
  // Task #9.18의 함수 사용
  return null; // 실제로는 import
}

function calculateConfidence(target: number, closest: string, scale: string[]): number {
  // Task #9.18의 함수 사용
  return 0; // 실제로는 import
}
```
- **완료 조건**: 정확한 margin 변환 (음수 포함)

---

### Task #9.20: 색상 변환

- **파일**: `src/utils/tailwind/convertColor.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 색상 변환
 */
export function convertColor(
  property: string,
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];
  let confidence = 0;

  // 투명도 처리
  if (value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
    const prefix = property === 'color' ? 'text' : 'bg';
    classes.push(`${prefix}-transparent`);
    return { classes, confidence: 1 };
  }

  // Hex 색상
  const hexMatch = value.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (hexMatch) {
    const result = convertHexColor(hexMatch[1], property);
    classes.push(...result.classes);
    confidence = result.confidence;
  }

  // RGB 색상
  const rgbMatch = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const result = convertRgbColor(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3]),
      property
    );
    classes.push(...result.classes);
    confidence = result.confidence;
  }

  // RGBA 색상
  const rgbaMatch = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    const result = convertRgbaColor(
      parseInt(rgbaMatch[1]),
      parseInt(rgbaMatch[2]),
      parseInt(rgbaMatch[3]),
      parseFloat(rgbaMatch[4]),
      property
    );
    classes.push(...result.classes);
    confidence = result.confidence;
  }

  // 명명된 색상
  const namedResult = convertNamedColor(value, property);
  if (namedResult) {
    classes.push(...namedResult.classes);
    confidence = namedResult.confidence;
  }

  return { classes, confidence };
}

/**
 * Hex 색상 변환
 */
function convertHexColor(
  hex: string,
  property: string
): { classes: string[]; confidence: number } {
  // 확장
  const expanded = hex.length === 3
    ? hex.split('').map(c => c + c).join('')
    : hex;

  const r = parseInt(expanded.substr(0, 2), 16);
  const g = parseInt(expanded.substr(2, 2), 16);
  const b = parseInt(expanded.substr(4, 2), 16);

  return convertRgbColor(r, g, b, property);
}

/**
 * RGB 색상 변환
 */
function convertRgbColor(
  r: number,
  g: number,
  b: number,
  property: string
): { classes: string[]; confidence: number } {
  const prefix = property === 'color' ? 'text' : 'bg';

  // 흑백 체크
  if (r === g && g === b) {
    if (r === 0) {
      return { classes: [`${prefix}-black`], confidence: 1 };
    } else if (r === 255) {
      return { classes: [`${prefix}-white`], confidence: 1 };
    } else {
      // 그레이 스케일
      const gray = Math.round(r / 255 * 100);
      return { classes: [`${prefix}-gray-${gray}`], confidence: 0.9 };
    }
  }

  // Tailwind 기본 색상과 비교
  const tailwindColors = getTailwindColors();
  let closest: { name: string; shade: string; distance: number } | null = null;

  for (const [colorName, shades] of Object.entries(tailwindColors)) {
    for (const [shade, rgb] of Object.entries(shades)) {
      const distance = calculateColorDistance(r, g, b, rgb.r, rgb.g, rgb.b);

      if (!closest || distance < closest.distance) {
        closest = { name: colorName, shade, distance };
      }
    }
  }

  if (closest && closest.distance < 50) {
    const confidence = 1 - (closest.distance / 50);
    return {
      classes: [`${prefix}-${closest.name}-${closest.shade}`],
      confidence: Math.max(0.7, confidence),
    };
  }

  // 임의 값 사용
  const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  return { classes: [`${prefix}-[${hex}]`], confidence: 1 };
}

/**
 * RGBA 색상 변환
 */
function convertRgbaColor(
  r: number,
  g: number,
  b: number,
  a: number,
  property: string
): { classes: string[]; confidence: number } {
  const prefix = property === 'color' ? 'text' : 'bg';

  // RGB 부분 변환
  const rgbResult = convertRgbColor(r, g, b, property);

  // 불투명도 변환
  const opacityPercent = Math.round(a * 100);
  const opacityClass = opacityPercent === 100
    ? ''
    : `/${opacityPercent}`;

  if (rgbResult.classes.length > 0) {
    return {
      classes: rgbResult.classes.map(c => {
        // 불투명도가 있으면 추가
        if (opacityPercent < 100) {
          // 기본 클래스 + opacity 클래스 조합
          return [c, `opacity-${opacityPercent}`];
        }
        return [c];
      }).flat(),
      confidence: rgbResult.confidence * 0.9,
    };
  }

  return { classes: [], confidence: 0 };
}

/**
 * 명명된 색상 변환
 */
function convertNamedColor(
  name: string,
  property: string
): { classes: string[]; confidence: number } | null {
  const namedColors: Record<string, string> = {
    'black': 'black',
    'white': 'white',
    'red': 'red-500',
    'blue': 'blue-500',
    'green': 'green-500',
    'yellow': 'yellow-500',
    'gray': 'gray-500',
    'slate': 'slate-500',
  };

  const tailwindColor = namedColors[name.toLowerCase()];
  if (tailwindColor) {
    const prefix = property === 'color' ? 'text' : 'bg';
    return { classes: [`${prefix}-${tailwindColor}`], confidence: 1 };
  }

  return null;
}

/**
 * 색상 거리 계산 (Euclidean)
 */
function calculateColorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

/**
 * Tailwind 색상 팔레트
 */
function getTailwindColors(): Record<string, Record<string, { r: number; g: number; b: number }>> {
  // 주요 색상의 RGB 값
  return {
    red: {
      '50': { r: 254, g: 242, b: 242 },
      '100': { r: 254, g: 226, b: 226 },
      '200': { r: 254, g: 205, b: 205 },
      '300': { r: 253, g: 164, b: 175 },
      '400': { r: 251, g: 113, b: 133 },
      '500': { r: 239, g: 68, b: 68 },
      '600': { r: 220, g: 38, b: 38 },
      '700': { r: 185, g: 28, b: 28 },
      '800': { r: 153, g: 27, b: 27 },
      '900': { r: 127, g: 29, b: 29 },
    },
    blue: {
      '50': { r: 239, g: 246, b: 255 },
      '100': { r: 219, g: 234, b: 254 },
      '200': { r: 191, g: 219, b: 254 },
      '300': { r: 147, g: 197, b: 253 },
      '400': { r: 96, g: 165, b: 250 },
      '500': { r: 59, g: 130, b: 246 },
      '600': { r: 37, g: 99, b: 235 },
      '700': { r: 29, g: 78, b: 216 },
      '800': { r: 30, g: 64, b: 175 },
      '900': { r: 30, g: 58, b: 138 },
    },
    green: {
      '50': { r: 240, g: 253, b: 244 },
      '100': { r: 220, g: 252, b: 231 },
      '200': { r: 187, g: 247, b: 208 },
      '300': { r: 134, g: 239, b: 172 },
      '400': { r: 74, g: 222, b: 128 },
      '500': { r: 34, g: 197, b: 94 },
      '600': { r: 22, g: 163, b: 74 },
      '700': { r: 21, g: 128, b: 61 },
      '800': { r: 22, g: 101, b: 52 },
      '900': { r: 20, g: 83, b: 45 },
    },
    // ... 기타 색상들
  };
}
```
- **완료 조건**: 정확한 색상 변환

---

### Task #9.21: Font Size 변환

- **파일**: `src/utils/tailwind/convertFontSize.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Font size 변환
 */
export function convertFontSize(
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];
  let confidence = 0;

  // Tailwind font scale
  const fontScale: Record<string, { size: string; lineHeight: string }> = {
    'xs': { size: '0.75rem', lineHeight: '1rem' },
    'sm': { size: '0.875rem', lineHeight: '1.25rem' },
    'base': { size: '1rem', lineHeight: '1.5rem' },
    'lg': { size: '1.125rem', lineHeight: '1.75rem' },
    'xl': { size: '1.25rem', lineHeight: '1.75rem' },
    '2xl': { size: '1.5rem', lineHeight: '2rem' },
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
    '5xl': { size: '3rem', lineHeight: '1' },
    '6xl': { size: '3.75rem', lineHeight: '1' },
    '7xl': { size: '4.5rem', lineHeight: '1' },
    '8xl': { size: '6rem', lineHeight: '1' },
    '9xl': { size: '8rem', lineHeight: '1' },
  };

  // px 단위
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    const rem = px / 16;

    for (const [key, { size }] of Object.entries(fontScale)) {
      const sizeRem = parseFloat(size);
      if (Math.abs(rem - sizeRem) < 0.01) {
        confidence = 1;
        classes.push(`text-${key}`);
        return { classes, confidence };
      }
    }

    // 가장 가까운 크기 찾기
    let closest: string | null = null;
    let minDiff = Infinity;

    for (const [key, { size }] of Object.entries(fontScale)) {
      const sizeRem = parseFloat(size);
      const diff = Math.abs(rem - sizeRem);

      if (diff < minDiff) {
        minDiff = diff;
        closest = key;
      }
    }

    if (closest && minDiff < 0.125) {
      confidence = 1 - (minDiff * 4);
      classes.push(`text-${closest}`);
    } else {
      classes.push(`text-[${value}]`);
      confidence = 1;
    }
  }

  // rem 단위
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) {
    const rem = parseFloat(remMatch[1]);

    for (const [key, { size }] of Object.entries(fontScale)) {
      const sizeRem = parseFloat(size);
      if (Math.abs(rem - sizeRem) < 0.01) {
        confidence = 1;
        classes.push(`text-${key}`);
        return { classes, confidence };
      }
    }
  }

  // em 단위
  const emMatch = value.match(/^(\d+(?:\.\d+)?)em$/);
  if (emMatch) {
    const em = parseFloat(emMatch[1]);

    for (const [key, { size }] of Object.entries(fontScale)) {
      const sizeRem = parseFloat(size);
      if (Math.abs(em - sizeRem) < 0.01) {
        confidence = 1;
        classes.push(`text-${key}`);
        return { classes, confidence };
      }
    }
  }

  return { classes, confidence };
}
```
- **완료 조건**: 정확한 font size 변환

---

### Task #9.22: Border Radius 변환

- **파일**: `src/utils/tailwind/convertBorderRadius.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Border radius 변환
 */
export function convertBorderRadius(
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];
  let confidence = 0;

  // Tailwind border radius scale
  const radiusScale: Record<string, string> = {
    'none': '0px',
    'sm': '0.125rem',
    DEFAULT: '0.25rem',
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    'full': '9999px',
  };

  // 0 처리
  if (value === '0' || value === '0px') {
    return { classes: ['rounded-none'], confidence: 1 };
  }

  // full 처리
  if (value === '9999px' || value === '50%') {
    return { classes: ['rounded-full'], confidence: 1 };
  }

  // px 단위
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    const rem = px / 16;

    for (const [key, radius] of Object.entries(radiusScale)) {
      if (key === 'none' || key === 'full') continue;

      const radiusRem = parseFloat(radius);
      if (Math.abs(rem - radiusRem) < 0.01) {
        confidence = 1;
        const className = key === 'DEFAULT' ? 'rounded' : `rounded-${key}`;
        classes.push(className);
        return { classes, confidence };
      }
    }

    // 임의 값
    classes.push(`rounded-[${value}]`);
    confidence = 1;
  }

  // rem 단위
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) {
    const rem = parseFloat(remMatch[1]);

    for (const [key, radius] of Object.entries(radiusScale)) {
      if (key === 'none' || key === 'full') continue;

      const radiusRem = parseFloat(radius);
      if (Math.abs(rem - radiusRem) < 0.01) {
        confidence = 1;
        const className = key === 'DEFAULT' ? 'rounded' : `rounded-${key}`;
        classes.push(className);
        return { classes, confidence };
      }
    }

    // 임의 값
    classes.push(`rounded-[${value}]`);
    confidence = 1;
  }

  // % 단위
  const percentMatch = value.match(/^(\d+)%$/);
  if (percentMatch) {
    const percent = parseInt(percentMatch[1]);

    if (percent === 50) {
      return { classes: ['rounded-full'], confidence: 1 };
    }

    classes.push(`rounded-[${value}]`);
    confidence = 1;
  }

  return { classes, confidence };
}
```
- **완료 조건**: 정확한 border radius 변환

---

### Task #9.23: Display 변환

- **파일**: `src/utils/tailwind/convertDisplay.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * Display 변환
 */
export function convertDisplay(
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];

  // 정확히 일치하는 경우
  const displayMap: Record<string, string> = {
    'block': 'block',
    'inline-block': 'inline-block',
    'inline': 'inline',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'inline-grid': 'inline-grid',
    'hidden': 'hidden',
    'table': 'table',
    'table-cell': 'table-cell',
    'table-row': 'table-row',
    'flow-root': 'flow-root',
  };

  const tailwindClass = displayMap[value];

  if (tailwindClass) {
    return { classes: [tailwindClass], confidence: 1 };
  }

  // 지원하지 않는 값
  return { classes: [], confidence: 0 };
}

/**
 * Flex 관련 속성 변환
 */
export function convertFlexProperties(
  property: string,
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];

  switch (property) {
    case 'flex-direction':
      const dirMap: Record<string, string> = {
        'row': 'flex-row',
        'row-reverse': 'flex-row-reverse',
        'column': 'flex-col',
        'column-reverse': 'flex-col-reverse',
      };
      if (dirMap[value]) {
        classes.push(dirMap[value]);
      }
      break;

    case 'justify-content':
      const justifyMap: Record<string, string> = {
        'flex-start': 'justify-start',
        'flex-end': 'justify-end',
        'center': 'justify-center',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
        'space-evenly': 'justify-evenly',
      };
      if (justifyMap[value]) {
        classes.push(justifyMap[value]);
      }
      break;

    case 'align-items':
      const alignMap: Record<string, string> = {
        'flex-start': 'items-start',
        'flex-end': 'items-end',
        'center': 'items-center',
        'baseline': 'items-baseline',
        'stretch': 'items-stretch',
      };
      if (alignMap[value]) {
        classes.push(alignMap[value]);
      }
      break;

    case 'flex-wrap':
      if (value === 'wrap') classes.push('flex-wrap');
      else if (value === 'nowrap') classes.push('flex-nowrap');
      else if (value === 'wrap-reverse') classes.push('flex-wrap-reverse');
      break;

    case 'gap':
      // gap은 spacing 스케일 사용
      const gapValue = value.replace(/px|rem|em$/, '');
      classes.push(`gap-${gapValue}`);
      break;
  }

  return { classes, confidence: classes.length > 0 ? 1 : 0 };
}

/**
 * Grid 관련 속성 변환
 */
export function convertGridProperties(
  property: string,
  value: string
): { classes: string[]; confidence: number } {
  const classes: string[] = [];

  switch (property) {
    case 'grid-template-columns':
      const colMatch = value.match(/repeat\((\d+),\s*minmax\(0,\s*1fr\)\)/);
      if (colMatch) {
        const cols = parseInt(colMatch[1]);
        if (cols >= 1 && cols <= 12) {
          classes.push(`grid-cols-${cols}`);
        }
      }
      break;

    case 'grid-template-rows':
      const rowMatch = value.match(/repeat\((\d+),\s*minmax\(0,\s*1fr\)\)/);
      if (rowMatch) {
        const rows = parseInt(rowMatch[1]);
        if (rows >= 1 && rows <= 6) {
          classes.push(`grid-rows-${rows}`);
        }
      }
      break;
  }

  return { classes, confidence: classes.length > 0 ? 1 : 0 };
}
```
- **완료 조건**: 정확한 display 및 flex/grid 변환

---

### Task #9.24: 변환 리포트 생성

- **파일**: `src/utils/tailwind/generateConversionReport.ts`
- **시간**: 30분
- **의존성**: Task #9.17-#9.23
- **상세 내용**:
```typescript
import { CSSToTailwindResult, ElementStyleAnalysis } from '../../types/tailwindScanner';

/**
 * 변환 리포트
 */
export interface ConversionReport {
  element: {
    selector: string;
    tagName: string;
  };
  summary: {
    totalStyles: number;
    convertible: number;
    nonConvertible: number;
    conversionRate: number;
  };
  conversions: Array<{
    css: { property: string; value: string };
    tailwind: { classes: string[]; confidence: number };
  }>;
  nonConvertible: Array<{
    property: string;
    value: string;
    reason: string;
  }>;
  suggestedClasses: string[];
  overallConfidence: number;
}

/**
 * 요소 스타일 변환 리포트 생성
 */
export function generateConversionReport(
  element: HTMLElement,
  computedStyles: Record<string, string>
): ConversionReport {
  const conversions: CSSToTailwindResult[] = [];
  const nonConvertible: Array<{ property: string; value: string; reason: string }> = [];
  let totalConfidence = 0;

  // 각 스타일 속성 변환 시도
  for (const [property, value] of Object.entries(computedStyles)) {
    const result = convertCSSToTailwind(property, value);

    if (result.tailwind.classes.length > 0 && result.tailwind.confidence >= 0.7) {
      conversions.push(result);
      totalConfidence += result.tailwind.confidence;
    } else {
      nonConvertible.push({
        property,
        value,
        reason: result.tailwind.confidence < 0.7 ? '낮은 확신도' : '변환 불가',
      });
    }
  }

  const convertible = conversions.length;
  const totalStyles = convertible + nonConvertible.length;
  const conversionRate = totalStyles > 0 ? convertible / totalStyles : 0;

  // 추천 클래스 조합
  const suggestedClasses = conversions
    .flatMap(c => c.tailwind.classes)
    .filter((c, i, arr) => arr.indexOf(c) === i); // 중복 제거

  return {
    element: {
      selector: getSimpleSelector(element),
      tagName: element.tagName,
    },
    summary: {
      totalStyles,
      convertible,
      nonConvertible: nonConvertible.length,
      conversionRate,
    },
    conversions,
    nonConvertible,
    suggestedClasses,
    overallConfidence: convertible > 0 ? totalConfidence / convertible : 0,
  };
}

/**
 * 간단 선택자 생성
 */
function getSimpleSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const classes = element.className?.split(/\s+/).filter(Boolean);
  if (classes && classes.length > 0) {
    return `.${classes[0]}`;
  }

  return element.tagName.toLowerCase();
}

// convertCSSToTailwind import
function convertCSSToTailwind(property: string, value: string): CSSToTailwindResult {
  // Task #9.17의 함수
  return { css: { property, value }, tailwind: { classes: [], confidence: 0 } };
}
```
- **완료 조건**: 정확한 리포트 생성

---

[Phase 4: Config 추출](./TASK-09-PHASE4.md) 로 계속
