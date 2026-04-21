export type JsInspectorRelation = 'self' | `ancestor-${number}`;

export interface JsInspectorInlineHandler {
  eventType: string;
  code: string;
}

export interface JsInspectorTargetRequest {
  selector: string;
  xpath: string;
  relation: JsInspectorRelation;
  tagName: string;
  id?: string;
  className?: string;
  inlineHandlers: JsInspectorInlineHandler[];
}

export interface JsInspectorListener {
  id: string;
  relation: JsInspectorRelation;
  selector: string;
  tagName: string;
  eventType: string;
  useCapture: boolean;
  passive: boolean;
  once: boolean;
  isInlineHandler: boolean;
  scriptId?: string;
  scriptUrl?: string;
  lineNumber?: number;
  columnNumber?: number;
  sourceMapUrl?: string;
  originalScriptUrl?: string;
  originalLineNumber?: number;
  originalColumnNumber?: number;
  handlerSource?: string;
  scriptSnippet?: string;
  originalSnippet?: string;
}

export interface JsInspectorDepthPathNode {
  relation: JsInspectorRelation;
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
}

export interface JsInspectorSelectionState {
  depth: number;
  maxDepth: number;
  clicked: JsInspectorDepthPathNode;
  anchor: JsInspectorDepthPathNode;
  path: JsInspectorDepthPathNode[];
}

export interface JsInspectorResult {
  analyzedAt: number;
  targetCount: number;
  totalListeners: number;
  listeners: JsInspectorListener[];
  warnings: string[];
  selection?: JsInspectorSelectionState;
}
