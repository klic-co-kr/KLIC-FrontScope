import { ImageAsset } from '../../../types/assetManager';
import { resolveURL, extractURLsFromCSS } from '../urlResolver';
import { getImageType } from '../imageDetector';
import { generateUUID } from '../../common/uuid';
import { getSelector } from '../../dom/selectorGenerator';

/**
 * CSS background-image에서 에셋 추출
 */
export function createAssetFromBackground(element: HTMLElement): ImageAsset[] {
  const assets: ImageAsset[] = [];

  try {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;

    if (!backgroundImage || backgroundImage === 'none') {
      return assets;
    }

    // 여러 배경 이미지 지원 (url(...), url(...))
    const urls = extractURLsFromCSS(backgroundImage);

    for (const url of urls) {
      const resolvedUrl = resolveURL(url);

      if (!resolvedUrl) {
        continue;
      }

      const asset: ImageAsset = {
        id: generateUUID(),
        url: resolvedUrl,
        type: 'background',
        source: 'background-css',
        dimensions: {
          width: element.offsetWidth,
          height: element.offsetHeight,
        },
        format: getImageType(resolvedUrl),
        element: {
          tagName: element.tagName,
          selector: getSelector(element),
        },
        metadata: {
          isLazyLoaded: false,
          isBackgroundImage: true,
          isDataUri: resolvedUrl.startsWith('data:'),
          isOptimized: false,
          aspectRatio: element.offsetWidth / element.offsetHeight,
        },
      };

      assets.push(asset);
    }
  } catch (error) {
    console.error('Failed to create asset from background:', error);
  }

  return assets;
}

/**
 * 페이지의 모든 배경 이미지 추출
 */
export function extractAllBackgroundImages(): ImageAsset[] {
  const assets: ImageAsset[] = [];

  // 모든 요소 순회
  const elements = document.querySelectorAll<HTMLElement>('*');

  elements.forEach((element) => {
    const backgroundAssets = createAssetFromBackground(element);
    assets.push(...backgroundAssets);
  });

  return assets;
}
