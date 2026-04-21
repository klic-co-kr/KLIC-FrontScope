// src/utils/gif/estimateGifSize.ts
import { GIF_QUALITY_COLORS } from '../../types/recording';
import type { GIFQuality, GIFSettings, GIFWidth } from '../../types/recording';

export const GIF_SIZE_BUDGETS_MB = [15, 25, 35] as const;

type BudgetStatus = 'ok' | 'warning' | 'critical';

interface GifSettingsSuggestion {
  width: GIFWidth;
  fps: number;
  quality: GIFQuality;
}

export interface GifSizeBudgetAssessment {
  estimatedSizeMb: number;
  targetBudgetMb: number;
  status: BudgetStatus;
  suggestion?: GifSettingsSuggestion;
}

/**
 * Estimate GIF file size in MB based on settings.
 *
 * Heuristic: GIF byte size per frame ~ width * aspectHeight * colorDepthFactor / compressionRatio
 * LZW compression typically achieves 2-4x on screen content.
 */
export function estimateGifSize(settings: GIFSettings): number {
  const { duration, fps, quality, width, qualityProfile } = settings;
  const frameCount = duration * fps;
  const height = Math.round(width * 0.5625); // assume 16:9 aspect (common viewport)
  const colors = GIF_QUALITY_COLORS[quality];

  // Bytes per pixel in palette-indexed GIF: ~1 byte (8-bit index)
  // LZW compression ratio: ~3x for typical screen content
  const colorDepthFactor = colors / 256; // higher colors = larger
  const profileFactor = qualityProfile === 'highFidelity' ? 1.5 : 1;
  const rawBytesPerFrame = width * height * 1 * colorDepthFactor;
  const compressedBytesPerFrame = (rawBytesPerFrame / 3) * profileFactor;

  // GIF overhead: header + color table + frame descriptors
  const overhead = 1024; // ~1KB
  const totalBytes = overhead + frameCount * compressedBytesPerFrame;

  return Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
}

export function assessGifSizeBudget(settings: GIFSettings): GifSizeBudgetAssessment {
  const estimatedSizeMb = estimateGifSize(settings);
  const targetBudgetMb = settings.qualityProfile === 'highFidelity' ? GIF_SIZE_BUDGETS_MB[2] : GIF_SIZE_BUDGETS_MB[1];

  if (estimatedSizeMb <= GIF_SIZE_BUDGETS_MB[1]) {
    return { estimatedSizeMb, targetBudgetMb, status: 'ok' };
  }

  if (estimatedSizeMb <= targetBudgetMb) {
    return {
      estimatedSizeMb,
      targetBudgetMb,
      status: 'warning',
      suggestion: suggestDownshift(settings, targetBudgetMb),
    };
  }

  return {
    estimatedSizeMb,
    targetBudgetMb,
    status: 'critical',
    suggestion: suggestDownshift(settings, targetBudgetMb),
  };
}

function suggestDownshift(settings: GIFSettings, targetBudgetMb: number): GifSettingsSuggestion {
  const widthSteps: GIFWidth[] = [320, 640, 800, 960, 1280];
  const fpsSteps = [5, 10, 15];
  const qualitySteps: GIFQuality[] = ['low', 'medium', 'high'];

  const next = {
    width: settings.width,
    fps: settings.fps,
    quality: settings.quality,
  } satisfies GifSettingsSuggestion;

  while (estimateGifSize({ ...settings, ...next }) > targetBudgetMb) {
    const widthIndex = widthSteps.indexOf(next.width);
    if (widthIndex > 0) {
      next.width = widthSteps[widthIndex - 1];
      continue;
    }

    const fpsIndex = fpsSteps.indexOf(next.fps);
    if (fpsIndex > 0) {
      next.fps = fpsSteps[fpsIndex - 1];
      continue;
    }

    const qualityIndex = qualitySteps.indexOf(next.quality);
    if (qualityIndex > 0) {
      next.quality = qualitySteps[qualityIndex - 1];
      continue;
    }

    break;
  }

  return next;
}
