/**
 * Font Analyzer Default Settings
 *
 * 폰트 분석 기본 설정값
 */

import type { FontAnalyzerSettings, FontFormat } from '../types/fontAnalyzer';

/**
 * 폰트 분석 기본 설정
 */
export const DEFAULT_FONT_ANALYZER_SETTINGS: FontAnalyzerSettings = {
  autoScan: false,
  showSystemFonts: true,
  showWebFonts: true,
  highlightOnHover: true,
  showMetrics: false,
  checkLoading: true,
  theme: 'light',
};

/**
 * 폰트 형식별 MIME 타입
 */
export const FONT_FORMATS: Record<FontFormat, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  svg: 'image/svg+xml',
};

/**
 * 폰트 파일 확장자
 */
export const FONT_EXTENSIONS: Record<FontFormat, string> = {
  woff: 'woff',
  woff2: 'woff2',
  ttf: 'ttf',
  otf: 'otf',
  eot: 'eot',
  svg: 'svg',
};

/**
 * 폰트 두께 라벨
 */
export const FONT_WEIGHT_LABELS: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
};

/**
 * 폰트 스타일 라벨
 */
export const FONT_STYLE_LABELS: Record<string, string> = {
  normal: 'Normal',
  italic: 'Italic',
  oblique: 'Oblique',
};

/**
 * 폰트 스택(stretch) 값
 */
export const FONT_STRETCH_VALUES = [
  'ultra-condensed',
  'extra-condensed',
  'condensed',
  'semi-condensed',
  'normal',
  'semi-expanded',
  'expanded',
  'extra-expanded',
  'ultra-expanded',
] as const;

/**
 * 일반적인 웹 폰트 CDN
 */
export const WEB_FONT_CDNS = {
  google: 'https://fonts.googleapis.com/css2',
  typekit: 'https://use.typekit.net',
  fonts: 'https://fonts.googleapis.com',
  fontawesome: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome',
} as const;

/**
 * 구글 폰트 기본 설정
 */
export const GOOGLE_FONT_DEFAULTS = {
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
  weights: [400, 700],
};

/**
 * 자주 사용되는 폰트 페어
 */
export const POPULAR_FONT_PAIRS = [
  { heading: 'Playfair Display', body: 'Source Sans Pro', category: 'elegant' },
  { heading: 'Montserrat', body: 'Open Sans', category: 'modern' },
  { heading: 'Oswald', body: 'Roboto', category: 'bold' },
  { heading: 'Lora', body: 'Lato', category: 'classic' },
  { heading: 'Raleway', body: 'Open Sans', category: 'clean' },
  { heading: 'Merriweather', body: 'Open Sans', category: 'readable' },
  { heading: 'Abril Fatface', body: 'Roboto Condensed', category: 'display' },
  { heading: 'Bebas Neue', body: 'Montserrat', category: 'modern' },
  { heading: 'Crimson Text', body: 'Work Sans', category: 'editorial' },
  { heading: 'Libre Baskerville', body: 'Lato', category: 'classic' },
] as const;

/**
 * 시스템 폰트 목록
 */
export const SYSTEM_FONTS = {
  windows: [
    'Arial',
    'Calibri',
    'Cambria',
    'Cambria Math',
    'Consolas',
    'Courier New',
    'Georgia',
    'Impact',
    'Lucida Console',
    'Segoe UI',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
  ],
  mac: [
    'Arial',
    'SF Pro Display',
    'SF Pro Text',
    'Helvetica',
    'Helvetica Neue',
    'Geneva',
    'Monaco',
    'Times',
    'Courier',
    'Courier New',
    'Georgia',
    'Palatino',
    'Menlo',
    'Monaco',
  ],
  linux: [
    'DejaVu Sans',
    'DejaVu Serif',
    'Liberation Sans',
    'Liberation Serif',
    'Noto Sans',
    'Noto Serif',
    'Ubuntu',
    'Roboto',
    'Liberation Mono',
    'Ubuntu Mono',
  ],
  android: [
    'Roboto',
    'Noto Sans',
    'Droid Sans',
    'Droid Serif',
    'Noto Serif',
    'Ubuntu',
    'Open Sans',
    'Lato',
  ],
  ios: [
    'San Francisco',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'Courier',
    'Courier New',
    'Georgia',
    'Times New Roman',
    'Verdana',
  ],
} as const;

/**
 * 모바일 시스템 폰트
 */
export const MOBILE_SYSTEM_FONTS = {
  ios: [
    'San Francisco',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'Courier',
    'Courier New',
    'Georgia',
    'Times New Roman',
    'Verdana',
  ],
  android: [
    'Roboto',
    'Noto Sans',
    'Droid Sans',
    'Droid Serif',
    'Roboto Mono',
  ],
} as const;

/**
 * 프리텐더드 폰트 카테고리
 */
export const FONT_CATEGORIES = {
  serif: 'Serif',
  'sans-serif': 'Sans Serif',
  display: 'Display',
  handwriting: 'Handwriting',
  monospace: 'Monospace',
} as const;

/**
 * 폰트 메트릭스 기본값
 */
export const DEFAULT_FONT_METRICS = {
  ascent: 0.8,
  descent: 0.2,
  capHeight: 0.7,
  xHeight: 0.5,
  unitsPerEm: 1000,
} as const;

/**
 * 폰트 로딩 타임아웃 기본값
 */
export const FONT_LOAD_TIMEOUTS = {
  default: 3000,
  fast: 1000,
  slow: 5000,
} as const;

/**
 * 폰트 최적화 권장사항
 */
export const FONT_OPTIMIZATION_RECOMMENDATIONS = {
  woff2: 'WOFF2 형식 사용 (파일 크기 최적화)',
  subset: '필요한 문자만 서브셋팅',
  variable: '가변 폰트 사용 (파일 크기 감소)',
  display: 'font-display: swap 사용',
  preload: '중요한 폰트 프리로드',
} as const;

/**
 * 접근성 체크리스트
 */
export const ACCESSIBILITY_CHECKS = {
  minimumSize: {
    body: 16,
    heading: {
      h1: 48,
      h2: 36,
      h3: 28,
      h4: 22,
      h5: 18,
      h6: 16,
    },
  },
  contrastRatio: {
    normal: 4.5,
    large: 3,
  },
  lineHeight: {
    minimum: 1.3,
    recommended: 1.5,
  },
} as const;
