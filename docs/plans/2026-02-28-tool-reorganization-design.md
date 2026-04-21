# 도구 메뉴 재구성 설계

## 개요

KLIC-Tool의 사이드 패널 도구 메뉴를 재구성하여 사용성을 개선합니다.

### 목표

1. **컬러피커 + 팔레트 통합** — "팔레트"로 통합, 피커 모드 포함
2. **컴포넌트 추출 추가** — 프레임워크 감지 + HTML 구조 분석

### 비목표

- 백엔드 프레임워크 감지 (브라우저 제약으로 불가)
- 모바일 플랫폼 지원 (Chrome Extension 범위 외)

---

## 변경 사항

### 도구 목록 변화

| 이전 | 이후 |
|------|------|
| 14개 도구 | 14개 도구 (동일) |
| 컬러피커 + 팔레트 (2개) | 팔레트 (1개, 통합) |
| - | 컴포넌트 (1개, 추가) |

### 도구 정의 변경

```typescript
// src/sidepanel/constants/tools.ts

// 삭제
- { id: 'colorPicker', ... }

// 수정
- { id: 'palette', name: '팔레트', description: '페이지 색상 + 색상 피커', ... }

// 추가
+ { id: 'componentInspector', name: '컴포넌트', description: '컴포넌트 구조 분석', ... }
```

---

## 1. 팔레트 통합 설계

### UI 구조

```
┌─────────────────────────────────────┐
│ 팔레트                               │
├─────────────────────────────────────┤
│ [🎨 피커 모드]  [🔄 전체 스캔]        │  ← 툴바
├─────────────────────────────────────┤
│                                     │
│  ■ #FF5733  rgb(255,87,51)          │  ← 색상 목록
│  ■ #2D3436  rgb(45,52,54)           │
│  ■ ...                              │
│                                     │
└─────────────────────────────────────┘
```

### 작동 모드

| 모드 | 동작 |
|------|------|
| **피커 OFF** | 색상 목록만 표시 (기존 팔레트) |
| **피커 ON** | hover 오버레이, 클릭 시 색상 추출 → 목록 자동 추가 |

### 구현 방식

- 기존 `PalettePanel.tsx` 확장
- 툴바에 토글 버튼 추가
- 피커 모드 시 Content Script에 메시지 전송 → hover 오버레이 활성화
- 클릭 이벤트에서 색상 추출 후 팔레트 상태에 추가

### 파일 변경

| 파일 | 변경 내용 |
|------|-----------|
| `src/sidepanel/constants/tools.ts` | colorPicker 삭제, palette description 수정 |
| `src/sidepanel/components/ToolRouter.tsx` | colorPicker 라우트 삭제 |
| `src/components/Palette/PalettePanel.tsx` | 피커 모드 툴바 추가 |
| `src/content/index.ts` | colorPicker 핸들러를 palette로 통합 |
| `src/types/palette.ts` | 피커 모드 관련 타입 추가 |

---

## 2. 컴포넌트 추출 설계

### UI 구조

```
┌─────────────────────────────────────────────────┐
│ 컴포넌트                                          │
├─────────────────────────────────────────────────┤
│ [🎯 피커] [🔄 스캔]  🔍 [React|Vue|HTML]         │  ← 필터
├─────────────────────────────────────────────────┤
│                                                 │
│ ⚛️ React: Button (Next.js)                      │
│    📦 props: { variant: "primary", size: "lg" } │
│    📁 src/components/Button.tsx                 │
│                                                 │
│ 🟢 Vue: HeroSection                             │
│    📦 props: { title: "Welcome" }               │
│    📄 data: { isVisible: true }                 │
│                                                 │
│ 📄 HTML: div.hero-section                       │
│    class: "hero-section fade-in"                │
│    id: "main-hero"                              │
│    children: 3                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 감지 우선순위

```
1순위: 프레임워크 컴포넌트
   ├── React (__reactFiber$*)
   ├── Vue (__vue__)
   ├── Angular (ng-* 속성)
   ├── Svelte (__svelte_meta)
   └── Web Components (customElements)

2순위: 메타 프레임워크
   ├── Next.js (__NEXT_DATA__)
   └── Nuxt (__NUXT__)

3순위: HTML 구조
   └── 태그, class, id, 속성, 계층
```

### 작동 모드

| 모드 | 동작 |
|------|------|
| **피커 ON** | hover 오버레이, 클릭 시 컴포넌트 정보 표시 |
| **전체 스캔** | 페이지 전체 컴포넌트 수집 → 목록 표시 |

### 데이터 구조

```typescript
// src/types/component.ts

interface ComponentInfo {
  id: string;
  type: 'react' | 'vue' | 'angular' | 'svelte' | 'web-component' | 'html';
  name: string;
  selector: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  source?: string;  // 파일 경로 (가능한 경우)
  element: HTMLElement;
  children: number;
  depth: number;
}

interface ComponentScanResult {
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'next' | 'nuxt' | 'unknown';
  metaFramework?: 'next' | 'nuxt';
  components: ComponentInfo[];
  totalElements: number;
  scannedAt: number;
}
```

### 프레임워크 감지 구현

```typescript
// src/content/componentInspector/detector.ts

function detectReact(element: HTMLElement): ComponentInfo | null {
  const fiberKey = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
  if (!fiberKey) return null;

  const fiber = (element as any)[fiberKey];
  return {
    type: 'react',
    name: fiber.type?.name || fiber.type?.displayName || 'Anonymous',
    props: fiber.memoizedProps,
    // ...
  };
}

function detectVue(element: HTMLElement): ComponentInfo | null {
  const vue = (element as any).__vue__;
  if (!vue) return null;

  return {
    type: 'vue',
    name: vue.$options.name || 'Anonymous',
    props: vue.$props,
    state: vue.$data,
    // ...
  };
}

// Angular, Svelte, Web Components 유사하게 구현
```

### 파일 구조

```
src/
├── types/
│   └── component.ts                    # 타입 정의
├── content/
│   └── componentInspector/             # 신규 모듈
│       ├── index.ts                    # 메인 핸들러
│       ├── detector.ts                 # 프레임워크 감지
│       ├── scanner.ts                  # 전체 스캔
│       └── hoverOverlay.ts             # 피커 오버레이
├── components/
│   └── ComponentInspector/             # 신규 컴포넌트
│       ├── ComponentPanel.tsx          # 메인 패널
│       ├── ComponentItem.tsx           # 개별 아이템
│       ├── ComponentPicker.tsx         # 피커 모드 UI
│       └── ScanResult.tsx              # 스캔 결과
└── hooks/
    └── componentInspector/
        ├── useComponentScanner.ts      # 스캔 훅
        └── useComponentPicker.ts       # 피커 훅
```

---

## 3. 메시지 프로토콜

###新增 메시지 액션

```typescript
// src/constants/messages.ts

// 팔레트 통합
PALETTE_TOGGLE_PICKER: 'PALETTE_TOGGLE_PICKER',
PALETTE_ADD_COLOR: 'PALETTE_ADD_COLOR',

// 컴포넌트 인스펙터
COMPONENT_TOGGLE_PICKER: 'COMPONENT_TOGGLE_PICKER',
COMPONENT_SCAN: 'COMPONENT_SCAN',
COMPONENT_DATA: 'COMPONENT_DATA',
```

### 메시지 흐름

```
Side Panel                     Content Script
    │                               │
    │──PALETTE_TOGGLE_PICKER───────►│
    │                               │ (오버레이 활성화)
    │                               │
    │◄──PALETTE_ADD_COLOR──────────│ (클릭 시)
    │                               │
    │                               │
    │──COMPONENT_TOGGLE_PICKER─────►│
    │                               │ (오버레이 활성화)
    │                               │
    │◄──COMPONENT_DATA─────────────│ (클릭 시)
    │                               │
    │──COMPONENT_SCAN──────────────►│
    │                               │ (전체 스캔)
    │◄──COMPONENT_DATA─────────────│ (결과 반환)
```

---

## 4. 마이그레이션 계획

### Phase 1: 팔레트 통합

1. `colorPicker` 도구 삭제
2. `PalettePanel`에 피커 모드 추가
3. Content Script 핸들러 통합
4. 기존 `palette` 데이터와 호환성 유지

### Phase 2: 컴포넌트 인스펙터

1. 타입 정의
2. 프레임워크 감지기 구현
3. Content Script 모듈 추가
4. UI 컴포넌트 구현
5. 도구 등록

### Phase 3: 테스트 및 정리

1. 통합 테스트
2. 불필요한 코드 삭제
3. 문서 업데이트

---

## 5. 성능 고려사항

| 작업 | 예상 소요 시간 |
|------|---------------|
| 단일 요소 감지 | < 5ms |
| 전체 스캔 (1000개 요소) | 100-300ms |
| 피커 모드 오버레이 | < 16ms (60fps) |

### 최적화 전략

- IntersectionObserver로 화면 내 요소만 스캔
- 감지 결과 캐싱 (동일 요소 재스캔 방지)
- Web Worker 사용 고려 (대량 스캔 시)

---

## 승인

- **작성일**: 2026-02-28
- **승인자**: 사용자
- **상태**: 승인됨
