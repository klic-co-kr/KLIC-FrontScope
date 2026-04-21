/**
 * CSS Analyzer Index
 *
 * 모든 CSS 분석 유틸리티 내보내기
 */

// Style Extractor
export {
  extractElementStyle,
  extractCSSProperty,
  calculateSpecificity,
} from './styleExtractor';

// Box Model
export {
  extractBoxModel,
  createBoxModelOverlay,
  boxModelToCSS,
  compareBoxModels,
} from './boxModel';

// Color Analyzer
export {
  extractColorInfo,
  parseColor,
  calculateContrastRatio,
  calculateLuminance,
  blendColors,
  invertColor,
  adjustBrightness,
  adjustSaturation,
  extractPageColors,
  getMostUsedColors,
} from './colorAnalyzer';

// Font Analyzer
export {
  extractFontInfo,
  extractPageFonts,
  suggestFontPair,
  analyzeFontSizeHierarchy,
  calculateReadabilityScore,
  getWebFonts,
  getSystemFonts,
} from './fontAnalyzer';

// Flexbox Analyzer
export {
  extractFlexInfo,
  extractFlexItemInfo,
  isFlexContainer,
  findFlexContainers,
  createFlexOverlay,
  flexToCSS,
  recommendLayout,
} from './flexboxAnalyzer';

// Grid Analyzer
export {
  extractGridInfo,
  isGridContainer,
  findGridContainers,
  parseGridTrackSize,
  extractGridCellInfo,
  createGridOverlay,
  gridToCSS,
  visualizeGridTemplate,
  suggestResponsiveGrid,
} from './gridAnalyzer';
