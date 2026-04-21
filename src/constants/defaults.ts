/**
 * Default Settings Constants
 *
 * 각 도구의 기본 설정값 정의
 */

import type { TextEditSettings } from '../types/textEdit';
import type { RulerSettings } from '../types/ruler';
import type { AssetManagerSettings } from '../types/assetManager';
import type { ColorPickerSettings } from '../types/colorPicker';
import type { ResourceNetworkSettings } from '../types/resourceNetwork';
import type { GridLayoutSettings } from '../types/gridLayout';
import type { ConsoleSettings } from '../types/console';
import type { TailwindSettings } from '../types/tailwindScanner';
import { DEFAULT_COLOR_FORMAT } from './colors';
import { DEFAULT_VIEWPORT_PRESET } from './viewportPresets';
import { getPresetById } from './viewportPresets';

/**
 * 텍스트 편집 기본 설정
 */
export const DEFAULT_TEXT_EDIT_SETTINGS: TextEditSettings = {
  maxHistorySize: 20,
  autoSave: true,
  preserveFormatting: true,
  highlightColor: '#f59e0b',
  enableKeyboardShortcuts: true,
  shortcuts: {
    save: 'Enter',
    cancel: 'Escape',
    undo: 'Ctrl+Z',
  },
};

/**
 * 스크린샷 기본 설정
 */
export const DEFAULT_SCREENSHOT_SETTINGS = {
  format: 'png' as const,
  quality: 0.92,
  captureMode: 'element' as const,
  enableAnnotations: true,
  autoDownload: false,
} as const;

/**
 * CSS 스캔 기본 설정
 */
export const DEFAULT_CSS_SCAN_SETTINGS = {
  showInherited: true,
  showComputed: true,
  showBoxModel: true,
  formatOutput: true,
} as const;

/**
 * 폰트 분석 기본 설정
 */
export const DEFAULT_FONT_SETTINGS = {
  includeSystemFonts: true,
  includeWebFonts: true,
  showPreviews: true,
  previewText: '가나다라 ABC abc 123',
} as const;

/**
 * 컬러피커 기본 설정
 */
export const DEFAULT_COLOR_PICKER_SETTINGS: ColorPickerSettings = {
  defaultFormat: DEFAULT_COLOR_FORMAT,
  autoSave: true,
  maxHistorySize: 0,             // 무제한
  enableEyeDropper: true,
  showContrastChecker: true,
  autoCopyToClipboard: false,
  generatePaletteOnPick: true,
  defaultPaletteType: 'analogous',
};

/**
 * 자/측정 기본 설정
 */
export const DEFAULT_RULER_SETTINGS: RulerSettings = {
  maxHistorySize: 20,
  unit: 'px',
  showBoxModel: true,
  lineColor: '#3b82f6',
  labelColor: '#ffffff',
  lineWidth: 2,
  snapToPixel: true,
  showAngle: true,
  showAspectRatio: true,
};

/**
 * 자/측정 색상
 */
export const RULER_COLORS = {
  PRIMARY: '#3b82f6',
  CONTENT: '#22c55e',
  PADDING: '#f59e0b',
  BORDER: '#ef4444',
  MARGIN: '#a855f7',
} as const;

/**
 * 에셋 관리 기본 설정
 */
export const DEFAULT_ASSET_MANAGER_SETTINGS: AssetManagerSettings = {
  minImageSize: 1024, // 1KB
  maxImageSize: 10485760, // 10MB
  includeDataUri: true,
  includeSvg: true,
  includeIcons: false,
  includeBackgrounds: true,
  includeBackgroundImages: true,
  detectLazyLoad: true,
  autoAnalyze: false,
  autoExtract: false,
  defaultDownloadFormat: 'original',
  defaultFilenamePattern: 'original',
  minDimensions: {
    width: 10,
    height: 10,
  },
};

/**
 * 이미지 포맷 목록
 */
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'] as const;

/**
 * Lazy Load 속성 목록
 */
export const LAZY_LOAD_ATTRIBUTES = ['data-src', 'data-srcset', 'data-lazy', 'data-original'] as const;

/**
 * 콘솔 기본 설정
 */
export const DEFAULT_CONSOLE_SETTINGS: ConsoleSettings = {
  maxHistorySize: 1000,
  captureStackTrace: true,
  preserveLog: true,
  groupSimilar: true,
  timestampFormat: 'HH:mm:ss.SSS',
  enabledLevels: ['log', 'warn', 'error', 'info', 'debug'],
  maxMessageLength: 10000,
};


/**
 * 공통 앱 설정
 */
export const DEFAULT_APP_SETTINGS = {
  theme: 'dark' as const,
  language: 'ko' as const,
  autoSave: true,
  enableToasts: true,
  enableKeyboardShortcuts: true,
} as const;

/**
 * 그리드 레이아웃 기본 설정
 */
export const DEFAULT_GRID_LAYOUT_SETTINGS: GridLayoutSettings = {
  guideLines: {
    items: [],
    showOnHover: false,
    snapToLines: true,
    snapThreshold: 5,
    maxGuidelines: 50,
  },
  viewport: {
    preset: getPresetById(DEFAULT_VIEWPORT_PRESET) || null,
    customWidth: 1280,
    customHeight: 720,
    orientation: 'landscape',
    zoom: 1,
  },
  gridOverlay: {
    enabled: false,
    columns: 12,
    gap: 16,
    margin: 'auto',
    maxWidth: '100%',
    color: '#3b82f6',
    opacity: 0.5,
    style: 'dashed',
    showColumnNumbers: false,
    breakpoints: {
      sm: { enabled: false, columns: 4 },
      md: { enabled: false, columns: 8 },
      lg: { enabled: false, columns: 12 },
      xl: { enabled: false, columns: 12 },
      '2xl': { enabled: false, columns: 12 },
    },
  },
  whitespace: {
    enabled: false,
    pattern: 'diagonal',
    color: '#ef4444',
    opacity: 0.1,
    size: 10,
  },
  keyboardShortcuts: {
    toggleGrid: 'Ctrl+Shift+G',
    toggleGuides: 'Ctrl+Shift+H',
    clearAll: 'Ctrl+Shift+X',
  },
} as const;

/**
 * 리소스 및 네트워크 기본 설정
 */
export const DEFAULT_RESOURCE_NETWORK_SETTINGS: ResourceNetworkSettings = {
  storage: {
    autoClean: false,
    cleanOnClose: false,
    preserveDomains: [],
  },
  animation: {
    highlightOnHover: true,
    showPerformanceImpact: true,
    pauseAll: false,
  },
  network: {
    captureRequests: true,
  },
  cache: {
    showExpired: true,
    autoCleanExpired: false,
  },
} as const;

/**
 * 테일윈드 기본 설정
 */
export const DEFAULT_TAILWIND_SETTINGS: TailwindSettings = {
  detectJIT: true,
  includeArbitrary: true,
  showSuggestions: true,
  autoScan: false,
  maxHistorySize: 50,
};
