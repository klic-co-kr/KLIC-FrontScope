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
      video: { mediaSource: 'screen' } as MediaTrackConstraints,
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
