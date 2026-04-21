/**
 * Screenshot Utilities Index
 *
 * 모든 스크린샷 유틸리티 내보내기
 */

// Chrome native capture (replaces html2canvas)
export {
  captureVisibleTab,
  captureElement,
  captureFullPage,
  captureArea,
} from './chromeCapture';

// Image format utilities
export {
  canvasToDataUrl,
  getMimeType,
  getFileExtension,
  convertFormat,
  calculateCompressionRatio,
  getOptimalQuality,
  isFormatSupported,
  supportsWebP,
  supportsAVIF,
} from './imageFormat';

// Image resize utilities
export {
  resizeCanvas,
  resizeByAspectRatio,
  resizeForThumbnail,
  cropCanvas,
  addPadding,
  rotateCanvas,
  flipCanvas,
  calculateOptimalSize,
  calculateAspectRatio,
  calculateThumbnailSize,
} from './imageResize';

// Download helpers
export {
  copyImageToClipboard,
  dataUrlToBlob,
  downloadDataUrl,
  downloadBlob,
  generateDownloadFilename,
  calculateDataUrlSize as calculateDataUrlSizeDownload,
  formatBytes,
  checkDownloadPermission,
  checkClipboardPermission,
  downloadMultipleImages,
  base64ToUint8Array,
  blobToDataUrl,
} from './downloadHelpers';

// Canvas merge utilities
export {
  mergeCanvasesVertical,
  mergeCanvasesHorizontal,
  mergeCanvasesWithPosition,
  mergeCanvasesWithoutOverlap,
  mergeCanvasesGrid,
  mergeCanvases,
  type CanvasToMerge,
} from './canvasMerge';

// Area selection utilities
export {
  startSelection,
  updateSelection,
  endSelection,
  cancelSelection,
  getNormalizedArea,
  highlightElement,
  highlightElements,
  dimScreen,
  isSelecting,
  getCurrentSelection,
  type SelectionState,
} from './areaSelector';

// Cursor capture utilities
export {
  getCursorPosition,
  startCursorTracking,
  drawCursor,
  drawCursorPath,
  drawCursorHighlight,
  drawClickEffect,
  isCursorInArea,
  calculateCursorDistance,
  simplifyCursorPath,
  type CursorPosition,
  type CursorPath,
} from './cursorCapture';

// Default options
export { getDefaultCaptureOptions } from './defaults';
