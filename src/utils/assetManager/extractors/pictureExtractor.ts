import { ImageAsset } from '../../../types/assetManager';
import { resolveURL } from '../urlResolver';
import { getImageType } from '../imageDetector';
import { generateUUID } from '../../common/uuid';
import { getSelector } from '../../dom/selectorGenerator';

/**
 * Picture 태그에서 에셋 추출
 */
export function createAssetFromPicture(picture: HTMLPictureElement): ImageAsset[] {
  const assets: ImageAsset[] = [];

  try {
    // source 태그들 순회
    const sources = picture.querySelectorAll<HTMLSourceElement>('source');

    sources.forEach((source) => {
      const srcset = source.srcset;

      if (!srcset) {
        return;
      }

      // srcset의 모든 URL 추출
      const urls = srcset.split(',').map(src => {
        const url = src.trim().split(/\s+/)[0];
        return resolveURL(url);
      });

      urls.forEach((url) => {
        const asset: ImageAsset = {
          id: generateUUID(),
          url,
          type: 'picture',
          source: 'picture-tag',
          format: getImageType(url),
          element: {
            tagName: 'PICTURE',
            selector: getSelector(picture),
            srcset: source.srcset,
          },
          metadata: {
            isLazyLoaded: false,
            isBackgroundImage: false,
            isDataUri: url.startsWith('data:'),
            isOptimized: false,
            aspectRatio: 0,
          },
        };

        assets.push(asset);
      });
    });

    // img fallback도 추출
    const img = picture.querySelector<HTMLImageElement>('img');
    if (img && img.src) {
      const url = resolveURL(img.currentSrc || img.src);

      const asset: ImageAsset = {
        id: generateUUID(),
        url,
        type: 'picture',
        source: 'picture-tag',
        dimensions: {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        },
        format: getImageType(url),
        element: {
          tagName: 'PICTURE',
          selector: getSelector(picture),
          alt: img.alt,
        },
        metadata: {
          isLazyLoaded: false,
          isBackgroundImage: false,
          isDataUri: url.startsWith('data:'),
          isOptimized: false,
          aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
        },
      };

      assets.push(asset);
    }
  } catch (error) {
    console.error('Failed to create asset from picture:', error);
  }

  return assets;
}
