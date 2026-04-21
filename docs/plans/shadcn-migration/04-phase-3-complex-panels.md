# Phase 3: 복합 도구 패널

> Duration: 2일
> Prerequisite: [Phase 2 완료](./03-phase-2-simple-panels.md)
> Goal: 복합 구조의 도구 패널 4개를 shadcn/ui로 마이그레이션

## Overview

이 Phase에서는 더 복잡한 구조를 가진 도구 패널들을 shadcn/ui 컴포넌트로 교체합니다. ScrollArea, Accordion, Checkbox 등 추가 컴포넌트가 사용됩니다.

## Target Panels

| # | 도구 | 컴포넌트 수 | 핵심 shadcn 컴포넌트 | 예상 시간 |
|---|------|------------|---------------------|----------|
| 3-1 | FontAnalyzer | 4 | Card, Badge, Accordion | 3시간 |
| 3-2 | Palette | 4 | Card, ScrollArea, Badge | 3시간 |
| 3-3 | Console | 4 | Card, ScrollArea, Badge | 3시간 |
| 3-4 | AssetManager | 2 | Card, Button, Checkbox | 3시간 |

**총 예상: 12시간 (약 2일)**

---

## Step 3-1: FontAnalyzer

**파일:** `src/sidepanel/components/FontAnalyzer/`

### shadcn 컴포넌트
- `<Card>`
- `<Accordion>`
- `<AccordionItem>`
- `<AccordionTrigger>`
- `<AccordionContent>`
- `<Badge>`
- `<ScrollArea>`

### 변경 사항

#### 1. 폰트 목록 Accordion 적용
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

<Accordion type="multiple" className="w-full">
  {fonts.map(font => (
    <AccordionItem key={font.family} value={font.family}>
      <AccordionTrigger>{font.family}</AccordionTrigger>
      <AccordionContent>
        {/* 폰트 상세 정보 */}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

#### 2. 폰트 속성 Badge 표시
```tsx
<div className="flex gap-2 flex-wrap">
  <Badge>{font.weight}</Badge>
  <Badge variant="secondary">{font.style}</Badge>
  <Badge variant="outline">{font.size}</Badge>
</div>
```

#### 3. 긴 목록 ScrollArea 적용
```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="h-[400px]">
  {/* 폰트 목록 */}
</ScrollArea>
```

### 확인사항
- [ ] 폰트 스캔 기능 작동
- [ ] Accordion 열기/닫기
- [ ] ScrollArea 스크롤 작동
- [ ] 다크모드 색상 정상

---

## Step 3-2: Palette

**파일:** `src/sidepanel/components/Palette/`

### shadcn 컴포넌트
- `<Card>`
- `<ScrollArea>`
- `<Badge>`
- `<Button>`

### 변경 사항

#### 1. 컬러 그리드 ScrollArea 적용
```tsx
<ScrollArea className="h-[500px]">
  <div className="grid grid-cols-2 gap-4 p-4">
    {colors.map(color => (
      <Card key={color.hex}>
        <CardContent className="p-4">
          {/* 컬러 미리보기 */}
          <div
            className="w-full h-20 rounded"
            style={{ backgroundColor: color.hex }}
          />
          <div className="mt-2">
            <Badge>{color.hex}</Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {color.name}
            </p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</ScrollArea>
```

#### 2. 컬러 복사 Button
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => copyToClipboard(color.hex)}
>
  복사
</Button>
```

### 확인사항
- [ ] 컬러 추출 기능 작동
- [ ] ScrollArea 스크롤 작동
- [ ] 복사 버튼 작동
- [ ] 다크모드 색상 정상

---

## Step 3-3: Console

**파일:** `src/sidepanel/components/Console/`

### shadcn 컴포넌트
- `<Card>`
- `<ScrollArea>`
- `<Badge>`
- `<Separator>`

### 변경 사항

#### 1. 콘솔 로그 ScrollArea 적용
```tsx
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

<ScrollArea className="h-[400px] p-4">
  {logs.map((log, index) => (
    <div key={index}>
      <div className="flex items-start gap-2">
        <Badge variant={log.type === 'error' ? 'destructive' : 'secondary'}>
          {log.type}
        </Badge>
        <span className="text-sm">{log.message}</span>
      </div>
      {index < logs.length - 1 && <Separator className="my-2" />}
    </div>
  ))}
</ScrollArea>
```

#### 2. 로그 타입별 Badge 스타일
```tsx
const getBadgeVariant = (type: string) => {
  switch (type) {
    case 'error': return 'destructive'
    case 'warn': return 'secondary'
    case 'info': return 'outline'
    default: return 'secondary'
  }
}

<Badge variant={getBadgeVariant(log.type)}>
  {log.type}
</Badge>
```

### 확인사항
- [ ] 콘솔 로그 수신 기능 작동
- [ ] ScrollArea 스크롤 작동
- [ ] 로그 타입별 Badge 표시
- [ ] 다크모드 색상 정상

---

## Step 3-4: AssetManager

**파일:** `src/sidepanel/components/AssetManager/`

### shadcn 컴포넌트
- `<Card>`
- `<CardContent>`
- `<Button>`
- `<Checkbox>`
- `<Badge>`

### 변경 사항

#### 1. 에셋 목록 Card
```tsx
<Card>
  <CardContent className="p-4">
    {/* 에셋 목록 */}
  </CardContent>
</Card>
```

#### 2. 다중 선택 Checkbox
```tsx
import { Checkbox } from "@/components/ui/checkbox"

<div className="flex items-center space-x-2">
  <Checkbox
    id={asset.id}
    checked={selectedAssets.includes(asset.id)}
    onCheckedChange={(checked) => {
      if (checked) {
        setSelectedAssets([...selectedAssets, asset.id])
      } else {
        setSelectedAssets(selectedAssets.filter(id => id !== asset.id))
      }
    }}
  />
  <label htmlFor={asset.id} className="text-sm">
    {asset.name}
  </label>
</div>
```

#### 3. 에셋 타입 Badge
```tsx
<Badge variant={asset.type === 'image' ? 'default' : 'secondary'}>
  {asset.type}
</Badge>
```

#### 4. 일괄 작업 Button 그룹
```tsx
<div className="flex gap-2">
  <Button variant="outline" size="sm">
    다운로드
  </Button>
  <Button variant="destructive" size="sm">
    삭제
  </Button>
</div>
```

### 확인사항
- [ ] 에셋 추출 기능 작동
- [ ] Checkbox 다중 선택 작동
- [ ] 다운로드/삭제 버튼 작동
- [ ] 다크모드 색상 정상

---

## 공통 변경 패턴

### 1. ScrollArea 적용 (긴 목록)
```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="h-[400px]">
  {/* 긴 목록 내용 */}
</ScrollArea>
```

### 2. Accordion 적용 (펼치기/접기)
```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

<Accordion type="multiple">
  <AccordionItem value="item-1">
    <AccordionTrigger>제목</AccordionTrigger>
    <AccordionContent>내용</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 3. Separator 적용 (구분선)
```tsx
import { Separator } from "@/components/ui/separator"

<Separator />
```

### 4. Badge variant 활용
```tsx
<Badge variant="default">       // primary color
<Badge variant="secondary">     // muted color
<Badge variant="destructive">   // error color
<Badge variant="outline">       // outlined
```

---

## Completion Criteria

- [ ] FontAnalyzer: shadcn Accordion, ScrollArea, Badge 적용 완료
- [ ] Palette: shadcn ScrollArea, Badge 적용 완료
- [ ] Console: shadcn ScrollArea, Badge, Separator 적용 완료
- [ ] AssetManager: shadcn Checkbox, Badge 적용 완료
- [ ] 모든 패널 다크모드 대응 완료
- [ ] 빌드 성공

---

## Next Phase

[Phase 4: 탭 기반 복합 도구](./05-phase-4-tabbed-panels.md)
