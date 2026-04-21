# Phase 2: 단순 도구 패널

> Duration: 2일
> Prerequisite: [Phase 1 완료](./02-phase-1-foundation.md)
> Goal: 단순 구조의 도구 패널 5개를 shadcn/ui로 마이그레이션

## Overview

이 Phase에서는 구조가 단순한 도구 패널들을 shadcn/ui 컴포넌트로 교체합니다. 각 패널은 1~3개의 주요 shadcn 컴포넌트를 사용합니다.

## Target Panels

| # | 도구 | 컴포넌트 수 | 핵심 shadcn 컴포넌트 | 예상 시간 |
|---|------|------------|---------------------|----------|
| 2-1 | TextEdit | 1 | Card, Button | 2시간 |
| 2-2 | Screenshot | 3 | Card, Dialog, Slider | 4시간 |
| 2-3 | ColorPicker | 1 | Card, Button, Badge | 2시간 |
| 2-4 | CssScan | 4 | Card, Tabs, Badge | 4시간 |
| 2-5 | Ruler | 1 | Card, Button | 2시간 |

**총 예상: 14시간 (약 2일)**

---

## Step 2-1: TextEdit

**파일:** `src/sidepanel/components/TextEdit/`

### shadcn 컴포넌트
- `<Card>`
- `<CardContent>`
- `<Button>`

### 변경 사항
```tsx
// Before
<div className="bg-white rounded-xl border border-gray-200 p-4">
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    복사
  </button>
</div>

// After
<Card>
  <CardContent className="p-4">
    <Button>복사</Button>
  </CardContent>
</Card>
```

### 확인사항
- [ ] 버튼 클릭 작동
- [ ] 텍스트 영역 정상 표시
- [ ] 다크모드 색상 정상

---

## Step 2-2: Screenshot

**파일:** `src/sidepanel/components/Screenshot/`

### shadcn 컴포넌트
- `<Card>`
- `<CardContent>`
- `<Dialog>`
- `<Slider>`

### 변경 사항

#### 1. 캡처 영역 Card화
```tsx
<Card>
  <CardContent>
    {/* 캡처 미리보기 */}
  </CardContent>
</Card>
```

#### 2. 설정 Dialog 적용
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">설정</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>스크린샷 설정</DialogTitle>
      <DialogDescription>
        캡처 옵션을 설정합니다.
      </DialogDescription>
    </DialogHeader>
    {/* 설정 폼 */}
  </DialogContent>
</Dialog>
```

#### 3. 품질 Slider 적용
```tsx
import { Slider } from "@/components/ui/slider"

<Slider
  value={[quality]}
  onValueChange={(value) => setQuality(value[0])}
  min={1}
  max={100}
  step={1}
/>
```

### 확인사항
- [ ] 캡처 기능 작동
- [ ] Dialog 열기/닫기
- [ ] Slider 조작 시 값 변경
- [ ] 다크모드 색상 정상

---

## Step 2-3: ColorPicker

**파일:** `src/sidepanel/components/ColorPicker/`

### shadcn 컴포넌트
- `<Card>`
- `<CardContent>`
- `<Button>`
- `<Badge>`

### 변경 사항

#### 1. 패널 Card화
```tsx
<Card>
  <CardContent className="p-4">
    {/* 컬러 피커 UI */}
  </CardContent>
</Card>
```

#### 2. 선택된 색상 Badge 표시
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="secondary">
  {selectedColor}
</Badge>
```

### 확인사항
- [ ] 색상 선택 작동
- [ ] Badge 표시 정상
- [ ] 다크모드 색상 정상

---

## Step 2-4: CssScan

**파일:** `src/sidepanel/components/CssScan/`

### shadcn 컴포넌트
- `<Card>`
- `<Tabs>`
- `<TabsList>`
- `<TabsTrigger>`
- `<TabsContent>`
- `<Badge>`

### 변경 사항

#### 1. Tabs 적용
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="properties" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="properties">속성</TabsTrigger>
    <TabsTrigger value="styles">스타일</TabsTrigger>
    <TabsTrigger value="colors">색상</TabsTrigger>
  </TabsList>
  <TabsContent value="properties">
    {/* 속성 내용 */}
  </TabsContent>
  <TabsContent value="styles">
    {/* 스타일 내용 */}
  </TabsContent>
  <TabsContent value="colors">
    {/* 색상 내용 */}
  </TabsContent>
</Tabs>
```

#### 2. 스캔 결과 Badge 표시
```tsx
<Badge>{property.name}</Badge>
```

### 확인사항
- [ ] 탭 전환 작동
- [ ] CSS 스캔 기능 작동
- [ ] Badge 표시 정상
- [ ] 다크모드 색상 정상

---

## Step 2-5: Ruler

**파일:** `src/sidepanel/components/Ruler/`

### shadcn 컴포넌트
- `<Card>`
- `<CardContent>`
- `<Button>`

### 변경 사항
```tsx
<Card>
  <CardContent className="p-4">
    <div className="flex justify-between items-center">
      <span>거리: {distance}px</span>
      <Button variant="outline" size="sm">재설정</Button>
    </div>
  </CardContent>
</Card>
```

### 확인사항
- [ ] 측정 기능 작동
- [ ] 버튼 클릭 작동
- [ ] 다크모드 색상 정상

---

## 공통 변경 패턴

### 1. 컨테이너 교체
```tsx
// Before
<div className="bg-white rounded-xl border border-gray-200 p-4">
  {/* 내용 */}
</div>

// After
<Card>
  <CardContent className="p-4">
    {/* 내용 */}
  </CardContent>
</Card>
```

### 2. 버튼 교체
```tsx
// Before
<button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
  클릭
</button>

// After
import { Button } from "@/components/ui/button"

<Button>클릭</Button>
```

### 3. 뱃지 교체
```tsx
// Before
<span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
  라벨
</span>

// After
import { Badge } from "@/components/ui/badge"

<Badge variant="secondary">라벨</Badge>
```

---

## Completion Criteria

- [ ] TextEdit: shadcn Card, Button 적용 완료
- [ ] Screenshot: shadcn Card, Dialog, Slider 적용 완료
- [ ] ColorPicker: shadcn Card, Button, Badge 적용 완료
- [ ] CssScan: shadcn Card, Tabs, Badge 적용 완료
- [ ] Ruler: shadcn Card, Button 적용 완료
- [ ] 모든 패널 다크모드 대응 완료
- [ ] 빌드 성공

---

## Next Phase

[Phase 3: 복합 도구 패널](./04-phase-3-complex-panels.md)
