/**
 * Safe Serializer
 *
 * chrome.runtime.sendMessage에서 structured clone 실패를 방지하기 위해
 * 비직렬화 가능 값(함수, DOM 노드, 순환참조 등)을 안전한 문자열로 변환
 */

const MAX_DEPTH = 5;
const MAX_KEYS = 50;

/**
 * 객체를 직렬화 가능한 형태로 변환
 */
export function safeSerialize(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (depth > MAX_DEPTH) return '[MaxDepth]';

  if (value === null || value === undefined) return value;

  const type = typeof value;

  if (type === 'string' || type === 'number' || type === 'boolean') return value;
  if (type === 'function') return `[Function: ${(value as { name?: string }).name || 'anonymous'}]`;
  if (type === 'symbol') return `[Symbol: ${(value as symbol).description || ''}]`;
  if (type === 'bigint') return value.toString();

  if (value instanceof HTMLElement) return `[${value.tagName.toLowerCase()}${value.id ? '#' + value.id : ''}]`;
  if (value instanceof Node) return `[${value.nodeName}]`;
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return `[Error: ${value.message}]`;

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.slice(0, MAX_KEYS).map((item) => safeSerialize(item, depth + 1, seen));
    }

    const result: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).slice(0, MAX_KEYS);
    for (const key of keys) {
      try {
        result[key] = safeSerialize((value as Record<string, unknown>)[key], depth + 1, seen);
      } catch {
        result[key] = '[Unreadable]';
      }
    }
    return result;
  }

  return String(value);
}
