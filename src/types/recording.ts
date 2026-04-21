// src/types/recording.ts

export type GIFQuality = 'low' | 'medium' | 'high';
export type GIFQualityProfile = 'balanced' | 'highFidelity';
export type GIFWidth = 320 | 640 | 800 | 960 | 1280;

export type RecordingMode = 'fullscreen' | 'selection' | 'element';

export const GIF_QUALITY_COLORS: Record<GIFQuality, number> = {
  low: 64,
  medium: 128,
  high: 256,
};

export interface CropBounds {
  x: number;       // viewport-relative
  y: number;
  width: number;
  height: number;
}

export interface GIFSettings {
  duration: number;       // 3-30s, default 10
  fps: number;            // 5, 10, 15, default 15 (ShareX default)
  quality: GIFQuality;
  qualityProfile: GIFQualityProfile;
  width: GIFWidth; // output width, default 640
  mode: RecordingMode;
}

export const DEFAULT_GIF_SETTINGS: GIFSettings = {
  duration: 10,
  fps: 15,
  quality: 'medium',
  qualityProfile: 'balanced',
  width: 640,
  mode: 'fullscreen',
};

export interface RecordingState {
  isRecording: boolean;
  isEncoding: boolean;
  isSelecting: boolean;
  elapsed: number;         // seconds
  frameCount: number;
  encodingProgress: number; // 0-100
}

export interface RecordingConfig {
  tabId: number;
  windowId: number;
  width: number;
  height: number;
  fps: number;
  maxDuration: number;
  maxColors: number;
  qualityProfile?: GIFQualityProfile;
  mode: RecordingMode;
  cropBounds?: CropBounds;
  viewportWidth?: number;
}

/**
 * 인코딩 상태 (state in RecordingState)
 */
export interface EncodingProgress {
  /** 인코딩 중 여부 */
  isEncoding: boolean
  /** 인코딩 진행률 0-100 */
  encodingProgress: number
}

/**
 * GIF 녹화 상태 (인코딩 상태 포함)
 */
export type RecordingStateWithEncoding = RecordingState & EncodingProgress
