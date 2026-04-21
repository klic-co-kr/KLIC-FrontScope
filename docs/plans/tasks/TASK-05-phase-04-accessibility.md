# Phase 4: 컬러피커 - 대비율 및 접근성

**태스크 범위**: Task #5.26 ~ #5.30 (5개)
**예상 시간**: 2시간
**의존성**: Phase 1, Phase 2 완료

---

## Task #5.26: 상대 밝기 계산

- **파일**: `src/utils/colorPicker/accessibility/luminance.ts`
- **시간**: 30분
- **의존성**: Task #5.1

```typescript
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
```

**테스트 케이스**:
- White `{ r: 255, g: 255, b: 255 }` → 1.0
- Black `{ r: 0, g: 0, b: 0 }` → 0.0

**완료 조건**: 밝기 계산 정확성 검증

---

## Task #5.27: 대비율 계산

- **파일**: `src/utils/colorPicker/accessibility/contrast.ts`
- **시간**: 25분
- **의존성**: Task #5.1, #5.26

```typescript
import { Color, ContrastResult } from '../../../types/colorPicker';
import { getColorLuminance } from './luminance';
import { WCAG_CONTRAST_RATIOS } from '../../../constants/colors';
import { round } from '../helpers';

/**
 * 두 색상 간 대비율 계산
 */
export function getContrastRatio(color1: Color, color2: Color): number {
  const lum1 = getColorLuminance(color1);
  const lum2 = getColorLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return round((lighter + 0.05) / (darker + 0.05), 2);
}

/**
 * 대비율 결과 생성
 */
export function getContrastResult(
  foreground: Color,
  background: Color
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  const passAA = ratio >= WCAG_CONTRAST_RATIOS.AA_NORMAL;
  const passAAA = ratio >= WCAG_CONTRAST_RATIOS.AAA_NORMAL;

  let rating: ContrastResult['rating'];
  if (ratio >= WCAG_CONTRAST_RATIOS.AAA_NORMAL) {
    rating = 'excellent';
  } else if (ratio >= WCAG_CONTRAST_RATIOS.AA_NORMAL) {
    rating = 'good';
  } else if (ratio >= WCAG_CONTRAST_RATIOS.AA_LARGE) {
    rating = 'fair';
  } else {
    rating = 'poor';
  }

  return {
    ratio,
    passAA,
    passAAA,
    rating,
  };
}
```

**테스트 케이스**:
- Black on White → 21:1 (최대)
- White on White → 1:1 (최소)

**완료 조건**: 대비율 계산 정확성 검증

---

## Task #5.28: WCAG 검증

- **파일**: `src/utils/colorPicker/accessibility/wcag.ts`
- **시간**: 20분
- **의존성**: Task #5.1, #5.27

```typescript
import { Color, WCAGLevel } from '../../../types/colorPicker';
import { getContrastRatio } from './contrast';
import { WCAG_CONTRAST_RATIOS } from '../../../constants/colors';

/**
 * WCAG 레벨 검증 (일반 텍스트)
 */
export function checkWCAG(
  foreground: Color,
  background: Color,
  level: WCAGLevel
): boolean {
  const ratio = getContrastRatio(foreground, background);

  const threshold = level === 'AA'
    ? WCAG_CONTRAST_RATIOS.AA_NORMAL
    : WCAG_CONTRAST_RATIOS.AAA_NORMAL;

  return ratio >= threshold;
}

/**
 * WCAG 레벨 검증 (큰 텍스트)
 */
export function checkWCAGLargeText(
  foreground: Color,
  background: Color,
  level: WCAGLevel
): boolean {
  const ratio = getContrastRatio(foreground, background);

  const threshold = level === 'AA'
    ? WCAG_CONTRAST_RATIOS.AA_LARGE
    : WCAG_CONTRAST_RATIOS.AAA_LARGE;

  return ratio >= threshold;
}

/**
 * 모든 WCAG 레벨 결과
 */
export interface WCAGResult {
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
  ratio: number;
}

export function getWCAGResult(
  foreground: Color,
  background: Color
): WCAGResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    normalAA: ratio >= WCAG_CONTRAST_RATIOS.AA_NORMAL,
    normalAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA_NORMAL,
    largeAA: ratio >= WCAG_CONTRAST_RATIOS.AA_LARGE,
    largeAAA: ratio >= WCAG_CONTRAST_RATIOS.AAA_LARGE,
    ratio,
  };
}
```

**완료 조건**: WCAG 검증 정확성 확인

---

## Task #5.29: 접근성 만족 색상 제안

- **파일**: `src/utils/colorPicker/accessibility/suggestions.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.27, #5.28

```typescript
import { Color, WCAGLevel } from '../../../types/colorPicker';
import { getContrastRatio } from './contrast';
import { checkWCAG } from './wcag';
import { createColorFromHsl } from '../colorFactory';
import { WCAG_CONTRAST_RATIOS } from '../../../constants/colors';

/**
 * 접근성을 만족하는 색상 제안
 * Lightness를 조정하여 대비율 만족
 */
export function suggestAccessibleColor(
  foreground: Color,
  background: Color,
  level: WCAGLevel = 'AA'
): Color | null {
  // 이미 만족하면 원본 반환
  if (checkWCAG(foreground, background, level)) {
    return foreground;
  }

  const targetRatio = level === 'AA'
    ? WCAG_CONTRAST_RATIOS.AA_NORMAL
    : WCAG_CONTRAST_RATIOS.AAA_NORMAL;

  const fgHsl = foreground.hsl;

  // Lightness를 0부터 100까지 시도
  for (let l = 0; l <= 100; l += 5) {
    const testColor = createColorFromHsl({
      h: fgHsl.h,
      s: fgHsl.s,
      l,
    });

    const ratio = getContrastRatio(testColor, background);

    if (ratio >= targetRatio) {
      return testColor;
    }
  }

  return null;
}

/**
 * 대비율을 만족하는 텍스트 색상 제안
 * 배경에 따라 검은색 또는 흰색 반환
 */
export function getReadableTextColor(background: Color): Color {
  const whiteColor = createColorFromHsl({ h: 0, s: 0, l: 100 });
  const blackColor = createColorFromHsl({ h: 0, s: 0, l: 0 });

  const whiteRatio = getContrastRatio(whiteColor, background);
  const blackRatio = getContrastRatio(blackColor, background);

  return whiteRatio > blackRatio ? whiteColor : blackColor;
}
```

**완료 조건**: 제안 색상 정확성 검증

---

## Task #5.30: 접근성 리포트 생성

- **파일**: `src/utils/colorPicker/accessibility/report.ts`
- **시간**: 15분
- **의존성**: Task #5.1, #5.27, #5.28

```typescript
import { Color } from '../../../types/colorPicker';
import { getWCAGResult, WCAGResult } from './wcag';
import { getReadableTextColor } from './suggestions';

/**
 * 접근성 리포트
 */
export interface AccessibilityReport {
  wcag: WCAGResult;
  readableTextColor: Color;
  recommendations: string[];
}

/**
 * 접근성 리포트 생성
 */
export function generateAccessibilityReport(
  foreground: Color,
  background: Color
): AccessibilityReport {
  const wcag = getWCAGResult(foreground, background);
  const readableTextColor = getReadableTextColor(background);

  const recommendations: string[] = [];

  if (!wcag.normalAA) {
    recommendations.push('일반 텍스트에 대한 AA 기준을 만족하지 않습니다.');
  }

  if (!wcag.normalAAA) {
    recommendations.push('일반 텍스트에 대한 AAA 기준을 만족하지 않습니다.');
  }

  if (wcag.largeAA && !wcag.normalAA) {
    recommendations.push('큰 텍스트(18pt 이상 또는 14pt 굵게)만 사용하세요.');
  }

  if (wcag.ratio < 3) {
    recommendations.push('대비율이 너무 낮습니다. 색상을 변경하세요.');
  }

  return {
    wcag,
    readableTextColor,
    recommendations,
  };
}
```

**완료 조건**: 리포트 생성 검증

---

**완료 후 다음 단계**: [Phase 5: Storage 및 컬렉션](./TASK-05-phase-05-storage.md)
