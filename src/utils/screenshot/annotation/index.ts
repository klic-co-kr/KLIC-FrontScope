/**
 * Annotation Utilities Index
 *
 * 모든 주석 유틸리티 내보내기
 */

// Drawing utilities
export {
  drawLine,
  drawArrow,
  drawDoubleArrow,
  drawRectangle,
  drawCircle,
  drawEllipse,
  drawPolygon,
  drawSmoothCurve,
  drawFreehand,
  eraseArea,
  drawPoint,
  drawGrid,
  drawRoundedRectangle,
  addShadow,
  removeShadow,
} from './drawing';

// Text annotation utilities
export {
  measureText,
  wrapText,
  drawText,
  drawTextBox,
  drawNumberedText,
  drawSpeechBubble,
  drawRotatedText,
} from './textAnnotation';

// Shape annotation utilities
export {
  drawShape,
  drawPolygon as drawPolygonShape,
  drawHighlight,
  drawBlur,
  drawPixelate,
  drawSelectionHandles,
  drawRotationHandle,
} from './shapeAnnotation';

// Annotation manager
export {
  AnnotationManager,
  createAnnotationManager,
  type AnnotationManagerState,
} from './annotationManager';

// Annotation renderer
export {
  AnnotationRenderer,
  createAnnotationContainer,
  updateLayerSize,
  mergeLayers,
  type RendererOptions,
} from './annotationRenderer';

// Annotation history
export {
  AnnotationHistory,
  createAnnotationHistory,
  exportHistory,
  importHistory,
  type HistoryEntry,
  type HistoryState,
} from './history';
