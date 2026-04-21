import { ImageAsset } from '../../../types/assetManager';
import { dataUriToBlob } from './downloadImage';

/**
 * 이미지를 클립보드에 복사
 */
export async function copyImageToClipboard(asset: ImageAsset): Promise<boolean> {
  try {
    let blob: Blob;

    // Data URI 처리
    if (asset.url.startsWith('data:')) {
      blob = await dataUriToBlob(asset.url);
    } else {
      // HTTP 다운로드
      const response = await fetch(asset.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      blob = await response.blob();
    }

    // 클립보드에 복사
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}

/**
 * 이미지 URL을 클립보드에 복사
 */
export async function copyImageUrlToClipboard(asset: ImageAsset): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(asset.url);
    return true;
  } catch (error) {
    console.error('Failed to copy URL to clipboard:', error);
    return false;
  }
}

/**
 * Base64를 클립보드에 복사
 */
export async function copyBase64ToClipboard(asset: ImageAsset): Promise<boolean> {
  try {
    let base64: string;

    if (asset.url.startsWith('data:')) {
      base64 = asset.url;
    } else {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      base64 = await blobToBase64(blob);
    }

    await navigator.clipboard.writeText(base64);
    return true;
  } catch (error) {
    console.error('Failed to copy base64 to clipboard:', error);
    return false;
  }
}

/**
 * Blob을 Base64로 변환
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}
