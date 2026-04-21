# KLIC-Tool 기능 체크리스트

> 생성일: 2026-02-13
> 대상: 12개 분석/개발 도구 전체
> 평가 기준: 기능 완성도, 테마 지원, i18n, 에러 처리, 코드 품질

---

## 목차

1. [TextEdit (텍스트 편집)](#1-textedit-텍스트-편집)
2. [Screenshot / GIF (화면 캡처)](#2-screenshot--gif-화면-캡처)
3. [ColorPicker (컬러 피커)](#3-colorpicker-컬러-피커)
4. [CSSScan (CSS 스캔)](#4-cssscan-css-스캔)
5. [Ruler (눈금자)](#5-ruler-눈금자)
6. [GridLayout (그리드 레이아웃)](#6-gridlayout-그리드-레이아웃)
7. [Tailwind (테일윈드 스캐너)](#7-tailwind-테일윈드-스캐너)
8. [FontAnalyzer (폰트 분석)](#8-fontanalyzer-폰트-분석)
9. [Palette (팔레트)](#9-palette-팔레트)
10. [Assets (에셋 관리)](#10-assets-에셋-관리)
11. [Console (콘솔)](#11-console-콘솔)
12. [ResourceNetwork (리소스 네트워크)](#12-resourcenetwork-리소스-네트워크)
13. [AccessibilityChecker (접근성 검사)](#13-accessibilitychecker-접근성-검사)
14. [전체 요약](#전체-요약)

---

## 1. TextEdit (텍스트 편집)

**유형:** Exclusive | **카테고리:** Edit

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 요소 호버 → contentEditable 활성화 → 텍스트 직접 편집 | ✅ |
| 2 | 편집 이력(before/after) 추적 및 되돌리기(Undo) | ✅ |
| 3 | 키보드 단축키(Esc 취소, Enter 확인) 지원 | ✅ |
| 4 | 편집 내용 chrome.storage 저장 및 복원 | ✅ |
| 5 | 호버 오버레이 디바운싱(50ms) 및 시각적 피드백 | ✅ |

### 단점

- `console.log` 3건 잔존 (`TextEditorPanel.tsx:98`, `SettingsPanel.tsx:27`, `EditHistoryItem.tsx:25`)
- i18n 미적용 — 모든 UI 텍스트가 하드코딩 한국어
- 라이트/다크 테마 토큰 미적용 — 하드코딩 색상 사용
- ErrorBoundary 미적용 — 패널 내 에러 발생 시 전체 크래시 가능

### 개선 의견

- `console.log` → 제거하거나 토스트 알림으로 대체
- `useTranslation()` 적용하여 다국어 지원
- `text-gray-*` / `bg-gray-*` → `text-foreground` / `bg-card` 등 테마 토큰 전환
- 편집 이력에 diff 뷰어 추가 (변경 전/후 시각적 비교)

---

## 2. Screenshot / GIF (화면 캡처)

**유형:** Exclusive | **카테고리:** Capture

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 요소 클릭 → captureVisibleTab → Canvas 크롭 → 다운로드 | ✅ |
| 2 | GIF 녹화 (프레임 캡처 → GIF 인코딩) | ✅ |
| 3 | GIF 설정 (Duration, FPS, Quality, 크기 추정) | ✅ |
| 4 | devicePixelRatio 보정으로 고해상도 캡처 | ✅ |
| 5 | 캡처 중 오버레이 자동 숨김 처리 | ✅ |

### 단점

- 기존 요소 단위 스크린샷 UI가 GIF 탭으로 대체됨 — 단일 캡처 기능 접근성 저하
- `ScreenshotSettings.tsx`에 하드코딩 색상 다수 (`text-gray-700`, `bg-blue-50`, `border-gray-200`)
- `GifRecordingTab.tsx`에 미사용 import 3건 (`GIFSettings`, `cn`, `handleStop`)
- `ScreenshotEditor.tsx`에 `console.error` 2건
- 전체 페이지 스크롤 캡처 미지원

### 개선 의견

- 스크린샷 탭 + GIF 탭 병렬 구성으로 양쪽 기능 모두 노출
- 미사용 import 정리 (린트 에러 해소)
- 전체 페이지 스크롤 캡처 기능 추가 (scrollHeight 기반)
- 캡처 후 간단 편집(자르기, 주석) 워크플로우 강화

---

## 3. ColorPicker (컬러 피커)

**유형:** Exclusive | **카테고리:** Analyze

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | EyeDropper API로 화면 색상 픽킹 | ✅ |
| 2 | HEX / RGB / HSL 포맷 변환 및 표시 | ✅ |
| 3 | 색상 히스토리 저장 (5열 그리드) | ✅ |
| 4 | 자동 저장 & 자동 클립보드 복사 설정 | ✅ |
| 5 | 색상 컬렉션 관리 및 즐겨찾기 | ✅ |

### 단점

- i18n 미적용 — UI 텍스트 하드코딩
- `ColorPickerPanel.tsx`에 하드코딩 색상 존재
- EyeDropper API 미지원 브라우저(Firefox 등) 폴백이 `content/index.ts` 인라인에만 존재
- 색상 접근성(대비율) 정보가 유틸에만 있고 패널 UI에 미노출

### 개선 의견

- WCAG 대비율 검사 결과를 선택한 색상 옆에 표시
- 색상 팔레트 자동 생성 (보색, 유사색, 트라이어드)
- oklch / Display P3 등 최신 색상 공간 지원
- 컬렉션 내보내기 (CSS Variables, Tailwind config 형식)

---

## 4. CSSScan (CSS 스캔)

**유형:** Exclusive | **카테고리:** Analyze

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 요소 클릭 → computedStyle 전체 추출 + 카테고리별 분류 | ✅ |
| 2 | 박스 모델 뷰어 (padding/margin/border 시각화) | ✅ |
| 3 | Flexbox / Grid 레이아웃 정보 표시 | ✅ |
| 4 | Matched Rules + Specificity 표시 | ✅ |
| 5 | 값 클릭 → 클립보드 복사 + 시각적 피드백 | ✅ |

### 단점

- `CSSExport.tsx`에 하드코딩 색상 다수 (`bg-gray-900`, `text-gray-100`, `text-gray-600`)
- `FontList.tsx`, `ColorPalette.tsx`, `StyleViewer.tsx`도 하드코딩 색상 사용
- `CSSExport.tsx:42`에 `console.error` 잔존
- 의사 요소(::before, ::after) 스타일 추출 미완전

### 개선 의견

- 전체 하위 컴포넌트 테마 토큰 전환 (CSSExport, FontList, ColorPalette, StyleViewer)
- CSS 변수(Custom Properties) 해석 및 표시
- CSS 스타일 → Tailwind 클래스 변환 연동 (Tailwind 도구 연계)
- 선택 요소 CSS 변경 사항 실시간 프리뷰

---

## 5. Ruler (눈금자)

**유형:** Exclusive | **카테고리:** Measure

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 클릭-드래그로 측정 영역 생성 | ✅ |
| 2 | 생성된 영역 이동(Move), 리사이즈(Resize) | ✅ |
| 3 | 영역 선택/삭제 (키보드 단축키) | ✅ |
| 4 | 최소 크기(10px) 유효성 검증 | ✅ |
| 5 | 측정값 chrome.storage 저장 | ✅ |

### 단점

- 패널 UI가 최소한 — 활성화 상태 표시만 존재
- 측정 결과 수치가 content script 오버레이에만 표시, Side Panel 미연동
- 다중 측정 영역 관리 UI 부재
- 요소 간 거리 자동 측정 기능 없음

### 개선 의견

- Side Panel에 측정 이력/목록 표시 (좌표, 크기)
- 요소 ↔ 요소 간 간격 자동 측정 모드 추가
- 눈금자 스타일 커스터마이징 (색상, 선 두께)
- 측정값 내보내기 (JSON, 스크린샷 주석)

---

## 6. GridLayout (그리드 레이아웃)

**유형:** Exclusive | **카테고리:** Measure

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 그리드 오버레이 (columns, gutter, margin 시각화) | ✅ |
| 2 | 가이드라인 CRUD + 드래그 이동 | ✅ |
| 3 | 뷰포트 프레임 오버레이 (box-shadow 마스킹) | ✅ |
| 4 | 화이트스페이스 분석 및 시각화 | ✅ |
| 5 | 키보드 단축키 + 탭 순서 드래그 커스터마이징 | ✅ |

### 단점

- `GridSettingsPanel`에서 margin/maxWidth 업데이트 핸들러 미구현 (TODO)
- `BreakpointIndicator.tsx`, `GridOverlayDisplay.tsx`에 하드코딩 색상 일부 잔존
- `GridLayoutPanel.tsx:51,61`에 `console.error` 2건
- 가이드라인 스냅 대상이 화면 중앙만 — 그리드 컬럼 경계 스냅 미지원

### 개선 의견

- margin/maxWidth 설정 핸들러 구현 완료
- 가이드라인 → 그리드 컬럼 경계 자동 스냅
- 반응형 브레이크포인트별 그리드 프리셋 전환
- 그리드 설정 내보내기/가져오기 (JSON)

---

## 7. Tailwind (테일윈드 스캐너)

**유형:** Exclusive | **카테고리:** Analyze

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 페이지 Tailwind 사용 감지 (버전, JIT 모드) | ✅ |
| 2 | 클래스 수집 + 카테고리별 분류 통계 | ✅ |
| 3 | CSS → Tailwind 변환 (confidence score 표시) | ✅ |
| 4 | Tailwind config 추출 | ✅ |
| 5 | 변환 이력 관리 및 내보내기 | ✅ |

### 단점

- `ConversionSuggestions.tsx`에 하드코딩 색상 대량 (`bg-gray-800`, `bg-gray-900`, `text-gray-400` 등)
- `ScanResults.tsx`에도 하드코딩 색상 (`text-gray-600`, `bg-blue-500`)
- i18n 미적용 — UI 텍스트 하드코딩
- Tailwind v4 최신 문법(theme() 함수, @apply 대체 등) 미지원

### 개선 의견

- ConversionSuggestions, ScanResults 테마 토큰 전환
- Tailwind v4 문법 지원 업데이트
- 변환 결과 → 클립보드 원클릭 복사 강화
- arbitrary value 사용 빈도 분석 리포트

---

## 8. FontAnalyzer (폰트 분석)

**유형:** Non-exclusive | **카테고리:** Analyze

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 페이지 전체 폰트 스캔 + 사용 빈도 통계 | ✅ |
| 2 | 폰트 메트릭 상세 표시 (family, size, weight, line-height) | ✅ |
| 3 | 폰트 페어링 제안 | ✅ |
| 4 | 폰트 최적화 점수 (색상 코딩: 80+ 녹/60+ 황/40+ 주/<40 적) | ✅ |
| 5 | 요소 클릭 → 해당 요소 폰트 정보 Side Panel 전송 | ✅ |

### 단점

- `FontAnalyzerPanel.tsx:102,385`에 `@typescript-eslint/no-explicit-any` 에러 2건
- i18n 적용은 되어 있으나 번역 키 누락 가능성 존재
- 폰트 로딩 성능 영향(FOIT/FOUT) 분석 미지원
- 웹폰트 vs 시스템폰트 구분이 불명확

### 개선 의견

- `any` 타입 → 구체적 타입으로 교체
- Font Loading API 연동하여 로딩 성능 분석
- Google Fonts / Adobe Fonts 링크 자동 연결
- 폰트 라이선스 정보 표시

---

## 9. Palette (팔레트)

**유형:** Non-exclusive | **카테고리:** Analyze

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 페이지 전체 요소에서 color/background-color/border-color 추출 | ✅ |
| 2 | 중복 제거 및 transparent 필터링 | ✅ |
| 3 | 4열 그리드로 색상 스와치 표시 | ✅ |
| 4 | 색상 클릭 → 클립보드 복사 | ✅ |
| 5 | 추출된 색상 목록 표시 | ✅ |

### 단점

- 전용 패널 컴포넌트 없음 — `ToolRouter.tsx` 내 인라인 렌더링
- 색상 정렬/그룹핑 기능 없음 (유사 색상 묶기)
- 색상 포맷 변환(HEX↔RGB↔HSL) 미지원
- 팔레트 내보내기 기능 없음
- 12개 도구 중 가장 단순한 구현

### 개선 의견

- 전용 `PalettePanel.tsx` 분리 후 기능 확장
- 색상 자동 그룹핑 (색상 유사도 기반 클러스터링)
- 팔레트 내보내기 (ASE, CSS Variables, Tailwind config)
- WCAG 대비율 매트릭스 (전경/배경 조합별 Pass/Fail)
- 색맹 시뮬레이션 프리뷰

---

## 10. Assets (에셋 관리)

**유형:** Non-exclusive | **카테고리:** Utility

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | IMG/SVG/Video/배경이미지/아이콘 자동 추출 | ✅ |
| 2 | 포맷별 필터 (JPG, PNG, GIF, SVG, WEBP, ICO) | ✅ |
| 3 | 그리드/리스트 뷰 전환 + 정렬 (크기, 날짜, 치수) | ✅ |
| 4 | 개별/일괄 다운로드 (ZIP) + 클립보드 복사 | ✅ |
| 5 | 이미지 프리뷰 모달 (Esc 닫기) | ✅ |

### 단점

- `AssetManagerPanel.tsx`에 `console.error` 5건
- `AssetFilters.tsx`에 하드코딩 색상 (`bg-blue-500`, `bg-purple-500` 등)
- `AssetCard.tsx`에 하드코딩 색상 존재
- i18n 미적용
- lazy-loaded 이미지 추출 시 data-src 외 프레임워크별 속성(v-lazy, :src 등) 미지원

### 개선 의견

- 하드코딩 색상 → 테마 토큰 전환
- 이미지 최적화 제안 (WebP 변환, 적정 크기 권장)
- 이미지 alt 텍스트 누락 경고 (접근성 연계)
- 에셋 사용처 매핑 (어느 요소에서 사용되는지)

---

## 11. Console (콘솔)

**유형:** Non-exclusive | **카테고리:** Utility

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | console.log/warn/error/info/debug 인터셉트 | ✅ |
| 2 | 레벨별 필터 + 실시간 검색 | ✅ |
| 3 | 로그 통계 시각화 (레벨별 카운트) | ✅ |
| 4 | 내보내기 (JSON, TXT, CSV) + 타임스탬프 | ✅ |
| 5 | 스택 트레이스 표시 + 자동 스크롤 | ✅ |

### 단점

- `ConsolePanel.tsx:97-100`에 하드코딩 색상 (`text-gray-700`)
- `LogList.tsx`, `LogFilter.tsx`, `LogEntry.tsx`, `LogStats.tsx`, `SearchBar.tsx`, `StackTrace.tsx` 전반 하드코딩 색상
- `ConsolePanel.tsx:55`에 `console.error` (콘솔 도구가 자체 로깅하는 아이러니)
- i18n 미적용
- 네트워크 에러(fetch/XHR 실패) 캡처 미지원

### 개선 의견

- 전체 하위 컴포넌트 테마 토큰 전환 (6개 파일)
- 네트워크 에러 자동 캡처 (fetch/XHR 실패)
- 로그 북마크/핀 기능
- 정규식 기반 고급 필터링
- 로그 레벨별 알림 설정 (error 발생 시 뱃지)

---

## 12. ResourceNetwork (리소스 네트워크)

**유형:** Non-exclusive | **카테고리:** Utility

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 네트워크 모니터링 (요청/응답, 크기, 시간, 캐시 히트) | ✅ |
| 2 | 스토리지 분석 (localStorage, sessionStorage, Cookie) + 개별 삭제 | ✅ |
| 3 | CSS 애니메이션 감지 + 성능 영향도 평가 | ✅ |
| 4 | 캐시 관리 (히트율, 만료 항목, 자동 정리) | ✅ |
| 5 | 4개 서브패널 탭 구성 (Storage, Animation, Network, Cache) | ✅ |

### 단점

- 내보내기 기능 3건 미구현 (NetworkMonitor HAR, AnimationInspector, CacheManager)
- 서브패널 ErrorBoundary/try-catch 전무 — API 호출 실패 시 크래시 가능
- `AnimationInspectorPanel.tsx:180-181` 에 `void animation.animations` 스텁
- i18n 미적용
- 네트워크 워터폴 차트 미지원

### 개선 의견

- 3건의 내보내기 기능 구현 (HAR, JSON)
- 각 서브패널에 try-catch 에러 핸들링 추가
- 네트워크 워터폴 타임라인 차트 추가
- IndexedDB 분석 지원
- 리소스 크기 최적화 제안 (압축, CDN, 캐싱 전략)

---

## 13. AccessibilityChecker (접근성 검사)

**유형:** Non-exclusive | **카테고리:** Analyze

### 기능 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | DOM 스캔 → 접근성 이슈 자동 감지 | ✅ |
| 2 | 카테고리별 이슈 분류 (색상 대비, ARIA, 시맨틱 HTML) | ✅ |
| 3 | 이슈 점수 카드 표시 | ✅ |
| 4 | 호버 시 요소 접근성 정보 (role, aria-label, alt) 표시 | ✅ |
| 5 | 리포트 내보내기 (JSON/CSV/HTML) | ✅ |

### 단점

- `A11Y_SCAN_PROGRESS`는 상수/수신은 있으나 실제 전송이 없음
- HTML 카테고리는 오케스트레이터에서 항상 report에 포함되며(`enabledCategories`에서 html off 시 issues만 비움) UX상 혼동 가능

### 개선 의견

- PDF/Markdown 내보내기(선택)
- `A11Y_SCAN_PROGRESS` 실제 구현(선택)
- KRDS 유틸 실제 검증 로직 확장(정확도/커버리지 개선)
- axe-core / Lighthouse 연동으로 검증 정확도 향상
- 이슈 자동 수정 제안 (코드 스니펫 제공)

---

## 전체 요약

### 도구별 완성도

| 도구 | 기능 | 테마 | i18n | 에러 처리 | 린트 | 종합 |
|------|------|------|------|-----------|------|------|
| TextEdit | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | B+ |
| Screenshot/GIF | ✅ | ❌ | ✅ | ⚠️ | ❌ | B |
| ColorPicker | ✅ | ❌ | ❌ | ✅ | ✅ | A- |
| CSSScan | ✅ | ❌ | ✅ | ⚠️ | ✅ | A- |
| Ruler | ✅ | ✅ | ❌ | ⚠️ | ✅ | B+ |
| GridLayout | ✅ | ✅ | ❌ | ✅ | ✅ | A |
| Tailwind | ✅ | ❌ | ❌ | ⚠️ | ✅ | B+ |
| FontAnalyzer | ✅ | ✅ | ✅ | ⚠️ | ❌ | A- |
| Palette | ⚠️ | ✅ | ❌ | ❌ | ✅ | C+ |
| Assets | ✅ | ❌ | ❌ | ✅ | ✅ | B+ |
| Console | ✅ | ❌ | ❌ | ⚠️ | ✅ | B |
| ResourceNetwork | ✅ | ✅ | ❌ | ❌ | ✅ | B |
| Accessibility | ⚠️ | ✅ | ✅ | ❌ | ❌ | C+ |

> ✅ = 완료 | ⚠️ = 부분 구현 | ❌ = 미구현/미흡

### 공통 이슈 (우선순위순)

| 순위 | 이슈 | 영향 범위 | 심각도 |
|------|------|-----------|--------|
| 1 | **하드코딩 색상** — 45개 파일에서 `bg-gray-*`, `text-gray-*` 사용 | 거의 전체 | HIGH |
| 2 | **ErrorBoundary 부재** — 30개+ 패널에 에러 경계 없음 | 거의 전체 | HIGH |
| 3 | **i18n 미적용** — 20개+ 패널에서 텍스트 하드코딩 | 대부분 | MEDIUM |
| 4 | **내보내기 스텁** — 4개 파일에서 빈 onClick 핸들러 | ResourceNetwork, Accessibility | MEDIUM |
| 5 | **린트 에러** — 84개 에러 (주로 미사용 변수/import, `any` 타입) | Accessibility, Screenshot, Content | MEDIUM |
| 6 | **console.log 잔존** — 프로덕션 코드에 3건 (`console.error` 제외) | TextEdit | LOW |

### 권장 개선 로드맵

```
Phase 1 (즉시)  → 린트 에러 84건 전면 정리
Phase 2 (단기)  → 하드코딩 색상 → 테마 토큰 전환 (45개 파일)
Phase 3 (단기)  → 내보내기 스텁 4건 구현
Phase 4 (중기)  → ErrorBoundary 전체 패널 래핑
Phase 5 (중기)  → i18n 전체 패널 적용
Phase 6 (장기)  → Palette 전용 패널 분리 + 기능 확장
```
