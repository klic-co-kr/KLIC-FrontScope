# Phase i18n-2: 마무리 및 테스트

> Duration: 1일
> Goal: i18n 기능 최종 테스트, 버그 수정, 문서화

## Overview

이 Phase에서는 i18n 기능의 전반적인 테스트를 수행하고, 발견된 버그를 수정하며, 필요한 문서를 작성합니다.

## Steps

### Step i18n-2-1: 전체 E2E 테스트 시나리오

**테스트 케이스:**

1. **초기 설치 시 언어 감지**
   - [ ] 한국 브라우저 → 한국어 UI
   - [ ] 영어 브라우저 → 영어 UI
   - [ ] 일본어 브라우저 → 영어 UI (fallback)

2. **언어 변경 기능**
   - [ ] 설정 패널에서 한국어 → 영어 변경
   - [ ] 설정 패널에서 영어 → 한국어 변경
   - [ ] 변경 후 새로고침해도 유지

3. **모든 도구 번역 확인**
   - [ ] 12개 도구 이름 올바르게 번역
   - [ ] 12개 도구 설명 올바르게 번역
   - [ ] 도구 활성화/비활성화 상태 표시

4. **에러 메시지 번역**
   - [ ] 콘텐츠 스크립트 타임아웃
   - [ ] 캡처 실패
   - [ ] 스크립트 주입 실패

5. **설정 패널 번역**
   - [ ] 언어 선택 UI
   - [ ] 테마 설정 UI
   - [ ] 버튼 텍스트

6. **Manifest 다국어**
   - [ ] 크롬 확장 목록에서 이름 번역
   - [ ] 크롬 확장 목록에서 설명 번역

---

### Step i18n-2-2: 언어 감지 로직 검증

**파일:** `src/i18n/config.ts` 테스트

```typescript
// detectLanguage 함수 테스트
describe('detectLanguage', () => {
  it('should return ko for Korean locale', () => {
    // chrome.i18n.getUILanguage() 모킹
    const result = detectLanguage();
    expect(result).toBe('ko');
  });

  it('should return en for English locale', () => {
    // 모킹
    const result = detectLanguage();
    expect(result).toBe('en');
  });

  it('should return en for unsupported locale', () => {
    // 일본어 등 지원하지 않는 언어
    const result = detectLanguage();
    expect(result).toBe('en'); // fallback
  });
});
```

---

### Step i18n-2-3: 번역 누락 검사

**스크립트:** `scripts/check-missing-translations.ts`

```typescript
import fs from 'fs';
import path from 'path';

const ko = JSON.parse(fs.readFileSync('src/i18n/locales/ko.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf-8'));

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else if (typeof value === 'object' && value !== null) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey));
    }
  }
  return keys;
}

const koKeys = new Set(getKeys(ko));
const enKeys = new Set(getKeys(en));

// 누락된 키 확인
const missingInKo = [...enKeys].filter(k => !koKeys.has(k));
const missingInEn = [...koKeys].filter(k => !enKeys.has(k));

if (missingInKo.length > 0) {
  console.error('❌ Missing in ko.json:', missingInKo);
}
if (missingInEn.length > 0) {
  console.error('❌ Missing in en.json:', missingInEn);
}

if (missingInKo.length === 0 && missingInEn.length === 0) {
  console.log('✅ All translations synced');
}

process.exit(missingInKo.length + missingInEn.length);
```

**package.json에 추가:**

```json
{
  "scripts": {
    "i18n:check": "tsx scripts/check-missing-translations.ts"
  }
}
```

---

### Step i18n-2-4: 공통 UI 컴포넌트 래핑

**파일:** `src/components/ui/i18n.tsx` (새로 생성)

```tsx
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

// 번역된 텍스트를 렌더링하는 간단한 컴포넌트
export function T({ key, values }: { key: string; values?: Record<string, unknown> }) {
  const { t } = useTranslation();
  return <>{t(key, values)}</>;
}

// 번역된 라벨 컴포넌트
export function LabelT({ key, values, ...props }: { key: string; values?: Record<string, unknown> } & Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'children'>) {
  const { t } = useTranslation();
  return <label {...props}>{t(key, values)}</label>;
}
```

---

### Step i18n-2-5: TOAST 다국어 처리

**파일:** `src/lib/toast.ts` (sonner와 함께 사용)

```typescript
import { toast } from 'sonner';
import { i18n } from '@/i18n/react';

export function showSuccess(key: string, values?: Record<string, unknown>) {
  toast.success(i18n.t(key, values));
}

export function showError(key: string, values?: Record<string, unknown>) {
  toast.error(i18n.t(key, values));
}

export function showInfo(key: string, values?: Record<string, unknown>) {
  toast.info(i18n.t(key, values));
}
```

---

### Step i18n-2-6: Background Script 초기화 개선

**문제:** Background script는 Service Worker라서 `localStorage`를 사용할 수 없습니다.

**해결:** Chrome Storage 직접 사용

```typescript
// src/background/index.ts
import { getCoreI18n } from '@/i18n/core';

// 초기화 시 언어 설정
async function initI18n() {
  const result = await chrome.storage.local.get('app:language');
  const language = result['app:language'] || 'en';

  const i18n = await getCoreI18n();
  await i18n.changeLanguage(language);
}

initI18n();
```

---

### Step i18n-2-7: Content Script 초기화 개선

**문제:** Content script도 로컬 스토리지 접근이 제한될 수 있습니다.

**해결:** 메시지로 현재 언어 요청

```typescript
// src/content/index.ts
import { getCoreI18n } from '@/i18n/core';

let currentLanguage: string = 'en';

// Sidepanel/Bridge에서 언어 정보 수신
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'SYNC_LANGUAGE') {
    currentLanguage = request.language;
    const i18n = getCoreI18n();
    i18n.then(instance => instance.changeLanguage(request.language));
  }
});

// 초기 언어 요청
chrome.runtime.sendMessage({ action: 'GET_LANGUAGE' }, (response) => {
  if (response?.language) {
    currentLanguage = response.language;
  }
});
```

---

### Step i18n-2-8: README 업데이트

**파일:** `README.md`에 i18n 섹션 추가

```markdown
## Internationalization (i18n)

KLIC-Tool supports Korean and English languages.

### Adding Translations

1. Edit `src/i18n/locales/ko.json` and `src/i18n/locales/en.json`
2. Run `npm run i18n:generate` to update TypeScript types
3. Run `npm run i18n:check` to verify both files are in sync

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
}
```

### Supported Languages

- 한국어 (ko)
- English (en)
```

---

### Step i18n-2-9: CONTRIBUTING.md 업데이트 (있는 경우)

```markdown
## Adding New Translations

When adding new features with user-facing text:

1. Add translation keys to both `src/i18n/locales/ko.json` and `en.json`
2. Keep the same key structure in both files
3. Run `npm run i18n:generate` to update types
4. Run `npm run i18n:check` to verify sync
5. Use `useTranslation()` hook in components

Example:
\`\`\`json
// ko.json
{
  "myFeature": {
    "title": "새 기능",
    "description": "이것은 새 기능입니다"
  }
}

// en.json
{
  "myFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
\`\`\`
```

---

### Step i18n-2-10: 최종 빌드 및 검증

```bash
# 번역 동기화 확인
npm run i18n:check

# 타입 생성
npm run i18n:generate

# 빌드
npm run build

# Manifest locale 확인
ls -la dist/_locales/ko/messages.json
ls -la dist/_locales/en/messages.json
```

**Chrome Extension 테스트 체크리스트:**

| 항목 | 한국어 | 영어 | 비고 |
|------|--------|------|------|
| 확장 이름 | KLIC-툴 | KLIC-Tool | 크롬 웹스토어에서 확인 |
| 확장 설명 | 한국어 설명 | English description | |
| Sidepanel Header | KLIC-Tool | KLIC-Tool | |
| 도구 이름 | 한국어 | English | 12개 모두 확인 |
| 도구 설명 | 한국어 | English | 12개 모두 확인 |
| 설정 패널 | 한국어 | English | |
| 언어 변경 | 동작 | 동작 | |
| 에러 메시지 | 한국어 | English | |

---

## Known Issues & Workarounds

### Issue: Background script localStorage 접근 불가
**해결:** Chrome Storage API 사용

### Issue: Content script 언어 동기화
**해결:** 메시지 패싱으로 언어 상태 동기화

### Issue: Manifest locale 형식
**해결:** 빌드 시 변환 스크립트로 자동 변환

---

## Completion Criteria

- [ ] 모든 E2E 테스트 케이스 통과
- [ ] 번역 누락 없음 (i18n:check 통과)
- [ ] TypeScript 타입 정상 생성
- [ ] 한국어/영어 모두 정상 동작
- [ ] 언어 변경 즉시 반영
- [ ] Chrome Storage에 언어 저장 확인
- [ ] Manifest 다국어 확인
- [ ] README, CONTRIBUTING.md 문서화 완료
- [ ] 빌드 성공

---

## 전체 마이그레이션 완료 후

모든 Phase 완료 후:

```bash
# 최종 빌드
npm run build

# Git 커밋
git add .
git commit -m "feat: Add i18n support (Korean, English)"
```

---

## Next Steps

i18n 작업 완료 후:
1. Chrome Web Store에 업로드 시 한국어/영어 설명 모두 작성
2. 스크린샷도 두 언어로 준비
3. 추가 언어 지원이 필요한 경우 `locales/` 디렉토리에 새 파일 추가
