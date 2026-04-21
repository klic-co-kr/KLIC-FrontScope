/**
 * Font Analyzer Utilities Index
 *
 * 폰트 분석 유틸리티 인덱스
 */

// Font Extractor
export {
  extractFontInfo,
  parseFontWeight,
  normalizeFontStyle,
  extractFontMetrics,
  getRenderedFontFamily,
  detectFontFallback,
  isFontAvailable,
  extractFontsFromText,
  extractAllPageFonts,
  analyzeFontSizes,
  analyzeLineHeights,
  analyzeLetterSpacing,
  analyzeWordSpacing,
} from './fontExtractor';

// Web Font Utilities
export {
  extractWebFonts,
  loadGoogleFont,
  checkFontLoadStatus,
  checkAllFontLoads,
  loadTypekitFont,
  detectTypekitFonts,
  detectAdobeFonts,
  createFontPreview,
  detectFontFormat,
  generateFontOptimization,
  searchGoogleFonts,
  calculatePairScore as calculateWebFontPairScore,
  getGoogleFonts,
  getAdobeFonts,
} from './webFontUtils';

// System Font Utilities
export {
  getSystemFonts,
  getDefaultSystemFonts,
  getMobileSystemFonts,
  getDefaultBodyFont,
  getMonospaceFonts,
  getSerifFonts,
  getSansSerifFonts,
  getDisplayFonts,
  getFontInstallationOrder,
  getSafeWebFontFallbacks,
  recommendSystemFontsForLanguage,
  detectKoreanSystemFonts,
  recommendKoreanWebFonts,
  recommendJapaneseWebFonts,
  recommendChineseWebFonts,
} from './systemFontUtils';

// Font Pairing
export {
  suggestFontPair,
  createPairPreview,
  calculatePairContrast,
  validatePair,
  getDocumentFontPairings,
} from './fontPairing';

// Font Comparator
export {
  compareFonts,
  compareMultipleFonts,
  groupFontsByStyle,
  detectFontChanges,
  compareFontVariant,
  compareFontStretch,
  findMostCommonFont,
  compareFontChains,
  compareResponsiveFont,
} from './fontComparator';

// Font Detector
export {
  detectAllFonts,
  categorizeFont,
  detectElementFont,
  detectFOBIT,
  detectFontLoadFailures,
  detectUnusedWebFonts,
  estimateWebFontSize,
  detectCJKFonts,
  detectVariableFonts,
  checkFontOptimization,
} from './fontDetector';

// Font Metrics
export {
  createMetricsOverlay,
  toggleMetricsGuide,
  createMetricsInfoPanel,
  createBaselineGrid,
  measureRenderedFontMetrics,
  compareFontMetrics,
  measureVisualFontSize,
} from './fontMetrics';
