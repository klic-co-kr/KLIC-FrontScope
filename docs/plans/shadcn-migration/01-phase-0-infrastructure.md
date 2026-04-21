# Phase 0: 인프라 셋업

> Duration: 1일
> Goal: shadcn/ui 기반 테마 시스템 인프라 구축

## Overview

이 Phase에서는 shadcn/ui를 프로젝트에 통합하기 위한 기반 작업을 수행합니다. CSS 변수, ThemeProvider, FOUC 방지 스크립트 등 핵심 인프라를 구축합니다.

## Steps

### Step 0-1: Feature Branch 생성

```bash
git checkout -b feature/shadcn-migration
git status
```

**Expected:** 새 브랜치 생성, clean working directory

---

### Step 0-2: 패키지 설치

```bash
npm i class-variance-authority clsx tailwind-merge
npm i -D tw-animate-css
```

**설치되는 패키지:**
- `class-variance-authority`: 컴포넌트 변형 관리
- `clsx`: 클래스 이름 조합
- `tailwind-merge`: Tailwind 클래스 충돌 해결
- `tw-animate-css`: Tailwind 애니메이션

**확인:**
```bash
grep -E "class-variance-authority|clsx|tailwind-merge|tw-animate-css" package.json
```

---

### Step 0-3: components.json 생성

```bash
npx shadcn@latest init
```

**설정 값:**
```
style: new-york
rsc: false
tsx: true
tailwind.cssVariables: true
baseColor: neutral
```

**생성되는 파일:**
- `components.json` (루트)

---

### Step 0-4: public/theme-init.js 생성

> **Important:** Chrome MV3 CSP는 인라인 `<script>`를 금지합니다. 별도 파일로 분리해야 합니다.

**파일:** `public/theme-init.js`

```javascript
// public/theme-init.js
// FOUC 방지: React 마운트 전 테마 적용
chrome.storage.local.get(['theme:mode', 'theme:accent'], (r) => {
  const mode = r['theme:mode'] || 'system';
  const accent = r['theme:accent'] || 'blue';
  const dark = mode === 'system'
    ? matchMedia('(prefers-color-scheme:dark)').matches
    : mode === 'dark';
  if (dark) document.documentElement.classList.add('dark');
  // 모든 액센트(blue 포함)는 data-theme 설정
  document.documentElement.setAttribute('data-theme', accent);
});
```

---

### Step 0-5: src/lib/utils.ts 생성

**파일:** `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### Step 0-6: src/index.css 전면 교체

**파일:** `src/index.css`

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
  /* primary/primary-foreground/ring은 data-theme에서만 정의 */
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

  /* Chart */
  --chart-1: oklch(0.65 0.24 25);
  --chart-2: oklch(0.70 0.19 149);
  --chart-3: oklch(0.60 0.22 264);
  --chart-4: oklch(0.70 0.18 70);
  --chart-5: oklch(0.65 0.25 320);

  /* Semantic Colors */
  --warning: oklch(0.769 0.188 70.08);
  --warning-foreground: oklch(0.205 0 0);
  --success: oklch(0.627 0.194 149);
  --success-foreground: oklch(0.985 0 0);
  --info: oklch(0.623 0.214 259);
  --info-foreground: oklch(0.985 0 0);
}

/* ===== Dark Mode ===== */
.dark {
  --background: oklch(0.15 0.01 275);
  --foreground: oklch(0.98 0 0);
  --card: oklch(0.19 0.01 275);
  --card-foreground: oklch(0.98 0 0);
  --popover: oklch(0.19 0.01 275);
  --popover-foreground: oklch(0.98 0 0);
  /* primary/primary-foreground/ring은 data-theme에서만 정의 */
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

  /* Chart */
  --chart-1: oklch(0.75 0.20 25);
  --chart-2: oklch(0.78 0.17 149);
  --chart-3: oklch(0.72 0.20 264);
  --chart-4: oklch(0.78 0.15 70);
  --chart-5: oklch(0.75 0.22 320);

  /* Semantic Colors */
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
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
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

### Step 0-7: sidepanel.html, index.html에 script 추가

**파일:** `sidepanel.html`, `index.html`

`</head>` 태그 닫기 전에 추가:
```html
<script src="theme-init.js"></script>
```

> **Note:** `public/theme-init.js`에 생성된 파일은 Vite 빌드 시 `dist/` 루트로 자동 복사됩니다. 확장 프로그램에서는 `/theme-init.js` 경로로 접근 가능합니다.

---

### Step 0-8: 빌드 확인

```bash
npm run build
```

**확인사항:**
- [ ] 빌드 성공
- [ ] 기존 UI가 깨지지 않음
- [ ] 콘솔 에러 없음

**문제 발생 시:**
- CSS 변수 누락 확인
- 경로 확인 (theme-init.js)
- 즉시 수정 후 재빌드

---

## Completion Criteria

- [ ] `public/theme-init.js` 생성 완료
- [ ] `src/lib/utils.ts` 생성 완료
- [ ] `src/index.css` 교체 완료
- [ ] `sidepanel.html`, `index.html`에 script 추가 완료
- [ ] 빌드 성공 및 기존 UI 정상 작동

---

## Next Phase

[Phase 1: shadcn 기본 컴포넌트 + 공통 UI](./02-phase-1-foundation.md)
