import { ImageAsset, AssetCollection, AssetManagerSettings } from '../../types/assetManager';
import { createAssetFromImg } from './extractors/imgExtractor';
import { createAssetFromBackground, extractAllBackgroundImages } from './extractors/backgroundExtractor';
import { createAssetFromPicture } from './extractors/pictureExtractor';
import { createAssetFromSVG, extractImagesFromSVG } from './extractors/svgExtractor';
import { deduplicateAssets, filterByMinSize, filterByMinDimensions } from './deduplicator';
import { batchGetImageSizes } from './imageMeasure';

/**
 * 페이지의 모든 에셋 추출
 */
export async function extractAssets(
  settings: AssetManagerSettings
): Promise<AssetCollection> {
  const assets: ImageAsset[] = [];

  try {
    // 1. IMG 태그 추출
    const imgElements = document.querySelectorAll<HTMLImageElement>('img');
    imgElements.forEach((img) => {
      const asset = createAssetFromImg(img);
      if (asset) {
        assets.push(asset);
      }
    });

    // 2. Background 이미지 추출 (옵션)
    if (settings.includeBackgroundImages) {
      const backgroundAssets = extractAllBackgroundImages();
      assets.push(...backgroundAssets);
    }

    // 3. Picture 태그 추출
    const pictureElements = document.querySelectorAll<HTMLPictureElement>('picture');
    pictureElements.forEach((picture) => {
      const pictureAssets = createAssetFromPicture(picture);
      assets.push(...pictureAssets);
    });

    // 4. SVG 추출 (옵션)
    if (settings.includeSvg) {
      const svgElements = document.querySelectorAll<SVGSVGElement>('svg');
      svgElements.forEach((svg) => {
        const asset = createAssetFromSVG(svg);
        if (asset) {
          assets.push(asset);
        }

        // SVG 내부 이미지도 추출
        const svgImages = extractImagesFromSVG(svg);
        assets.push(...svgImages);
      });
    }

    // 5. 중복 제거
    let deduplicated = deduplicateAssets(assets);

    // 6. Data URI 필터링 (옵션)
    if (!settings.includeDataUri) {
      deduplicated = deduplicated.filter(asset => !asset.metadata?.isDataUri);
    }

    // 7. 최소 크기 필터링
    if (settings.minImageSize > 0) {
      deduplicated = filterByMinSize(deduplicated, settings.minImageSize);
    }

    // 8. 최소 dimensions 필터링
    if (settings.minDimensions.width > 0 || settings.minDimensions.height > 0) {
      deduplicated = filterByMinDimensions(
        deduplicated,
        settings.minDimensions.width,
        settings.minDimensions.height
      );
    }

    // 9. 크기 정보 배치 가져오기
    const urls = deduplicated
      .filter(asset => !asset.size && !asset.metadata?.isDataUri)
      .map(asset => asset.url);

    const sizes = await batchGetImageSizes(urls);

    deduplicated.forEach((asset) => {
      if (!asset.size && sizes.has(asset.url)) {
        asset.size = sizes.get(asset.url);
      }
    });

    // 10. 총 크기 계산
    const totalSize = deduplicated.reduce((sum, asset) => sum + (asset.size || 0), 0);

    const collection: AssetCollection = {
      id: crypto.randomUUID(),
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      assets: deduplicated,
      images: deduplicated,
      totalSize,
      extractedAt: Date.now(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      stats: {
        totalCount: deduplicated.length,
        totalSize,
        byType: {} as Record<string, number>,
        byFormat: {} as Record<string, number>,
      },
    };

    return collection;
  } catch (error) {
    console.error('Failed to extract assets:', error);

    return {
      id: crypto.randomUUID(),
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      assets: [],
      images: [],
      totalSize: 0,
      extractedAt: Date.now(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      stats: {
        totalCount: 0,
        totalSize: 0,
        byType: {} as Record<string, number>,
        byFormat: {} as Record<string, number>,
      },
    };
  }
}

/**
 * 특정 요소 내의 에셋만 추출
 */
export async function extractAssetsFromElement(
  element: HTMLElement,
  settings: AssetManagerSettings
): Promise<ImageAsset[]> {
  const assets: ImageAsset[] = [];

  // IMG 태그
  const imgElements = element.querySelectorAll<HTMLImageElement>('img');
  imgElements.forEach((img) => {
    const asset = createAssetFromImg(img);
    if (asset) {
      assets.push(asset);
    }
  });

  // Background 이미지
  if (settings.includeBackgroundImages) {
    const backgroundAssets = createAssetFromBackground(element);
    assets.push(...backgroundAssets);

    const childElements = element.querySelectorAll<HTMLElement>('*');
    childElements.forEach((child) => {
      const childAssets = createAssetFromBackground(child);
      assets.push(...childAssets);
    });
  }

  // SVG
  if (settings.includeSvg) {
    const svgElements = element.querySelectorAll<SVGSVGElement>('svg');
    svgElements.forEach((svg) => {
      const asset = createAssetFromSVG(svg);
      if (asset) {
        assets.push(asset);
      }
    });
  }

  return deduplicateAssets(assets);
}
