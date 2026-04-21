# Phase i18n-0: i18n 인프라 셋업

> Duration: 1일
> Goal: react-i18next 기반 다국어 시스템 인프라 구축

## Overview

이 Phase에서는 react-i18next와 i18next를 사용하여 한국어/영어 다국어 지원을 위한 기반 작업을 수행합니다.

## Steps

### Step i18n-0-1: 패키지 설치

```bash
# react-i18next 및 의존성
npm i react-i18next i18next i18next-browser-languagedetector

# 타입 자동 생성
npm i -D i18next-typescript-generator
```

**설치되는 패키지:**
- `react-i18next`: React용 i18next 바인딩
- `i18next`: i18next 코어
- `i18next-browser-languagedetector`: 브라우저 언어 자동 감지
- `i18next-typescript-generator`: 번역 파일에서 TypeScript 타입 자동 생성

---

### Step i18n-0-2: i18n 디렉토리 구조 생성

```bash
mkdir -p src/i18n/locales
```

**구조:**
```
src/i18n/
├── locales/
│   ├── ko.json       # 한국어 번역
│   └── en.json       # 영어 번역
├── config.ts         # 공통 설정
├── react.ts          # React 용
└── core.ts           # 코어 용
```

---

### Step i18n-0-3: 번역 파일 생성 (초기 버전)

**파일:** `src/i18n/locales/ko.json`

```json
{
  "app": {
    "name": "KLIC-Tool",
    "activeCount": "{{count}}개 활성"
  },
  "common": {
    "enable": "활성화",
    "disable": "비활성화",
    "save": "저장",
    "cancel": "취소",
    "close": "닫기",
    "settings": "설정",
    "loading": "로딩 중...",
    "success": "성공",
    "error": "오류"
  },
  "errors": {
    "contentScriptTimeout": "콘텐츠 스크립트가 응답하지 않습니다",
    "captureFailed": "캡처에 실패했습니다",
    "injectionFailed": "스크립트 주입에 실패했습니다"
  },
  "tools": {
    "screenshot": {
      "name": "스크린샷",
      "description": "화면 캡처"
    },
    "colorPicker": {
      "name": "컬러 피커",
      "description": "색상 추출"
    },
    "cssScan": {
      "name": "CSS 스캔",
      "description": "CSS 검사"
    },
    "ruler": {
      "name": "룰러",
      "description": "거리 측정"
    },
    "gridLayout": {
      "name": "그리드 레이아웃",
      "description": "그리드 오버레이"
    },
    "tailwind": {
      "name": "Tailwind",
      "description": "Tailwind 스캔"
    },
    "textEdit": {
      "name": "텍스트 에디터",
      "description": "텍스트 편집"
    },
    "fontAnalyzer": {
      "name": "폰트 분석기",
      "description": "폰트 감지"
    },
    "palette": {
      "name": "팔레트",
      "description": "색상 팔레트"
    },
    "assets": {
      "name": "에셋",
      "description": "이미지 추출"
    },
    "console": {
      "name": "콘솔",
      "description": "콘솔 로그"
    },
    "resourceNetwork": {
      "name": "리소스 네트워크",
      "description": "성능 모니터링"
    }
  },
  "settings": {
    "title": "설정",
    "language": {
      "label": "언어",
      "ko": "한국어",
      "en": "English"
    },
    "theme": {
      "label": "테마",
      "mode": "모드",
      "accent": "액센트"
    }
  },
  "manifest": {
    "name": "KLIC-툴",
    "description": "사이드 패널 프론트엔드 개발 도구"
  }
}
```

**파일:** `src/i18n/locales/en.json`

```json
{
  "app": {
    "name": "KLIC-Tool",
    "activeCount": "{{count}} active"
  },
  "common": {
    "enable": "Enable",
    "disable": "Disable",
    "save": "Save",
    "cancel": "Cancel",
    "close": "Close",
    "settings": "Settings",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error"
  },
  "errors": {
    "contentScriptTimeout": "Content script not responding",
    "captureFailed": "Capture failed",
    "injectionFailed": "Script injection failed"
  },
  "tools": {
    "screenshot": {
      "name": "Screenshot",
      "description": "Capture screenshots"
    },
    "colorPicker": {
      "name": "Color Picker",
      "description": "Extract colors"
    },
    "cssScan": {
      "name": "CSS Scan",
      "description": "Inspect CSS"
    },
    "ruler": {
      "name": "Ruler",
      "description": "Measure distance"
    },
    "gridLayout": {
      "name": "Grid Layout",
      "description": "Grid overlay"
    },
    "tailwind": {
      "name": "Tailwind",
      "description": "Tailwind scanner"
    },
    "textEdit": {
      "name": "Text Editor",
      "description": "Edit text"
    },
    "fontAnalyzer": {
      "name": "Font Analyzer",
      "description": "Detect fonts"
    },
    "palette": {
      "name": "Palette",
      "description": "Color palette"
    },
    "assets": {
      "name": "Assets",
      "description": "Extract images"
    },
    "console": {
      "name": "Console",
      "description": "Console logs"
    },
    "resourceNetwork": {
      "name": "Resource Network",
      "description": "Performance monitor"
    }
  },
  "settings": {
    "title": "Settings",
    "language": {
      "label": "Language",
      "ko": "한국어",
      "en": "English"
    },
    "theme": {
      "label": "Theme",
      "mode": "Mode",
      "accent": "Accent"
    }
  },
  "manifest": {
    "name": "KLIC-Tool",
    "description": "Frontend development tools in side panel"
  }
}
```

---

### Step i18n-0-4: 공통 i18n 설정 생성

**파일:** `src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 번역 파일 import
import ko from './locales/ko.json';
import en from './locales/en.json';

// 리소스
const resources = {
  ko: { translation: ko },
  en: { translation: en },
};

// 지원 언어
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// 언어 감지 함수
export function detectLanguage(): SupportedLanguage {
  const browserLang = chrome.i18n.getUILanguage();
  return browserLang.startsWith('ko') ? 'ko' : 'en';
}

// i18n 초기화 옵션
export const i18nConfig = {
  resources,
  fallbackLng: 'en' as const,
  lng: undefined, // LanguageDetector에서 자동 감지
  debug: process.env.NODE_ENV === 'development',

  interpolation: {
    escapeValue: false, // React가 이미 XSS를 방지
  },

  detection: {
    // Chrome Storage에서 언어 읽기
    lookup: 'localStorage',
    caches: ['localStorage'],
  },
};

// i18n 인스턴스 생성 (core용)
export async function createI18nInstance() {
  const instance = i18n.createInstance();
  await instance.use(LanguageDetector).init({
    ...i18nConfig,
    lng: detectLanguage(),
  });
  return instance;
}

// React용 i18n 설정
export function setupReactI18n() {
  i18n.use(LanguageDetector).use(initReactI18next).init({
    ...i18nConfig,
    lng: detectLanguage(),
  });
  return i18n;
}
```

---

### Step i18n-0-5: React용 i18n 설정 생성

**파일:** `src/i18n/react.ts`

```typescript
import { setupReactI18n } from './config';

// React에서 사용할 i18n 인스턴스
export const i18n = setupReactI18n();

// 언어 변경 함수
export async function changeLanguage(lang: 'ko' | 'en') {
  await i18n.changeLanguage(lang);
  // Chrome Storage에 저장
  chrome.storage.local.set({ 'app:language': lang });
}
```

---

### Step i18n-0-6: 코어용 i18n 설정 생성

**파일:** `src/i18n/core.ts`

```typescript
import { createI18nInstance, detectLanguage, type SupportedLanguage } from './config';

let coreI18n: Awaited<ReturnType<typeof createI18nInstance>> | null = null;

// background, content script에서 사용
export async function getCoreI18n() {
  if (!coreI18n) {
    coreI18n = await createI18nInstance();
  }
  return coreI18n;
}

// 번역 함수 (간단한 사용을 위해)
export async function t(key: string, options?: Record<string, unknown>) {
  const i18n = await getCoreI18n();
  return i18n.t(key, options);
}
```

---

### Step i18n-0-7: TypeScript 타입 자동 생성 설정

**파일:** `i18n-tsconfig.json` (루트)

```json
{
  "translationFunctionName": ["t", "useTranslation"],
  "outputPath": "src/i18n/types.ts",
  "localesPath": "src/i18n/locales",
  "fileName": "json"
}
```

**package.json에 스크립트 추가:**

```json
{
  "scripts": {
    "i18n:generate": "i18next-typescript-generator --config i18n-tsconfig.json"
  }
}
```

---

### Step i18n-0-8: manifest 빌드용 Vite 플러그인 생성

**파일:** `scripts/generate-manifest-locales.ts`

```typescript
import fs from 'fs';
import path from 'path';

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const outputDir = path.resolve(__dirname, '../public/_locales');

// 변환 함수: i18n → Chrome messages.json 형식
function convertToMessagesFormat(translations: Record<string, unknown>): Record<string, { message: string }> {
  const result: Record<string, { message: string }> = {};

  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      if (typeof value === 'string') {
        // {{variable}} → $1$ 형식으로 변환
        const message = value.replace(/\{\{(\w+)\}\}/g, '$$$1$');
        result[fullKey] = { message };
      } else if (typeof value === 'object' && value !== null) {
        flatten(value as Record<string, unknown>, fullKey);
      }
    }
  }

  flatten(translations);
  return result;
}

// 번역 파일 변환
['ko', 'en'].forEach((lang) => {
  const inputFile = path.join(localesDir, `${lang}.json`);
  const outputDirLang = path.join(outputDir, lang);
  const outputFile = path.join(outputDirLang, 'messages.json');

  const translations = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const messages = convertToMessagesFormat(translations);

  fs.mkdirSync(outputDirLang, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(messages, null, 2));
});

console.log('✓ Manifest locales generated');
```

---

### Step i18n-0-9: Vite 플러그인으로 빌드 시 자동 생성

**파일:** `vite.config.ts` 수정

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// manifest locale 생성 플러그인
function generateManifestLocales() {
  return {
    name: 'generate-manifest-locales',
    writeBundle() {
      try {
        execSync('tsx scripts/generate-manifest-locales.ts', {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      } catch (error) {
        console.warn('Failed to generate manifest locales:', error);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    generateManifestLocales(), // 빌드 시 manifest locale 생성
  ],
  // ... 기존 설정
});
```

---

### Step i18n-0-10: manifest.json 다국어 설정

**파일:** `public/manifest.json` 수정

```json
{
  "name": "__MSG_manifest_name__",
  "description": "__MSG_manifest_description__",
  "default_locale": "en"
}
```

---

### Step i18n-0-11: 빌드 확인

```bash
# 타입 생성
npm run i18n:generate

# 빌드
npm run build

# 확인
ls -la dist/_locales/
ls -la dist/_locales/ko/
ls -la dist/_locales/en/
```

**확인사항:**
- [ ] `src/i18n/types.ts`가 생성되었는지
- [ ] `dist/_locales/ko/messages.json`이 생성되었는지
- [ ] `dist/_locales/en/messages.json`이 생성되었는지

---

## Completion Criteria

- [ ] react-i18next 및 의존성 설치 완료
- [ ] 번역 파일 (ko.json, en.json) 생성 완료
- [ ] i18n 설정 파일 생성 완료 (config.ts, react.ts, core.ts)
- [ ] TypeScript 타입 자동 생성 설정 완료
- [ ] Manifest locale 변환 스크립트 생성 완료
- [ ] 빌드 시 manifest locale 자동 생성 확인
- [ ] 빌드 성공

---

## Next Phase

[Phase i18n-1: UI 텍스트 번역](./21-i18n-1-ui-migration.md)
