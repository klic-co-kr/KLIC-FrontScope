import { ImageAsset, ImageAnalysis, OptimizationSuggestion } from '../../../types/assetManager';
import { getImageSize, getImageDimensions } from '../imageMeasure';

/**
 * 이미지 분석
 */
export async function analyzeImage(asset: ImageAsset): Promise<ImageAnalysis> {
  const analysis: ImageAnalysis = {
    id: asset.id,
    url: asset.url,
    format: asset.format || 'unknown',
    dimensions: asset.dimensions || { width: 0, height: 0 },
    size: asset.size || 0,
    aspectRatio: (asset.dimensions?.width || 0) / (asset.dimensions?.height || 1),
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
