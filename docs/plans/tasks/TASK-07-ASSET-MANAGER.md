# 도구 #7: 에셋 관리 - 완전 태스크 분해

**총 태스크**: 40개
**예상 시간**: 16-20시간 (2-2.5일)
**작성일**: 2026-02-09

---

## 📑 목차

- [Phase 1: 기반 설정 (6개 태스크, 2시간)](#phase-1-기반-설정)
- [Phase 2: 이미지 추출 (12개 태스크, 6시간)](#phase-2-이미지-추출)
- [Phase 3: 다운로드 및 압축 (8개 태스크, 4시간)](#phase-3-다운로드-및-압축)
- [Phase 4: 이미지 분석 (5개 태스크, 2시간)](#phase-4-이미지-분석)
- [Phase 5: Storage 관리 (3개 태스크, 1.5시간)](#phase-5-storage-관리)
- [Phase 6: React 컴포넌트 (5개 태스크, 3시간)](#phase-6-react-컴포넌트)
- [Phase 7: 테스트 (1개 태스크, 1.5시간)](#phase-7-테스트)

---

## Phase 1: 기반 설정 (6개 태스크, 2시간)

### Task #7.1: 타입 정의 - 기본 인터페이스
- **파일**: `src/types/assetManager.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 이미지 에셋 정보
 */
export interface ImageAsset {
  id: string;                      // UUID
  url: string;                     // 원본 URL (절대 경로)
  type: ImageType;                 // 이미지 타입
  source: ImageSource;             // 추출 소스
  dimensions?: {
    width: number;
    height: number;
  };
  size?: number;                   // 파일 크기 (bytes)
  format?: string;                 // 'png', 'jpg', 'webp', 'svg' etc
  element?: {
    tagName: string;               // 'IMG', 'DIV', 'SVG' etc
    selector: string;              // CSS selector
    alt?: string;                  // alt 속성
    srcset?: string;               // srcset 속성
    dataSrc?: string;              // 레이지 로딩 속성
  };
  metadata?: {
    isLazyLoaded: boolean;
    isBackgroundImage: boolean;
    isDataUri: boolean;
    isOptimized: boolean;
    aspectRatio: number;
  };
}

/**
 * 이미지 타입
 */
export type ImageType = 'img' | 'background' | 'picture' | 'svg' | 'icon' | 'other';

/**
 * 이미지 소스
 */
export type ImageSource = 'img-tag' | 'background-css' | 'picture-tag' | 'svg-tag' | 'inline-svg' | 'data-uri';

/**
 * 에셋 컬렉션
 */
export interface AssetCollection {
  images: ImageAsset[];
  totalSize: number;               // 전체 크기 (bytes)
  extractedAt: number;             // 추출 시간
  pageUrl: string;                 // 페이지 URL
  pageTitle: string;               // 페이지 제목
}

/**
 * 다운로드 옵션
 */
export interface DownloadOptions {
  format?: 'zip' | 'folder';       // 다운로드 형식
  includeMetadata?: boolean;       // 메타데이터 포함
  filenamePattern?: string;        // 파일명 패턴: 'original', 'numbered', 'hash'
  quality?: number;                // 이미지 품질 (0-1)
  convertFormat?: string;          // 변환 포맷: 'png', 'jpg', 'webp'
  maxSize?: number;                // 최대 크기 (bytes)
  minDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * 이미지 분석 결과
 */
export interface ImageAnalysis {
  url: string;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  size: number;
  isOptimized: boolean;
  suggestions: OptimizationSuggestion[];
  lazyLoadDetection: {
    isLazyLoaded: boolean;
    method?: 'native' | 'intersection-observer' | 'data-src' | 'library';
  };
  formatComparison?: {
    currentFormat: string;
    currentSize: number;
    alternatives: Array<{
      format: string;
      estimatedSize: number;
      savings: number;
      savingsPercent: number;
    }>;
  };
}

/**
 * 최적화 제안
 */
export interface OptimizationSuggestion {
  type: 'format' | 'dimensions' | 'compression' | 'lazy-loading';
  severity: 'low' | 'medium' | 'high';
  message: string;
  currentValue?: any;
  suggestedValue?: any;
  potentialSavings?: number;
}

/**
 * 에셋 관리 설정
 */
export interface AssetManagerSettings {
  autoExtract: boolean;            // 페이지 로드 시 자동 추출
  includeBackgroundImages: boolean;
  includeSvg: boolean;
  includeDataUri: boolean;
  minImageSize: number;            // 최소 이미지 크기 (bytes)
  minDimensions: {
    width: number;
    height: number;
  };
  defaultDownloadFormat: 'zip' | 'folder';
  defaultFilenamePattern: 'original' | 'numbered' | 'hash';
}

/**
 * 에셋 관리 통계
 */
export interface AssetManagerStats {
  totalExtracted: number;
  totalDownloaded: number;
  totalSize: number;
  byType: Record<ImageType, number>;
  byFormat: Record<string, number>;
  averageSize: number;
  largestImage?: ImageAsset;
  lastExtractedAt: number;
}
```
- **검증**: TypeScript 컴파일 성공, 타입 오류 없음

### Task #7.2: Storage 상수 추가
- **파일**: `src/constants/storage.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const STORAGE_KEYS = {
  // ... 기존 키들

  // 에셋 관리
  ASSET_MANAGER_HISTORY: 'assetManager:history',
  ASSET_MANAGER_SETTINGS: 'assetManager:settings',
  ASSET_MANAGER_STATS: 'assetManager:stats',
  ASSET_MANAGER_COLLECTIONS: 'assetManager:collections',
} as const;

export const STORAGE_LIMITS = {
  // ... 기존 제한들

  ASSET_MANAGER_MAX_COLLECTIONS: 5,
  ASSET_MANAGER_MAX_IMAGES_PER_COLLECTION: 500,
  MAX_IMAGE_SIZE_MB: 50,
} as const;
```

### Task #7.3: 메시지 액션 추가
- **파일**: `src/constants/messages.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const MESSAGE_ACTIONS = {
  // ... 기존 액션들

  // 에셋 관리
  ASSET_EXTRACT: 'ASSET_EXTRACT',
  ASSET_DOWNLOAD_SINGLE: 'ASSET_DOWNLOAD_SINGLE',
  ASSET_DOWNLOAD_ALL: 'ASSET_DOWNLOAD_ALL',
  ASSET_ANALYZE: 'ASSET_ANALYZE',
  ASSET_GET_STATS: 'ASSET_GET_STATS',
  ASSET_COPY_TO_CLIPBOARD: 'ASSET_COPY_TO_CLIPBOARD',
  ASSET_OPTIMIZE_SUGGESTIONS: 'ASSET_OPTIMIZE_SUGGESTIONS',
} as const;
```

### Task #7.4: CSS 클래스 상수 추가
- **파일**: `src/constants/classes.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ASSET_MANAGER_CLASSES = {
  HOVER: 'klic-asset-hover',
  SELECTED: 'klic-asset-selected',
  EXTRACTING: 'klic-asset-extracting',
  DOWNLOADING: 'klic-asset-downloading',
  ANALYZING: 'klic-asset-analyzing',
} as const;
```

### Task #7.5: 에러 메시지 추가
- **파일**: `src/constants/errors.ts`
- **시간**: 15분
- **의존성**: 없음
- **상세 내용**:
```typescript
export const ERROR_MESSAGES = {
  // ... 기존 에러들

  ASSET_MANAGER: {
    NO_IMAGES_FOUND: '이미지를 찾을 수 없습니다',
    DOWNLOAD_FAILED: '다운로드에 실패했습니다',
    EXTRACT_FAILED: '추출에 실패했습니다',
    INVALID_IMAGE_URL: '유효하지 않은 이미지 URL입니다',
    IMAGE_LOAD_FAILED: '이미지 로딩에 실패했습니다',
    ZIP_CREATION_FAILED: 'ZIP 파일 생성에 실패했습니다',
    CLIPBOARD_COPY_FAILED: '클립보드 복사에 실패했습니다',
    SIZE_LIMIT_EXCEEDED: '파일 크기 제한을 초과했습니다',
    CORS_ERROR: 'CORS 오류로 이미지에 접근할 수 없습니다',
  },
} as const;
```

### Task #7.6: 기본 설정 값
- **파일**: `src/constants/defaults.ts`
- **시간**: 15분
- **의존성**: Task #7.1
- **상세 내용**:
```typescript
import { AssetManagerSettings } from '../types/assetManager';

export const DEFAULT_ASSET_MANAGER_SETTINGS: AssetManagerSettings = {
  autoExtract: false,
  includeBackgroundImages: true,
  includeSvg: true,
  includeDataUri: false,
  minImageSize: 1024,              // 1KB
  minDimensions: {
    width: 50,
    height: 50,
  },
  defaultDownloadFormat: 'zip',
  defaultFilenamePattern: 'original',
};

export const DEFAULT_DOWNLOAD_OPTIONS = {
  format: 'zip' as const,
  includeMetadata: true,
  filenamePattern: 'original' as const,
  quality: 0.92,
};

export const IMAGE_MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
} as const;
```

---

## Phase 2: 이미지 추출 (12개 태스크, 6시간)

### Task #7.7: 이미지 타입 감지
- **파일**: `src/utils/assetManager/imageDetector.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
import { ImageType, ImageSource } from '../../types/assetManager';

/**
 * URL에서 이미지 타입 추정
 */
export function getImageType(url: string): string {
  const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();

  const typeMap: Record<string, string> = {
    jpg: 'jpg',
    jpeg: 'jpg',
    png: 'png',
    gif: 'gif',
    webp: 'webp',
    svg: 'svg',
    bmp: 'bmp',
    ico: 'ico',
  };

  return typeMap[extension || ''] || 'unknown';
}

/**
 * Data URI 확인
 */
export function isDataUri(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * SVG 확인
 */
export function isSvgUrl(url: string): boolean {
  return url.toLowerCase().includes('.svg') || url.startsWith('data:image/svg+xml');
}

/**
 * 이미지 소스 타입 결정
 */
export function determineImageSource(element: HTMLElement): ImageSource {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'img') {
    return 'img-tag';
  }

  if (tagName === 'picture') {
    return 'picture-tag';
  }

  if (tagName === 'svg') {
    return 'svg-tag';
  }

  // CSS background check
  const style = window.getComputedStyle(element);
  if (style.backgroundImage && style.backgroundImage !== 'none') {
    return 'background-css';
  }

  return 'other';
}

/**
 * 이미지 타입 분류
 */
export function classifyImageType(element: HTMLElement, url: string): ImageType {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'svg' || isSvgUrl(url)) {
    return 'svg';
  }

  if (tagName === 'picture') {
    return 'picture';
  }

  if (tagName === 'img') {
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // 아이콘 크기 (32x32 이하)
    if (width <= 32 && height <= 32) {
      return 'icon';
    }

    return 'img';
  }

  // CSS background
  const style = window.getComputedStyle(element);
  if (style.backgroundImage && style.backgroundImage !== 'none') {
    return 'background';
  }

  return 'other';
}
```
- **테스트 케이스**:
  - JPG, PNG, WebP 등 확장자 감지
  - Data URI 감지
  - SVG 감지
  - 이미지 소스 타입 분류
- **완료 조건**: 모든 이미지 타입 정확히 감지

### Task #7.8: URL 정규화 및 해결
- **파일**: `src/utils/assetManager/urlResolver.ts`
- **시간**: 45분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 상대 URL을 절대 URL로 변환
 */
export function resolveURL(url: string, baseUrl: string = window.location.href): string {
  try {
    // 이미 절대 URL이면 그대로 반환
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Data URI면 그대로 반환
    if (url.startsWith('data:')) {
      return url;
    }

    // 프로토콜 상대 URL (//example.com/image.jpg)
    if (url.startsWith('//')) {
      const protocol = new URL(baseUrl).protocol;
      return `${protocol}${url}`;
    }

    // 절대 경로 (/images/photo.jpg)
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }

    // 상대 경로 (../images/photo.jpg, images/photo.jpg)
    const base = new URL(baseUrl);
    const resolved = new URL(url, base.href);
    return resolved.href;
  } catch (error) {
    console.error('Failed to resolve URL:', url, error);
    return url;
  }
}

/**
 * CSS url() 함수에서 URL 추출
 */
export function extractURLsFromCSS(cssValue: string): string[] {
  const urls: string[] = [];

  // url("...") 또는 url('...') 또는 url(...)
  const urlRegex = /url\(['"]?(.*?)['"]?\)/gi;
  let match;

  while ((match = urlRegex.exec(cssValue)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  return urls;
}

/**
 * URL 정규화 (쿼리 파라미터 제거 등)
 */
export function normalizeURL(url: string, options: {
  removeQuery?: boolean;
  removeHash?: boolean;
} = {}): string {
  try {
    const parsed = new URL(url);

    if (options.removeQuery) {
      parsed.search = '';
    }

    if (options.removeHash) {
      parsed.hash = '';
    }

    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * URL 중복 제거
 */
export function deduplicateURLs(urls: string[]): string[] {
  return Array.from(new Set(urls.map(url => normalizeURL(url, { removeHash: true }))));
}
```
- **테스트 케이스**:
  - 절대 URL 유지
  - 상대 URL 변환
  - 프로토콜 상대 URL 변환
  - CSS url() 추출
  - URL 정규화
- **완료 조건**: 모든 URL 정확히 변환

### Task #7.9: IMG 태그 추출
- **파일**: `src/utils/assetManager/extractors/imgExtractor.ts`
- **시간**: 45분
- **의존성**: Task #7.1, #7.7, #7.8
- **상세 내용**:
```typescript
import { ImageAsset } from '../../../types/assetManager';
import { resolveURL } from '../urlResolver';
import { getImageType, classifyImageType, determineImageSource } from '../imageDetector';
import { generateUUID } from '../../common/uuid';

/**
 * IMG 태그에서 에셋 추출
 */
export function createAssetFromImg(img: HTMLImageElement): ImageAsset | null {
  try {
    // src 속성 확인
    let url = img.currentSrc || img.src;

    if (!url) {
      // 레이지 로딩 체크
      url = img.dataset.src || img.dataset.lazySrc || '';
    }

    if (!url) {
      return null;
    }

    // URL 절대 경로로 변환
    url = resolveURL(url);

    // srcset에서 최적 이미지 선택
    const bestSrc = getBestSrcFromSrcset(img.srcset, img.sizes);
    if (bestSrc) {
      url = resolveURL(bestSrc);
    }

    const asset: ImageAsset = {
      id: generateUUID(),
      url,
      type: classifyImageType(img, url),
      source: determineImageSource(img),
      dimensions: {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      },
      format: getImageType(url),
      element: {
        tagName: 'IMG',
        selector: getSelector(img),
        alt: img.alt,
        srcset: img.srcset,
        dataSrc: img.dataset.src,
      },
      metadata: {
        isLazyLoaded: !!(img.loading === 'lazy' || img.dataset.src),
        isBackgroundImage: false,
        isDataUri: url.startsWith('data:'),
        isOptimized: false,
        aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
      },
    };

    return asset;
  } catch (error) {
    console.error('Failed to create asset from img:', error);
    return null;
  }
}

/**
 * srcset에서 최적 이미지 선택
 */
export function getBestSrcFromSrcset(srcset: string, sizes?: string): string | null {
  if (!srcset) {
    return null;
  }

  const sources = srcset.split(',').map(src => {
    const parts = src.trim().split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '1x';

    // 픽셀 밀도 (2x, 3x) 또는 너비 (300w)
    let value = 1;
    if (descriptor.endsWith('x')) {
      value = parseFloat(descriptor);
    } else if (descriptor.endsWith('w')) {
      value = parseInt(descriptor);
    }

    return { url, value, descriptor };
  });

  // 가장 높은 해상도 선택
  sources.sort((a, b) => b.value - a.value);

  return sources[0]?.url || null;
}

// getSelector 유틸리티 import
import { getSelector } from '../../dom/selectorGenerator';
```
- **테스트 케이스**:
  - 일반 img 태그
  - srcset 있는 이미지
  - 레이지 로딩 이미지
  - data URI 이미지
- **완료 조건**: 모든 img 태그 정확히 추출

### Task #7.10: Background 이미지 추출
- **파일**: `src/utils/assetManager/extractors/backgroundExtractor.ts`
- **시간**: 1시간
- **의존성**: Task #7.1, #7.7, #7.8
- **상세 내용**:
```typescript
import { ImageAsset } from '../../../types/assetManager';
import { resolveURL, extractURLsFromCSS } from '../urlResolver';
import { getImageType, classifyImageType } from '../imageDetector';
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
```
- **테스트 케이스**:
  - 단일 배경 이미지
  - 다중 배경 이미지
  - url() 형식 변형
  - 숨겨진 요소 처리
- **완료 조건**: 모든 배경 이미지 추출

### Task #7.11: Picture 태그 추출
- **파일**: `src/utils/assetManager/extractors/pictureExtractor.ts`
- **시간**: 30분
- **의존성**: Task #7.1, #7.7, #7.8
- **상세 내용**:
```typescript
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
```
- **완료 조건**: Picture 태그의 모든 source 추출

### Task #7.12: SVG 추출
- **파일**: `src/utils/assetManager/extractors/svgExtractor.ts`
- **시간**: 30분
- **의존성**: Task #7.1, #7.7, #7.8
- **상세 내용**:
```typescript
import { ImageAsset } from '../../../types/assetManager';
import { resolveURL } from '../urlResolver';
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

import { getImageType } from '../imageDetector';
```
- **완료 조건**: SVG 인라인 및 href 이미지 추출

### Task #7.13: 이미지 크기 측정
- **파일**: `src/utils/assetManager/imageMeasure.ts`
- **시간**: 45분
- **의존성**: Task #7.1
- **상세 내용**:
```typescript
/**
 * 이미지 실제 크기 가져오기
 */
export async function getImageSize(url: string): Promise<number> {
  try {
    // Data URI인 경우
    if (url.startsWith('data:')) {
      return getDataUriSize(url);
    }

    // HTTP 요청으로 크기 확인
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('Content-Length');

    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Content-Length 없으면 전체 다운로드
    const fullResponse = await fetch(url);
    const blob = await fullResponse.blob();
    return blob.size;
  } catch (error) {
    console.error('Failed to get image size:', url, error);
    return 0;
  }
}

/**
 * Data URI 크기 계산
 */
export function getDataUriSize(dataUri: string): number {
  try {
    // data:image/png;base64,... 형식
    const base64 = dataUri.split(',')[1];
    if (!base64) {
      return 0;
    }

    // Base64 디코딩된 크기 추정
    const padding = (base64.match(/=/g) || []).length;
    return Math.floor((base64.length * 3) / 4) - padding;
  } catch {
    return 0;
  }
}

/**
 * 이미지 실제 크기 (dimensions) 가져오기
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * 여러 이미지 크기 배치 측정
 */
export async function batchGetImageSizes(urls: string[]): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();

  const promises = urls.map(async (url) => {
    const size = await getImageSize(url);
    sizes.set(url, size);
  });

  await Promise.allSettled(promises);

  return sizes;
}
```
- **테스트 케이스**:
  - HTTP 이미지 크기
  - Data URI 크기
  - CORS 에러 처리
  - 실제 dimensions 측정
- **완료 조건**: 정확한 크기 측정

### Task #7.14: 레이지 로딩 감지
- **파일**: `src/utils/assetManager/lazyLoadDetector.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 레이지 로딩 감지
 */
export interface LazyLoadDetection {
  isLazyLoaded: boolean;
  method?: 'native' | 'intersection-observer' | 'data-src' | 'library';
}

/**
 * 이미지 레이지 로딩 감지
 */
export function detectLazyLoading(img: HTMLImageElement): LazyLoadDetection {
  // Native lazy loading
  if (img.loading === 'lazy') {
    return {
      isLazyLoaded: true,
      method: 'native',
    };
  }

  // data-src 속성 (일반적인 레이지 로딩 라이브러리)
  if (img.dataset.src || img.dataset.lazySrc) {
    return {
      isLazyLoaded: true,
      method: 'data-src',
    };
  }

  // 일반 라이브러리 클래스 체크 (lazyload, lazy 등)
  const classes = img.className.toLowerCase();
  if (classes.includes('lazy') || classes.includes('lazyload')) {
    return {
      isLazyLoaded: true,
      method: 'library',
    };
  }

  // Intersection Observer API 사용 여부 추정
  // (직접 확인 불가, 간접 추정)
  if (!img.src && (img.dataset.src || img.dataset.lazySrc)) {
    return {
      isLazyLoaded: true,
      method: 'intersection-observer',
    };
  }

  return {
    isLazyLoaded: false,
  };
}

/**
 * 레이지 로딩된 이미지 실제 URL 가져오기
 */
export function getLazyLoadedImageUrl(img: HTMLImageElement): string | null {
  // 이미 로드된 경우
  if (img.src && !img.src.startsWith('data:image/svg')) {
    return img.src;
  }

  // data-src 확인
  if (img.dataset.src) {
    return img.dataset.src;
  }

  if (img.dataset.lazySrc) {
    return img.dataset.lazySrc;
  }

  // srcset 확인
  if (img.dataset.srcset) {
    const firstSrc = img.dataset.srcset.split(',')[0].trim().split(/\s+/)[0];
    return firstSrc;
  }

  return null;
}
```
- **완료 조건**: 다양한 레이지 로딩 방식 감지

### Task #7.15: 중복 제거
- **파일**: `src/utils/assetManager/deduplicator.ts`
- **시간**: 30분
- **의존성**: Task #7.1, #7.8
- **상세 내용**:
```typescript
import { ImageAsset } from '../../types/assetManager';
import { normalizeURL } from './urlResolver';

/**
 * 에셋 중복 제거
 */
export function deduplicateAssets(assets: ImageAsset[]): ImageAsset[] {
  const seen = new Map<string, ImageAsset>();

  for (const asset of assets) {
    const normalizedUrl = normalizeURL(asset.url, {
      removeQuery: false,
      removeHash: true,
    });

    // 중복 확인
    if (seen.has(normalizedUrl)) {
      const existing = seen.get(normalizedUrl)!;

      // 더 나은 메타데이터를 가진 에셋 선택
      if (isBetterAsset(asset, existing)) {
        seen.set(normalizedUrl, asset);
      }
    } else {
      seen.set(normalizedUrl, asset);
    }
  }

  return Array.from(seen.values());
}

/**
 * 더 나은 에셋인지 비교
 */
function isBetterAsset(a: ImageAsset, b: ImageAsset): boolean {
  // dimensions가 있는 것 우선
  if (a.dimensions && !b.dimensions) {
    return true;
  }

  if (!a.dimensions && b.dimensions) {
    return false;
  }

  // 더 큰 이미지 우선
  if (a.dimensions && b.dimensions) {
    const aArea = a.dimensions.width * a.dimensions.height;
    const bArea = b.dimensions.width * b.dimensions.height;

    if (aArea > bArea) {
      return true;
    }
  }

  // size가 있는 것 우선
  if (a.size && !b.size) {
    return true;
  }

  if (!a.size && b.size) {
    return false;
  }

  // 더 큰 파일 우선
  if (a.size && b.size && a.size > b.size) {
    return true;
  }

  return false;
}

/**
 * 필터링: 최소 크기 이상
 */
export function filterByMinSize(
  assets: ImageAsset[],
  minSize: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.size) {
      return true; // 크기 모르면 포함
    }

    return asset.size >= minSize;
  });
}

/**
 * 필터링: 최소 dimensions 이상
 */
export function filterByMinDimensions(
  assets: ImageAsset[],
  minWidth: number,
  minHeight: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.dimensions) {
      return true; // dimensions 모르면 포함
    }

    return asset.dimensions.width >= minWidth && asset.dimensions.height >= minHeight;
  });
}
```
- **완료 조건**: 중복 정확히 제거, 최적 에셋 선택

### Task #7.16: 전체 에셋 추출 로직
- **파일**: `src/utils/assetManager/extractAssets.ts`
- **시간**: 1시간
- **의존성**: Task #7.9-#7.15
- **상세 내용**:
```typescript
import { ImageAsset, AssetCollection, AssetManagerSettings } from '../../types/assetManager';
import { createAssetFromImg, getBestSrcFromSrcset } from './extractors/imgExtractor';
import { createAssetFromBackground, extractAllBackgroundImages } from './extractors/backgroundExtractor';
import { createAssetFromPicture } from './extractors/pictureExtractor';
import { createAssetFromSVG, extractImagesFromSVG } from './extractors/svgExtractor';
import { deduplicateAssets, filterByMinSize, filterByMinDimensions } from './deduplicator';
import { getImageSize, batchGetImageSizes } from './imageMeasure';

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
      images: deduplicated,
      totalSize,
      extractedAt: Date.now(),
      pageUrl: window.location.href,
      pageTitle: document.title,
    };

    return collection;
  } catch (error) {
    console.error('Failed to extract assets:', error);

    return {
      images: [],
      totalSize: 0,
      extractedAt: Date.now(),
      pageUrl: window.location.href,
      pageTitle: document.title,
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
```
- **완료 조건**: 모든 이미지 타입 추출, 필터링 정상 동작

### Task #7.17: 에셋 추출 테스트
- **파일**: `src/utils/assetManager/__tests__/extractAssets.test.ts`
- **시간**: 30분
- **의존성**: Task #7.7-#7.16
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { extractAssets } from '../extractAssets';
import { DEFAULT_ASSET_MANAGER_SETTINGS } from '../../../constants/defaults';

describe('extractAssets', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <img src="https://example.com/image1.jpg" width="800" height="600" alt="Test 1" />
        <img src="/images/image2.png" width="400" height="300" />
        <div style="background-image: url('https://example.com/bg.jpg')"></div>
        <picture>
          <source srcset="https://example.com/pic.webp" type="image/webp" />
          <img src="https://example.com/pic.jpg" alt="Picture" />
        </picture>
        <svg width="100" height="100">
          <circle cx="50" cy="50" r="40" />
        </svg>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should extract all images', async () => {
    const collection = await extractAssets(DEFAULT_ASSET_MANAGER_SETTINGS);

    expect(collection.images.length).toBeGreaterThan(0);
    expect(collection.pageUrl).toBeTruthy();
    expect(collection.extractedAt).toBeGreaterThan(0);
  });

  it('should extract img tags', async () => {
    const collection = await extractAssets(DEFAULT_ASSET_MANAGER_SETTINGS);

    const imgAssets = collection.images.filter(asset => asset.source === 'img-tag');
    expect(imgAssets.length).toBeGreaterThanOrEqual(2);
  });

  it('should extract background images', async () => {
    const settings = {
      ...DEFAULT_ASSET_MANAGER_SETTINGS,
      includeBackgroundImages: true,
    };

    const collection = await extractAssets(settings);

    const bgAssets = collection.images.filter(asset => asset.source === 'background-css');
    expect(bgAssets.length).toBeGreaterThan(0);
  });

  it('should extract SVG', async () => {
    const settings = {
      ...DEFAULT_ASSET_MANAGER_SETTINGS,
      includeSvg: true,
    };

    const collection = await extractAssets(settings);

    const svgAssets = collection.images.filter(asset => asset.type === 'svg');
    expect(svgAssets.length).toBeGreaterThan(0);
  });

  it('should exclude data URI if disabled', async () => {
    const settings = {
      ...DEFAULT_ASSET_MANAGER_SETTINGS,
      includeDataUri: false,
    };

    const collection = await extractAssets(settings);

    const dataUriAssets = collection.images.filter(asset => asset.metadata?.isDataUri);
    expect(dataUriAssets.length).toBe(0);
  });

  it('should deduplicate assets', async () => {
    document.body.innerHTML = `
      <img src="https://example.com/same.jpg" />
      <img src="https://example.com/same.jpg" />
    `;

    const collection = await extractAssets(DEFAULT_ASSET_MANAGER_SETTINGS);

    const sameAssets = collection.images.filter(asset =>
      asset.url.includes('same.jpg')
    );

    expect(sameAssets.length).toBe(1);
  });
});
```
- **완료 조건**: 모든 추출 테스트 통과

### Task #7.18: 에셋 필터링 유틸리티
- **파일**: `src/utils/assetManager/assetFilters.ts`
- **시간**: 30분
- **의존성**: Task #7.1
- **상세 내용**:
```typescript
import { ImageAsset, ImageType } from '../../types/assetManager';

/**
 * 타입별 필터
 */
export function filterByType(assets: ImageAsset[], type: ImageType): ImageAsset[] {
  return assets.filter(asset => asset.type === type);
}

/**
 * 포맷별 필터
 */
export function filterByFormat(assets: ImageAsset[], format: string): ImageAsset[] {
  return assets.filter(asset => asset.format === format);
}

/**
 * 크기 범위 필터
 */
export function filterBySizeRange(
  assets: ImageAsset[],
  minSize?: number,
  maxSize?: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.size) {
      return true;
    }

    if (minSize && asset.size < minSize) {
      return false;
    }

    if (maxSize && asset.size > maxSize) {
      return false;
    }

    return true;
  });
}

/**
 * dimensions 범위 필터
 */
export function filterByDimensionsRange(
  assets: ImageAsset[],
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): ImageAsset[] {
  return assets.filter(asset => {
    if (!asset.dimensions) {
      return true;
    }

    const { width, height } = asset.dimensions;

    if (minWidth && width < minWidth) {
      return false;
    }

    if (minHeight && height < minHeight) {
      return false;
    }

    if (maxWidth && width > maxWidth) {
      return false;
    }

    if (maxHeight && height > maxHeight) {
      return false;
    }

    return true;
  });
}

/**
 * 검색어 필터
 */
export function filterBySearch(assets: ImageAsset[], query: string): ImageAsset[] {
  const lowerQuery = query.toLowerCase();

  return assets.filter(asset => {
    const url = asset.url.toLowerCase();
    const alt = asset.element?.alt?.toLowerCase() || '';

    return url.includes(lowerQuery) || alt.includes(lowerQuery);
  });
}

/**
 * 정렬
 */
export type SortField = 'size' | 'width' | 'height' | 'url' | 'type';
export type SortOrder = 'asc' | 'desc';

export function sortAssets(
  assets: ImageAsset[],
  field: SortField,
  order: SortOrder = 'asc'
): ImageAsset[] {
  const sorted = [...assets];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;

      case 'width':
        aValue = a.dimensions?.width || 0;
        bValue = b.dimensions?.width || 0;
        break;

      case 'height':
        aValue = a.dimensions?.height || 0;
        bValue = b.dimensions?.height || 0;
        break;

      case 'url':
        aValue = a.url;
        bValue = b.url;
        break;

      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;

      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });

  return sorted;
}
```
- **완료 조건**: 모든 필터 및 정렬 동작

---

## Phase 3: 다운로드 및 압축 (8개 태스크, 4시간)

### Task #7.19: 단일 이미지 다운로드
- **파일**: `src/utils/assetManager/download/downloadImage.ts`
- **시간**: 45분
- **의존성**: Task #7.1
- **상세 내용**:
```typescript
import { ImageAsset } from '../../../types/assetManager';

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

import { getFilename } from './filenameGenerator';
```
- **완료 조건**: 단일 이미지 다운로드 성공

### Task #7.20: 파일명 생성
- **파일**: `src/utils/assetManager/download/filenameGenerator.ts`
- **시간**: 30분
- **의존성**: Task #7.1
- **상세 내용**:
```typescript
import { ImageAsset } from '../../../types/assetManager';

/**
 * 에셋에서 파일명 추출
 */
export function getFilename(asset: ImageAsset): string {
  try {
    const url = new URL(asset.url);
    const pathname = url.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

    // 파일명이 없으면 생성
    if (!filename || filename.length === 0) {
      return generateFilename(asset);
    }

    // 확장자 확인
    if (!filename.includes('.')) {
      return `${filename}.${asset.format || 'jpg'}`;
    }

    return filename;
  } catch {
    // URL 파싱 실패 시 생성
    return generateFilename(asset);
  }
}

/**
 * 파일명 생성
 */
export function generateFilename(
  asset: ImageAsset,
  pattern: 'original' | 'numbered' | 'hash' = 'original',
  index?: number
): string {
  const extension = asset.format || 'jpg';

  switch (pattern) {
    case 'original':
      return getFilename(asset);

    case 'numbered':
      if (index !== undefined) {
        return `image-${String(index + 1).padStart(3, '0')}.${extension}`;
      }
      return `image.${extension}`;

    case 'hash':
      const hash = hashString(asset.url);
      return `${hash}.${extension}`;

    default:
      return `image.${extension}`;
  }
}

/**
 * 문자열 해시
 */
function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * 파일명 안전화 (특수문자 제거)
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * 중복 파일명 해결
 */
export function resolveFilenameConflict(
  filename: string,
  existingFilenames: Set<string>
): string {
  if (!existingFilenames.has(filename)) {
    return filename;
  }

  const [name, extension] = splitFilename(filename);
  let counter = 1;
  let newFilename: string;

  do {
    newFilename = `${name}-${counter}.${extension}`;
    counter++;
  } while (existingFilenames.has(newFilename));

  return newFilename;
}

/**
 * 파일명과 확장자 분리
 */
function splitFilename(filename: string): [string, string] {
  const lastDot = filename.lastIndexOf('.');

  if (lastDot === -1) {
    return [filename, ''];
  }

  const name = filename.substring(0, lastDot);
  const extension = filename.substring(lastDot + 1);

  return [name, extension];
}
```
- **완료 조건**: 파일명 생성 및 충돌 해결

### Task #7.21: ZIP 아카이브 생성
- **파일**: `src/utils/assetManager/download/zipArchive.ts`
- **시간**: 1시간
- **의존성**: Task #7.1, #7.19, #7.20
- **상세 내용**:
```typescript
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
      let filename = generateFilename(asset, options.filenamePattern, index);
      filename = resolveFilenameConflict(filename, usedFilenames);
      usedFilenames.add(filename);

      // 메타데이터 업데이트
      if (options.includeMetadata) {
        const metadataAssets = (zip.file('metadata.json')?.async('string') as any);
        // Note: JSZip은 동기적으로 업데이트 불가, 나중에 업데이트
      }

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
```
- **완료 조건**: ZIP 생성 및 다운로드 성공

### Task #7.22: 전체 다운로드
- **파일**: `src/utils/assetManager/download/downloadAllAssets.ts`
- **시간**: 30분
- **의존성**: Task #7.1, #7.21
- **상세 내용**:
```typescript
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
    const filename = generateFilename(asset, options.filenamePattern, i);

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
```
- **완료 조건**: 모든 에셋 다운로드 성공

### Task #7.23: 클립보드 복사
- **파일**: `src/utils/assetManager/download/clipboard.ts`
- **시간**: 30분
- **의존성**: Task #7.1, #7.19
- **상세 내용**:
```typescript
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
```
- **완료 조건**: 클립보드 복사 성공

### Task #7.24: 다운로드 진행 상태
- **파일**: `src/utils/assetManager/download/downloadProgress.ts`
- **시간**: 30분
- **의존성**: 없음
- **상세 내용**:
```typescript
/**
 * 다운로드 진행 상태
 */
export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentImage?: string;
}

/**
 * 진행 상태 콜백 타입
 */
export type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * 다운로드 진행 상태 관리
 */
export class DownloadProgressTracker {
  private total: number;
  private completed: number = 0;
  private failed: number = 0;
  private callback?: ProgressCallback;

  constructor(total: number, callback?: ProgressCallback) {
    this.total = total;
    this.callback = callback;
  }

  /**
   * 성공 보고
   */
  reportSuccess(imageName?: string): void {
    this.completed++;
    this.notifyProgress(imageName);
  }

  /**
   * 실패 보고
   */
  reportFailure(imageName?: string): void {
    this.failed++;
    this.notifyProgress(imageName);
  }

  /**
   * 진행 상태 알림
   */
  private notifyProgress(currentImage?: string): void {
    if (!this.callback) {
      return;
    }

    const progress: DownloadProgress = {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      percentage: ((this.completed + this.failed) / this.total) * 100,
      currentImage,
    };

    this.callback(progress);
  }

  /**
   * 완료 여부
   */
  isComplete(): boolean {
    return (this.completed + this.failed) >= this.total;
  }

  /**
   * 리셋
   */
  reset(): void {
    this.completed = 0;
    this.failed = 0;
  }
}
```
- **완료 조건**: 진행 상태 정확히 추적

### Task #7.25: 다운로드 테스트
- **파일**: `src/utils/assetManager/__tests__/download.test.ts`
- **시간**: 30분
- **의존성**: Task #7.19-#7.24
- **상세 내용**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { downloadImage, dataUriToBlob } from '../download/downloadImage';
import { getFilename, generateFilename } from '../download/filenameGenerator';
import { createZipArchive } from '../download/zipArchive';
import { DownloadProgressTracker } from '../download/downloadProgress';
import { ImageAsset } from '../../../types/assetManager';

describe('downloadImage', () => {
  it('should convert data URI to blob', async () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const blob = await dataUriToBlob(dataUri);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });
});

describe('filenameGenerator', () => {
  const asset: ImageAsset = {
    id: '1',
    url: 'https://example.com/path/to/image.jpg',
    type: 'img',
    source: 'img-tag',
    format: 'jpg',
  };

  it('should extract filename from URL', () => {
    const filename = getFilename(asset);
    expect(filename).toBe('image.jpg');
  });

  it('should generate numbered filename', () => {
    const filename = generateFilename(asset, 'numbered', 5);
    expect(filename).toBe('image-006.jpg');
  });

  it('should generate hash filename', () => {
    const filename = generateFilename(asset, 'hash');
    expect(filename).toMatch(/^[a-z0-9]+\.jpg$/);
  });
});

describe('DownloadProgressTracker', () => {
  it('should track progress', () => {
    const callback = vi.fn();
    const tracker = new DownloadProgressTracker(10, callback);

    tracker.reportSuccess('image1.jpg');
    tracker.reportSuccess('image2.jpg');
    tracker.reportFailure('image3.jpg');

    expect(callback).toHaveBeenCalledTimes(3);
    expect(tracker.isComplete()).toBe(false);

    const lastCall = callback.mock.calls[2][0];
    expect(lastCall.completed).toBe(2);
    expect(lastCall.failed).toBe(1);
    expect(lastCall.percentage).toBe(30);
  });
});
```
- **완료 조건**: 다운로드 테스트 통과

### Task #7.26: Chrome Downloads API 통합
- **파일**: `src/utils/assetManager/download/chromeDownloads.ts`
- **시간**: 30분
- **의존성**: Task #7.1
- **상세 내용**:
```typescript
import { ImageAsset } from '../../../types/assetManager';

/**
 * Chrome Downloads API를 사용한 다운로드
 */
export async function downloadWithChromeAPI(
  asset: ImageAsset,
  filename: string
): Promise<boolean> {
  try {
    // Data URI는 지원 안 됨
    if (asset.url.startsWith('data:')) {
      return false;
    }

    // 다운로드 시작
    const downloadId = await chrome.downloads.download({
      url: asset.url,
      filename,
      saveAs: false,
    });

    return downloadId !== undefined;
  } catch (error) {
    console.error('Failed to download with Chrome API:', error);
    return false;
  }
}

/**
 * 다운로드 진행 상태 모니터링
 */
export function monitorDownload(
  downloadId: number,
  callback: (state: chrome.downloads.State) => void
): void {
  const listener = (delta: chrome.downloads.DownloadDelta) => {
    if (delta.id === downloadId && delta.state) {
      callback(delta.state.current);

      if (delta.state.current === 'complete' || delta.state.current === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
      }
    }
  };

  chrome.downloads.onChanged.addListener(listener);
}
```
- **완료 조건**: Chrome API 다운로드 성공

---

## Phase 4: 이미지 분석 (5개 태스크, 2시간)

### Task #7.27: 이미지 분석 로직
- **파일**: `src/utils/assetManager/analysis/analyzeImage.ts`
- **시간**: 45분
- **의존성**: Task #7.1, #7.13
- **상세 내용**:
```typescript
import { ImageAsset, ImageAnalysis, OptimizationSuggestion } from '../../../types/assetManager';
import { getImageSize, getImageDimensions } from '../imageMeasure';
import { detectLazyLoading } from '../lazyLoadDetector';

/**
 * 이미지 분석
 */
export async function analyzeImage(asset: ImageAsset): Promise<ImageAnalysis> {
  const analysis: ImageAnalysis = {
    url: asset.url,
    format: asset.format || 'unknown',
    dimensions: asset.dimensions || { width: 0, height: 0 },
    size: asset.size || 0,
    isOptimized: false,
    suggestions: [],
    lazyLoadDetection: {
      isLazyLoaded: asset.metadata?.isLazyLoaded || false,
    },
  };

  // 크기 정보 가져오기
  if (!asset.size) {
    analysis.size = await getImageSize(asset.url);
  }

  // Dimensions 가져오기
  if (!asset.dimensions) {
    try {
      analysis.dimensions = await getImageDimensions(asset.url);
    } catch {
      analysis.dimensions = { width: 0, height: 0 };
    }
  }

  // 최적화 확인
  analysis.isOptimized = checkImageOptimization(analysis);

  // 제안 생성
  analysis.suggestions = suggestOptimizations(analysis);

  // 포맷 비교
  analysis.formatComparison = await compareImageFormats(analysis);

  return analysis;
}

/**
 * 이미지 최적화 확인
 */
export function checkImageOptimization(analysis: ImageAnalysis): boolean {
  const { format, size, dimensions } = analysis;

  // WebP 사용 시 최적화된 것으로 간주
  if (format === 'webp') {
    return true;
  }

  // 크기 대비 용량 확인
  const pixels = dimensions.width * dimensions.height;
  const bytesPerPixel = size / pixels;

  // JPG: 평균 0.5-2 bytes/pixel
  // PNG: 평균 2-4 bytes/pixel

  if (format === 'jpg' && bytesPerPixel < 1) {
    return true;
  }

  if (format === 'png' && bytesPerPixel < 2) {
    return true;
  }

  return false;
}

/**
 * 최적화 제안 생성
 */
export function suggestOptimizations(analysis: ImageAnalysis): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // 포맷 제안
  if (analysis.format === 'png' || analysis.format === 'jpg') {
    suggestions.push({
      type: 'format',
      severity: 'medium',
      message: 'WebP 포맷으로 변환하면 파일 크기를 30-50% 줄일 수 있습니다',
      currentValue: analysis.format,
      suggestedValue: 'webp',
      potentialSavings: analysis.size * 0.4,
    });
  }

  // 크기 제안
  const { width, height } = analysis.dimensions;
  if (width > 2000 || height > 2000) {
    suggestions.push({
      type: 'dimensions',
      severity: 'high',
      message: '이미지 크기가 너무 큽니다. 리사이징을 권장합니다',
      currentValue: `${width}x${height}`,
      suggestedValue: '2000x2000 이하',
      potentialSavings: analysis.size * 0.5,
    });
  }

  // 압축 제안
  if (!analysis.isOptimized) {
    suggestions.push({
      type: 'compression',
      severity: 'medium',
      message: '이미지 압축을 통해 파일 크기를 줄일 수 있습니다',
      currentValue: `${formatBytes(analysis.size)}`,
      suggestedValue: `${formatBytes(analysis.size * 0.7)} (예상)`,
      potentialSavings: analysis.size * 0.3,
    });
  }

  // 레이지 로딩 제안
  if (!analysis.lazyLoadDetection.isLazyLoaded) {
    suggestions.push({
      type: 'lazy-loading',
      severity: 'low',
      message: '레이지 로딩을 사용하면 초기 페이지 로딩 속도를 개선할 수 있습니다',
      currentValue: 'Not lazy loaded',
      suggestedValue: 'loading="lazy"',
    });
  }

  return suggestions;
}

/**
 * 포맷 비교
 */
async function compareImageFormats(analysis: ImageAnalysis): Promise<ImageAnalysis['formatComparison']> {
  const currentFormat = analysis.format;
  const currentSize = analysis.size;

  const alternatives = [];

  // WebP 비교
  if (currentFormat !== 'webp') {
    alternatives.push({
      format: 'webp',
      estimatedSize: Math.round(currentSize * 0.6),
      savings: Math.round(currentSize * 0.4),
      savingsPercent: 40,
    });
  }

  // AVIF 비교 (더 최신 포맷)
  if (currentFormat !== 'avif') {
    alternatives.push({
      format: 'avif',
      estimatedSize: Math.round(currentSize * 0.5),
      savings: Math.round(currentSize * 0.5),
      savingsPercent: 50,
    });
  }

  return {
    currentFormat,
    currentSize,
    alternatives,
  };
}

/**
 * 바이트 포맷팅
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```
- **완료 조건**: 정확한 분석 및 제안

### Task #7.28: 최적화 제안 로직
- **파일**: `src/utils/assetManager/analysis/optimizationSuggestions.ts`
- **시간**: 30분
- **의존성**: Task #7.1, #7.27
- **상세 내용**: (Task #7.27에 포함됨)

### Task #7.29: 포맷 비교
- **파일**: `src/utils/assetManager/analysis/formatComparison.ts`
- **시간**: 15분
- **의존성**: Task #7.1, #7.27
- **상세 내용**: (Task #7.27에 포함됨)

### Task #7.30: 배치 분석
- **파일**: `src/utils/assetManager/analysis/batchAnalysis.ts`
- **시간**: 15분
- **의존성**: Task #7.1, #7.27
- **상세 내용**:
```typescript
import { ImageAsset, ImageAnalysis } from '../../../types/assetManager';
import { analyzeImage } from './analyzeImage';

/**
 * 여러 이미지 배치 분석
 */
export async function batchAnalyzeImages(assets: ImageAsset[]): Promise<Map<string, ImageAnalysis>> {
  const analyses = new Map<string, ImageAnalysis>();

  const promises = assets.map(async (asset) => {
    try {
      const analysis = await analyzeImage(asset);
      analyses.set(asset.id, analysis);
    } catch (error) {
      console.error(`Failed to analyze image: ${asset.url}`, error);
    }
  });

  await Promise.allSettled(promises);

  return analyses;
}

/**
 * 분석 결과 요약
 */
export interface AnalysisSummary {
  totalImages: number;
  totalSize: number;
  optimizedCount: number;
  unoptimizedCount: number;
  totalPotentialSavings: number;
  formatDistribution: Record<string, number>;
  averageSize: number;
  largestImage?: ImageAnalysis;
}

/**
 * 분석 요약 생성
 */
export function summarizeAnalysis(analyses: Map<string, ImageAnalysis>): AnalysisSummary {
  const summary: AnalysisSummary = {
    totalImages: analyses.size,
    totalSize: 0,
    optimizedCount: 0,
    unoptimizedCount: 0,
    totalPotentialSavings: 0,
    formatDistribution: {},
    averageSize: 0,
  };

  let largestSize = 0;

  analyses.forEach((analysis) => {
    summary.totalSize += analysis.size;

    if (analysis.isOptimized) {
      summary.optimizedCount++;
    } else {
      summary.unoptimizedCount++;
    }

    analysis.suggestions.forEach((suggestion) => {
      if (suggestion.potentialSavings) {
        summary.totalPotentialSavings += suggestion.potentialSavings;
      }
    });

    // 포맷 분포
    const format = analysis.format;
    summary.formatDistribution[format] = (summary.formatDistribution[format] || 0) + 1;

    // 가장 큰 이미지
    if (analysis.size > largestSize) {
      largestSize = analysis.size;
      summary.largestImage = analysis;
    }
  });

  summary.averageSize = summary.totalImages > 0
    ? summary.totalSize / summary.totalImages
    : 0;

  return summary;
}
```
- **완료 조건**: 배치 분석 및 요약 생성

### Task #7.31: 분석 테스트
- **파일**: `src/utils/assetManager/__tests__/analysis.test.ts`
- **시간**: 15분
- **의존성**: Task #7.27-#7.30
- **상세 내용**:
```typescript
import { describe, it, expect } from 'vitest';
import { checkImageOptimization, suggestOptimizations } from '../analysis/analyzeImage';
import { summarizeAnalysis } from '../analysis/batchAnalysis';
import { ImageAnalysis } from '../../../types/assetManager';

describe('Image Analysis', () => {
  it('should check optimization', () => {
    const webpAnalysis: ImageAnalysis = {
      url: 'test.webp',
      format: 'webp',
      dimensions: { width: 800, height: 600 },
      size: 50000,
      isOptimized: false,
      suggestions: [],
      lazyLoadDetection: { isLazyLoaded: false },
    };

    expect(checkImageOptimization(webpAnalysis)).toBe(true);

    const largeJpgAnalysis: ImageAnalysis = {
      url: 'test.jpg',
      format: 'jpg',
      dimensions: { width: 800, height: 600 },
      size: 500000,
      isOptimized: false,
      suggestions: [],
      lazyLoadDetection: { isLazyLoaded: false },
    };

    expect(checkImageOptimization(largeJpgAnalysis)).toBe(false);
  });

  it('should suggest optimizations', () => {
    const analysis: ImageAnalysis = {
      url: 'test.png',
      format: 'png',
      dimensions: { width: 3000, height: 2000 },
      size: 1000000,
      isOptimized: false,
      suggestions: [],
      lazyLoadDetection: { isLazyLoaded: false },
    };

    const suggestions = suggestOptimizations(analysis);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.type === 'format')).toBe(true);
    expect(suggestions.some(s => s.type === 'dimensions')).toBe(true);
  });
});
```
- **완료 조건**: 분석 테스트 통과

---

## Phase 5: Storage 관리 (3개 태스크, 1.5시간)

### Task #7.32: Storage 훅
- **파일**: `src/hooks/assetManager/useAssetManagerStorage.ts`
- **시간**: 45분
- **의존성**: Task #7.1, #7.2
- **상세 내용**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { AssetCollection, AssetManagerSettings, AssetManagerStats } from '../../types/assetManager';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../../constants/storage';
import { DEFAULT_ASSET_MANAGER_SETTINGS } from '../../constants/defaults';

/**
 * 에셋 매니저 Storage 훅
 */
export function useAssetManagerStorage() {
  const [collections, setCollections] = useState<AssetCollection[]>([]);
  const [settings, setSettings] = useState<AssetManagerSettings>(DEFAULT_ASSET_MANAGER_SETTINGS);
  const [stats, setStats] = useState<AssetManagerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      const result = await chrome.storage.local.get([
        STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS,
        STORAGE_KEYS.ASSET_MANAGER_SETTINGS,
        STORAGE_KEYS.ASSET_MANAGER_STATS,
      ]);

      setCollections(result[STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS] || []);
      setSettings(result[STORAGE_KEYS.ASSET_MANAGER_SETTINGS] || DEFAULT_ASSET_MANAGER_SETTINGS);
      setStats(result[STORAGE_KEYS.ASSET_MANAGER_STATS] || null);
    } catch (error) {
      console.error('Failed to load asset manager data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 컬렉션 저장
   */
  const saveCollection = useCallback(async (collection: AssetCollection) => {
    try {
      const updatedCollections = [collection, ...collections];

      // 최대 개수 제한
      if (updatedCollections.length > STORAGE_LIMITS.ASSET_MANAGER_MAX_COLLECTIONS) {
        updatedCollections.pop();
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS]: updatedCollections,
      });

      setCollections(updatedCollections);

      // 통계 업데이트
      await updateStats(collection);
    } catch (error) {
      console.error('Failed to save collection:', error);
    }
  }, [collections]);

  /**
   * 컬렉션 삭제
   */
  const deleteCollection = useCallback(async (extractedAt: number) => {
    try {
      const updatedCollections = collections.filter(c => c.extractedAt !== extractedAt);

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS]: updatedCollections,
      });

      setCollections(updatedCollections);
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  }, [collections]);

  /**
   * 모든 컬렉션 삭제
   */
  const clearCollections = useCallback(async () => {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_COLLECTIONS]: [],
      });

      setCollections([]);
    } catch (error) {
      console.error('Failed to clear collections:', error);
    }
  }, []);

  /**
   * 설정 업데이트
   */
  const updateSettings = useCallback(async (newSettings: Partial<AssetManagerSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_SETTINGS]: updatedSettings,
      });

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }, [settings]);

  /**
   * 통계 업데이트
   */
  const updateStats = useCallback(async (collection: AssetCollection) => {
    try {
      const currentStats = stats || {
        totalExtracted: 0,
        totalDownloaded: 0,
        totalSize: 0,
        byType: {} as any,
        byFormat: {} as any,
        averageSize: 0,
        lastExtractedAt: 0,
      };

      const newStats: AssetManagerStats = {
        totalExtracted: currentStats.totalExtracted + collection.images.length,
        totalDownloaded: currentStats.totalDownloaded,
        totalSize: currentStats.totalSize + collection.totalSize,
        byType: { ...currentStats.byType },
        byFormat: { ...currentStats.byFormat },
        averageSize: 0,
        lastExtractedAt: collection.extractedAt,
      };

      // 타입별 집계
      collection.images.forEach((image) => {
        newStats.byType[image.type] = (newStats.byType[image.type] || 0) + 1;

        if (image.format) {
          newStats.byFormat[image.format] = (newStats.byFormat[image.format] || 0) + 1;
        }
      });

      // 평균 크기
      newStats.averageSize = newStats.totalExtracted > 0
        ? newStats.totalSize / newStats.totalExtracted
        : 0;

      await chrome.storage.local.set({
        [STORAGE_KEYS.ASSET_MANAGER_STATS]: newStats,
      });

      setStats(newStats);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }, [stats]);

  return {
    collections,
    settings,
    stats,
    isLoading,
    saveCollection,
    deleteCollection,
    clearCollections,
    updateSettings,
    loadAllData,
  };
}
```
- **완료 조건**: Storage CRUD 정상 동작

### Task #7.33: 히스토리 관리 훅
- **파일**: `src/hooks/assetManager/useAssetHistory.ts`
- **시간**: 30분
- **의존성**: Task #7.32
- **상세 내용**:
```typescript
import { useMemo } from 'react';
import { useAssetManagerStorage } from './useAssetManagerStorage';
import { ImageAsset } from '../../types/assetManager';

/**
 * 에셋 히스토리 훅
 */
export function useAssetHistory() {
  const { collections, deleteCollection, clearCollections } = useAssetManagerStorage();

  /**
   * 최근 컬렉션
   */
  const recentCollections = useMemo(() => {
    return collections.slice(0, 10);
  }, [collections]);

  /**
   * 모든 이미지 (중복 제거)
   */
  const allImages = useMemo(() => {
    const imageMap = new Map<string, ImageAsset>();

    collections.forEach((collection) => {
      collection.images.forEach((image) => {
        if (!imageMap.has(image.url)) {
          imageMap.set(image.url, image);
        }
      });
    });

    return Array.from(imageMap.values());
  }, [collections]);

  /**
   * URL로 이미지 찾기
   */
  const findImageByUrl = (url: string): ImageAsset | undefined => {
    return allImages.find(image => image.url === url);
  };

  /**
   * 특정 페이지의 컬렉션 찾기
   */
  const findCollectionsByPage = (pageUrl: string) => {
    return collections.filter(c => c.pageUrl === pageUrl);
  };

  return {
    collections,
    recentCollections,
    allImages,
    findImageByUrl,
    findCollectionsByPage,
    deleteCollection,
    clearCollections,
  };
}
```
- **완료 조건**: 히스토리 조회 및 관리

### Task #7.34: 통계 훅
- **파일**: `src/hooks/assetManager/useAssetStats.ts`
- **시간**: 15분
- **의존성**: Task #7.32
- **상세 내용**:
```typescript
import { useMemo } from 'react';
import { useAssetManagerStorage } from './useAssetManagerStorage';

/**
 * 에셋 통계 훅
 */
export function useAssetStats() {
  const { stats, collections } = useAssetManagerStorage();

  /**
   * 포맷 분포 차트 데이터
   */
  const formatChartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return Object.entries(stats.byFormat).map(([format, count]) => ({
      format,
      count,
      percentage: (count / stats.totalExtracted) * 100,
    }));
  }, [stats]);

  /**
   * 타입 분포 차트 데이터
   */
  const typeChartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return Object.entries(stats.byType).map(([type, count]) => ({
      type,
      count,
      percentage: (count / stats.totalExtracted) * 100,
    }));
  }, [stats]);

  /**
   * 시간대별 추출 데이터
   */
  const extractionTimeline = useMemo(() => {
    return collections.map((collection) => ({
      date: new Date(collection.extractedAt),
      count: collection.images.length,
      size: collection.totalSize,
    }));
  }, [collections]);

  return {
    stats,
    formatChartData,
    typeChartData,
    extractionTimeline,
  };
}
```
- **완료 조건**: 통계 데이터 정확히 계산

---

## Phase 6: React 컴포넌트 (5개 태스크, 3시간)

### Task #7.35: AssetManagerPanel 메인 컴포넌트
- **파일**: `src/sidepanel/components/AssetManager/AssetManagerPanel.tsx`
- **시간**: 1시간
- **의존성**: Task #7.32-#7.34
- **상세 내용**:
```typescript
import React, { useState } from 'react';
import { useAssetManagerStorage } from '../../../hooks/assetManager/useAssetManagerStorage';
import { AssetGrid } from './AssetGrid';
import { AssetFilters } from './AssetFilters';
import { AssetStats } from './AssetStats';
import { SettingsPanel } from './SettingsPanel';

export function AssetManagerPanel() {
  const { collections, settings, isLoading } = useAssetManagerStorage();
  const [activeTab, setActiveTab] = useState<'grid' | 'stats' | 'settings'>('grid');
  const [isExtracting, setIsExtracting] = useState(false);

  /**
   * 에셋 추출
   */
  const handleExtract = async () => {
    try {
      setIsExtracting(true);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'ASSET_EXTRACT',
          data: { settings },
        });

        if (response?.success) {
          // 성공 알림
          console.log('Assets extracted successfully');
        }
      }
    } catch (error) {
      console.error('Failed to extract assets:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const latestCollection = collections[0];

  return (
    <div className="asset-manager-panel">
      {/* 헤더 */}
      <div className="panel-header">
        <h2>에셋 관리</h2>

        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="extract-btn"
        >
          {isExtracting ? '추출 중...' : '에셋 추출'}
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('grid')}
          className={activeTab === 'grid' ? 'active' : ''}
        >
          이미지 ({latestCollection?.images.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={activeTab === 'stats' ? 'active' : ''}
        >
          통계
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          설정
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'grid' && latestCollection && (
          <>
            <AssetFilters collection={latestCollection} />
            <AssetGrid collection={latestCollection} />
          </>
        )}

        {activeTab === 'stats' && (
          <AssetStats />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </div>

      {/* 빈 상태 */}
      {!latestCollection && !isLoading && (
        <div className="empty-state">
          <p>에셋 추출 버튼을 눌러</p>
          <p>페이지의 이미지를 분석하세요.</p>
        </div>
      )}
    </div>
  );
}
```
- **완료 조건**: 메인 UI 동작

### Task #7.36: AssetGrid 컴포넌트
- **파일**: `src/sidepanel/components/AssetManager/AssetGrid.tsx`
- **시간**: 45분
- **의존성**: Task #7.1
- **상세 내용**: (간략화, 그리드 레이아웃으로 이미지 카드 표시)

### Task #7.37: AssetCard 컴포넌트
- **파일**: `src/sidepanel/components/AssetManager/AssetCard.tsx`
- **시간**: 30분
- **의존성**: Task #7.1
- **상세 내용**: (간략화, 개별 이미지 카드 UI)

### Task #7.38: AssetFilters 컴포넌트
- **파일**: `src/sidepanel/components/AssetManager/AssetFilters.tsx`
- **시간**: 30분
- **의존성**: Task #7.18
- **상세 내용**: (간략화, 필터 UI)

### Task #7.39: AssetStats 컴포넌트
- **파일**: `src/sidepanel/components/AssetManager/AssetStats.tsx`
- **시간**: 15분
- **의존성**: Task #7.34
- **상세 내용**: (간략화, 통계 표시)

---

## Phase 7: 테스트 (1개 태스크, 1.5시간)

### Task #7.40: 통합 테스트
- **파일**: `src/utils/assetManager/__tests__/integration.test.ts`
- **시간**: 1.5시간
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { extractAssets } from '../extractAssets';
import { downloadAllAssets } from '../download/downloadAllAssets';
import { analyzeImage } from '../analysis/analyzeImage';
import { DEFAULT_ASSET_MANAGER_SETTINGS } from '../../../constants/defaults';

describe('Asset Manager Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-page">
        <img src="https://example.com/image1.jpg" width="800" height="600" />
        <img src="https://example.com/image2.png" width="400" height="300" />
        <div style="background-image: url('https://example.com/bg.jpg')"></div>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should extract, analyze, and prepare for download', async () => {
    // 1. 추출
    const collection = await extractAssets(DEFAULT_ASSET_MANAGER_SETTINGS);

    expect(collection.images.length).toBeGreaterThan(0);

    // 2. 분석
    const firstImage = collection.images[0];
    const analysis = await analyzeImage(firstImage);

    expect(analysis).toBeDefined();
    expect(analysis.url).toBe(firstImage.url);

    // 3. 다운로드 준비 (실제 다운로드는 테스트 안 함)
    expect(collection.totalSize).toBeGreaterThanOrEqual(0);
  });
});
```
- **완료 조건**: 80% 이상 테스트 커버리지

---

## ✅ 완료 체크리스트

- [ ] Phase 1: 기반 설정 (6개 태스크)
  - [ ] Task #7.1: 타입 정의
  - [ ] Task #7.2: Storage 상수
  - [ ] Task #7.3: 메시지 액션
  - [ ] Task #7.4: CSS 클래스
  - [ ] Task #7.5: 에러 메시지
  - [ ] Task #7.6: 기본 설정

- [ ] Phase 2: 이미지 추출 (12개 태스크)
  - [ ] Task #7.7: 이미지 타입 감지
  - [ ] Task #7.8: URL 정규화
  - [ ] Task #7.9: IMG 태그 추출
  - [ ] Task #7.10: Background 추출
  - [ ] Task #7.11: Picture 추출
  - [ ] Task #7.12: SVG 추출
  - [ ] Task #7.13: 이미지 크기 측정
  - [ ] Task #7.14: 레이지 로딩 감지
  - [ ] Task #7.15: 중복 제거
  - [ ] Task #7.16: 전체 추출 로직
  - [ ] Task #7.17: 추출 테스트
  - [ ] Task #7.18: 필터링 유틸리티

- [ ] Phase 3: 다운로드 및 압축 (8개 태스크)
  - [ ] Task #7.19: 단일 다운로드
  - [ ] Task #7.20: 파일명 생성
  - [ ] Task #7.21: ZIP 생성
  - [ ] Task #7.22: 전체 다운로드
  - [ ] Task #7.23: 클립보드 복사
  - [ ] Task #7.24: 진행 상태
  - [ ] Task #7.25: 다운로드 테스트
  - [ ] Task #7.26: Chrome API

- [ ] Phase 4: 이미지 분석 (5개 태스크)
  - [ ] Task #7.27: 이미지 분석
  - [ ] Task #7.28: 최적화 제안
  - [ ] Task #7.29: 포맷 비교
  - [ ] Task #7.30: 배치 분석
  - [ ] Task #7.31: 분석 테스트

- [ ] Phase 5: Storage 관리 (3개 태스크)
  - [ ] Task #7.32: Storage 훅
  - [ ] Task #7.33: 히스토리 훅
  - [ ] Task #7.34: 통계 훅

- [ ] Phase 6: React 컴포넌트 (5개 태스크)
  - [ ] Task #7.35: AssetManagerPanel
  - [ ] Task #7.36: AssetGrid
  - [ ] Task #7.37: AssetCard
  - [ ] Task #7.38: AssetFilters
  - [ ] Task #7.39: AssetStats

- [ ] Phase 7: 테스트 (1개 태스크)
  - [ ] Task #7.40: 통합 테스트

---

**다음 단계**: 도구 #8 (차단 요소 제거) 구현
