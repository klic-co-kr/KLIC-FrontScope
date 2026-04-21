import { ImageAsset } from '../../../types/assetManager';
import { getFilename } from './filenameGenerator';

/**
 * 단일 이미지 다운로드
 */
export async function downloadImage(asset: ImageAsset, filename?: string): Promise<boolean> {
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

    // 다운로드
    const finalFilename = filename || getFilename(asset);
    await downloadBlob(blob, finalFilename);

    return true;
  } catch (error) {
    console.error('Failed to download image:', asset.url, error);
    return false;
  }
}

/**
 * Data URI를 Blob으로 변환
 */
export function dataUriToBlob(dataUri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const [header, data] = dataUri.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

      const isBase64 = header.includes('base64');

      let byteString: string;
      if (isBase64) {
        byteString = atob(data);
      } else {
        byteString = decodeURIComponent(data);
      }

      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([uint8Array], { type: mime });
      resolve(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Blob 다운로드
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);

  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
