/**
 * Log Formatter Utilities
 *
 * 로그 메시지 포맷팅 및 인자 파싱
 */

/**
 * 로그 인자를 문자열로 포맷
 */
export function formatLogMessage(args: unknown[]): string {
  return args
    .map((arg) => formatArgument(arg))
    .join(' ');
}

/**
 * 단일 인자 포맷
 */
export function formatArgument(arg: unknown): string {
  if (arg === null) {
    return 'null';
  }

  if (arg === undefined) {
    return 'undefined';
  }

  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg === 'number' || typeof arg === 'boolean') {
    return String(arg);
  }

  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}`;
  }

  if (arg instanceof Date) {
    return arg.toISOString();
  }

  if (Array.isArray(arg)) {
    return formatArray(arg);
  }

  if (typeof arg === 'object') {
    return formatObject(arg);
  }

  return String(arg);
}

/**
 * 배열 포맷
 */
export function formatArray(arr: unknown[]): string {
  if (arr.length === 0) {
    return '[]';
  }

  if (arr.length > 5) {
    return `[${arr.slice(0, 5).map(formatArgument).join(', ')}, ... ${arr.length - 5} more]`;
  }

  return `[${arr.map(formatArgument).join(', ')}]`;
}

/**
 * 객체 포맷
 */
export function formatObject(obj: unknown): string {
  try {
    // 순환 참조 방지
    const cache = new Set();

    const replacer = (key: string, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    };

    const json = JSON.stringify(obj, replacer, 2);

    // 너무 길면 축약
    if (json.length > 200) {
      return `${json.slice(0, 200)}...`;
    }

    return json;
  } catch {
    return '[Object]';
  }
}

/**
 * 인자 파싱 (저장용)
 */
export function parseArguments(args: unknown[]): unknown[] {
  return args.map((arg) => parseArgument(arg));
}

/**
 * 단일 인자 파싱
 */
export function parseArgument(arg: unknown): unknown {
  if (arg === null || arg === undefined) {
    return arg;
  }

  if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
    return arg;
  }

  if (arg instanceof Error) {
    return {
      _type: 'Error',
      name: arg.name,
      message: arg.message,
      stack: arg.stack,
    };
  }

  if (arg instanceof Date) {
    return {
      _type: 'Date',
      value: arg.toISOString(),
    };
  }

  if (Array.isArray(arg)) {
    return {
      _type: 'Array',
      value: arg.map(parseArgument),
    };
  }

  if (typeof arg === 'object') {
    try {
      const cache = new Set();

      const replacer = (key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          cache.add(value);
        }
        return value;
      };

      return JSON.parse(JSON.stringify(arg, replacer));
    } catch {
      return {
        _type: 'Object',
        value: '[Non-serializable]',
      };
    }
  }

  return String(arg);
}

/**
 * 파싱된 인자를 원본 형태로 복원
 */
export function restoreArgument(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== 'object') {
    return parsed;
  }

  const obj = parsed as Record<string, unknown>;

  if (obj._type === 'Error') {
    const error = new Error(obj.message as string);
    error.name = obj.name as string;
    error.stack = obj.stack as string | undefined;
    return error;
  }

  if (obj._type === 'Date') {
    return new Date(obj.value as number);
  }

  if (obj._type === 'Array') {
    return (obj.value as unknown[]).map(restoreArgument);
  }

  if (obj._type === 'Object') {
    return obj.value;
  }

  return parsed;
}
