import { ImageAsset } from '../../../types/assetManager';
import { resolveURL } from '../urlResolver';
import { getImageType } from '../imageDetector';
import { generateUUID } from '../../common/uuid';
import { getSelector } from '../../dom/selectorGenerator';

/**
 * SVG 태그에서 에셋 추출
 */
export function createAssetFromSVG(svg: SVGSVGElement): ImageAsset | null {
  try {
    // Inline SVG를 Data URI로 변환
    const svgString = new XMLSerializer().serializeToString(svg);
    const dataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

    const viewBox = svg.viewBox.baseVal;
    const width = viewBox.width || svg.width.baseVal.value || 100;
    const height = viewBox.height || svg.height.baseVal.value || 100;

    const asset: ImageAsset = {
      id: generateUUID(),
      url: dataUri,
      type: 'svg',
      source: 'svg-tag',
      dimensions: {
        width,
        height,
      },
      size: new Blob([svgString]).size,
      format: 'svg',
      element: {
        tagName: 'SVG',
        selector: getSelector(svg),
      },
      metadata: {
        isLazyLoaded: false,
        isBackgroundImage: false,
        isDataUri: true,
        isOptimized: false,
        aspectRatio: width / height,
      },
    };

    return asset;
  } catch (error) {
    console.error('Failed to create asset from SVG:', error);
    return null;
  }
}

/**
 * SVG의 href 속성에서 이미지 추출
 */
export function extractImagesFromSVG(svg: SVGSVGElement): ImageAsset[] {
  const assets: ImageAsset[] = [];

  try {
    // <image> 태그 검색
    const imageElements = svg.querySelectorAll<SVGImageElement>('image');

    imageElements.forEach((image) => {
      const href = image.href.baseVal || image.getAttribute('xlink:href');

      if (!href) {
        return;
      }

      const url = resolveURL(href);

      const asset: ImageAsset = {
        id: generateUUID(),
        url,
        type: 'svg',
        source: 'svg-tag',
        format: url.startsWith('data:') ? 'data-uri' : getImageType(url),
        element: {
          tagName: 'SVG',
          selector: getSelector(svg),
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
  } catch (error) {
    console.error('Failed to extract images from SVG:', error);
  }

  return assets;
}
