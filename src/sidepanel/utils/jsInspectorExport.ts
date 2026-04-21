import type { JsInspectorListener, JsInspectorResult } from '@/types/jsInspector';

interface JsInspectorExportRecord {
  fingerprint: string;
  tags: string[];
  eventType: string;
  relation: string;
  selector: string;
  tagName: string;
  isInlineHandler: boolean;
  generatedLocation: {
    scriptUrl: string | null;
    scriptId: string | null;
    line: number | null;
    column: number | null;
  };
  originalLocation: {
    sourceMapUrl: string | null;
    scriptUrl: string | null;
    line: number | null;
    column: number | null;
  };
  code: {
    originalSnippet: string | null;
    generatedSnippet: string | null;
    handlerSource: string | null;
  };
}

function normalizeText(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function shortSelector(selector: string): string {
  const compact = selector.replace(/\s+/g, ' ').trim();
  if (compact.length <= 64) {
    return compact;
  }

  return `${compact.slice(0, 61)}...`;
}

function hashText(input: string): string {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createListenerFingerprint(listener: JsInspectorListener): string {
  const signature = [
    listener.eventType,
    listener.relation,
    listener.selector,
    listener.originalScriptUrl ?? listener.scriptUrl ?? '',
    listener.originalLineNumber ?? listener.lineNumber ?? -1,
    listener.originalColumnNumber ?? listener.columnNumber ?? -1,
  ].join('|');

  return `JSL-${hashText(signature).toUpperCase()}`;
}

function getEventCategory(eventType: string): string {
  const event = eventType.toLowerCase();

  if (/^(click|dblclick|mouse|pointer|touch|contextmenu)/.test(event)) {
    return 'pointer';
  }
  if (/^(key|input|change|submit)/.test(event)) {
    return 'input';
  }
  if (/^(focus|blur)/.test(event)) {
    return 'focus';
  }
  if (/^(scroll|wheel|resize)/.test(event)) {
    return 'scroll';
  }
  if (/^(drag|drop)/.test(event)) {
    return 'drag';
  }
  if (/^(animation|transition)/.test(event)) {
    return 'animation';
  }
  if (/^(load|DOMContentLoaded|beforeunload|unload)$/i.test(eventType)) {
    return 'lifecycle';
  }

  return 'other';
}

function isHighFrequencyEvent(eventType: string): boolean {
  const event = eventType.toLowerCase();
  return ['mousemove', 'pointermove', 'touchmove', 'scroll', 'wheel', 'resize'].includes(event);
}

export function buildListenerTags(listener: JsInspectorListener): string[] {
  const tags = new Set<string>();

  tags.add(`event:${listener.eventType.toLowerCase()}`);
  tags.add(`cat:${getEventCategory(listener.eventType)}`);

  tags.add(listener.isInlineHandler ? 'handler:inline' : 'handler:listener');
  tags.add(listener.useCapture ? 'phase:capture' : 'phase:bubble');
  tags.add(listener.passive ? 'passive:true' : 'passive:false');
  tags.add(listener.once ? 'once:true' : 'once:false');

  tags.add(listener.relation === 'self' ? 'scope:self' : 'scope:ancestor');

  if (listener.originalScriptUrl) {
    tags.add('source:original');
  } else if (listener.scriptUrl) {
    tags.add('source:generated');
  } else {
    tags.add('source:inline');
  }

  if (listener.scriptUrl?.startsWith('http://') || listener.scriptUrl?.startsWith('https://')) {
    tags.add('script:external');
  }

  if (isHighFrequencyEvent(listener.eventType)) {
    tags.add('perf:high-frequency');
  }

  const canBlockScroll = ['touchstart', 'touchmove', 'wheel'].includes(listener.eventType.toLowerCase());
  if (canBlockScroll && !listener.passive) {
    tags.add('perf:scroll-blocking');
  }

  if (!listener.isInlineHandler && listener.relation !== 'self') {
    tags.add('pattern:delegated');
  }

  return Array.from(tags);
}

function toExportRecord(listener: JsInspectorListener): JsInspectorExportRecord {
  return {
    fingerprint: createListenerFingerprint(listener),
    tags: buildListenerTags(listener),
    eventType: listener.eventType,
    relation: listener.relation,
    selector: listener.selector,
    tagName: listener.tagName,
    isInlineHandler: listener.isInlineHandler,
    generatedLocation: {
      scriptUrl: normalizeText(listener.scriptUrl),
      scriptId: normalizeText(listener.scriptId),
      line: listener.lineNumber ?? null,
      column: listener.columnNumber ?? null,
    },
    originalLocation: {
      sourceMapUrl: normalizeText(listener.sourceMapUrl),
      scriptUrl: normalizeText(listener.originalScriptUrl),
      line: listener.originalLineNumber ?? null,
      column: listener.originalColumnNumber ?? null,
    },
    code: {
      originalSnippet: normalizeText(listener.originalSnippet),
      generatedSnippet: normalizeText(listener.scriptSnippet),
      handlerSource: normalizeText(listener.handlerSource),
    },
  };
}

export function buildStructuredInspectorJson(result: JsInspectorResult | null, maxListeners = 40): string {
  const listeners = (result?.listeners ?? []).slice(0, maxListeners).map(toExportRecord);

  return JSON.stringify(
    {
      tool: 'klic-js-inspector',
      schemaVersion: 1,
      analyzedAt: result?.analyzedAt ?? Date.now(),
      targetCount: result?.targetCount ?? 0,
      totalListeners: result?.totalListeners ?? listeners.length,
      listeners,
    },
    null,
    2
  );
}

export function buildStructuredListenerJson(listener: JsInspectorListener): string {
  return JSON.stringify(
    {
      tool: 'klic-js-inspector',
      schemaVersion: 1,
      listeners: [toExportRecord(listener)],
    },
    null,
    2
  );
}

export function summarizeListenerForBadge(listener: JsInspectorListener): string {
  const location = listener.originalScriptUrl ?? listener.scriptUrl ?? 'inline';
  const line = listener.originalLineNumber ?? listener.lineNumber;
  const base = line ? `${location}:L${line}` : location;
  return `${listener.eventType} · ${shortSelector(listener.selector)} · ${base}`;
}
