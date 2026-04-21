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

    const eyeDropper = new (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper!();
    const result = await eyeDropper.open();

    if (result.sRGBHex) {
      return createColorFromHex(result.sRGBHex);
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // 사용자가 취소한 경우
      return null;
    }

    console.error('Failed to pick color:', error);
    return null;
  }
}
