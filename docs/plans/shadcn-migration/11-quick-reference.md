# Quick Reference: shadcn/ui Migration

이 문서는 마이그레이션 중 자주 참고할 패턴과 코드 조각을 빠르게 찾기 위한 참조서입니다.

---

## 1. 색상 교체 매핑

| Before | After | 용도 |
|--------|-------|------|
| `bg-white` | `bg-background` 또는 `bg-card` | 배경 |
| `bg-gray-50` | `bg-muted` | 뮤트 배경 |
| `text-gray-900` | `text-foreground` | 기본 텍스트 |
| `text-gray-600` | `text-muted-foreground` | 뮤트 텍스트 |
| `border-gray-200` | `border-border` | 보더 |
| `bg-blue-500` | `bg-primary` | 기본 버튼 |
| `text-red-500` | `text-destructive` | 에러 |

---

## 2. 자주 쓰는 shadcn 컴포넌트 임포트

```tsx
// Button
import { Button } from "@/components/ui/button"

// Card
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Badge
import { Badge } from "@/components/ui/badge"

// Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Input
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Slider
import { Slider } from "@/components/ui/slider"

// Switch
import { Switch } from "@/components/ui/switch"

// Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ScrollArea
import { ScrollArea } from "@/components/ui/scroll-area"

// Accordion
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Checkbox
import { Checkbox } from "@/components/ui/checkbox"

// Table
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Separator
import { Separator } from "@/components/ui/separator"

// Toast (Sonner)
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

// Utilities
import { cn } from "@/lib/utils"
```

---

## 3. 기본 패턴

### Card + Button
```tsx
<Card>
  <CardContent className="p-4">
    <Button>클릭</Button>
  </CardContent>
</Card>
```

### Button Variants
```tsx
<Button>              // primary color
<Button variant="secondary">  // muted
<Button variant="outline">    // outlined
<Button variant="ghost">      // transparent
<Button variant="destructive"> // error
<Button variant="link">       // link style
```

### Badge Variants
```tsx
<Badge>              // primary
<Badge variant="secondary">  // muted
<Badge variant="outline">    // outlined
<Badge variant="destructive">// error
```

### Tabs
```tsx
<Tabs defaultValue="tab1" className="w-full">
  <TabsList>
    <TabsTrigger value="tab1">탭 1</TabsTrigger>
    <TabsTrigger value="tab2">탭 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* 내용 */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* 내용 */}
  </TabsContent>
</Tabs>
```

### Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명</DialogDescription>
    </DialogHeader>
    {/* 내용 */}
  </DialogContent>
</Dialog>
```

### Input + Label
```tsx
<div className="space-y-2">
  <Label htmlFor="input-id">레이블</Label>
  <Input id="input-id" placeholder="플레이스홀더" />
</div>
```

### Switch
```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="switch-id">레이블</Label>
  <Switch id="switch-id" />
</div>
```

### Select
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">옵션 1</SelectItem>
    <SelectItem value="option2">옵션 2</SelectItem>
  </SelectContent>
</Select>
```

### ScrollArea
```tsx
<ScrollArea className="h-[400px]">
  {/* 긴 내용 */}
</ScrollArea>
```

### Accordion
```tsx
<Accordion type="multiple" className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>제목</AccordionTrigger>
    <AccordionContent>
      {/* 내용 */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Checkbox
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="checkbox-id" />
  <Label htmlFor="checkbox-id">레이블</Label>
</div>
```

---

## 4. ThemeProvider 사용

```tsx
import { useTheme } from "@/lib/theme-provider"

function Component() {
  const { mode, accent, resolvedMode, setMode, setAccent } = useTheme()

  return (
    <div>
      <p>현재 모드: {mode}</p>
      <p>현재 액센트: {accent}</p>
      <p>해상 모드: {resolvedMode}</p>
      <button onClick={() => setMode('dark')}>다크모드</button>
      <button onClick={() => setAccent('amber')}>앰버</button>
    </div>
  )
}
```

---

## 5. Toast (Sonner)

```tsx
import { toast } from "sonner"

// Success
toast.success("성공했습니다")

// Error
toast.error("오류가 발생했습니다")

// Info
toast.info("알림")

// Custom
toast("메시지", {
  description: "설명",
  action: {
    label: "실행",
    onClick: () => console.log("clicked")
  }
})
```

---

## 6. cn() 유틸리티

```tsx
import { cn } from "@/lib/utils"

// 조건부 클래스
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class"
)} />

// className 병합 (충돌 해결)
<div className={cn("px-4 py-2", className)} />
```

---

## 7. 색상 변수 사용 (인라인 스타일)

```tsx
// CSS 변수 참조
<div style={{ color: 'hsl(var(--primary))' }}>
  Primary 색상 텍스트
</div>

// 직접 oklch 사용
<div style={{ backgroundColor: 'oklch(0.55 0.22 264)' }}>
  Blue 배경
</div>
```

---

## 8. Content Script 테마 감지

**파일:** `src/content/utils/detectTheme.ts` (Phase 5-1에서 생성)

```typescript
// 웹 페이지 배경 luminance 감지
export function detectPageTheme(): 'light' | 'dark' {
  const bgColor = window.getComputedStyle(document.body).backgroundColor
  const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return 'light'

  const [, r, g, b] = match.map(Number)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? 'light' : 'dark'
}

// 테마별 색상
export const getToastColors = (theme: 'light' | 'dark') => {
  return {
    background: theme === 'light' ? '#ffffff' : '#1a1a1a',
    foreground: theme === 'light' ? '#0a0a0a' : '#f5f5f5',
    border: theme === 'light' ? '#e5e5e5' : '#333333',
    primary: theme === 'light' ? '#3b82f6' : '#60a5fa',
  }
}
```

---

## 9. i18n (다국어)

### 기본 사용

```tsx
import { useTranslation } from 'react-i18next'

function Component() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('app.activeCount', { count: 5 })}</p>
      <button>{t('common.save')}</button>
    </div>
  )
}
```

### 언어 변경

```tsx
import { changeLanguage } from '@/i18n/react'

// 한국어로 변경
await changeLanguage('ko')

// 영어로 변경
await changeLanguage('en')
```

### 번역 키 구조

```
app.name → "KLIC-Tool"
tools.screenshot.name → "스크린샷"
tools.colorPicker.description → "색상 추출"
errors.captureFailed → "캡처에 실패했습니다"
settings.language.label → "언어"
```

### Content Script / Background

```typescript
import { t } from '@/i18n/core'

// 번역 함수
const message = await t('errors.captureFailed')
```

### i18n 명령어

```bash
# TypeScript 타입 생성
npm run i18n:generate

# 번역 동기화 확인
npm run i18n:check
```

---

## 10. 빌드 명령어

```bash
# 빌드
npm run build

# 타입 체크
tsc -b

# 개발 서버
npm run dev

# Lint
npm run lint
```

---

## 11. 문제 해결

### FOUC (Flash of Unstyled Content)
- 원인: storage 로딩 지연
- 해결: `theme-init.js` + ready state 로딩 가드

### Modal/Dialog가 닫히지 않음
- 원인: Dialog open state 미관리
- 해결: `open`, `onOpenChange` prop 사용

### 색상이 적용되지 않음
- 원인: CSS 변수 누락
- 해결: `src/index.css`에 변수 정의 확인

### Chrome Extension에서 스타일 로드 안 됨
- 원인: MV3 CSP 위반 (인라인 스크립트)
- 해결: 외부 파일(`theme-init.js`)로 분리

---

## 12. 유용한 링크

- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [OKLCH Color Picker](https://oklch.com)
- [Chrome Extension MV3](https://developer.chrome.com/docs/extensions/mv3/)
- [react-i18next](https://react.i18next.com/)


- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [OKLCH Color Picker](https://oklch.com)
- [Chrome Extension MV3](https://developer.chrome.com/docs/extensions/mv3/)
