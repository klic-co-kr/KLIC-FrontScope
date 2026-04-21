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
