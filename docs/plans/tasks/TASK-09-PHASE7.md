# Phase 7: 테스트

**태스크**: 1개
**예상 시간**: 30분
**의존성**: Phase 1-6 완료

---

### Task #9.35: 단위 테스트 작성

- **파일**: `src/utils/tailwind/__tests__/tailwindScanner.test.ts`
- **시간**: 30분
- **의존성**: 모든 이전 태스크
- **상세 내용**:
```typescript
import { describe, it, expect } from 'vitest';
import { isTailwindClass, isArbitraryValue } from '../isTailwindClass';
import { extractTailwindClasses } from '../extractTailwindClasses';
import { parseTailwindClass } from '../parseTailwindClass';
import { categorizeTailwindClasses } from '../categorizeTailwindClass';
import { convertCSSToTailwind } from '../convertCSSToTailwind';

describe('isTailwindClass', () => {
  it('should detect valid Tailwind classes', () => {
    expect(isTailwindClass('bg-blue-500')).toBe(true);
    expect(isTailwindClass('p-4')).toBe(true);
    expect(isTailwindClass('flex')).toBe(true);
    expect(isTailwindClass('hover:bg-blue-600')).toBe(true);
  });

  it('should detect arbitrary values', () => {
    expect(isTailwindClass('w-[123px]')).toBe(true);
    expect(isTailwindClass('h-[50%]')).toBe(true);
    expect(isArbitraryValue('w-[123px]')).toBe(true);
  });

  it('should reject invalid classes', () => {
    expect(isTailwindClass('my-custom-class')).toBe(false);
    expect(isTailwindClass('btn-primary')).toBe(false);
    expect(isTailwindClass('')).toBe(false);
  });
});

describe('extractTailwindClasses', () => {
  it('should extract and categorize classes', () => {
    const result = extractTailwindClasses('bg-blue-500 p-4 flex custom-class');

    expect(result.tailwind).toContain('bg-blue-500');
    expect(result.tailwind).toContain('p-4');
    expect(result.tailwind).toContain('flex');
    expect(result.custom).toContain('custom-class');
  });

  it('should handle empty input', () => {
    const result = extractTailwindClasses('');
    expect(result.tailwind).toEqual([]);
    expect(result.custom).toEqual([]);
  });
});

describe('parseTailwindClass', () => {
  it('should parse Tailwind class correctly', () => {
    const parsed = parseTailwindClass('bg-blue-500');

    expect(parsed.name).toBe('bg-blue-500');
    expect(parsed.category).toBe('background');
    expect(parsed.isValid).toBe(true);
    expect(parsed.isArbitrary).toBe(false);
  });

  it('should parse arbitrary value class', () => {
    const parsed = parseTailwindClass('w-[123px]');

    expect(parsed.name).toBe('w-[123px]');
    expect(parsed.isArbitrary).toBe(true);
    expect(parsed.value).toBe('123px');
  });
});

describe('categorizeTailwindClasses', () => {
  it('should categorize classes correctly', () => {
    const result = categorizeTailwindClasses(['bg-blue-500', 'p-4', 'flex', 'text-lg']);

    expect(result.byCategory.background).toHaveLength(1);
    expect(result.byCategory.spacing).toHaveLength(1);
    expect(result.byCategory.flexbox).toHaveLength(1);
    expect(result.byCategory.typography).toHaveLength(1);
  });
});

describe('convertCSSToTailwind', () => {
  it('should convert padding to Tailwind', () => {
    const result = convertCSSToTailwind('padding', '1rem');

    expect(result.tailwind.classes).toContain('p-4');
    expect(result.tailwind.confidence).toBeGreaterThan(0.7);
  });

  it('should convert margin to Tailwind', () => {
    const result = convertCSSToTailwind('margin', '16px');

    expect(result.tailwind.classes.length).toBeGreaterThan(0);
  });

  it('should convert color to Tailwind', () => {
    const result = convertCSSToTailwind('color', '#3b82f6');

    expect(result.tailwind.classes.length).toBeGreaterThan(0);
  });

  it('should convert font-size to Tailwind', () => {
    const result = convertCSSToTailwind('font-size', '1rem');

    expect(result.tailwind.classes).toContain('text-base');
  });

  it('should convert display to Tailwind', () => {
    const result = convertCSSToTailwind('display', 'flex');

    expect(result.tailwind.classes).toContain('flex');
    expect(result.tailwind.confidence).toBe(1);
  });
});
```
- **완료 조건**: 80% 이상 테스트 커버리지

---

## ✅ 최종 완료 체크리스트

Phase 1-7의 모든 태스크 완료 후:

- [ ] 모든 파일이 생성됨
- [ ] TypeScript 컴파일 성공
- [ ] 테스트 80%+ 커버리지
- [ ] TailwindScannerPanel이 사이드바에 통합됨
- [ ] 페이지 스캔 정상 동작
- [ ] CSS → Tailwind 변환 정확
- [ ] Config 추출 정상 작동

---

**다음 단계**: 도구 #10 구현

[메인 문서](./TASK-09-TAILWIND.md)로 돌아가기
