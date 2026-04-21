/**
 * Asset Manager Types
 * Comprehensive type definitions for image asset extraction, analysis, and management
 */

/**
 * 이미지 타입
 */
export type ImageType = 'img' | 'background' | 'picture' | 'svg' | 'icon' | 'other';

/**
 * 이미지 소스
 */
export type ImageSource = 'img-tag' | 'background-css' | 'picture-tag' | 'svg-tag' | 'inline-svg' | 'data-uri';

/**
 * 다운로드 형식
 */
export type DownloadFormat = 'original' | 'zip' | 'clipboard';

/**
 * 파일명 패턴
 */
export type FilenamePattern = 'original' | 'numbered' | 'hash';

/**
 * 정렬 기준
 */
export type SortBy = 'size' | 'dimensions' | 'format' | 'source' | 'url';

/**
 * 정렬 순서
 */
export type SortOrder = 'asc' | 'desc';

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
 * 에셋 컬렉션
 */
export interface AssetCollection {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  assets: ImageAsset[];
  images: ImageAsset[];
  totalSize: number;               // 전체 크기 (bytes)
  extractedAt: number;             // 추출 시간
  pageUrl: string;                 // 페이지 URL
  pageTitle: string;               // 페이지 제목
  stats: {
    totalCount: number;
    totalSize: number;
    byType: Record<ImageType, number>;
    byFormat: Record<string, number>;
  };
}

/**
 * 다운로드 옵션
 */
export interface DownloadOptions {
  format: DownloadFormat;
  filenamePattern?: FilenamePattern;
  includeMetadata?: boolean;       // 메타데이터 포함
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
  id: string;
  url: string;
  size: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
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
  alternatives?: {
    webp?: { size: number; savings: number };
    avif?: { size: number; savings: number };
  };
}

/**
 * 최적화 제안
 */
export interface OptimizationSuggestion {
  type: 'format' | 'size' | 'compression' | 'lazyload' | 'dimensions' | 'lazy-loading';
  severity: 'low' | 'medium' | 'high';
  message: string;
  currentValue?: unknown;
  suggestedValue?: unknown;
  potentialSavings?: number;
}

/**
 * 에셋 관리 설정
 */
export interface AssetManagerSettings {
  minImageSize: number;
  maxImageSize: number;
  includeDataUri: boolean;
  includeSvg: boolean;
  includeIcons: boolean;
  includeBackgrounds: boolean;
  detectLazyLoad: boolean;
  autoAnalyze: boolean;
  defaultDownloadFormat: DownloadFormat;
  defaultFilenamePattern: FilenamePattern;
  autoExtract: boolean;            // 페이지 로드 시 자동 추출
  includeBackgroundImages: boolean;
  minDimensions: {
    width: number;
    height: number;
  };
  defaultDownloadFormat2?: 'zip' | 'folder';
  defaultFilenamePattern2?: 'original' | 'numbered' | 'hash';
}

/**
 * 에셋 관리 통계
 */
export interface AssetManagerStats {
  totalExtracted: number;
  totalDownloaded: number;
  totalSize: number;
  averageSize: number;
  largestAsset: {
    url: string;
    size: number;
  };
  mostCommonFormat: string;
  lastExtraction: number;
  byType: Record<ImageType, number>;
  byFormat: Record<string, number>;
  largestImage?: ImageAsset;
  lastExtractedAt: number;
}

/**
 * 에셋 필터
 */
export interface AssetFilter {
  type?: ImageType[];
  source?: ImageSource[];
  minSize?: number;
  maxSize?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  format?: string[];
  searchQuery?: string;
}
