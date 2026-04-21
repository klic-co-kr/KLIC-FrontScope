import JSZip from 'jszip';
import { ImageAsset, DownloadOptions } from '../../../types/assetManager';
import { generateFilename, resolveFilenameConflict } from './filenameGenerator';
import { dataUriToBlob } from './downloadImage';

/**
 * ZIP 아카이브 생성
 */
export async function createZipArchive(
  assets: ImageAsset[],
  options: DownloadOptions
): Promise<Blob> {
  const zip = new JSZip();
  const usedFilenames = new Set<string>();

  // 메타데이터 추가
  if (options.includeMetadata) {
    const metadata = {
      totalImages: assets.length,
      extractedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      assets: assets.map(asset => ({
        filename: '',
        url: asset.url,
        type: asset.type,
        format: asset.format,
        dimensions: asset.dimensions,
        size: asset.size,
      })),
    };

    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  // 이미지 폴더
  const imagesFolder = zip.folder('images');

  if (!imagesFolder) {
    throw new Error('Failed to create images folder');
  }

  // 각 이미지 추가
  const promises = assets.map(async (asset, index) => {
    try {
      let blob: Blob;

      // Data URI 처리
      if (asset.url.startsWith('data:')) {
        blob = await dataUriToBlob(asset.url);
      } else {
        // HTTP 다운로드
        const response = await fetch(asset.url);

        if (!response.ok) {
          console.error(`Failed to fetch: ${asset.url}`);
          return;
        }

        blob = await response.blob();
      }

      // 파일명 생성
      let filename = generateFilename(asset, options.filenamePattern as 'original' | 'numbered' | 'hash' | undefined, index);
      filename = resolveFilenameConflict(filename, usedFilenames);
      usedFilenames.add(filename);

      // ZIP에 추가
      imagesFolder.file(filename, blob);
    } catch (error) {
      console.error(`Failed to add image to zip: ${asset.url}`, error);
    }
  });

  await Promise.allSettled(promises);

  // ZIP 생성
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  return zipBlob;
}

/**
 * ZIP 다운로드
 */
export async function downloadZip(
  assets: ImageAsset[],
  options: DownloadOptions,
  filename: string = 'images.zip'
): Promise<boolean> {
  try {
    const zipBlob = await createZipArchive(assets, options);

    const url = URL.createObjectURL(zipBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error('Failed to download zip:', error);
    return false;
  }
}
