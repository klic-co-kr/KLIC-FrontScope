# shadcn/ui Migration Checklist

이 체크리스트를 사용하여 각 Phase의 완료 상태를 추적하세요.

---

## Phase 0: 인프라 셋업 (1일) ✅

### Step 0-1: Feature Branch 생성
- [x] `feature/shadcn-migration` 브랜치 생성
- [x] clean working directory 확인

### Step 0-2: 패키지 설치
- [x] `class-variance-authority` 설치
- [x] `clsx` 설치
- [x] `tailwind-merge` 설치
- [x] `tw-animate-css` 설치
- [x] package.json 확인

### Step 0-3: components.json 생성
- [x] `npx shadcn@latest init` 실행
- [x] 설정값 확인 (new-york, rsc: false, tsx: true)

### Step 0-4: public/theme-init.js 생성
- [x] 파일 생성 완료
- [x] MV3 CSP 준수 확인 (외부 파일)

### Step 0-5: src/lib/utils.ts 생성
- [x] `cn()` 함수 구현

### Step 0-6: src/index.css 전면 교체
- [x] Light mode CSS 변수
- [x] Dark mode CSS 변수
- [x] 5개 액센트 테마
- [x] Semantic colors (warning, success, info)
- [x] Sidebar, chart 변수
- [x] @theme inline 블록

### Step 0-7: HTML 파일에 script 추가
- [x] sidepanel.html에 `<script src="theme-init.js"></script>` 추가
- [x] index.html에 `<script src="theme-init.js"></script>` 추가

### Step 0-8: 빌드 확인
- [x] `npm run build` 성공
- [x] 기존 UI 정상 작동
- [x] 콘솔 에러 없음

---

## Phase 1: shadcn 기본 컴포넌트 + 공통 UI (2일) ✅

### Step 1-1: shadcn 컴포넌트 설치
- [x] 16개 컴포넌트 설치 완료
- [x] `src/components/ui/` 디렉토리 확인

### Step 1-2: ThemeProvider 생성
- [x] `src/lib/theme-provider.tsx` 생성
- [x] ready state 로딩 가드
- [x] chrome.storage.onChanged 리스너
- [x] data-theme 항상 설정 (blue 포함)

### Step 1-3: Sidepanel App.tsx
- [x] ThemeProvider 래핑
- [x] 색상 클래스 교체

### Step 1-4: Popup App.tsx
- [x] ThemeProvider 래핑
- [x] 색상 클래스 교체

### Step 1-5: Header 컴포넌트
- [x] 색상 교체 완료

### Step 1-6: ToolRouter
- [x] Card화 완료
- [x] 색상 교체 완료

### Step 1-7: SettingsPanel
- [x] useTheme() 연동
- [x] Mode toggle (3버튼)
- [x] Accent selection (5색상 버튼)

### Step 1-8: Sonner 토스트
- [x] Toaster 컴포넌트 추가
- [x] toast() 함수 사용 가능

---

## Phase 2: 단순 도구 패널 (2일) ✅

### Step 2-1: TextEdit
- [x] Card, Button 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 2-2: Screenshot
- [x] Card, Dialog, Slider 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 2-3: ColorPicker
- [x] Card, Button, Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 2-4: CssScan
- [x] Card, Tabs, Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 2-5: Ruler
- [x] Card, Button 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

---

## Phase 3: 복합 도구 패널 (2일) ✅

### Step 3-1: FontAnalyzer
- [x] Card, Accordion, ScrollArea, Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 3-2: Palette
- [x] Card, ScrollArea, Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 3-3: Console
- [x] Card, ScrollArea, Badge, Separator 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 3-4: AssetManager
- [x] Card, Button, Checkbox, Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

---

## Phase 4: 탭 기반 복합 도구 (3일) ✅

### Step 4-1: GridLayout (1.5일)
- [x] 5개 탭 구조
- [x] Input, Label 적용
- [x] Slider 적용
- [x] Switch 적용
- [x] Select 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 4-2: ResourceNetwork (1일)
- [x] 4개 탭 구조
- [x] Table 적용
- [x] Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

### Step 4-3: TailwindScanner (0.5일)
- [x] 3개 탭 구조
- [x] ScrollArea, Badge 적용
- [x] 기능 작동 확인
- [x] 다크모드 확인

---

## Phase 5: 마무리 (1일) ✅

### Step 5-1: Content Script
- [x] `src/content/utils/` 디렉토리 생성
- [x] `detectTheme.ts` 생성 (detectPageTheme, getToastColors 함수)
- [x] 토스트 테마 분기 작동 확인

### Step 5-2: 빌드
- [x] `npm run build` 성공
- [x] 모든 엔트리 포인트 확인

### Step 5-3: 다크/라이트 모드 테스트
- [x] Light 모드 작동
- [x] Dark 모드 작동
- [x] System 모드 작동
- [x] FOUC 없음
- [x] 새로고침 후 모드 유지
- [x] Popup/Sidepanel 동기화

### Step 5-4: 액센트 테마 테스트
- [x] Blue 작동 및 대비 확인
- [x] Amber 작동 및 **전경색 대비 확인**
- [x] Green 작동 및 대비 확인
- [x] Violet 작동 및 대비 확인
- [x] Rose 작동 및 대비 확인

### Step 5-5: 문서화
- [x] CLAUDE.md 업데이트

### Step 5-6: Git
- [x] 커밋 완료
- [x] Push 완료

---

## Phase i18n-0: i18n 인프라 셋업 (1일) ✅

### Step i18n-0-1: 패키지 설치
- [x] `react-i18next` 설치
- [x] `i18next` 설치
- [x] `i18next-browser-languagedetector` 설치
- [x] `i18next-typescript-generator` 설치

### Step i18n-0-2: 디렉토리 구조
- [x] `src/i18n/` 디렉토리 생성
- [x] `src/i18n/locales/` 디렉토리 생성

### Step i18n-0-3: 번역 파일
- [x] `src/i18n/locales/ko.json` 생성
- [x] `src/i18n/locales/en.json` 생성
- [x] 모든 도구 이름/설명 추가
- [x] 공통 텍스트 추가
- [x] 에러 메시지 추가

### Step i18n-0-4: 공통 설정
- [x] `src/i18n/config.ts` 생성
- [x] `detectLanguage()` 함수 구현
- [x] 리소스 설정 완료

### Step i18n-0-5: React 설정
- [x] `src/i18n/react.ts` 생성
- [x] `changeLanguage()` 함수 구현

### Step i18n-0-6: Core 설정
- [x] `src/i18n/core.ts` 생성
- [x] `getCoreI18n()` 함수 구현
- [x] `t()` 함수 구현

### Step i18n-0-7: TypeScript 타입
- [x] `i18n-tsconfig.json` 생성
- [x] package.json에 `i18n:generate` 스크립트 추가
- [x] 타입 생성 동작 확인

### Step i18n-0-8: Manifest 변환
- [x] `scripts/generate-manifest-locales.ts` 생성
- [x] Vite 플러그인 추가
- [x] `public/manifest.json`에 `default_locale` 추가

### Step i18n-0-9: 빌드 확인
- [x] `npm run i18n:generate` 성공
- [x] `npm run build` 성공
- [x] `dist/_locales/ko/messages.json` 확인
- [x] `dist/_locales/en/messages.json` 확인

---

## Phase i18n-1: UI 텍스트 번역 (1일) ✅

### Step i18n-1-1: Sidepanel App
- [x] I18nextProvider 추가
- [x] useTranslation() 훅 적용
- [x] Header 텍스트 번역
- [x] 도구 이름/설명 번역
- [x] confirm 메시지 번역

### Step i18n-1-2: SettingsPanel
- [x] 언어 선택 UI 추가
- [x] 언어 변경 핸들러 구현
- [x] 설정 텍스트 번역

### Step i18n-1-3: 도구 패널 (12개)
- [x] ScreenshotPanel 번역
- [x] ColorPickerPanel 번역
- [x] CSSScanPanel 번역
- [x] RulerPanel 번역
- [x] GridLayoutPanel 번역
- [x] TailwindScannerPanel 번역
- [x] TextEditorPanel 번역
- [x] FontAnalyzerPanel 번역
- [x] PalettePanel 번역
- [x] AssetManagerPanel 번역
- [x] ConsolePanel 번역
- [x] ResourceNetworkPanel 번역

### Step i18n-1-4: 에러 메시지
- [x] sendToolMessage 에러 번역
- [x] Toast 에러 번역

### Step i18n-1-5: Popup
- [x] I18nextProvider 추가
- [x] 텍스트 번역

### Step i18n-1-6: Content Script
- [x] core.ts i18n 적용
- [x] 메시지 응답 번역

### Step i18n-1-7: Background Script
- [x] core.ts i18n 적용
- [x] Context 메뉴 번역
- [x] 에러 메시지 번역

### Step i18n-1-8: 빌드 및 테스트
- [x] 빌드 성공
- [x] 언어 변경 동작 확인
- [x] 한국어 UI 확인
- [x] 영어 UI 확인

---

## Phase i18n-2: 마무리 및 테스트 (1일) ✅

### Step i18n-2-1: E2E 테스트
- [x] 초기 언어 감지 확인
- [x] 언어 변경 기능 확인
- [x] 모든 도구 번역 확인
- [x] 에러 메시지 확인
- [x] 설정 패널 확인
- [x] Manifest 다국어 확인

### Step i18n-2-2: 번열 동기화
- [x] `scripts/check-missing-translations.ts` 생성
- [x] `npm run i18n:check` 통과

### Step i18n-2-3: 공통 컴포넌트
- [x] `src/components/ui/i18n.tsx` 생성
- [x] Toast 다국어 래퍼

### Step i18n-2-4: 문서화
- [x] README.md 업데이트
- [x] CONTRIBUTING.md 업데이트

### Step i18n-2-5: 최종 검증
- [x] 모든 테스트 케이스 통과
- [x] TypeScript 타입 정상
- [x] 빌드 성공
- [x] Chrome Extension 테스트 통과

---

## 최종 확인

- [x] 모든 Phase 완료
- [x] 모든 체크리스트 항목 통과
- [x] 빌드 성공
- [x] 테마 전환 정상 작동
- [x] 콘솔 에러 없음
- [x] 문서화 완료

---

## 진행률

```
=== shadcn/ui Migration ===
Phase 0: [██████████] 8/8 ✅
Phase 1: [██████████] 8/8 ✅
Phase 2: [██████████] 5/5 ✅
Phase 3: [██████████] 4/4 ✅
Phase 4: [██████████] 3/3 ✅
Phase 5: [██████████] 6/6 ✅

=== i18n Internationalization ===
Phase i18n-0: [██████████] 9/9 ✅
Phase i18n-1: [██████████] 8/8 ✅
Phase i18n-2: [██████████] 5/5 ✅

Total:  [████████████████████████████████] 56/56 ✅
```

---

## 완료일

- **shadcn/ui Migration**: 2025-02-11
- **i18n Internationalization**: 2025-02-11
