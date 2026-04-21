# Phase 1: shadcn 기본 컴포넌트 + 공통 UI

> Duration: 2일
> Prerequisite: [Phase 0 완료](./01-phase-0-infrastructure.md)
> Goal: shadcn/ui 컴포넌트 설치 및 공통 UI에 ThemeProvider 적용

## Overview

이 Phase에서는 shadcn/ui 기본 컴포넌트를 설치하고, App 컴포넌트에 ThemeProvider를 래핑합니다. 또한 Header, ToolRouter, SettingsPanel 등 공통 UI의 색상을 shadcn 테마 변수로 교체합니다.

## Steps

### Step 1-1: shadcn 컴포넌트 설치

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

**생성되는 파일:** `src/components/ui/` 디렉토리에 16개 컴포넌트

---

### Step 1-2: src/lib/theme-provider.tsx 생성

**파일:** `src/lib/theme-provider.tsx`

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

  // 시스템 다크모드 변경 감지
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Chrome Storage에서 테마 설정 로드
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

  // DOM에 테마 적용
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

---

### Step 1-3: src/sidepanel/App.tsx 수정

**적용 사항:**
1. ThemeProvider 래핑
2. 색상 클래스 교체
3. useTheme() 훅 사용

**색상 교체 규칙:**
```
bg-white          → bg-background  또는  bg-card
bg-gray-50        → bg-muted
text-gray-900     → text-foreground
text-gray-600     → text-muted-foreground
border-gray-200   → border-border
bg-blue-500       → bg-primary
hover:bg-blue-600 → hover:bg-primary/90
```

---

### Step 1-4: src/popup/App.tsx 수정

Sidepanel과 동일하게 ThemeProvider 래핑

---

### Step 1-5: Header 컴포넌트 색상 교체

**변경:**
- `bg-white` → `bg-card`
- `text-gray-*` → `text-foreground` / `text-muted-foreground`
- `border-gray-*` → `border-border`

---

### Step 1-6: ToolRouter Card화

**변경:**
- 도구 버튼 그리드를 `Card`로 래핑
- 선택된 도구 강조 색상을 `bg-primary`로 변경

---

### Step 1-7: SettingsPanel useTheme() 연동

**구현:**
```typescript
const { mode, accent, setMode, setAccent } = useTheme()

// Mode: Light / Dark / System (3버튼 그룹)
// Accent: Blue / Amber / Green / Violet / Rose (색상 원형 버튼)
```

**shadcn 컴포넌트 사용:**
- `<Select>` 또는 `<Switch>` for mode toggle
- 원형 색상 버튼 for accent selection

---

### Step 1-8: Sonner 토스트 시스템 적용

**설치된 컴포넌트:** `sonner`

**사용법:**
```typescript
import { toast } from 'sonner'

// Success
toast.success('저장되었습니다')

// Error
toast.error('오류가 발생했습니다')

// Info
toast.info('알림')
```

**ToastProvider 설정:**
```tsx
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <ThemeProvider>
      {/* ... */}
      <Toaster />
    </ThemeProvider>
  )
}
```

---

## 색상 교체 상세 규칙

| Before | After | 용도 |
|--------|-------|------|
| `bg-white` | `bg-background` 또는 `bg-card` | 배경 |
| `bg-gray-50` | `bg-muted` | 뮤트 배경 |
| `bg-gray-100` | `bg-muted` | 뮤트 배경 |
| `text-gray-900` | `text-foreground` | 기본 텍스트 |
| `text-gray-600` | `text-muted-foreground` | 뮤트 텍스트 |
| `text-gray-500` | `text-muted-foreground` | 뮤트 텍스트 |
| `text-gray-400` | `text-muted-foreground/60` | 플레이스홀더 |
| `border-gray-200` | `border-border` | 보더 |
| `bg-amber-50` | `bg-primary/10` (브랜드) 또는 `bg-warning/10` (경고) | 액센트 배경 |
| `text-amber-600` | `text-primary` (브랜드) 또는 `text-warning` (경고) | 액센트 텍스트 |
| `border-amber-500` | `border-primary` (브랜드) 또는 `border-warning` (경고) | 액센트 보더 |
| `bg-blue-500` | `bg-primary` | 기본 버튼 |
| `hover:bg-blue-600` | `hover:bg-primary/90` | 버튼 호버 |
| `text-red-500` | `text-destructive` | 에러/삭제 |
| `bg-gray-900` | `bg-card` (dark시 자동 반전) | 다크 카드 |

---

## Completion Criteria

- [ ] 16개 shadcn 컴포넌트 설치 완료
- [ ] ThemeProvider 생성 완료
- [ ] Sidepanel App.tsx에 ThemeProvider 래핑 완료
- [ ] Popup App.tsx에 ThemeProvider 래핑 완료
- [ ] Header 색상 교체 완료
- [ ] ToolRouter Card화 완료
- [ ] SettingsPanel useTheme() 연동 완료
- [ ] Sonner 토스트 시스템 적용 완료
- [ ] 빌드 성공 및 테마 전환 작동 확인

---

## Next Phase

[Phase 2: 단순 도구 패널](./03-phase-2-simple-panels.md)
