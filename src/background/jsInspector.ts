import type {
  JsInspectorListener,
  JsInspectorRelation,
  JsInspectorResult,
  JsInspectorTargetRequest,
} from '@/types/jsInspector';
import { TraceMap, originalPositionFor, sourceContentFor, type SourceMapInput } from '@jridgewell/trace-mapping';

const DEBUGGER_PROTOCOL_VERSION = '1.3';
const MAX_TARGETS = 20;
const MAX_HANDLER_SOURCE_LENGTH = 8000;
const MAX_SCRIPT_SNIPPET_LENGTH = 6000;
const MAX_JQUERY_LISTENERS_PER_NODE = 80;

type Debuggee = chrome.debugger.Debuggee;

interface ScriptMeta {
  url?: string;
  sourceMapURL?: string;
}

interface ResolvedNode {
  nodeId: number;
  backendNodeId?: number;
  objectId: string;
}

interface CdpEventListener {
  type?: string;
  useCapture?: boolean;
  passive?: boolean;
  once?: boolean;
  scriptId?: string;
  lineNumber?: number;
  columnNumber?: number;
  handler?: {
    objectId?: string;
  };
  originalHandler?: {
    objectId?: string;
  };
  backendNodeId?: number;
}

type ScriptRegistry = Map<number, Map<string, ScriptMeta>>;

const scriptRegistry: ScriptRegistry = new Map();

chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;
  if (typeof tabId !== 'number') {
    return;
  }

  if (method !== 'Debugger.scriptParsed') {
    return;
  }

  const payload = (typeof params === 'object' && params !== null
    ? (params as Record<string, unknown>)
    : null);

  const scriptId = payload && typeof payload.scriptId === 'string' ? payload.scriptId : null;
  if (!scriptId) {
    return;
  }

  const tabScripts = scriptRegistry.get(tabId) ?? new Map<string, ScriptMeta>();
  tabScripts.set(scriptId, {
    url: payload && typeof payload.url === 'string' ? payload.url : undefined,
    sourceMapURL: payload && typeof payload.sourceMapURL === 'string' ? payload.sourceMapURL : undefined,
  });
  scriptRegistry.set(tabId, tabScripts);
});

chrome.debugger.onDetach.addListener((source) => {
  const tabId = source.tabId;
  if (typeof tabId === 'number') {
    scriptRegistry.delete(tabId);
  }
});

interface CdpDomGetDocumentResponse {
  root?: {
    nodeId: number;
  };
}

interface CdpDomQuerySelectorResponse {
  nodeId?: number;
}

interface CdpDomResolveNodeResponse {
  object?: {
    objectId?: string;
  };
}

interface CdpDomDescribeNodeResponse {
  node?: {
    backendNodeId?: number;
  };
}

interface CdpDomDebuggerResponse {
  listeners?: CdpEventListener[];
}

interface CdpRuntimeCallFunctionOnResponse {
  result?: {
    objectId?: string;
    type?: string;
    value?: unknown;
  };
}

interface CdpRuntimePropertyValue {
  objectId?: string;
  value?: unknown;
}

interface CdpRuntimePropertyDescriptor {
  name?: string;
  value?: CdpRuntimePropertyValue;
}

interface CdpRuntimeGetPropertiesResponse {
  result?: CdpRuntimePropertyDescriptor[];
  internalProperties?: Array<{
    name?: string;
    value?: {
      objectId?: string;
    };
  }>;
}

interface CdpDebuggerGetScriptSourceResponse {
  scriptSource?: string;
}

interface FunctionLocation {
  scriptId?: string;
  lineNumber?: number;
  columnNumber?: number;
}

interface SourceMapResolution {
  traceMap: TraceMap;
  resolvedMapUrl?: string;
  sourceContentCache: Map<string, string | null>;
}

type SourceMapCache = Map<string, SourceMapResolution | null>;

interface OriginalMappingData {
  sourceMapUrl?: string;
  originalScriptUrl?: string;
  originalLineNumber?: number;
  originalColumnNumber?: number;
  originalSnippet?: string;
}

function toDebuggee(tabId: number): Debuggee {
  return { tabId };
}

async function sendCommand<T>(
  tabId: number,
  method: string,
  commandParams?: Record<string, unknown>
): Promise<T> {
  return chrome.debugger.sendCommand(toDebuggee(tabId), method, commandParams) as Promise<T>;
}

function normalizeDebuggerError(error: unknown): string {
  const fallback = 'Failed to inspect JavaScript listeners.';
  const message = error instanceof Error ? error.message : String(error ?? fallback);

  if (message.includes('Another debugger is already attached')) {
    return 'Cannot inspect while another debugger (DevTools) is attached to this tab.';
  }
  if (message.includes('Cannot access') || message.includes('No tab with id')) {
    return 'Cannot access this tab for JS inspection.';
  }

  return message || fallback;
}

async function attachDebugger(tabId: number): Promise<void> {
  await chrome.debugger.attach(toDebuggee(tabId), DEBUGGER_PROTOCOL_VERSION);
  await sendCommand(tabId, 'DOM.enable');
  await sendCommand(tabId, 'Runtime.enable');
  await sendCommand(tabId, 'Debugger.enable');
  await new Promise((resolve) => setTimeout(resolve, 60));
}

async function detachDebugger(tabId: number): Promise<void> {
  try {
    await chrome.debugger.detach(toDebuggee(tabId));
  } catch {
    return;
  }
}

function ensureString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function ensureRelation(value: unknown): JsInspectorRelation | null {
  if (value === 'self') {
    return 'self';
  }
  if (typeof value === 'string' && /^ancestor-\d+$/.test(value)) {
    return value as JsInspectorRelation;
  }
  return null;
}

function getPropertyDescriptor(
  descriptors: CdpRuntimePropertyDescriptor[] | undefined,
  name: string
): CdpRuntimePropertyDescriptor | undefined {
  return descriptors?.find((descriptor) => descriptor.name === name);
}

function getStringProperty(
  descriptors: CdpRuntimePropertyDescriptor[] | undefined,
  name: string
): string | undefined {
  return ensureString(getPropertyDescriptor(descriptors, name)?.value?.value) ?? undefined;
}

function getBooleanProperty(
  descriptors: CdpRuntimePropertyDescriptor[] | undefined,
  name: string
): boolean | undefined {
  const raw = getPropertyDescriptor(descriptors, name)?.value?.value;
  return typeof raw === 'boolean' ? raw : undefined;
}

function getObjectIdProperty(
  descriptors: CdpRuntimePropertyDescriptor[] | undefined,
  name: string
): string | undefined {
  return ensureString(getPropertyDescriptor(descriptors, name)?.value?.objectId) ?? undefined;
}

function isInternalExtensionScript(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return (
    url.startsWith('chrome-extension://')
    || url.startsWith('moz-extension://')
    || url.startsWith('extension://')
  );
}

function sanitizeTargets(rawTargets: unknown): JsInspectorTargetRequest[] {
  if (!Array.isArray(rawTargets)) {
    return [];
  }

  const sanitized: JsInspectorTargetRequest[] = [];
  const seenSelectors = new Set<string>();

  for (const target of rawTargets) {
    if (typeof target !== 'object' || target === null) {
      continue;
    }

    const selector = ensureString((target as Record<string, unknown>).selector);
    const xpath = ensureString((target as Record<string, unknown>).xpath);
    const relation = ensureRelation((target as Record<string, unknown>).relation);
    const tagName = ensureString((target as Record<string, unknown>).tagName);

    if (!selector || !xpath || !relation || !tagName) {
      continue;
    }

    if (seenSelectors.has(selector)) {
      continue;
    }
    seenSelectors.add(selector);

    const inlineHandlersRaw = (target as Record<string, unknown>).inlineHandlers;
    const inlineHandlers = Array.isArray(inlineHandlersRaw)
      ? inlineHandlersRaw
          .map((handler) => {
            if (typeof handler !== 'object' || handler === null) {
              return null;
            }

            const eventType = ensureString((handler as Record<string, unknown>).eventType);
            const code = ensureString((handler as Record<string, unknown>).code);
            if (!eventType || !code) {
              return null;
            }

            return { eventType, code };
          })
          .filter((handler): handler is { eventType: string; code: string } => handler !== null)
      : [];

    sanitized.push({
      selector,
      xpath,
      relation,
      tagName,
      id: ensureString((target as Record<string, unknown>).id) ?? undefined,
      className: ensureString((target as Record<string, unknown>).className) ?? undefined,
      inlineHandlers,
    });

    if (sanitized.length >= MAX_TARGETS) {
      break;
    }
  }

  return sanitized;
}

async function resolveNode(tabId: number, selector: string): Promise<ResolvedNode | null> {
  const documentResponse = await sendCommand<CdpDomGetDocumentResponse>(tabId, 'DOM.getDocument', {
    depth: -1,
    pierce: true,
  });
  const rootNodeId = documentResponse.root?.nodeId;
  if (typeof rootNodeId !== 'number') {
    return null;
  }

  const queryResponse = await sendCommand<CdpDomQuerySelectorResponse>(tabId, 'DOM.querySelector', {
    nodeId: rootNodeId,
    selector,
  });

  const nodeId = queryResponse.nodeId;
  if (typeof nodeId !== 'number' || nodeId <= 0) {
    return null;
  }

  const [resolvedNodeResponse, describeNodeResponse] = await Promise.all([
    sendCommand<CdpDomResolveNodeResponse>(tabId, 'DOM.resolveNode', { nodeId }),
    sendCommand<CdpDomDescribeNodeResponse>(tabId, 'DOM.describeNode', { nodeId }),
  ]);

  const objectId = resolvedNodeResponse.object?.objectId;
  if (!objectId) {
    return null;
  }

  return {
    nodeId,
    backendNodeId: describeNodeResponse.node?.backendNodeId,
    objectId,
  };
}

function createLocationSnippet(
  scriptSource: string,
  zeroBasedLineNumber: number | undefined,
  maxLength = MAX_SCRIPT_SNIPPET_LENGTH
): string | undefined {
  if (!scriptSource) {
    return undefined;
  }

  const lines = scriptSource.split('\n');
  if (lines.length === 0) {
    return undefined;
  }

  const lineIndex = typeof zeroBasedLineNumber === 'number' && zeroBasedLineNumber >= 0
    ? zeroBasedLineNumber
    : 0;

  const start = Math.max(0, lineIndex - 6);
  const end = Math.min(lines.length, lineIndex + 7);
  const block = lines
    .slice(start, end)
    .map((line, offset) => `${start + offset + 1}: ${line}`)
    .join('\n');

  if (block.length <= maxLength) {
    return block;
  }

  return `${block.slice(0, maxLength)}\n...`;
}

function extractSourceMapReference(scriptSource: string): string | undefined {
  if (!scriptSource) {
    return undefined;
  }

  const sourceMapRegex = /[#@]\s*sourceMappingURL=([^\s]+)/g;
  let lastMatch: string | undefined;

  for (const match of scriptSource.matchAll(sourceMapRegex)) {
    const candidate = match[1]?.trim().replace(/\*\/$/, '');
    if (candidate) {
      lastMatch = candidate;
    }
  }

  return lastMatch;
}

function resolveUrl(url: string, baseUrl: string | undefined): string | undefined {
  try {
    if (baseUrl) {
      return new URL(url, baseUrl).toString();
    }
    return new URL(url).toString();
  } catch {
    return undefined;
  }
}

function decodeDataUrlContent(dataUrl: string): string | null {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) {
    return null;
  }

  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);

  try {
    if (header.toLowerCase().includes(';base64')) {
      return atob(payload);
    }

    return decodeURIComponent(payload);
  } catch {
    return null;
  }
}

async function fetchTextContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

async function resolveSourceMap(
  sourceMapReference: string,
  scriptUrl: string | undefined,
  sourceMapCache: SourceMapCache
): Promise<SourceMapResolution | null> {
  const cacheKey = `${scriptUrl ?? ''}::${sourceMapReference}`;
  if (sourceMapCache.has(cacheKey)) {
    return sourceMapCache.get(cacheKey) ?? null;
  }

  let sourceMapContent: string | null = null;
  let resolvedMapUrl: string | undefined;

  if (sourceMapReference.startsWith('data:')) {
    sourceMapContent = decodeDataUrlContent(sourceMapReference);
  } else {
    resolvedMapUrl = resolveUrl(sourceMapReference, scriptUrl);
    if (!resolvedMapUrl) {
      sourceMapCache.set(cacheKey, null);
      return null;
    }
    sourceMapContent = await fetchTextContent(resolvedMapUrl);
  }

  if (!sourceMapContent) {
    sourceMapCache.set(cacheKey, null);
    return null;
  }

  try {
    const sourceMapInput = JSON.parse(sourceMapContent) as SourceMapInput;
    const traceMap = new TraceMap(sourceMapInput, resolvedMapUrl ?? scriptUrl ?? null);
    const resolvedSourceMap: SourceMapResolution = {
      traceMap,
      resolvedMapUrl,
      sourceContentCache: new Map<string, string | null>(),
    };

    sourceMapCache.set(cacheKey, resolvedSourceMap);
    return resolvedSourceMap;
  } catch {
    sourceMapCache.set(cacheKey, null);
    return null;
  }
}

function resolveOriginalSourceUrl(traceMap: TraceMap, source: string): string {
  const sourceIndex = traceMap.sources.indexOf(source);
  if (sourceIndex >= 0) {
    const resolved = ensureString(traceMap.resolvedSources[sourceIndex]);
    if (resolved) {
      return resolved;
    }
  }

  return source;
}

async function getOriginalSourceContent(
  sourceMap: SourceMapResolution,
  source: string,
  sourceUrl: string
): Promise<string | null> {
  if (sourceMap.sourceContentCache.has(source)) {
    return sourceMap.sourceContentCache.get(source) ?? null;
  }

  const embeddedSource = sourceContentFor(sourceMap.traceMap, source);
  if (typeof embeddedSource === 'string' && embeddedSource.length > 0) {
    sourceMap.sourceContentCache.set(source, embeddedSource);
    return embeddedSource;
  }

  if (isInternalExtensionScript(sourceUrl)) {
    sourceMap.sourceContentCache.set(source, null);
    return null;
  }

  const fetchedSource = await fetchTextContent(sourceUrl);
  sourceMap.sourceContentCache.set(source, fetchedSource);
  return fetchedSource;
}

async function resolveOriginalMapping(
  generatedLineZeroBased: number | undefined,
  generatedColumnZeroBased: number | undefined,
  scriptSource: string,
  scriptUrl: string | undefined,
  sourceMapReference: string | undefined,
  sourceMapCache: SourceMapCache
): Promise<OriginalMappingData> {
  const reference = sourceMapReference ?? extractSourceMapReference(scriptSource);
  if (!reference) {
    return {};
  }

  const sourceMap = await resolveSourceMap(reference, scriptUrl, sourceMapCache);
  if (!sourceMap) {
    return {};
  }

  const generatedLine = typeof generatedLineZeroBased === 'number' ? generatedLineZeroBased + 1 : undefined;
  const generatedColumn = typeof generatedColumnZeroBased === 'number' && generatedColumnZeroBased >= 0
    ? generatedColumnZeroBased
    : 0;

  const sourceMapUrl = sourceMap.resolvedMapUrl ?? reference;
  if (!generatedLine) {
    return { sourceMapUrl };
  }

  const tracedPosition = originalPositionFor(sourceMap.traceMap, {
    line: generatedLine,
    column: generatedColumn,
  });

  if (
    tracedPosition.line === null
    || tracedPosition.column === null
    || !tracedPosition.source
  ) {
    return { sourceMapUrl };
  }

  const originalScriptUrl = resolveOriginalSourceUrl(sourceMap.traceMap, tracedPosition.source);
  if (isInternalExtensionScript(originalScriptUrl)) {
    return { sourceMapUrl };
  }

  const originalSource = await getOriginalSourceContent(sourceMap, tracedPosition.source, originalScriptUrl);
  const originalSnippet = createLocationSnippet(originalSource ?? '', tracedPosition.line - 1);

  return {
    sourceMapUrl,
    originalScriptUrl,
    originalLineNumber: tracedPosition.line,
    originalColumnNumber: tracedPosition.column + 1,
    originalSnippet,
  };
}

async function extractHandlerSource(tabId: number, handlerObjectId: string): Promise<string | undefined> {
  const response = await sendCommand<CdpRuntimeCallFunctionOnResponse>(tabId, 'Runtime.callFunctionOn', {
    objectId: handlerObjectId,
    functionDeclaration:
      'function() { try { return Function.prototype.toString.call(this); } catch (error) { return ""; } }',
    returnByValue: true,
  });

  const rawValue = response.result?.value;
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return undefined;
  }

  if (rawValue.length <= MAX_HANDLER_SOURCE_LENGTH) {
    return rawValue;
  }

  return `${rawValue.slice(0, MAX_HANDLER_SOURCE_LENGTH)}\n...`;
}

async function extractFunctionLocation(tabId: number, functionObjectId: string): Promise<FunctionLocation | null> {
  const properties = await sendCommand<CdpRuntimeGetPropertiesResponse>(tabId, 'Runtime.getProperties', {
    objectId: functionObjectId,
    ownProperties: false,
    accessorPropertiesOnly: false,
    generatePreview: false,
  }).catch(() => null);

  const functionLocationObjectId = properties?.internalProperties
    ?.find((entry) => entry.name === '[[FunctionLocation]]')
    ?.value?.objectId;

  if (!functionLocationObjectId) {
    return null;
  }

  const locationResponse = await sendCommand<CdpRuntimeCallFunctionOnResponse>(tabId, 'Runtime.callFunctionOn', {
    objectId: functionLocationObjectId,
    functionDeclaration: [
      'function() {',
      '  return {',
      "    scriptId: typeof this.scriptId === 'string' ? this.scriptId : undefined,",
      "    lineNumber: typeof this.lineNumber === 'number' ? this.lineNumber : undefined,",
      "    columnNumber: typeof this.columnNumber === 'number' ? this.columnNumber : undefined,",
      '  };',
      '}',
    ].join('\n'),
    returnByValue: true,
  }).catch(() => null);

  const rawValue = locationResponse?.result?.value;
  if (!rawValue || typeof rawValue !== 'object') {
    return null;
  }

  const value = rawValue as Record<string, unknown>;
  const scriptId = ensureString(value.scriptId) ?? undefined;
  const lineNumber = typeof value.lineNumber === 'number' ? value.lineNumber : undefined;
  const columnNumber = typeof value.columnNumber === 'number' ? value.columnNumber : undefined;

  if (!scriptId && typeof lineNumber !== 'number' && typeof columnNumber !== 'number') {
    return null;
  }

  return {
    scriptId,
    lineNumber,
    columnNumber,
  };
}

async function fetchJqueryDelegatedListeners(
  tabId: number,
  node: ResolvedNode,
  target: JsInspectorTargetRequest,
  scriptSourceCache: Map<string, string>,
  sourceMapCache: SourceMapCache
): Promise<JsInspectorListener[]> {
  const rawJqueryListeners = await sendCommand<CdpRuntimeCallFunctionOnResponse>(tabId, 'Runtime.callFunctionOn', {
    objectId: node.objectId,
    functionDeclaration: [
      'function() {',
      '  try {',
      '    const view = this && this.ownerDocument ? this.ownerDocument.defaultView : null;',
      '    const jq = view && (view.jQuery || view.$);',
      "    if (!jq || typeof jq._data !== 'function' || !jq.fn) {",
      '      return [];',
      '    }',
      "    const events = jq._data(this, 'events');",
      "    if (!events || typeof events !== 'object') {",
        '      return [];',
      '    }',
      '    const output = [];',
      '    const eventTypes = Object.keys(events);',
      '    for (let i = 0; i < eventTypes.length; i += 1) {',
      '      const type = eventTypes[i];',
      '      const handlers = events[type];',
      '      if (!Array.isArray(handlers)) {',
      '        continue;',
      '      }',
      '      for (let j = 0; j < handlers.length; j += 1) {',
      '        const item = handlers[j];',
      "        if (!item || typeof item !== 'object') {",
      '          continue;',
      '        }',
      "        const handler = typeof item.handler === 'function' ? item.handler : null;",
      '        if (!handler) {',
      '          continue;',
      '        }',
      '        output.push({',
      '          type,',
      "          origType: typeof item.origType === 'string' ? item.origType : undefined,",
      "          selector: typeof item.selector === 'string' ? item.selector : undefined,",
      "          namespace: typeof item.namespace === 'string' ? item.namespace : undefined,",
      '          once: item.one === true || item.once === true,',
      '          handler,',
      '        });',
      '      }',
      '    }',
      '    return output;',
      '  } catch (_error) {',
      '    return [];',
      '  }',
      '}',
    ].join('\n'),
    returnByValue: false,
  }).catch(() => null);

  const jqueryListenersObjectId = ensureString(rawJqueryListeners?.result?.objectId);
  if (!jqueryListenersObjectId) {
    return [];
  }

  const jqueryListenersProperties = await sendCommand<CdpRuntimeGetPropertiesResponse>(tabId, 'Runtime.getProperties', {
    objectId: jqueryListenersObjectId,
    ownProperties: true,
    accessorPropertiesOnly: false,
    generatePreview: false,
  }).catch(() => null);

  const listenerObjectIds = (jqueryListenersProperties?.result ?? [])
    .filter((descriptor) => typeof descriptor.name === 'string' && /^\d+$/.test(descriptor.name))
    .map((descriptor) => ensureString(descriptor.value?.objectId))
    .filter((objectId): objectId is string => Boolean(objectId))
    .slice(0, MAX_JQUERY_LISTENERS_PER_NODE);

  if (listenerObjectIds.length === 0) {
    return [];
  }

  const output: JsInspectorListener[] = [];

  for (const listenerObjectId of listenerObjectIds) {
    const listenerProperties = await sendCommand<CdpRuntimeGetPropertiesResponse>(tabId, 'Runtime.getProperties', {
      objectId: listenerObjectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: false,
    }).catch(() => null);

    const descriptors = listenerProperties?.result;
    const handlerObjectId = getObjectIdProperty(descriptors, 'handler');
    if (!handlerObjectId) {
      continue;
    }

    const eventType = getStringProperty(descriptors, 'origType')
      ?? getStringProperty(descriptors, 'type')
      ?? 'unknown';
    const delegatedSelector = getStringProperty(descriptors, 'selector') ?? undefined;
    const once = getBooleanProperty(descriptors, 'once') === true;

    const handlerSource = await extractHandlerSource(tabId, handlerObjectId).catch(() => undefined);
    const functionLocation = await extractFunctionLocation(tabId, handlerObjectId).catch(() => null);

    const resolvedScriptId = functionLocation?.scriptId;
    const resolvedLineNumber = functionLocation?.lineNumber;
    const resolvedColumnNumber = functionLocation?.columnNumber;

    let scriptSnippet: string | undefined;
    let scriptUrl: string | undefined;
    let originalMapping: OriginalMappingData = {};

    if (resolvedScriptId) {
      if (!scriptSourceCache.has(resolvedScriptId)) {
        const scriptResponse = await sendCommand<CdpDebuggerGetScriptSourceResponse>(
          tabId,
          'Debugger.getScriptSource',
          { scriptId: resolvedScriptId }
        ).catch(() => ({ scriptSource: '' }));

        scriptSourceCache.set(resolvedScriptId, scriptResponse.scriptSource ?? '');
      }

      const scriptSource = scriptSourceCache.get(resolvedScriptId) ?? '';
      const scriptMeta = scriptRegistry.get(tabId)?.get(resolvedScriptId);

      scriptSnippet = createLocationSnippet(scriptSource, resolvedLineNumber);
      scriptUrl = scriptMeta?.url;

      if (isInternalExtensionScript(scriptUrl)) {
        continue;
      }

      const sourceMapReference = ensureString(scriptMeta?.sourceMapURL) ?? extractSourceMapReference(scriptSource);
      originalMapping = await resolveOriginalMapping(
        resolvedLineNumber,
        resolvedColumnNumber,
        scriptSource,
        scriptUrl,
        sourceMapReference,
        sourceMapCache
      ).catch(() => ({}));
    }

    output.push({
      id: `${target.relation}:${target.selector}:jquery:${eventType}:${resolvedScriptId ?? 'inline'}:${resolvedLineNumber ?? -1}:${resolvedColumnNumber ?? -1}:${delegatedSelector ?? ''}`,
      relation: target.relation,
      selector: delegatedSelector ?? target.selector,
      tagName: target.tagName,
      eventType,
      useCapture: false,
      passive: false,
      once,
      isInlineHandler: false,
      scriptId: resolvedScriptId,
      scriptUrl,
      lineNumber: typeof resolvedLineNumber === 'number' ? resolvedLineNumber + 1 : undefined,
      columnNumber: typeof resolvedColumnNumber === 'number' ? resolvedColumnNumber + 1 : undefined,
      handlerSource,
      scriptSnippet,
      ...originalMapping,
    });
  }

  return output;
}

async function fetchListeners(
  tabId: number,
  node: ResolvedNode,
  target: JsInspectorTargetRequest,
  scriptSourceCache: Map<string, string>,
  sourceMapCache: SourceMapCache
): Promise<JsInspectorListener[]> {
  const response = await sendCommand<CdpDomDebuggerResponse>(tabId, 'DOMDebugger.getEventListeners', {
    objectId: node.objectId,
    depth: 1,
    pierce: true,
  });

  const listeners = response.listeners ?? [];
  const filtered = node.backendNodeId
    ? listeners.filter((listener) => !listener.backendNodeId || listener.backendNodeId === node.backendNodeId)
    : listeners;

  const output: JsInspectorListener[] = [];

  for (const listener of filtered) {
    const eventType = ensureString(listener.type) ?? 'unknown';
    const registrationScriptId = ensureString(listener.scriptId) ?? undefined;
    const useCapture = listener.useCapture === true;
    const passive = listener.passive === true;
    const once = listener.once === true;

    let handlerSource: string | undefined;
    const wrapperHandlerObjectId = ensureString(listener.handler?.objectId);
    const originalHandlerObjectId = ensureString(listener.originalHandler?.objectId);

    if (originalHandlerObjectId) {
      handlerSource = await extractHandlerSource(tabId, originalHandlerObjectId).catch(() => undefined);
    }
    if (!handlerSource && wrapperHandlerObjectId) {
      handlerSource = await extractHandlerSource(tabId, wrapperHandlerObjectId).catch(() => undefined);
    }

    let scriptSnippet: string | undefined;
    let scriptUrl: string | undefined;
    let originalMapping: OriginalMappingData = {};
    let resolvedScriptId = registrationScriptId;
    let resolvedLineNumber = listener.lineNumber;
    let resolvedColumnNumber = listener.columnNumber;

    if (originalHandlerObjectId) {
      const functionLocation = await extractFunctionLocation(tabId, originalHandlerObjectId).catch(() => null);
      if (functionLocation?.scriptId) {
        resolvedScriptId = functionLocation.scriptId;
      }
      if (typeof functionLocation?.lineNumber === 'number') {
        resolvedLineNumber = functionLocation.lineNumber;
      }
      if (typeof functionLocation?.columnNumber === 'number') {
        resolvedColumnNumber = functionLocation.columnNumber;
      }
    }

    if (resolvedScriptId) {
      if (!scriptSourceCache.has(resolvedScriptId)) {
        const scriptResponse = await sendCommand<CdpDebuggerGetScriptSourceResponse>(
          tabId,
          'Debugger.getScriptSource',
          { scriptId: resolvedScriptId }
        ).catch(() => ({ scriptSource: '' }));
        scriptSourceCache.set(resolvedScriptId, scriptResponse.scriptSource ?? '');
      }

      const scriptSource = scriptSourceCache.get(resolvedScriptId) ?? '';
      const scriptMeta = scriptRegistry.get(tabId)?.get(resolvedScriptId);

      scriptSnippet = createLocationSnippet(scriptSource, resolvedLineNumber);
      scriptUrl = scriptMeta?.url;

      if (isInternalExtensionScript(scriptUrl)) {
        continue;
      }

      const sourceMapReference = ensureString(scriptMeta?.sourceMapURL) ?? extractSourceMapReference(scriptSource);
      originalMapping = await resolveOriginalMapping(
        resolvedLineNumber,
        resolvedColumnNumber,
        scriptSource,
        scriptUrl,
        sourceMapReference,
        sourceMapCache
      ).catch(() => ({}));
    }

    output.push({
      id: `${target.relation}:${target.selector}:${eventType}:${resolvedScriptId ?? 'inline'}:${resolvedLineNumber ?? -1}:${resolvedColumnNumber ?? -1}`,
      relation: target.relation,
      selector: target.selector,
      tagName: target.tagName,
      eventType,
      useCapture,
      passive,
      once,
      isInlineHandler: false,
      scriptId: resolvedScriptId,
      scriptUrl,
      lineNumber: typeof resolvedLineNumber === 'number' ? resolvedLineNumber + 1 : undefined,
      columnNumber: typeof resolvedColumnNumber === 'number' ? resolvedColumnNumber + 1 : undefined,
      handlerSource,
      scriptSnippet,
      ...originalMapping,
    });
  }

  return output;
}

function buildInlineHandlerListeners(target: JsInspectorTargetRequest): JsInspectorListener[] {
  return target.inlineHandlers.map((handler, index) => ({
    id: `${target.relation}:${target.selector}:inline:${handler.eventType}:${index}`,
    relation: target.relation,
    selector: target.selector,
    tagName: target.tagName,
    eventType: handler.eventType,
    useCapture: false,
    passive: false,
    once: false,
    isInlineHandler: true,
    handlerSource: handler.code,
  }));
}

function dedupeListeners(listeners: JsInspectorListener[]): JsInspectorListener[] {
  const seen = new Set<string>();
  const output: JsInspectorListener[] = [];

  for (const listener of listeners) {
    const dedupeKey = [
      listener.relation,
      listener.selector,
      listener.eventType,
      listener.scriptId ?? '',
      listener.lineNumber ?? -1,
      listener.columnNumber ?? -1,
      listener.handlerSource ?? '',
      listener.isInlineHandler ? 'inline' : 'listener',
    ].join('|');

    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    output.push(listener);
  }

  return output;
}

export async function inspectElementScripts(tabId: number, rawTargets: unknown): Promise<JsInspectorResult> {
  const warnings: string[] = [];
  const targets = sanitizeTargets(rawTargets);
  if (targets.length === 0) {
    throw new Error('No valid inspection targets were provided.');
  }

  const scriptSourceCache = new Map<string, string>();
  const sourceMapCache: SourceMapCache = new Map();
  const listeners: JsInspectorListener[] = [];

  await attachDebugger(tabId).catch((error) => {
    throw new Error(normalizeDebuggerError(error));
  });

  try {
    for (const target of targets) {
      const resolvedNode = await resolveNode(tabId, target.selector).catch(() => null);
      if (!resolvedNode) {
        warnings.push(`Could not resolve selector: ${target.selector}`);
        listeners.push(...buildInlineHandlerListeners(target));
        continue;
      }

      listeners.push(...buildInlineHandlerListeners(target));

      const nodeListeners = await fetchListeners(
        tabId,
        resolvedNode,
        target,
        scriptSourceCache,
        sourceMapCache
      ).catch(() => []);
      listeners.push(...nodeListeners);

      const jqueryDelegatedListeners = await fetchJqueryDelegatedListeners(
        tabId,
        resolvedNode,
        target,
        scriptSourceCache,
        sourceMapCache
      ).catch(() => []);
      listeners.push(...jqueryDelegatedListeners);
    }

    const uniqueListeners = dedupeListeners(listeners);

    return {
      analyzedAt: Date.now(),
      targetCount: targets.length,
      totalListeners: uniqueListeners.length,
      listeners: uniqueListeners,
      warnings,
    };
  } finally {
    await detachDebugger(tabId);
  }
}

export function getJsInspectorErrorMessage(error: unknown): string {
  return normalizeDebuggerError(error);
}
