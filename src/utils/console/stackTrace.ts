/**
 * Stack Trace Utilities
 *
 * 스택 트레이스 캡처 및 파싱
 */

/**
 * 스택 트레이스 정보
 */
export interface StackFrame {
  file: string;
  line: number;
  column: number;
  functionName?: string;
}

/**
 * 스택 트레이스 캡처
 */
export function captureStackTrace(): string {
  try {
    const error = new Error();
    return error.stack || '';
  } catch {
    return '';
  }
}

/**
 * 스택 트레이스 파싱
 */
export function parseStackTrace(stack: string): StackFrame[] {
  if (!stack) {
    return [];
  }

  const lines = stack.split('\n');
  const frames: StackFrame[] = [];

  for (const line of lines) {
    // Chrome/Edge 형식: "at functionName (file:line:column)"
    const chromeMatch = line.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/);
    if (chromeMatch) {
      frames.push({
        functionName: chromeMatch[1] || undefined,
        file: chromeMatch[2],
        line: parseInt(chromeMatch[3], 10),
        column: parseInt(chromeMatch[4], 10),
      });
      continue;
    }

    // Chrome/Edge 형식 (익명): "at file:line:column"
    const chromeAnonymousMatch = line.match(/at\s+(.*?):(\d+):(\d+)/);
    if (chromeAnonymousMatch) {
      frames.push({
        file: chromeAnonymousMatch[1],
        line: parseInt(chromeAnonymousMatch[2], 10),
        column: parseInt(chromeAnonymousMatch[3], 10),
      });
      continue;
    }

    // Firefox 형식: "functionName@file:line:column"
    const firefoxMatch = line.match(/(.*?)@(.*?):(\d+):(\d+)/);
    if (firefoxMatch) {
      frames.push({
        functionName: firefoxMatch[1] || undefined,
        file: firefoxMatch[2],
        line: parseInt(firefoxMatch[3], 10),
        column: parseInt(firefoxMatch[4], 10),
      });
    }
  }

  return frames;
}

/**
 * 스택 트레이스에서 소스 위치 추출
 */
export function extractSourceLocation(stack: string): {
  file: string;
  line: number;
  column: number;
} | null {
  const frames = parseStackTrace(stack);

  // 첫 번째 프레임 (가장 최근 호출)에서 위치 추출
  // 인터셉터 자체를 제외하기 위해 2-3번째 프레임 사용
  const frame = frames[2] || frames[1] || frames[0];

  if (!frame) {
    return null;
  }

  return {
    file: frame.file,
    line: frame.line,
    column: frame.column,
  };
}

/**
 * 스택 트레이스 포맷팅
 */
export function formatStackTrace(stack: string): string {
  const frames = parseStackTrace(stack);

  return frames
    .map((frame) => {
      const func = frame.functionName || '<anonymous>';
      return `  at ${func} (${frame.file}:${frame.line}:${frame.column})`;
    })
    .join('\n');
}
