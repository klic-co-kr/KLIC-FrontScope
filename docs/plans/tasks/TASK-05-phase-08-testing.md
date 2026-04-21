# Phase 8: 컬러피커 - 테스트

**태스크 범위**: Task #5.45 (1개)
**예상 시간**: 2시간
**의존성**: 모든 이전 Phase 완료

---

## Task #5.45: 단위 및 통합 테스트

- **파일**: `src/utils/colorPicker/__tests__/colorPicker.test.ts`
- **시간**: 2시간
- **의존성**: 모든 이전 태스크

```typescript
import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex } from '../conversions/hexRgb';
import { rgbToHsl, hslToRgb } from '../conversions/rgbHsl';
import { rgbToHsv, hsvToRgb } from '../conversions/rgbHsv';
import { getRelativeLuminance } from '../accessibility/luminance';
import { getContrastRatio } from '../accessibility/contrast';
import { generateAnalogous } from '../palettes/analogous';
import { generateComplementary } from '../palettes/complementary';
import { createColorFromHex } from '../colorFactory';

describe('Color Conversions', () => {
  describe('HEX <-> RGB', () => {
    it('should convert HEX to RGB', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert RGB to HEX', () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000');
    });

    it('should handle 3-digit HEX', () => {
      expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe('RGB <-> HSL', () => {
    it('should convert RGB to HSL', () => {
      const red = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(red.h).toBe(0);
      expect(red.s).toBe(100);
      expect(red.l).toBe(50);
    });

    it('should convert HSL to RGB', () => {
      const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });
  });

  describe('RGB <-> HSV', () => {
    it('should convert RGB to HSV', () => {
      const hsv = rgbToHsv({ r: 255, g: 0, b: 0 });
      expect(hsv.h).toBe(0);
      expect(hsv.s).toBe(100);
      expect(hsv.v).toBe(100);
    });

    it('should convert HSV to RGB', () => {
      const rgb = hsvToRgb({ h: 0, s: 100, v: 100 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });
  });
});

describe('Accessibility', () => {
  it('should calculate relative luminance', () => {
    expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
    expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it('should calculate contrast ratio', () => {
    const white = createColorFromHex('#FFFFFF');
    const black = createColorFromHex('#000000');

    expect(getContrastRatio(black, white)).toBe(21);
    expect(getContrastRatio(white, white)).toBe(1);
  });
});

describe('Palettes', () => {
  const baseColor = createColorFromHex('#FF0000');

  it('should generate analogous palette', () => {
    const palette = generateAnalogous(baseColor, { count: 5 });
    expect(palette.length).toBe(5);
  });

  it('should generate complementary palette', () => {
    const palette = generateComplementary(baseColor);
    expect(palette.length).toBe(2);
    expect(palette[1].hsl.h).toBe((baseColor.hsl.h + 180) % 360);
  });
});
```

### 테스트 항목

1. **색상 변환**
   - HEX ↔ RGB 변환 정확성
   - RGB ↔ HSL 변환 정확성
   - RGB ↔ HSV 변환 정확성
   - HEX ↔ HSL 변환 정확성

2. **상대 밝기 계산**
   - White (1.0), Black (0.0)
   - 회색 톤 정확성

3. **대비율 계산**
   - Black on White = 21:1
   - White on White = 1:1

4. **팔레트 생성**
   - 유사색: Hue 범위 ±30도
   - 보색: Hue + 180도
   - 3색 조합: 120도 간격
   - 4색 조합: 90도 간격

5. **Storage 동작**
   - 색상 추가/삭제
   - 컬렉션 CRUD
   - 즐겨찾기 토글

6. **컬렉션 관리**
   - 최대 개수 제한
   - 색상 추가/제거

**완료 조건**: 80% 이상 테스트 커버리지

---

## 테스트 실행 명령어

```bash
# 단위 테스트
npm test src/utils/colorPicker/__tests__/colorPicker.test.ts

# 커버리지 확인
npm test -- --coverage

# E2E 테스트
npm test e2e/colorPicker.spec.ts
```

---

**전체 완료 후**: 도구 #6 구현 시작
