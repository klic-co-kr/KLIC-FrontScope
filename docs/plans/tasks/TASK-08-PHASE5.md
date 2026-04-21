# Phase 5: 테스트

**태스크**: 1개
**예상 시간**: 30분
**의존성**: Phase 1-4 완료

---

### Task #8.20: 단위 및 통합 테스트

- **파일**: `src/utils/console/__tests__/console.test.ts`
- **시간**: 30분
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { interceptConsole, restoreConsole } from '../interceptor';
import { captureStackTrace, parseStackTrace } from '../stackTrace';
import { formatLogMessage, parseArguments } from '../formatter';
import { filterLogs, sortLogs } from '../filtering';
import { exportLogs } from '../export';
import { ConsoleLog, LogLevel } from '../../../types/console';

describe('Console Interceptor', () => {
  let capturedLogs: ConsoleLog[] = [];

  beforeEach(() => {
    capturedLogs = [];
    interceptConsole((log) => {
      capturedLogs.push(log);
    });
  });

  afterEach(() => {
    restoreConsole();
  });

  it('should intercept console.log', () => {
    console.log('Test message');

    expect(capturedLogs.length).toBe(1);
    expect(capturedLogs[0].level).toBe('log');
    expect(capturedLogs[0].message).toBe('Test message');
  });

  it('should intercept console.warn', () => {
    console.warn('Warning message');

    expect(capturedLogs.length).toBe(1);
    expect(capturedLogs[0].level).toBe('warn');
  });

  it('should intercept console.error', () => {
    console.error('Error message');

    expect(capturedLogs.length).toBe(1);
    expect(capturedLogs[0].level).toBe('error');
    expect(capturedLogs[0].stackTrace).toBeTruthy();
  });

  it('should handle multiple arguments', () => {
    console.log('Message', 123, { key: 'value' });

    expect(capturedLogs[0].args.length).toBe(3);
  });
});

describe('Stack Trace', () => {
  it('should capture stack trace', () => {
    const stack = captureStackTrace();

    expect(stack).toBeTruthy();
    expect(typeof stack).toBe('string');
  });

  it('should parse stack trace', () => {
    const stack = `Error: Test
    at testFunction (file.js:10:5)
    at anotherFunction (file.js:20:10)`;

    const frames = parseStackTrace(stack);

    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0].functionName).toBe('testFunction');
    expect(frames[0].file).toBe('file.js');
    expect(frames[0].line).toBe(10);
  });
});

describe('Formatter', () => {
  it('should format log message', () => {
    const message = formatLogMessage(['Hello', 'world', 123]);

    expect(message).toBe('Hello world 123');
  });

  it('should format objects', () => {
    const message = formatLogMessage([{ key: 'value' }]);

    expect(message).toContain('key');
    expect(message).toContain('value');
  });

  it('should format arrays', () => {
    const message = formatLogMessage([[1, 2, 3]]);

    expect(message).toContain('[1, 2, 3]');
  });
});

describe('Filtering', () => {
  const logs: ConsoleLog[] = [
    { id: '1', timestamp: 1000, level: 'log', message: 'Log', args: [] },
    { id: '2', timestamp: 2000, level: 'warn', message: 'Warn', args: [] },
    { id: '3', timestamp: 3000, level: 'error', message: 'Error', args: [], stackTrace: 'stack' },
  ];

  it('should filter by level', () => {
    const filtered = filterLogs(logs, { levels: ['error'] });

    expect(filtered.length).toBe(1);
    expect(filtered[0].level).toBe('error');
  });

  it('should filter by search', () => {
    const filtered = filterLogs(logs, { levels: [], search: 'Warn' });

    expect(filtered.length).toBe(1);
    expect(filtered[0].message).toBe('Warn');
  });

  it('should sort logs', () => {
    const sorted = sortLogs(logs, 'timestamp', 'asc');

    expect(sorted[0].timestamp).toBe(1000);
    expect(sorted[2].timestamp).toBe(3000);
  });
});

describe('Export', () => {
  const logs: ConsoleLog[] = [
    { id: '1', timestamp: Date.now(), level: 'log', message: 'Test', args: ['test'] },
  ];

  it('should export as JSON', () => {
    const result = exportLogs(logs, { format: 'json' });

    expect(result).toBeTruthy();
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should export as text', () => {
    const result = exportLogs(logs, { format: 'txt' });

    expect(result).toContain('Test');
  });

  it('should export as CSV', () => {
    const result = exportLogs(logs, { format: 'csv' });

    expect(result).toContain('Timestamp');
    expect(result).toContain('Test');
  });
});
```
- **완료 조건**: 80% 이상 테스트 커버리지

---

## ✅ 최종 완료 체크리스트

Phase 1-5의 모든 태스크 완료 후:

- [ ] 모든 파일이 생성됨
- [ ] TypeScript 컴파일 성공
- [ ] 테스트 80%+ 커버리지
- [ ] ConsolePanel이 사이드바에 통합됨
- [ ] 인터셉터가 정상 동작함
- [ ] 로그가 캡처되고 표시됨
- [ ] 필터/검색/내보내기가 작동함

---

**다음 단계**: 도구 #9 (네트워크) 구현

[메인 문서](./TASK-08-CONSOLE.md)로 돌아가기
