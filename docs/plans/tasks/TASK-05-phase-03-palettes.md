# Phase 3: 컬러피커 - 팔레트 생성

**태스크 범위**: Task #5.19 ~ #5.25 (7개)
**예상 시간**: 3시간
**의존성**: Phase 1, Phase 2 완료

---

## Task #5.19: 유사색 생성

- **파일**: `src/utils/colorPicker/palettes/analogous.ts`
- **시간**: 25분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 유사색 팔레트 생성
 * Hue를 기준으로 ±30도 범위의 색상들
 */
export function generateAnalogous(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 5;
  const variation = options?.variation || 30; // 기본 30도

  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // 중앙에 기본 색상
  const centerIndex = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const offset = (i - centerIndex) * (variation / (count - 1));
    const newHue = (baseHsl.h + offset + 360) % 360;

    const newColor = createColorFromHsl({
      h: newHue,
      s: baseHsl.s,
      l: baseHsl.l,
    });

    colors.push(newColor);
  }

  return colors;
}
```

**완료 조건**: 유사색 정확성 검증

---

## Task #5.20: 보색 생성

- **파일**: `src/utils/colorPicker/palettes/complementary.ts`
- **시간**: 20분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 보색 팔레트 생성
 * Hue를 180도 회전
 */
export function generateComplementary(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  const complementaryHue = (baseHsl.h + 180) % 360;

  const complementaryColor = createColorFromHsl({
    h: complementaryHue,
    s: baseHsl.s,
    l: baseHsl.l,
  });

  colors.push(complementaryColor);

  return colors;
}

/**
 * 분할 보색 생성
 * 보색 양옆의 색상들
 */
export function generateSplitComplementary(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;
  const variation = options?.variation || 30;

  const complementaryHue = (baseHsl.h + 180) % 360;

  // 보색 기준 +/- variation
  const hue1 = (complementaryHue - variation + 360) % 360;
  const hue2 = (complementaryHue + variation) % 360;

  colors.push(
    createColorFromHsl({ h: hue1, s: baseHsl.s, l: baseHsl.l }),
    createColorFromHsl({ h: hue2, s: baseHsl.s, l: baseHsl.l })
  );

  return colors;
}
```

**완료 조건**: 보색 정확성 검증

---

## Task #5.21: 3색 조합 생성

- **파일**: `src/utils/colorPicker/palettes/triadic.ts`
- **시간**: 20분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 3색 조합 팔레트 생성
 * Hue를 120도씩 회전
 */
export function generateTriadic(baseColor: Color): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  for (let i = 1; i < 3; i++) {
    const newHue = (baseHsl.h + i * 120) % 360;

    const newColor = createColorFromHsl({
      h: newHue,
      s: baseHsl.s,
      l: baseHsl.l,
    });

    colors.push(newColor);
  }

  return colors;
}
```

**완료 조건**: 3색 조합 정확성 검증

---

## Task #5.22: 4색 조합 생성

- **파일**: `src/utils/colorPicker/palettes/tetradic.ts`
- **시간**: 20분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';

/**
 * 4색 조합 팔레트 생성 (사각형)
 * Hue를 90도씩 회전
 */
export function generateTetradic(baseColor: Color): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  for (let i = 1; i < 4; i++) {
    const newHue = (baseHsl.h + i * 90) % 360;

    const newColor = createColorFromHsl({
      h: newHue,
      s: baseHsl.s,
      l: baseHsl.l,
    });

    colors.push(newColor);
  }

  return colors;
}

/**
 * 직사각형 4색 조합
 */
export function generateSquare(baseColor: Color, offset: number = 60): Color[] {
  const colors: Color[] = [baseColor];
  const baseHsl = baseColor.hsl;

  const hues = [
    baseHsl.h,
    (baseHsl.h + offset) % 360,
    (baseHsl.h + 180) % 360,
    (baseHsl.h + 180 + offset) % 360,
  ];

  for (let i = 1; i < hues.length; i++) {
    colors.push(
      createColorFromHsl({
        h: hues[i],
        s: baseHsl.s,
        l: baseHsl.l,
      })
    );
  }

  return colors;
}
```

**완료 조건**: 4색 조합 정확성 검증

---

## Task #5.23: 단색 조합 생성

- **파일**: `src/utils/colorPicker/palettes/monochromatic.ts`
- **시간**: 25분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 단색 조합 팔레트 생성
 * 같은 Hue, 다른 Lightness
 */
export function generateMonochromatic(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 7;
  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // Lightness를 10%부터 90%까지 균등 분배
  const minLightness = 10;
  const maxLightness = 90;
  const step = (maxLightness - minLightness) / (count - 1);

  for (let i = 0; i < count; i++) {
    const lightness = clamp(minLightness + i * step, 0, 100);

    const newColor = createColorFromHsl({
      h: baseHsl.h,
      s: baseHsl.s,
      l: Math.round(lightness),
    });

    colors.push(newColor);
  }

  return colors;
}
```

**완료 조건**: 단색 조합 정확성 검증

---

## Task #5.24: 명암 변화 생성

- **파일**: `src/utils/colorPicker/palettes/shades.ts`
- **시간**: 25분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 명암(Shades) 팔레트 생성
 * Lightness를 줄여서 어둡게
 */
export function generateShades(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 7;
  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // 기본 색상부터 거의 검은색까지
  const minLightness = 5;
  const step = (baseHsl.l - minLightness) / (count - 1);

  for (let i = 0; i < count; i++) {
    const lightness = clamp(baseHsl.l - i * step, 0, 100);

    const newColor = createColorFromHsl({
      h: baseHsl.h,
      s: baseHsl.s,
      l: Math.round(lightness),
    });

    colors.push(newColor);
  }

  return colors;
}
```

**완료 조건**: 명암 변화 정확성 검증

---

## Task #5.25: 색조 변화 생성

- **파일**: `src/utils/colorPicker/palettes/tints.ts`
- **시간**: 25분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color, PaletteOptions } from '../../../types/colorPicker';
import { createColorFromHsl } from '../colorFactory';
import { clamp } from '../helpers';

/**
 * 색조(Tints) 팔레트 생성
 * Lightness를 높여서 밝게
 */
export function generateTints(
  baseColor: Color,
  options?: Partial<PaletteOptions>
): Color[] {
  const count = options?.count || 7;
  const colors: Color[] = [];
  const baseHsl = baseColor.hsl;

  // 기본 색상부터 거의 흰색까지
  const maxLightness = 95;
  const step = (maxLightness - baseHsl.l) / (count - 1);

  for (let i = 0; i < count; i++) {
    const lightness = clamp(baseHsl.l + i * step, 0, 100);

    const newColor = createColorFromHsl({
      h: baseHsl.h,
      s: baseHsl.s,
      l: Math.round(lightness),
    });

    colors.push(newColor);
  }

  return colors;
}
```

**완료 조건**: 색조 변화 정확성 검증

---

**완료 후 다음 단계**: [Phase 4: 대비율 및 접근성](./TASK-05-phase-04-accessibility.md)
