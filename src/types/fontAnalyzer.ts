/**
 * Font Analyzer Type Definitions
 *
 * 폰트 분석 타입 정의
 */

/**
 * 폰트 정보
 */
export interface FontInfo {
  family: string;
  style: string;
  weight: number | string;
  size: number;
  sizeUnit: string;
  lineHeight: number;
  letterSpacing: string;
  wordSpacing: string;
  variant: string;
  stretch?: string;
}

/**
 * 폰트 메트릭스
 */
export interface FontMetrics {
  emHeight: number;
  ascent: number;
  descent: number;
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
  unitsPerEm: number;
}

/**
 * 웹 폰트 정보
 */
export interface WebFontInfo {
  family: string;
  source: string;
  url?: string;
  variants: FontVariant[];
  unicodeRange?: string;
  subset?: string;
}

/**
 * 폰트 변형
 */
export interface FontVariant {
  weight: number;
  style: string;
  width?: string;
  stretch?: string;
}

/**
 * 시스템 폰트 정보
 */
export interface SystemFont {
  family: string;
  available: boolean;
  platform: 'windows' | 'mac' | 'linux' | 'android' | 'ios';
}

/**
 * 폰트 사용 통계
 */
export interface FontUsageStats {
  family: string;
  count: number;
  percentage: number;
  elements: number;
  category?: FontCategory;
  variants?: string[];
}

/**
 * 폰트 페어 정보
 */
export interface FontPair {
  heading: string;
  body: string;
  score: number;
  contrast: number;
}

/**
 * 폰트 로딩 상태
 */
export type FontLoadingStatus = 'loading' | 'loaded' | 'error' | 'timeout';

/**
 * 폰트 로딩 정보
 */
export interface FontLoadInfo {
  family: string;
  status: FontLoadingStatus;
  loadTime?: number;
  error?: string;
}

/**
 * 텍스트 분석 결과
 */
export interface TextAnalysis {
  totalCharacters: number;
  totalWords: number;
  totalLines: number;
  averageWordLength: number;
  averageLineLength: number;
  language: string;
  fontUsage: FontUsageStats[];
}

/**
 * 렌더링� 관련 폰트 정보
 */
export interface RenderedFontInfo {
  family: string;
  actualFamily: string;
  requestedFamily: string;
  found: boolean;
}

/**
 * 폰트 대체 정보
 */
export interface FontFallback {
  requested: string;
  actual: string;
  reason: string;
}

/**
 * FOF (Flash Of Fonts) 방지
 */
export interface FontFOFOperation {
  type: 'preload' | 'font-display' | 'swap';
  value: string;
  description: string;
}

/**
 * 폰트 파일 형식
 */
export type FontFormat =
  | 'woff'
  | 'woff2'
  | 'ttf'
  | 'otf'
  | 'eot'
  | 'svg';

/**
 * 폰트 라이선스
 */
export interface FontLicense {
  type: 'open-source' | 'commercial' | 'free' | 'trial';
  url?: string;
  attribution?: string;
}

/**
 * 구글 폰트 스펙일
 */
export interface GoogleFontInfo {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
}

/**
 * Adobe 폰트 스펙일
 */
export interface AdobeFontInfo {
  family: string;
  type: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  source: 'typekit' | 'fonts';
}

/**
 * 폰트 최적화 정보
 */
export interface FontOptimization {
  subset: boolean;
  format: FontFormat;
  display: string;
  preload: boolean;
  variable: boolean;
  unicodeRange: string[];
}

/**
 * 폰트 검색 옵션
 */
export interface FontSearchOptions {
  query?: string;
  weight?: number | number[];
  style?: string | string[];
  category?: string;
  platform?: string;
}

/**
 * 폰트 분석 결과
 */
export interface FontAnalysisResult {
  timestamp: number;
  url: string;
  title: string;
  fonts: FontUsageStats[];
  webFonts: WebFontInfo[];
  systemFonts: SystemFont[];
  totalElements: number;
  uniqueFamilies: number;
  recommendations: FontRecommendation[];
}

/**
 * 폰트 추천
 */
export interface FontRecommendation {
  type: 'pairing' | 'performance' | 'accessibility' | 'consistency';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Font Analyzer 설정
 */
export interface FontAnalyzerSettings {
  autoScan: boolean;
  showSystemFonts: boolean;
  showWebFonts: boolean;
  highlightOnHover: boolean;
  showMetrics: boolean;
  checkLoading: boolean;
  theme: 'light' | 'dark';
}

/**
 * 폰트 카테고리
 */
export type FontCategory =
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'fantasy'
  | 'display';

/**
 * 폰트 비교 결과
 */
export interface FontComparisonResult {
  font1: FontInfo;
  font2: FontInfo;
  similarityScore: number;
  diffs: FontDiff[];
  isIdentical: boolean;
}

/**
 * 폰트 차이점
 */
export interface FontDiff {
  property: string;
  value1: string | number;
  value2: string | number;
  significant: boolean;
}

/**
 * 폰트 감지 결과
 */
export interface FontDetectionResult {
  systemFonts: string[];
  webFonts: string[];
  unknownFonts: string[];
  totalFonts: number;
  usedFonts: Array<{
    family: string;
    count: number;
    variants: string[];
    category: FontCategory;
  }>;
}

/**
 * 메트릭스 오버레이 옵션
 */
export interface MetricsOverlayOptions {
  showAscender?: boolean;
  showDescender?: boolean;
  showCapHeight?: boolean;
  showXHeight?: boolean;
  showBaseline?: boolean;
  showMedian?: boolean;
  color?: string;
  lineWidth?: number;
}
