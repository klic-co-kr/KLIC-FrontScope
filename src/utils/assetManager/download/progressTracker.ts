/**
 * Progress Tracker
 * Tracks download progress for multiple assets
 */

import type { ImageAsset } from '../../../types/assetManager';

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  currentAsset?: ImageAsset;
  errors: Array<{ asset: ImageAsset; error: string }>;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

/**
 * Creates a progress tracker
 */
export function createProgressTracker(total: number): DownloadProgress {
  return {
    total,
    completed: 0,
    failed: 0,
    errors: [],
  };
}

/**
 * Updates progress and notifies callback
 */
export function updateProgress(
  progress: DownloadProgress,
  asset: ImageAsset,
  success: boolean,
  error?: string,
  onProgress?: ProgressCallback
): void {
  if (success) {
    progress.completed++;
  } else {
    progress.failed++;
    if (error) {
      progress.errors.push({ asset, error });
    }
  }

  progress.currentAsset = asset;

  if (onProgress) {
    onProgress({ ...progress });
  }
}

/**
 * Gets progress percentage
 */
export function getProgressPercentage(progress: DownloadProgress): number {
  if (progress.total === 0) return 0;
  return Math.round(((progress.completed + progress.failed) / progress.total) * 100);
}

/**
 * Checks if download is complete
 */
export function isComplete(progress: DownloadProgress): boolean {
  return progress.completed + progress.failed >= progress.total;
}

/**
 * Gets a summary message for the progress
 */
export function getProgressSummary(progress: DownloadProgress): string {
  const percentage = getProgressPercentage(progress);
  const parts: string[] = [];

  parts.push(`${percentage}%`);

  if (progress.completed > 0) {
    parts.push(`${progress.completed} completed`);
  }

  if (progress.failed > 0) {
    parts.push(`${progress.failed} failed`);
  }

  return parts.join(' - ');
}
