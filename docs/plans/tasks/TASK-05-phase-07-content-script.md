# Phase 7: 컬러피커 - Content Script

**태스크 범위**: Task #5.43 ~ #5.44 (2개)
**예상 시간**: 1시간
**의존성**: Phase 1, Phase 2 완료

---

## Task #5.43: EyeDropper 통합

- **파일**: `src/content/colorPicker/eyeDropper.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color } from '../../types/colorPicker';
import { createColorFromHex } from '../../utils/colorPicker/colorFactory';

/**
 * EyeDropper API 지원 여부 확인
 */
export function isEyeDropperSupported(): boolean {
  return 'EyeDropper' in window;
}

/**
 * EyeDropper로 색상 추출
 */
export async function pickColorWithEyeDropper(): Promise<Color | null> {
  try {
    if (!isEyeDropperSupported()) {
      throw new Error('EyeDropper API not supported');
    }

    const eyeDropper = new (window as any).EyeDropper();
    const result = await eyeDropper.open();

    if (result.sRGBHex) {
      return createColorFromHex(result.sRGBHex);
    }

    return null;
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      // 사용자가 취소한 경우
      return null;
    }

    console.error('Failed to pick color:', error);
    return null;
  }
}
```

**완료 조건**: EyeDropper 동작 검증

---

## Task #5.44: Fallback 색상 추출

- **파일**: `src/content/colorPicker/fallback.ts`
- **시간**: 30분
- **의존성**: Task #5.1, #5.15

```typescript
import { Color } from '../../types/colorPicker';
import { createColorFromHex } from '../../utils/colorPicker/colorFactory';
import { rgbToHex } from '../../utils/colorPicker/conversions/hexRgb';

/**
 * 마우스 위치의 색상 추출 (Canvas 사용)
 * EyeDropper API 미지원 브라우저용
 */
export async function pickColorAtPoint(x: number, y: number): Promise<Color | null> {
  try {
    // 스크린샷 캡처
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: 'screen' } as any,
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(video, 0, 0);

    stream.getTracks().forEach((track) => track.stop());

    // 픽셀 색상 추출
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;

    const hex = rgbToHex({ r, g, b });

    return createColorFromHex(hex);
  } catch (error) {
    console.error('Failed to pick color at point:', error);
    return null;
  }
}
```

**완료 조건**: Fallback 동작 검증

---

**완료 후 다음 단계**: [Phase 8: 테스트](./TASK-05-phase-08-testing.md)
