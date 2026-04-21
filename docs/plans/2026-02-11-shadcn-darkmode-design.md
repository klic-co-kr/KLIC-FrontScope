# shadcn/ui + Dark Mode + Multi-Theme Migration Design

> Date: 2026-02-11
> Status: Approved
> Scope: 94 components full migration

## Overview

KLIC-Tool Chrome Extension에 shadcn/ui 컴포넌트 시스템과 Light/Dark/System 모드, 멀티 액센트 테마를 도입한다. 기본 액센트는 Blue.

### Requirements

- shadcn/ui 전체 마이그레이션 (94 컴포넌트)
- Dark mode: System 기본 (light/dark/system 선택 가능)
- Multi accent theme: blue(기본), amber, green, violet, rose
- Tailwind CSS v4 공식 패턴 (`@theme inline`, oklch, CSS-first config)
- Chrome Storage 기반 테마 저장/복원

---

## 1. CSS 기반 구조 (Tailwind v4)

### `src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ===== Light Mode ===== */
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.15 0.01 275);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.01 275);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.01 275);
  /* primary/primary-foreground/ring은 data-theme에서만 정의 (blue 포함) */
  --secondary: oklch(0.96 0.01 275);
  --secondary-foreground: oklch(0.21 0.01 275);
  --muted: oklch(0.96 0.01 275);
  --muted-foreground: oklch(0.50 0.01 275);
  --accent: oklch(0.96 0.01 275);
  --accent-foreground: oklch(0.21 0.01 275);
  --destructive: oklch(0.65 0.24 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.90 0.01 275);
  --input: oklch(0.90 0.01 275);
  --ring: oklch(0.55 0.22 264);
  --radius: 0.625rem;

  /* Sidebar */
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.15 0.01 275);
  --sidebar-primary: oklch(0.15 0.01 275);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.96 0.01 275);
  --sidebar-accent-foreground: oklch(0.21 0.01 275);
  --sidebar-border: oklch(0.90 0.01 275);
  --sidebar-ring: oklch(0.55 0.22 264);

  /* Chart (데이터 시각화용) */
  --chart-1: oklch(0.65 0.24 25);
  --chart-2: oklch(0.70 0.19 149);
  --chart-3: oklch(0.60 0.22 264);
  --chart-4: oklch(0.70 0.18 70);
  --chart-5: oklch(0.65 0.25 320);
}

/* ===== Dark Mode ===== */
.dark {
  --background: oklch(0.15 0.01 275);
  --foreground: oklch(0.98 0 0);
  --card: oklch(0.19 0.01 275);
  --card-foreground: oklch(0.98 0 0);
  --popover: oklch(0.19 0.01 275);
  --popover-foreground: oklch(0.98 0 0);
  /* primary/primary-foreground/ring은 data-theme에서만 정의 (blue 포함) */
  --secondary: oklch(0.25 0.01 275);
  --secondary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.25 0.01 275);
  --muted-foreground: oklch(0.65 0.01 275);
  --accent: oklch(0.25 0.01 275);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.60 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.25 0.01 275);
  --input: oklch(0.25 0.01 275);
  --ring: oklch(0.65 0.24 264);

  /* Sidebar */
  --sidebar: oklch(0.19 0.01 275);
  --sidebar-foreground: oklch(0.98 0 0);
  --sidebar-primary: oklch(0.98 0 0);
  --sidebar-primary-foreground: oklch(0.15 0.01 275);
  --sidebar-accent: oklch(0.25 0.01 275);
  --sidebar-accent-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(0.25 0.01 275);
  --sidebar-ring: oklch(0.65 0.24 264);

  /* Chart (다크모드용 밝은 파스텔) */
  --chart-1: oklch(0.75 0.20 25);
  --chart-2: oklch(0.78 0.17 149);
  --chart-3: oklch(0.72 0.20 264);
  --chart-4: oklch(0.78 0.15 70);
  --chart-5: oklch(0.75 0.22 320);
}

/* ===== Semantic Colors (accent 불변) ===== */
:root {
  --warning: oklch(0.769 0.188 70.08);
  --warning-foreground: oklch(0.205 0 0);
  --success: oklch(0.627 0.194 149);
  --success-foreground: oklch(0.985 0 0);
  --info: oklch(0.623 0.214 259);
  --info-foreground: oklch(0.985 0 0);
}
.dark {
  --warning: oklch(0.82 0.16 70.08);
  --warning-foreground: oklch(0.145 0 0);
  --success: oklch(0.72 0.17 149);
  --success-foreground: oklch(0.145 0 0);
  --info: oklch(0.72 0.19 259);
  --info-foreground: oklch(0.145 0 0);
}

/* ===== Multi Accent Themes (Light) ===== */
[data-theme="blue"]   { --primary: oklch(0.55 0.22 264);     --primary-foreground: oklch(0.98 0 0);  --ring: oklch(0.55 0.22 264); }
[data-theme="amber"]  { --primary: oklch(0.70 0.19 70);      --primary-foreground: oklch(0.20 0 0);   --ring: oklch(0.70 0.19 70); }
[data-theme="green"]  { --primary: oklch(0.58 0.19 149);     --primary-foreground: oklch(0.98 0 0);  --ring: oklch(0.58 0.19 149); }
[data-theme="violet"] { --primary: oklch(0.56 0.24 292);     --primary-foreground: oklch(0.98 0 0);  --ring: oklch(0.56 0.24 292); }
[data-theme="rose"]   { --primary: oklch(0.60 0.23 16);      --primary-foreground: oklch(0.98 0 0);  --ring: oklch(0.60 0.23 16); }

/* ===== Multi Accent Themes (Dark) ===== */
.dark[data-theme="blue"]   { --primary: oklch(0.65 0.24 264);     --primary-foreground: oklch(0.15 0.01 275);  --ring: oklch(0.65 0.24 264); }
.dark[data-theme="amber"]  { --primary: oklch(0.75 0.17 70);      --primary-foreground: oklch(0.15 0.01 275);  --ring: oklch(0.75 0.17 70); }
.dark[data-theme="green"]  { --primary: oklch(0.68 0.18 149);     --primary-foreground: oklch(0.15 0.01 275);  --ring: oklch(0.68 0.18 149); }
.dark[data-theme="violet"] { --primary: oklch(0.66 0.23 292);     --primary-foreground: oklch(0.15 0.01 275);  --ring: oklch(0.66 0.23 292); }
.dark[data-theme="rose"]   { --primary: oklch(0.70 0.22 16);      --primary-foreground: oklch(0.15 0.01 275);  --ring: oklch(0.70 0.22 16); }

/* ===== Tailwind v4: @theme inline ===== */
@theme inline {
  /* Core colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Sidebar */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Semantic colors (accent 불변) */
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  /* Chart */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* ===== Base Styles ===== */
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

---

## 2. 의존성 + 프로젝트 설정

### 패키지 설치

```bash
npm i class-variance-authority clsx tailwind-merge
npm i -D tw-animate-css
```

이미 설치됨: `lucide-react`, `tailwindcss`, `react 19`, `framer-motion`

### `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 디렉토리 구조

```
src/
├── components/
│   ├── ui/              ← shadcn 컴포넌트 (Button, Card, Dialog 등)
│   ├── AssetManager/    ← 기존 도구 (shadcn ui/ 사용)
│   ├── GridLayout/
│   └── ...
├── lib/
│   ├── utils.ts         ← cn()
│   └── theme-provider.tsx ← ThemeProvider
└── index.css            ← 테마 변수 + @theme inline

public/
└── theme-init.js        ← FOUC 방지 (MV3 CSP 준수, 인라인 스크립트 불가)
```

---

## 3. ThemeProvider (Chrome Extension용)

### `src/lib/theme-provider.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'

type Mode = 'light' | 'dark' | 'system'
type Accent = 'blue' | 'amber' | 'green' | 'violet' | 'rose'

interface ThemeContext {
  mode: Mode
  accent: Accent
  resolvedMode: 'light' | 'dark'
  setMode: (mode: Mode) => void
  setAccent: (accent: Accent) => void
}

const ThemeCtx = createContext<ThemeContext | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('system')
  const [accent, setAccentState] = useState<Accent>('blue')
  const [ready, setReady] = useState(false)
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    chrome.storage.local.get(['theme:mode', 'theme:accent'], (result) => {
      if (result['theme:mode']) setModeState(result['theme:mode'])
      if (result['theme:accent']) setAccentState(result['theme:accent'])
      setReady(true)
    })
  }, [])

  // 멀티 컨텍스트 동기화: 다른 컨텍스트(예: popup)에서 테마 변경 시 반영
  useEffect(() => {
    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes['theme:mode']?.newValue !== undefined) {
        setModeState(changes['theme:mode'].newValue)
      }
      if (changes['theme:accent']?.newValue !== undefined) {
        setAccentState(changes['theme:accent'].newValue)
      }
    }
    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }, [])

  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedMode === 'dark')
    root.setAttribute('data-theme', accent)
  }, [resolvedMode, accent])

  const setMode = (m: Mode) => {
    setModeState(m)
    chrome.storage.local.set({ 'theme:mode': m })
  }

  const setAccent = (a: Accent) => {
    setAccentState(a)
    chrome.storage.local.set({ 'theme:accent': a })
  }

  // FOUC 방지: storage 로딩 완료 전까지 children 렌더링 차단
  if (!ready) return null

  return (
    <ThemeCtx.Provider value={{ mode, accent, resolvedMode, setMode, setAccent }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

### FOUC 방지: 외부 스크립트 (Chrome MV3 CSP 준수)

> **Important:** Chrome Extension Manifest V3는 인라인 `<script>` 실행을 금지합니다. 별도 파일로 분리해야 합니다.

`public/theme-init.js` 생성:

```js
// public/theme-init.js
chrome.storage.local.get(['theme:mode', 'theme:accent'], (r) => {
  const mode = r['theme:mode'] || 'system';
  const accent = r['theme:accent'] || 'blue';
  const dark = mode === 'system'
    ? matchMedia('(prefers-color-scheme:dark)').matches
    : mode === 'dark';
  if (dark) document.documentElement.classList.add('dark');
  // 모든 액센트(blue 포함)는 data-theme 설정 (blue도 명시적)
  document.documentElement.setAttribute('data-theme', accent);
});
```

`sidepanel.html`, `index.html`의 `<head>`에 추가:

```html
<script src="theme-init.js"></script>
```

> **Note:** Blue도 `data-theme="blue"`로 명시합니다. `:root`에는 primary가 없고 모든 액센트는 `[data-theme]`에서 정의되기 때문입니다.

### 적용

```tsx
// src/sidepanel/App.tsx + src/popup/App.tsx (동일하게 적용)
<ThemeProvider>
  <ErrorBoundary>
    <ToastProvider>
      <div className="w-full h-screen bg-background text-foreground ...">
```

### SettingsPanel 연동

```tsx
const { mode, accent, setMode, setAccent } = useTheme()
// Mode: Light / Dark / System (3버튼)
// Accent: Blue / Amber / Green / Violet / Rose (색상 원형 버튼)
```

---

## 4. 컴포넌트 마이그레이션 맵

### shadcn 컴포넌트 설치

```bash
# Phase 1: 기본 프리미티브
npx shadcn@latest add button card badge tabs toggle switch
npx shadcn@latest add input label select slider checkbox

# Phase 2: 레이아웃/피드백
npx shadcn@latest add dialog tooltip popover dropdown-menu
npx shadcn@latest add scroll-area separator skeleton

# Phase 3: 도구 전용
npx shadcn@latest add collapsible accordion sheet sonner
```

### 현재 → shadcn 매핑

| 현재 패턴 | shadcn 교체 | 사용 위치 |
|-----------|------------|-----------|
| `<button className="bg-blue-500 ...">` | `<Button variant="default">` | 전체 |
| `<div className="bg-white rounded-xl border ...">` | `<Card>` + `<CardContent>` | ToolRouter 패널 |
| `<span className="bg-gray-200 px-2 ...">` | `<Badge variant="secondary">` | FontAnalyzer, GridLayout |
| 커스텀 탭 버튼 | `<Tabs>` + `<TabsList>` + `<TabsTrigger>` | GridLayout, ResourceNetwork |
| `<input className="border ...">` | `<Input>` | Settings, GridLayout |
| `<select>` 직접 구현 | `<Select>` | ViewportPanel, SettingsPanel |
| `showToast()` DOM 직접 생성 | Sonner (`toast()`) | sidepanel만 |
| 커스텀 토글 | `<Switch>` | Settings, GridLayout |
| 커스텀 슬라이더 | `<Slider>` | Screenshot, GridLayout |
| framer-motion 모달 | `<Dialog>` | Settings, Screenshot Editor |

### 색상 클래스 교체 규칙

```
bg-white          → bg-background  또는  bg-card
bg-gray-50        → bg-muted
bg-gray-100       → bg-muted
text-gray-900     → text-foreground
text-gray-600     → text-muted-foreground
text-gray-500     → text-muted-foreground
text-gray-400     → text-muted-foreground/60
border-gray-200   → border-border
bg-amber-50       → 용도에 따라 분기:
                      브랜드/액센트 용도 → bg-primary/10
                      경고(warning) 용도 → bg-warning/10
text-amber-600    → 브랜드 용도 → text-primary
                     경고 용도 → text-warning
border-amber-500  → 브랜드 용도 → border-primary
                     경고 용도 → border-warning
bg-blue-500       → bg-primary
hover:bg-blue-600 → hover:bg-primary/90
text-red-500      → text-destructive
bg-gray-900       → bg-card (dark시 자동 반전)
```

### 마이그레이션 순서

```
1. 공통 (App.tsx, ToolRouter, SettingsPanel, Header)
2. 단순 패널 (TextEdit, Screenshot, ColorPicker, CssScan, Ruler)
3. 복합 패널 (FontAnalyzer, Palette, Console, Assets)
4. 탭 기반 복합 (GridLayout 5탭, ResourceNetwork 4탭)
5. TailwindScanner
6. Content script 토스트/오버레이 (별도):
   - CSS 변수 미적용 (확장 프로그램 CSS와 격리됨)
   - 인라인 스타일 유지, 웹 페이지 배경 luminance 감지로 light/dark 분기
   - `getComputedStyle(document.body).backgroundColor` → oklch lightness 계산
```

---

## 5. 구현 Phase

### Phase 0: 인프라 셋업 (1일)

| # | 작업 | 파일 |
|---|------|------|
| 0-1 | 패키지 설치 (clsx, tailwind-merge, cva, tw-animate-css) | `package.json` |
| 0-2 | `components.json` 생성 | 루트 |
| 0-3 | `src/lib/utils.ts` (cn 유틸리티) 생성 | 신규 |
| 0-4 | `src/index.css` 전면 교체 (CSS 변수 + @theme inline) | 기존 |
| 0-5 | `src/lib/theme-provider.tsx` 생성 | 신규 |
| 0-6 | `public/theme-init.js` 생성 + `sidepanel.html`, `index.html`에 `<script src="theme-init.js"></script>` 추가 | 신규 + 기존 |
| 0-7 | 빌드 확인 (기존 UI 깨지지 않는지) | - |

### Phase 1: shadcn 기본 컴포넌트 + 공통 UI (2일)

| # | 작업 | 영향 |
|---|------|------|
| 1-1 | `npx shadcn@latest add` (16개 컴포넌트) | `src/components/ui/` |
| 1-2 | App.tsx: ThemeProvider 래핑 + 색상 클래스 교체 + `chrome.storage.onChanged` 리스너 | 1파일 |
| 1-3 | Header: bg-white → bg-card, text-gray → text-foreground | App.tsx |
| 1-4 | ToolRouter: 도구 버튼 그리드 Card화 + 색상 교체 | 1파일 |
| 1-5 | SettingsPanel: useTheme() 연동 + shadcn Select/Switch | 1파일 |
| 1-6 | Toast 시스템: Sonner 적용 (sidepanel) | ToastProvider |

### Phase 2: 단순 도구 패널 (2일)

| # | 도구 | 컴포넌트 수 | 핵심 변환 |
|---|------|------------|-----------|
| 2-1 | TextEdit | 1 | Card + Button |
| 2-2 | Screenshot | 3 | Card + Dialog + Slider |
| 2-3 | ColorPicker | 1 | Card + Button + Badge |
| 2-4 | CssScan | 4 | Card + Tabs + Badge |
| 2-5 | Ruler | 1 | Card + Button |

### Phase 3: 복합 도구 패널 (2일)

| # | 도구 | 컴포넌트 수 | 핵심 변환 |
|---|------|------------|-----------|
| 3-1 | FontAnalyzer | 4 | Card + Badge + Accordion |
| 3-2 | Palette + Console | 4 | Card + ScrollArea + Badge |
| 3-3 | AssetManager | 2 | Card + Button + Checkbox |

### Phase 4: 탭 기반 복합 도구 (3일)

| # | 도구 | 컴포넌트 수 | 핵심 변환 |
|---|------|------------|-----------|
| 4-1 | GridLayout | 8 | Tabs + Card + Slider + Input |
| 4-2 | ResourceNetwork | 5 | Tabs + Card + Badge + ScrollArea |
| 4-3 | TailwindScanner | 3 | Tabs + Card + Badge |

### Phase 5: 마무리 (1일)

| # | 작업 |
|---|------|
| 5-1 | Content script 토스트/오버레이: 인라인 스타일 유지, 웹 페이지 배경색 감지(`getComputedStyle(document.body)` luminance 기반)로 light/dark 분기 |
| 5-2 | Popup(`index.html`) ThemeProvider 래핑 + `theme-init.js` 적용 |
| 5-3 | 전체 빌드 + 다크/라이트 모드 전환 테스트 |
| 5-4 | 5가지 액센트 테마 전환 테스트 (amber 대비 검증 포함) |
| 5-5 | CLAUDE.md 업데이트 (테마 시스템 문서화) |

**총 예상: 11일**

---

## References

- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual)
- [shadcn/app-tailwind-v4 Reference Repo](https://github.com/shadcn/app-tailwind-v4)
