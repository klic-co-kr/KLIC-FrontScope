import { ImageAsset, DownloadOptions } from '../../../types/assetManager';
import { downloadZip } from './zipArchive';
import { downloadImage } from './downloadImage';
import { generateFilename } from './filenameGenerator';

/**
 * 모든 에셋 다운로드
 */
export async function downloadAllAssets(
  assets: ImageAsset[],
  options: DownloadOptions
): Promise<{ success: number; failed: number }> {
  if (options.format === 'zip') {
    const success = await downloadZip(assets, options);

    return {
      success: success ? assets.length : 0,
      failed: success ? 0 : assets.length,
    };
  }

  // 개별 다운로드
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const filename = generateFilename(asset, options.filenamePattern as 'original' | 'numbered' | 'hash' | undefined, i);

    const success = await downloadImage(asset, filename);

    if (success) {
      successCount++;
    } else {
      failedCount++;
    }

    // 브라우저 다운로드 제한 방지 (딜레이)
    if (i < assets.length - 1) {
      await delay(100);
    }
  }

  return {
    success: successCount,
    failed: failedCount,
  };
}

/**
 * 딜레이 유틸리티
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
